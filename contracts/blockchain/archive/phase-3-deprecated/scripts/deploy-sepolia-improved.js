const hre = require("hardhat");
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * @title IMPROVED Sepolia Deployment Script - Day 7 Strategy
 * @notice Deploys with retry logic, high gas, and state management
 * @dev Implements all lessons learned from Day 6
 */

// Configuration
const CONFIG = {
    MAX_RETRIES: 5,
    BASE_DELAY: 30000, // 30 seconds
    GAS_MULTIPLIER: 15.0, // Very high to ensure success
    SAVE_FILE: path.join(__dirname, "../../sepolia-deployment-state.json"),
    LOG_FILE: path.join(__dirname, "../../sepolia-deployment-log.txt")
};

// Colors for console output
const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
    cyan: "\x1b[36m"
};

// State management
let deploymentState = {
    network: "sepolia",
    chainId: 11155111,
    startTime: new Date().toISOString(),
    contracts: {},
    gasUsed: "0",
    attempts: 0,
    status: "IN_PROGRESS"
};

// Load existing state if any
function loadState() {
    if (fs.existsSync(CONFIG.SAVE_FILE)) {
        try {
            const saved = JSON.parse(fs.readFileSync(CONFIG.SAVE_FILE, "utf8"));
            console.log(`${colors.yellow}📂 Found existing deployment state from ${saved.startTime}${colors.reset}`);
            console.log(`${colors.yellow}   Contracts deployed: ${Object.keys(saved.contracts).length}/8${colors.reset}\n`);

            // Ask if we should continue
            deploymentState = saved;
            return true;
        } catch (e) {
            console.log(`${colors.yellow}⚠️  Could not load state, starting fresh${colors.reset}\n`);
        }
    }
    return false;
}

// Save state after each successful deployment
function saveState() {
    fs.writeFileSync(CONFIG.SAVE_FILE, JSON.stringify(deploymentState, null, 2));
    console.log(`${colors.cyan}   💾 State saved${colors.reset}`);
}

