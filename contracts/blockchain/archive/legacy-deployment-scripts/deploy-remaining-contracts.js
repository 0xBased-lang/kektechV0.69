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
    CONFIRMATIONS: 2
};

// Colors
const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    green: "\x1b[32m",
    cyan: "\x1b[36m",
    magenta: "\x1b[35m"
};

async function main() {
    console.log(`\n${colors.bright}${colors.magenta}╔═══════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.bright}${colors.magenta}║  DEPLOYING REMAINING 5 CONTRACTS (Steps 5-9) ║${colors.reset}`);
    console.log(`${colors.bright}${colors.magenta}╚═══════════════════════════════════════════════╝${colors.reset}\n`);

    const [deployer] = await ethers.getSigners();
    const balance = await ethers.provider.getBalance(deployer.address);

    console.log(`${colors.cyan}Already Deployed (4/9):${colors.reset}`);
    console.log(`   ✅ VersionedRegistry`);
    console.log(`   ✅ ParameterStorage`);
    console.log(`   ✅ AccessControlManager`);
    console.log(`   ✅ ResolutionManager\n`);

    console.log(`${colors.cyan}Deployer Balance:${colors.reset}`, ethers.formatEther(balance), "ETH\n");

    // Get registry instance
    const registry = await ethers.getContractAt("VersionedRegistry", deploymentState.contracts.VersionedRegistry);

    // Gas options - 5M limit to avoid issues
    const gasOptions = {
        gasLimit: 5000000
    };

    try {
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

        // Register (no gas options needed - ethers will estimate)
        const tx2 = await registry.setContract(ethers.id("RewardDistributor"), rdAddress);
        await tx2.wait(CONFIG.CONFIRMATIONS);
        console.log(`${colors.green}   ✅ Registered in VersionedRegistry${colors.reset}\n`);

        // Save progress
        fs.writeFileSync(STATE_FILE, JSON.stringify(deploymentState, null, 2));

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

        // Register (no gas options needed)
        const tx3 = await registry.setContract(ethers.id("MarketFactory"), factoryAddress);
        await tx3.wait(CONFIG.CONFIRMATIONS);
        console.log(`${colors.green}   ✅ Registered in VersionedRegistry${colors.reset}\n`);

        // Save progress
        fs.writeFileSync(STATE_FILE, JSON.stringify(deploymentState, null, 2));

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

        // Register (no gas options needed)
        const tx4 = await registry.setContract(ethers.id("PredictionMarket"), templateAddress);
        await tx4.wait(CONFIG.CONFIRMATIONS);
        console.log(`${colors.green}   ✅ Registered in VersionedRegistry${colors.reset}\n`);

        // Save progress
        fs.writeFileSync(STATE_FILE, JSON.stringify(deploymentState, null, 2));

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

        // Register (no gas options needed)
        const tx5 = await registry.setContract(ethers.id("CurveRegistry"), crAddress);
        await tx5.wait(CONFIG.CONFIRMATIONS);
        console.log(`${colors.green}   ✅ Registered in VersionedRegistry${colors.reset}\n`);

        // Save progress
        fs.writeFileSync(STATE_FILE, JSON.stringify(deploymentState, null, 2));

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

        // Register (no gas options needed)
        const tx6 = await registry.setContract(ethers.id("MarketTemplateRegistry"), mtrAddress);
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
        console.log(`${colors.cyan}Deployment file: sepolia-deployment-unified.json${colors.reset}\n`);

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
