const hre = require("hardhat");
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

// Deployment state file
const STATE_FILE = path.join(__dirname, "../../basedai-mainnet-deployment.json");

// Configuration
const CONFIG = {
    MIN_CREATOR_BOND: ethers.parseEther("0.1"),      // 0.1 BASED
    DISPUTE_WINDOW: 48 * 60 * 60,                    // 48 hours
    MIN_DISPUTE_BOND: ethers.parseEther("0.01"),     // 0.01 BASED
    CONFIRMATIONS: 2,                                 // Wait for 2 confirmations
    DELAY_BETWEEN_TXS: 30000,                        // 30 seconds between transactions
    GAS_LIMIT: 5000000                               // 5M gas limit (generous for BasedAI)
};

// Deployment state
let deploymentState = {
    network: "basedai_mainnet",
    chainId: 32323,
    timestamp: new Date().toISOString(),
    deployer: "",
    status: "IN_PROGRESS",
    contracts: {},
    transactions: []
};

// Helper: Save state
function saveState() {
    fs.writeFileSync(STATE_FILE, JSON.stringify(deploymentState, null, 2));
    console.log(`${colors.dim}   📝 State saved${colors.reset}`);
}

// Helper: Wait for confirmations
async function waitForConfirmations(tx, confirmations = CONFIG.CONFIRMATIONS) {
    console.log(`${colors.dim}   ⏳ Waiting for ${confirmations} confirmations...${colors.reset}`);
    const receipt = await tx.wait(confirmations);
    console.log(`${colors.green}   ✅ Confirmed (Block ${receipt.blockNumber})${colors.reset}`);
    return receipt;
}

