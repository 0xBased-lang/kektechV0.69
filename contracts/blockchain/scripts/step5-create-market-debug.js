const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

const CONFIG = {
  versionedRegistryAddress: "0x67F8F023f6cFAe44353d797D6e0B157F2579301A",
  gasPrice: 9,
  gasLimit: 800000, // Increased to capture full error
};

const CurveType = {
  LMSR: 0,
  LINEAR: 1,
  EXPONENTIAL: 2,
  SIGMOID: 3,
};

async function main() {
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║      STEP 5: CREATE MARKET WITH DETAILED DEBUGGING          ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  const [deployer] = await ethers.getSigners();
  console.log("📍 Deployer:", deployer.address);

  // Get factory from registry
  const VersionedRegistry = await ethers.getContractAt(
    "VersionedRegistry",
    CONFIG.versionedRegistryAddress
  );

  const factoryAddress = await VersionedRegistry.getContract(
    ethers.id("FlexibleMarketFactoryUnified")
  );

  console.log("📍 Factory from Registry:", factoryAddress);

  const Factory = await ethers.getContractAt(
    "FlexibleMarketFactoryUnified",
    factoryAddress
  );

  // Minimal market config
  const marketConfig = {
    question: "Test question?",
    description: "Test description",
    resolutionTime: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
    creatorBond: ethers.parseEther("0.1"),
    category: ethers.id("test"),
    outcome1: "Yes",
    outcome2: "No",
  };

  console.log("\n📋 Minimal Market Config:");
  console.log("   Question:", marketConfig.question);
  console.log("   Bond:", ethers.formatEther(marketConfig.creatorBond), "BASED");
  console.log("   Category hash:", marketConfig.category);
  console.log("   Resolution time:", new Date(marketConfig.resolutionTime * 1000).toISOString());

  // LMSR parameters
  const curveType = CurveType.LMSR;
  const curveParams = ethers.parseEther("100");

  console.log("\n⚙️  Curve Config:");
  console.log("   Type: LMSR (0)");
  console.log("   Params: 100");

  // Try to create market with detailed error handling
  console.log("\n🔄 Creating market...");
  try {
    const createTx = await Factory.createMarketWithCurve(
      marketConfig,
      curveType,
      curveParams,
      {
        value: marketConfig.creatorBond,
        gasPrice: CONFIG.gasPrice,
        gasLimit: CONFIG.gasLimit,
      }
    );

    console.log("   Tx sent:", createTx.hash);
    console.log("   Waiting for confirmation...");
    const receipt = await createTx.wait(1);

    console.log("\n✅ SUCCESS!");
    console.log("   Block:", receipt.blockNumber);
    console.log("   Gas used:", receipt.gasUsed);
    console.log("   Status:", receipt.status === 1 ? "SUCCESS" : "FAILED");

    if (receipt.status === 1) {
      // Parse events
      const iface = Factory.interface;
      for (const log of receipt.logs) {
        try {
          const parsed = iface.parseLog(log);
          if (parsed && parsed.name === "MarketCreated") {
            console.log("\n📋 MarketCreated Event:");
            console.log("   Market:", parsed.args[0]);
            console.log("   Creator:", parsed.args[1]);
            console.log("   Question:", parsed.args[2]);
          }
        } catch {}
      }
    }
  } catch (error) {
    console.log("\n❌ ERROR!");
    console.log("   Message:", error.message);

    // Try to extract revert reason
    if (error.data) {
      console.log("   Data:", error.data);
    }

    if (error.reason) {
      console.log("   Reason:", error.reason);
    }

    // Detailed error info
    if (error.transaction) {
      console.log("\n   Transaction:");
      console.log("   To:", error.transaction.to);
      console.log("   Data length:", error.transaction.data?.length);
    }

    if (error.receipt) {
      console.log("\n   Receipt:");
      console.log("   Gas used:", error.receipt.gasUsed);
      console.log("   Status:", error.receipt.status);
      console.log("   Block:", error.receipt.blockNumber);
    }

    // Try to get revert reason from chain
    console.log("\n🔍 Attempting to trace revert reason...");
    try {
      // Create a call to the function and see what error we get
      const callResult = await deployer.call({
        to: factoryAddress,
        data: Factory.interface.encodeFunctionData("createMarketWithCurve", [
          marketConfig,
          curveType,
          curveParams,
        ]),
        value: marketConfig.creatorBond,
      });
      console.log("   Call result:", callResult);
    } catch (callError) {
      console.log("   Call error:", callError.message.substring(0, 200));
    }
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exitCode = 1;
});
