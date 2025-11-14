const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

const CONFIG = {
  curveRegistryAddress: "0x5AcC0f00c0675975a2c4A54aBcC7826Bd229Ca70", // NEW registry with correct access control
  lmsrCurveAddress: "0x91DFC77A746Fe586217e6596ee408cf7E678dBE3",
  gasPrice: 9,
  gasLimit: 500000, // Increased from 200k
};

async function main() {
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║       STEP 2: REGISTER LMSR CURVE IN REGISTRY               ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  const [deployer] = await ethers.getSigners();
  console.log("📍 Deployer:", deployer.address);
  console.log("📍 CurveRegistry (NEW):", CONFIG.curveRegistryAddress);
  console.log("📍 LMSRCurve:", CONFIG.lmsrCurveAddress);

  // Get CurveRegistry contract
  const CurveRegistry = await ethers.getContractAt(
    "CurveRegistry",
    CONFIG.curveRegistryAddress
  );

  // Get LMSRCurve to verify it exists
  const LMSRCurve = await ethers.getContractAt(
    "LMSRCurve",
    CONFIG.lmsrCurveAddress
  );

  const curveName = await LMSRCurve.curveName();
  console.log("\n✅ LMSRCurve Contract:");
  console.log("   Name:", curveName);

  // Check if already registered
  console.log("\n🔍 Checking if curve already registered...");
  const curves = await CurveRegistry.getAllCurves();
  const alreadyRegistered = curves.includes(CONFIG.lmsrCurveAddress);
  console.log("   Already registered:", alreadyRegistered);

  if (alreadyRegistered) {
    console.log("\n✅ Curve already registered!");
    return;
  }

  // Register using registerCurveUnsafe to skip validation
  console.log("\n🔄 Registering LMSRCurve (using registerCurveUnsafe)...");
  const tags = []; // Empty tags array to keep params simple

  const tx = await CurveRegistry.registerCurveUnsafe(
    CONFIG.lmsrCurveAddress,
    "1.0.0", // version
    "Logarithmic Market Scoring Rule - LMSR bonding curve for binary prediction markets",
    "Logarithmic", // category
    "ipfs://QmXxxx", // iconUrl (placeholder)
    tags, // Empty tags array
    {
      gasPrice: CONFIG.gasPrice,
      gasLimit: CONFIG.gasLimit,
    }
  );

  console.log("⏳ Waiting for confirmation...");
  const receipt = await tx.wait(1);
  console.log("\n✅ LMSR CURVE REGISTERED!");
  console.log("   Tx Hash:", receipt.hash);
  console.log("   Block:", receipt.blockNumber);
  console.log("   Gas Used:", receipt.gasUsed);

  // Verify registration
  console.log("\n🔍 Verifying registration...");
  const [isRegistered, isActive] = await CurveRegistry.isCurveActive(
    CONFIG.lmsrCurveAddress
  );
  console.log("   Registered:", isRegistered);
  console.log("   Active:", isActive);

  if (isRegistered && isActive) {
    console.log("\n✅ SUCCESS! LMSRCurve registered and active!");
  } else {
    console.log("\n❌ FAILED! Curve not properly registered!");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
