const { ethers } = require("hardhat");

const CONFIG = {
  versionedRegistryAddress: "0x67F8F023f6cFAe44353d797D6e0B157F2579301A",
  newCurveRegistryAddress: "0x5AcC0f00c0675975a2c4A54aBcC7826Bd229Ca70",
  oldCurveRegistryAddress: "0x0004ED9967F6a2b750a7456C25D29A88A184c2d7",
  gasPrice: 9,
  gasLimit: 200000,
};

async function main() {
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║  STEP 3: UPDATE VERSIONED REGISTRY WITH NEW CURVE REGISTRY  ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  const [deployer] = await ethers.getSigners();
  console.log("📍 Deployer:", deployer.address);
  console.log("📍 VersionedRegistry:", CONFIG.versionedRegistryAddress);
  console.log("📍 OLD CurveRegistry:", CONFIG.oldCurveRegistryAddress);
  console.log("📍 NEW CurveRegistry:", CONFIG.newCurveRegistryAddress);

  // Get VersionedRegistry contract
  const VersionedRegistry = await ethers.getContractAt(
    "VersionedRegistry",
    CONFIG.versionedRegistryAddress
  );

  // Check current CurveRegistry
  console.log("\n🔍 Checking current CurveRegistry address in registry...");
  const curveRegistryId = ethers.id("CurveRegistry");
  const currentCurveRegistry = await VersionedRegistry.getContract(
    curveRegistryId
  );
  console.log("   Current CurveRegistry:", currentCurveRegistry);

  if (
    currentCurveRegistry.toLowerCase() === CONFIG.newCurveRegistryAddress.toLowerCase()
  ) {
    console.log("\n✅ VersionedRegistry already points to new CurveRegistry!");
    return;
  }

  // Update CurveRegistry in VersionedRegistry
  console.log("\n🔄 Updating VersionedRegistry with new CurveRegistry address...");
  const tx = await VersionedRegistry.setContract(
    curveRegistryId, // ethers.id("CurveRegistry")
    CONFIG.newCurveRegistryAddress,
    1, // version
    {
      gasPrice: CONFIG.gasPrice,
      gasLimit: CONFIG.gasLimit,
    }
  );

  console.log("⏳ Waiting for confirmation...");
  const receipt = await tx.wait(1);
  console.log("\n✅ VERSION REGISTRY UPDATED!");
  console.log("   Tx Hash:", receipt.hash);
  console.log("   Block:", receipt.blockNumber);
  console.log("   Gas Used:", receipt.gasUsed);

  // Verify update
  console.log("\n🔍 Verifying update...");
  const updatedCurveRegistry = await VersionedRegistry.getContract(
    curveRegistryId
  );
  console.log("   Updated CurveRegistry:", updatedCurveRegistry);

  if (
    updatedCurveRegistry.toLowerCase() ===
    CONFIG.newCurveRegistryAddress.toLowerCase()
  ) {
    console.log("\n✅ SUCCESS! VersionedRegistry now points to new CurveRegistry!");
  } else {
    console.log("\n❌ FAILED! VersionedRegistry not updated!");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
