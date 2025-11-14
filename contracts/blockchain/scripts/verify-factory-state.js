const { ethers } = require("hardhat");

const CONFIG = {
  versionedRegistryAddress: "0x67F8F023f6cFAe44353d797D6e0B157F2579301A",
  oldFactoryAddress: "0x3eaF643482Fe35d13DB812946E14F5345eb60d62",
  newFactoryAddress: "0x169b4019Fc12c5bD43BFA5d830Fd01A678df6a15",
};

async function main() {
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║         VERIFY FACTORY STATE                               ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  // Get VersionedRegistry
  const VersionedRegistry = await ethers.getContractAt(
    "VersionedRegistry",
    CONFIG.versionedRegistryAddress
  );

  // Check what factory is registered
  console.log("🔍 Checking VersionedRegistry for factory:\n");
  const factoryId = ethers.id("FlexibleMarketFactoryUnified");
  const currentFactory = await VersionedRegistry.getContract(factoryId);

  console.log("   Factory ID:", factoryId);
  console.log("   Current Factory:", currentFactory);
  console.log("   OLD Factory V1:", CONFIG.oldFactoryAddress);
  console.log("   NEW Factory V2:", CONFIG.newFactoryAddress);
  console.log("   Using V2:", currentFactory.toLowerCase() === CONFIG.newFactoryAddress.toLowerCase() ? "✅ YES" : "❌ NO (still using V1!)");

  // Summary
  console.log("\n" + "=".repeat(60));
  if (currentFactory.toLowerCase() === CONFIG.newFactoryAddress.toLowerCase()) {
    console.log("✅ VersionedRegistry correctly points to Factory V2 (FIXED)");
    console.log("\nFactory V2 has curve lookup implementation:");
    console.log("   - _getCurveAddressForType() function added");
    console.log("   - Properly maps CurveType.LMSR to 'LMSRCurve'");
    console.log("   - Looks up in CurveRegistry");
    console.log("\nMarket creation should now work!");
  } else {
    console.log("❌ ERROR: Still using OLD Factory V1");
    console.log("\nFactory V1 has the TODO bug:");
    console.log("   - Line 325: address curveAddress = address(0);");
    console.log("   - ALWAYS passes address(0) to validation");
    console.log("   - Market creation WILL FAIL");
    console.log("\nNEED TO: Update VersionedRegistry to use Factory V2!");
  }
  console.log("=".repeat(60));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
