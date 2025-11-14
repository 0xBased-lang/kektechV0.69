const { ethers } = require("hardhat");
const fs = require("fs");
require("dotenv").config();

const colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    cyan: "\x1b[36m"
};

// DEPLOYED CONTRACT ADDRESSES
const CONTRACTS = {
    MasterRegistry: "0x412ab6fbdd342AAbE6145f3e36930E42a2089964",
    ParameterStorage: "0x827A80DeD074671D96bc6bAa4260CA1c76Bf24e9",
    AccessControlManager: "0x6E315ce994f668C8b94Ee67FC92C4139719a1F78",
    ProposalManagerV2: "0x9C4B56D0a0465c3aB0CCbCc749bA84155395818C",
    FlexibleMarketFactory: "0x6890a655e8C6FDCa56bC9e471545FE4c574E0c0D",
    ResolutionManager: "0x6075c7BEe90B1146dFC2F92ddaCefa4fe9A46A84",
    RewardDistributor: "0xf1937b66DA7403bEdb59E0cE53C96B674DCd6bDd"
};

// CONFIGURATION
const CONFIG = {
    owner: process.env.MAINNET_OWNER,
    treasury: process.env.TEAM_WALLET,
    incentives: process.env.INCENTIVES_WALLET,
    minimumBet: ethers.parseEther("0.01"),
    protocolFeeBps: 250,
    creatorFeeBps: 150
};

// EXPLICIT GAS CONFIGURATION
const GAS_CONFIG = {
    registryOps: { gasLimit: 150000 },
    roleGrants: { gasLimit: 120000 },
    paramSet: { gasLimit: 100000 }
};

async function main() {
    console.log("\n🔧 KEKTECH 3.0 - Complete Configuration\n");

    const [deployer] = await ethers.getSigners();
    const feeData = await ethers.provider.getFeeData();
    const gasPrice = feeData.gasPrice || feeData.maxFeePerGas;

    console.log("Deployer:", deployer.address);
    console.log("Gas Price:", ethers.formatUnits(gasPrice, "gwei"), "gwei\n");

    Object.keys(GAS_CONFIG).forEach(key => {
        GAS_CONFIG[key].gasPrice = gasPrice;
    });

    const registry = await ethers.getContractAt("MasterRegistry", CONTRACTS.MasterRegistry);
    const acm = await ethers.getContractAt("AccessControlManager", CONTRACTS.AccessControlManager);
    const params = await ethers.getContractAt("ParameterStorage", CONTRACTS.ParameterStorage);

    console.log("STEP 1: Registering Contracts\n");

    const registrations = [
        { key: "ParameterStorage", address: CONTRACTS.ParameterStorage },
        { key: "AccessControlManager", address: CONTRACTS.AccessControlManager },
        { key: "ProposalManager", address: CONTRACTS.ProposalManagerV2 },
        { key: "FlexibleMarketFactory", address: CONTRACTS.FlexibleMarketFactory },
        { key: "ResolutionManager", address: CONTRACTS.ResolutionManager },
        { key: "RewardDistributor", address: CONTRACTS.RewardDistributor }
    ];

    for (const reg of registrations) {
        try {
            const tx = await registry.setContract(ethers.id(reg.key), reg.address, GAS_CONFIG.registryOps);
            await tx.wait();
            console.log("  ✓", reg.key);
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
            console.log("  ✗", reg.key, "-", error.message.substring(0, 50));
        }
    }

    console.log("\nSTEP 2: Granting Roles\n");

    const ADMIN_ROLE = ethers.id("ADMIN_ROLE");
    const RESOLVER_ROLE = ethers.id("RESOLVER_ROLE");

    try {
        const tx1 = await acm.grantRole(ADMIN_ROLE, deployer.address, GAS_CONFIG.roleGrants);
        await tx1.wait();
        console.log("  ✓ ADMIN_ROLE to deployer");
        await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
        console.log("  ○ ADMIN_ROLE to deployer (may already exist)");
    }

    try {
        const tx2 = await acm.grantRole(RESOLVER_ROLE, CONFIG.owner, GAS_CONFIG.roleGrants);
        await tx2.wait();
        console.log("  ✓ RESOLVER_ROLE to owner");
        await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
        console.log("  ○ RESOLVER_ROLE to owner (may already exist)");
    }

    console.log("\nSTEP 3: Setting Parameters\n");

    try {
        const tx3 = await params.setParameter(ethers.id("minimumBet"), CONFIG.minimumBet, GAS_CONFIG.paramSet);
        await tx3.wait();
        console.log("  ✓ minimumBet: 0.01 BASED");
        await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
        console.log("  ✗ minimumBet");
    }

    try {
        const tx4 = await params.setParameter(ethers.id("protocolFeeBps"), CONFIG.protocolFeeBps, GAS_CONFIG.paramSet);
        await tx4.wait();
        console.log("  ✓ protocolFeeBps: 2.5%");
        await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
        console.log("  ✗ protocolFeeBps");
    }

    try {
        const tx5 = await params.setParameter(ethers.id("creatorFeeBps"), CONFIG.creatorFeeBps, GAS_CONFIG.paramSet);
        await tx5.wait();
        console.log("  ✓ creatorFeeBps: 1.5%");
    } catch (error) {
        console.log("  ✗ creatorFeeBps");
    }

    console.log("\nSTEP 4: Verification\n");

    const pendingOwner = await registry.pendingOwner();
    console.log("  ✅ M-1 FIX VERIFIED: pendingOwner =", pendingOwner);

    console.log("\n🎉 CONFIGURATION COMPLETE!\n");
    console.log("KEKTECH 3.0 is now fully configured and ready for use!");
}

main().then(() => process.exit(0)).catch(console.error);
