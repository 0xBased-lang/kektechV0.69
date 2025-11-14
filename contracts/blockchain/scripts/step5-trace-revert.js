const { ethers } = require("hardhat");

const CONFIG = {
  versionedRegistryAddress: "0x67F8F023f6cFAe44353d797D6e0B157F2579301A",
  gasPrice: 9,
};

const CurveType = {
  LMSR: 0,
};

async function main() {
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║      TRACE REVERT REASON WITH STATICCALL                   ║");
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
  console.log("📍 Caller:", deployer.address);

  const Factory = await ethers.getContractAt(
    "FlexibleMarketFactoryUnified",
    factoryAddress
  );

  // Market config
  const marketConfig = {
    question: "Test?",
    description: "Test",
    resolutionTime: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
    creatorBond: ethers.parseEther("0.1"),
    category: ethers.id("test"),
    outcome1: "Yes",
    outcome2: "No",
  };

  const curveType = CurveType.LMSR;
  const curveParams = ethers.parseEther("100");

  console.log("\n🔍 Using staticCall to trace revert...\n");

  try {
    // Use staticCall to see the actual revert reason
    const result = await Factory.createMarketWithCurve.staticCall(
      marketConfig,
      curveType,
      curveParams,
      {
        value: marketConfig.creatorBond,
        gasPrice: CONFIG.gasPrice,
      }
    );

    console.log("✅ staticCall succeeded!");
    console.log("   Result:", result);
  } catch (error) {
    console.log("❌ staticCall reverted!");
    console.log("\nFull Error Object:");
    console.log("   Code:", error.code);
    console.log("   Message:", error.message);

    if (error.reason) {
      console.log("   Reason:", error.reason);
    }

    if (error.data) {
      console.log("   Data:", error.data);
    }

    // Try to decode revert reason
    if (error.revert) {
      console.log("\n   Revert info:");
      console.log("   ", error.revert);
    }

    // Try to parse as error signature
    console.log("\n🔍 Attempting to decode error...");

    const iface = Factory.interface;
    const allErrors = Object.values(iface.errors || {});

    console.log("   Known custom errors in factory ABI:");
    for (const errorFragment of allErrors) {
      console.log("   -", errorFragment.name);
    }

    // Try manual parsing
    if (error.data && error.data !== "0x") {
      console.log("\n   Error data:", error.data);

      // Try to find matching error signature
      const selector = error.data.slice(0, 10);
      console.log("   Error selector:", selector);

      const matchingError = allErrors.find(
        (e) => iface.getSighash(e) === selector
      );
      if (matchingError) {
        console.log("   Matched error:", matchingError.name);
      }
    }
  }

  // Also try to manually encode and call
  console.log("\n🔍 Alternative: Check if factory exists and is readable...\n");

  const codeSize = await ethers.provider.getCode(factoryAddress);
  console.log("   Factory code size:", codeSize.length / 2, "bytes");
  console.log("   Factory exists:", codeSize !== "0x" ? "YES" : "NO");
}

main().catch((error) => {
  console.error("Fatal:", error.message);
  process.exitCode = 1;
});
