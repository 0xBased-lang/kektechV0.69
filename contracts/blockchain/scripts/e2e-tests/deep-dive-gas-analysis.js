const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * DEEP DIVE GAS ANALYSIS
 *
 * Comprehensive analysis of gas usage patterns for placeBet operations:
 * 1. Test different bet amounts (1, 10, 100, 1000 BASED)
 * 2. Compare first bet vs subsequent bets
 * 3. Analyze gas variance patterns
 * 4. Identify optimization opportunities
 *
 * This script will create detailed reports and recommendations.
 */

const CONFIG = {
  MARKET_ADDRESS: "0x31d2BC49A6FD4a066F5f8AC61Acd0E6c9105DD84",
  GAS_PRICE: ethers.parseUnits("9", "gwei"),
  BASED_TO_USD: 0.0001, // 1000 BASED = $0.10
  REPORT_FILE: path.join(__dirname, "../../test-results/gas-deep-dive-analysis.json"),
  REPORT_MD_FILE: path.join(__dirname, "../../test-results/GAS_DEEP_DIVE_ANALYSIS.md"),
};

let analysisResults = {
  timestamp: new Date().toISOString(),
  network: "BasedAI Mainnet",
  chainId: 32323,
  testAccount: null,
  initialBalance: null,
  tests: [],
  summary: {},
};

