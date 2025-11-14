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
    console.log(`${colors.bright}${colors.magenta}║  DEPLOYING FINAL 4 CONTRACTS (Steps 6-9)     ║${colors.reset}`);
    console.log(`${colors.bright}${colors.magenta}╚═══════════════════════════════════════════════╝${colors.reset}\n`);

    const [deployer] = await ethers.getSigners();
    const balance = await ethers.provider.getBalance(deployer.address);

    console.log(`${colors.cyan}Already Deployed (5/9):${colors.reset}`);
    console.log(`   ✅ VersionedRegistry`);
    console.log(`   ✅ ParameterStorage`);
    console.log(`   ✅ AccessControlManager`);
    console.log(`   ✅ ResolutionManager`);
    console.log(`   ✅ RewardDistributor\n`);

    console.log(`${colors.cyan}Deployer Balance:${colors.reset}`, ethers.formatEther(balance), "ETH\n");

    // Get registry instance
    const registry = await ethers.getContractAt("VersionedRegistry", deploymentState.contracts.VersionedRegistry);

    // Gas options for deployment only (5M limit)
    const gasOptions = {
        gasLimit: 5000000
    };

    try {
        // Note: RewardDistributor should be registered manually if needed
        // Skip automatic registration to avoid function signature issues

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

        // Save progress (skip registration for now)
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

        // ═══════════════════════════════════════════════════════════
        // SAVE COMPLETE STATE
        // ═══════════════════════════════════════════════════════════
        deploymentState.timestamp = new Date().toISOString();
        deploymentState.status = "DEPLOYED_CONTRACTS";
        deploymentState.note = "Contracts deployed. Registry configuration needs to be completed manually.";
        delete deploymentState.error;

        fs.writeFileSync(STATE_FILE, JSON.stringify(deploymentState, null, 2));

        console.log(`${colors.green}${colors.bright}╔═══════════════════════════════════════════════╗${colors.reset}`);
        console.log(`${colors.green}${colors.bright}║      ✅ CONTRACTS DEPLOYED! ✅                ║${colors.reset}`);
        console.log(`${colors.green}${colors.bright}╚═══════════════════════════════════════════════╝${colors.reset}\n`);

        console.log(`${colors.cyan}All 9 contracts deployed to Sepolia!${colors.reset}`);
        console.log(`${colors.cyan}Note: Registry configuration will be completed in next step${colors.reset}\n`);

        // Print summary
        console.log(`${colors.bright}${colors.cyan}📋 Deployment Summary:${colors.reset}`);
        for (const [name, address] of Object.entries(deploymentState.contracts)) {
            console.log(`   ${name}: ${address}`);
        }
        console.log();

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
