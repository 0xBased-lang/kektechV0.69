const { ethers } = require("hardhat");

/**
 * CHECK MARKET FINAL STATUS
 *
 * 15 hours have passed since resolution time!
 * Let's check if we can now finalize the market.
 */

const MARKET_ADDRESS = "0x12d830fb965598c11a31ea183F79eD40DFf99a11";
const RESOLUTION_TIME = 1762470568;

const CONFIG = {
  RESOLUTION_MANAGER: "0x10daF33E321ED8977e369a36FcC6Beb3d3d106a0",
  PARAMETER_STORAGE: "0x59ee8B508DCe8Dc4c13e49628E3ecb810F0c7EcA",
};

const STATES = {
  0: "PROPOSED",
  1: "APPROVED",
  2: "ACTIVE",
  3: "RESOLVING",
  4: "DISPUTED",
  5: "FINALIZED",
  6: "REJECTED",
};

async function main() {
  console.log("\n" + "=".repeat(80));
  console.log("🔍 CHECKING MARKET FINAL STATUS (15+ Hours After Resolution)");
  console.log("=".repeat(80) + "\n");

  const [signer] = await ethers.getSigners();
  const currentTime = Math.floor(Date.now() / 1000);
  const timeSinceResolution = currentTime - RESOLUTION_TIME;

  console.log("⏰ TIME STATUS:");
  console.log(`   Current Time: ${currentTime} (${new Date(currentTime * 1000).toISOString()})`);
  console.log(`   Resolution Time: ${RESOLUTION_TIME} (${new Date(RESOLUTION_TIME * 1000).toISOString()})`);
  console.log(`   Time Since Resolution: ${timeSinceResolution}s (${(timeSinceResolution / 3600).toFixed(2)} hours)`);
  console.log(`   Status: ${timeSinceResolution > 0 ? "✅ PASSED" : "❌ NOT YET"}\n`);

  // Get contracts
  const market = await ethers.getContractAt("PredictionMarket", MARKET_ADDRESS);
  const resolutionManager = await ethers.getContractAt(
    "ResolutionManager",
    CONFIG.RESOLUTION_MANAGER
  );
  const paramStorage = await ethers.getContractAt(
    "ParameterStorage",
    CONFIG.PARAMETER_STORAGE
  );

  // Check market state
  const state = await market.currentState();
  console.log("📊 MARKET STATE:");
  console.log(`   Current State: ${state} (${STATES[state]})`);

  // Check proposal details
  try {
    const proposal = await market.proposedOutcome();
    console.log(`   Proposed Outcome: ${proposal}`);
  } catch (e) {
    console.log(`   Proposed Outcome: Not available (${e.message})`);
  }

  // Check dispute window
  const disputeWindow = await paramStorage.getUint(ethers.id("disputeWindow"));
  console.log(`   Dispute Window: ${disputeWindow}s (${disputeWindow / 3600} hours)\n`);

  // Check if we can finalize
  console.log("🎯 FINALIZATION CHECK:");

  if (state === 3n) {
    console.log("   ✅ State: RESOLVING (ready for finalization check)");

    // Calculate when dispute window ends
    // Need to check when resolution was proposed
    try {
      const resolutionTimestamp = await market.resolutionTime();
      const disputeEnds = Number(resolutionTimestamp) + Number(disputeWindow);
      const canFinalize = currentTime >= disputeEnds;

      console.log(`   Resolution Timestamp: ${resolutionTimestamp}`);
      console.log(`   Dispute Window Ends: ${disputeEnds} (${new Date(disputeEnds * 1000).toISOString()})`);
      console.log(`   Can Finalize: ${canFinalize ? "✅ YES" : "❌ NO (waiting)"}`);

      if (canFinalize) {
        console.log("\n   🎉 READY TO FINALIZE!");
      } else {
        const waitTime = disputeEnds - currentTime;
        console.log(`\n   ⏳ Wait ${waitTime}s (${(waitTime / 60).toFixed(1)} minutes)`);
      }
    } catch (e) {
      console.log(`   ⚠️  Could not check finalization timing: ${e.message}`);
    }
  } else if (state === 5n) {
    console.log("   ✅ Already FINALIZED!");
  } else {
    console.log(`   ❌ Wrong state: ${STATES[state]}`);
  }

  // Check balances
  console.log("\n💰 MARKET BALANCES:");
  const balance = await ethers.provider.getBalance(MARKET_ADDRESS);
  console.log(`   Market Balance: ${ethers.formatEther(balance)} BASED`);

  // Check total shares
  try {
    const shares0 = await market.totalShares(0);
    const shares1 = await market.totalShares(1);
    console.log(`   Total Shares [0]: ${ethers.formatEther(shares0)}`);
    console.log(`   Total Shares [1]: ${ethers.formatEther(shares1)}`);
  } catch (e) {
    console.log(`   Shares: ${e.message}`);
  }

  // Check user position
  console.log("\n👤 YOUR POSITION:");
  try {
    const bet = await market.bets(signer.address);
    console.log(`   Your Bet Amount: ${ethers.formatEther(bet.amount)} BASED`);
    console.log(`   Your Outcome: ${bet.outcome}`);
    console.log(`   Your Shares: ${ethers.formatEther(bet.shares)}`);
    console.log(`   Has Claimed: ${bet.claimed}`);
  } catch (e) {
    console.log(`   Position: ${e.message}`);
  }

  console.log("\n" + "=".repeat(80));
  console.log("✅ STATUS CHECK COMPLETE");
  console.log("=".repeat(80) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
