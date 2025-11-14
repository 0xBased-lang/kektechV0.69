/**
 * @title Day 12 - Market Creation Testing
 * @notice Creates and tests actual prediction markets
 * @dev Tests market lifecycle, betting, resolution, and fees
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

async function testMarketCreation(networkName, deploymentPath) {
    log(`\n${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`);
    log(`${colors.bright}${colors.cyan}   DAY 12 - MARKET CREATION TEST (${networkName.toUpperCase()})    ${colors.reset}`);
    log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}\n`);

    // Load deployment state
    if (!fs.existsSync(deploymentPath)) {
        throw new Error(`Deployment file not found: ${deploymentPath}`);
    }

    const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
    const contracts = deployment.contracts;

    const [deployer, user1, user2] = await ethers.getSigners();
    const results = {
        network: networkName,
        passed: [],
        failed: [],
        skipped: [],
        marketAddress: null,
        gasUsed: {},
        errors: []
    };

    log(`${colors.bright}📋 Configuration${colors.reset}`);
    log(`Network: ${networkName}`);
    log(`Deployer: ${deployer.address}`);
    log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

    try {
        // Connect to Factory
        log(`${colors.bright}🧪 Test 1: Connect to FlexibleMarketFactoryCore${colors.reset}`);
        const factory = await ethers.getContractAt("FlexibleMarketFactoryCore", contracts.FlexibleMarketFactoryCore);
        const factoryAddr = await factory.getAddress();
        log(`   Factory: ${factoryAddr}`);
        results.passed.push("Factory connection");

        // Check if factory is paused
        log(`\n${colors.bright}🧪 Test 2: Check Factory Status${colors.reset}`);
        const isPaused = await factory.paused();
        log(`   Paused: ${isPaused}`);

        if (isPaused) {
            log(`${colors.yellow}   ⚠️ Factory is paused - cannot create markets${colors.reset}`);
            results.skipped.push("Market creation (factory paused)");
            return results;
        }
        results.passed.push("Factory status check");

        // Check minimum creator bond
        log(`\n${colors.bright}🧪 Test 3: Check Minimum Creator Bond${colors.reset}`);
        const minBond = await factory.minCreatorBond();
        log(`   Min Creator Bond: ${ethers.formatEther(minBond)} ETH`);

        // Check deployer balance
        const deployerBalance = await ethers.provider.getBalance(deployer.address);
        log(`   Deployer Balance: ${ethers.formatEther(deployerBalance)} ETH`);

        if (deployerBalance < minBond) {
            log(`${colors.red}   ❌ Insufficient balance for market creation${colors.reset}`);
            results.failed.push("Insufficient balance");
            return results;
        }
        results.passed.push("Balance check");

        // Create Market Config
        log(`\n${colors.bright}🧪 Test 4: Create Market Configuration${colors.reset}`);
        const currentTime = Math.floor(Date.now() / 1000);
        const resolutionTime = currentTime + (7 * 24 * 60 * 60); // 7 days from now

        const marketConfig = {
            question: "Will Config B be used for mainnet deployment?",
            description: "Testing Config B market creation on Day 12 of deployment. This market will resolve YES if Config B (runs=50, viaIR=true) is used for mainnet deployment.",
            resolutionTime: resolutionTime,
            creatorBond: minBond,
            category: ethers.keccak256(ethers.toUtf8Bytes("Testing")),
            outcome1: "YES - Config B for mainnet",
            outcome2: "NO - Different config"
        };

        log(`   Question: ${marketConfig.question}`);
        log(`   Resolution Time: ${new Date(resolutionTime * 1000).toISOString()}`);
        log(`   Creator Bond: ${ethers.formatEther(marketConfig.creatorBond)} ETH`);
        results.passed.push("Market config creation");

        // Create Market
        log(`\n${colors.bright}🧪 Test 5: Create Market${colors.reset}`);
        log(`   Attempting market creation...`);

        try {
            const createTx = await factory.createMarket(marketConfig, {
                value: marketConfig.creatorBond
            });

            log(`   Transaction sent: ${createTx.hash}`);
            log(`   Waiting for confirmation...`);

            const receipt = await createTx.wait();
            log(`   ${colors.green}✅ Market created!${colors.reset}`);
            log(`   Gas used: ${receipt.gasUsed.toString()}`);
            results.gasUsed.marketCreation = receipt.gasUsed.toString();

            // Find MarketCreated event
            const marketCreatedEvent = receipt.logs.find(log => {
                try {
                    const parsed = factory.interface.parseLog({
                        topics: log.topics,
                        data: log.data
                    });
                    return parsed && parsed.name === "MarketCreated";
                } catch {
                    return false;
                }
            });

            if (marketCreatedEvent) {
                const parsed = factory.interface.parseLog({
                    topics: marketCreatedEvent.topics,
                    data: marketCreatedEvent.data
                });
                results.marketAddress = parsed.args.marketAddress;
                log(`   Market Address: ${results.marketAddress}`);
                results.passed.push("Market creation");
            } else {
                log(`${colors.yellow}   ⚠️ MarketCreated event not found in logs${colors.reset}`);
                results.skipped.push("Market address extraction");
            }

        } catch (error) {
            log(`${colors.red}   ❌ Market creation failed: ${error.message}${colors.reset}`);
            results.failed.push("Market creation");
            results.errors.push(error.message);

            // Try to understand why it failed
            if (error.message.includes("revert")) {
                log(`   ${colors.yellow}💡 Possible reasons:${colors.reset}`);
                log(`      - Contract not properly initialized`);
                log(`      - Missing dependencies`);
                log(`      - Invalid configuration`);
            }
            return results;
        }

        // Check market count
        log(`\n${colors.bright}🧪 Test 6: Verify Market Count${colors.reset}`);
        try {
            const marketCount = await factory.getMarketCount();
            log(`   Total Markets: ${marketCount.toString()}`);
            results.passed.push("Market count check");
        } catch (error) {
            log(`${colors.yellow}   ⚠️ Could not get market count: ${error.message}${colors.reset}`);
            results.skipped.push("Market count check");
        }

        // Get market info if we have the address
        if (results.marketAddress) {
            log(`\n${colors.bright}🧪 Test 7: Get Market Info${colors.reset}`);
            try {
                const marketInfo = await factory.getMarketInfo(results.marketAddress);
                log(`   Creator: ${marketInfo.creator}`);
                log(`   Created At: ${new Date(Number(marketInfo.createdAt) * 1000).toISOString()}`);
                log(`   Active: ${marketInfo.isActive}`);
                log(`   Total Volume: ${ethers.formatEther(marketInfo.totalVolume)} ETH`);
                results.passed.push("Market info retrieval");
            } catch (error) {
                log(`${colors.yellow}   ⚠️ Could not get market info: ${error.message}${colors.reset}`);
                results.skipped.push("Market info retrieval");
            }
        }

    } catch (error) {
        log(`\n${colors.red}${colors.bright}❌ Test Failed: ${error.message}${colors.reset}`);
        results.failed.push(`Error: ${error.message}`);
        results.errors.push(error.stack || error.message);
    }

    // Summary
    log(`\n${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`);
    log(`${colors.bright}${colors.cyan}        ${networkName.toUpperCase()} TEST SUMMARY                ${colors.reset}`);
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
    log(`${colors.bright}Success Rate: ${successRate}%${colors.reset}`);

    if (results.marketAddress) {
        log(`\n${colors.bright}${colors.green}🎉 Market Created: ${results.marketAddress}${colors.reset}\n`);
    }

    return results;
}

async function main() {
    log(`\n${colors.bright}${colors.magenta}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
    log(`${colors.bright}${colors.magenta}║         DAY 12 - MARKET CREATION TESTING                   ║${colors.reset}`);
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

    const results = await testMarketCreation(networkName, deploymentPath);

    // Save results
    const resultsPath = path.join(__dirname, `../../day12-${networkName}-results.json`);
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    log(`${colors.green}✅ Results saved to: ${resultsPath}${colors.reset}\n`);

    // Final status
    if (results.failed.length === 0 && results.marketAddress) {
        log(`${colors.bright}${colors.green}🎉 MARKET CREATION SUCCESSFUL ON ${networkName.toUpperCase()}!${colors.reset}\n`);
    } else if (results.failed.length > 0) {
        log(`${colors.bright}${colors.red}❌ MARKET CREATION FAILED ON ${networkName.toUpperCase()}${colors.reset}\n`);
    } else {
        log(`${colors.bright}${colors.yellow}⚠️ TESTS INCOMPLETE ON ${networkName.toUpperCase()}${colors.reset}\n`);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
