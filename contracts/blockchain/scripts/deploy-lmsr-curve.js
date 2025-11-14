const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("\n🚀 Deploying LMSRCurve to BasedAI Mainnet...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "$BASED\n");

  // Get gas price
  const feeData = await ethers.provider.getFeeData();
  const gasPrice = feeData.gasPrice || ethers.parseUnits("10", "gwei");
  console.log("Gas Price:", ethers.formatUnits(gasPrice, "gwei"), "gwei\n");

  // Deploy LMSRCurve
  console.log("📦 Deploying LMSRCurve...");
  const LMSRCurve = await ethers.getContractFactory("LMSRCurve");
  const lmsrCurve = await LMSRCurve.deploy({
    gasLimit: 3000000,
    gasPrice: gasPrice
  });

  await lmsrCurve.waitForDeployment();
  const address = await lmsrCurve.getAddress();

  console.log("✅ LMSRCurve deployed at:", address);

  // Wait for confirmations
  console.log("⏳ Waiting for 2 confirmations...");
  const deployTx = lmsrCurve.deploymentTransaction();
  const receipt = await deployTx.wait(2);
  console.log("✅ Confirmed in block:", receipt.blockNumber);
  console.log("Gas used:", receipt.gasUsed.toString(), "\n");

  // Save address
  const deploymentState = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "../basedai-mainnet-deployment.json"),
      "utf8"
    )
  );

  deploymentState.contracts.LMSRCurve = address;
  deploymentState.steps.push({
    step: "Deploy LMSRCurve",
    contract: "LMSRCurve",
    address: address,
    block: receipt.blockNumber,
    timestamp: new Date().toISOString()
  });

  fs.writeFileSync(
    path.join(__dirname, "../basedai-mainnet-deployment.json"),
    JSON.stringify(deploymentState, null, 2)
  );

  console.log("✅ Deployment state updated\n");
  console.log("🎯 Next: Register LMSRCurve in CurveRegistry");
}

main().then(() => process.exit(0)).catch(error => { console.error(error); process.exit(1); });
