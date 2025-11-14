const { ethers } = require("hardhat");

const CONFIG = {
  versionedRegistryAddress: "0x67F8F023f6cFAe44353d797D6e0B157F2579301A",
  oldCurveRegistryAddress: "0x0004ED9967F6a2b750a7456C25D29A88A184c2d7",
  newCurveRegistryAddress: "0x5AcC0f00c0675975a2c4A54aBcC7826Bd229Ca70",
  lmsrCurveAddress: "0x91DFC77A746Fe586217e6596ee408cf7E678dBE3",
};

async function main() {
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║         VERIFY REGISTRY STATE                              ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  // Get VersionedRegistry
  const VersionedRegistry = await ethers.getContractAt(
    "VersionedRegistry",
    CONFIG.versionedRegistryAddress
  );

  // Check what CurveRegistry is registered
  console.log("🔍 Checking VersionedRegistry state:\n");
  const curveRegistryId = ethers.id("CurveRegistry");
  const currentCurveRegistry = await VersionedRegistry.getContract(
    curveRegistryId
  );
  console.log("   CurveRegistry ID:", curveRegistryId);
  console.log("   Current CurveRegistry address:", currentCurveRegistry);
  console.log("   OLD CurveRegistry:", CONFIG.oldCurveRegistryAddress);
  console.log("   NEW CurveRegistry:", CONFIG.newCurveRegistryAddress);
  console.log("   Expected:", CONFIG.newCurveRegistryAddress);
  console.log("   MATCH:", currentCurveRegistry.toLowerCase() === CONFIG.newCurveRegistryAddress.toLowerCase() ? "✅ YES" : "❌ NO");

  // Check if LMSRCurve is in NEW registry
  console.log("\n🔍 Checking LMSRCurve in NEW CurveRegistry:\n");
  const NewCurveRegistry = await ethers.getContractAt(
    "CurveRegistry",
    CONFIG.newCurveRegistryAddress
  );

  const [isRegisteredNew, isActiveNew] = await NewCurveRegistry.isCurveActive(
    CONFIG.lmsrCurveAddress
  );
  console.log("   Is registered in NEW registry:", isRegisteredNew);
  console.log("   Is active in NEW registry:", isActiveNew);

  // Check if LMSRCurve is in OLD registry
  console.log("\n🔍 Checking LMSRCurve in OLD CurveRegistry:\n");
  const OldCurveRegistry = await ethers.getContractAt(
    "CurveRegistry",
    CONFIG.oldCurveRegistryAddress
  );

  try {
    const [isRegisteredOld, isActiveOld] = await OldCurveRegistry.isCurveActive(
      CONFIG.lmsrCurveAddress
    );
    console.log("   Is registered in OLD registry:", isRegisteredOld);
    console.log("   Is active in OLD registry:", isActiveOld);
  } catch (e) {
    console.log("   Error checking OLD registry:", e.message.substring(0, 100));
  }

  // Try to get LMSRCurve from NEW registry by name
  console.log("\n🔍 Trying to get LMSRCurve by name from NEW registry:\n");
  try {
    const curveByName = await NewCurveRegistry.getCurveByName("LMSRCurve");
    console.log("   getCurveByName('LMSRCurve'):", curveByName);
    console.log("   Expected:", CONFIG.lmsrCurveAddress);
    console.log("   MATCH:", curveByName.toLowerCase() === CONFIG.lmsrCurveAddress.toLowerCase() ? "✅ YES" : "❌ NO");
  } catch (e) {
    console.log("   Error:", e.message.substring(0, 100));
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY:");
  console.log("=".repeat(60));

  if (currentCurveRegistry.toLowerCase() === CONFIG.newCurveRegistryAddress.toLowerCase()) {
    console.log("✅ VersionedRegistry points to NEW CurveRegistry");
  } else {
    console.log("❌ VersionedRegistry points to OLD CurveRegistry - NEEDS FIX!");
  }

  if (isRegisteredNew && isActiveNew) {
    console.log("✅ LMSRCurve is registered and active in NEW registry");
  } else {
    console.log("❌ LMSRCurve not found in NEW registry");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