async function main() {
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║       DEEP DIVE GAS ANALYSIS - OPTIMIZATION STUDY         ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  const [signer] = await ethers.getSigners();
  analysisResults.testAccount = signer.address;

  const balance = await ethers.provider.getBalance(signer.address);
  analysisResults.initialBalance = ethers.formatEther(balance);

  console.log("📍 Test Account:", signer.address);
  console.log("💰 Balance:", analysisResults.initialBalance, "BASED\n");

  const market = await ethers.getContractAt("PredictionMarket", CONFIG.MARKET_ADDRESS);

  // Get initial state
  const currentState = await market.currentState();
  console.log("📊 Market State:", Number(currentState), ["PROPOSED", "APPROVED", "ACTIVE"][Number(currentState)]);

  if (Number(currentState) !== 2) {
    console.log("❌ Market not ACTIVE, cannot proceed with analysis");
    return;
  }

  // Get initial odds
  const initialOdds = await market.getOdds();
  console.log("📈 Initial Odds:", initialOdds.map(o => o.toString()));
  console.log("");

  // ========== TEST SERIES 1: DIFFERENT BET AMOUNTS ==========
  console.log("═".repeat(63));
  console.log("TEST SERIES 1: BET AMOUNT VARIANCE ANALYSIS");
  console.log("═".repeat(63));
  console.log("Testing how gas usage varies with bet amount\n");

  const betAmounts = [
    { label: "Tiny", amount: "1", description: "1 BASED" },
    { label: "Small", amount: "10", description: "10 BASED" },
    { label: "Medium", amount: "100", description: "100 BASED" },
    { label: "Large", amount: "500", description: "500 BASED" },
  ];

  for (const betTest of betAmounts) {
    console.log(`\n🧪 Test: ${betTest.label} Bet (${betTest.description})`);
    console.log("─".repeat(63));

    try {
      const betAmount = ethers.parseEther(betTest.amount);
      const outcome = 1; // Always bet on outcome 1
      const minOdds = 0; // No slippage protection

      // Get odds before bet
      const oddsBefore = await market.getOdds();

      console.log(`   Betting ${betTest.description} on Outcome 1...`);
      console.log(`   Odds before: [${oddsBefore[0]}, ${oddsBefore[1]}]`);

      const tx = await market.placeBet(outcome, minOdds, {
        value: betAmount,
        gasLimit: 1200000, // 1.2M to be safe
        gasPrice: CONFIG.GAS_PRICE,
      });

      console.log(`   ✅ Transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();

      // Get odds after bet
      const oddsAfter = await market.getOdds();

      const gasUsed = Number(receipt.gasUsed);
      const costBASED = ethers.formatEther(BigInt(gasUsed) * CONFIG.GAS_PRICE);
      const costUSD = parseFloat(costBASED) * CONFIG.BASED_TO_USD;

      const oddsChange = [
        Number(oddsAfter[0]) - Number(oddsBefore[0]),
        Number(oddsAfter[1]) - Number(oddsBefore[1]),
      ];

      console.log(`   ⛽ Gas used: ${gasUsed.toLocaleString()}`);
      console.log(`   💰 Cost: ${costBASED} BASED ($${costUSD.toFixed(8)})`);
      console.log(`   📊 Odds after: [${oddsAfter[0]}, ${oddsAfter[1]}]`);
      console.log(`   📈 Odds change: [${oddsChange[0]}, ${oddsChange[1]}]`);

      analysisResults.tests.push({
        series: "Bet Amount Variance",
        test: betTest.label,
        betAmount: betTest.amount,
        gasUsed,
        costBASED,
        costUSD: `$${costUSD.toFixed(8)}`,
        txHash: receipt.hash,
        oddsBefore: oddsBefore.map(o => o.toString()),
        oddsAfter: oddsAfter.map(o => o.toString()),
        oddsChange,
        blockNumber: receipt.blockNumber,
      });

      // Wait a bit between tests
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.log(`   ❌ Test failed: ${error.message}`);

      if (error.receipt) {
        console.log(`   ⛽ Gas used before revert: ${error.receipt.gasUsed.toString()}`);
      }

      analysisResults.tests.push({
        series: "Bet Amount Variance",
        test: betTest.label,
        betAmount: betTest.amount,
        status: "failed",
        error: error.message,
        gasUsed: error.receipt ? Number(error.receipt.gasUsed) : null,
      });
    }
  }

  // ========== ANALYSIS & SUMMARY ==========
  console.log("\n\n═".repeat(63));
  console.log("ANALYSIS SUMMARY");
  console.log("═".repeat(63));

  const successfulTests = analysisResults.tests.filter(t => !t.status || t.status !== "failed");

  if (successfulTests.length > 0) {
    const gasUsages = successfulTests.map(t => t.gasUsed);
    const minGas = Math.min(...gasUsages);
    const maxGas = Math.max(...gasUsages);
    const avgGas = gasUsages.reduce((a, b) => a + b, 0) / gasUsages.length;
    const variance = ((maxGas - minGas) / minGas * 100).toFixed(2);

    console.log("\n📊 Gas Usage Statistics:");
    console.log(`   Minimum: ${minGas.toLocaleString()} gas`);
    console.log(`   Maximum: ${maxGas.toLocaleString()} gas`);
    console.log(`   Average: ${Math.round(avgGas).toLocaleString()} gas`);
    console.log(`   Variance: ${variance}% (max vs min)`);

    // Analyze correlation between bet amount and gas
    console.log("\n🔍 Bet Amount vs Gas Correlation:");
    successfulTests.forEach(t => {
      const gasPerBASED = t.gasUsed / parseFloat(t.betAmount);
      console.log(`   ${t.betAmount.padStart(4)} BASED → ${t.gasUsed.toLocaleString().padStart(10)} gas (${Math.round(gasPerBASED).toLocaleString()} gas/BASED)`);
    });

    // Cost analysis
    const totalCost = successfulTests.reduce((sum, t) => sum + parseFloat(t.costBASED), 0);
    console.log(`\n💰 Total Testing Cost: ${totalCost.toFixed(6)} BASED ($${(totalCost * CONFIG.BASED_TO_USD).toFixed(6)})`);

    analysisResults.summary = {
      totalTests: analysisResults.tests.length,
      successfulTests: successfulTests.length,
      failedTests: analysisResults.tests.length - successfulTests.length,
      gasStats: {
        minimum: minGas,
        maximum: maxGas,
        average: Math.round(avgGas),
        variance: `${variance}%`,
      },
      totalCost: {
        BASED: totalCost.toFixed(6),
        USD: `$${(totalCost * CONFIG.BASED_TO_USD).toFixed(6)}`,
      },
    };
  }

  // ========== SAVE REPORTS ==========
  saveAnalysisReports();

  // ========== FINAL BALANCE ==========
  const finalBalance = await ethers.provider.getBalance(signer.address);
  const balanceUsed = parseFloat(analysisResults.initialBalance) - parseFloat(ethers.formatEther(finalBalance));

  console.log("\n\n═".repeat(63));
  console.log("FINAL SUMMARY");
  console.log("═".repeat(63));
  console.log(`Initial Balance: ${analysisResults.initialBalance} BASED`);
  console.log(`Final Balance: ${ethers.formatEther(finalBalance)} BASED`);
  console.log(`Balance Used: ${balanceUsed.toFixed(6)} BASED`);
  console.log("");
}

function saveAnalysisReports() {
  const dir = path.dirname(CONFIG.REPORT_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true});
  }

  // Save JSON
  fs.writeFileSync(CONFIG.REPORT_FILE, JSON.stringify(analysisResults, null, 2));
  console.log(`\n📝 Analysis report saved to: ${CONFIG.REPORT_FILE}`);

  // Generate Markdown report
  generateMarkdownReport();
}

function generateMarkdownReport() {
  let md = `# GAS DEEP DIVE ANALYSIS REPORT\n\n`;
  md += `**Generated**: ${analysisResults.timestamp}\n`;
  md += `**Network**: ${analysisResults.network} (Chain ID: ${analysisResults.chainId})\n`;
  md += `**Test Account**: ${analysisResults.testAccount}\n`;
  md += `**Initial Balance**: ${analysisResults.initialBalance} BASED\n\n`;

  md += `## Executive Summary\n\n`;
  if (analysisResults.summary.gasStats) {
    md += `### Gas Usage Statistics\n\n`;
    md += `- **Minimum Gas**: ${analysisResults.summary.gasStats.minimum.toLocaleString()}\n`;
    md += `- **Maximum Gas**: ${analysisResults.summary.gasStats.maximum.toLocaleString()}\n`;
    md += `- **Average Gas**: ${analysisResults.summary.gasStats.average.toLocaleString()}\n`;
    md += `- **Variance**: ${analysisResults.summary.gasStats.variance}\n\n`;

    md += `### Cost Analysis\n\n`;
    md += `- **Total Testing Cost**: ${analysisResults.summary.totalCost.BASED} BASED (${analysisResults.summary.totalCost.USD})\n`;
    md += `- **Tests Run**: ${analysisResults.summary.totalTests}\n`;
    md += `- **Successful**: ${analysisResults.summary.successfulTests}\n`;
    md += `- **Failed**: ${analysisResults.summary.failedTests}\n\n`;
  }

  md += `## Detailed Test Results\n\n`;
  md += `### Test Series 1: Bet Amount Variance\n\n`;
  md += `| Bet Amount | Gas Used | Cost (BASED) | Cost (USD) | Odds Before | Odds After | Odds Change |\n`;
  md += `|------------|----------|--------------|------------|-------------|------------|-------------|\n`;

  const betTests = analysisResults.tests.filter(t => t.series === "Bet Amount Variance" && !t.status);
  for (const t of betTests) {
    md += `| ${t.betAmount} BASED | ${t.gasUsed.toLocaleString()} | ${t.costBASED} | ${t.costUSD} | [${t.oddsBefore[0]}, ${t.oddsBefore[1]}] | [${t.oddsAfter[0]}, ${t.oddsAfter[1]}] | [${t.oddsChange[0]}, ${t.oddsChange[1]}] |\n`;
  }

  md += `\n## Key Findings\n\n`;

  if (analysisResults.summary.gasStats) {
    const variance = parseFloat(analysisResults.summary.gasStats.variance);

    if (variance < 5) {
      md += `### ✅ Gas Usage is Consistent\n\n`;
      md += `Gas usage variance of ${analysisResults.summary.gasStats.variance} indicates that bet amount has minimal impact on gas costs. This suggests the binary search algorithm converges quickly regardless of bet size.\n\n`;
    } else if (variance < 15) {
      md += `### ⚠️ Moderate Gas Variance\n\n`;
      md += `Gas usage variance of ${analysisResults.summary.gasStats.variance} shows some correlation with bet amount. Larger bets may require slightly more iterations in the binary search.\n\n`;
    } else {
      md += `### 🔴 High Gas Variance\n\n`;
      md += `Gas usage variance of ${analysisResults.summary.gasStats.variance} indicates significant differences based on bet amount. This requires further investigation into the binary search convergence patterns.\n\n`;
    }
  }

  md += `## Optimization Opportunities\n\n`;
  md += `### Potential Improvements\n\n`;
  md += `1. **Binary Search Optimization**: Analyze if iteration count can be reduced\n`;
  md += `2. **Initial Guess Improvement**: Use previous bet data to set better starting points\n`;
  md += `3. **Caching Strategy**: Cache recent curve calculations\n`;
  md += `4. **Early Exit Conditions**: Tighten convergence criteria\n\n`;

  md += `## Recommendations\n\n`;
  md += `- **Frontend Gas Limit**: Set to ${Math.ceil(analysisResults.summary.gasStats.maximum * 1.15).toLocaleString()} (15% buffer)\n`;
  md += `- **Wallet Configuration**: Ensure wallets support gas limits above 1M\n`;
  md += `- **User Communication**: Inform users about gas requirements\n`;
  md += `- **Further Testing**: Test with extreme bet amounts (very small and very large)\n\n`;

  fs.writeFileSync(CONFIG.REPORT_MD_FILE, md);
  console.log(`📝 Markdown report saved to: ${CONFIG.REPORT_MD_FILE}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
