const hre = require("hardhat");
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Load partial deployment state
const STATE_FILE = path.join(__dirname, "../../sepolia-deployment-unified.json");
let deploymentState = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));

// Configuration
const CONFIG = {
    MIN_CREATOR_BOND: ethers.parseEther("0.1"),
    DISPUTE_WINDOW: 86400,
    MIN_DISPUTE_BOND: ethers.parseEther("0.01"),
    CONFIRMATIONS: 2
};

// Colors
const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    cyan: "\x1b[36m",
    magenta: "\x1b[35m"
};

async function main() {
    console.log(`\n${colors.bright}${colors.magenta}╔═══════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.bright}${colors.magenta}║  CONTINUING SEPOLIA DEPLOYMENT (Steps 4-9)  ║${colors.reset}`);
    console.log(`${colors.bright}${colors.magenta}╚═══════════════════════════════════════════════╝${colors.reset}\n`);

    const [deployer] = await ethers.getSigners();
    const balance = await ethers.provider.getBalance(deployer.address);

    console.log(`${colors.cyan}Already Deployed:${colors.reset}`);
    console.log(`   VersionedRegistry:      ${deploymentState.contracts.VersionedRegistry}`);
    console.log(`   ParameterStorage:       ${deploymentState.contracts.ParameterStorage}`);
    console.log(`   AccessControlManager:   ${deploymentState.contracts.AccessControlManager}\n`);

    console.log(`${colors.cyan}Deployer Balance:${colors.reset}`, ethers.formatEther(balance), "ETH\n");

    // Get contract instances
    const registry = await ethers.getContractAt("VersionedRegistry", deploymentState.contracts.VersionedRegistry);
    const parameterStorage = await ethers.getContractAt("ParameterStorage", deploymentState.contracts.ParameterStorage);
    const acm = await ethers.getContractAt("AccessControlManager", deploymentState.contracts.AccessControlManager);

    // Higher gas price to avoid underpriced errors
    const feeData = await ethers.provider.getFeeData();
    const gasPrice = feeData.gasPrice * 150n / 100n;

    // Gas options for all transactions
    const gasOptions = {
        gasLimit: 5000000, // 5M gas limit (generous for Sepolia)
        gasPrice: gasPrice
    };

    try {
        // ═══════════════════════════════════════════════════════════
        // STEP 4: ResolutionManager
        // ═══════════════════════════════════════════════════════════
        console.log(`${colors.bright}${colors.cyan}📦 Step 4/9: ResolutionManager${colors.reset}`);
        const ResolutionManager = await ethers.getContractFactory("ResolutionManager");
        const resolutionManager = await ResolutionManager.deploy(
            deploymentState.contracts.VersionedRegistry,
            CONFIG.DISPUTE_WINDOW,
            CONFIG.MIN_DISPUTE_BOND,
            gasOptions
        );
        await resolutionManager.waitForDeployment();
        const rmAddress = await resolutionManager.getAddress();
        console.log(`${colors.green}   ✅ Deployed: ${rmAddress}${colors.reset}\n`);
        deploymentState.contracts.ResolutionManager = rmAddress;

        // Register
        const tx1 = await registry.setContract(ethers.id("ResolutionManager"), rmAddress, gasOptions);
        await tx1.wait(CONFIG.CONFIRMATIONS);
        console.log(`${colors.green}   ✅ Registered in VersionedRegistry${colors.reset}\n`);

        // ═══════════════════════════════════════════════════════════
        // STEP 5: RewardDistributor
        // ═══════════════════════════════════════════════════════════
        console.log(`${colors.bright}${colors.cyan}📦 Step 5/9: RewardDistributor${colors.reset}`);
        const RewardDistributor = await ethers.getContractFactory("RewardDistributor");
        const rewardDistributor = await RewardDistributor.deploy(
            deploymentState.contracts.VersionedRegistry,
            gasOptions
        );
        await rewardDistributor.waitForDeployment();
        const rdAddress = await rewardDistributor.getAddress();
        console.log(`${colors.green}   ✅ Deployed: ${rdAddress}${colors.reset}\n`);
        deploymentState.contracts.RewardDistributor = rdAddress;

        // Register
        const tx2 = await registry.setContract(ethers.id("RewardDistributor"), rdAddress, gasOptions);
        await tx2.wait(CONFIG.CONFIRMATIONS);
        console.log(`${colors.green}   ✅ Registered in VersionedRegistry${colors.reset}\n`);

        // ═══════════════════════════════════════════════════════════
        // STEP 6: FlexibleMarketFactoryUnified
        // ═══════════════════════════════════════════════════════════
        console.log(`${colors.bright}${colors.cyan}📦 Step 6/9: FlexibleMarketFactoryUnified${colors.reset}`);
        const Factory = await ethers.getContractFactory("FlexibleMarketFactoryUnified");
        const factory = await Factory.deploy(
            deploymentState.contracts.VersionedRegistry,
            CONFIG.MIN_CREATOR_BOND,
            gasOptions
        );
        await factory.waitForDeployment();
        const factoryAddress = await factory.getAddress();
        console.log(`${colors.green}   ✅ Deployed: ${factoryAddress}${colors.reset}\n`);
        deploymentState.contracts.FlexibleMarketFactoryUnified = factoryAddress;

        // Register
        const tx3 = await registry.setContract(ethers.id("MarketFactory"), factoryAddress, gasOptions);
        await tx3.wait(CONFIG.CONFIRMATIONS);
        console.log(`${colors.green}   ✅ Registered in VersionedRegistry${colors.reset}\n`);

        // ═══════════════════════════════════════════════════════════
        // STEP 7: PredictionMarket Template
        // ═══════════════════════════════════════════════════════════
        console.log(`${colors.bright}${colors.cyan}📦 Step 7/9: PredictionMarket Template${colors.reset}`);
        const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
        const template = await PredictionMarket.deploy(gasOptions);
        await template.waitForDeployment();
        const templateAddress = await template.getAddress();
        console.log(`${colors.green}   ✅ Deployed: ${templateAddress}${colors.reset}\n`);
        deploymentState.contracts.PredictionMarketTemplate = templateAddress;

        // Register
        const tx4 = await registry.setContract(ethers.id("PredictionMarket"), templateAddress, gasOptions);
        await tx4.wait(CONFIG.CONFIRMATIONS);
        console.log(`${colors.green}   ✅ Registered in VersionedRegistry${colors.reset}\n`);

        // ═══════════════════════════════════════════════════════════
        // STEP 8: CurveRegistry
        // ═══════════════════════════════════════════════════════════
        console.log(`${colors.bright}${colors.cyan}📦 Step 8/9: CurveRegistry${colors.reset}`);
        const CurveRegistry = await ethers.getContractFactory("CurveRegistry");
        const curveRegistry = await CurveRegistry.deploy(
            deploymentState.contracts.VersionedRegistry,
            gasOptions
        );
        await curveRegistry.waitForDeployment();
        const crAddress = await curveRegistry.getAddress();
        console.log(`${colors.green}   ✅ Deployed: ${crAddress}${colors.reset}\n`);
        deploymentState.contracts.CurveRegistry = crAddress;

        // Register
        const tx5 = await registry.setContract(ethers.id("CurveRegistry"), crAddress, gasOptions);
        await tx5.wait(CONFIG.CONFIRMATIONS);
        console.log(`${colors.green}   ✅ Registered in VersionedRegistry${colors.reset}\n`);

        // ═══════════════════════════════════════════════════════════
        // STEP 9: MarketTemplateRegistry
        // ═══════════════════════════════════════════════════════════
        console.log(`${colors.bright}${colors.cyan}📦 Step 9/9: MarketTemplateRegistry${colors.reset}`);
        const MarketTemplateRegistry = await ethers.getContractFactory("MarketTemplateRegistry");
        const marketTemplateRegistry = await MarketTemplateRegistry.deploy(
            deploymentState.contracts.VersionedRegistry,
            gasOptions
        );
        await marketTemplateRegistry.waitForDeployment();
        const mtrAddress = await marketTemplateRegistry.getAddress();
        console.log(`${colors.green}   ✅ Deployed: ${mtrAddress}${colors.reset}\n`);
        deploymentState.contracts.MarketTemplateRegistry = mtrAddress;

        // Register
        const tx6 = await registry.setContract(ethers.id("MarketTemplateRegistry"), mtrAddress, gasOptions);
        await tx6.wait(CONFIG.CONFIRMATIONS);
        console.log(`${colors.green}   ✅ Registered in VersionedRegistry${colors.reset}\n`);

        // ═══════════════════════════════════════════════════════════
        // SAVE COMPLETE STATE
        // ═══════════════════════════════════════════════════════════
        deploymentState.timestamp = new Date().toISOString();
        deploymentState.status = "COMPLETE";
        delete deploymentState.error;

        fs.writeFileSync(STATE_FILE, JSON.stringify(deploymentState, null, 2));

        console.log(`${colors.green}${colors.bright}╔═══════════════════════════════════════════════╗${colors.reset}`);
        console.log(`${colors.green}${colors.bright}║      ✅ DEPLOYMENT COMPLETE! ✅               ║${colors.reset}`);
        console.log(`${colors.green}${colors.bright}╚═══════════════════════════════════════════════╝${colors.reset}\n`);

        console.log(`${colors.cyan}All 9 contracts deployed to Sepolia!${colors.reset}\n`);

    } catch (error) {
        deploymentState.error = {
            message: error.message,
            stack: error.stack
        };
        fs.writeFileSync(STATE_FILE, JSON.stringify(deploymentState, null, 2));
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
