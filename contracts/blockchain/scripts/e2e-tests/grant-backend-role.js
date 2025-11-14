const { ethers } = require("hardhat");

/**
 * GRANT BACKEND ROLE
 *
 * Grant BACKEND_ROLE to the current account so we can activate markets
 */

const CONFIG = {
  ACCESS_CONTROL: "0x4d1afBb8E50e17F24dCbB4Fc3197537be646315A",
};

async function main() {
  console.log("\n╔═══════════════════════════════════════════════════════════════╗");
  console.log("║              GRANT BACKEND ROLE - E2E TEST SETUP              ║");
  console.log("╚═══════════════════════════════════════════════════════════════╝\n");

  try {
    // Get signer
    const [signer] = await ethers.getSigners();
    console.log("📍 Account:", signer.address);

    const balance = await ethers.provider.getBalance(signer.address);
    console.log("💰 Balance:", ethers.formatEther(balance), "BASED\n");

    // Load AccessControlManager
    const accessControl = await ethers.getContractAt("AccessControlManager", CONFIG.ACCESS_CONTROL);

    // Define BACKEND_ROLE
    const BACKEND_ROLE = ethers.keccak256(ethers.toUtf8Bytes("BACKEND_ROLE"));

    // Check if already has role
    const hasBackendRole = await accessControl.hasRole(BACKEND_ROLE, signer.address);

    if (hasBackendRole) {
      console.log("✅ Account already has BACKEND_ROLE!");
      console.log("");
      return;
    }

    console.log("🔄 Granting BACKEND_ROLE...");
    console.log("═══════════════════════════════════════════════════════════");

    const grantTx = await accessControl.grantRole(BACKEND_ROLE, signer.address, {
      gasLimit: 100000,
      gasPrice: ethers.parseUnits("9", "gwei")
    });

    console.log("📝 Transaction sent:", grantTx.hash);

    const receipt = await grantTx.wait();
    console.log("✅ BACKEND_ROLE granted!");
    console.log("⛽ Gas used:", receipt.gasUsed.toString());
    console.log("");

    // Verify
    const hasRoleNow = await accessControl.hasRole(BACKEND_ROLE, signer.address);
    if (hasRoleNow) {
      console.log("✅ VERIFICATION PASSED: Account now has BACKEND_ROLE");
      console.log("");
      console.log("🎯 NEXT STEP: Run approve-activate-market1.js to activate Market 1");
      console.log("");
    } else {
      console.log("❌ VERIFICATION FAILED: Role not granted");
    }

  } catch (error) {
    console.error("\n❌ ERROR:", error.message);

    if (error.message.includes("revert")) {
      console.log("\n💡 TIP: Make sure you have DEFAULT_ADMIN_ROLE");
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
