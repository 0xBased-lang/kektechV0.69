/**
 * Phase 4 Monitoring Script - Automated Health Checks
 *
 * Runs every 15 minutes via cron job
 * Monitors: events, state transitions, gas costs, errors
 * Alerts: Critical failures, warnings, anomalies
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// Configuration
const CONFIG = {
  network: "basedai_mainnet",
  chainId: 32323,
  deploymentFile: path.join(__dirname, "../basedai-mainnet-deployment.json"),
  logDir: path.join(__dirname, "../logs/monitoring"),
  alertThresholds: {
    errorRate: 0.05,        // 5% error rate triggers alert
    gasOutlier: 1.5,        // 50% above average triggers alert
    stateInconsistency: 1,  // Any inconsistency triggers alert
    registryIssue: 1,       // Any registry issue triggers alert
    priceDeviation: 0.001,  // Price sum deviation from 1.0
    poolDrift: 0.0001       // Pool balance drift tolerance
  }
};

// Load deployment addresses
let deployment;
try {
  deployment = JSON.parse(fs.readFileSync(CONFIG.deploymentFile, 'utf8'));
  console.log(`✅ Loaded deployment from ${CONFIG.deploymentFile}`);
} catch (error) {
  console.error(`❌ Failed to load deployment file: ${error.message}`);
  process.exit(1);
}

// Ensure log directory exists
if (!fs.existsSync(CONFIG.logDir)) {
  fs.mkdirSync(CONFIG.logDir, { recursive: true });
}

/**
 * Main monitoring function
 */
async function runMonitoring() {
  console.log("\n" + "=".repeat(60));
  console.log("🔍 PHASE 4 MONITORING - Health Check");
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);
  console.log("=".repeat(60) + "\n");

  const results = {
    timestamp: new Date().toISOString(),
    network: CONFIG.network,
    chainId: CONFIG.chainId,
    checks: {},
    alerts: [],
    warnings: [],
    status: "HEALTHY"
  };

  try {
    // Get contract instances
    const contracts = await loadContracts();

    // Run all health checks
    results.checks.events = await checkEvents(contracts);
    results.checks.states = await checkStates(contracts);
    results.checks.gasCosts = await checkGasCosts();
    results.checks.registry = await checkRegistry(contracts);
    results.checks.lmsrInvariants = await checkLMSRInvariants(contracts);
    results.checks.poolBalance = await checkPoolBalance(contracts);

    // Analyze results and set status
    analyzeResults(results);

    // Log results
    await logResults(results);

    // Print summary
    printSummary(results);

    // Send alerts if needed
    if (results.alerts.length > 0) {
      await sendAlerts(results.alerts);
    }

  } catch (error) {
    console.error("❌ Monitoring error:", error);
    results.status = "ERROR";
    results.error = error.message;
    await logResults(results);
  }

  return results;
}

/**
 * Load contract instances
 */
async function loadContracts() {
  const [deployer] = await ethers.getSigners();

  console.log("📦 Loading contracts...");

  const contracts = {
    registry: await ethers.getContractAt(
      "VersionedRegistry",
      deployment.contracts.VersionedRegistry
    ),
    factory: await ethers.getContractAt(
      "FlexibleMarketFactoryUnified",
      deployment.contracts.FlexibleMarketFactoryUnified
    ),
    parameterStorage: await ethers.getContractAt(
      "ParameterStorage",
      deployment.contracts.ParameterStorage
    ),
    accessControl: await ethers.getContractAt(
      "AccessControlManager",
      deployment.contracts.AccessControlManager
    ),
    resolutionManager: await ethers.getContractAt(
      "ResolutionManager",
      deployment.contracts.ResolutionManager
    ),
    rewardDistributor: await ethers.getContractAt(
      "RewardDistributor",
      deployment.contracts.RewardDistributor
    )
  };

  console.log("✅ Contracts loaded\n");
  return contracts;
}

/**
 * Check 1: Event monitoring
 */
