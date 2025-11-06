const { ethers } = require("hardhat");
const fs = require("fs");

const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    cyan: "\x1b[36m"
};

// ALREADY DEPLOYED
const DEPLOYED = {
    MasterRegistry: "0x412ab6fbdd342AAbE6145f3e36930E42a2089964",
    ParameterStorage: "0x827A80DeD074671D96bc6bAa4260CA1c76Bf24e9",
    AccessControlManager: "0x6E315ce994f668C8b94Ee67FC92C4139719a1F78",
    ProposalManagerV2: "0x9C4B56D0a0465c3aB0CCbCc749bA84155395818C"
};

const CONFIG = {
    treasury: process.env.TEAM_WALLET,
    incentives: process.env.INCENTIVES_WALLET,
    minCreatorBond: ethers.parseEther("0.1"),
    minimumBet: ethers.parseEther("0.01"),
    minDisputeBond: ethers.parseEther("0.1"),
    disputeWindow: 86400,
    protocolFeeBps: 250,
    creatorFeeBps: 150
};

async function main() {
    console.log("\n🎯 Finishing KEKTECH 3.0 Deployment (Final 3 Contracts)\n");

    const [deployer] = await ethers.getSigners();
    const feeData = await ethers.provider.getFeeData();
    const gasPrice = feeData.gasPrice || feeData.maxFeePerGas;

    const contracts = { ...DEPLOYED };

    // 5. Deploy FlexibleMarketFactory (HIGHER GAS)
    console.log("📦 Deploying FlexibleMarketFactory...");
    const Factory = await ethers.getContractFactory("FlexibleMarketFactory");
    const factory = await Factory.deploy(
        DEPLOYED.MasterRegistry,
        CONFIG.minCreatorBond,
        { gasPrice, gasLimit: 5000000 } // INCREASED
    );
    await factory.waitForDeployment();
    contracts.FlexibleMarketFactory = await factory.getAddress();
    console.log(`${colors.green}✓ FlexibleMarketFactory:${colors.reset} ${contracts.FlexibleMarketFactory}`);

    // 6. Deploy ResolutionManager
    console.log("\n📦 Deploying ResolutionManager...");
    const Resolution = await ethers.getContractFactory("ResolutionManager");
    const resolution = await Resolution.deploy(
        DEPLOYED.MasterRegistry,
        CONFIG.disputeWindow,
        CONFIG.minDisputeBond,
        { gasPrice, gasLimit: 4000000 } // INCREASED
    );
    await resolution.waitForDeployment();
    contracts.ResolutionManager = await resolution.getAddress();
    console.log(`${colors.green}✓ ResolutionManager:${colors.reset} ${contracts.ResolutionManager}`);

    // 7. Deploy RewardDistributor
    console.log("\n📦 Deploying RewardDistributor...");
    const Rewards = await ethers.getContractFactory("RewardDistributor");
    const rewards = await Rewards.deploy(
        DEPLOYED.MasterRegistry,
        { gasPrice, gasLimit: 3000000 }
    );
    await rewards.waitForDeployment();
    contracts.RewardDistributor = await rewards.getAddress();
    console.log(`${colors.green}✓ RewardDistributor:${colors.reset} ${contracts.RewardDistributor}`);

    // Save deployment
    const deploymentInfo = {
        network: "basedai_mainnet",
        chainId: 32323,
        timestamp: new Date().toISOString(),
        deployer: deployer.address,
        securityFixes: ["M-1", "M-2", "M-3", "M-4", "H-2", "L-1", "L-3"],
        contracts
    };

    const filename = `basedai-mainnet-final-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));

    console.log(`\n${colors.green}═══════════════════════════════════════════════════`);
    console.log(`${colors.green}    🎉 ALL CONTRACTS DEPLOYED!`);
    console.log(`${colors.green}═══════════════════════════════════════════════════${colors.reset}\n`);

    console.log("📋 All Contract Addresses:");
    Object.entries(contracts).forEach(([name, addr]) => {
        console.log(`  ${name}: ${addr}`);
    });

    console.log(`\n💾 Saved to: ${filename}`);
    console.log("\n🔗 Next: Register contracts in MasterRegistry & configure");
}

main().then(() => process.exit(0)).catch(console.error);
