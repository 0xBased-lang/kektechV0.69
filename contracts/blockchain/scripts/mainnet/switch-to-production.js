const { ethers } = require("hardhat");
const config = require("../../config/parameters");
const fs = require("fs");
const path = require("path");

/**
 * KEKTECH 3.0 - Switch to Production Mode
 *
 * This script switches the system from TESTING to PRODUCTION mode
 *
 * Changes:
 * - Dispute Window: 15 minutes → 48 hours
 * - Min Dispute Bond: 0.01 BASED → 0.1 BASED (optional)
 *
 * Run this after testing the full market lifecycle in testing mode
 */

async function main() {
  console.log("\n🔄 KEKTECH: Switch to Production Mode");
  console.log("======================================\n");

  // Confirmation prompt
  console.log("⚠️  WARNING: This will change system parameters to PRODUCTION mode");
  console.log("   • Dispute Window: 15 min → 48 hours");
  console.log("   • Min Dispute Bond: 0.01 BASED → 0.1 BASED\n");

  // Get signer
  const [signer] = await ethers.getSigners();
  console.log(`Admin Address: ${signer.address}`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(signer.address))} BASED\n`);

  // Load deployed contracts
  const deploymentPath = path.join(__dirname, "../../../../deployments/basedai-mainnet/contracts.json");
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));

  const registry = await ethers.getContractAt(
    "VersionedRegistry",
    deployment.VersionedRegistry
  );

  const resolutionManagerAddr = await registry.getContract(ethers.id("ResolutionManager"));
  const resolutionManager = await ethers.getContractAt("ResolutionManager", resolutionManagerAddr);

  // Get current values
  const currentDisputeWindow = await resolutionManager.disputeWindow();
  const currentMinBond = await resolutionManager.minDisputeBond();

  console.log("📊 Current Settings:");
  console.log(`  Dispute Window:     ${currentDisputeWindow} seconds (${Number(currentDisputeWindow) / 60} minutes)`);
  console.log(`  Min Dispute Bond:   ${ethers.formatEther(currentMinBond)} BASED\n`);

  console.log("📊 Production Settings:");
  console.log(`  Dispute Window:     ${config.resolutionProduction.disputeWindow} seconds (48 hours)`);
  console.log(`  Min Dispute Bond:   ${ethers.formatEther(config.resolutionProduction.minDisputeBond)} BASED\n`);

  // Update dispute window
  if (currentDisputeWindow !== BigInt(config.resolutionProduction.disputeWindow)) {
    console.log("⏱️  Updating Dispute Window...");
    const tx1 = await resolutionManager.setDisputeWindow(config.resolutionProduction.disputeWindow);
    await tx1.wait();
    console.log("✅ Dispute window updated to 48 hours");
  } else {
    console.log("✅ Dispute window already at production setting");
  }

  // Update min dispute bond
  if (currentMinBond !== config.resolutionProduction.minDisputeBond) {
    console.log("\n💰 Updating Minimum Dispute Bond...");
    const tx2 = await resolutionManager.setMinDisputeBond(config.resolutionProduction.minDisputeBond);
    await tx2.wait();
    console.log("✅ Min dispute bond updated to 0.1 BASED");
  } else {
    console.log("✅ Min dispute bond already at production setting");
  }

  // Verify
  console.log("\n✅ Verifying Changes...");
  const newDisputeWindow = await resolutionManager.disputeWindow();
  const newMinBond = await resolutionManager.minDisputeBond();

  console.log("\n📊 New Settings:");
  console.log(`  Dispute Window:     ${newDisputeWindow} seconds (${Number(newDisputeWindow) / 3600} hours)`);
  console.log(`  Min Dispute Bond:   ${ethers.formatEther(newMinBond)} BASED`);

  console.log("\n" + "=".repeat(50));
  console.log("✅ PRODUCTION MODE ACTIVATED!");
  console.log("=".repeat(50));
  console.log("\n⚠️  Important:");
  console.log("  • Resolution proposals now have 48-hour dispute windows");
  console.log("  • Community has more time to vote and review outcomes");
  console.log("  • Dispute bonds are higher (0.1 BASED)");
  console.log("\n📝 Next Steps:");
  console.log("  1. Announce production mode to community");
  console.log("  2. Monitor first production markets closely");
  console.log("  3. Be ready to use admin override if needed");
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
