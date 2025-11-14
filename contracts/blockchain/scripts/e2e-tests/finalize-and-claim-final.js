const { ethers } = require("hardhat");

/**
 * FINALIZE AND CLAIM - FINAL TEST
 *
 * Market has been in RESOLVING state for 15+ hours.
 * Dispute window must have passed by now!
 * Let's finalize and test claims.
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
  console.log("🎯 FINAL TEST: Finalize Market + Test Claims");
  console.log("=".repeat(80) + "\n");

  const [signer] = await ethers.getSigners();

  // Get contracts
  const market = await ethers.getContractAt("PredictionMarket", MARKET_ADDRESS);
  const resolutionManager = await ethers.getContractAt(
    "ResolutionManager",
    RESOLUTION_MANAGER
  );

  // Check initial state
  const initialState = await market.currentState();
  console.log("📊 INITIAL STATE:");
  console.log(`   Market State: ${initialState} (${STATES[initialState]})`);

  const initialBalance = await ethers.provider.getBalance(signer.address);
  console.log(`   Your Balance: ${ethers.formatEther(initialBalance)} BASED\n`);

  if (initialState === 5n) {
    console.log("   ✅ Already FINALIZED! Skipping to claims...\n");
  } else if (initialState === 3n) {
    console.log("═══ STEP 1: FINALIZE MARKET ═══\n");

    try {
      // Try to finalize via ResolutionManager
      console.log("   Attempting finalization...");

      const tx = await resolutionManager.finalizeResolution(MARKET_ADDRESS, {
        gasLimit: 500000,
      });

      console.log(`   📝 Transaction sent: ${tx.hash}`);
      console.log(`   ⏳ Waiting for confirmation...`);

      const receipt = await tx.wait();

      console.log(`   ✅ Finalization SUCCESS!`);
      console.log(`   📊 Gas Used: ${receipt.gasUsed.toString()}`);
      const gasPrice = receipt.gasPrice || tx.gasPrice;
      const cost = (receipt.gasUsed * gasPrice) / BigInt(1e9); // Convert to Gwei
      console.log(`   💰 Cost: ${ethers.formatUnits(cost, "gwei")} BASED`);

      // Check new state
      const newState = await market.currentState();
      console.log(`   🎯 New State: ${newState} (${STATES[newState]})\n`);
    } catch (error) {
      console.log(`   ❌ Finalization FAILED: ${error.message}\n`);

      // Try to understand why
      if (error.message.includes("DisputeWindowNotPassed")) {
        console.log("   ⏳ Dispute window has not passed yet. Need to wait longer.\n");
      } else if (error.message.includes("InvalidMarketState")) {
        console.log("   ⚠️  Market is in wrong state for finalization.\n");
      }

      console.log("   Detailed error:", error);
      return;
    }
  } else {
    console.log(`   ❌ Wrong state: ${STATES[initialState]}`);
    console.log(`   Cannot proceed with finalization.\n`);
    return;
  }

  // Now test claims
  console.log("═══ STEP 2: CLAIM WINNINGS ═══\n");

  // Check final state
  const finalState = await market.currentState();

  if (finalState !== 5n) {
    console.log(`   ❌ Market not finalized (state: ${STATES[finalState]})`);
    console.log(`   Cannot claim winnings yet.\n`);
    return;
  }

  // Check your bet
  const bet = await market.bets(signer.address);
  console.log("   Your Position:");
  console.log(`   - Bet Amount: ${ethers.formatEther(bet.amount)} BASED`);
  console.log(`   - Outcome: ${bet.outcome}`);
  console.log(`   - Shares: ${ethers.formatEther(bet.shares)}`);
  console.log(`   - Claimed: ${bet.claimed}\n`);

  if (bet.claimed) {
    console.log("   ✅ Already claimed!\n");
    return;
  }

  if (bet.amount === 0n) {
    console.log("   ⚠️  No bet placed, nothing to claim.\n");
    return;
  }

  // Get final outcome
  let finalOutcome;
  try {
    finalOutcome = await market.finalOutcome();
    console.log(`   Final Outcome: ${finalOutcome}\n`);
  } catch (e) {
    console.log(`   ⚠️  Could not get final outcome: ${e.message}\n`);
  }

  // Attempt claim
  console.log("   Attempting to claim winnings...");

  try {
    const tx = await market.claimWinnings({
      gasLimit: 300000,
    });

    console.log(`   📝 Transaction sent: ${tx.hash}`);
    console.log(`   ⏳ Waiting for confirmation...`);

    const receipt = await tx.wait();

    console.log(`   ✅ CLAIM SUCCESS!`);
    console.log(`   📊 Gas Used: ${receipt.gasUsed.toString()}`);
    const gasPrice = receipt.gasPrice || tx.gasPrice;
    const cost = (receipt.gasUsed * gasPrice) / BigInt(1e9);
    console.log(`   💰 Gas Cost: ${ethers.formatUnits(cost, "gwei")} BASED`);

    // Check balance change
    const finalBalance = await ethers.provider.getBalance(signer.address);
    const balanceChange = finalBalance - initialBalance;
    console.log(`   💵 Balance Change: ${ethers.formatEther(balanceChange)} BASED`);

    if (balanceChange > 0n) {
      console.log(`   🎉 YOU WON! Profit: ${ethers.formatEther(balanceChange)} BASED`);
    } else {
      console.log(`   You claimed your winnings.`);
    }

    // Verify claim status
    const betAfter = await market.bets(signer.address);
    console.log(`   \n   Claim Status: ${betAfter.claimed ? "✅ CLAIMED" : "❌ NOT CLAIMED"}`);

  } catch (error) {
    console.log(`   ❌ CLAIM FAILED: ${error.message}\n`);

    if (error.message.includes("NoWinnings")) {
      console.log(`   You did not win on outcome ${bet.outcome}.\n`);
    } else if (error.message.includes("AlreadyClaimed")) {
      console.log(`   You already claimed your winnings.\n`);
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log("✅ FINAL TEST COMPLETE");
  console.log("=".repeat(80) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
