const { ethers } = require("hardhat");

const CONFIG = {
  versionedRegistryAddress: "0x67F8F023f6cFAe44353d797D6e0B157F2579301A",
  accessControlAddress: "0x4d1afBb8E50e17F24dCbB4Fc3197537be646315A",
  parameterStorageAddress: "0x0FdcaCE9dEE78c70C92B243346cDf763A06fEdF8",
  resolutionManagerAddress: "0x10daF33E321ED8977e369a36FcC6Beb3d3d106a0",
  rewardDistributorAddress: "0x3D274362423847B53E43a27b9E835d668754C96B",
  marketTemplateRegistryAddress: "0x420687494Dad8da9d058e9399cD401Deca17f6bd",
  oldFactoryAddress: "0x3eaF643482Fe35d13DB812946E14F5345eb60d62",
  gasPrice: 9,
};

async function main() {
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║    STEP 4: DEPLOY FIXED FACTORY WITH CURVE LOOKUP          ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  const [deployer] = await ethers.getSigners();
  console.log("📍 Deployer:", deployer.address);

  // Deploy fixed FlexibleMarketFactoryUnified
  console.log("\n🔄 Deploying fixed FlexibleMarketFactoryUnified...");
  const FlexibleMarketFactoryUnified = await ethers.getContractFactory(
    "FlexibleMarketFactoryUnified"
  );

  const factory = await FlexibleMarketFactoryUnified.deploy(
    CONFIG.versionedRegistryAddress,
    ethers.parseEther("0.1"), // minCreatorBond = 0.1 BASED
    {
      gasPrice: CONFIG.gasPrice,
    }
  );

  console.log("⏳ Waiting for deployment confirmation...");
  await factory.waitForDeployment();
  const newFactoryAddress = await factory.getAddress();

  console.log("\n✅ FIXED FACTORY DEPLOYED!");
  console.log("   Old Factory:", CONFIG.oldFactoryAddress);
  console.log("   New Factory:", newFactoryAddress);
  console.log("   Deployment Tx:", factory.deploymentTransaction().hash);

  // Update VersionedRegistry to point to new factory
  console.log("\n🔄 Updating VersionedRegistry with fixed factory...");
  const VersionedRegistry = await ethers.getContractAt(
    "VersionedRegistry",
    CONFIG.versionedRegistryAddress
  );

  const factoryId = ethers.id("FlexibleMarketFactoryUnified");
  const updateTx = await VersionedRegistry.setContract(
    factoryId,
    newFactoryAddress,
    2, // version 2 (fixed version)
    {
      gasPrice: CONFIG.gasPrice,
    }
  );

  console.log("⏳ Waiting for registry update...");
  const updateReceipt = await updateTx.wait(1);

  console.log("\n✅ REGISTRY UPDATED!");
  console.log("   Tx Hash:", updateReceipt.hash);
  console.log("   Block:", updateReceipt.blockNumber);

  // Verify update
  console.log("\n🔍 Verifying update...");
  const currentFactory = await VersionedRegistry.getContract(factoryId);
  console.log("   Current Factory:", currentFactory);

  if (currentFactory.toLowerCase() === newFactoryAddress.toLowerCase()) {
    console.log("\n✅ SUCCESS! VersionedRegistry points to fixed factory!");
  } else {
    console.log("\n❌ FAILED! Factory not properly registered!");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
