const { ethers } = require("hardhat");

/**
 * MINIMAL FINALIZATION
 * Uses explicit gas settings to avoid estimation issues
 */

const MARKET_ADDRESS = "0x12d830fb965598c11a31ea183F79eD40DFf99a11";
const RESOLUTION_MANAGER = "0x10daF33E321ED8977e369a36FcC6Beb3d3d106a0";

async function main() {
  console.log("\n🎯 Finalizing Market 4 (minimal approach)...\n");

  const [signer] = await ethers.getSigners();

  const market = await ethers.getContractAt("PredictionMarket", MARKET_ADDRESS);
  const resolutionManager = await ethers.getContractAt(
    "ResolutionManager",
    RESOLUTION_MANAGER
  );

  // Check state
  const state = await market.currentState();
  console.log(`Market State: ${state} (3 = RESOLVING)\n`);

  if (state === 5n) {
    console.log("✅ Already finalized!\n");
    // Skip to claims testing
  } else if (state === 3n) {
    // Get resolution data
    const resolutionData = await resolutionManager.getResolutionData(MARKET_ADDRESS);
    console.log(`Outcome: ${resolutionData.outcome}`);

    // Try static call first
    try {
      await resolutionManager.adminResolveMarket.staticCall(
        MARKET_ADDRESS,
        resolutionData.outcome,
        "Finalizing after dispute window"
      );
      console.log("✅ Static call succeeded!\n");
    } catch (error) {
      console.log(`❌ Static call failed: ${error.message}\n`);
      return;
    }

    // Send with explicit gas
    try {
      console.log("Sending finalization transaction...");

      const tx = await resolutionManager.adminResolveMarket(
        MARKET_ADDRESS,
        resolutionData.outcome,
        "Finalizing after dispute window",
        {
          gasLimit: 300000, // Explicit limit
          gasPrice: 10, // Explicit price
        }
      );

      console.log(`📝 Tx: ${tx.hash}`);
      const receipt = await tx.wait();

      console.log(`✅ FINALIZED! Gas: ${receipt.gasUsed}\n`);

      const newState = await market.currentState();
      console.log(`New State: ${newState} (5 = FINALIZED)\n`);

      if (newState === 5n) {
        console.log("🎉 Market 4 is now FINALIZED!\n");
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}\n`);
      return;
    }
  } else {
    console.log(`⚠️  Wrong state: ${state}\n`);
    return;
  }

  // Now test claims
  console.log("🧪 Testing claims...\n");

  const finalState = await market.currentState();
  if (finalState !== 5n) {
    console.log("❌ Market not finalized, cannot claim\n");
    return;
  }

  const bet = await market.bets(signer.address);
  console.log(`Your bet: ${ethers.formatEther(bet.amount)} BASED on outcome ${bet.outcome}`);
  console.log(`Shares: ${ethers.formatEther(bet.shares)}`);
  console.log(`Claimed: ${bet.claimed}\n`);

  if (bet.claimed) {
    console.log("✅ Already claimed!\n");
    return;
  }

  if (bet.amount === 0n) {
    console.log("⚠️  No bet to claim\n");
    return;
  }

  // Get final outcome
  const finalOutcome = await market.finalOutcome();
  console.log(`Final Outcome: ${finalOutcome}\n`);

  if (bet.outcome !== finalOutcome) {
    console.log(`⚠️  You bet on ${bet.outcome} but ${finalOutcome} won - no winnings\n`);
  }

  // Try claim
  try {
    const initialBal = await ethers.provider.getBalance(signer.address);

    console.log("Attempting claim...");

    const tx = await market.claimWinnings({
      gasLimit: 200000,
      gasPrice: 10,
    });

    console.log(`📝 Tx: ${tx.hash}`);
    const receipt = await tx.wait();

    console.log(`✅ CLAIMED! Gas: ${receipt.gasUsed}\n`);

    const finalBal = await ethers.provider.getBalance(signer.address);
    const change = finalBal - initialBal;

    console.log(`Balance change: ${ethers.formatEther(change)} BASED\n`);

    if (change > 0n) {
      console.log(`🎉 YOU WON! Profit: ${ethers.formatEther(change)} BASED\n`);
    }
  } catch (error) {
    console.log(`❌ Claim error: ${error.message}\n`);
  }

  console.log("✅ COMPLETE!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
