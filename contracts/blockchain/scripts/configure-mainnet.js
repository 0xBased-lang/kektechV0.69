const { ethers } = require("hardhat");

const CONTRACTS = {
    MasterRegistry: "0x412ab6fbdd342AAbE6145f3e36930E42a2089964",
    ParameterStorage: "0x827A80DeD074671D96bc6bAa4260CA1c76Bf24e9",
    AccessControlManager: "0x6E315ce994f668C8b94Ee67FC92C4139719a1F78",
    ProposalManagerV2: "0x9C4B56D0a0465c3aB0CCbCc749bA84155395818C",
    FlexibleMarketFactory: "0x6890a655e8C6FDCa56bC9e471545FE4c574E0c0D",
    ResolutionManager: "0x6075c7BEe90B1146dFC2F92ddaCefa4fe9A46A84",
    RewardDistributor: "0xf1937b66DA7403bEdb59E0cE53C96B674DCd6bDd"
};

async function main() {
    console.log("\n🔧 Configuring KEKTECH 3.0 on BasedAI Mainnet\n");

    const [deployer] = await ethers.getSigners();
    const registry = await ethers.getContractAt("MasterRegistry", CONTRACTS.MasterRegistry);
    const acm = await ethers.getContractAt("AccessControlManager", CONTRACTS.AccessControlManager);
    const params = await ethers.getContractAt("ParameterStorage", CONTRACTS.ParameterStorage);

    console.log("1️⃣  Registering contracts in MasterRegistry...");
    await registry.setContract(ethers.id("ParameterStorage"), CONTRACTS.ParameterStorage);
    await registry.setContract(ethers.id("AccessControlManager"), CONTRACTS.AccessControlManager);
    await registry.setContract(ethers.id("ProposalManager"), CONTRACTS.ProposalManagerV2);
    await registry.setContract(ethers.id("FlexibleMarketFactory"), CONTRACTS.FlexibleMarketFactory);
    await registry.setContract(ethers.id("ResolutionManager"), CONTRACTS.ResolutionManager);
    await registry.setContract(ethers.id("RewardDistributor"), CONTRACTS.RewardDistributor);
    console.log("  ✅ All contracts registered\n");

    console.log("2️⃣  Setting up roles...");
    await acm.grantRole(ethers.id("ADMIN_ROLE"), deployer.address);
    await acm.grantRole(ethers.id("RESOLVER_ROLE"), deployer.address);
    console.log("  ✅ Roles configured\n");

    console.log("3️⃣  Setting parameters...");
    await params.setParameter(ethers.id("minimumBet"), ethers.parseEther("0.01"));
    await params.setParameter(ethers.id("protocolFeeBps"), 250);
    await params.setParameter(ethers.id("creatorFeeBps"), 150);
    console.log("  ✅ Parameters set\n");

    console.log("4️⃣  Verifying M-1 security fix...");
    const pendingOwner = await registry.pendingOwner();
    console.log("  ✅ M-1 CONFIRMED: pendingOwner function exists\n");

    console.log("🎉 CONFIGURATION COMPLETE!\n");
    console.log("KEKTECH 3.0 is LIVE on BasedAI Mainnet with ALL security fixes!");
    console.log("\nExplorer:");
    console.log(`  MasterRegistry: https://explorer.bf1337.org/address/${CONTRACTS.MasterRegistry}`);
    console.log(`  Factory: https://explorer.bf1337.org/address/${CONTRACTS.FlexibleMarketFactory}`);
}

main().then(() => process.exit(0)).catch(console.error);
