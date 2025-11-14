const { ethers } = require("hardhat");

/**
 * TEST FINALIZATION AND CLAIMS
 * Market: 0x12d830fb965598c11a31ea183F79eD40DFf99a11 (already in RESOLVING state)
 */

const MARKET_ADDRESS = "0x12d830fb965598c11a31ea183F79eD40DFf99a11";

const CONFIG = {
  RESOLUTION_MANAGER: "0x10daF33E321ED8977e369a36FcC6Beb3d3d106a0",
  GAS_PRICE: ethers.parseUnits("9", "gwei"),
};

async function sleep(seconds) {
  console.log(`\n⏳ Waiting ${seconds} seconds...`);
  for (let i = seconds; i > 0; i--) {
    if (i % 10 === 0 || i <= 5) {
      process.stdout.write(`\r${i} seconds remaining...  `);
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  console.log("\r✅ Wait complete!                  \n");
}

async function main() {
  console.log("\n🎯 TEST FINALIZATION AND CLAIMS\n");

  const [signer] = await ethers.getSigners();
  console.log("Account:", signer.address);
  console.log("Market:", MARKET_ADDRESS);

  const market = await ethers.getContractAt("PredictionMarket", MARKET_ADDRESS);
  const resolutionManager = await ethers.getContractAt("ResolutionManager", CONFIG.RESOLUTION_MANAGER);

  // Check current state
  let state = await market.currentState();
  console.log("\n📊 Current Market State:", Number(state), "(3=RESOLVING, 5=FINALIZED)");

  if (state !== 3n) {
    console.log("⚠️  Market is not in RESOLVING state - cannot finalize!");
    console.log("Expected state: 3 (RESOLVING)");
    console.log(`Actual state: ${Number(state)}`);
    return;
  }

  // ═══════════════════════════════════════════════════════════════
  // STEP 1: CHECK DISPUTE WINDOW
  // ═══════════════════════════════════════════════════════════════
  console.log("\n" + "═".repeat(60));
  console.log("STEP 1: CHECK DISPUTE WINDOW");
  console.log("═".repeat(60));

  const communityDispute = await resolutionManager.getCommunityDisputeWindow(MARKET_ADDRESS);
  const disputeEndTime = Number(communityDispute.endTime);
  const now = Math.floor(Date.now() / 1000);
  const timeUntilDispute = disputeEndTime - now;

  console.log("Dispute End Time:", new Date(disputeEndTime * 1000).toLocaleString());
  console.log("Current Time:", new Date(now * 1000).toLocaleString());

  if (timeUntilDispute > 0) {
    console.log(`⏳ Dispute window active for ${timeUntilDispute} more seconds`);
    console.log("Waiting for dispute window to pass...");
    await sleep(timeUntilDispute + 2);
  } else {
    console.log(`✅ Dispute window passed ${-timeUntilDispute} seconds ago`);
  }

  // ═══════════════════════════════════════════════════════════════
  // STEP 2: FINALIZE RESOLUTION
  // ═══════════════════════════════════════════════════════════════
  console.log("\n" + "═".repeat(60));
  console.log("STEP 2: FINALIZE RESOLUTION");
  console.log("═".repeat(60));

  console.log("Calling finalizeResolution (admin only)...");

  try {
    const finalizeTx = await resolutionManager.finalizeResolution(
      MARKET_ADDRESS,
      {
        gasLimit: 500000,
        gasPrice: CONFIG.GAS_PRICE,
      }
    );

    console.log("TX submitted:", finalizeTx.hash);
    const receipt = await finalizeTx.wait();

    console.log("\n✅ FINALIZATION SUCCESSFUL!");
    console.log("Gas used:", receipt.gasUsed.toString());
    console.log("Cost: $" + ((Number(receipt.gasUsed) * 9) / 1e9).toFixed(9));

    // Check new state
    state = await market.currentState();
    console.log("New Market State:", Number(state), "(should be 5=FINALIZED)");

  } catch (error) {
    console.error("\n❌ FINALIZATION FAILED:");
    console.error(error.message);
    return;
  }

  // ═══════════════════════════════════════════════════════════════
  // STEP 3: TEST CLAIMS
  // ═══════════════════════════════════════════════════════════════
  console.log("\n" + "═".repeat(60));
  console.log("STEP 3: TEST CLAIMS");
  console.log("═".repeat(60));

  // Check if signer has a bet
  const bet = await market.bets(signer.address);
  console.log("Signer's Bet:");
  console.log("  Amount:", ethers.formatEther(bet.amount), "BASED");
  console.log("  Outcome:", Number(bet.outcome));
  console.log("  Claimed:", bet.claimed);

  const result = await market.result();
  console.log("Winning Outcome:", Number(result));

  if (bet.amount > 0n && !bet.claimed) {
    if (Number(bet.outcome) === Number(result)) {
      console.log("\n✅ Signer is a WINNER! Claiming winnings...");
    } else {
      console.log("\n❌ Signer is a LOSER (bet on wrong outcome)");
      console.log("Can still call claimWinnings but will get 0");
    }

    try {
      const claimTx = await market.claimWinnings({
        gasLimit: 300000,
        gasPrice: CONFIG.GAS_PRICE,
      });

      const claimReceipt = await claimTx.wait();
      console.log("\n✅ CLAIM SUCCESSFUL!");
      console.log("Gas used:", claimReceipt.gasUsed.toString());

      // Check if bet was cleared
      const betAfter = await market.bets(signer.address);
      console.log("Bet status after claim:");
      console.log("  Amount:", ethers.formatEther(betAfter.amount), "BASED");
      console.log("  Claimed:", betAfter.claimed);

    } catch (error) {
      console.error("\n❌ CLAIM FAILED:");
      console.error(error.message);
    }
  } else if (bet.amount === 0n) {
    console.log("\n⚠️  Signer has no bet to claim");
  } else if (bet.claimed) {
    console.log("\n⚠️  Winnings already claimed!");
  }

  // ═══════════════════════════════════════════════════════════════
  // FINAL SUMMARY
  // ═══════════════════════════════════════════════════════════════
  console.log("\n" + "═".repeat(60));
  console.log("🎉 LIFECYCLE TEST COMPLETE!");
  console.log("═".repeat(60));

  const finalState = await market.currentState();
  const finalLiquidity = await market.getLiquidity();
  const isResolved = await market.isResolved();

  console.log("\n📊 Final Market Status:");
  console.log("State:", Number(finalState), "(5=FINALIZED)");
  console.log("Resolved:", isResolved);
  console.log("Winning Outcome:", Number(result));
  console.log("Remaining Liquidity:", ethers.formatEther(finalLiquidity[0] + finalLiquidity[1]), "BASED");

  console.log("\n✅ ALL TESTS COMPLETE! 🚀\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
