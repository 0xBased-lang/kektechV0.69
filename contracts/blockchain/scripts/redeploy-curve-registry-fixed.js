const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

const ACCESS_CONTROL_MANAGER = "0x4d1afBb8E50e17F24dCbB4Fc3197537be646315A";

async function main() {
  console.log("\n🔧 Redeploying CurveRegistry with CORRECT AccessControlManager...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // Get gas price
  const feeData = await ethers.provider.getFeeData();
  const gasPrice = feeData.gasPrice || ethers.parseUnits("10", "gwei");
  console.log("Gas Price:", ethers.formatUnits(gasPrice, "gwei"), "gwei\n");

  console.log("✅ Using CORRECT AccessControlManager:", ACCESS_CONTROL_MANAGER);
  console.log("❌ OLD (wrong) address was: 0x67F8F023f6cFAe44353d797D6e0B157F2579301A (VersionedRegistry)\n");

  // Deploy CurveRegistry with CORRECT address
  console.log("📦 Deploying CurveRegistry...");
  const CurveRegistry = await ethers.getContractFactory("CurveRegistry");
  const curveRegistry = await CurveRegistry.deploy(
    ACCESS_CONTROL_MANAGER,  // ✅ CORRECT: AccessControlManager
    { gasLimit: 3000000, gasPrice: gasPrice }
  );

  await curveRegistry.waitForDeployment();
  const address = await curveRegistry.getAddress();

  console.log("✅ CurveRegistry deployed at:", address);

  // Wait for confirmations
  console.log("⏳ Waiting for 2 confirmations...");
  const deployTx = curveRegistry.deploymentTransaction();
  const receipt = await deployTx.wait(2);
  console.log("✅ Confirmed in block:", receipt.blockNumber);
  console.log("Gas used:", receipt.gasUsed.toString(), "\n");

  // Verify access control
  const registryAccessControl = await curveRegistry.accessControl();
  console.log("🔍 Verification:");
  console.log("   CurveRegistry.accessControl:", registryAccessControl);
  console.log("   Expected AccessControlManager:", ACCESS_CONTROL_MANAGER);
  console.log("   Match:", registryAccessControl === ACCESS_CONTROL_MANAGER ? "✅ YES" : "❌ NO");

  // Save address
  const deploymentState = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "../basedai-mainnet-deployment.json"),
      "utf8"
    )
  );

  // Keep old address for reference
  deploymentState.contracts.CurveRegistry_OLD = "0x0004ED9967F6a2b750a7456C25D29A88A184c2d7";
  deploymentState.contracts.CurveRegistry = address;

  fs.writeFileSync(
    path.join(__dirname, "../basedai-mainnet-deployment.json"),
    JSON.stringify(deploymentState, null, 2)
  );

  console.log("\n✅ Deployment state updated");
  console.log("🎯 Next: Register LMSRCurve in new CurveRegistry");
}

main().then(() => process.exit(0)).catch(error => { console.error(error); process.exit(1); });
