const { ethers } = require("hardhat");
const { grantTestRoles } = require("./helpers/workflow-helpers");

/**
 * SETUP TEST ROLES
 *
 * One-time setup script to grant required roles to test accounts.
 * Grants: RESOLVER_ROLE, BACKEND_ROLE
 *
 * Run this before running E2E tests if roles aren't already granted.
 */

async function main() {
  console.log("\n╔═══════════════════════════════════════════════════════════════╗");
  console.log("║               GRANT TEST ROLES - ONE-TIME SETUP               ║");
  console.log("╚═══════════════════════════════════════════════════════════════╝\n");

  const [signer] = await ethers.getSigners();

  console.log("Account:", signer.address);
  console.log("");

  const result = await grantTestRoles(signer.address);

  if (result.success) {
    console.log("╔═══════════════════════════════════════════════════════════════╗");
    console.log("║                  SETUP COMPLETE! ✅                            ║");
    console.log("╚═══════════════════════════════════════════════════════════════╝\n");

    console.log("Roles granted:", result.rolesGranted.join(", "));
    console.log("Transaction hashes:");
    result.txHashes.forEach((hash, i) => {
      console.log(`   ${i + 1}. ${hash}`);
    });
    console.log("");
    console.log("✅ You can now run E2E tests!");
    console.log("");
  } else {
    console.log("╔═══════════════════════════════════════════════════════════════╗");
    console.log("║                  SETUP FAILED! ❌                              ║");
    console.log("╚═══════════════════════════════════════════════════════════════╝\n");

    console.error("Error:", result.error);
    console.log("");
    console.log("Roles granted before error:", result.rolesGranted.join(", "));

    if (result.error.includes("already")) {
      console.log("");
      console.log("ℹ️  Roles may already be granted. Try running the test anyway.");
      process.exit(0);
    } else {
      process.exit(1);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
