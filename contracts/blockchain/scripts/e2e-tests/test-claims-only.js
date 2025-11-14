const { ethers } = require("hardhat");

/**
 * TEST CLAIMS ONLY
 * Market 4 is now finalized - test claiming winnings
 */

const MARKET_ADDRESS = "0x12d830fb965598c11a31ea183F79eD40DFf99a11";

async function main() {
  console.log("\n🧪 Testing Claims on Finalized Market 4...\n");

  const [signer] = await ethers.getSigners();
  const market = await ethers.getContractAt("PredictionMarket", MARKET_ADDRESS);

  // Verify finalized
  const state = await market.currentState();
  console.log(`Market State: ${state} (5 = FINALIZED)\n`);

  if (state !== 5n) {
    console.log(`❌ Market not finalized (state ${state})\n`);
    return;
  }

  // Get bet info
  const betInfo = await market.getBetInfo(signer.address);
  console.log("Your Bet:");
  console.log(`  Amount: ${ethers.formatEther(betInfo.amount)} BASED`);
  console.log(`  Outcome: ${betInfo.outcome}`);
  console.log(`  Shares: ${ethers.formatEther(betInfo.shares)}`);
  console.log(`  Claimed: ${betInfo.claimed}\n`);

  if (betInfo.claimed) {
    console.log("✅ Already claimed!\n");
    return;
  }

  if (betInfo.amount === 0n) {
    console.log("⚠️  No bet placed\n");
    return;
  }

  // Get final outcome
  const finalOutcome = await market.finalOutcome();
  console.log(`Final Outcome: ${finalOutcome}\n`);

  // Check if won
  const hasWinnings = await market.hasWinnings(signer.address);
  console.log(`Has Winnings: ${hasWinnings}\n`);

  if (!hasWinnings) {
    console.log(`⚠️  You bet on outcome ${betInfo.outcome} but outcome ${finalOutcome} won`);
    console.log(`   No winnings to claim.\n`);
    return;
  }

  // Calculate expected payout
  const payout = await market.calculatePayout(signer.address);
  console.log(`Expected Payout: ${ethers.formatEther(payout)} BASED\n`);

  // Attempt claim
  const initialBalance = await ethers.provider.getBalance(signer.address);

  console.log("Attempting claim...");

  try {
    const tx = await market.claimWinnings({
      gasLimit: 200000,
      gasPrice: 10,
    });

    console.log(`📝 Tx: ${tx.hash}`);
    const receipt = await tx.wait();

    console.log(`✅ CLAIM SUCCESS!`);
    console.log(`Gas Used: ${receipt.gasUsed}\n`);

    const finalBalance = await ethers.provider.getBalance(signer.address);
    const netChange = finalBalance - initialBalance;

    console.log(`Balance Change: ${ethers.formatEther(netChange)} BASED`);

    if (netChange > 0n) {
      console.log(`🎉 NET PROFIT: ${ethers.formatEther(netChange)} BASED\n`);
    } else {
      console.log(`(Gas fees subtracted from payout)\n`);
    }

    // Verify claimed status
    const afterBet = await market.getBetInfo(signer.address);
    console.log(`Claimed Status: ${afterBet.claimed ? "✅ CLAIMED" : "❌ NOT CLAIMED"}\n`);

  } catch (error) {
    console.log(`❌ Claim failed: ${error.message}\n`);
  }

  console.log("✅ CLAIMS TEST COMPLETE!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
