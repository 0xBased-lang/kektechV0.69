const { ethers } = require("hardhat");

async function main() {
  console.log("\n🔍 Checking AccessControlManager Status...\n");

  const accessControl = await ethers.getContractAt("AccessControlManager", "0x4d1afBb8E50e17F24dCbB4Fc3197537be646315A");

  const isPaused = await accessControl.paused();
  console.log("AccessControlManager paused:", isPaused);

  const BACKEND_ROLE = ethers.keccak256(ethers.toUtf8Bytes("BACKEND_ROLE"));
  const adminRole = await accessControl.getRoleAdmin(BACKEND_ROLE);
  console.log("\nBACKEND_ROLE:", BACKEND_ROLE);
  console.log("BACKEND_ROLE admin:", adminRole);
  console.log("DEFAULT_ADMIN_ROLE:", ethers.ZeroHash);
  console.log("Match:", adminRole === ethers.ZeroHash);

  const [signer] = await ethers.getSigners();
  console.log("\nAccount:", signer.address);

  const hasAdmin = await accessControl.hasRole(ethers.ZeroHash, signer.address);
  console.log("Has DEFAULT_ADMIN_ROLE:", hasAdmin);

  const hasBackend = await accessControl.hasRole(BACKEND_ROLE, signer.address);
  console.log("Has BACKEND_ROLE:", hasBackend);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
