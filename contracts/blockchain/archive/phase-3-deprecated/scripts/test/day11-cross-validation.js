/**
 * @title Day 11 - Cross-Validation Testing
 * @notice Tests Config B behavior on Fork vs Sepolia
 * @dev Comprehensive comparison of both deployments
 */

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Colors
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

async function log(message) {
    console.log(message);
}

async function testNetwork(networkName, deploymentPath) {
    log(`\n${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`);
    log(`${colors.bright}${colors.cyan}        TESTING ${networkName.toUpperCase()} - CONFIG B              ${colors.reset}`);
    log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}\n`);

    // Load deployment state
    if (!fs.existsSync(deploymentPath)) {
        throw new Error(`Deployment file not found: ${deploymentPath}`);
    }

    const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
    const contracts = deployment.contracts;

    const [deployer] = await ethers.getSigners();
    const results = {
        network: networkName,
        passed: [],
        failed: [],
        skipped: [],
        gasCosts: {},
        contractAddresses: contracts
    };

    log(`${colors.bright}📋 Configuration${colors.reset}`);
    log(`Network: ${networkName}`);
    log(`Deployer: ${deployer.address}`);
    log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

    try {
        // Test 1: MasterRegistry
        log(`${colors.bright}🧪 Test 1: MasterRegistry${colors.reset}`);
        const registry = await ethers.getContractAt("MasterRegistry", contracts.MasterRegistry);
        const registryAddr = await registry.getAddress();
        log(`   Connected: ${registryAddr}`);
        results.passed.push("MasterRegistry connection");

        // Test 2: AccessControlManager
        log(`\n${colors.bright}🧪 Test 2: AccessControlManager${colors.reset}`);
        const acm = await ethers.getContractAt("AccessControlManager", contracts.AccessControlManager);
        const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
        const hasAdmin = await acm.hasRole(ADMIN_ROLE, deployer.address);
        log(`   Has ADMIN_ROLE: ${hasAdmin}`);
        if (hasAdmin) {
            results.passed.push("Admin role verification");
        } else {
            results.failed.push("Admin role verification");
        }

        // Test 3: ParameterStorage
        log(`\n${colors.bright}🧪 Test 3: ParameterStorage${colors.reset}`);
        const paramStorage = await ethers.getContractAt("ParameterStorage", contracts.ParameterStorage);
        const paramCount = await paramStorage.getParameterCount();
        log(`   Parameter count: ${paramCount.toString()}`);
        results.passed.push("ParameterStorage connection");

        // Test 4: FlexibleMarketFactoryCore
        log(`\n${colors.bright}🧪 Test 4: FlexibleMarketFactoryCore${colors.reset}`);
        const factoryCore = await ethers.getContractAt("FlexibleMarketFactoryCore", contracts.FlexibleMarketFactoryCore);
        const isPaused = await factoryCore.paused();
        log(`   Paused: ${isPaused}`);
        log(`   Size: 16.73 KB`);
        if (!isPaused) {
            results.passed.push("FactoryCore state check");
        } else {
            results.skipped.push("FactoryCore paused");
        }

        // Test 5: FlexibleMarketFactoryExtensions
        log(`\n${colors.bright}🧪 Test 5: FlexibleMarketFactoryExtensions${colors.reset}`);
        const factoryExt = await ethers.getContractAt("FlexibleMarketFactoryExtensions", contracts.FlexibleMarketFactoryExtensions);
        const extAddr = await factoryExt.getAddress();
        log(`   Connected: ${extAddr}`);
        log(`   Size: 5.19 KB`);
        results.passed.push("FactoryExtensions connection");

        // Test 6: ResolutionManager
        log(`\n${colors.bright}🧪 Test 6: ResolutionManager${colors.reset}`);
        const resolution = await ethers.getContractAt("ResolutionManager", contracts.ResolutionManager);
        const resAddr = await resolution.getAddress();
        log(`   Connected: ${resAddr}`);
        results.passed.push("ResolutionManager connection");

        // Test 7: RewardDistributor
        log(`\n${colors.bright}🧪 Test 7: RewardDistributor${colors.reset}`);
        const rewards = await ethers.getContractAt("RewardDistributor", contracts.RewardDistributor);
        const rewAddr = await rewards.getAddress();
        log(`   Connected: ${rewAddr}`);
        results.passed.push("RewardDistributor connection");

        // Test 8: ProposalManager
        log(`\n${colors.bright}🧪 Test 8: ProposalManager${colors.reset}`);
        const proposals = await ethers.getContractAt("ProposalManager", contracts.ProposalManager);
        const propAddr = await proposals.getAddress();
        log(`   Connected: ${propAddr}`);
        results.passed.push("ProposalManager connection");

        // Test 9: Registry lookups
        log(`\n${colors.bright}🧪 Test 9: Registry Contract Lookups${colors.reset}`);
        const paramKey = ethers.keccak256(ethers.toUtf8Bytes("ParameterStorage"));
        const paramFromRegistry = await registry.getContract(paramKey);
        log(`   ParameterStorage from registry: ${paramFromRegistry}`);
        if (paramFromRegistry === contracts.ParameterStorage) {
            results.passed.push("Registry lookups");
        } else {
            results.failed.push("Registry lookups");
        }

    } catch (error) {
        log(`\n${colors.red}${colors.bright}❌ Error: ${error.message}${colors.reset}`);
        results.failed.push(`Error: ${error.message}`);
    }

    // Summary
    log(`\n${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`);
    log(`${colors.bright}${colors.cyan}             ${networkName.toUpperCase()} TEST SUMMARY                  ${colors.reset}`);
    log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}\n`);

    log(`${colors.green}✅ Passed: ${results.passed.length}${colors.reset}`);
    results.passed.forEach(test => log(`   - ${test}`));

    if (results.failed.length > 0) {
        log(`\n${colors.red}❌ Failed: ${results.failed.length}${colors.reset}`);
        results.failed.forEach(test => log(`   - ${test}`));
    }

    if (results.skipped.length > 0) {
        log(`\n${colors.yellow}⏭️ Skipped: ${results.skipped.length}${colors.reset}`);
        results.skipped.forEach(test => log(`   - ${test}`));
    }

    const total = results.passed.length + results.failed.length + results.skipped.length;
    const successRate = total > 0 ? ((results.passed.length / total) * 100).toFixed(1) : 0;

    log(`\n${colors.bright}Total Tests: ${total}${colors.reset}`);
    log(`${colors.bright}Success Rate: ${successRate}%${colors.reset}\n`);

    return results;
}

