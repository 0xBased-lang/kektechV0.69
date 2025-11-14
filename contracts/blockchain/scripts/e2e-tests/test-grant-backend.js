const { ethers } = require("hardhat");

async function main() {
  console.log("\n🧪 Testing BACKEND_ROLE Grant with callStatic...\n");

  const [signer] = await ethers.getSigners();
  console.log("Account:", signer.address);

  const accessControl = await ethers.getContractAt("AccessControlManager", "0x4d1afBb8E50e17F24dCbB4Fc3197537be646315A");
  const BACKEND_ROLE = ethers.keccak256(ethers.toUtf8Bytes("BACKEND_ROLE"));

  try {
    // Try callStatic first to see if it would revert
    console.log("Testing with callStatic...");
    await accessControl.grantRole.staticCall(BACKEND_ROLE, signer.address);
    console.log("✅ callStatic succeeded - transaction should work!");

    // Now try the real transaction
    console.log("\nSending real transaction...");
    const tx = await accessControl.grantRole(BACKEND_ROLE, signer.address, {
      gasLimit: 150000,
      gasPrice: ethers.parseUnits("9", "gwei")
    });

    console.log("TX sent:", tx.hash);
    const receipt = await tx.wait();
    console.log("✅ SUCCESS! Gas used:", receipt.gasUsed.toString());

  } catch (error) {
    console.log("\n❌ ERROR:", error.message);

    // Try to decode the error
    if (error.data) {
      console.log("\nError data:", error.data);
    }

    // Check if it's an access control revert
    if (error.message.includes("AccessControl")) {
      console.log("\n💡 This is an AccessControl error");
      console.log("Checking roles...");

      const hasAdmin = await accessControl.hasRole(ethers.ZeroHash, signer.address);
      console.log("Has DEFAULT_ADMIN_ROLE:", hasAdmin);

      const adminRole = await accessControl.getRoleAdmin(BACKEND_ROLE);
      console.log("BACKEND_ROLE admin:", adminRole);
    }
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
