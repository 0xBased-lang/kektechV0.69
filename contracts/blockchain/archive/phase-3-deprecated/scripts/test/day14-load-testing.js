/**
 * @title Day 14 - Load Testing & Performance Validation
 * @notice Tests market creation under load conditions
 * @dev Comprehensive performance and scalability testing
 */

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// ANSI color codes
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(message) {
  log("\n" + "═".repeat(60), "cyan");
  log(`   ${message}`, "cyan");
  log("═".repeat(60) + "\n", "cyan");
}

async function main() {
  const network = hre.network.name;
  const [deployer] = await ethers.getSigners();

  log("\n╔════════════════════════════════════════════════════════════╗", "magenta");
  log("║         DAY 14 - LOAD TESTING & PERFORMANCE              ║", "magenta");
  log("╚════════════════════════════════════════════════════════════╝\n", "magenta");

  header(`DAY 14 - LOAD TESTING (${network.toUpperCase()})`);

  log(`${colors.bright}📋 Configuration${colors.reset}`);
  log(`Network: ${network}`);
  log(`Deployer: ${deployer.address}`);
  const initialBalance = await ethers.provider.getBalance(deployer.address);
  log(`Initial Balance: ${ethers.formatEther(initialBalance)} ETH`);

  // Load deployment addresses
  let deploymentFile = path.join(__dirname, `../../${network}-deployment-split.json`);
  if (!fs.existsSync(deploymentFile) && network === "localhost") {
    deploymentFile = path.join(__dirname, `../../fork-deployment-split.json`);
  }
  if (!fs.existsSync(deploymentFile)) {
    throw new Error(`Deployment file not found: ${deploymentFile}`);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  const factoryAddress = deployment.core?.FlexibleMarketFactoryCore || deployment.contracts?.FlexibleMarketFactoryCore;
  if (!factoryAddress) {
    throw new Error("FlexibleMarketFactoryCore address not found");
  }

  const factory = await ethers.getContractAt("FlexibleMarketFactoryCore", factoryAddress);
  const minCreatorBond = await factory.minCreatorBond();
  log(`Min Creator Bond: ${ethers.formatEther(minCreatorBond)} ETH\n`);

  // Performance tracking
  const results = {
    network,
    initialBalance: ethers.formatEther(initialBalance),
    marketsCreated: [],
    gasUsed: [],
    timings: [],
    errors: [],
    totalGas: 0n,
    avgGas: 0,
    minGas: 0,
    maxGas: 0,
    totalTime: 0,
    avgTime: 0
  };

  // ========================================================================
  // TEST 1: RAPID MARKET CREATION (10 MARKETS)
  // ========================================================================
  header("TEST 1: RAPID MARKET CREATION");

  log(`Creating 10 markets rapidly...`, "yellow");
  const startTime = Date.now();

  for (let i = 0; i < 10; i++) {
    try {
      const marketStartTime = Date.now();

      const config = {
        question: `Load Test Market ${i + 1} - Will this perform well?`,
        description: `Performance testing market number ${i + 1}`,
        outcome1: "Yes",
        outcome2: "No",
        resolutionTime: Math.floor(Date.now() / 1000) + 86400, // 1 day
        category: ethers.id("load-test"),
        creatorBond: minCreatorBond
      };

      log(`\n${colors.bright}Market ${i + 1}/10${colors.reset}`);
      log(`   Creating...`);

      const tx = await factory.createMarket(config, { value: minCreatorBond });
      const receipt = await tx.wait();

      const marketEndTime = Date.now();
      const timeTaken = marketEndTime - marketStartTime;

      // Extract market address from event
      const marketCreatedEvent = receipt.logs.find(
        log => log.topics[0] === ethers.id("MarketCreated(address,address,string,uint256,uint256,bytes32,uint256)")
      );
      const marketAddress = marketCreatedEvent ? ethers.getAddress("0x" + marketCreatedEvent.topics[1].slice(26)) : "Unknown";

      log(`   ✅ Created: ${marketAddress}`, "green");
      log(`   Gas Used: ${receipt.gasUsed.toString()}`);
      log(`   Time: ${timeTaken}ms`);

      results.marketsCreated.push(marketAddress);
      results.gasUsed.push(receipt.gasUsed.toString());
      results.timings.push(timeTaken);
      results.totalGas += receipt.gasUsed;
      results.totalTime += timeTaken;

    } catch (error) {
      log(`   ❌ Failed: ${error.message.split('\n')[0]}`, "red");
      results.errors.push(`Market ${i + 1}: ${error.message}`);
    }
  }

  const endTime = Date.now();
  const totalDuration = endTime - startTime;

  // ========================================================================
  // TEST 2: GAS COST ANALYSIS
  // ========================================================================
  header("TEST 2: GAS COST ANALYSIS");

  if (results.gasUsed.length > 0) {
    const gasValues = results.gasUsed.map(g => BigInt(g));
    results.minGas = Number(gasValues.reduce((min, g) => g < min ? g : min));
    results.maxGas = Number(gasValues.reduce((max, g) => g > max ? g : max));
    results.avgGas = Number(results.totalGas) / results.gasUsed.length;

    log(`Total Markets Created: ${results.marketsCreated.length}`);
    log(`Total Gas Used: ${results.totalGas.toString()}`);
    log(`Average Gas: ${Math.floor(results.avgGas).toLocaleString()}`);
    log(`Min Gas: ${results.minGas.toLocaleString()}`);
    log(`Max Gas: ${results.maxGas.toLocaleString()}`);
    log(`Gas Variance: ${(results.maxGas - results.minGas).toLocaleString()} (${((results.maxGas - results.minGas) / results.avgGas * 100).toFixed(2)}%)`);
  }

  // ========================================================================
  // TEST 3: TIMING ANALYSIS
  // ========================================================================
  header("TEST 3: TIMING ANALYSIS");

  if (results.timings.length > 0) {
    results.avgTime = results.totalTime / results.timings.length;
    const minTime = Math.min(...results.timings);
    const maxTime = Math.max(...results.timings);

    log(`Total Duration: ${totalDuration.toLocaleString()}ms (${(totalDuration / 1000).toFixed(2)}s)`);
    log(`Average Time per Market: ${Math.floor(results.avgTime).toLocaleString()}ms`);
    log(`Min Time: ${minTime.toLocaleString()}ms`);
    log(`Max Time: ${maxTime.toLocaleString()}ms`);
    log(`Markets per Second: ${(results.marketsCreated.length / (totalDuration / 1000)).toFixed(2)}`);
  }

  // ========================================================================
  // TEST 4: COST ANALYSIS
  // ========================================================================
  header("TEST 4: COST ANALYSIS");

  const finalBalance = await ethers.provider.getBalance(deployer.address);
  const totalSpent = initialBalance - finalBalance;

  log(`Initial Balance: ${ethers.formatEther(initialBalance)} ETH`);
  log(`Final Balance: ${ethers.formatEther(finalBalance)} ETH`);
  log(`Total Spent: ${ethers.formatEther(totalSpent)} ETH`);

  if (results.marketsCreated.length > 0) {
    const costPerMarket = totalSpent / BigInt(results.marketsCreated.length);
    log(`Cost per Market: ${ethers.formatEther(costPerMarket)} ETH`);

    // Estimate mainnet costs at different gas prices
    log(`\n${colors.bright}Mainnet Cost Estimates:${colors.reset}`);
    const gasPerMarket = results.avgGas;
    const gweiPrices = [1, 5, 10, 20, 50];

    for (const gwei of gweiPrices) {
      const costWei = BigInt(Math.floor(gasPerMarket)) * BigInt(gwei) * BigInt(1e9);
      log(`   At ${gwei} gwei: ${ethers.formatEther(costWei)} ETH (~$${(parseFloat(ethers.formatEther(costWei)) * 2000).toFixed(2)} @ $2000/ETH)`);
    }
  }

  // ========================================================================
  // TEST 5: SYSTEM STATE VALIDATION
  // ========================================================================
  header("TEST 5: SYSTEM STATE VALIDATION");

  try {
    // Verify factory is still operational
    const isPaused = await factory.paused();
    log(`Factory Status: ${isPaused ? '⚠️ Paused' : '✅ Active'}`);

    // Verify a sample market
    if (results.marketsCreated.length > 0) {
      const sampleMarket = results.marketsCreated[0];
      const market = await ethers.getContractAt("PredictionMarket", sampleMarket);
      const creator = await market.creator();
      log(`Sample Market Creator: ${creator}`);
      log(`Creator Matches: ${creator === deployer.address ? '✅ Yes' : '❌ No'}`);
      log(`Total Markets Created: ${results.marketsCreated.length}`);
    }
  } catch (error) {
    log(`❌ Validation Error: ${error.message}`, "red");
    results.errors.push(`Validation: ${error.message}`);
  }

  // ========================================================================
  // SUMMARY
  // ========================================================================
  header("TEST SUMMARY");

  log(`${colors.bright}Performance Metrics:${colors.reset}`);
  log(`✅ Markets Created: ${results.marketsCreated.length}/10 (${(results.marketsCreated.length / 10 * 100).toFixed(0)}%)`);
  log(`⚡ Average Gas: ${Math.floor(results.avgGas).toLocaleString()}`);
  log(`⏱️  Average Time: ${Math.floor(results.avgTime).toLocaleString()}ms`);
  log(`💰 Total Cost: ${ethers.formatEther(totalSpent)} ETH`);

  if (results.errors.length > 0) {
    log(`\n${colors.bright}Errors: ${results.errors.length}${colors.reset}`, "red");
    results.errors.forEach((error, i) => log(`   ${i + 1}. ${error}`, "red"));
  }

  log(`\n${colors.bright}Performance Rating:${colors.reset}`);
  const successRate = results.marketsCreated.length / 10 * 100;
  if (successRate === 100) {
    log(`🏆 EXCELLENT - 100% success rate!`, "green");
  } else if (successRate >= 90) {
    log(`✅ GOOD - ${successRate}% success rate`, "green");
  } else if (successRate >= 75) {
    log(`⚠️ FAIR - ${successRate}% success rate`, "yellow");
  } else {
    log(`❌ POOR - ${successRate}% success rate`, "red");
  }

  // Save results (convert BigInt to string for JSON)
  const resultsFile = path.join(__dirname, `../../day14-${network}-results.json`);
  const resultsToSave = {
    ...results,
    totalGas: results.totalGas.toString(),
    totalSpent: totalSpent.toString(),
    finalBalance: finalBalance.toString()
  };
  fs.writeFileSync(resultsFile, JSON.stringify(resultsToSave, null, 2));
  log(`\n${colors.green}✅ Results saved to: ${resultsFile}${colors.reset}`);

  if (results.marketsCreated.length === 10 && results.errors.length === 0) {
    log(`\n${colors.bright}${colors.green}🎉 PERFECT LOAD TEST - ALL 10 MARKETS CREATED!${colors.reset}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
