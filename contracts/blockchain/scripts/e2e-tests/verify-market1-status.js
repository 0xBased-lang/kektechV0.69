const { ethers } = require("hardhat");

/**
 * VERIFY MARKET 1 STATUS
 *
 * Purpose: Check current state of Market 1 and validate it's ready for testing
 * Market Address: 0x31d2BC49A6FD4a066F5f8AC61Acd0E6c9105DD84
 *
 * This script:
 * - Verifies Market 1 exists and is accessible
 * - Gets current market state
 * - Retrieves all market parameters
 * - Gets current odds
 * - Checks total pool and bets
 * - Determines if market is ready for testing
 */

const CONFIG = {
  MARKET1_ADDRESS: "0x31d2BC49A6FD4a066F5f8AC61Acd0E6c9105DD84",
  RPC_URL: "https://rpc.basedai.network",
  CHAIN_ID: 32323,
};

const STATE_NAMES = [
  "PROPOSED",
  "APPROVED",
  "ACTIVE",
  "RESOLVING",
  "DISPUTED",
  "FINALIZED"
];

async function main() {
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║         VERIFY MARKET 1 STATUS - E2E TEST SUITE           ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  try {
    // Get signer
    const [signer] = await ethers.getSigners();
    console.log("📍 Connected Account:", signer.address);

    const balance = await ethers.provider.getBalance(signer.address);
    console.log("💰 Balance:", ethers.formatEther(balance), "BASED");
    console.log("");

    // Load Market 1
    console.log("🔍 Loading Market 1...");
    console.log("   Address:", CONFIG.MARKET1_ADDRESS);

    const market = await ethers.getContractAt(
      "PredictionMarket",
      CONFIG.MARKET1_ADDRESS
    );

    // Check if contract exists
    const code = await ethers.provider.getCode(CONFIG.MARKET1_ADDRESS);
    if (code === "0x") {
      throw new Error("❌ Market 1 does not exist at this address!");
    }
    console.log("✅ Market 1 contract exists");
    console.log("");

    // Get market state
    console.log("📊 MARKET STATE INFORMATION");
    console.log("═══════════════════════════════════════════════════════════");

    const currentState = await market.currentState();
    const stateNumber = Number(currentState);
    const stateName = STATE_NAMES[stateNumber];

    console.log("   Current State:", stateNumber, "=", stateName);

    // Get market details
    const question = await market.question();
    const outcome1 = await market.outcome1();
    const outcome2 = await market.outcome2();
    const resolutionTime = await market.resolutionTime();
    const creator = await market.creator();

    console.log("\n📝 MARKET DETAILS");
    console.log("═══════════════════════════════════════════════════════════");
    console.log("   Question:", question);
    console.log("   Outcome 1:", outcome1);
    console.log("   Outcome 2:", outcome2);
    console.log("   Creator:", creator);

    const resolutionDate = new Date(Number(resolutionTime) * 1000);
    const now = new Date();
    const timeUntilResolution = Number(resolutionTime) - Math.floor(Date.now() / 1000);

    console.log("   Resolution Time:", resolutionDate.toLocaleString());
    if (timeUntilResolution > 0) {
      const days = Math.floor(timeUntilResolution / 86400);
      const hours = Math.floor((timeUntilResolution % 86400) / 3600);
      console.log("   Time Until Resolution:", `${days} days, ${hours} hours`);
    } else {
      console.log("   ⚠️  Resolution time has passed!");
    }

    // Get odds
    console.log("\n📈 CURRENT ODDS");
    console.log("═══════════════════════════════════════════════════════════");

    const odds = await market.getOdds();
    const odds1 = Number(odds[0]);
    const odds2 = Number(odds[1]);

    console.log("   Outcome 1 Odds:", odds1, "basis points =", (odds1 / 100).toFixed(2) + "%");
    console.log("   Outcome 2 Odds:", odds2, "basis points =", (odds2 / 100).toFixed(2) + "%");

    // Get pool info
    console.log("\n💧 POOL INFORMATION");
    console.log("═══════════════════════════════════════════════════════════");

    const totalPool = await market.getTotalPool();
    console.log("   Total Pool:", ethers.formatEther(totalPool), "BASED");

    const totalShares = await market.getTotalShares();
    console.log("   Total Shares:", ethers.formatEther(totalShares));

    // Try to get pool breakdown by outcome
    try {
      const pool1 = await market.pool1();
      const pool2 = await market.pool2();
      console.log("   Pool 1 (Outcome 1):", ethers.formatEther(pool1), "BASED");
      console.log("   Pool 2 (Outcome 2):", ethers.formatEther(pool2), "BASED");
    } catch (e) {
      console.log("   (Pool breakdown not available in this contract version)");
    }

    // Check if user has bet
    console.log("\n👤 YOUR BET INFORMATION");
    console.log("═══════════════════════════════════════════════════════════");

    try {
      const userBet = await market.getUserBetInfo(signer.address);
      const userOutcome = Number(userBet.outcome);
      const userAmount = ethers.formatEther(userBet.amount);
      const userShares = ethers.formatEther(userBet.shares);

      if (userOutcome === 0) {
        console.log("   You have NOT placed a bet on this market");
      } else {
        console.log("   You bet on Outcome:", userOutcome);
        console.log("   Bet Amount:", userAmount, "BASED");
        console.log("   Shares:", userShares);

        // Calculate potential payout if market resolved now
        try {
          const payout = await market.calculatePayout(signer.address);
          console.log("   Potential Payout:", ethers.formatEther(payout), "BASED");

          if (Number(payout) > 0) {
            const returnMultiple = (Number(ethers.formatEther(payout)) / Number(userAmount)).toFixed(2);
            console.log("   Return Multiple:", returnMultiple + "x");
          }
        } catch (e) {
          console.log("   (Payout calculation not available yet)");
        }
      }
    } catch (e) {
      console.log("   Unable to retrieve bet info:", e.message);
    }

    // Determine readiness for testing
    console.log("\n🎯 TESTING READINESS ASSESSMENT");
    console.log("═══════════════════════════════════════════════════════════");

    let canBet = false;
    let needsApproval = false;
    let needsActivation = false;
    let canResolve = false;
    let isResolved = false;

    switch (stateNumber) {
      case 0: // PROPOSED
        needsApproval = true;
        console.log("   ⏸️  Status: Market needs admin approval");
        console.log("   Action: Run factory.adminApproveMarket()");
        break;
      case 1: // APPROVED
        needsActivation = true;
        console.log("   ⏸️  Status: Market needs activation");
        console.log("   Action: Run market.activateMarket()");
        break;
      case 2: // ACTIVE
        canBet = true;
        console.log("   ✅ Status: Market is ACTIVE and accepting bets!");
        console.log("   Ready: Phase A testing can proceed");
        break;
      case 3: // RESOLVING
        canResolve = true;
        console.log("   ⏳ Status: Market is in RESOLVING state");
        console.log("   Action: Wait for dispute window or finalize");
        break;
      case 4: // DISPUTED
        console.log("   ⚠️  Status: Market is DISPUTED");
        console.log("   Action: Admin needs to resolve dispute");
        break;
      case 5: // FINALIZED
        isResolved = true;
        console.log("   ✅ Status: Market is FINALIZED");
        console.log("   Action: Winners can claim winnings");
        break;
    }

    // Additional checks
    console.log("\n📋 PRE-TEST CHECKLIST");
    console.log("═══════════════════════════════════════════════════════════");
    console.log("   [" + (code !== "0x" ? "✅" : "❌") + "] Market 1 exists");
    console.log("   [" + (canBet ? "✅" : "⏸️ ") + "] Market is ACTIVE (can bet)");
    console.log("   [" + (Number(totalPool) > 0 ? "✅" : "⏸️ ") + "] Market has existing bets");
    console.log("   [" + (Number(balance) > ethers.parseEther("1000") ? "✅" : "⚠️ ") + "] Sufficient BASED balance (need 1000+ for testing)");
    console.log("   [" + (timeUntilResolution > 0 ? "✅" : "⚠️ ") + "] Resolution time not passed");

    // Summary
    console.log("\n" + "═".repeat(63));
    console.log("SUMMARY");
    console.log("═".repeat(63));

    if (canBet) {
      console.log("✅ Market 1 is READY for Phase A testing!");
      console.log("   You can proceed with test-market1-lifecycle.js");
      console.log("");
      console.log("   Next steps:");
      console.log("   1. Ensure you have 5 test accounts with 1000+ BASED each");
      console.log("   2. Run: npx hardhat run scripts/e2e-tests/test-market1-lifecycle.js --network basedai_mainnet");
    } else if (needsApproval) {
      console.log("⏸️  Market 1 needs APPROVAL first");
      console.log("   Run admin approval before testing");
    } else if (needsActivation) {
      console.log("⏸️  Market 1 needs ACTIVATION first");
      console.log("   Run market activation before testing");
    } else if (isResolved) {
      console.log("✅ Market 1 is already FINALIZED");
      console.log("   Can test winnings claim, but cannot test betting");
      console.log("   Consider creating Market 2 for Phase B testing");
    } else {
      console.log("⏳ Market 1 is in state:", stateName);
      console.log("   Check status and determine appropriate next action");
    }

    console.log("═".repeat(63));
    console.log("");

  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    if (error.data) {
      console.error("   Error Data:", error.data);
    }
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
