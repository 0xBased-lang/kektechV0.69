const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

const CONFIG = {
  factoryAddress: "0x169b4019Fc12c5bD43BFA5d830Fd01A678df6a15", // NEW fixed factory
  gasPrice: 9,
  gasLimit: 500000,
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
  console.log("║        STEP 5: CREATE MARKET 1 WITH FIXED FACTORY          ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  const [deployer] = await ethers.getSigners();
  console.log("📍 Deployer:", deployer.address);
  console.log("📍 Factory:", CONFIG.factoryAddress);

  // Get factory contract
  const Factory = await ethers.getContractAt(
    "FlexibleMarketFactoryUnified",
    CONFIG.factoryAddress
  );

  // Market configuration
  const marketConfig = {
    question: "Will BasedAI adoption increase by 10% in Q1 2025?",
    description: "First test market on KEKTECH 3.0 - BasedAI mainnet deployment",
    resolutionTime: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days from now
    creatorBond: ethers.parseEther("0.1"),
    category: ethers.keccak256(ethers.toUtf8Bytes("technology")),
    outcome1: "Yes",
    outcome2: "No",
  };

  console.log("\n📋 Market Configuration:");
  console.log("   Question:", marketConfig.question);
  console.log("   Description:", marketConfig.description);
  console.log("   Outcomes:", marketConfig.outcome1, "/", marketConfig.outcome2);
  console.log("   Creator Bond:", ethers.formatEther(marketConfig.creatorBond), "BASED");
  console.log("   Resolution Time: 30 days from now");

  // LMSR parameters
  const curveType = CurveType.LMSR;
  const curveParams = ethers.parseEther("100"); // LMSR 'b' parameter = 100

  console.log("   Curve Type: LMSR");
  console.log("   Curve Params: 100");

  // Create market
  console.log("\n🔄 Creating Market 1...");
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

  console.log("⏳ Waiting for confirmation...");
  const receipt = await createTx.wait(1);

  if (receipt.status === 1) {
    console.log("\n✅ MARKET 1 CREATED SUCCESSFULLY!");
    console.log("   Tx Hash:", receipt.hash);
    console.log("   Block:", receipt.blockNumber);
    console.log("   Gas Used:", receipt.gasUsed);

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
      console.log("   Market Address:", marketAddress);

      // Save market data
      const marketData = {
        market1: {
          address: marketAddress,
          question: marketConfig.question,
          outcome1: marketConfig.outcome1,
          outcome2: marketConfig.outcome2,
          creatorBond: ethers.formatEther(marketConfig.creatorBond),
          createdAt: new Date().toISOString(),
          deploymentBlock: receipt.blockNumber,
          transactionHash: receipt.hash,
        },
      };

      const stateFile = path.join(
        __dirname,
        "../basedai-mainnet-deployment.json"
      );
      let state = {};
      if (fs.existsSync(stateFile)) {
        state = JSON.parse(fs.readFileSync(stateFile, "utf8"));
      }
      state.markets = marketData;
      fs.writeFileSync(stateFile, JSON.stringify(state, null, 2), "utf8");
      console.log("\n✅ Market data saved to deployment state");
    }
  } else {
    console.log("\n❌ Market creation FAILED!");
    console.log("   Tx Hash:", receipt.hash);
    console.log("   Status:", receipt.status);
  }
}

main().catch((error) => {
  console.error("Error creating market:", error.message);
  if (error.data) console.error("Revert reason:", error.data);
  process.exitCode = 1;
});
