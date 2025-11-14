const { ethers } = require("hardhat");

/**
 * CHECK AND GRANT RESOLVER ROLE
 *
 * Root Cause Discovery:
 * - proposeResolution requires RESOLVER_ROLE
 * - Test account likely doesn't have this role
 * - That's why resolution failed (not gas limits!)
 *
 * This script:
 * 1. Checks if test account has RESOLVER_ROLE
 * 2. Grants it if needed (requires ADMIN_ROLE)
 * 3. Verifies the grant was successful
 */

const CONFIG = {
  ACCESS_CONTROL: "0x4d1afBb8E50e17F24dCbB4Fc3197537be646315A",
  GAS_PRICE: ethers.parseUnits("9", "gwei"),
};

async function main() {
  console.log("\n🔐 CHECKING AND GRANTING RESOLVER ROLE...\n");

  const [signer] = await ethers.getSigners();
  console.log("Test Account:", signer.address);

  const accessControl = await ethers.getContractAt(
    "AccessControlManager",
    CONFIG.ACCESS_CONTROL
  );

  // Get role hash
  const RESOLVER_ROLE = ethers.id("RESOLVER_ROLE");
  const ADMIN_ROLE = ethers.id("ADMIN_ROLE");

  console.log("\nRole Hashes:");
  console.log("RESOLVER_ROLE:", RESOLVER_ROLE);
  console.log("ADMIN_ROLE:", ADMIN_ROLE);

  // Check current roles
  console.log("\n📋 Current Role Status:");

  const hasResolver = await accessControl.hasRole(RESOLVER_ROLE, signer.address);
  const hasAdmin = await accessControl.hasRole(ADMIN_ROLE, signer.address);

  console.log(`RESOLVER_ROLE: ${hasResolver ? "✅ GRANTED" : "❌ NOT GRANTED"}`);
  console.log(`ADMIN_ROLE: ${hasAdmin ? "✅ GRANTED" : "❌ NOT GRANTED"}`);

  if (hasResolver) {
    console.log("\n✅ Test account already has RESOLVER_ROLE!");
    console.log("No action needed - ready to test resolution workflow.");
    return;
  }

  if (!hasAdmin) {
    console.log("\n❌ ERROR: Test account needs ADMIN_ROLE to grant RESOLVER_ROLE!");
    console.log("Please grant ADMIN_ROLE to this account first.");
    console.log(`Account: ${signer.address}`);
    return;
  }

  // Grant RESOLVER_ROLE
  console.log("\n🔧 Granting RESOLVER_ROLE to test account...");

  try {
    const grantTx = await accessControl.grantRole(
      RESOLVER_ROLE,
      signer.address,
      {
        gasLimit: 100000,
        gasPrice: CONFIG.GAS_PRICE,
      }
    );

    console.log("Transaction submitted:", grantTx.hash);
    const receipt = await grantTx.wait();

    console.log("✅ Role granted successfully!");
    console.log(`Gas used: ${receipt.gasUsed.toString()}`);
    console.log(`Cost: $${((Number(receipt.gasUsed) * 9) / 1e9).toFixed(9)} USD`);

    // Verify
    const verifyHasResolver = await accessControl.hasRole(RESOLVER_ROLE, signer.address);

    if (verifyHasResolver) {
      console.log("\n✅ VERIFICATION: Role grant confirmed!");
      console.log("Test account now has RESOLVER_ROLE ✅");
    } else {
      console.log("\n⚠️ WARNING: Role grant transaction succeeded but verification failed!");
      console.log("This shouldn't happen - investigate!");
    }

  } catch (error) {
    console.error("\n❌ Failed to grant RESOLVER_ROLE:");
    console.error(error.message);

    if (error.message.includes("AccessControl")) {
      console.log("\nℹ️  This account may not have admin permissions.");
      console.log("Check that the deployer account is being used.");
    }
  }

  // Also check BACKEND_ROLE (needed for some operations)
  const BACKEND_ROLE = ethers.id("BACKEND_ROLE");
  const hasBackend = await accessControl.hasRole(BACKEND_ROLE, signer.address);

  console.log("\n📋 Additional Role Status:");
  console.log(`BACKEND_ROLE: ${hasBackend ? "✅ GRANTED" : "❌ NOT GRANTED"}`);

  if (!hasBackend && hasAdmin) {
    console.log("\n🔧 Also granting BACKEND_ROLE (may be needed)...");
    try {
      const backendTx = await accessControl.grantRole(
        BACKEND_ROLE,
        signer.address,
        {
          gasLimit: 100000,
          gasPrice: CONFIG.GAS_PRICE,
        }
      );
      await backendTx.wait();
      console.log("✅ BACKEND_ROLE granted successfully!");
    } catch (error) {
      console.log("⚠️ Failed to grant BACKEND_ROLE (may not be needed)");
    }
  }

  console.log("\n🎯 FINAL STATUS:");
  const finalResolver = await accessControl.hasRole(RESOLVER_ROLE, signer.address);
  const finalBackend = await accessControl.hasRole(BACKEND_ROLE, signer.address);

  console.log(`RESOLVER_ROLE: ${finalResolver ? "✅" : "❌"}`);
  console.log(`BACKEND_ROLE: ${finalBackend ? "✅" : "❌"}`);
  console.log(`ADMIN_ROLE: ${hasAdmin ? "✅" : "❌"}`);

  if (finalResolver) {
    console.log("\n✅ SUCCESS! Ready to test resolution workflow! 🚀");
  } else {
    console.log("\n❌ FAILED: Could not grant RESOLVER_ROLE");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
