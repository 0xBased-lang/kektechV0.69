/**
 * Helper script to calculate expected LMSR values for VirtualLiquidity tests
 *
 * This script simulates the exact LMSR calculations to determine correct test expectations
 * instead of using simple ratio pricing assumptions.
 */

const { ethers } = require("hardhat");

async function main() {
  console.log("📊 Calculating LMSR values for VirtualLiquidity test expectations\n");

  // Deploy contracts
  const LMSRCurve = await ethers.getContractFactory("LMSRCurve");
  const curve = await LMSRCurve.deploy();
  await curve.waitForDeployment();

  const b = ethers.parseEther("100"); // b = 100 BASED
  const VIRTUAL_LIQUIDITY = 100; // 100 shares per side

  console.log("Parameters:");
  console.log(`  b (liquidity): ${ethers.formatEther(b)} BASED`);
  console.log(`  Virtual liquidity: ${VIRTUAL_LIQUIDITY} shares per side\n`);

  // Test 1: Empty market
  console.log("=== Test 1: Empty Market ===");
  let qYes = 0 + VIRTUAL_LIQUIDITY;
  let qNo = 0 + VIRTUAL_LIQUIDITY;
  let [price1, price2] = await curve.getPrices(b, qYes, qNo);
  let odds1 = (100000000n / price1);
  let odds2 = (100000000n / price2);
  console.log(`  Virtual shares: YES=${qYes}, NO=${qNo}`);
  console.log(`  Prices: YES=${price1} bp, NO=${price2} bp`);
  console.log(`  Odds: YES=${odds1} bp (${Number(odds1)/10000}x), NO=${odds2} bp (${Number(odds2)/10000}x)`);
  console.log(`  ✅ Expected: Both 20000 bp (2.0x)\n`);

  // Test 2: After Alice bets 100 BASED on YES
  console.log("=== Test 2: First Bettor (100 BASED on YES) ===");
  console.log("  First, calculate how many shares Alice gets for 100 BASED...");

  // Binary search to find shares for 100 BASED bet
  let ethAmount = ethers.parseEther("100");
  let low = 0n;
  let high = 10000000n;
  let bestShares = 0n;

  for (let i = 0; i < 25; i++) {
    let mid = (low + high) / 2n;
    if (mid === 0n) break;

    let cost = await curve.calculateCost(b, 0, 0, true, mid);

    if (cost <= ethAmount) {
      bestShares = mid;
      low = mid + 1n;
    } else {
      high = mid - 1n;
    }

    if (cost === ethAmount) break;
    if (low > high) break;
  }

  console.log(`  Alice gets ${bestShares} shares for 100 BASED`);

  // Calculate odds after Alice's bet (with virtual liquidity)
  qYes = Number(bestShares) + VIRTUAL_LIQUIDITY;
  qNo = 0 + VIRTUAL_LIQUIDITY;
  [price1, price2] = await curve.getPrices(b, qYes, qNo);
  odds1 = (100000000n / price1);
  odds2 = (100000000n / price2);

  console.log(`  Virtual shares after bet: YES=${qYes}, NO=${qNo}`);
  console.log(`  Prices: YES=${price1} bp, NO=${price2} bp`);
  console.log(`  Odds: YES=${odds1} bp (${Number(odds1)/10000}x), NO=${odds2} bp (${Number(odds2)/10000}x)`);
  console.log(`  ❌ Test expects: YES=15000 bp (1.5x), NO=30000 bp (3.0x)`);
  console.log(`  ✅ LMSR actual: YES=${odds1} bp, NO=${odds2} bp\n`);

  // Test 3: After Bob also bets 100 BASED on NO
  console.log("=== Test 3: Second Bettor (100 BASED on NO) ===");
  console.log("  Calculating shares Bob gets for 100 BASED...");

  low = 0n;
  high = 10000000n;
  let bobShares = 0n;

  for (let i = 0; i < 25; i++) {
    let mid = (low + high) / 2n;
    if (mid === 0n) break;

    let cost = await curve.calculateCost(b, Number(bestShares), 0, false, mid);

    if (cost <= ethAmount) {
      bobShares = mid;
      low = mid + 1n;
    } else {
      high = mid - 1n;
    }

    if (cost === ethAmount) break;
    if (low > high) break;
  }

  console.log(`  Bob gets ${bobShares} shares for 100 BASED`);

  // Calculate odds after both bets
  qYes = Number(bestShares) + VIRTUAL_LIQUIDITY;
  qNo = Number(bobShares) + VIRTUAL_LIQUIDITY;
  [price1, price2] = await curve.getPrices(b, qYes, qNo);
  odds1 = (100000000n / price1);
  odds2 = (100000000n / price2);

  console.log(`  Virtual shares after both bets: YES=${qYes}, NO=${qNo}`);
  console.log(`  Prices: YES=${price1} bp, NO=${price2} bp`);
  console.log(`  Odds: YES=${odds1} bp (${Number(odds1)/10000}x), NO=${odds2} bp (${Number(odds2)/10000}x)`);
  console.log(`  ✅ Should be balanced (both ≈2.0x)\n`);

  // Test 4: Odds smoothness with 10 BASED bets
  console.log("=== Test 4: Odds Smoothness (10 BASED bets) ===");

  // Alice 10 BASED on YES
  low = 0n;
  high = 10000000n;
  let aliceSmall = 0n;
  let ethSmall = ethers.parseEther("10");

  for (let i = 0; i < 25; i++) {
    let mid = (low + high) / 2n;
    if (mid === 0n) break;

    let cost = await curve.calculateCost(b, 0, 0, true, mid);

    if (cost <= ethSmall) {
      aliceSmall = mid;
      low = mid + 1n;
    } else {
      high = mid - 1n;
    }

    if (cost === ethSmall) break;
    if (low > high) break;
  }

  qYes = Number(aliceSmall) + VIRTUAL_LIQUIDITY;
  qNo = 0 + VIRTUAL_LIQUIDITY;
  [price1, price2] = await curve.getPrices(b, qYes, qNo);
  odds1 = (100000000n / price1);
  odds2 = (100000000n / price2);

  console.log(`  After Alice bets 10 BASED on YES:`);
  console.log(`    Virtual shares: YES=${qYes}, NO=${qNo}`);
  console.log(`    Odds: YES=${odds1} bp (${Number(odds1)/10000}x), NO=${odds2} bp (${Number(odds2)/10000}x)`);
  console.log(`    ❌ Test expects: YES≈19090 bp, NO=21000 bp`);
  console.log(`    ✅ LMSR actual: YES=${odds1} bp, NO=${odds2} bp\n`);

  console.log("📝 Summary:");
  console.log("  The tests use simple ratio assumptions: odds = total_pool / side_pool");
  console.log("  But LMSR uses logarithmic pricing: price = e^(q/b) / sum");
  console.log("  We need to update test expectations to match actual LMSR values!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