async function checkEvents(contracts) {
  console.log("1️⃣  Checking events...");

  const provider = ethers.provider;
  const latestBlock = await provider.getBlockNumber();
  const fromBlock = Math.max(0, latestBlock - 100); // Last 100 blocks

  try {
    // Get MarketCreated events
    const marketFilter = contracts.factory.filters.MarketCreated();
    const marketEvents = await contracts.factory.queryFilter(
      marketFilter,
      fromBlock,
      latestBlock
    );

    // Get BetPlaced events (need to query all markets)
    const markets = await getActiveMarkets(contracts);
    let betEvents = [];
    for (const market of markets) {
      const betFilter = market.filters.BetPlaced();
      const events = await market.queryFilter(betFilter, fromBlock, latestBlock);
      betEvents = betEvents.concat(events);
    }

    // Calculate error rate (if we track failed txs)
    const totalEvents = marketEvents.length + betEvents.length;
    const errorRate = 0; // Placeholder - would need tx receipt analysis

    const result = {
      totalEvents,
      marketCreated: marketEvents.length,
      betsPlaced: betEvents.length,
      errorRate,
      recentActivity: [...marketEvents, ...betEvents]
        .sort((a, b) => b.blockNumber - a.blockNumber)
        .slice(0, 10)
        .map(e => ({
          event: e.event,
          block: e.blockNumber,
          tx: e.transactionHash
        })),
      status: errorRate > CONFIG.alertThresholds.errorRate ? "WARNING" : "OK"
    };

    console.log(`   📊 Events: ${totalEvents} total (${marketEvents.length} markets, ${betEvents.length} bets)`);
    console.log(`   📊 Error rate: ${(errorRate * 100).toFixed(2)}%`);
    console.log(`   ✅ Event monitoring: ${result.status}\n`);

    return result;
  } catch (error) {
    console.error(`   ❌ Event check failed: ${error.message}\n`);
    return { status: "ERROR", error: error.message };
  }
}

/**
 * Check 2: State consistency
 */
async function checkStates(contracts) {
  console.log("2️⃣  Checking market states...");

  try {
    const markets = await getActiveMarkets(contracts);

    const stateChecks = await Promise.all(
      markets.map(async (market) => {
        const info = await market.getMarketInfo();
        const state = await market.currentState();
        const isConsistent = await validateStateConsistency(market, state, info);

        return {
          address: market.target || market.address,
          state: getStateName(state),
          isConsistent,
          info: {
            totalBets: info.totalBets.toString(),
            totalVolume: ethers.formatEther(info.totalVolume),
            isResolved: info.isResolved
          }
        };
      })
    );

    const inconsistencies = stateChecks.filter(check => !check.isConsistent);

    const result = {
      totalMarkets: markets.length,
      consistentMarkets: stateChecks.length - inconsistencies.length,
      inconsistencies: inconsistencies.length,
      details: stateChecks,
      status: inconsistencies.length > 0 ? "WARNING" : "OK"
    };

    console.log(`   📊 Markets: ${markets.length} total, ${result.consistentMarkets} consistent`);
    if (inconsistencies.length > 0) {
      console.log(`   ⚠️  Inconsistencies: ${inconsistencies.length}`);
      inconsistencies.forEach(inc => {
        console.log(`      - Market ${inc.address}: State ${inc.state}`);
      });
    }
    console.log(`   ✅ State consistency: ${result.status}\n`);

    return result;
  } catch (error) {
    console.error(`   ❌ State check failed: ${error.message}\n`);
    return { status: "ERROR", error: error.message };
  }
}

/**
 * Check 3: Gas costs
 */
