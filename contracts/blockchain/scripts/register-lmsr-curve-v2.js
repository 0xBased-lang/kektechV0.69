const { ethers } = require("hardhat");

const LMSR_CURVE = "0x91DFC77A746Fe586217e6596ee408cf7E678dBE3";
const CURVE_REGISTRY_NEW = "0x5AcC0f00c0675975a2c4A54aBcC7826Bd229Ca70";  // NEW with correct access control

async function main() {
  console.log("\n🔧 Registering LMSRCurve in NEW CurveRegistry...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Registering with:", deployer.address);
  console.log("CurveRegistry (NEW):", CURVE_REGISTRY_NEW);
  console.log("LMSRCurve:", LMSR_CURVE, "\n");

  const curveRegistry = await ethers.getContractAt("CurveRegistry", CURVE_REGISTRY_NEW);

  // Verify access control is correct
  const accessControl = await curveRegistry.accessControl();
  console.log("CurveRegistry.accessControl:", accessControl);
  console.log("Expected AccessControlManager: 0x4d1afBb8E50e17F24dCbB4Fc3197537be646315A");
  console.log("Match:", accessControl === "0x4d1afBb8E50e17F24dCbB4Fc3197537be646315A" ? "✅ YES" : "❌ NO");

  // Check if already registered
  try {
    const existing = await curveRegistry.getCurveByName("LMSRCurve");
    console.log("\n✅ LMSRCurve already registered at:", existing);
    return;
  } catch (e) {
    console.log("\n📝 LMSRCurve not registered, proceeding...\n");
  }

  // Get gas price
  const feeData = await ethers.provider.getFeeData();
  const gasPrice = feeData.gasPrice || ethers.parseUnits("10", "gwei");

  // Register LMSR curve
  console.log("📤 Registering LMSRCurve...");
  const tx = await curveRegistry.registerCurve(
    LMSR_CURVE,
    "1.0.0",
    "Logarithmic Market Scoring Rule - Optimal for prediction markets",
    "Logarithmic",
    "",
    ["LMSR", "Prediction", "DeFi"],
    { gasLimit: 500000, gasPrice: gasPrice }
  );

  console.log("⏳ Transaction sent:", tx.hash);
  const receipt = await tx.wait(2);
  console.log("✅ Confirmed in block:", receipt.blockNumber);
  console.log("Gas used:", receipt.gasUsed.toString(), "\n");

  // Verify registration
  const curveAddress = await curveRegistry.getCurveByName("LMSRCurve");
  console.log("✅ VERIFICATION SUCCESS!");
  console.log("   LMSRCurve registered at:", curveAddress);
  console.log("   Matches deployed address:", curveAddress === LMSR_CURVE ? "✅ YES" : "❌ NO");
  console.log("\n🎯 Next: Fix factory + test market creation");
}

main().then(() => process.exit(0)).catch(error => { console.error(error); process.exit(1); });
