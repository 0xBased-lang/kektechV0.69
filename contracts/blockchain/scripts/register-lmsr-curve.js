const { ethers } = require("hardhat");

const LMSR_CURVE = "0x91DFC77A746Fe586217e6596ee408cf7E678dBE3";
const CURVE_REGISTRY = "0x0004ED9967F6a2b750a7456C25D29A88A184c2d7";

async function main() {
  console.log("\n🔧 Registering LMSRCurve in CurveRegistry...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Registering with:", deployer.address);

  const curveRegistry = await ethers.getContractAt("CurveRegistry", CURVE_REGISTRY);

  // Check if already registered
  try {
    const existing = await curveRegistry.getCurveByName("LMSRCurve");
    console.log("✅ LMSRCurve already registered at:", existing);
    return;
  } catch (e) {
    console.log("📝 LMSRCurve not registered, proceeding...\n");
  }

  // Get gas price
  const feeData = await ethers.provider.getFeeData();
  const gasPrice = feeData.gasPrice || ethers.parseUnits("10", "gwei");

  // Register LMSR curve
  console.log("📤 Registering LMSRCurve...");
  console.log("   Address:", LMSR_CURVE);
  console.log("   Version: 1.0.0");
  console.log("   Category: Logarithmic\n");

  const tx = await curveRegistry.registerCurve(
    LMSR_CURVE,
    "1.0.0",
    "Logarithmic Market Scoring Rule - Optimal for prediction markets",
    "Logarithmic",
    "",  // No icon URL
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
  console.log("\n🎯 Next: Test market creation");
}

main().then(() => process.exit(0)).catch(error => { console.error(error); process.exit(1); });