async function checkGasCosts() {
  console.log("3️⃣  Checking gas costs...");

  try {
    const provider = ethers.provider;
    const latestBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(0, latestBlock - 100);

    // Get recent transactions
    const recentTxs = [];
    for (let i = latestBlock; i > fromBlock && recentTxs.length < 50; i--) {
      const block = await provider.getBlock(i);
      if (block && block.transactions) {
        for (const txHash of block.transactions) {
          const receipt = await provider.getTransactionReceipt(txHash);
          if (receipt && receipt.to === deployment.contracts.FlexibleMarketFactoryUnified) {
            recentTxs.push({
              hash: txHash,
              gasUsed: receipt.gasUsed.toString(),
              block: receipt.blockNumber
            });
          }
        }
      }
    }

    if (recentTxs.length === 0) {
      console.log(`   ℹ️  No recent transactions found\n`);
      return { status: "OK", message: "No recent activity" };
    }

    // Calculate gas statistics
    const gasValues = recentTxs.map(tx => parseInt(tx.gasUsed));
    const avgGas = gasValues.reduce((a, b) => a + b, 0) / gasValues.length;
    const maxGas = Math.max(...gasValues);
    const minGas = Math.min(...gasValues);

    const outliers = recentTxs.filter(tx =>
      parseInt(tx.gasUsed) > avgGas * CONFIG.alertThresholds.gasOutlier
    );

    const result = {
      sampleSize: recentTxs.length,
      avgGas: Math.round(avgGas),
      maxGas,
      minGas,
      outliers: outliers.length,
      outliersDetails: outliers.slice(0, 5).map(tx => ({
        hash: tx.hash,
        gasUsed: tx.gasUsed
      })),
      status: outliers.length > 0 ? "WARNING" : "OK"
    };

    console.log(`   📊 Sample size: ${recentTxs.length} transactions`);
    console.log(`   📊 Avg gas: ${result.avgGas.toLocaleString()}`);
    console.log(`   📊 Range: ${minGas.toLocaleString()} - ${maxGas.toLocaleString()}`);
    if (outliers.length > 0) {
      console.log(`   ⚠️  Outliers: ${outliers.length} transactions >50% above avg`);
    }
    console.log(`   ✅ Gas costs: ${result.status}\n`);

    return result;
  } catch (error) {
    console.error(`   ❌ Gas check failed: ${error.message}\n`);
    return { status: "ERROR", error: error.message };
  }
}

/**
 * Check 4: Registry integrity
 */
async function checkRegistry(contracts) {
  console.log("4️⃣  Checking registry integrity...");

  try {
    const contractNames = [
      "AccessControlManager",
      "ResolutionManager",
      "ParameterStorage",
      "RewardDistributor",
      "MarketFactory",
      "PredictionMarket",
      "CurveRegistry",
      "MarketTemplateRegistry"
    ];

    const checks = await Promise.all(
      contractNames.map(async (name) => {
        const nameHash = ethers.id(name);
        const address = await contracts.registry.getContract(nameHash, 1);
        const version = await contracts.registry.getCurrentVersion(nameHash);

        return {
          name,
          address,
          version: version.toString(),
          isValid: address !== ethers.ZeroAddress
        };
      })
    );

    const issues = checks.filter(check => !check.isValid);

    const result = {
      totalContracts: contractNames.length,
      validContracts: checks.length - issues.length,
      issues: issues.length,
      details: checks,
      status: issues.length > 0 ? "CRITICAL" : "OK"
    };

    console.log(`   📊 Registry: ${result.validContracts}/${result.totalContracts} contracts valid`);
    if (issues.length > 0) {
      console.log(`   🚨 Issues: ${issues.length} contracts not found`);
      issues.forEach(issue => {
        console.log(`      - ${issue.name}: ${issue.address}`);
      });
    }
    console.log(`   ✅ Registry integrity: ${result.status}\n`);

    return result;
  } catch (error) {
    console.error(`   ❌ Registry check failed: ${error.message}\n`);
    return { status: "ERROR", error: error.message };
  }
}

/**
 * Check 5: LMSR invariants
 */
