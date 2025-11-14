const { ethers } = require("hardhat");

/**
 * RESTORE DISPUTE WINDOW TO PRODUCTION SETTINGS
 *
 * CRITICAL: Run this after testing to restore 48-hour dispute window!
 *
 * Production Settings:
 * - Dispute Window: 48 hours (172,800 seconds)
 * - Ensures proper community review time
 * - Standard for decentralized prediction markets
 */

const CONFIG = {
  RESOLUTION_MANAGER: "0x10daF33E321ED8977e369a36FcC6Beb3d3d106a0",
  PRODUCTION_DISPUTE_WINDOW: 172800, // 48 hours
};

async function main() {
  console.log("\n" + "=".repeat(80));
  console.log("🔄 RESTORE PRODUCTION SETTINGS: 48-Hour Dispute Window");
  console.log("=".repeat(80) + "\n");

  const resolutionManager = await ethers.getContractAt(
    "ResolutionManager",
    CONFIG.RESOLUTION_MANAGER
  );

  // Check current window
  const currentWindow = await resolutionManager.getDisputeWindow();
  const currentHours = Number(currentWindow) / 3600;

  console.log(`Current Dispute Window: ${currentWindow} seconds (${currentHours} hours)`);
  console.log(`Target Dispute Window: ${CONFIG.PRODUCTION_DISPUTE_WINDOW} seconds (48 hours)\n`);

  if (Number(currentWindow) === CONFIG.PRODUCTION_DISPUTE_WINDOW) {
    console.log("✅ Dispute window already set to production value (48 hours)!\n");
    console.log("No action needed. System ready for production.\n");
    return;
  }

  console.log("⚠️  Dispute window is NOT at production value!");
  console.log(`   Current: ${currentHours} hours`);
  console.log(`   Production: 48 hours\n`);

  console.log("Restoring to 48-hour production window...\n");

  try {
    const tx = await resolutionManager.setDisputeWindow(
      CONFIG.PRODUCTION_DISPUTE_WINDOW,
      { gasLimit: 100000 }
    );

    console.log(`📝 Transaction sent: ${tx.hash}`);
    console.log(`⏳ Waiting for confirmation...`);

    const receipt = await tx.wait();

    console.log(`✅ DISPUTE WINDOW RESTORED!`);
    console.log(`📊 Gas Used: ${receipt.gasUsed.toString()}`);

    const gasPrice = receipt.gasPrice || tx.gasPrice;
    const cost = (receipt.gasUsed * gasPrice) / BigInt(1e9);
    console.log(`💰 Cost: ${ethers.formatUnits(cost, "gwei")} BASED`);

    // Verify
    const newWindow = await resolutionManager.getDisputeWindow();
    const newHours = Number(newWindow) / 3600;

    console.log(`\n🔍 Verification: New window = ${newWindow} seconds (${newHours} hours)`);

    if (Number(newWindow) === CONFIG.PRODUCTION_DISPUTE_WINDOW) {
      console.log(`✅ Production settings restored successfully!\n`);
      console.log("🎯 System is now configured for production:");
      console.log("   - 48-hour dispute window");
      console.log("   - Proper community review time");
      console.log("   - Ready for public markets!\n");
    } else {
      console.log(`❌ Warning: Window shows ${newHours}h instead of 48h\n`);
    }
  } catch (error) {
    console.log(`❌ Failed to restore dispute window: ${error.message}\n`);
    console.log(`Make sure you have ADMIN_ROLE!\n`);
    return;
  }

  console.log("=".repeat(80));
  console.log("✅ PRODUCTION SETTINGS RESTORED");
  console.log("=".repeat(80) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
