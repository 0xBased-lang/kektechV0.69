const { ethers } = require("hardhat");

const CONFIG = {
  versionedRegistryAddress: "0x67F8F023f6cFAe44353d797D6e0B157F2579301A",
  gasPrice: 9,
  gasLimit: 500000,
};

async function main() {
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║      TEST: Try with address(0) bonding curve               ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  const [deployer] = await ethers.getSigners();

  // Get factory from registry
  const VersionedRegistry = await ethers.getContractAt(
    "VersionedRegistry",
    CONFIG.versionedRegistryAddress
  );

  const factoryAddress = await VersionedRegistry.getContract(
    ethers.id("FlexibleMarketFactoryUnified")
  );

  console.log("📍 Factory:", factoryAddress);

  const Factory = await ethers.getContractAt(
    "FlexibleMarketFactoryUnified",
    factoryAddress
  );

  // Market config
  const marketConfig = {
    question: "Test without curve?",
    description: "Testing address(0) for bonding curve",
    resolutionTime: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
    creatorBond: ethers.parseEther("0.1"),
    category: ethers.id("test"),
    outcome1: "Yes",
    outcome2: "No",
  };

  console.log("\n🧪 Test 1: Call createMarketWithCurve with LMSR\n");
  try {
    const tx1 = await Factory.createMarketWithCurve.staticCall(
      marketConfig,
      0, // LMSR
      ethers.parseEther("100"),
      {
        value: marketConfig.creatorBond,
        gasPrice: CONFIG.gasPrice,
      }
    );
    console.log("✅ SUCCESS with LMSR!");
    console.log("   Result:", tx1);
  } catch (e) {
    console.log("❌ FAILED with LMSR");
    console.log("   Error:", e.reason || e.message.substring(0, 100));
  }

  // Also try basic createMarket (no curve)
  console.log("\n🧪 Test 2: Try createMarket (no curve params)\n");
  try {
    // Check if createMarket function exists
    const abi = Factory.interface.fragments;
    const hasCreateMarket = abi.some(
      (f) => f.name === "createMarket" && f.type === "function"
    );
    if (hasCreateMarket) {
      const tx2 = await Factory.createMarket.staticCall(marketConfig, {
        value: marketConfig.creatorBond,
        gasPrice: CONFIG.gasPrice,
      });
      console.log("✅ SUCCESS with createMarket!");
      console.log("   Result:", tx2);
    } else {
      console.log("ℹ️ createMarket function not found in factory ABI");
    }
  } catch (e) {
    console.log("❌ FAILED with createMarket");
    console.log("   Error:", e.reason || e.message.substring(0, 100));
  }
}

main().catch((error) => {
  console.error("Fatal:", error.message.substring(0, 200));
  process.exitCode = 1;
});
