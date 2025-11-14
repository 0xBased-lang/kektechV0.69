const { ethers } = require("hardhat");

/**
 * MINIMAL DISPUTE WINDOW ADJUSTMENT
 * Tries with minimal gas and explicit gas price
 */

const RESOLUTION_MANAGER = "0x10daF33E321ED8977e369a36FcC6Beb3d3d106a0";
const NEW_WINDOW = 300; // 5 minutes

async function main() {
  console.log("\n⚡ Adjusting dispute window to 5 minutes...\n");

  const resolutionManager = await ethers.getContractAt(
    "ResolutionManager",
    RESOLUTION_MANAGER
  );

  // Check current
  const current = await resolutionManager.getDisputeWindow();
  console.log(`Current: ${current}s (${Number(current) / 3600}h)`);
  console.log(`Target: ${NEW_WINDOW}s (${NEW_WINDOW / 60}m)\n`);

  // Try static call first
  try {
    await resolutionManager.setDisputeWindow.staticCall(NEW_WINDOW);
    console.log("✅ Static call succeeded - transaction should work!\n");
  } catch (error) {
    console.log(`❌ Static call failed: ${error.message}\n`);

    if (error.message.includes("Not admin")) {
      console.log("⚠️  You don't have ADMIN_ROLE!");
      console.log("   Market 4 was resolved 15+ hours ago.");
      console.log("   With 5-minute window, it can be finalized immediately!\n");
      console.log("   But you need ADMIN_ROLE to change the dispute window.\n");
      return;
    }

    return;
  }

  // Try with minimal gas
  try {
    console.log("Sending transaction with minimal gas...");

    const tx = await resolutionManager.setDisputeWindow(NEW_WINDOW, {
      gasLimit: 60000, // Minimal for storage write
      gasPrice: 10, // Explicit low gas price
    });

    console.log(`📝 Tx: ${tx.hash}`);
    const receipt = await tx.wait();

    console.log(`✅ SUCCESS! Gas: ${receipt.gasUsed}`);

    const newWindow = await resolutionManager.getDisputeWindow();
    console.log(`\n🎯 New window: ${newWindow}s (${Number(newWindow) / 60}m)\n`);

    if (Number(newWindow) === NEW_WINDOW) {
      console.log("✅ Market 4 can now be finalized IMMEDIATELY!\n");
      console.log("Next: npx hardhat run scripts/e2e-tests/finalize-correct-function.js --network basedai_mainnet\n");
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