// Helper: Delay
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Main deployment function
async function main() {
    console.log(`${colors.bright}${colors.cyan}╔═══════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}║    🚀 BASEDAI MAINNET DEPLOYMENT (ULTRA-CONSERVATIVE)    ║${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}╚═══════════════════════════════════════════════════════════╝${colors.reset}\n`);

    // Get deployer
    const [deployer] = await ethers.getSigners();
    const balance = await ethers.provider.getBalance(deployer.address);
    const network = await ethers.provider.getNetwork();

    console.log(`${colors.bright}Deployer:${colors.reset} ${deployer.address}`);
    console.log(`${colors.bright}Balance:${colors.reset}  ${ethers.formatEther(balance)} $BASED`);
    console.log(`${colors.bright}Network:${colors.reset}  ${network.name} (Chain ID: ${network.chainId})\n`);

    // SAFETY CHECK: Confirm correct network
    if (network.chainId !== 32323n) {
        console.log(`${colors.red}❌ ERROR: Wrong network! Expected Chain ID 32323, got ${network.chainId}${colors.reset}`);
        console.log(`${colors.red}   DEPLOYMENT STOPPED${colors.reset}\n`);
        process.exit(1);
    }

    // SAFETY CHECK: Confirm sufficient balance
    const minBalance = ethers.parseEther("0.015"); // 0.015 BASED minimum
    if (balance < minBalance) {
        console.log(`${colors.red}❌ ERROR: Insufficient balance!${colors.reset}`);
        console.log(`${colors.red}   Required: ${ethers.formatEther(minBalance)} $BASED${colors.reset}`);
        console.log(`${colors.red}   Available: ${ethers.formatEther(balance)} $BASED${colors.reset}`);
        console.log(`${colors.red}   DEPLOYMENT STOPPED${colors.reset}\n`);
        process.exit(1);
    }

    // Initialize deployment state
    deploymentState.deployer = deployer.address;
    deploymentState.startBalance = ethers.formatEther(balance);
    saveState();

    console.log(`${colors.green}✅ Pre-flight checks passed${colors.reset}\n`);
    console.log(`${colors.yellow}⚠️  ULTRA-CONSERVATIVE MODE: Will stop at ANY issue${colors.reset}\n`);

    // Get gas price from network
    const feeData = await ethers.provider.getFeeData();
    const gasPrice = feeData.gasPrice || ethers.parseUnits("10", "gwei"); // Fallback to 10 gwei
    console.log(`${colors.cyan}Gas Price: ${ethers.formatUnits(gasPrice, "gwei")} gwei${colors.reset}\n`);

    // Gas options
    const gasOptions = {
        gasLimit: CONFIG.GAS_LIMIT,
        gasPrice: gasPrice
    };

    try {
        // ═══════════════════════════════════════════════════════════
        // STEP 1: VersionedRegistry
        // ═══════════════════════════════════════════════════════════
        console.log(`${colors.bright}${colors.cyan}📦 Step 1/9: VersionedRegistry${colors.reset}`);
        const VersionedRegistry = await ethers.getContractFactory("VersionedRegistry");
        const versionedRegistry = await VersionedRegistry.deploy(gasOptions);
        const registryTx = await versionedRegistry.deploymentTransaction();
        await waitForConfirmations(registryTx);

        const registryAddress = await versionedRegistry.getAddress();
        console.log(`${colors.green}   ✅ Deployed: ${registryAddress}${colors.reset}`);

        deploymentState.contracts.VersionedRegistry = registryAddress;
        deploymentState.transactions.push({
            step: "1/9",
            contract: "VersionedRegistry",
            address: registryAddress,
            txHash: registryTx.hash,
            timestamp: new Date().toISOString()
        });
        saveState();

        console.log();
        await delay(CONFIG.DELAY_BETWEEN_TXS);

        // ═══════════════════════════════════════════════════════════
        // STEP 2: ParameterStorage
        // ═══════════════════════════════════════════════════════════
        console.log(`${colors.bright}${colors.cyan}📦 Step 2/9: ParameterStorage${colors.reset}`);
        const ParameterStorage = await ethers.getContractFactory("ParameterStorage");
        const parameterStorage = await ParameterStorage.deploy(registryAddress, gasOptions);
        const psTx = await parameterStorage.deploymentTransaction();
        await waitForConfirmations(psTx);

        const psAddress = await parameterStorage.getAddress();
        console.log(`${colors.green}   ✅ Deployed: ${psAddress}${colors.reset}`);

        deploymentState.contracts.ParameterStorage = psAddress;
        deploymentState.transactions.push({
            step: "2/9",
            contract: "ParameterStorage",
            address: psAddress,
            txHash: psTx.hash,
            timestamp: new Date().toISOString()
        });
        saveState();

        console.log();
        await delay(CONFIG.DELAY_BETWEEN_TXS);

        // ═══════════════════════════════════════════════════════════
        // STEP 3: AccessControlManager
        // ═══════════════════════════════════════════════════════════
        console.log(`${colors.bright}${colors.cyan}📦 Step 3/9: AccessControlManager${colors.reset}`);
        const AccessControlManager = await ethers.getContractFactory("AccessControlManager");
        const accessControlManager = await AccessControlManager.deploy(registryAddress, gasOptions);
        const acmTx = await accessControlManager.deploymentTransaction();
        await waitForConfirmations(acmTx);

        const acmAddress = await accessControlManager.getAddress();
        console.log(`${colors.green}   ✅ Deployed: ${acmAddress}${colors.reset}`);

        deploymentState.contracts.AccessControlManager = acmAddress;
        deploymentState.transactions.push({
            step: "3/9",
            contract: "AccessControlManager",
            address: acmAddress,
            txHash: acmTx.hash,
            timestamp: new Date().toISOString()
        });
        saveState();

        // Grant ADMIN_ROLE to deployer
        console.log(`${colors.cyan}   ⚙️  Granting ADMIN_ROLE to deployer...${colors.reset}`);
        const ADMIN_ROLE = await accessControlManager.ADMIN_ROLE();
        const grantTx = await accessControlManager.grantRole(ADMIN_ROLE, deployer.address, gasOptions);
        await waitForConfirmations(grantTx);
        console.log(`${colors.green}   ✅ ADMIN_ROLE granted${colors.reset}\n`);

        await delay(CONFIG.DELAY_BETWEEN_TXS);

        // ═══════════════════════════════════════════════════════════
        // STEP 4: ResolutionManager
        // ═══════════════════════════════════════════════════════════
        console.log(`${colors.bright}${colors.cyan}📦 Step 4/9: ResolutionManager${colors.reset}`);
        const ResolutionManager = await ethers.getContractFactory("ResolutionManager");
        const resolutionManager = await ResolutionManager.deploy(
            registryAddress,
            CONFIG.DISPUTE_WINDOW,
            CONFIG.MIN_DISPUTE_BOND,
            gasOptions
        );
        const rmTx = await resolutionManager.deploymentTransaction();
        await waitForConfirmations(rmTx);

        const rmAddress = await resolutionManager.getAddress();
        console.log(`${colors.green}   ✅ Deployed: ${rmAddress}${colors.reset}`);

        deploymentState.contracts.ResolutionManager = rmAddress;
        deploymentState.transactions.push({
            step: "4/9",
            contract: "ResolutionManager",
            address: rmAddress,
            txHash: rmTx.hash,
            timestamp: new Date().toISOString()
        });
        saveState();

        console.log();
        await delay(CONFIG.DELAY_BETWEEN_TXS);

        // ═══════════════════════════════════════════════════════════
        // STEP 5: RewardDistributor
        // ═══════════════════════════════════════════════════════════
        console.log(`${colors.bright}${colors.cyan}📦 Step 5/9: RewardDistributor${colors.reset}`);
        const RewardDistributor = await ethers.getContractFactory("RewardDistributor");
        const rewardDistributor = await RewardDistributor.deploy(registryAddress, gasOptions);
        const rdTx = await rewardDistributor.deploymentTransaction();
        await waitForConfirmations(rdTx);

        const rdAddress = await rewardDistributor.getAddress();
        console.log(`${colors.green}   ✅ Deployed: ${rdAddress}${colors.reset}`);

        deploymentState.contracts.RewardDistributor = rdAddress;
        deploymentState.transactions.push({
            step: "5/9",
            contract: "RewardDistributor",
            address: rdAddress,
            txHash: rdTx.hash,
            timestamp: new Date().toISOString()
        });
        saveState();

        console.log();
        await delay(CONFIG.DELAY_BETWEEN_TXS);

        // ═══════════════════════════════════════════════════════════
        // STEP 6: FlexibleMarketFactoryUnified
        // ═══════════════════════════════════════════════════════════
        console.log(`${colors.bright}${colors.cyan}📦 Step 6/9: FlexibleMarketFactoryUnified${colors.reset}`);
        const Factory = await ethers.getContractFactory("FlexibleMarketFactoryUnified");
        const factory = await Factory.deploy(
            registryAddress,
            CONFIG.MIN_CREATOR_BOND,
            gasOptions
        );
        const factoryTx = await factory.deploymentTransaction();
        await waitForConfirmations(factoryTx);

        const factoryAddress = await factory.getAddress();
        console.log(`${colors.green}   ✅ Deployed: ${factoryAddress}${colors.reset}`);

        deploymentState.contracts.FlexibleMarketFactoryUnified = factoryAddress;
        deploymentState.transactions.push({
            step: "6/9",
            contract: "FlexibleMarketFactoryUnified",
            address: factoryAddress,
            txHash: factoryTx.hash,
            timestamp: new Date().toISOString()
        });
        saveState();

        console.log();
        await delay(CONFIG.DELAY_BETWEEN_TXS);

        // ═══════════════════════════════════════════════════════════
        // STEP 7: PredictionMarket Template
        // ═══════════════════════════════════════════════════════════
        console.log(`${colors.bright}${colors.cyan}📦 Step 7/9: PredictionMarket Template${colors.reset}`);
        const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
        const template = await PredictionMarket.deploy(gasOptions);
        const templateTx = await template.deploymentTransaction();
        await waitForConfirmations(templateTx);

        const templateAddress = await template.getAddress();
        console.log(`${colors.green}   ✅ Deployed: ${templateAddress}${colors.reset}`);

        deploymentState.contracts.PredictionMarketTemplate = templateAddress;
        deploymentState.transactions.push({
            step: "7/9",
            contract: "PredictionMarket",
            address: templateAddress,
            txHash: templateTx.hash,
            timestamp: new Date().toISOString()
        });
        saveState();

        console.log();
        await delay(CONFIG.DELAY_BETWEEN_TXS);

        // ═══════════════════════════════════════════════════════════
        // STEP 8: CurveRegistry
        // ═══════════════════════════════════════════════════════════
        console.log(`${colors.bright}${colors.cyan}📦 Step 8/9: CurveRegistry${colors.reset}`);
        const CurveRegistry = await ethers.getContractFactory("CurveRegistry");
        const curveRegistry = await CurveRegistry.deploy(registryAddress, gasOptions);
        const crTx = await curveRegistry.deploymentTransaction();
        await waitForConfirmations(crTx);

        const crAddress = await curveRegistry.getAddress();
        console.log(`${colors.green}   ✅ Deployed: ${crAddress}${colors.reset}`);

        deploymentState.contracts.CurveRegistry = crAddress;
        deploymentState.transactions.push({
            step: "8/9",
            contract: "CurveRegistry",
            address: crAddress,
            txHash: crTx.hash,
            timestamp: new Date().toISOString()
        });
        saveState();

        console.log();
        await delay(CONFIG.DELAY_BETWEEN_TXS);

        // ═══════════════════════════════════════════════════════════
        // STEP 9: MarketTemplateRegistry
        // ═══════════════════════════════════════════════════════════
        console.log(`${colors.bright}${colors.cyan}📦 Step 9/9: MarketTemplateRegistry${colors.reset}`);
        const MarketTemplateRegistry = await ethers.getContractFactory("MarketTemplateRegistry");
        const marketTemplateRegistry = await MarketTemplateRegistry.deploy(registryAddress, gasOptions);
        const mtrTx = await marketTemplateRegistry.deploymentTransaction();
        await waitForConfirmations(mtrTx);

        const mtrAddress = await marketTemplateRegistry.getAddress();
        console.log(`${colors.green}   ✅ Deployed: ${mtrAddress}${colors.reset}`);

        deploymentState.contracts.MarketTemplateRegistry = mtrAddress;
        deploymentState.transactions.push({
            step: "9/9",
            contract: "MarketTemplateRegistry",
            address: mtrAddress,
            txHash: mtrTx.hash,
            timestamp: new Date().toISOString()
        });
        saveState();

        console.log();

        // ═══════════════════════════════════════════════════════════
        // SAVE FINAL STATE
        // ═══════════════════════════════════════════════════════════
        const finalBalance = await ethers.provider.getBalance(deployer.address);
        deploymentState.endBalance = ethers.formatEther(finalBalance);
        deploymentState.gasUsed = ethers.formatEther(balance - finalBalance);
        deploymentState.timestamp = new Date().toISOString();
        deploymentState.status = "CONTRACTS_DEPLOYED";
        deploymentState.note = "All 9 contracts deployed successfully. Next step: Registry configuration.";
        saveState();

        console.log(`${colors.green}${colors.bright}╔═══════════════════════════════════════════════════════════╗${colors.reset}`);
        console.log(`${colors.green}${colors.bright}║          ✅ ALL 9 CONTRACTS DEPLOYED! ✅                 ║${colors.reset}`);
        console.log(`${colors.green}${colors.bright}╚═══════════════════════════════════════════════════════════╝${colors.reset}\n`);

        console.log(`${colors.cyan}All contracts deployed to BasedAI Mainnet!${colors.reset}\n`);

        // Print summary
        console.log(`${colors.bright}${colors.cyan}📋 Deployment Summary:${colors.reset}`);
        console.log(`${colors.dim}────────────────────────────────────────────────────────────${colors.reset}`);
        Object.entries(deploymentState.contracts).forEach(([name, address]) => {
            console.log(`${colors.bright}${name}:${colors.reset}`);
            console.log(`   ${address}`);
        });
        console.log(`${colors.dim}────────────────────────────────────────────────────────────${colors.reset}`);
        console.log(`${colors.bright}Gas Used:${colors.reset} ${deploymentState.gasUsed} $BASED`);
        console.log(`${colors.bright}Remaining Balance:${colors.reset} ${deploymentState.endBalance} $BASED\n`);

        console.log(`${colors.yellow}⚠️  NEXT STEP: Run registry configuration script${colors.reset}`);
        console.log(`${colors.dim}   npx hardhat run scripts/deploy/configure-basedai-registry.js --network basedai_mainnet${colors.reset}\n`);

    } catch (error) {
        console.log(`${colors.red}${colors.bright}\n╔═══════════════════════════════════════════════════════════╗${colors.reset}`);
        console.log(`${colors.red}${colors.bright}║                 ❌ DEPLOYMENT FAILED ❌                   ║${colors.reset}`);
        console.log(`${colors.red}${colors.bright}╚═══════════════════════════════════════════════════════════╝${colors.reset}\n`);

        console.log(`${colors.red}Error: ${error.message}${colors.reset}\n`);

        deploymentState.status = "FAILED";
        deploymentState.error = error.message;
        deploymentState.timestamp = new Date().toISOString();
        saveState();

        console.log(`${colors.yellow}Deployment state saved to:${colors.reset}`);
        console.log(`${colors.dim}   ${STATE_FILE}${colors.reset}\n`);

        console.log(`${colors.yellow}To resume deployment:${colors.reset}`);
        console.log(`${colors.dim}   1. Review the error above${colors.reset}`);
        console.log(`${colors.dim}   2. Fix the issue if possible${colors.reset}`);
        console.log(`${colors.dim}   3. Use continuation script to resume${colors.reset}\n`);

        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
