/**
 * Test market creation with the EXACT parameters that failed
 * This will help us identify the actual revert reason
 */

const { ethers } = require("hardhat");

const MARKET_FACTORY = "0x3eaF643482Fe35d13DB812946E14F5345eb60d62";

async function main() {
  console.log("\n🧪 Testing Market Creation (Simulating Failed TX)\n");
  console.log("=".repeat(60));

  const [deployer] = await ethers.getSigners();
  console.log("\nCreator:", deployer.address);

  // Get balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "BASED\n");

  const factory = await ethers.getContractAt("FlexibleMarketFactoryUnified", MARKET_FACTORY);

  // EXACT parameters from the failed transaction
  const config = {
    question: "Will Coom commit in 2025?",
    description: "Commiter post in TG @getbasedAI post on X",
    resolutionTime: Math.floor(new Date("2026-01-01T00:01:00Z").getTime() / 1000), // Jan 1, 2026
    creatorBond: ethers.parseEther("420"), // 420 BASED
    category: ethers.id("Crypto"), // bytes32
    outcome1: "Yes",
    outcome2: "No"
  };

  console.log("Market Config:");
  console.log("  Question:", config.question);
  console.log("  Resolution:", new Date(config.resolutionTime * 1000).toISOString());
  console.log("  Bond:", ethers.formatEther(config.creatorBond), "BASED");
  console.log("  Category:", config.category);

  const curveType = 0; // LMSR
  const curveParams = 7500;

  console.log("\nCurve Config:");
  console.log("  Type: LMSR (0)");
  console.log("  Parameter:", curveParams);

  try {
    console.log("\n📤 Estimating gas...");

    const gasEstimate = await factory.createMarketWithCurve.estimateGas(
      config,
      curveType,
      curveParams,
      { value: ethers.parseEther("420") }
    );

    console.log("✅ Gas estimate succeeded:", gasEstimate.toString());
    console.log("\n💡 This means the transaction SHOULD work!");
    console.log("   The UI failure was likely due to:");
    console.log("   1. Insufficient balance");
    console.log("   2. Network connectivity issues");
    console.log("   3. RPC incompatibility");

    console.log("\n🚀 Attempting actual transaction...");

    const tx = await factory.createMarketWithCurve(
      config,
      curveType,
      curveParams,
      {
        value: ethers.parseEther("420"),
        gasLimit: gasEstimate * 120n / 100n // 20% buffer
      }
    );

    console.log("⏳ Transaction sent:", tx.hash);
    const receipt = await tx.wait(2);
    console.log("✅ Confirmed in block:", receipt.blockNumber);

    // Extract market address from events
    const marketCreatedEvent = receipt.logs.find(log => {
      try {
        const parsed = factory.interface.parseLog(log);
        return parsed && parsed.name === "MarketCreated";
      } catch {
        return false;
      }
    });

    if (marketCreatedEvent) {
      const parsed = factory.interface.parseLog(marketCreatedEvent);
      console.log("\n🎉 Market Created Successfully!");
      console.log("   Address:", parsed.args.marketAddress);
    }

  } catch (error) {
    console.log("\n❌ Transaction would fail!");
    console.log("\nError:", error.message);

    // Try to decode the revert reason
    if (error.data) {
      try {
        const reason = factory.interface.parseError(error.data);
        console.log("\nDecoded revert reason:", reason);
      } catch {
        console.log("\nRaw error data:", error.data);
      }
    }

    // Common failure reasons
    console.log("\n💡 Possible causes:");
    console.log("   1. Insufficient balance (need 420 BASED)");
    console.log("   2. Contract paused");
    console.log("   3. Invalid resolution time");
    console.log("   4. Curve not active in registry");
    console.log("   5. Creator bond below minimum");
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
