const { ethers } = require("hardhat");

/**
 * APPROVE & ACTIVATE MARKET 1
 *
 * Quick utility to approve and activate Market 1 for testing
 * Market Address: 0x31d2BC49A6FD4a066F5f8AC61Acd0E6c9105DD84
 */

const CONFIG = {
  MARKET1_ADDRESS: "0x31d2BC49A6FD4a066F5f8AC61Acd0E6c9105DD84",
  FACTORY_ADDRESS: "0x169b4019Fc12c5bD43BFA5d830Fd01A678df6a15",
  RESOLUTION_MANAGER: "0x10daF33E321ED8977e369a36FcC6Beb3d3d106a0",
};

const STATE_NAMES = ["PROPOSED", "APPROVED", "ACTIVE", "RESOLVING", "DISPUTED", "FINALIZED"];

async function main() {
  console.log("\n╔═══════════════════════════════════════════════════════════════╗");
  console.log("║         APPROVE & ACTIVATE MARKET 1 - E2E TEST SETUP         ║");
  console.log("╚═══════════════════════════════════════════════════════════════╝\n");

  try {
    // Get signer
    const [signer] = await ethers.getSigners();
    console.log("📍 Connected Account:", signer.address);

    const balance = await ethers.provider.getBalance(signer.address);
    console.log("💰 Balance:", ethers.formatEther(balance), "BASED\n");

    // Load contracts
    const market = await ethers.getContractAt("PredictionMarket", CONFIG.MARKET1_ADDRESS);
    const factory = await ethers.getContractAt("FlexibleMarketFactoryUnified", CONFIG.FACTORY_ADDRESS);
    const resolutionManager = await ethers.getContractAt("ResolutionManager", CONFIG.RESOLUTION_MANAGER);

    // Check current state
    const currentState = await market.currentState();
    const stateNumber = Number(currentState);
    console.log("📊 Current Market State:", stateNumber, "=", STATE_NAMES[stateNumber]);
    console.log("");

    if (stateNumber === 0) {
      // PROPOSED - need to approve
      console.log("🔄 STEP 1: Approving Market...");
      console.log("═══════════════════════════════════════════════════════════");

      const approveTx = await factory.adminApproveMarket(CONFIG.MARKET1_ADDRESS, {
        gasLimit: 500000,  // Explicit gas limit
        gasPrice: ethers.parseUnits("9", "gwei")  // 9 gwei (worked for Market 1)
      });
      console.log("📝 Transaction sent:", approveTx.hash);

      const approveReceipt = await approveTx.wait();
      console.log("✅ Market APPROVED!");
      console.log("⛽ Gas used:", approveReceipt.gasUsed.toString());
      console.log("");

      // Check state after approval
      const stateAfterApproval = await market.currentState();
      console.log("📊 State after approval:", Number(stateAfterApproval), "=", STATE_NAMES[Number(stateAfterApproval)]);
      console.log("");
    }

    // Check if we need to activate
    const currentStateNow = await market.currentState();
    const stateNow = Number(currentStateNow);

    if (stateNow === 1) {
      // APPROVED - need to activate
      console.log("🔄 STEP 2: Activating Market...");
      console.log("═══════════════════════════════════════════════════════════");

      const activateTx = await factory.activateMarket(CONFIG.MARKET1_ADDRESS, {
        gasLimit: 500000,  // Explicit gas limit
        gasPrice: ethers.parseUnits("9", "gwei")  // 9 gwei (worked for Market 1)
      });
      console.log("📝 Transaction sent:", activateTx.hash);

      const activateReceipt = await activateTx.wait();
      console.log("✅ Market ACTIVATED!");
      console.log("⛽ Gas used:", activateReceipt.gasUsed.toString());
      console.log("");

      // Check final state
      const finalState = await market.currentState();
      console.log("📊 Final State:", Number(finalState), "=", STATE_NAMES[Number(finalState)]);
      console.log("");
    }

    // Get final market info
    const finalStateCheck = await market.currentState();
    const finalStateNumber = Number(finalStateCheck);

    console.log("\n╔═══════════════════════════════════════════════════════════════╗");
    console.log("║                        SETUP COMPLETE                         ║");
    console.log("╚═══════════════════════════════════════════════════════════════╝\n");

    if (finalStateNumber === 2) {
      console.log("✅ SUCCESS: Market 1 is now ACTIVE and ready for betting!");
      console.log("");
      console.log("🎯 NEXT STEPS:");
      console.log("   1. Run betting tests");
      console.log("   2. Test LMSR price discovery");
      console.log("   3. Complete market lifecycle");
      console.log("");
    } else {
      console.log("⚠️  Market state:", STATE_NAMES[finalStateNumber]);
      console.log("Expected: ACTIVE (2)");
      console.log("Got:", finalStateNumber);
    }

  } catch (error) {
    console.error("\n❌ ERROR:", error.message);

    if (error.message.includes("revert")) {
      console.log("\n💡 TIP: Make sure you have ADMIN role in ResolutionManager");
    }

    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
