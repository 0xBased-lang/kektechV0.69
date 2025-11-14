const { ethers } = require("hardhat");

/**
 * FINALIZE WITH LOW GAS
 * Try finalization with conservative gas settings
 */

const MARKET_ADDRESS = "0x12d830fb965598c11a31ea183F79eD40DFf99a11";
const RESOLUTION_MANAGER = "0x10daF33E321ED8977e369a36FcC6Beb3d3d106a0";

async function main() {
  console.log("\n🔍 Checking gas price and balance...\n");

  const [signer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(signer.address);
  const gasPrice = (await ethers.provider.getFeeData()).gasPrice;

  console.log(`Your Balance: ${ethers.formatEther(balance)} BASED`);
  console.log(`Gas Price: ${ethers.formatUnits(gasPrice, "gwei")} Gwei\n`);

  // Calculate max transaction cost with 500k gas
  const maxCost = gasPrice * 500000n;
  console.log(`Max Cost (500k gas): ${ethers.formatEther(maxCost)} BASED`);

  if (balance < maxCost) {
    console.log(`❌ Insufficient funds!`);
    console.log(`   Need: ${ethers.formatEther(maxCost)} BASED`);
    console.log(`   Have: ${ethers.formatEther(balance)} BASED\n`);
    console.log(`🎯 SOLUTION: Use lower gas limit or wait for lower gas price.\n`);
    return;
  }

  console.log("✅ Sufficient funds! Attempting finalization...\n");

  const resolutionManager = await ethers.getContractAt(
    "ResolutionManager",
    RESOLUTION_MANAGER
  );

  const market = await ethers.getContractAt("PredictionMarket", MARKET_ADDRESS);
  const state = await market.currentState();

  console.log(`Market State: ${state}\n`);

  if (state !== 3n) {
    console.log(`⚠️  Market not in RESOLVING state. Current state: ${state}\n`);
    return;
  }

  try {
    // Try with lower gas limit and let ethers estimate gas price
    const tx = await resolutionManager.finalizeResolution(MARKET_ADDRESS, {
      gasLimit: 300000, // Lower gas limit
    });

    console.log(`📝 Transaction sent: ${tx.hash}`);
    const receipt = await tx.wait();

    console.log(`✅ SUCCESS!`);
    console.log(`Gas Used: ${receipt.gasUsed.toString()}`);
    const cost = (receipt.gasUsed * receipt.gasPrice) / BigInt(1e9);
    console.log(`Cost: ${ethers.formatUnits(cost, "gwei")} BASED\n`);

    const newState = await market.currentState();
    console.log(`New State: ${newState}\n`);

  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);

    // Try to estimate gas to see what's needed
    try {
      console.log("Trying to estimate gas...");
      const estimate = await resolutionManager.finalizeResolution.estimateGas(
        MARKET_ADDRESS
      );
      console.log(`Estimated Gas: ${estimate.toString()}\n`);
    } catch (e) {
      console.log(`Cannot estimate: ${e.message}\n`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
