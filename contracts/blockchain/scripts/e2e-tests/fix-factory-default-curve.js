const { ethers } = require("hardhat");

/**
 * FIX: Set Factory Default Curve
 *
 * Root cause of betting failures on fresh markets:
 * - Factory's defaultCurve is address(0)
 * - New markets created without bonding curve
 * - Betting fails because placeBet() needs curve for share calculations
 *
 * Solution: Set defaultCurve to LMSRCurve address
 */

const ADDRESSES = {
  FACTORY: "0x169b4019Fc12c5bD43BFA5d830Fd01A678df6a15",
  LMSR_CURVE: "0x91DFC77A746Fe586217e6596ee408cf7E678dBE3",
};

async function main() {
  console.log("\n╔═══════════════════════════════════════════════════════════════╗");
  console.log("║           FIX FACTORY DEFAULT CURVE CONFIGURATION             ║");
  console.log("╚═══════════════════════════════════════════════════════════════╝\n");

  const [signer] = await ethers.getSigners();
  console.log("Account:", signer.address);
  console.log("");

  const factory = await ethers.getContractAt("FlexibleMarketFactoryUnified", ADDRESSES.FACTORY);

  // Check current setting
  const currentCurve = await factory.defaultCurve();
  console.log("Current defaultCurve:", currentCurve);
  console.log("");

  if (currentCurve !== ethers.ZeroAddress) {
    console.log("✅ Default curve is already set!");
    console.log("   No action needed.");
    return;
  }

  console.log("❌ Default curve is NOT set (address(0))");
  console.log("   Setting to LMSR Curve:", ADDRESSES.LMSR_CURVE);
  console.log("");

  try {
    const tx = await factory.setDefaultCurve(ADDRESSES.LMSR_CURVE, {
      gasLimit: 150000,
      gasPrice: ethers.parseUnits("9", "gwei"),
    });

    console.log("⏳ Transaction sent:", tx.hash);
    const receipt = await tx.wait();

    console.log("✅ Default curve set successfully!");
    console.log("   Gas used:", receipt.gasUsed.toString());
    console.log("");

    // Verify
    const newCurve = await factory.defaultCurve();
    console.log("Verified defaultCurve:", newCurve);

    if (newCurve === ADDRESSES.LMSR_CURVE) {
      console.log("");
      console.log("╔═══════════════════════════════════════════════════════════════╗");
      console.log("║                     FIX APPLIED! ✅                            ║");
      console.log("╚═══════════════════════════════════════════════════════════════╝\n");
      console.log("🎉 New markets will now be created with LMSR bonding curve!");
      console.log("   Betting on fresh markets will work!");
      console.log("");
    } else {
      console.error("❌ Verification failed! Curve not set correctly.");
    }
  } catch (error) {
    console.error("❌ Failed to set default curve:", error.message);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
