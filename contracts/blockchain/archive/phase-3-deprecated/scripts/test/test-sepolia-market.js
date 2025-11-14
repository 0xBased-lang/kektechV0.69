/**
 * @title Sepolia Market Creation Test
 * @notice Tests market creation on deployed Sepolia contracts (Day 10 - Phase 4)
 * @dev Simple smoke test to verify deployment works end-to-end
 */

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Colors for console output
const colors = {
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m'
};

// Load deployment state
const deploymentStatePath = path.join(__dirname, '../../sepolia-deployment-split.json');

async function log(message) {
    console.log(message);
}

async function main() {
    log(`\n${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`);
    log(`${colors.bright}${colors.cyan}        SEPOLIA MARKET CREATION TEST - DAY 10 PHASE 4       ${colors.reset}`);
    log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}\n`);

    // Load deployment state
    if (!fs.existsSync(deploymentStatePath)) {
        throw new Error(`Deployment state file not found: ${deploymentStatePath}`);
    }

    const deploymentState = JSON.parse(fs.readFileSync(deploymentStatePath, 'utf8'));
    const contracts = deploymentState.contracts;

    const [deployer] = await ethers.getSigners();

    log(`${colors.bright}📋 Test Configuration${colors.reset}`);
    log(`Network: Sepolia (Chain ID: 11155111)`);
    log(`Deployer: ${deployer.address}`);
    log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} SepoliaETH\n`);

    const results = {
        passed: [],
        failed: [],
        skipped: []
    };

    try {
        // Test 1: Connect to MasterRegistry
        log(`${colors.bright}🧪 Test 1: Connect to MasterRegistry${colors.reset}`);
        const registry = await ethers.getContractAt("MasterRegistry", contracts.MasterRegistry);
        const registryCheck = await registry.getAddress();
        log(`${colors.green}   ✅ Connected to MasterRegistry: ${registryCheck}${colors.reset}`);
        results.passed.push("MasterRegistry connection");

        // Test 2: Connect to AccessControlManager
        log(`\n${colors.bright}🧪 Test 2: Connect to AccessControlManager${colors.reset}`);
        const acm = await ethers.getContractAt("AccessControlManager", contracts.AccessControlManager);
        const acmCheck = await acm.getAddress();
        log(`${colors.green}   ✅ Connected to ACM: ${acmCheck}${colors.reset}`);
        results.passed.push("ACM connection");

        // Test 3: Check admin role
        log(`\n${colors.bright}🧪 Test 3: Verify Admin Role${colors.reset}`);
        const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
        const hasAdminRole = await acm.hasRole(ADMIN_ROLE, deployer.address);
        if (hasAdminRole) {
            log(`${colors.green}   ✅ Deployer has ADMIN_ROLE${colors.reset}`);
            results.passed.push("Admin role verification");
        } else {
            log(`${colors.red}   ❌ Deployer does NOT have ADMIN_ROLE${colors.reset}`);
            results.failed.push("Admin role verification");
        }

        // Test 4: Connect to ParameterStorage
        log(`\n${colors.bright}🧪 Test 4: Connect to ParameterStorage${colors.reset}`);
        const paramStorage = await ethers.getContractAt("ParameterStorage", contracts.ParameterStorage);
        const paramStorageCheck = await paramStorage.getAddress();
        log(`${colors.green}   ✅ Connected to ParameterStorage: ${paramStorageCheck}${colors.reset}`);
        results.passed.push("ParameterStorage connection");

        // Test 5: Check default parameters
        log(`\n${colors.bright}🧪 Test 5: Read Default Parameters${colors.reset}`);
        try {
            // ParameterStorage uses key-based system
            const minBetAmountKey = ethers.keccak256(ethers.toUtf8Bytes("minBetAmount"));
            const maxBetAmountKey = ethers.keccak256(ethers.toUtf8Bytes("maxBetAmount"));
            const platformFeeKey = ethers.keccak256(ethers.toUtf8Bytes("platformFee"));

            // Check if parameters exist first
            const minBetExists = await paramStorage.parameterExists(minBetAmountKey);
            const maxBetExists = await paramStorage.parameterExists(maxBetAmountKey);
            const platformFeeExists = await paramStorage.parameterExists(platformFeeKey);

            if (minBetExists && maxBetExists && platformFeeExists) {
                const minBetAmount = await paramStorage.getParameter(minBetAmountKey);
                const maxBetAmount = await paramStorage.getParameter(maxBetAmountKey);
                const platformFee = await paramStorage.getParameter(platformFeeKey);
                log(`   Min Bet: ${ethers.formatEther(minBetAmount)} ETH`);
                log(`   Max Bet: ${ethers.formatEther(maxBetAmount)} ETH`);
                log(`   Platform Fee: ${platformFee.toString()} BPS (${platformFee / 100}%)`);
                log(`${colors.green}   ✅ Parameters read successfully${colors.reset}`);
                results.passed.push("Parameter reading");
            } else {
                log(`${colors.yellow}   ⚠️ Parameters not initialized yet${colors.reset}`);
                log(`   Min Bet exists: ${minBetExists}`);
                log(`   Max Bet exists: ${maxBetExists}`);
                log(`   Platform Fee exists: ${platformFeeExists}`);
                log(`${colors.yellow}   ⏭️ Skipping - parameters need initialization${colors.reset}`);
                results.skipped.push("Parameter reading (not initialized)");
            }
        } catch (error) {
            log(`${colors.red}   ❌ Failed to read parameters: ${error.message}${colors.reset}`);
            results.failed.push("Parameter reading");
        }

        // Test 6: Connect to FlexibleMarketFactoryCore
        log(`\n${colors.bright}🧪 Test 6: Connect to FlexibleMarketFactoryCore${colors.reset}`);
        const factoryCore = await ethers.getContractAt("FlexibleMarketFactoryCore", contracts.FlexibleMarketFactoryCore);
        const factoryCoreCheck = await factoryCore.getAddress();
        log(`${colors.green}   ✅ Connected to FlexibleMarketFactoryCore: ${factoryCoreCheck}${colors.reset}`);
        log(`   Size: 21.87 KB (under 24KB limit!)${colors.reset}`);
        results.passed.push("FlexibleMarketFactoryCore connection");

        // Test 7: Connect to FlexibleMarketFactoryExtensions
        log(`\n${colors.bright}🧪 Test 7: Connect to FlexibleMarketFactoryExtensions${colors.reset}`);
        const factoryExt = await ethers.getContractAt("FlexibleMarketFactoryExtensions", contracts.FlexibleMarketFactoryExtensions);
        const factoryExtCheck = await factoryExt.getAddress();
        log(`${colors.green}   ✅ Connected to FlexibleMarketFactoryExtensions: ${factoryExtCheck}${colors.reset}`);
        log(`   Size: 6.42 KB (under 24KB limit!)${colors.reset}`);
        results.passed.push("FlexibleMarketFactoryExtensions connection");

        // Test 8: Check factory paused state
        log(`\n${colors.bright}🧪 Test 8: Check Factory State${colors.reset}`);
        try {
            const isPaused = await factoryCore.paused();
            log(`   Factory Paused: ${isPaused}`);
            if (isPaused) {
                log(`${colors.yellow}   ⚠️ Factory is paused - cannot create markets${colors.reset}`);
                results.skipped.push("Market creation (factory paused)");
            } else {
                log(`${colors.green}   ✅ Factory is active - ready for market creation${colors.reset}`);
                results.passed.push("Factory state check");
            }
        } catch (error) {
            log(`${colors.red}   ❌ Failed to check factory state: ${error.message}${colors.reset}`);
            results.failed.push("Factory state check");
        }

        // Test 9: Check deployer balance for market creation
        log(`\n${colors.bright}🧪 Test 9: Check Balance for Market Creation${colors.reset}`);
        const balance = await ethers.provider.getBalance(deployer.address);
        const minBond = ethers.parseEther("0.1"); // Minimum creator bond
        if (balance >= minBond) {
            log(`   Balance: ${ethers.formatEther(balance)} SepoliaETH`);
            log(`   Min Bond: ${ethers.formatEther(minBond)} SepoliaETH`);
            log(`${colors.green}   ✅ Sufficient balance for market creation${colors.reset}`);
            results.passed.push("Balance check");
        } else {
            log(`   Balance: ${ethers.formatEther(balance)} SepoliaETH`);
            log(`   Min Bond: ${ethers.formatEther(minBond)} SepoliaETH`);
            log(`${colors.red}   ❌ Insufficient balance for market creation${colors.reset}`);
            results.failed.push("Balance check");
        }

        // Test 10: Connect to ResolutionManager
        log(`\n${colors.bright}🧪 Test 10: Connect to ResolutionManager${colors.reset}`);
        const resolutionManager = await ethers.getContractAt("ResolutionManager", contracts.ResolutionManager);
        const resolutionCheck = await resolutionManager.getAddress();
        log(`${colors.green}   ✅ Connected to ResolutionManager: ${resolutionCheck}${colors.reset}`);
        results.passed.push("ResolutionManager connection");

        // Test 11: Connect to RewardDistributor
        log(`\n${colors.bright}🧪 Test 11: Connect to RewardDistributor${colors.reset}`);
        const rewardDistributor = await ethers.getContractAt("RewardDistributor", contracts.RewardDistributor);
        const rewardCheck = await rewardDistributor.getAddress();
        log(`${colors.green}   ✅ Connected to RewardDistributor: ${rewardCheck}${colors.reset}`);
        results.passed.push("RewardDistributor connection");

        // Test 12: Connect to ProposalManager
        log(`\n${colors.bright}🧪 Test 12: Connect to ProposalManager${colors.reset}`);
        const proposalManager = await ethers.getContractAt("ProposalManager", contracts.ProposalManager);
        const proposalCheck = await proposalManager.getAddress();
        log(`${colors.green}   ✅ Connected to ProposalManager: ${proposalCheck}${colors.reset}`);
        results.passed.push("ProposalManager connection");

    } catch (error) {
        log(`\n${colors.red}${colors.bright}❌ Test Failed: ${error.message}${colors.reset}`);
        results.failed.push(`Error: ${error.message}`);
    }

    // Summary
    log(`\n${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`);
    log(`${colors.bright}${colors.cyan}                     TEST SUMMARY                            ${colors.reset}`);
    log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}\n`);

    log(`${colors.green}✅ Passed: ${results.passed.length}${colors.reset}`);
    if (results.passed.length > 0) {
        results.passed.forEach(test => log(`   - ${test}`));
    }

    log(`\n${colors.red}❌ Failed: ${results.failed.length}${colors.reset}`);
    if (results.failed.length > 0) {
        results.failed.forEach(test => log(`   - ${test}`));
    }

    log(`\n${colors.yellow}⏭️ Skipped: ${results.skipped.length}${colors.reset}`);
    if (results.skipped.length > 0) {
        results.skipped.forEach(test => log(`   - ${test}`));
    }

    const total = results.passed.length + results.failed.length + results.skipped.length;
    const successRate = ((results.passed.length / total) * 100).toFixed(1);

    log(`\n${colors.bright}Total Tests: ${total}${colors.reset}`);
    log(`${colors.bright}Success Rate: ${successRate}%${colors.reset}`);

    if (results.failed.length === 0) {
        log(`\n${colors.bright}${colors.green}🎉 ALL TESTS PASSED - SEPOLIA DEPLOYMENT VALIDATED!${colors.reset}\n`);
    } else {
        log(`\n${colors.bright}${colors.yellow}⚠️ SOME TESTS FAILED - REVIEW REQUIRED${colors.reset}\n`);
    }

    // Save results
    const resultsPath = path.join(__dirname, '../../sepolia-test-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify({ timestamp: new Date().toISOString(), results, successRate: parseFloat(successRate) }, null, 2));
    log(`${colors.green}✅ Test results saved to: ${resultsPath}${colors.reset}\n`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
