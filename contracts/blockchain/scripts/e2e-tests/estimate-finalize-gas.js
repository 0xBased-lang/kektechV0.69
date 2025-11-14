const { ethers } = require("hardhat");

/**
 * ESTIMATE FINALIZATION GAS
 * Let's see what ethers is trying to do
 */

const MARKET_ADDRESS = "0x12d830fb965598c11a31ea183F79eD40DFf99a11";
const RESOLUTION_MANAGER = "0x10daF33E321ED8977e369a36FcC6Beb3d3d106a0";

async function main() {
  console.log("\n🔍 Estimating finalization gas...\n");

  const [signer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(signer.address);
  const feeData = await ethers.provider.getFeeData();

  console.log(`Balance: ${ethers.formatEther(balance)} BASED`);
  console.log(`Gas Price: ${feeData.gasPrice || 'null'}`);
  console.log(`Max Fee: ${feeData.maxFeePerGas || 'null'}`);
  console.log(`Max Priority: ${feeData.maxPriorityFeePerGas || 'null'}\n`);

  const resolutionManager = await ethers.getContractAt(
    "ResolutionManager",
    RESOLUTION_MANAGER
  );

  const resolutionData = await resolutionManager.getResolutionData(MARKET_ADDRESS);
  console.log(`Outcome: ${resolutionData.outcome}`);
  console.log(`Resolved At: ${resolutionData.resolvedAt}\n`);

  // Try to estimate gas
  try {
    console.log("Estimating gas for adminResolveMarket...");
    const estimate = await resolutionManager.adminResolveMarket.estimateGas(
      MARKET_ADDRESS,
      resolutionData.outcome,
      "Test"
    );
    console.log(`✅ Estimated Gas: ${estimate.toString()}\n`);

    const cost = estimate * (feeData.gasPrice || 0n);
    console.log(`Estimated Cost: ${ethers.formatEther(cost)} BASED`);

    if (balance >= cost) {
      console.log(`✅ Sufficient funds!\n`);
    } else {
      console.log(`❌ Insufficient! Need: ${ethers.formatEther(cost)} BASED\n`);
    }
  } catch (error) {
    console.log(`❌ Estimation failed: ${error.message}\n`);

    // Try with static call to see what the revert is
    try {
      console.log("Trying static call to see revert reason...");
      await resolutionManager.adminResolveMarket.staticCall(
        MARKET_ADDRESS,
        resolutionData.outcome,
        "Test"
      );
      console.log("✅ Static call succeeded!\n");
    } catch (staticError) {
      console.log(`❌ Static call failed: ${staticError.message}\n`);

      // Parse the error
      if (staticError.data) {
        console.log(`Error data: ${staticError.data}\n`);
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
