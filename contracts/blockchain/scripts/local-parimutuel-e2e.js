/*
 Local E2E wiring for Parimutuel stack
 Usage: npx hardhat run scripts/local-parimutuel-e2e.js
*/
const { ethers } = require("hardhat");

async function main() {
  const [deployer, admin, resolver, user1, user2] = await ethers.getSigners();

  // Deploy MasterRegistry
  const MasterRegistry = await ethers.getContractFactory("MasterRegistry");
  const registry = await MasterRegistry.deploy();
  console.log("OK registry:", registry.target);

  // AccessControlManager
  const AccessControlManager = await ethers.getContractFactory("AccessControlManager");
  const acm = await AccessControlManager.deploy(registry.target);
  await registry.setContract(ethers.keccak256(ethers.toUtf8Bytes("AccessControlManager")), acm.target);
  const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
  const RESOLVER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("RESOLVER_ROLE"));
  await acm.grantRole(ADMIN_ROLE, admin.address);
  await acm.grantRole(RESOLVER_ROLE, resolver.address);
  console.log("OK access-control + roles");

  // ParameterStorage
  const ParameterStorage = await ethers.getContractFactory("ParameterStorage");
  const params = await ParameterStorage.deploy(registry.target);
  await registry.setContract(ethers.keccak256(ethers.toUtf8Bytes("ParameterStorage")), params.target);
  // RewardDistributor
  const RewardDistributor = await ethers.getContractFactory("RewardDistributor");
  const rd = await RewardDistributor.deploy(registry.target);
  await registry.setContract(ethers.keccak256(ethers.toUtf8Bytes("RewardDistributor")), rd.target);
  // Treasury
  await registry.setContract(ethers.keccak256(ethers.toUtf8Bytes("TREASURY")), admin.address);
  console.log("OK params + RD + treasury wiring");

  // Template registry
  const MarketTemplateRegistry = await ethers.getContractFactory("MarketTemplateRegistry");
  const mtr = await MarketTemplateRegistry.deploy(registry.target);
  await registry.setContract(ethers.keccak256(ethers.toUtf8Bytes("MarketTemplateRegistry")), mtr.target);

  // Parimutuel impl and registration
  const ParimutuelMarket = await ethers.getContractFactory("ParimutuelMarket");
  const impl = await ParimutuelMarket.deploy();
  const templateId = ethers.keccak256(ethers.toUtf8Bytes("PARIMUTUEL"));
  await mtr.connect(admin).registerTemplate(templateId, impl.target);
  console.log("OK template registry + parimutuel template");

  // Factory
  const minBond = ethers.parseEther("0.1");
  const Factory = await ethers.getContractFactory("FlexibleMarketFactory");
  const factory = await Factory.deploy(registry.target, minBond);

  // ResolutionManager
  const disputeWindow = 86400;
  const minDisputeBond = ethers.parseEther("0.01");
  const ResolutionManager = await ethers.getContractFactory("ResolutionManager");
  const rm = await ResolutionManager.deploy(registry.target, disputeWindow, minDisputeBond);
  await registry.setContract(ethers.keccak256(ethers.toUtf8Bytes("ResolutionManager")), rm.target);
  await acm.grantRole(RESOLVER_ROLE, rm.target);
  console.log("OK factory + resolution manager");

  // Create market via template clone
  const now = (await ethers.provider.getBlock("latest")).timestamp;
  const deadline = BigInt(now + 3600);
  const feeBps = 300;
  const createTx = await factory.connect(deployer).createMarketFromTemplateRegistry(
    templateId,
    "Local E2E?",
    "YES",
    "NO",
    deadline,
    feeBps,
    { value: minBond }
  );
  const rc = await createTx.wait();
  const evt = rc.logs.find(l => l.fragment && l.fragment.name === 'MarketCreated');
  const marketAddr = evt.args[0];
  console.log("OK market clone:", marketAddr);

  // Bets under whale cap
  const market = await ethers.getContractAt("ParimutuelMarket", marketAddr);
  await market.connect(user1).placeBet(1, "0x", 0, 0, { value: ethers.parseEther("0.05") });
  await market.connect(user2).placeBet(2, "0x", 0, 0, { value: ethers.parseEther("0.01") });
  console.log("OK bets placed");

  // Advance and resolve via ResolutionManager with evidence
  await ethers.provider.send("evm_setNextBlockTimestamp", [Number(deadline) + 1]);
  await ethers.provider.send("evm_mine", []);
  await rm.connect(resolver).resolveMarket(marketAddr, 1, "evidence: local");
  const result = await market.result();
  console.log("OK resolved, result:", Number(result));

  // Fee path check (accumulatedFees == 0) and claim
  const acc = await market.accumulatedFees();
  if (acc !== 0n) throw new Error("fee accumulation detected");
  console.log("OK fees collected to RD");

  await market.connect(user1).claimWinnings();
  console.log("OK claim user1");

  const bal = await ethers.provider.getBalance(marketAddr);
  console.log("OK market balance:", bal.toString());
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });


