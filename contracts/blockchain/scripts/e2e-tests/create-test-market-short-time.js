const { ethers } = require("hardhat");

/**
 * Create a test market with SHORT resolution time for lifecycle testing
 * Resolution time: 5 minutes from now
 */

async function main() {
  console.log("\n🏗️  Creating Test Market with SHORT Resolution Time...\n");

  const [signer] = await ethers.getSigners();
  console.log("Account:", signer.address);

  const factory = await ethers.getContractAt(
    "FlexibleMarketFactoryUnified",
    "0x169b4019Fc12c5bD43BFA5d830Fd01A678df6a15"
  );

  // Resolution time: 5 minutes from now
  const resolutionTime = Math.floor(Date.now() / 1000) + 300; // 5 minutes
  const resolutionDate = new Date(resolutionTime * 1000);

  console.log("Market Configuration:");
  console.log("──────────────────────────────────────");
  console.log("Question: Will BTC hit $100k today?");
  console.log("Outcomes: ['Yes - BTC $100k', 'No - Below $100k']");
  console.log("Resolution Time:", resolutionDate.toLocaleString());
  console.log("(5 minutes from now)");
  console.log("Creator Bond: 10 BASED");
  console.log("");

  try {
    const createTx = await factory.createMarket(
      {
        question: "Will BTC hit $100k today?",
        description: "Test market for lifecycle testing - 5 min resolution time",
        resolutionTime: resolutionTime,
        creatorBond: ethers.parseEther("10"),
        category: ethers.id("cryptocurrency"),
        outcome1: "Yes - BTC $100k",
        outcome2: "No - Below $100k",
      },
      {
        value: ethers.parseEther("10"), // Creator bond
        gasLimit: 750000,
        gasPrice: ethers.parseUnits("9", "gwei"),
      }
    );

    console.log("⏳ Creating market...");
    const receipt = await createTx.wait();

    // Find MarketCreated event
    const factoryInterface = factory.interface;
    const marketCreatedEvent = receipt.logs
      .map((log) => {
        try {
          return factoryInterface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((event) => event && event.name === "MarketCreated");

    if (marketCreatedEvent) {
      const marketAddress = marketCreatedEvent.args.marketAddress;
      console.log("\n✅ Market Created Successfully!");
      console.log("──────────────────────────────────────");
      console.log("Market Address:", marketAddress);
      console.log("Tx Hash:", receipt.hash);
      console.log("Gas Used:", receipt.gasUsed.toString());
      console.log("State: PROPOSED (need to approve + activate)");
      console.log("");

      console.log("📋 Next Steps:");
      console.log("1. Approve market:");
      console.log(`   ResolutionManager.approveMarket("${marketAddress}")`);
      console.log("2. Activate market:");
      console.log(`   AccessControlManager.grantRole(BACKEND_ROLE, deployer)`);
      console.log(`   Market.activateMarket()`);
      console.log("3. Place test bets");
      console.log("4. Wait 5 minutes");
      console.log("5. Propose outcome");
      console.log("6. Finalize & claim winnings");
      console.log("");

      console.log("⏰ Resolution Time: 5 minutes from now!");
      console.log("   Set a timer! ⏱️");
    } else {
      console.log("⚠️  Market created but couldn't find address in events");
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.receipt) {
      console.error("Gas used:", error.receipt.gasUsed.toString());
    }
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
