const { ethers } = require("hardhat");

async function main() {
  console.log("\n🔧 Fixing failed ADMIN_ROLE grant...\n");
  
  const [deployer] = await ethers.getSigners();
  const acmAddress = "0xC0D5ff6DE1548053Bf276e2C9F992838E7843105";
  
  const ACM = await ethers.getContractAt("AccessControlManager", acmAddress);
  
  // Get current gas price and add 50% buffer
  const feeData = await ethers.provider.getFeeData();
  const gasPrice = feeData.gasPrice * 150n / 100n; // 50% higher
  
  console.log("Current gas price:", ethers.formatUnits(feeData.gasPrice, "gwei"), "gwei");
  console.log("Using gas price:", ethers.formatUnits(gasPrice, "gwei"), "gwei\n");
  
  const ADMIN_ROLE = ethers.id("PLATFORM_ADMIN");
  
  console.log("Granting ADMIN_ROLE to:", deployer.address);
  const tx = await ACM.grantRole(ADMIN_ROLE, deployer.address, { gasPrice });
  console.log("Transaction sent:", tx.hash);
  
  const receipt = await tx.wait(2);
  console.log("✅ ADMIN_ROLE granted successfully!");
  console.log("Gas used:", receipt.gasUsed.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
