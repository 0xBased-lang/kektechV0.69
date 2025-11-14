const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

const CONFIG = {
  versionedRegistryAddress: "0x67F8F023f6cFAe44353d797D6e0B157F2579301A",
  gasPrice: 9,
  gasLimit: 1500000, // INCREASED: From 500k to 1.5M - should cover full execution
};

// CurveType enum: LMSR = 0, LINEAR = 1, EXPONENTIAL = 2, SIGMOID = 3
const CurveType = {
  LMSR: 0,
  LINEAR: 1,
  EXPONENTIAL: 2,
  SIGMOID: 3,
};

async function main() {
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║  STEP 5 FINAL: CREATE MARKET 1 - INCREASED GAS LIMIT       ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  const [deployer] = await ethers.getSigners();
  console.log("📍 Deployer:", deployer.address);
  console.log("📍 Gas Limit: 1,500,000 (increased from 500k)");

  // Get factory from registry
  const VersionedRegistry = await ethers.getContractAt(
    "VersionedRegistry",
    CONFIG.versionedRegistryAddress
  );

  const factoryAddress = await VersionedRegistry.getContract(
    ethers.id("FlexibleMarketFactoryUnified")
  );

  console.log("📍 Factory:", factoryAddress);

  const Factory = await ethers.getContractAt(
    "FlexibleMarketFactoryUnified",
    factoryAddress
  );

  // Market configuration - SIMPLIFIED for maximum compatibility
  const marketConfig = {
    question: "Will BasedAI adoption increase?",
    description: "First KEKTECH 3.0 market on BasedAI mainnet",
    resolutionTime: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
    creatorBond: ethers.parseEther("0.1"),
    category: ethers.id("prediction"),
    outcome1: "Yes",
    outcome2: "No",
  };

  console.log("\n📋 Market Configuration:");
  console.log("   Question:", marketConfig.question);
  console.log("   Bond: 0.1 BASED");
  console.log("   Resolution: 30 days");

  // LMSR parameters
  const curveType = CurveType.LMSR;
  const curveParams = ethers.parseEther("100"); // LMSR 'b' parameter

  console.log("\n⚙️  Curve: LMSR with b=100");

  // Create market with HIGH gas limit
  console.log("\n🔄 Creating Market 1 (with 1.5M gas)...");
  try {
    const createTx = await Factory.createMarketWithCurve(
      marketConfig,
      curveType,
      curveParams,
      {
        value: marketConfig.creatorBond,
        gasPrice: CONFIG.gasPrice,
        gasLimit: CONFIG.gasLimit, // HIGH LIMIT
      }
    );

    console.log("✅ Transaction sent!");
    console.log("   Tx Hash:", createTx.hash);
    console.log("   Waiting for confirmation...\n");

    const receipt = await createTx.wait(1);

    console.log("╔════════════════════════════════════════════════════════════╗");
    console.log("║                  🎉 MARKET CREATED! 🎉                     ║");
    console.log("╚════════════════════════════════════════════════════════════╝\n");

    console.log("✅ Transaction Successful!");
    console.log("   Tx Hash:", receipt.hash);
    console.log("   Block:", receipt.blockNumber);
    console.log("   Gas Used:", receipt.gasUsed.toString());
    console.log("   Status:", receipt.status === 1 ? "SUCCESS" : "FAILED");

    // Extract market address from events
    const marketCreatedEvent = receipt.logs.find((log) => {
      try {
        const decoded = Factory.interface.parseLog(log);
        return decoded && decoded.name === "MarketCreated";
      } catch {
        return false;
      }
    });

    if (marketCreatedEvent) {
      const decodedEvent = Factory.interface.parseLog(marketCreatedEvent);
      const marketAddress = decodedEvent.args[0];

      console.log("\n📊 Market Details:");
      console.log("   Address:", marketAddress);
      console.log("   Creator:", decodedEvent.args[1]);
      console.log("   Question:", decodedEvent.args[2]);

      // Save market data
      const marketData = {
        market1: {
          address: marketAddress,
          question: marketConfig.question,
          description: marketConfig.description,
          outcome1: marketConfig.outcome1,
          outcome2: marketConfig.outcome2,
          creatorBond: "0.1 BASED",
          createdAt: new Date().toISOString(),
          deploymentBlock: receipt.blockNumber,
          transactionHash: receipt.hash,
          curveType: "LMSR",
          curveParams: "100",
        },
      };

      // Update deployment state
      const stateFile = path.join(__dirname, "../basedai-mainnet-deployment.json");
      let state = {};
      if (fs.existsSync(stateFile)) {
        state = JSON.parse(fs.readFileSync(stateFile, "utf8"));
      }
      state.markets = marketData;
      state.lastMarketCreated = new Date().toISOString();
      fs.writeFileSync(stateFile, JSON.stringify(state, null, 2), "utf8");

      console.log("\n✅ Market data saved to deployment state!");

      console.log("\n" + "=".repeat(60));
      console.log("🎊 PHASE 4.1 COMPLETE - MARKET 1 CREATED SUCCESSFULLY! 🎊");
      console.log("=".repeat(60));
      console.log("\nReady for Phase 4 monitoring (72-hour private beta)!");
    } else {
      console.log("⚠️  MarketCreated event not found in logs");
    }
  } catch (error) {
    console.log("❌ ERROR!");
    console.log("   Message:", error.message.substring(0, 200));

    if (error.receipt) {
      console.log("\n   Receipt:");
      console.log("   Gas Used:", error.receipt.gasUsed?.toString());
      console.log("   Status:", error.receipt.status);
    }

    throw error;
  }
}

main().catch((error) => {
  console.error("\n❌ Fatal Error:", error.message);
  process.exitCode = 1;
});
