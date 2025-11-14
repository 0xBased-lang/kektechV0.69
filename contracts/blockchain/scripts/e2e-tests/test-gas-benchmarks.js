const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * GAS BENCHMARKING TEST
 *
 * This script measures exact gas usage for all operations:
 * - Create Market
 * - Approve Market
 * - Activate Market
 * - Place Bet (first and subsequent)
 * - Get Odds (view function - no gas)
 * - Calculate Payout (view function - no gas)
 * - Propose Outcome
 * - Signal Dispute
 * - Finalize Market
 * - Claim Winnings
 *
 * Generates:
 * - Detailed gas usage report
 * - Cost analysis in BASED and USD
 * - Comparison to expected values
 * - Frontend gas limit recommendations
 */

const CONFIG = {
  FACTORY_ADDRESS: "0x169b4019Fc12c5bD43BFA5d830Fd01A678df6a15",
  GAS_PRICE_STANDARD: 9000000000, // 9 gwei
  GAS_PRICE_FAST: 12000000000, // 12 gwei
  GAS_PRICE_INSTANT: 15000000000, // 15 gwei
  BASED_TO_USD: 0.0001, // 1000 BASED = $0.10
  REPORT_FILE: path.join(__dirname, "../../test-results/gas-benchmark-report.json"),
  REPORT_MD_FILE: path.join(__dirname, "../../test-results/GAS_BENCHMARK_REPORT.md"),
};

let benchmarks = {
  timestamp: new Date().toISOString(),
  network: "BasedAI Mainnet",
  chainId: 32323,
  measurements: [],
  gasPriceSettings: {
    standard: CONFIG.GAS_PRICE_STANDARD,
    fast: CONFIG.GAS_PRICE_FAST,
    instant: CONFIG.GAS_PRICE_INSTANT,
  },
};

function recordBenchmark(operation, gasUsed, txHash, details = {}) {
  const gasPrices = {
    standard: CONFIG.GAS_PRICE_STANDARD,
    fast: CONFIG.GAS_PRICE_FAST,
    instant: CONFIG.GAS_PRICE_INSTANT,
  };

  const costs = {};
  for (const [speed, price] of Object.entries(gasPrices)) {
    const costWei = BigInt(gasUsed) * BigInt(price);
    const costBASED = ethers.formatEther(costWei);
    const costUSD = parseFloat(costBASED) * CONFIG.BASED_TO_USD;

    costs[speed] = {
      gasPrice: price,
      costBASED,
      costUSD: `$${costUSD.toFixed(8)}`,
    };
  }

  const benchmark = {
    operation,
    gasUsed: gasUsed.toString(),
    txHash,
    costs,
    ...details,
  };

  benchmarks.measurements.push(benchmark);

  console.log(`   Operation: ${operation}`);
  console.log(`   Gas Used: ${gasUsed}`);
  console.log(`   Cost @ 9 gwei: ${costs.standard.costBASED} BASED (${costs.standard.costUSD})`);
  if (txHash) {
    console.log(`   Tx Hash: ${txHash}`);
  }
  console.log("");
}

function saveBenchmarks() {
  const dir = path.dirname(CONFIG.REPORT_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Save JSON
  fs.writeFileSync(CONFIG.REPORT_FILE, JSON.stringify(benchmarks, null, 2));
  console.log(`\n📝 Benchmark report saved to: ${CONFIG.REPORT_FILE}`);

  // Generate Markdown report
  generateMarkdownReport();
}

function generateMarkdownReport() {
  let md = `# GAS BENCHMARK REPORT\n\n`;
  md += `**Generated**: ${benchmarks.timestamp}\n`;
  md += `**Network**: ${benchmarks.network} (Chain ID: ${benchmarks.chainId})\n`;
  md += `**Gas Price Settings**:\n`;
  md += `- Standard: 9 gwei\n`;
  md += `- Fast: 12 gwei\n`;
  md += `- Instant: 15 gwei\n\n`;

  md += `## Summary Table\n\n`;
  md += `| Operation | Gas Used | Cost @ 9 gwei | Cost (USD) | Recommended Gas Limit |\n`;
  md += `|-----------|----------|---------------|------------|-----------------------|\n`;

  for (const m of benchmarks.measurements) {
    const gasLimit = Math.ceil(parseInt(m.gasUsed) * 1.2); // 20% buffer
    md += `| ${m.operation} | ${m.gasUsed} | ${m.costs.standard.costBASED} BASED | ${m.costs.standard.costUSD} | ${gasLimit} |\n`;
  }

  md += `\n## Detailed Measurements\n\n`;

  for (const m of benchmarks.measurements) {
    md += `### ${m.operation}\n\n`;
    md += `- **Gas Used**: ${m.gasUsed}\n`;
    if (m.txHash) {
      md += `- **Transaction**: ${m.txHash}\n`;
    }
    md += `- **Costs**:\n`;
    md += `  - Standard (9 gwei): ${m.costs.standard.costBASED} BASED (${m.costs.standard.costUSD})\n`;
    md += `  - Fast (12 gwei): ${m.costs.fast.costBASED} BASED (${m.costs.fast.costUSD})\n`;
    md += `  - Instant (15 gwei): ${m.costs.instant.costBASED} BASED (${m.costs.instant.costUSD})\n`;

    if (m.expected) {
      const variance = ((parseInt(m.gasUsed) - m.expected) / m.expected * 100).toFixed(1);
      md += `- **Expected**: ${m.expected} gas\n`;
      md += `- **Variance**: ${variance}% ${Math.abs(variance) <= 10 ? "✅" : "⚠️"}\n`;
    }

    md += `\n`;
  }

  md += `## Frontend Integration Recommendations\n\n`;
  md += `\`\`\`javascript\n`;
  md += `const GAS_LIMITS = {\n`;

  for (const m of benchmarks.measurements) {
    const functionName = m.operation.replace(/\s+/g, "");
    const gasLimit = Math.ceil(parseInt(m.gasUsed) * 1.2);
    md += `  ${functionName}: ${gasLimit}, // ${m.operation}\n`;
  }

  md += `};\n\`\`\`\n`;

  fs.writeFileSync(CONFIG.REPORT_MD_FILE, md);
  console.log(`📝 Markdown report saved to: ${CONFIG.REPORT_MD_FILE}`);
}

async function main() {
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║             GAS BENCHMARKING TEST SUITE                   ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  try {
    const [signer] = await ethers.getSigners();
    console.log("👤 Test Account:", signer.address);
    console.log("💰 Balance:", ethers.formatEther(await ethers.provider.getBalance(signer.address)), "BASED\n");

    const factory = await ethers.getContractAt("FlexibleMarketFactoryUnified", CONFIG.FACTORY_ADDRESS);

    // ========== BENCHMARK 1: CREATE MARKET ==========
    console.log("📊 BENCHMARK 1: CREATE MARKET");
    console.log("═".repeat(63));

    const marketConfig = {
      question: "Gas Benchmark Test Market - Will operation costs match estimates?",
      description: "Testing market for gas benchmarking purposes",
      resolutionTime: Math.floor(Date.now() / 1000) + 24 * 3600, // 24 hours
      creatorBond: ethers.parseEther("0.1"),
      category: ethers.keccak256(ethers.toUtf8Bytes("testing")),
      outcome1: "Yes (matches)",
      outcome2: "No (differs)"
    };

    let testMarketAddress;

    try {
      const createTx = await factory.createMarket(marketConfig, {
        value: marketConfig.creatorBond,
        gasPrice: CONFIG.GAS_PRICE_STANDARD,
        gasLimit: 2000000,
      });

      const createReceipt = await createTx.wait();

      // Extract market address
      const marketCreatedEvent = createReceipt.logs.find(log => {
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
        testMarketAddress = parsed.args.market;
      }

      recordBenchmark("Create Market", createReceipt.gasUsed, createReceipt.hash, {
        expected: 731426,
        marketAddress: testMarketAddress,
      });

    } catch (error) {
      console.log(`   ❌ Create market failed: ${error.message}\n`);
    }

    if (!testMarketAddress) {
      console.log("   ⚠️  Could not create test market, using Market 1 for remaining tests\n");
      testMarketAddress = "0x31d2BC49A6FD4a066F5f8AC61Acd0E6c9105DD84";
    }

    const market = await ethers.getContractAt("PredictionMarket", testMarketAddress);

    // ========== BENCHMARK 2: APPROVE MARKET ==========
    console.log("📊 BENCHMARK 2: APPROVE MARKET");
    console.log("═".repeat(63));

    const state = await market.currentState();
    if (Number(state) === 0) {
      // PROPOSED
      try {
        const approveTx = await factory.adminApproveMarket(testMarketAddress, {
          gasPrice: CONFIG.GAS_PRICE_STANDARD,
          gasLimit: 300000,
        });

        const approveReceipt = await approveTx.wait();

        recordBenchmark("Approve Market", approveReceipt.gasUsed, approveReceipt.hash, {
          expected: 100000,
        });
      } catch (error) {
        console.log(`   ❌ Approve failed: ${error.message}\n`);
      }
    } else {
      console.log("   ⏭️  Market already approved, skipping\n");
    }

    // ========== BENCHMARK 3: ACTIVATE MARKET ==========
    console.log("📊 BENCHMARK 3: ACTIVATE MARKET");
    console.log("═".repeat(63));

    const state2 = await market.currentState();
    if (Number(state2) === 1) {
      // APPROVED
      try {
        const activateTx = await market.activateMarket({
          gasPrice: CONFIG.GAS_PRICE_STANDARD,
          gasLimit: 300000,
        });

        const activateReceipt = await activateTx.wait();

        recordBenchmark("Activate Market", activateReceipt.gasUsed, activateReceipt.hash, {
          expected: 100000,
        });
      } catch (error) {
        console.log(`   ❌ Activate failed: ${error.message}\n`);
      }
    } else {
      console.log("   ⏭️  Market already activated, skipping\n");
    }

    // ========== BENCHMARK 4: PLACE BET (FIRST) ==========
    console.log("📊 BENCHMARK 4: PLACE BET (FIRST)");
    console.log("═".repeat(63));

    const state3 = await market.currentState();
    if (Number(state3) === 2) {
      // ACTIVE
      try {
        const bet1Tx = await market.placeBet(1, 0, {
          value: ethers.parseEther("100"),
          gasPrice: CONFIG.GAS_PRICE_STANDARD,
          gasLimit: 1100000, // Updated: 967k first bet + 15% buffer
        });

        const bet1Receipt = await bet1Tx.wait();

        recordBenchmark("Place Bet (First)", bet1Receipt.gasUsed, bet1Receipt.hash, {
          expected: 150000,
          amount: "100 BASED",
          outcome: 1,
        });
      } catch (error) {
        console.log(`   ❌ First bet failed: ${error.message}\n`);
      }
    } else {
      console.log("   ⏭️  Market not ACTIVE, skipping\n");
    }

    // ========== BENCHMARK 5: PLACE BET (SUBSEQUENT) ==========
    console.log("📊 BENCHMARK 5: PLACE BET (SUBSEQUENT)");
    console.log("═".repeat(63));

    if (Number(state3) === 2) {
      // ACTIVE
      try {
        const bet2Tx = await market.placeBet(2, 0, {
          value: ethers.parseEther("150"),
          gasPrice: CONFIG.GAS_PRICE_STANDARD,
          gasLimit: 950000, // Updated: 832k subsequent bet + 15% buffer
        });

        const bet2Receipt = await bet2Tx.wait();

        recordBenchmark("Place Bet (Subsequent)", bet2Receipt.gasUsed, bet2Receipt.hash, {
          expected: 150000,
          amount: "150 BASED",
          outcome: 2,
        });
      } catch (error) {
        console.log(`   ❌ Subsequent bet failed: ${error.message}\n`);
      }
    } else {
      console.log("   ⏭️  Market not ACTIVE, skipping\n");
    }

    // ========== BENCHMARK 6: GET ODDS (VIEW) ==========
    console.log("📊 BENCHMARK 6: GET ODDS (VIEW FUNCTION)");
    console.log("═".repeat(63));

    try {
      const odds = await market.getOdds();
      console.log(`   Odds: [${odds[0]}, ${odds[1]}]`);
      console.log(`   Gas Used: 0 (view function - no transaction)\n`);

      recordBenchmark("Get Odds (View)", 0, null, {
        note: "View function, no gas cost",
      });
    } catch (error) {
      console.log(`   ❌ Get odds failed: ${error.message}\n`);
    }

    // ========== BENCHMARK 7: CALCULATE PAYOUT (VIEW) ==========
    console.log("📊 BENCHMARK 7: CALCULATE PAYOUT (VIEW FUNCTION)");
    console.log("═".repeat(63));

    try {
      const payout = await market.calculatePayout(signer.address);
      console.log(`   Potential Payout: ${ethers.formatEther(payout)} BASED`);
      console.log(`   Gas Used: 0 (view function - no transaction)\n`);

      recordBenchmark("Calculate Payout (View)", 0, null, {
        note: "View function, no gas cost",
      });
    } catch (error) {
      console.log(`   ❌ Calculate payout failed: ${error.message}\n`);
    }

    // ========== BENCHMARK 8: PROPOSE OUTCOME ==========
    console.log("📊 BENCHMARK 8: PROPOSE OUTCOME");
    console.log("═".repeat(63));

    console.log("   ⏭️  Skipped (requires resolution time to pass)\n");

    // ========== BENCHMARK 9: FINALIZE MARKET ==========
    console.log("📊 BENCHMARK 9: FINALIZE MARKET");
    console.log("═".repeat(63));

    console.log("   ⏭️  Skipped (requires resolution and dispute window)\n");

    // ========== BENCHMARK 10: CLAIM WINNINGS ==========
    console.log("📊 BENCHMARK 10: CLAIM WINNINGS");
    console.log("═".repeat(63));

    console.log("   ⏭️  Skipped (requires finalized market)\n");

    // ========== SUMMARY ==========
    console.log("═".repeat(63));
    console.log("GAS BENCHMARKING SUMMARY");
    console.log("═".repeat(63));

    console.log(`\n   Total Measurements: ${benchmarks.measurements.length}`);

    let totalGas = 0;
    for (const m of benchmarks.measurements) {
      totalGas += parseInt(m.gasUsed);
    }

    const totalCostBASED = ethers.formatEther(BigInt(totalGas) * BigInt(CONFIG.GAS_PRICE_STANDARD));
    const totalCostUSD = parseFloat(totalCostBASED) * CONFIG.BASED_TO_USD;

    console.log(`   Total Gas Measured: ${totalGas}`);
    console.log(`   Total Cost @ 9 gwei: ${totalCostBASED} BASED ($${totalCostUSD.toFixed(6)})`);

    console.log("\n   📊 Operations Benchmarked:");
    console.log("   " + "─".repeat(60));

    for (const m of benchmarks.measurements) {
      const icon = parseInt(m.gasUsed) > 0 ? "✅" : "ℹ️ ";
      console.log(`   ${icon} ${m.operation}: ${m.gasUsed} gas`);
    }

    console.log("   " + "─".repeat(60));

    console.log("\n   📋 Comparison to Expected:");
    console.log("   " + "─".repeat(60));

    for (const m of benchmarks.measurements) {
      if (m.expected) {
        const variance = ((parseInt(m.gasUsed) - m.expected) / m.expected * 100).toFixed(1);
        const status = Math.abs(variance) <= 10 ? "✅" : "⚠️ ";
        console.log(`   ${status} ${m.operation}: ${variance}% variance`);
      }
    }

    console.log("   " + "─".repeat(60));

    console.log("\n" + "═".repeat(63));
    console.log("");

    // Save reports
    saveBenchmarks();

  } catch (error) {
    console.error("\n❌ FATAL ERROR:", error.message);
    console.error(error);

    benchmarks.fatalError = error.message;
    saveBenchmarks();

    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
