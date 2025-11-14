const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

const CONFIG = {
  curveRegistryAddress: "0x0004ED9967F6a2b750a7456C25D29A88A184c2d7", // From deployment
  gasPrice: 9,
  gasLimit: 1000000,
};

async function main() {
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║         FIX: DEPLOY AND REGISTER LMSR CURVE                ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  const [deployer] = await ethers.getSigners();
  console.log("📍 Deployer:", deployer.address);
  console.log("📍 CurveRegistry:", CONFIG.curveRegistryAddress);

  // Step 1: Deploy LMSRCurve
  console.log("\n🔄 Step 1: Deploying LMSRCurve contract...");
  const LMSRCurve = await ethers.getContractFactory("LMSRCurve");
  const lmsrCurve = await LMSRCurve.deploy({
    gasPrice: CONFIG.gasPrice,
    gasLimit: CONFIG.gasLimit,
  });

  await lmsrCurve.waitForDeployment();
  const lmsrCurveAddress = await lmsrCurve.getAddress();
  console.log("✅ LMSRCurve deployed:", lmsrCurveAddress);

  // Step 2: Register in CurveRegistry
  console.log("\n🔄 Step 2: Registering LMSRCurve in CurveRegistry...");
  const curveRegistry = await ethers.getContractAt(
    "CurveRegistry",
    CONFIG.curveRegistryAddress
  );

  const registerTx = await curveRegistry.registerCurve(
    "LMSRCurve",
    lmsrCurveAddress,
    {
      gasPrice: CONFIG.gasPrice,
      gasLimit: 200000,
    }
  );

  console.log("⏳ Waiting for confirmation...");
  const receipt = await registerTx.wait(1);

  if (receipt.status === 1) {
    console.log("✅ LMSRCurve registered successfully!");
    console.log("   Tx Hash:", receipt.hash);
    console.log("   Gas Used:", receipt.gasUsed.toString());
  } else {
    throw new Error("Registration transaction failed");
  }

  // Step 3: Verify registration
  console.log("\n🔄 Step 3: Verifying registration...");
  const registeredAddress = await curveRegistry.getCurveByName("LMSRCurve");

  if (registeredAddress === lmsrCurveAddress) {
    console.log("✅ Verification successful!");
    console.log("   Registered address matches deployed address");
  } else {
    throw new Error(`Verification failed! Registered: ${registeredAddress}, Deployed: ${lmsrCurveAddress}`);
  }

  // Step 4: Save to deployment state
  console.log("\n🔄 Step 4: Saving to deployment state...");
  const stateFile = path.join(
    __dirname,
    "../basedai-mainnet-deployment.json"
  );
  let state = {};
  if (fs.existsSync(stateFile)) {
    state = JSON.parse(fs.readFileSync(stateFile, "utf8"));
  }

  state.contracts.LMSRCurve = lmsrCurveAddress;
  state.status = "LMSR_CURVE_REGISTERED";
  state.lmsrCurveTimestamp = new Date().toISOString();

  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2), "utf8");
  console.log("✅ Deployment state updated");

  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║                    FIX COMPLETE ✅                          ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");
  console.log("📝 Next Step: Run scripts/step5-create-market-1.js to test market creation");
}

main().catch((error) => {
  console.error("❌ Error deploying LMSR curve:", error.message);
  if (error.data) console.error("Revert reason:", error.data);
  process.exitCode = 1;
});
