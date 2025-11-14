const { ethers } = require("hardhat");

const ACCESS_CONTROL = "0x4d1afBb8E50e17F24dCbB4Fc3197537be646315A";
const CURVE_REGISTRY = "0x0004ED9967F6a2b750a7456C25D29A88A184c2d7";

async function main() {
  console.log("\n🔍 Checking Admin Roles...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const accessControl = await ethers.getContractAt("AccessControlManager", ACCESS_CONTROL);
  
  // Get DEFAULT_ADMIN_ROLE
  const adminRole = await accessControl.DEFAULT_ADMIN_ROLE();
  console.log("\nDEFAULT_ADMIN_ROLE:", adminRole);

  // Check if deployer has admin role
  const hasAdminRole = await accessControl.hasRole(adminRole, deployer.address);
  console.log("Deployer has ADMIN_ROLE:", hasAdminRole ? "✅ YES" : "❌ NO");

  // Check CurveRegistry
  console.log("\n📋 CurveRegistry Access:");
  const curveRegistry = await ethers.getContractAt("CurveRegistry", CURVE_REGISTRY);
  
  // CurveRegistry uses AccessControlManager reference
  const registryAccessControl = await curveRegistry.accessControl();
  console.log("CurveRegistry.accessControl:", registryAccessControl);
  console.log("Matches AccessControlManager:", registryAccessControl === ACCESS_CONTROL ? "✅ YES" : "❌ NO");

  // Check if deployer can register curves
  console.log("\n🔐 Permission Check:");
  console.log("Deployer can register curves:", hasAdminRole ? "✅ YES" : "❌ NO (needs ADMIN_ROLE)");
}

main().then(() => process.exit(0)).catch(error => { console.error(error); process.exit(1); });
