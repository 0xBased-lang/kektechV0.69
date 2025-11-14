/*
 Fork E2E for Parimutuel integration on BasedAI mainnet state.
 Requires: export BASEDAI_MAINNET_RPC=... (RPC URL)
 Run: npx hardhat run scripts/fork-parimutuel-e2e.js
*/
const { ethers, network } = require("hardhat");

const ADDR = {
  MasterRegistry: "0x412ab6fbdd342AAbE6145f3e36930E42a2089964",
  ParameterStorage: "0x827A80DeD074671D96bc6bAa4260CA1c76Bf24e9",
  AccessControlManager: "0x6E315ce994f668C8b94Ee67FC92C4139719a1F78",
  FlexibleMarketFactory: "0x6890a655e8C6FDCa56bC9e471545FE4c574E0c0D",
  ResolutionManager: "0x6075c7BEe90B1146dFC2F92ddaCefa4fe9A46A84",
  RewardDistributor: "0xf1937b66DA7403bEdb59E0cE53C96B674DCd6bDd",
};

async function impersonate(address) {
  await network.provider.request({ method: "hardhat_impersonateAccount", params: [address] });
  return await ethers.getSigner(address);
}

async function main() {
  if (!process.env.BASEDAI_MAINNET_RPC) throw new Error("BASEDAI_MAINNET_RPC not set");
  await network.provider.request({
    method: "hardhat_reset",
    params: [{ forking: { jsonRpcUrl: process.env.BASEDAI_MAINNET_RPC } }],
  });

  const registry = await ethers.getContractAt("MasterRegistry", ADDR.MasterRegistry);
  const acm = await ethers.getContractAt("AccessControlManager", ADDR.AccessControlManager);
  const factory = await ethers.getContractAt("FlexibleMarketFactory", ADDR.FlexibleMarketFactory);
  const rm = await ethers.getContractAt("ResolutionManager", ADDR.ResolutionManager);

  // Find registry owner via ABI
  const ownerAddr = await registry.owner();
  const ownerSigner = await impersonate(ownerAddr);
  console.log("OK fork: registry owner", ownerAddr);

  // Ensure TREASURY set (use owner as treasury for test)
  await registry.connect(ownerSigner).setContract(ethers.keccak256(ethers.toUtf8Bytes("TREASURY")), ownerAddr);
  console.log("OK fork: TREASURY wired");

  // Deploy template registry + parimutuel template
  const MTR = await ethers.getContractFactory("MarketTemplateRegistry");
  const mtr = await MTR.deploy(ADDR.MasterRegistry);
  await registry.connect(ownerSigner).setContract(ethers.keccak256(ethers.toUtf8Bytes("MarketTemplateRegistry")), mtr.target);
  const ParimutuelMarket = await ethers.getContractFactory("ParimutuelMarket");
  const impl = await ParimutuelMarket.deploy();

  // Grant ADMIN_ROLE to test signer for template registration
  const DEFAULT_ADMIN_ROLE = "0x" + "00".padEnd(64, "0");
  const adminCount = Number(await acm.getRoleMemberCount(DEFAULT_ADMIN_ROLE).catch(() => 0));
  let adminSigner;
  if (adminCount > 0) {
    const firstAdmin = await acm.getRoleMember(DEFAULT_ADMIN_ROLE, 0);
    adminSigner = await impersonate(firstAdmin);
  } else {
    adminSigner = ownerSigner;
  }
  const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
  // Ensure adminSigner has ADMIN_ROLE; if not, try granting via DEFAULT_ADMIN_ROLE
  const hasAdmin = await acm.hasRole(ADMIN_ROLE, adminSigner.address);
  if (!hasAdmin) {
    await acm.connect(ownerSigner).grantRole(ADMIN_ROLE, adminSigner.address).catch(() => {});
  }

  const templateId = ethers.keccak256(ethers.toUtf8Bytes("PARIMUTUEL"));
  await mtr.connect(adminSigner).registerTemplate(templateId, impl.target);
  console.log("OK fork: template registered");

  // Ensure RM has RESOLVER_ROLE
  const RESOLVER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("RESOLVER_ROLE"));
  const hasResolver = await acm.hasRole(RESOLVER_ROLE, ADDR.ResolutionManager);
  if (!hasResolver) await acm.connect(adminSigner).grantRole(RESOLVER_ROLE, ADDR.ResolutionManager).catch(() => {});
  console.log("OK fork: resolver role set");

  // Create market via existing factory
  const now = (await ethers.provider.getBlock("latest")).timestamp;
  const deadline = BigInt(now + 3600);
  const feeBps = 300;
  const minBond = await factory.minCreatorBond().catch(() => ethers.parseEther("0.1"));
  const createTx = await factory.createMarketFromTemplateRegistry(
    templateId,
    "Fork E2E?",
    "YES",
    "NO",
    deadline,
    feeBps,
    { value: minBond }
  );
  const rc = await createTx.wait();
  const evt = rc.logs.find(l => l.fragment && l.fragment.name === 'MarketCreated');
  const marketAddr = evt.args[0];
  console.log("OK fork: market clone", marketAddr);

  // Place two bets under whale cap
  const [ , , , user1, user2 ] = await ethers.getSigners();
  const market = await ethers.getContractAt("ParimutuelMarket", marketAddr);
  await market.connect(user1).placeBet(1, "0x", 0, 0, { value: ethers.parseEther("0.05") });
  await market.connect(user2).placeBet(2, "0x", 0, 0, { value: ethers.parseEther("0.01") });
  console.log("OK fork: bets placed");

  // Resolve via RM with evidence
  await ethers.provider.send("evm_setNextBlockTimestamp", [Number(deadline) + 1]);
  await ethers.provider.send("evm_mine", []);
  await rm.resolveMarket(marketAddr, 1, "oracle: ok");
  const result = await market.result();
  console.log("OK fork: resolved result", Number(result));

  const acc = await market.accumulatedFees();
  console.log("OK fork: accumulatedFees", acc.toString());
  console.log("OK fork: done");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });


