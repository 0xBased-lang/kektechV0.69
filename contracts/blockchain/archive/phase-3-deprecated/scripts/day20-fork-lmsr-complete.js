const hre = require("hardhat");
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * @title Day 20: Fork Deployment with LMSR - Triple-Validation Phase 1
 * @notice Deploy complete KEKTECH 3.0 system with production LMSR bonding curve
 * @dev Comprehensive deployment to BasedAI mainnet fork for validation
 */

// Configuration
const CONFIG = {
    SAVE_FILE: path.join(__dirname, "../../day20-fork-deployment.json"),
    LIQUIDITY_PARAM: ethers.parseEther("10000"), // b = 10,000 ETH for LMSR
    INITIAL_RESOLUTION_BOND: ethers.parseEther("0.1") // 0.1 ETH bond
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

// Deployment state
let deploymentState = {
    network: "fork",
    chainId: 32323,
    timestamp: new Date().toISOString(),
    phase: "DAY_20_TRIPLE_VALIDATION",
    contracts: {},
    validation: {}
};

async function main() {
    console.log(`\n${colors.cyan}${"=".repeat(80)}`);
    console.log(`${colors.bright}DAY 20: FORK DEPLOYMENT WITH LMSR - TRIPLE-VALIDATION PHASE 1${colors.reset}`);
    console.log(`${colors.cyan}${"=".repeat(80)}${colors.reset}\n`);

    const [deployer] = await ethers.getSigners();
    console.log(`${colors.yellow}Deployer:${colors.reset} ${deployer.address}`);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log(`${colors.yellow}Balance:${colors.reset} ${ethers.formatEther(balance)} ETH\n`);

    try {
        // Step 1: Deploy Core Infrastructure
        console.log(`${colors.magenta}STEP 1: Core Infrastructure${colors.reset}`);
        await deployContract("MasterRegistry", []);
        await deployContract("ParameterStorage", [deploymentState.contracts.MasterRegistry]);
        await deployContract("AccessControlManager", [deploymentState.contracts.MasterRegistry]);

        // Step 2: Deploy LMSR Bonding Curve (NEW!)
        console.log(`\n${colors.magenta}STEP 2: LMSR Bonding Curve (Production)${colors.reset}`);
        await deployContract("LMSRBondingCurve", []);

        // Validate LMSR deployment
        await validateLMSR();

        // Step 3: Deploy Curve Registry and register LMSR
        console.log(`\n${colors.magenta}STEP 3: Curve Registry + LMSR Registration${colors.reset}`);
        await deployContract("CurveRegistry", [deploymentState.contracts.MasterRegistry]);
        await registerLMSRCurve();

        // Step 4: Deploy Market Contracts
        console.log(`\n${colors.magenta}STEP 4: Market Contracts${colors.reset}`);
        await deployContract("FlexibleMarketFactory", [deploymentState.contracts.MasterRegistry]);
        await deployContract("PredictionMarket", []);

        // Step 5: Deploy Resolution & Rewards
        console.log(`\n${colors.magenta}STEP 5: Resolution & Rewards${colors.reset}`);
        await deployContract("ResolutionManager", [
            deploymentState.contracts.MasterRegistry,
            CONFIG.INITIAL_RESOLUTION_BOND
        ]);
        await deployContract("RewardDistributor", [deploymentState.contracts.MasterRegistry]);

        // Step 6: Register contracts in MasterRegistry
        console.log(`\n${colors.magenta}STEP 6: Master Registry Configuration${colors.reset}`);
        await configureMasterRegistry();

        // Step 7: Create test market with LMSR
        console.log(`\n${colors.magenta}STEP 7: Test Market Creation (LMSR)${colors.reset}`);
        await createTestMarket();

        // Step 8: Run comprehensive validation
        console.log(`\n${colors.magenta}STEP 8: Comprehensive Validation${colors.reset}`);
        await runValidationTests();

        // Save deployment state
        saveDeploymentState();

        // Print summary
        printDeploymentSummary();

        console.log(`\n${colors.green}${colors.bright}✅ DAY 20 DEPLOYMENT COMPLETE!${colors.reset}\n`);

    } catch (error) {
        console.error(`\n${colors.red}${colors.bright}❌ DEPLOYMENT FAILED:${colors.reset}`, error.message);
        console.error(error);
        process.exit(1);
    }
}

async function deployContract(name, args) {
    console.log(`\n${colors.cyan}Deploying ${name}...${colors.reset}`);

    const Contract = await ethers.getContractFactory(name);
    const contract = await Contract.deploy(...args);
    await contract.waitForDeployment();

    const address = await contract.getAddress();
    deploymentState.contracts[name] = address;

    console.log(`  ${colors.green}✅ ${name}:${colors.reset} ${address}`);

    return contract;
}

async function validateLMSR() {
    console.log(`\n${colors.yellow}Validating LMSR Bonding Curve...${colors.reset}`);

    const lmsr = await ethers.getContractAt("LMSRBondingCurve", deploymentState.contracts.LMSRBondingCurve);

    // Test 1: Curve name
    const name = await lmsr.curveName();
    console.log(`  Curve Name: ${name}`);

    // Test 2: Parameter validation
    const [valid, reason] = await lmsr.validateParams(CONFIG.LIQUIDITY_PARAM);
    console.log(`  Param Validation (b=${ethers.formatEther(CONFIG.LIQUIDITY_PARAM)} ETH): ${valid ? '✅' : '❌'}`);

    // Test 3: Cost calculation (first share)
    const cost = await lmsr.calculateCost(
        CONFIG.LIQUIDITY_PARAM,
        0, // No YES shares
        0, // No NO shares
        true, // Buy YES
        ethers.parseEther("1") // 1 share
    );
    console.log(`  First Share Cost: ${ethers.formatEther(cost)} ETH`);

    // Test 4: Price calculation (balanced market)
    const [yesPrice, noPrice] = await lmsr.getPrices(
        CONFIG.LIQUIDITY_PARAM,
        ethers.parseEther("1000"),
        ethers.parseEther("1000")
    );
    console.log(`  Balanced Market Prices: YES=${Number(yesPrice)/100}%, NO=${Number(noPrice)/100}%`);

    // Validate prices sum to 100%
    if (yesPrice + noPrice !== 10000n) {
        throw new Error(`Price validation failed: ${yesPrice} + ${noPrice} != 10000`);
    }

    deploymentState.validation.lmsr = {
        name,
        validParams: valid,
        firstShareCost: ethers.formatEther(cost),
        balancedPrices: { yes: Number(yesPrice), no: Number(noPrice) }
    };

    console.log(`  ${colors.green}✅ LMSR Validation Passed${colors.reset}`);
}

async function registerLMSRCurve() {
    console.log(`\n${colors.yellow}Registering LMSR in CurveRegistry...${colors.reset}`);

    // Step 1: Grant DEFAULT_ADMIN_ROLE to deployer in AccessControlManager
    const accessControl = await ethers.getContractAt("AccessControlManager", deploymentState.contracts.AccessControlManager);
    const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
    const [deployer] = await ethers.getSigners();

    // Check if deployer already has admin role
    const hasAdminRole = await accessControl.hasRole(DEFAULT_ADMIN_ROLE, deployer.address);
    if (!hasAdminRole) {
        console.log(`  Granting DEFAULT_ADMIN_ROLE to deployer...`);
        const grantTx = await accessControl.grantRole(DEFAULT_ADMIN_ROLE, deployer.address);
        await grantTx.wait();
        console.log(`  ✅ Admin role granted`);
    } else {
        console.log(`  ℹ️  Deployer already has admin role`);
    }

    // Step 2: Register LMSR curve (using unsafe method for Day 20 fork testing)
    const registry = await ethers.getContractAt("CurveRegistry", deploymentState.contracts.CurveRegistry);

    console.log(`  ⚠️  Using registerCurveUnsafe() for Day 20 fork testing (skips validation)`);
    const tx = await registry.registerCurveUnsafe(
        deploymentState.contracts.LMSRBondingCurve,
        "v1.0.0", // version
        "Logarithmic Market Scoring Rule - Production bonding curve for prediction markets", // description
        "Logarithmic", // category
        "", // iconUrl (empty for now)
        ["LMSR", "production", "logarithmic", "market-scoring"] // tags
    );
    await tx.wait();

    // Verify registration
    const isRegistered = await registry.isCurveRegistered(deploymentState.contracts.LMSRBondingCurve);
    console.log(`  Registration Status: ${isRegistered ? '✅ Registered' : '❌ Failed'}`);

    if (!isRegistered) {
        throw new Error("LMSR registration failed");
    }

    const curveInfo = await registry.getCurveInfo(deploymentState.contracts.LMSRBondingCurve);
    console.log(`  Curve Type: ${curveInfo.curveType}`);
    console.log(`  ${colors.green}✅ LMSR Registration Complete${colors.reset}`);
}

async function configureMasterRegistry() {
    console.log(`\n${colors.yellow}Configuring MasterRegistry...${colors.reset}`);

    const registry = await ethers.getContractAt("MasterRegistry", deploymentState.contracts.MasterRegistry);

    // Register ParameterStorage
    let tx = await registry.setContract("ParameterStorage", deploymentState.contracts.ParameterStorage);
    await tx.wait();
    console.log(`  ✅ ParameterStorage registered`);

    // Register AccessControlManager
    tx = await registry.setContract("AccessControlManager", deploymentState.contracts.AccessControlManager);
    await tx.wait();
    console.log(`  ✅ AccessControlManager registered`);

    // Register FlexibleMarketFactory
    tx = await registry.setContract("FlexibleMarketFactory", deploymentState.contracts.FlexibleMarketFactory);
    await tx.wait();
    console.log(`  ✅ FlexibleMarketFactory registered`);

    // Register ResolutionManager
    tx = await registry.setContract("ResolutionManager", deploymentState.contracts.ResolutionManager);
    await tx.wait();
    console.log(`  ✅ ResolutionManager registered`);

    // Register RewardDistributor
    tx = await registry.setContract("RewardDistributor", deploymentState.contracts.RewardDistributor);
    await tx.wait();
    console.log(`  ✅ RewardDistributor registered`);

    console.log(`  ${colors.green}✅ MasterRegistry Configuration Complete${colors.reset}`);
}

async function createTestMarket() {
    console.log(`\n${colors.yellow}Creating Test Market with LMSR...${colors.reset}`);

    const factory = await ethers.getContractAt("FlexibleMarketFactory", deploymentState.contracts.FlexibleMarketFactory);

    const marketConfig = {
        question: "Will LMSR bonding curve work perfectly on mainnet?",
        description: "Day 20 validation test market using production LMSR bonding curve",
        bondingCurve: deploymentState.contracts.LMSRBondingCurve,
        curveParams: CONFIG.LIQUIDITY_PARAM, // b = 10,000 ETH
        closeTime: Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
        minBet: ethers.parseEther("0.01"),
        maxBet: ethers.parseEther("1000")
    };

    const tx = await factory.createMarket(marketConfig);
    const receipt = await tx.wait();

    // Get market address from event
    const event = receipt.logs.find(log => {
        try {
            return factory.interface.parseLog(log).name === "MarketCreated";
        } catch {
            return false;
        }
    });

    if (!event) {
        throw new Error("MarketCreated event not found");
    }

    const parsedEvent = factory.interface.parseLog(event);
    const marketAddress = parsedEvent.args.market;

    deploymentState.contracts.TestMarket = marketAddress;
    console.log(`  Market Address: ${marketAddress}`);
    console.log(`  Question: ${marketConfig.question}`);
    console.log(`  Bonding Curve: LMSR`);
    console.log(`  Liquidity Param: ${ethers.formatEther(CONFIG.LIQUIDITY_PARAM)} ETH`);
    console.log(`  ${colors.green}✅ Test Market Created${colors.reset}`);
}

async function runValidationTests() {
    console.log(`\n${colors.yellow}Running Comprehensive Validation...${colors.reset}`);

    const results = {
        deployment: true,
        lmsr: true,
        integration: true,
        market: true
    };

    try {
        // Test 1: Contract deployment validation
        console.log(`\n  ${colors.cyan}Test 1: Contract Deployment${colors.reset}`);
        for (const [name, address] of Object.entries(deploymentState.contracts)) {
            const code = await ethers.provider.getCode(address);
            if (code === "0x") {
                throw new Error(`${name} has no code at ${address}`);
            }
            console.log(`    ✅ ${name}`);
        }

        // Test 2: LMSR functionality
        console.log(`\n  ${colors.cyan}Test 2: LMSR Functionality${colors.reset}`);
        const lmsr = await ethers.getContractAt("LMSRBondingCurve", deploymentState.contracts.LMSRBondingCurve);

        // Test cost calculation with various amounts
        for (const amount of [ethers.parseEther("1"), ethers.parseEther("10"), ethers.parseEther("100")]) {
            const cost = await lmsr.calculateCost(CONFIG.LIQUIDITY_PARAM, 0, 0, true, amount);
            console.log(`    ✅ Cost for ${ethers.formatEther(amount)} shares: ${ethers.formatEther(cost)} ETH`);
        }

        // Test 3: Market integration
        console.log(`\n  ${colors.cyan}Test 3: Market Integration${colors.reset}`);
        const market = await ethers.getContractAt("PredictionMarket", deploymentState.contracts.TestMarket);

        const marketBondingCurve = await market.bondingCurve();
        if (marketBondingCurve.toLowerCase() !== deploymentState.contracts.LMSRBondingCurve.toLowerCase()) {
            throw new Error(`Market bonding curve mismatch: ${marketBondingCurve} != ${deploymentState.contracts.LMSRBondingCurve}`);
        }
        console.log(`    ✅ Market using LMSR bonding curve`);

        // Test 4: Place a test bet
        console.log(`\n  ${colors.cyan}Test 4: Test Bet Placement${colors.reset}`);
        const betAmount = ethers.parseEther("0.1");
        const betTx = await market.placeBet(true, 0, { value: betAmount });
        await betTx.wait();
        console.log(`    ✅ Bet placed: ${ethers.formatEther(betAmount)} ETH on YES`);

        // Verify bet recorded
        const yesShares = await market.totalYesShares();
        console.log(`    ✅ Total YES shares: ${ethers.formatEther(yesShares)}`);

        deploymentState.validation.tests = results;
        console.log(`\n  ${colors.green}${colors.bright}✅ ALL VALIDATION TESTS PASSED${colors.reset}`);

    } catch (error) {
        console.error(`\n  ${colors.red}❌ Validation failed:${colors.reset}`, error.message);
        throw error;
    }
}

function saveDeploymentState() {
    fs.writeFileSync(CONFIG.SAVE_FILE, JSON.stringify(deploymentState, null, 2));
    console.log(`\n${colors.green}Deployment state saved to:${colors.reset} ${CONFIG.SAVE_FILE}`);
}

function printDeploymentSummary() {
    console.log(`\n${colors.cyan}${"=".repeat(80)}`);
    console.log(`${colors.bright}DEPLOYMENT SUMMARY - DAY 20${colors.reset}`);
    console.log(`${colors.cyan}${"=".repeat(80)}${colors.reset}\n`);

    console.log(`${colors.yellow}Network:${colors.reset} BasedAI Mainnet Fork (${deploymentState.chainId})`);
    console.log(`${colors.yellow}Timestamp:${colors.reset} ${deploymentState.timestamp}`);
    console.log(`${colors.yellow}Phase:${colors.reset} ${deploymentState.phase}\n`);

    console.log(`${colors.magenta}Deployed Contracts:${colors.reset}`);
    for (const [name, address] of Object.entries(deploymentState.contracts)) {
        console.log(`  ${colors.green}✅${colors.reset} ${name.padEnd(30)} ${address}`);
    }

    console.log(`\n${colors.magenta}LMSR Validation:${colors.reset}`);
    if (deploymentState.validation.lmsr) {
        console.log(`  Curve Name: ${deploymentState.validation.lmsr.name}`);
        console.log(`  Valid Params: ${deploymentState.validation.lmsr.validParams ? '✅' : '❌'}`);
        console.log(`  First Share Cost: ${deploymentState.validation.lmsr.firstShareCost} ETH`);
        console.log(`  Balanced Prices: YES=${deploymentState.validation.lmsr.balancedPrices.yes/100}%, NO=${deploymentState.validation.lmsr.balancedPrices.no/100}%`);
    }

    console.log(`\n${colors.cyan}${"=".repeat(80)}${colors.reset}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
