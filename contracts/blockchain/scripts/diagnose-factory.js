const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Load deployment state
const deploymentState = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "../basedai-mainnet-deployment.json"),
    "utf8"
  )
);

async function main() {
  console.log("\n🔍 FACTORY DIAGNOSTIC\n");

  const factory = await ethers.getContractAt(
    "FlexibleMarketFactoryUnified",
    deploymentState.contracts.FlexibleMarketFactoryUnified
  );

  try {
    console.log("Checking factory state...");

    // Check if paused
    const paused = await factory.paused();
    console.log(`  Paused: ${paused}`);

    // Check minimum bond
    const minBond = await factory.minCreatorBond();
    console.log(`  Min Creator Bond: ${ethers.formatEther(minBond)} $BASED`);

    // Check if we have enough balance
    const [deployer] = await ethers.getSigners();
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log(`  Wallet Balance: ${ethers.formatEther(balance)} $BASED`);

    // Check registry
    const registry = await factory.registry();
    console.log(`  Registry: ${registry}`);

    // Try to get PredictionMarket template
    const registryContract = await ethers.getContractAt(
      "VersionedRegistry",
      registry
    );

    const templateKey = ethers.id("PredictionMarket");
    try {
      const template = await registryContract.getContract(templateKey);
      console.log(`  PredictionMarket Template: ${template}`);
    } catch (e) {
      console.log(`  PredictionMarket Template: NOT FOUND`);
    }

  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

main();
