const { ethers } = require("hardhat");

/**
 * ADJUST DISPUTE WINDOW FOR RAPID TESTING
 *
 * STRATEGY:
 * 1. Current dispute window: 48 hours (172,800 seconds)
 * 2. Reduce to: 5 minutes (300 seconds) for testing
 * 3. Market 4 was resolved 15+ hours ago
 * 4. After changing window: Market 4 can be finalized IMMEDIATELY!
 *
 * CRITICAL: Remember to restore to 48 hours for production!
 */

const CONFIG = {
  RESOLUTION_MANAGER: "0x10daF33E321ED8977e369a36FcC6Beb3d3d106a0",
  MARKET_4: "0x12d830fb965598c11a31ea183F79eD40DFf99a11",

  // Testing dispute window: 5 minutes (300 seconds)
  // Even safer: 10 minutes (600 seconds) if you want more buffer
  NEW_DISPUTE_WINDOW: 300, // 5 minutes for rapid testing

  // Production dispute window: 48 hours (restore after testing!)
  PRODUCTION_DISPUTE_WINDOW: 172800, // 48 hours
};

async function main() {
  console.log("\n" + "=".repeat(80));
  console.log("⚡ RAPID TESTING: Adjust Dispute Window for Immediate Testing");
  console.log("=".repeat(80) + "\n");

  const [signer] = await ethers.getSigners();

  const resolutionManager = await ethers.getContractAt(
    "ResolutionManager",
    CONFIG.RESOLUTION_MANAGER
  );

  const market = await ethers.getContractAt(
    "PredictionMarket",
    CONFIG.MARKET_4
  );

  // Step 1: Show current configuration
  console.log("═══ STEP 1: CURRENT CONFIGURATION ═══\n");

  const currentWindow = await resolutionManager.getDisputeWindow();
  const currentWindowHours = Number(currentWindow) / 3600;

  console.log(`Current Dispute Window: ${currentWindow} seconds (${currentWindowHours} hours)`);
  console.log(`Target Dispute Window: ${CONFIG.NEW_DISPUTE_WINDOW} seconds (${CONFIG.NEW_DISPUTE_WINDOW / 60} minutes)\n`);

  // Check Market 4 status
  const resolutionData = await resolutionManager.getResolutionData(CONFIG.MARKET_4);
  const marketState = await market.currentState();

  console.log("Market 4 Status:");
  console.log(`  - Current State: ${marketState} (3 = RESOLVING)`);
  console.log(`  - Resolved At: ${resolutionData.resolvedAt}`);

  const currentTime = Math.floor(Date.now() / 1000);
  const timeSinceResolution = currentTime - Number(resolutionData.resolvedAt);

  console.log(`  - Time Since Resolution: ${timeSinceResolution}s (${(timeSinceResolution / 3600).toFixed(2)} hours)`);

  // Calculate when it can be finalized with CURRENT window
  const currentFinalizeTime = Number(resolutionData.resolvedAt) + Number(currentWindow);
  const currentWaitTime = currentFinalizeTime - currentTime;

  console.log(`\nWith CURRENT 48-hour window:`);
  console.log(`  - Can finalize at: ${currentFinalizeTime}`);
  console.log(`  - Must wait: ${currentWaitTime}s (${(currentWaitTime / 3600).toFixed(2)} hours) ❌`);

  // Calculate when it can be finalized with NEW window
  const newFinalizeTime = Number(resolutionData.resolvedAt) + CONFIG.NEW_DISPUTE_WINDOW;
  const newWaitTime = newFinalizeTime - currentTime;

  console.log(`\nWith NEW ${CONFIG.NEW_DISPUTE_WINDOW / 60}-minute window:`);
  console.log(`  - Can finalize at: ${newFinalizeTime}`);

  if (newWaitTime <= 0) {
    console.log(`  - Can finalize: IMMEDIATELY! ✅ (${Math.abs(newWaitTime)}s in the past)`);
  } else {
    console.log(`  - Must wait: ${newWaitTime}s (${(newWaitTime / 60).toFixed(1)} minutes)`);
  }

  // Step 2: Adjust dispute window
  console.log("\n═══ STEP 2: ADJUSTING DISPUTE WINDOW ═══\n");

  if (Number(currentWindow) === CONFIG.NEW_DISPUTE_WINDOW) {
    console.log(`✅ Dispute window already set to ${CONFIG.NEW_DISPUTE_WINDOW} seconds!\n`);
  } else {
    console.log(`Reducing dispute window from ${currentWindowHours}h to ${CONFIG.NEW_DISPUTE_WINDOW / 60}m...`);

    try {
      const tx = await resolutionManager.setDisputeWindow(CONFIG.NEW_DISPUTE_WINDOW, {
        gasLimit: 100000,
      });

      console.log(`📝 Transaction sent: ${tx.hash}`);
      console.log(`⏳ Waiting for confirmation...`);

      const receipt = await tx.wait();

      console.log(`✅ DISPUTE WINDOW UPDATED!`);
      console.log(`📊 Gas Used: ${receipt.gasUsed.toString()}`);

      const gasPrice = receipt.gasPrice || tx.gasPrice;
      const cost = (receipt.gasUsed * gasPrice) / BigInt(1e9);
      console.log(`💰 Cost: ${ethers.formatUnits(cost, "gwei")} BASED`);

      // Verify
      const newWindow = await resolutionManager.getDisputeWindow();
      console.log(`\n🔍 Verification: New window = ${newWindow} seconds (${newWindow / 60n} minutes)`);

      if (Number(newWindow) === CONFIG.NEW_DISPUTE_WINDOW) {
        console.log(`✅ Dispute window successfully updated!\n`);
      } else {
        console.log(`❌ Warning: Window shows ${newWindow} instead of ${CONFIG.NEW_DISPUTE_WINDOW}\n`);
      }
    } catch (error) {
      console.log(`❌ Failed to update dispute window: ${error.message}\n`);
      console.log(`Make sure you have ADMIN_ROLE!\n`);
      return;
    }
  }

  // Step 3: Show next steps
  console.log("═══ STEP 3: NEXT STEPS ═══\n");

  console.log("🎯 You can now IMMEDIATELY:");
  console.log("   1. Run: npx hardhat run scripts/e2e-tests/finalize-correct-function.js --network basedai_mainnet");
  console.log("   2. Test finalization of Market 4");
  console.log("   3. Test claims functionality");
  console.log("   4. Complete 100% E2E validation!");

  console.log("\n⚠️  IMPORTANT - After testing:");
  console.log("   Run: npx hardhat run scripts/e2e-tests/restore-dispute-window.js --network basedai_mainnet");
  console.log("   This will restore the 48-hour production window!\n");

  console.log("📋 Testing Timeline:");
  console.log("   - Finalization: ~2 minutes");
  console.log("   - Claims testing: ~2 minutes");
  console.log("   - Total time: ~5-10 minutes");
  console.log("   - Then restore to 48 hours for production!\n");

  console.log("═══ READY FOR RAPID TESTING! ═══\n");

  console.log("✅ All set! You can now complete E2E testing in minutes instead of hours!\n");

  console.log("=".repeat(80));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
