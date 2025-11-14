const { ethers } = require("hardhat");

async function main() {
  console.log("\n🔍 Checking Factory Configuration...\n");

  const factory = await ethers.getContractAt(
    "FlexibleMarketFactoryUnified",
    "0x169b4019Fc12c5bD43BFA5d830Fd01A678df6a15"
  );

  try {
    const defaultCurve = await factory.defaultCurve();
    console.log("Default Curve:", defaultCurve);

    if (defaultCurve === ethers.ZeroAddress) {
      console.log("❌ PROBLEM: defaultCurve is not set (address(0))!");
      console.log("   New markets will be created without a bonding curve.");
      console.log("   This will cause betting to fail!");
      console.log("");
      console.log("Solution: Set default curve to LMSRCurve");
      console.log("   LMSRCurve address: 0x91DFC77A746Fe586217e6596ee408cf7E678dBE3");
    } else {
      console.log("✅ Default curve is set!");
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
