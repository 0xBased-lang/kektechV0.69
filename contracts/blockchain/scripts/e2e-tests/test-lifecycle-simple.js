const { ethers } = require("hardhat");

/**
 * SIMPLE LIFECYCLE TEST
 * Market: 0x12d830fb965598c11a31ea183F79eD40DFf99a11
 * Resolution Time: 1762470568 (Nov 7, 2025 00:09:28)
 */

const MARKET_ADDRESS = "0x12d830fb965598c11a31ea183F79eD40DFf99a11";
const RESOLUTION_TIME = 1762470568;

const CONFIG = {
  FACTORY: "0x169b4019Fc12c5bD43BFA5d830Fd01A678df6a15",
  RESOLUTION_MANAGER: "0x10daF33E321ED8977e369a36FcC6Beb3d3d106a0",
  GAS_PRICE: ethers.parseUnits("9", "gwei"),
};

async function main() {
  console.log("\n🎯 SIMPLE LIFECYCLE TEST\n");

  const [signer] = await ethers.getSigners();
  console.log("Account:", signer.address);
  console.log("Market:", MARKET_ADDRESS);

  const market = await ethers.getContractAt("PredictionMarket", MARKET_ADDRESS);
  const factory = await ethers.getContractAt("FlexibleMarketFactoryUnified", CONFIG.FACTORY);
  const resolutionManager = await ethers.getContractAt("ResolutionManager", CONFIG.RESOLUTION_MANAGER);

  // Check current time vs resolution time
  const now = Math.floor(Date.now() / 1000);
  const timeUntilResolution = RESOLUTION_TIME - now;

  console.log("\n⏰ Time Check:");
  console.log("Current Time:", new Date(now * 1000).toLocaleString());
  console.log("Resolution Time:", new Date(RESOLUTION_TIME * 1000).toLocaleString());
  console.log("Time until resolution:", timeUntilResolution, "seconds");

  if (timeUntilResolution > 0) {
    console.log(`\n⏳ Waiting ${timeUntilResolution} seconds for resolution time...`);
    for (let i = timeUntilResolution; i > 0; i--) {
      if (i % 10 === 0 || i <= 5) {
        process.stdout.write(`\r${i} seconds remaining...  `);
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    console.log("\r✅ Resolution time reached!     \n");
  }

  // Check current state
  const state = await market.currentState();
  console.log("\n📊 Market Status:");
  console.log("Current State:", Number(state), "(2=ACTIVE, 3=RESOLVING, 5=FINALIZED)");

  if (state < 2n) {
    console.log("\n🔧 Activating market first...");

    if (state === 0n) {
      const approveTx = await factory.adminApproveMarket(MARKET_ADDRESS, {
        gasLimit: 500000,
        gasPrice: CONFIG.GAS_PRICE,
      });
      await approveTx.wait();
      console.log("✅ Approved");
    }

    const activateTx = await factory.activateMarket(MARKET_ADDRESS, {
      gasLimit: 500000,
      gasPrice: CONFIG.GAS_PRICE,
    });
    await activateTx.wait();
    console.log("✅ Activated");
  }

  // Try resolution with 1M gas
  console.log("\n🎯 Testing proposeResolution with 1,000,000 gas...");

  try {
    const proposeTx = await resolutionManager.proposeResolution(
      MARKET_ADDRESS,
      1, // Outcome 1 wins
      "Test resolution - Outcome 1 is correct",
      {
        gasLimit: 1000000,
        gasPrice: CONFIG.GAS_PRICE,
      }
    );

    console.log("TX submitted:", proposeTx.hash);
    const receipt = await proposeTx.wait();

    console.log("\n✅ SUCCESS! RESOLUTION PROPOSED!");
    console.log("Gas used:", receipt.gasUsed.toString());
    console.log("Cost: $" + ((Number(receipt.gasUsed) * 9) / 1e9).toFixed(9));

    // Check new state
    const newState = await market.currentState();
    console.log("New State:", Number(newState), "(should be 3=RESOLVING)");

  } catch (error) {
    console.error("\n❌ FAILED:");
    console.error(error.message);

    if (error.message.includes("ResolutionTimeNotReached")) {
      console.log("\n⏰ Resolution time not reached - script calculated wrong time");
    } else if (error.message.includes("MarketNotActive")) {
      const currentState = await market.currentState();
      console.log(`\nMarket state: ${Number(currentState)} (needs to be 2=ACTIVE)`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
