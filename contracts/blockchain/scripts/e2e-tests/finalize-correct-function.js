const { ethers } = require("hardhat");

/**
 * FINALIZE WITH CORRECT FUNCTION
 *
 * ROOT CAUSE: finalizeResolution() only updates ResolutionManager state!
 * SOLUTION: Use adminResolveMarket() which calls market.finalize()
 */

const MARKET_ADDRESS = "0x12d830fb965598c11a31ea183F79eD40DFf99a11";
const RESOLUTION_MANAGER = "0x10daF33E321ED8977e369a36FcC6Beb3d3d106a0";

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
  console.log("🎯 CORRECT FINALIZATION: Using adminResolveMarket()");
  console.log("=".repeat(80) + "\n");

  const [signer] = await ethers.getSigners();

  const market = await ethers.getContractAt("PredictionMarket", MARKET_ADDRESS);
  const resolutionManager = await ethers.getContractAt(
    "ResolutionManager",
    RESOLUTION_MANAGER
  );

  // Check initial state
  const initialState = await market.currentState();
  console.log("📊 INITIAL STATE:");
  console.log(`   Market State: ${initialState} (${STATES[initialState]})\n`);

  if (initialState === 5n) {
    console.log("   ✅ Already FINALIZED!\n");
  } else if (initialState === 3n) {
    console.log("═══ FINALIZING MARKET ═══\n");

    // Get resolution data to know the outcome
    const resolutionData = await resolutionManager.getResolutionData(MARKET_ADDRESS);
    console.log(`   Proposed Outcome: ${resolutionData.outcome}`);
    console.log(`   Resolved At: ${resolutionData.resolvedAt}\n`);

    try {
      // Use adminResolveMarket which calls BOTH:
      // 1. Updates ResolutionManager state
      // 2. Calls market.finalize()
      console.log("   Using adminResolveMarket() to finalize...");

      const tx = await resolutionManager.adminResolveMarket(
        MARKET_ADDRESS,
        resolutionData.outcome,
        "Dispute window passed - finalizing market",
        { gasLimit: 500000 }
      );

      console.log(`   📝 Transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();

      console.log(`   ✅ FINALIZATION SUCCESS!`);
      console.log(`   📊 Gas Used: ${receipt.gasUsed.toString()}`);
      const cost = (receipt.gasUsed * receipt.gasPrice) / BigInt(1e9);
      console.log(`   💰 Cost: ${ethers.formatUnits(cost, "gwei")} BASED\n`);

      // Verify final state
      const finalState = await market.currentState();
      console.log(`   🎯 New State: ${finalState} (${STATES[finalState]})`);

      if (finalState === 5n) {
        console.log(`   🎉 MARKET NOW FINALIZED!\n`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
      console.log(error);
      return;
    }
  } else {
    console.log(`   ⚠️  Wrong state: ${STATES[initialState]}\n`);
    return;
  }

  // Now test claims!
  console.log("═══ TESTING CLAIMS ═══\n");

  const finalState = await market.currentState();
  if (finalState !== 5n) {
    console.log(`   ❌ Market not finalized (state: ${STATES[finalState]})\n`);
    return;
  }

  // Check bet
  const bet = await market.bets(signer.address);
  console.log("   Your Position:");
  console.log(`   - Amount: ${ethers.formatEther(bet.amount)} BASED`);
  console.log(`   - Outcome: ${bet.outcome}`);
  console.log(`   - Shares: ${ethers.formatEther(bet.shares)}`);
  console.log(`   - Claimed: ${bet.claimed}\n`);

  if (bet.claimed) {
    console.log("   ✅ Already claimed!\n");
    return;
  }

  if (bet.amount === 0n) {
    console.log("   ⚠️  No bet to claim.\n");
    return;
  }

  // Check final outcome
  const finalOutcome = await market.finalOutcome();
  console.log(`   Final Outcome: ${finalOutcome}\n`);

  if (bet.outcome !== finalOutcome) {
    console.log(`   ⚠️  You bet on outcome ${bet.outcome} but outcome ${finalOutcome} won.`);
    console.log(`   You will not receive winnings.\n`);
    // Try to claim anyway to test the error handling
  }

  // Attempt claim
  console.log("   Attempting to claim...");

  try {
    const initialBalance = await ethers.provider.getBalance(signer.address);

    const tx = await market.claimWinnings({ gasLimit: 300000 });
    console.log(`   📝 Transaction sent: ${tx.hash}`);

    const receipt = await tx.wait();
    console.log(`   ✅ CLAIM SUCCESS!`);
    console.log(`   📊 Gas Used: ${receipt.gasUsed.toString()}`);

    const finalBalance = await ethers.provider.getBalance(signer.address);
    const netChange = finalBalance - initialBalance;

    console.log(`   💵 Net Balance Change: ${ethers.formatEther(netChange)} BASED`);

    if (netChange > 0n) {
      console.log(`   🎉 YOU WON! Profit: ${ethers.formatEther(netChange)} BASED\n`);
    } else {
      console.log(`   Claim processed (lost gas fees).\n`);
    }
  } catch (error) {
    console.log(`   ❌ Claim failed: ${error.message}\n`);

    if (error.message.includes("NoWinnings") || error.message.includes("No winnings")) {
      console.log(`   Expected - you didn't win on outcome ${bet.outcome}.\n`);
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log("✅ FINAL TEST COMPLETE!");
  console.log("=".repeat(80) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
