const { ethers } = require("hardhat");

/**
 * CREATE QUICK TEST MARKET
 * Resolution time: 2 minutes from now
 * Purpose: Complete lifecycle testing
 */

const CONFIG = {
  FACTORY: "0x169b4019Fc12c5bD43BFA5d830Fd01A678df6a15",
  GAS_PRICE: ethers.parseUnits("9", "gwei"),
};

async function main() {
  console.log("\n🏗️  CREATING QUICK TEST MARKET (2min resolution)...\n");

  const [signer] = await ethers.getSigners();
  console.log("Creator:", signer.address);

  const factory = await ethers.getContractAt(
    "FlexibleMarketFactoryUnified",
    CONFIG.FACTORY
  );

  // Resolution time: 2 minutes from now
  const now = Math.floor(Date.now() / 1000);
  const resolutionTime = now + 120; // 2 minutes

  console.log("Resolution Time:", new Date(resolutionTime * 1000).toLocaleString());
  console.log("(2 minutes from now)\n");

  // Create market
  console.log("Creating market...");

  try {
    const createTx = await factory.createMarket(
      {
        question: "Test Market - 2min Resolution",
        description: "Quick lifecycle testing market",
        resolutionTime: resolutionTime,
        creatorBond: ethers.parseEther("10"),
        category: ethers.id("test"),
        outcome1: "Outcome 1",
        outcome2: "Outcome 2",
      },
      {
        value: ethers.parseEther("10"),
        gasLimit: 750000,
        gasPrice: CONFIG.GAS_PRICE,
      }
    );

    console.log("Transaction submitted:", createTx.hash);
    const receipt = await createTx.wait();

    // Get market address from event
    const event = receipt.logs.find(log => {
      try {
        return factory.interface.parseLog({
          topics: log.topics,
          data: log.data
        })?.name === "MarketCreated";
      } catch {
        return false;
      }
    });

    if (event) {
      const parsed = factory.interface.parseLog({
        topics: event.topics,
        data: event.data
      });
      const marketAddress = parsed.args[0];

      console.log("\n✅ MARKET CREATED SUCCESSFULLY!");
      console.log("════════════════════════════════════════");
      console.log("Market Address:", marketAddress);
      console.log("Gas Used:", receipt.gasUsed.toString());
      console.log("Resolution Time:", new Date(resolutionTime * 1000).toLocaleString());
      console.log("Seconds Until Resolution: 120");
      console.log("════════════════════════════════════════");

      // Save market address to file for easy reference
      const fs = require("fs");
      fs.writeFileSync(
        "scripts/e2e-tests/QUICK_TEST_MARKET_ADDRESS.txt",
        `${marketAddress}\n${resolutionTime}`
      );

      console.log("\n📝 Market address saved to QUICK_TEST_MARKET_ADDRESS.txt");
      console.log("\n🎯 NEXT STEPS:");
      console.log("1. Approve market: node scripts/e2e-tests/approve-activate-quick-market.js");
      console.log("2. Wait 2 minutes for resolution time");
      console.log("3. Test complete lifecycle!");

    } else {
      console.log("⚠️ Market created but couldn't find address in events");
    }

  } catch (error) {
    console.error("\n❌ Failed to create market:");
    console.error(error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
