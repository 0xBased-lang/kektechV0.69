const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

const deploymentState = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "../basedai-mainnet-deployment.json"),
    "utf8"
  )
);

async function verify() {
  console.log("\n🔍 VALIDATION STEP 1.1: Verify All 9 Contracts on Mainnet\n");
  
  let allGood = true;
  const contracts = [
    "VersionedRegistry",
    "ParameterStorage",
    "AccessControlManager",
    "ResolutionManager",
    "RewardDistributor",
    "FlexibleMarketFactoryUnified",
    "PredictionMarketTemplate",
    "CurveRegistry",
    "MarketTemplateRegistry"
  ];

  for (const contractName of contracts) {
    const address = deploymentState.contracts[contractName];
    const code = await ethers.provider.getCode(address);
    
    if (code === "0x") {
      console.log(`❌ ${contractName}: NOT DEPLOYED`);
      allGood = false;
    } else {
      const codeLength = (code.length - 2) / 2;
      console.log(`✅ ${contractName}`);
      console.log(`   Address: ${address}`);
      console.log(`   Bytecode: ${codeLength} bytes`);
    }
  }

  console.log("\n" + (allGood ? "✅ STEP 1.1 PASSED" : "❌ STEP 1.1 FAILED") + "\n");
  return allGood;
}

verify().then(passed => process.exit(passed ? 0 : 1));
