const { ethers } = require("hardhat");

/**
 * DEBUG FINALIZE REVERT
 * Find out why finalization is reverting
 */

const MARKET_ADDRESS = "0x12d830fb965598c11a31ea183F79eD40DFf99a11";
const RESOLUTION_MANAGER = "0x10daF33E321ED8977e369a36FcC6Beb3d3d106a0";

async function main() {
  console.log("\n🔍 Debugging finalization revert...\n");

  const resolutionManager = await ethers.getContractAt(
    "ResolutionManager",
    RESOLUTION_MANAGER
  );

  const market = await ethers.getContractAt("PredictionMarket", MARKET_ADDRESS);

  // Get all relevant data
  console.log("═══ MARKET STATE ═══");
  const state = await market.currentState();
  console.log(`State: ${state}`);

  console.log("\n═══ RESOLUTION DATA ═══");
  const resolutionData = await resolutionManager.getResolutionData(MARKET_ADDRESS);
  console.log(`Outcome: ${resolutionData.outcome}`);
  console.log(`Resolver: ${resolutionData.resolver}`);
  console.log(`Resolved At: ${resolutionData.resolvedAt}`);
  console.log(`Status: ${resolutionData.status}`);

  const currentTime = Math.floor(Date.now() / 1000);
  const timeSince = currentTime - Number(resolutionData.resolvedAt);
  console.log(`\nTime since resolution: ${timeSince}s (${(timeSince / 3600).toFixed(2)} hours)`);

  // Check dispute window
  const disputeWindow = await resolutionManager.getDisputeWindow();
  const disputeWindowNum = Number(disputeWindow);
  console.log(`\nDispute Window: ${disputeWindowNum}s (${disputeWindowNum / 3600} hours)`);

  const resolvedAtNum = Number(resolutionData.resolvedAt);
  const disputeEnds = resolvedAtNum + disputeWindowNum;
  const canFinalize = currentTime >= disputeEnds;
  console.log(`Dispute Ends: ${disputeEnds}`);
  console.log(`Can Finalize: ${canFinalize ? "✅ YES" : "❌ NO"}`);

  if (!canFinalize) {
    const waitTime = disputeEnds - currentTime;
    console.log(`⏳ Need to wait: ${waitTime}s (${(waitTime / 60).toFixed(1)} minutes)\n`);
    return;
  }

  // Try static call to get exact revert reason
  console.log("\n═══ TESTING FINALIZATION ═══");

  try {
    console.log("Trying adminResolveMarket...");
    await resolutionManager.adminResolveMarket.staticCall(
      MARKET_ADDRESS,
      resolutionData.outcome,
      "Finalizing after dispute window"
    );
    console.log("✅ Static call succeeded! Transaction should work.\n");
  } catch (error) {
    console.log(`❌ Static call failed!`);
    console.log(`Error: ${error.message}\n`);

    // Try to decode the error
    if (error.data) {
      console.log(`Error Data: ${error.data}\n`);
    }

    // Check what might be wrong
    console.log("\n═══ POSSIBLE ISSUES ═══");

    // Check if market has finalize function
    try {
      await market.finalize.staticCall(1);
      console.log("✅ Market has finalize() function");
    } catch (e) {
      console.log(`❌ Market finalize() failed: ${e.message}`);
    }

    // Check market balance
    const marketBalance = await ethers.provider.getBalance(MARKET_ADDRESS);
    console.log(`\nMarket Balance: ${ethers.formatEther(marketBalance)} BASED`);

    // Check if market is already finalized
    try {
      const finalOutcome = await market.finalOutcome();
      console.log(`Market Final Outcome: ${finalOutcome}`);
    } catch (e) {
      console.log(`Cannot get final outcome: ${e.message}`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
