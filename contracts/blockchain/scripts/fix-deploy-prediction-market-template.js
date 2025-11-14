const { ethers } = require("hardhat");

const CONFIG = {
  versionedRegistryAddress: "0x67F8F023f6cFAe44353d797D6e0B157F2579301A",
  oldTemplateAddress: "0x1064f1FCeE5aA859468559eB9dC9564F0ef20111",
  gasPrice: 9,
};

async function main() {
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║  FIX: Deploy Fixed PredictionMarket Template (with _disableInitializers)");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  const [deployer] = await ethers.getSigners();
  console.log("📍 Deployer:", deployer.address);

  // Deploy fixed PredictionMarket template
  console.log("\n🔄 Deploying fixed PredictionMarket template...");
  const PredictionMarket = await ethers.getContractFactory("PredictionMarket");

  const template = await PredictionMarket.deploy({
    gasPrice: CONFIG.gasPrice,
  });

  console.log("⏳ Waiting for deployment...");
  await template.waitForDeployment();
  const newTemplateAddress = await template.getAddress();

  console.log("\n✅ FIXED TEMPLATE DEPLOYED!");
  console.log("   Old Template:", CONFIG.oldTemplateAddress);
  console.log("   New Template:", newTemplateAddress);
  console.log("   Fix: Added _disableInitializers() in constructor");

  // Update VersionedRegistry
  console.log("\n🔄 Updating VersionedRegistry...");
  const VersionedRegistry = await ethers.getContractAt(
    "VersionedRegistry",
    CONFIG.versionedRegistryAddress
  );

  const templateId = ethers.id("PredictionMarketTemplate");
  const updateTx = await VersionedRegistry.setContract(
    templateId,
    newTemplateAddress,
    2, // version 2
    {
      gasPrice: CONFIG.gasPrice,
    }
  );

  console.log("⏳ Waiting for registry update...");
  const receipt = await updateTx.wait(1);

  console.log("\n✅ REGISTRY UPDATED!");
  console.log("   Tx Hash:", receipt.hash);
  console.log("   Block:", receipt.blockNumber);

  // Verify
  console.log("\n🔍 Verifying update...");
  const registeredTemplate = await VersionedRegistry.getContract(templateId);
  console.log("   Registered Template:", registeredTemplate);
  console.log("   Match:", registeredTemplate.toLowerCase() === newTemplateAddress.toLowerCase() ? "✅ YES" : "❌ NO");

  console.log("\n" + "=".repeat(60));
  console.log("🎉 FIX COMPLETE!");
  console.log("=".repeat(60));
  console.log("\nNow market creation should work!");
  console.log("The PredictionMarket template is now locked from initialization");
  console.log("and only clones can be initialized.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
