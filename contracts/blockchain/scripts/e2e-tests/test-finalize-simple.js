const { ethers } = require("hardhat");

/**
 * SIMPLE FINALIZATION TEST
 * Just try to finalize and see what happens
 */

const MARKET_ADDRESS = "0x12d830fb965598c11a31ea183F79eD40DFf99a11";
const RESOLUTION_MANAGER = "0x10daF33E321ED8977e369a36FcC6Beb3d3d106a0";

async function main() {
  console.log("\n🎯 SIMPLE FINALIZATION TEST\n");

  const [signer] = await ethers.getSigners();
  console.log("Account:", signer.address);
  console.log("Market:", MARKET_ADDRESS);

  const market = await ethers.getContractAt("PredictionMarket", MARKET_ADDRESS);
  const resolutionManager = await ethers.getContractAt("ResolutionManager", RESOLUTION_MANAGER);

  // Check current state
  const state = await market.currentState();
  console.log("\nCurrent State:", Number(state), "(3=RESOLVING, 5=FINALIZED)");

  if (state === 5n) {
    console.log("✅ Already finalized!");
  } else if (state === 3n) {
    console.log("\nTrying to finalize...");

    try {
      const tx = await resolutionManager.finalizeResolution(MARKET_ADDRESS, {
        gasLimit: 500000,
        gasPrice: ethers.parseUnits("9", "gwei"),
      });

      console.log("TX:", tx.hash);
      const receipt = await tx.wait();

      console.log("\n✅ FINALIZED!");
      console.log("Gas:", receipt.gasUsed.toString());

      const newState = await market.currentState();
      console.log("New State:", Number(newState));

    } catch (error) {
      console.error("\n❌ Failed:", error.message);

      if (error.message.includes("DisputeWindowActive")) {
        console.log("\n⏰ Dispute window still active - need to wait");

        // Get resolution data to check when it was resolved
        const resolutionData = await resolutionManager.getResolutionData(MARKET_ADDRESS);
        const resolvedAt = Number(resolutionData.resolvedAt);
        const now = Math.floor(Date.now() / 1000);

        console.log("Resolved at:", new Date(resolvedAt * 1000).toLocaleString());
        console.log("Current time:", new Date(now * 1000).toLocaleString());
        console.log("Elapsed:", now - resolvedAt, "seconds");

        // Get dispute window duration
        const disputeWindow = await resolutionManager.getDisputeWindow();
        console.log("Dispute window:", Number(disputeWindow), "seconds");

        const timeRemaining = resolvedAt + Number(disputeWindow) - now;
        console.log("Time remaining:", timeRemaining, "seconds");
      }
    }
  } else {
    console.log("⚠️  Unexpected state:", Number(state));
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