// Log to file for debugging
function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp}: ${message}\n`;
    fs.appendFileSync(CONFIG.LOG_FILE, logMessage);
    console.log(message);
}

// Sleep utility
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Deploy with retry logic
async function deployWithRetry(contractName, deployFunc, retries = CONFIG.MAX_RETRIES) {
    // Check if already deployed
    if (deploymentState.contracts[contractName]) {
        log(`${colors.green}   ✅ ${contractName} already deployed at: ${deploymentState.contracts[contractName]}${colors.reset}`);
        return deploymentState.contracts[contractName];
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            log(`${colors.cyan}   🔄 Attempt ${attempt}/${retries} for ${contractName}...${colors.reset}`);

            const result = await deployFunc();

            // Success!
            deploymentState.contracts[contractName] = result;
            deploymentState.attempts++;
            saveState();

            log(`${colors.green}   ✅ ${contractName}: ${result}${colors.reset}`);
            return result;

        } catch (error) {
            log(`${colors.red}   ❌ Attempt ${attempt} failed: ${error.message}${colors.reset}`);

            if (attempt < retries) {
                const delay = CONFIG.BASE_DELAY * attempt; // Exponential backoff
                log(`${colors.yellow}   ⏳ Waiting ${delay/1000} seconds before retry...${colors.reset}`);
                await sleep(delay);
            } else {
                log(`${colors.red}   ❌ Failed to deploy ${contractName} after ${retries} attempts${colors.reset}`);
                throw error;
            }
        }
    }
}

async function main() {
    log(`\n${colors.bright}${colors.cyan}🚀 ========================================`);
    log(`🚀 IMPROVED SEPOLIA DEPLOYMENT - DAY 7`);
    log(`🚀 ========================================${colors.reset}\n`);

    // Load state or start fresh
    const hasExistingState = loadState();

    // Get signers
    const [deployer] = await ethers.getSigners();
    const admin = deployer;
    const resolver = deployer;

    // Check current nonce
    const currentNonce = await ethers.provider.getTransactionCount(deployer.address);
    const pendingNonce = await ethers.provider.getTransactionCount(deployer.address, "pending");

    log(`${colors.cyan}📋 Deployment Configuration:${colors.reset}`);
    log(`   Network: ${hre.network.name}`);
    log(`   Chain ID: ${(await ethers.provider.getNetwork()).chainId}`);
    log(`   Deployer: ${deployer.address}`);
    log(`   Current Nonce: ${currentNonce}`);
    log(`   Pending Nonce: ${pendingNonce}`);

    const deployerBalance = await ethers.provider.getBalance(deployer.address);
    log(`   Balance: ${ethers.formatEther(deployerBalance)} ETH`);
    log(`   Gas Multiplier: ${CONFIG.GAS_MULTIPLIER}x`);
    log(`   Max Retries: ${CONFIG.MAX_RETRIES}\n`);

    if (pendingNonce > currentNonce) {
        log(`${colors.yellow}⚠️  WARNING: ${pendingNonce - currentNonce} pending transaction(s)${colors.reset}`);
        log(`${colors.yellow}   Waiting 60 seconds for them to clear...${colors.reset}`);
        await sleep(60000);
    }

    try {
        // ========================================
        // STEP 1: Deploy MasterRegistry
        // ========================================
        log(`\n${colors.cyan}📦 [1/8] Deploying MasterRegistry...${colors.reset}`);
        const registryAddress = await deployWithRetry("MasterRegistry", async () => {
            const MasterRegistry = await ethers.getContractFactory("MasterRegistry");
            const registry = await MasterRegistry.deploy();
            await registry.waitForDeployment();
            return await registry.getAddress();
        });

        const registry = await ethers.getContractAt("MasterRegistry", registryAddress);

        // ========================================
        // STEP 2: Deploy AccessControlManager
        // ========================================
        log(`\n${colors.cyan}📦 [2/8] Deploying AccessControlManager...${colors.reset}`);
        const accessControlAddress = await deployWithRetry("AccessControlManager", async () => {
            const AccessControlManager = await ethers.getContractFactory("AccessControlManager");
            const accessControl = await AccessControlManager.deploy(registry.target);
            await accessControl.waitForDeployment();

            // Register in MasterRegistry
            await registry.setContract(
                ethers.keccak256(ethers.toUtf8Bytes("AccessControlManager")),
                accessControl.target
            );
            log(`   ✅ Registered in MasterRegistry`);

            return await accessControl.getAddress();
        });

        // ========================================
        // STEP 3: Deploy ParameterStorage
        // ========================================
        log(`\n${colors.cyan}📦 [3/8] Deploying ParameterStorage...${colors.reset}`);
        const paramStorageAddress = await deployWithRetry("ParameterStorage", async () => {
            const ParameterStorage = await ethers.getContractFactory("ParameterStorage");
            const paramStorage = await ParameterStorage.deploy(registry.target);
            await paramStorage.waitForDeployment();

            await registry.setContract(
                ethers.keccak256(ethers.toUtf8Bytes("ParameterStorage")),
                paramStorage.target
            );
            log(`   ✅ Registered in MasterRegistry`);

            return await paramStorage.getAddress();
        });

        // ========================================
        // STEP 4: Deploy RewardDistributor
        // ========================================
        log(`\n${colors.cyan}📦 [4/8] Deploying RewardDistributor...${colors.reset}`);
        const rewardDistributorAddress = await deployWithRetry("RewardDistributor", async () => {
            const RewardDistributor = await ethers.getContractFactory("RewardDistributor");
            const rewardDistributor = await RewardDistributor.deploy(registry.target);
            await rewardDistributor.waitForDeployment();

            await registry.setContract(
                ethers.keccak256(ethers.toUtf8Bytes("RewardDistributor")),
                rewardDistributor.target
            );
            log(`   ✅ Registered in MasterRegistry`);

            return await rewardDistributor.getAddress();
        });

        // ========================================
        // STEP 5: Deploy ResolutionManager
        // ========================================
        log(`\n${colors.cyan}📦 [5/8] Deploying ResolutionManager...${colors.reset}`);
        const disputeWindow = 7 * 24 * 60 * 60; // 7 days in seconds
        const minDisputeBond = ethers.parseEther("0.1"); // 0.1 ETH

        const resolutionManagerAddress = await deployWithRetry("ResolutionManager", async () => {
            const ResolutionManager = await ethers.getContractFactory("ResolutionManager");
            const resolutionManager = await ResolutionManager.deploy(registry.target, disputeWindow, minDisputeBond);
            await resolutionManager.waitForDeployment();

            await registry.setContract(
                ethers.keccak256(ethers.toUtf8Bytes("ResolutionManager")),
                resolutionManager.target
            );
            log(`   ✅ Registered in MasterRegistry`);

            return await resolutionManager.getAddress();
        });

        // ========================================
        // STEP 6: Deploy FlexibleMarketFactory
        // ========================================
        log(`\n${colors.cyan}📦 [6/8] Deploying FlexibleMarketFactory...${colors.reset}`);
        const minCreatorBond = ethers.parseEther("0.01"); // 0.01 ETH

        const factoryAddress = await deployWithRetry("FlexibleMarketFactory", async () => {
            const FlexibleMarketFactory = await ethers.getContractFactory("FlexibleMarketFactory");
            const factory = await FlexibleMarketFactory.deploy(registry.target, minCreatorBond);
            await factory.waitForDeployment();

            await registry.setContract(
                ethers.keccak256(ethers.toUtf8Bytes("FlexibleMarketFactory")),
                factory.target
            );
            log(`   ✅ Registered in MasterRegistry`);

            return await factory.getAddress();
        });

        // ========================================
        // STEP 7: Deploy MarketTemplateRegistry
        // ========================================
        log(`\n${colors.cyan}📦 [7/8] Deploying MarketTemplateRegistry...${colors.reset}`);
        const templateRegistryAddress = await deployWithRetry("MarketTemplateRegistry", async () => {
            const MarketTemplateRegistry = await ethers.getContractFactory("MarketTemplateRegistry");
            const templateRegistry = await MarketTemplateRegistry.deploy();
            await templateRegistry.waitForDeployment();

            await registry.setContract(
                ethers.keccak256(ethers.toUtf8Bytes("MarketTemplateRegistry")),
                templateRegistry.target
            );
            log(`   ✅ Registered in MasterRegistry`);

            return await templateRegistry.getAddress();
        });

        // ========================================
        // STEP 8: Deploy ParimutuelMarket Template
        // ========================================
        log(`\n${colors.cyan}📦 [8/8] Deploying ParimutuelMarket Template...${colors.reset}`);
        const marketTemplateAddress = await deployWithRetry("ParimutuelMarket", async () => {
            const ParimutuelMarket = await ethers.getContractFactory("ParimutuelMarket");
            const marketTemplate = await ParimutuelMarket.deploy();
            await marketTemplate.waitForDeployment();

            // Register template
            const templateRegistry = await ethers.getContractAt("MarketTemplateRegistry", templateRegistryAddress);
            await templateRegistry.registerTemplate(
                "ParimutuelMarket",
                marketTemplate.target,
                "Standard parimutuel prediction market"
            );
            log(`   ✅ Registered in MarketTemplateRegistry`);

            return await marketTemplate.getAddress();
        });

        // ========================================
        // FINAL SUMMARY
        // ========================================
        deploymentState.status = "COMPLETE";
        deploymentState.endTime = new Date().toISOString();
        saveState();

        // Create final deployment file
        const finalDeployment = {
            network: "sepolia",
            chainId: "11155111",
            timestamp: deploymentState.endTime,
            deployer: deployer.address,
            admin: admin.address,
            resolver: resolver.address,
            contracts: deploymentState.contracts,
            attempts: deploymentState.attempts,
            gasUsed: deploymentState.gasUsed.toString()
        };

        const deploymentPath = path.join(__dirname, "../../sepolia-deployment.json");
        fs.writeFileSync(deploymentPath, JSON.stringify(finalDeployment, null, 2));

        log(`\n${colors.bright}${colors.green}✅ ========================================`);
        log(`✅ DEPLOYMENT COMPLETE!`);
        log(`✅ ========================================${colors.reset}\n`);

        log(`${colors.cyan}📋 Deployment Summary:${colors.reset}`);
        log(`   Total Contracts: 8/8`);
        log(`   Total Attempts: ${deploymentState.attempts}`);
        log(`   Status: ${deploymentState.status}`);
        log(`   Deployment file: sepolia-deployment.json\n`);

        log(`${colors.yellow}📝 Next Steps:${colors.reset}`);
        log(`   1. Verify contracts on Etherscan`);
        log(`   2. Create test markets`);
        log(`   3. Share addresses for public testing\n`);

        // Clean up state file on success
        if (fs.existsSync(CONFIG.SAVE_FILE)) {
            fs.unlinkSync(CONFIG.SAVE_FILE);
            log(`${colors.cyan}🧹 Cleaned up state file${colors.reset}`);
        }

    } catch (error) {
        log(`\n${colors.red}❌ DEPLOYMENT FAILED!${colors.reset}`);
        log(`${colors.red}Error: ${error.message}${colors.reset}\n`);

        deploymentState.status = "FAILED";
        deploymentState.error = error.message;
        saveState();

        log(`${colors.yellow}💡 State saved. You can retry by running this script again.${colors.reset}`);
        log(`${colors.yellow}   It will continue from where it left off.${colors.reset}`);

        process.exit(1);
    }
}

// Execute deployment
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });