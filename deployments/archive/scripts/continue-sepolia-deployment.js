const hre = require("hardhat");
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * @title Continue Sepolia Deployment - Resume from Step 3
 * @notice Continues deployment using existing VersionedRegistry and ParameterStorage
 */

// Load partial state
const PARTIAL_STATE_FILE = path.join(__dirname, "../../sepolia-deployment-unified.json");
let deploymentState = JSON.parse(fs.readFileSync(PARTIAL_STATE_FILE, "utf8"));

// Configuration
const CONFIG = {
    SAVE_FILE: PARTIAL_STATE_FILE,
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
    red: "\x1b[31m",
    cyan: "\x1b[36m",
    magenta: "\x1b[35m"
};

function getContractSize(contractName) {
    try {
        const artifactPath = path.join(__dirname, `../../artifacts/contracts/core/${contractName}.sol/${contractName}.json`);
        const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
        const bytecode = artifact.deployedBytecode || artifact.bytecode;
        const sizeBytes = (bytecode.length - 2) / 2;
        const sizeKB = (sizeBytes / 1024).toFixed(2);
        return { bytes: sizeBytes, kb: sizeKB, underLimit: sizeBytes < 24576 };
    } catch (e) {
        return { bytes: 0, kb: "0.00", underLimit: false };
    }
}

async function waitForConfirmations(tx) {
    if (CONFIG.CONFIRMATIONS > 0) {
        console.log(`${colors.cyan}   ⏳ Waiting for ${CONFIG.CONFIRMATIONS} confirmations...${colors.reset}`);
        await tx.deploymentTransaction().wait(CONFIG.CONFIRMATIONS);
        console.log(`${colors.green}   ✅ ${CONFIG.CONFIRMATIONS} confirmations received${colors.reset}`);
    }
}

async function main() {
    console.log(`\n${colors.bright}${colors.magenta}╔══════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.bright}${colors.magenta}║  KEKTECH 3.0 - CONTINUE SEPOLIA DEPLOYMENT (Step 3)    ║${colors.reset}`);
    console.log(`${colors.bright}${colors.magenta}╚══════════════════════════════════════════════════════════╝${colors.reset}\n`);

    const [deployer] = await ethers.getSigners();
    console.log(`${colors.cyan}📋 Resuming Deployment${colors.reset}`);
    console.log(`   Deployer:  ${colors.yellow}${deployer.address}${colors.reset}`);
    console.log(`   Registry:  ${colors.yellow}${deploymentState.contracts.VersionedRegistry}${colors.reset}`);
    console.log(`   ParamStore: ${colors.yellow}${deploymentState.contracts.ParameterStorage}${colors.reset}\n`);

    const registry = await ethers.getContractAt("VersionedRegistry", deploymentState.contracts.VersionedRegistry);

    try {
        // Step 3: AccessControlManager
        console.log(`${colors.bright}${colors.cyan}📦 Step 3/9: AccessControlManager${colors.reset}`);
        const ACM = await ethers.getContractFactory("AccessControlManager");
        const acm = await ACM.deploy(deploymentState.contracts.VersionedRegistry);
        await acm.waitForDeployment();
        await waitForConfirmations(acm);
        deploymentState.contracts.AccessControlManager = await acm.getAddress();
        deploymentState.contractSizes.AccessControlManager = getContractSize("AccessControlManager");
        console.log(`${colors.green}   ✅ Deployed: ${deploymentState.contracts.AccessControlManager}${colors.reset}\n`);

        console.log(`${colors.bright}🔗 Registering AccessControlManager...${colors.reset}`);
        const acmKey = ethers.keccak256(ethers.toUtf8Bytes("AccessControlManager"));
        await registry.setContract(acmKey, deploymentState.contracts.AccessControlManager, 1);
        console.log(`${colors.green}   ✅ Registered${colors.reset}\n`);

        // Step 4: RewardDistributor
        console.log(`${colors.bright}${colors.cyan}📦 Step 4/9: RewardDistributor${colors.reset}`);
        const Reward = await ethers.getContractFactory("RewardDistributor");
        const reward = await Reward.deploy(deploymentState.contracts.VersionedRegistry);
        await reward.waitForDeployment();
        await waitForConfirmations(reward);
        deploymentState.contracts.RewardDistributor = await reward.getAddress();
        deploymentState.contractSizes.RewardDistributor = getContractSize("RewardDistributor");
        console.log(`${colors.green}   ✅ Deployed: ${deploymentState.contracts.RewardDistributor}${colors.reset}\n`);

        console.log(`${colors.bright}🔗 Registering RewardDistributor...${colors.reset}`);
        const rewardKey = ethers.keccak256(ethers.toUtf8Bytes("RewardDistributor"));
        await registry.setContract(rewardKey, deploymentState.contracts.RewardDistributor, 1);
        console.log(`${colors.green}   ✅ Registered${colors.reset}\n`);

        // Step 5: PredictionMarket Template
        console.log(`${colors.bright}${colors.cyan}📦 Step 5/9: PredictionMarket Template${colors.reset}`);
        const Market = await ethers.getContractFactory("PredictionMarket");
        const marketTemplate = await Market.deploy();
        await marketTemplate.waitForDeployment();
        await waitForConfirmations(marketTemplate);
        deploymentState.contracts.PredictionMarketTemplate = await marketTemplate.getAddress();
        deploymentState.contractSizes.PredictionMarketTemplate = getContractSize("PredictionMarket");
        console.log(`${colors.green}   ✅ Deployed: ${deploymentState.contracts.PredictionMarketTemplate}${colors.reset}\n`);

        console.log(`${colors.bright}🔗 Registering PredictionMarketTemplate...${colors.reset}`);
        const templateKey = ethers.keccak256(ethers.toUtf8Bytes("PredictionMarketTemplate"));
        await registry.setContract(templateKey, deploymentState.contracts.PredictionMarketTemplate, 1);
        console.log(`${colors.green}   ✅ Registered${colors.reset}\n`);

        // Step 6: FlexibleMarketFactoryUnified
        console.log(`${colors.bright}${colors.magenta}📦 Step 6/9: FlexibleMarketFactoryUnified 🎯${colors.reset}`);
        const Factory = await ethers.getContractFactory("FlexibleMarketFactoryUnified");
        const factory = await Factory.deploy(deploymentState.contracts.VersionedRegistry, CONFIG.MIN_CREATOR_BOND);
        await factory.waitForDeployment();
        await waitForConfirmations(factory);
        deploymentState.contracts.FlexibleMarketFactoryUnified = await factory.getAddress();
        deploymentState.contractSizes.FlexibleMarketFactoryUnified = getContractSize("FlexibleMarketFactoryUnified");
        console.log(`${colors.green}   ✅ Deployed: ${deploymentState.contracts.FlexibleMarketFactoryUnified}${colors.reset}`);
        console.log(`${colors.cyan}      Size: ${deploymentState.contractSizes.FlexibleMarketFactoryUnified.kb} KB${colors.reset}\n`);

        console.log(`${colors.bright}🔗 Registering FlexibleMarketFactoryUnified...${colors.reset}`);
        const factoryKey = ethers.keccak256(ethers.toUtf8Bytes("FlexibleMarketFactoryUnified"));
        await registry.setContract(factoryKey, deploymentState.contracts.FlexibleMarketFactoryUnified, 1);
        console.log(`${colors.green}   ✅ Registered${colors.reset}\n`);

        // Save final state
        deploymentState.timestamp = new Date().toISOString();
        delete deploymentState.error;
        fs.writeFileSync(CONFIG.SAVE_FILE, JSON.stringify(deploymentState, null, 2));

        console.log(`${colors.bright}${colors.green}╔══════════════════════════════════════════════════════════╗${colors.reset}`);
        console.log(`${colors.bright}${colors.green}║         ✅ DEPLOYMENT COMPLETE! ✅                       ║${colors.reset}`);
        console.log(`${colors.bright}${colors.green}╚══════════════════════════════════════════════════════════╝${colors.reset}\n`);

    } catch (error) {
        console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}\n`);
        deploymentState.error = { message: error.message, stack: error.stack };
        fs.writeFileSync(CONFIG.SAVE_FILE, JSON.stringify(deploymentState, null, 2));
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
