const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

const CONFIG = {
  accessControlAddress: "0x4d1afBb8E50e17F24dCbB4Fc3197537be646315A",
  gasPrice: 9,
  gasLimit: 100000,
};

async function main() {
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║         STEP 1: GRANT DEFAULT_ADMIN_ROLE                    ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  const [deployer] = await ethers.getSigners();
  console.log("📍 Deployer:", deployer.address);
  console.log("📍 AccessControlManager:", CONFIG.accessControlAddress);

  // Get AccessControlManager contract
  const AccessControlManager = await ethers.getContractAt(
    "AccessControlManager",
    CONFIG.accessControlAddress
  );

  // DEFAULT_ADMIN_ROLE is bytes32(0)
  const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;

  console.log("\n🔍 Checking current role status...");
  const hasRole = await AccessControlManager.hasRole(
    DEFAULT_ADMIN_ROLE,
    deployer.address
  );
  console.log("   Has DEFAULT_ADMIN_ROLE:", hasRole);

  if (hasRole) {
    console.log("\n✅ Already has DEFAULT_ADMIN_ROLE!");
    return;
  }

  console.log("\n🔄 Granting DEFAULT_ADMIN_ROLE...");
  const tx = await AccessControlManager.grantRole(
    DEFAULT_ADMIN_ROLE,
    deployer.address,
    {
      gasPrice: CONFIG.gasPrice,
      gasLimit: CONFIG.gasLimit,
    }
  );

  console.log("⏳ Waiting for confirmation...");
  const receipt = await tx.wait(1);
  console.log("\n✅ ROLE GRANTED!");
  console.log("   Tx Hash:", receipt.hash);
  console.log("   Gas Used:", receipt.gasUsed);

  // Verify
  const verified = await AccessControlManager.hasRole(
    DEFAULT_ADMIN_ROLE,
    deployer.address
  );
  console.log("\n✅ Verification:", verified ? "PASSED" : "FAILED");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