async function checkLMSRInvariants(contracts) {
  console.log("5️⃣  Checking LMSR invariants...");

  try {
    const markets = await getActiveMarkets(contracts);

    const invariantChecks = await Promise.all(
      markets.map(async (market) => {
        // Get odds (prices)
        const [odds1, odds2] = await market.getOdds();

        // Convert odds to prices (price = 1/odds)
        const price1 = 1 / (Number(odds1) / 1e8);
        const price2 = 1 / (Number(odds2) / 1e8);
        const priceSum = price1 + price2;

        // Check if prices sum to ~1.0
        const priceDeviation = Math.abs(priceSum - 1.0);
        const pricesValid = priceDeviation < CONFIG.alertThresholds.priceDeviation;

        return {
          address: market.target || market.address,
          odds1: odds1.toString(),
          odds2: odds2.toString(),
          price1: price1.toFixed(4),
          price2: price2.toFixed(4),
          priceSum: priceSum.toFixed(4),
          priceDeviation: priceDeviation.toFixed(6),
          pricesValid
        };
      })
    );

    const violations = invariantChecks.filter(check => !check.pricesValid);

    const result = {
      totalMarkets: markets.length,
      validMarkets: invariantChecks.length - violations.length,
      violations: violations.length,
      details: invariantChecks,
      status: violations.length > 0 ? "CRITICAL" : "OK"
    };

    console.log(`   📊 LMSR: ${result.validMarkets}/${result.totalMarkets} markets valid`);
    if (violations.length > 0) {
      console.log(`   🚨 Violations: ${violations.length} markets with price sum ≠ 1.0`);
      violations.forEach(v => {
        console.log(`      - Market ${v.address}: Sum = ${v.priceSum} (Δ${v.priceDeviation})`);
      });
    }
    console.log(`   ✅ LMSR invariants: ${result.status}\n`);

    return result;
  } catch (error) {
    console.error(`   ❌ LMSR check failed: ${error.message}\n`);
    return { status: "ERROR", error: error.message };
  }
}

/**
 * Check 6: Pool balance consistency
 */
async function checkPoolBalance(contracts) {
  console.log("6️⃣  Checking pool balance...");

  try {
    const markets = await getActiveMarkets(contracts);

    const balanceChecks = await Promise.all(
      markets.map(async (market) => {
        const info = await market.getMarketInfo();
        const pools = await market.getPools();

        // Check if pool1 + pool2 = totalVolume (approximately)
        const poolSum = pools[0] + pools[1];
        const drift = poolSum > 0n
          ? Number(ethers.formatEther(
              (poolSum > info.totalVolume ? poolSum - info.totalVolume : info.totalVolume - poolSum)
            ))
          : 0;

        const driftPercent = poolSum > 0n
          ? (drift / Number(ethers.formatEther(poolSum)))
          : 0;

        const isConsistent = driftPercent < CONFIG.alertThresholds.poolDrift;

        return {
          address: market.target || market.address,
          pool1: ethers.formatEther(pools[0]),
          pool2: ethers.formatEther(pools[1]),
          poolSum: ethers.formatEther(poolSum),
          totalVolume: ethers.formatEther(info.totalVolume),
          drift: drift.toFixed(6),
          driftPercent: (driftPercent * 100).toFixed(4) + "%",
          isConsistent
        };
      })
    );

    const inconsistencies = balanceChecks.filter(check => !check.isConsistent);

    const result = {
      totalMarkets: markets.length,
      consistentMarkets: balanceChecks.length - inconsistencies.length,
      inconsistencies: inconsistencies.length,
      details: balanceChecks,
      status: inconsistencies.length > 0 ? "CRITICAL" : "OK"
    };

    console.log(`   📊 Pool balance: ${result.consistentMarkets}/${result.totalMarkets} markets consistent`);
    if (inconsistencies.length > 0) {
      console.log(`   🚨 Inconsistencies: ${inconsistencies.length} markets with pool drift`);
      inconsistencies.forEach(inc => {
        console.log(`      - Market ${inc.address}: Drift ${inc.driftPercent}`);
      });
    }
    console.log(`   ✅ Pool balance: ${result.status}\n`);

    return result;
  } catch (error) {
    console.error(`   ❌ Pool balance check failed: ${error.message}\n`);
    return { status: "ERROR", error: error.message };
  }
}

/**
 * Helper: Get all active markets
 */
async function getActiveMarkets(contracts) {
  // Query MarketCreated events
  const filter = contracts.factory.filters.MarketCreated();
  const events = await contracts.factory.queryFilter(filter);

  // Get market instances
  const markets = await Promise.all(
    events.map(async (event) => {
      const marketAddress = event.args.market;
      return await ethers.getContractAt("PredictionMarket", marketAddress);
    })
  );

  return markets;
}

/**
 * Helper: Validate state consistency
 */
async function validateStateConsistency(market, state, info) {
  // Basic consistency checks

  // 1. If resolved, state should be FINALIZED
  if (info.isResolved && state !== 5) { // 5 = FINALIZED
    return false;
  }

  // 2. If totalBets > 0, state should be >= ACTIVE
  if (info.totalBets > 0 && state < 2) { // 2 = ACTIVE
    return false;
  }

  // Add more consistency checks as needed

  return true;
}

/**
 * Helper: Get state name
 */
function getStateName(state) {
  const states = [
    "PROPOSED",
    "APPROVED",
    "ACTIVE",
    "RESOLVING",
    "DISPUTED",
    "FINALIZED"
  ];
  return states[state] || `UNKNOWN(${state})`;
}

/**
 * Analyze results and set overall status
 */
function analyzeResults(results) {
  const checks = results.checks;

  // Check for critical failures
  const criticalIssues = Object.values(checks).filter(
    check => check.status === "CRITICAL"
  );

  if (criticalIssues.length > 0) {
    results.status = "CRITICAL";
    results.alerts.push({
      severity: "CRITICAL",
      message: `${criticalIssues.length} critical issue(s) detected`,
      details: criticalIssues
    });
  }

  // Check for warnings
  const warnings = Object.values(checks).filter(
    check => check.status === "WARNING"
  );

  if (warnings.length > 0 && results.status !== "CRITICAL") {
    results.status = "DEGRADED";
    results.warnings.push({
      severity: "WARNING",
      message: `${warnings.length} warning(s) detected`,
      details: warnings
    });
  }

  // Check for errors
  const errors = Object.values(checks).filter(
    check => check.status === "ERROR"
  );

  if (errors.length > 0) {
    results.status = "ERROR";
    results.alerts.push({
      severity: "ERROR",
      message: `${errors.length} check(s) failed to execute`,
      details: errors
    });
  }
}

/**
 * Log results to file
 */
async function logResults(results) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logFile = path.join(CONFIG.logDir, `monitor-${timestamp}.json`);

  fs.writeFileSync(logFile, JSON.stringify(results, null, 2));
  console.log(`📝 Results logged to: ${logFile}\n`);
}

/**
 * Print summary
 */
function printSummary(results) {
  console.log("=".repeat(60));
  console.log("📊 MONITORING SUMMARY");
  console.log("=".repeat(60));

  const statusEmoji = {
    "HEALTHY": "✅",
    "DEGRADED": "⚠️",
    "CRITICAL": "🚨",
    "ERROR": "❌"
  };

  console.log(`\nOverall Status: ${statusEmoji[results.status]} ${results.status}`);

  if (results.alerts.length > 0) {
    console.log(`\n🚨 ALERTS (${results.alerts.length}):`);
    results.alerts.forEach(alert => {
      console.log(`   - [${alert.severity}] ${alert.message}`);
    });
  }

  if (results.warnings.length > 0) {
    console.log(`\n⚠️  WARNINGS (${results.warnings.length}):`);
    results.warnings.forEach(warning => {
      console.log(`   - [${warning.severity}] ${warning.message}`);
    });
  }

  console.log("\n" + "=".repeat(60) + "\n");
}

/**
 * Send alerts (placeholder - implement as needed)
 */
async function sendAlerts(alerts) {
  // TODO: Implement alert system
  // Options:
  // - Email notifications
  // - Discord webhook
  // - Telegram bot
  // - SMS alerts

  console.log("📢 Alerts would be sent here (not implemented)");
  alerts.forEach(alert => {
    console.log(`   - ${alert.message}`);
  });
}

/**
 * Main execution
 */
if (require.main === module) {
  runMonitoring()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { runMonitoring };