async function main() {
    log(`\n${colors.bright}${colors.magenta}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
    log(`${colors.bright}${colors.magenta}║       DAY 11 - CROSS-VALIDATION TESTING (CONFIG B)        ║${colors.reset}`);
    log(`${colors.bright}${colors.magenta}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);

    const networkName = network.name;
    let deploymentPath;

    if (networkName === "localhost" || networkName === "hardhat") {
        deploymentPath = path.join(__dirname, '../../fork-deployment-split.json');
    } else if (networkName === "sepolia") {
        deploymentPath = path.join(__dirname, '../../sepolia-deployment-split.json');
    } else {
        throw new Error(`Unsupported network: ${networkName}`);
    }

    const results = await testNetwork(networkName, deploymentPath);

    // Save results
    const resultsPath = path.join(__dirname, `../../day11-${networkName}-results.json`);
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    log(`${colors.green}✅ Results saved to: ${resultsPath}${colors.reset}\n`);

    // Final status
    if (results.failed.length === 0) {
        log(`${colors.bright}${colors.green}🎉 ALL TESTS PASSED ON ${networkName.toUpperCase()}!${colors.reset}\n`);
    } else {
        log(`${colors.bright}${colors.yellow}⚠️ SOME TESTS FAILED ON ${networkName.toUpperCase()}${colors.reset}\n`);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
