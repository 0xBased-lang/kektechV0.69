/**
 * Sepolia Health Check Script
 * Monitors all deployed contracts and markets for health and stability
 * Run every 6 hours during validation period
 */

const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

// ANSI color codes for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m"
};

// Health check thresholds
const THRESHOLDS = {
  gasPrice: ethers.parseUnits("100", "gwei"), // Alert if gas >100 gwei
  blockTime: 30, // Alert if blocks >30 seconds apart
  failureRate: 0.05, // Alert if >5% transaction failure rate
  responseTime: 5000, // Alert if RPC response >5 seconds
};

async function main() {
  console.log(`${colors.cyan}${colors.bright}`);
  console.log("═".repeat(70));
  console.log("🏥 SEPOLIA HEALTH CHECK");
  console.log(`Time: ${new Date().toISOString()}`);
  console.log("═".repeat(70));
  console.log(colors.reset);

  const results = {
    timestamp: new Date().toISOString(),
    network: {},
    contracts: {},
    markets: {},
    issues: [],
    warnings: [],
    recommendations: []
  };

  try {
    // ============================================================================
    // PHASE 1: Network Health
    // ============================================================================
    console.log(`\n${colors.blue}📡 Phase 1: Network Health${colors.reset}`);
    console.log("─".repeat(70));

    const networkStart = Date.now();

    // Check network connectivity
    const provider = ethers.provider;
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();
    const block = await provider.getBlock(blockNumber);
    const gasPrice = (await provider.getFeeData()).gasPrice;

    const networkTime = Date.now() - networkStart;

    results.network = {
      chainId: network.chainId.toString(),
      blockNumber: blockNumber,
      timestamp: block.timestamp,
      gasPrice: ethers.formatUnits(gasPrice, "gwei"),
      responseTime: networkTime
    };

    console.log(`  Chain ID: ${colors.green}${network.chainId}${colors.reset}`);
    console.log(`  Block Number: ${colors.green}${blockNumber}${colors.reset}`);
    console.log(`  Block Timestamp: ${colors.green}${new Date(block.timestamp * 1000).toISOString()}${colors.reset}`);
    console.log(`  Gas Price: ${colors.green}${ethers.formatUnits(gasPrice, "gwei")} gwei${colors.reset}`);
    console.log(`  Response Time: ${colors.green}${networkTime}ms${colors.reset}`);

    // Check gas price
    if (gasPrice > THRESHOLDS.gasPrice) {
      results.warnings.push(`High gas price: ${ethers.formatUnits(gasPrice, "gwei")} gwei`);
      console.log(`  ${colors.yellow}⚠️  Warning: Gas price above threshold${colors.reset}`);
    }

    // Check response time
    if (networkTime > THRESHOLDS.responseTime) {
      results.warnings.push(`Slow RPC response: ${networkTime}ms`);
      console.log(`  ${colors.yellow}⚠️  Warning: RPC response time above threshold${colors.reset}`);
    }

    // ============================================================================
    // PHASE 2: Contract Health
    // ============================================================================
    console.log(`\n${colors.blue}🔧 Phase 2: Contract Health${colors.reset}`);
    console.log("─".repeat(70));

    // Load deployment addresses
    const deploymentDir = path.join(__dirname, "../../deployments/sepolia");
    if (!fs.existsSync(deploymentDir)) {
      console.log(`  ${colors.red}❌ No deployment found${colors.reset}`);
      results.issues.push("No Sepolia deployment found");
      return results;
    }

    const deploymentFiles = fs.readdirSync(deploymentDir)
      .filter(f => f.startsWith("deployment-") && f.endsWith(".json"))
      .sort()
      .reverse();

    if (deploymentFiles.length === 0) {
      console.log(`  ${colors.red}❌ No deployment files found${colors.reset}`);
      results.issues.push("No deployment files in deployments/sepolia/");
      return results;
    }

    const deploymentFile = path.join(deploymentDir, deploymentFiles[0]);
    console.log(`  Using deployment: ${colors.cyan}${deploymentFiles[0]}${colors.reset}`);

    const deployment = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));

    // Check each contract
    const contractNames = [
      "VersionedRegistry",
      "ParameterStorage",
      "AccessControlManager",
      "ResolutionManager",
      "RewardDistributor",
      "LMSRCurve",
      "PredictionMarketTemplate",
      "FlexibleMarketFactoryUnified"
    ];

    for (const name of contractNames) {
      const address = deployment.contracts?.[name];
      if (!address) {
        console.log(`  ${colors.red}❌ ${name}: Not deployed${colors.reset}`);
        results.issues.push(`${name} not found in deployment`);
        continue;
      }

      try {
        const code = await provider.getCode(address);
        if (code === "0x") {
          console.log(`  ${colors.red}❌ ${name}: No code at address${colors.reset}`);
          results.issues.push(`${name} has no code at ${address}`);
        } else {
          console.log(`  ${colors.green}✅ ${name}: ${address}${colors.reset}`);
          results.contracts[name] = {
            address: address,
            codeSize: code.length / 2 - 1, // Convert hex to bytes
            status: "healthy"
          };
        }
      } catch (error) {
        console.log(`  ${colors.red}❌ ${name}: Error checking contract${colors.reset}`);
        results.issues.push(`${name}: ${error.message}`);
      }
    }

    // ============================================================================
    // PHASE 3: Registry Health
    // ============================================================================
    console.log(`\n${colors.blue}📚 Phase 3: Registry Health${colors.reset}`);
    console.log("─".repeat(70));

    const registryAddress = deployment.contracts?.VersionedRegistry;
    if (!registryAddress) {
      console.log(`  ${colors.red}❌ Registry not deployed${colors.reset}`);
      results.issues.push("VersionedRegistry not found");
    } else {
      try {
        const Registry = await ethers.getContractAt("VersionedRegistry", registryAddress);

        // Check registered contracts
        const registeredNames = [
          "PredictionMarket",
          "MarketFactory",
          "ParameterStorage",
          "AccessControlManager",
          "ResolutionManager",
          "RewardDistributor",
          "LMSRCurve"
        ];

        for (const name of registeredNames) {
          try {
            const contractId = ethers.id(name);
            const registeredAddress = await Registry.getContract(contractId);

            if (registeredAddress === ethers.ZeroAddress) {
              console.log(`  ${colors.yellow}⚠️  ${name}: Not registered${colors.reset}`);
              results.warnings.push(`${name} not registered in VersionedRegistry`);
            } else {
              console.log(`  ${colors.green}✅ ${name}: ${registeredAddress}${colors.reset}`);

              // Verify version
              try {
                const version = await Registry.getContractVersion(contractId);
                console.log(`     Version: ${colors.cyan}${version}${colors.reset}`);
              } catch (e) {
                // Version might not be implemented
              }
            }
          } catch (error) {
            console.log(`  ${colors.yellow}⚠️  ${name}: Error checking registration${colors.reset}`);
            results.warnings.push(`${name}: ${error.message}`);
          }
        }
      } catch (error) {
        console.log(`  ${colors.red}❌ Error accessing registry: ${error.message}${colors.reset}`);
        results.issues.push(`Registry error: ${error.message}`);
      }
    }

    // ============================================================================
    // PHASE 4: Market Health
    // ============================================================================
    console.log(`\n${colors.blue}🎯 Phase 4: Market Health${colors.reset}`);
    console.log("─".repeat(70));

    const factoryAddress = deployment.contracts?.FlexibleMarketFactoryUnified;
    if (!factoryAddress) {
      console.log(`  ${colors.yellow}⚠️  Factory not deployed${colors.reset}`);
      results.warnings.push("Factory not deployed - cannot check markets");
    } else {
      try {
        const Factory = await ethers.getContractAt("FlexibleMarketFactoryUnified", factoryAddress);

        // Get market count (if available)
        try {
          const marketCount = await Factory.getTotalMarkets();
          console.log(`  Total Markets: ${colors.cyan}${marketCount}${colors.reset}`);

          if (marketCount === 0n) {
            console.log(`  ${colors.yellow}ℹ️  No markets created yet${colors.reset}`);
          } else {
            // Check each market
            for (let i = 0; i < Number(marketCount); i++) {
              try {
                const marketAddress = await Factory.getMarketAt(i);
                const Market = await ethers.getContractAt("PredictionMarket", marketAddress);

                const question = await Market.question();
                const status = await Market.getMarketStatus();
                const [pool1, pool2] = await Market.getLiquidity();
                const [odds1, odds2] = await Market.getOdds();

                console.log(`\n  Market ${i + 1}: ${colors.cyan}${marketAddress}${colors.reset}`);
                console.log(`    Question: ${question.substring(0, 60)}${question.length > 60 ? '...' : ''}`);
                console.log(`    Status: ${getStatusName(status)}`);
                console.log(`    Pool: ${ethers.formatEther(pool1)} / ${ethers.formatEther(pool2)} ETH`);
                console.log(`    Odds: ${colors.green}${(Number(odds1) / 10000).toFixed(2)}x${colors.reset} / ${colors.green}${(Number(odds2) / 10000).toFixed(2)}x${colors.reset}`);

                results.markets[marketAddress] = {
                  index: i,
                  question: question,
                  status: getStatusName(status),
                  pool: [ethers.formatEther(pool1), ethers.formatEther(pool2)],
                  odds: [Number(odds1) / 10000, Number(odds2) / 10000]
                };

                // Validate odds are within expected range
                if (Number(odds1) < 1000 || Number(odds1) > 100000) {
                  results.warnings.push(`Market ${i}: Odds 1 out of range (${Number(odds1) / 10000}x)`);
                }
                if (Number(odds2) < 1000 || Number(odds2) > 100000) {
                  results.warnings.push(`Market ${i}: Odds 2 out of range (${Number(odds2) / 10000}x)`);
                }
              } catch (error) {
                console.log(`  ${colors.red}❌ Market ${i}: Error - ${error.message}${colors.reset}`);
                results.issues.push(`Market ${i}: ${error.message}`);
              }
            }
          }
        } catch (error) {
          console.log(`  ${colors.yellow}⚠️  Cannot get market count (method might not exist)${colors.reset}`);
          results.warnings.push(`Factory does not expose getTotalMarkets(): ${error.message}`);
        }
      } catch (error) {
        console.log(`  ${colors.red}❌ Error accessing factory: ${error.message}${colors.reset}`);
        results.issues.push(`Factory error: ${error.message}`);
      }
    }

    // ============================================================================
    // PHASE 5: Gas Cost Analysis
    // ============================================================================
    console.log(`\n${colors.blue}⛽ Phase 5: Recent Gas Costs${colors.reset}`);
    console.log("─".repeat(70));

    try {
      // Get recent blocks and analyze transaction costs
      const recentBlocks = 10;
      let totalGas = 0n;
      let txCount = 0;
      let failedTx = 0;

      for (let i = 0; i < recentBlocks; i++) {
        const block = await provider.getBlock(blockNumber - i, true);
        if (block && block.transactions) {
          for (const txHash of block.transactions) {
            try {
              const tx = await provider.getTransaction(txHash);
              const receipt = await provider.getTransactionReceipt(txHash);

              // Only count our contract interactions
              if (deployment.contracts && Object.values(deployment.contracts).some(addr =>
                tx.to && tx.to.toLowerCase() === addr.toLowerCase()
              )) {
                totalGas += receipt.gasUsed;
                txCount++;

                if (receipt.status === 0) {
                  failedTx++;
                }
              }
            } catch (e) {
              // Skip if we can't get transaction details
            }
          }
        }
      }

      if (txCount > 0) {
        const avgGas = totalGas / BigInt(txCount);
        const failureRate = failedTx / txCount;

        console.log(`  Transactions Analyzed: ${colors.cyan}${txCount}${colors.reset}`);
        console.log(`  Average Gas Used: ${colors.cyan}${avgGas.toString()}${colors.reset}`);
        console.log(`  Failed Transactions: ${colors.cyan}${failedTx}${colors.reset}`);
        console.log(`  Failure Rate: ${colors.cyan}${(failureRate * 100).toFixed(2)}%${colors.reset}`);

        results.gas = {
          transactionsAnalyzed: txCount,
          averageGasUsed: avgGas.toString(),
          failedTransactions: failedTx,
          failureRate: failureRate
        };

        if (failureRate > THRESHOLDS.failureRate) {
          results.warnings.push(`High transaction failure rate: ${(failureRate * 100).toFixed(2)}%`);
          console.log(`  ${colors.yellow}⚠️  Warning: High failure rate${colors.reset}`);
        }
      } else {
        console.log(`  ${colors.yellow}ℹ️  No recent transactions to our contracts${colors.reset}`);
      }
    } catch (error) {
      console.log(`  ${colors.yellow}⚠️  Error analyzing gas costs: ${error.message}${colors.reset}`);
      results.warnings.push(`Gas analysis error: ${error.message}`);
    }

  } catch (error) {
    console.log(`\n${colors.red}❌ Critical Error: ${error.message}${colors.reset}`);
    results.issues.push(`Critical error: ${error.message}`);
  }

  // ============================================================================
  // FINAL REPORT
  // ============================================================================
  console.log(`\n${colors.magenta}${colors.bright}`);
  console.log("═".repeat(70));
  console.log("📊 HEALTH CHECK SUMMARY");
  console.log("═".repeat(70));
  console.log(colors.reset);

  if (results.issues.length === 0) {
    console.log(`  ${colors.green}✅ NO CRITICAL ISSUES FOUND${colors.reset}`);
  } else {
    console.log(`  ${colors.red}❌ ${results.issues.length} CRITICAL ISSUES:${colors.reset}`);
    results.issues.forEach((issue, i) => {
      console.log(`     ${i + 1}. ${issue}`);
    });
  }

  if (results.warnings.length > 0) {
    console.log(`\n  ${colors.yellow}⚠️  ${results.warnings.length} WARNINGS:${colors.reset}`);
    results.warnings.forEach((warning, i) => {
      console.log(`     ${i + 1}. ${warning}`);
    });
  } else {
    console.log(`\n  ${colors.green}✅ NO WARNINGS${colors.reset}`);
  }

  // Generate recommendations
  if (results.issues.length > 0) {
    results.recommendations.push("Fix critical issues before proceeding to mainnet");
  }
  if (results.warnings.length > 3) {
    results.recommendations.push("Investigate warnings before next health check");
  }
  if (results.network.responseTime > 1000) {
    results.recommendations.push("Consider using a faster RPC endpoint");
  }

  if (results.recommendations.length > 0) {
    console.log(`\n  ${colors.cyan}💡 RECOMMENDATIONS:${colors.reset}`);
    results.recommendations.forEach((rec, i) => {
      console.log(`     ${i + 1}. ${rec}`);
    });
  }

  // Overall health score
  let healthScore = 100;
  healthScore -= results.issues.length * 20; // -20 per critical issue
  healthScore -= results.warnings.length * 5; // -5 per warning
  healthScore = Math.max(0, healthScore);

  console.log(`\n  ${colors.bright}Overall Health Score: ${getHealthColor(healthScore)}${healthScore}/100${colors.reset}`);
  console.log(`  Status: ${getHealthStatus(healthScore)}`);

  console.log(`\n${colors.cyan}${colors.bright}`);
  console.log("═".repeat(70));
  console.log(colors.reset);

  // Save results to file
  const resultsDir = path.join(__dirname, "../../deployments/sepolia/health-checks");
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  const resultsFile = path.join(resultsDir, `health-check-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  console.log(`\n${colors.green}📁 Results saved to: ${resultsFile}${colors.reset}\n`);

  return results;
}

function getStatusName(status) {
  const statuses = ["PROPOSED", "ACTIVE", "PENDING_RESOLUTION", "RESOLVED", "DISPUTED", "FINALIZED", "CANCELLED", "REJECTED"];
  return statuses[Number(status)] || `UNKNOWN(${status})`;
}

function getHealthColor(score) {
  if (score >= 90) return colors.green;
  if (score >= 70) return colors.yellow;
  return colors.red;
}

function getHealthStatus(score) {
  if (score >= 95) return `${colors.green}${colors.bright}🎉 EXCELLENT${colors.reset}`;
  if (score >= 80) return `${colors.green}✅ GOOD${colors.reset}`;
  if (score >= 60) return `${colors.yellow}⚠️  FAIR${colors.reset}`;
  if (score >= 40) return `${colors.yellow}⚠️  POOR${colors.reset}`;
  return `${colors.red}❌ CRITICAL${colors.reset}`;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
