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
  console.log("\n🔍 VALIDATION STEP 1.2: Verify 8 Contracts in Registry\n");
  
  const registry = await ethers.getContractAt(
    "VersionedRegistry",
    deploymentState.contracts.VersionedRegistry
  );

  const contractsToCheck = [
    { name: "AccessControlManager", key: "AccessControlManager" },
    { name: "ResolutionManager", key: "ResolutionManager" },
    { name: "ParameterStorage", key: "ParameterStorage" },
    { name: "RewardDistributor", key: "RewardDistributor" },
    { name: "MarketFactory", key: "FlexibleMarketFactoryUnified" },
    { name: "PredictionMarket", key: "PredictionMarketTemplate" },
    { name: "CurveRegistry", key: "CurveRegistry" },
    { name: "MarketTemplateRegistry", key: "MarketTemplateRegistry" }
  ];

  let allGood = true;

  for (const contract of contractsToCheck) {
    try {
      const registryAddress = await registry.getContract(ethers.id(contract.name));
      const expectedAddress = deploymentState.contracts[contract.key];
      
      if (registryAddress.toLowerCase() === expectedAddress.toLowerCase()) {
        console.log(`✅ ${contract.name} registered correctly`);
      } else {
        console.log(`❌ ${contract.name} address mismatch`);
        console.log(`   Expected: ${expectedAddress}`);
        console.log(`   Got: ${registryAddress}`);
        allGood = false;
      }
    } catch (err) {
      console.log(`❌ ${contract.name} NOT found in registry`);
      allGood = false;
    }
  }

  console.log("\n" + (allGood ? "✅ STEP 1.2 PASSED" : "❌ STEP 1.2 FAILED") + "\n");
  return allGood;
}

verify().then(passed => process.exit(passed ? 0 : 1));
