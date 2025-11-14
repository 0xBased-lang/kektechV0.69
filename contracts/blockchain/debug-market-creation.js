const hre = require("hardhat");

async function main() {
  console.log("\n=== Debugging Market Creation Revert ===\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // Get factory address from latest deployment
  const factoryAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Update if needed
  
  const factory = await hre.ethers.getContractAt(
    "FlexibleMarketFactoryUnified",
    factoryAddress
  );

  console.log("\n1. Checking factory state...");
  const paused = await factory.paused();
  const minBond = await factory.minCreatorBond();
  console.log("Factory paused:", paused);
  console.log("Min creator bond:", hre.ethers.formatEther(minBond), "ETH");

  // Market config
  const marketConfig = {
    question: "Will ETH reach $5000 by end of 2024?",
    description: "Market resolves YES if ETH hits $5000, NO otherwise",
    resolutionTime: Math.floor(Date.now() / 1000) + 86400 * 7, // 7 days
    creatorBond: hre.ethers.parseEther("0.01"),
    category: hre.ethers.id("crypto"),
    outcome1: "Yes - ETH reaches $5000",
    outcome2: "No - ETH stays below $5000"
  };

  console.log("\n2. Market config:");
  console.log("Question length:", marketConfig.question.length);
  console.log("Resolution time valid:", marketConfig.resolutionTime > Math.floor(Date.now() / 1000));
  console.log("Category:", marketConfig.category);
  console.log("Creator bond:", hre.ethers.formatEther(marketConfig.creatorBond), "ETH");

  // Check curve type enum (LMSR = 0)
  const curveType = 0; // LMSR
  const curveParams = hre.ethers.parseEther("100"); // b = 100

  console.log("\n3. Attempting to get curve address for type LMSR...");
  
  try {
    // Try to manually trace through what _getCurveAddressForType does
    const registryAddress = await factory.registry();
    console.log("Registry address:", registryAddress);
    
    const registry = await hre.ethers.getContractAt("IVersionedRegistry", registryAddress);
    
    // Try to get CurveRegistry
    const curveRegistryKey = hre.ethers.id("CurveRegistry");
    console.log("Looking up CurveRegistry with key:", curveRegistryKey);
    
    let curveRegistryAddress;
    try {
      curveRegistryAddress = await registry.getContract(curveRegistryKey);
      console.log("CurveRegistry address:", curveRegistryAddress);
    } catch (e) {
      console.log("ERROR: CurveRegistry lookup failed!");
      console.log("Error:", e.message);
      console.log("\n🔴 ROOT CAUSE: CurveRegistry not registered in VersionedRegistry!");
      console.log("\nFIX: Register CurveRegistry in VersionedRegistry first");
      return;
    }

    if (curveRegistryAddress === hre.ethers.ZeroAddress) {
      console.log("\n🔴 ROOT CAUSE: CurveRegistry returns zero address!");
      console.log("CurveRegistry is not properly registered in VersionedRegistry");
      console.log("\nFIX: Deploy and register CurveRegistry in VersionedRegistry");
      return;
    }

    // Try to get LMSR curve from CurveRegistry
    const curveRegistry = await hre.ethers.getContractAt("ICurveRegistry", curveRegistryAddress);
    
    try {
      const lmsrCurveAddress = await curveRegistry.getCurveByName("LMSRCurve");
      console.log("LMSRCurve address:", lmsrCurveAddress);
      
      if (lmsrCurveAddress === hre.ethers.ZeroAddress) {
        console.log("\n🔴 ROOT CAUSE: LMSRCurve not registered in CurveRegistry!");
        console.log("\nFIX: Register LMSRCurve in CurveRegistry");
        return;
      }
    } catch (e) {
      console.log("ERROR: LMSRCurve lookup failed!");
      console.log("Error:", e.message);
      console.log("\n🔴 ROOT CAUSE: CurveRegistry.getCurveByName() reverted!");
      return;
    }

    console.log("\n4. All validations passed, attempting market creation...");

    const tx = await factory.createMarketWithCurve(
      marketConfig,
      curveType,
      curveParams,
      { value: marketConfig.creatorBond }
    );

    console.log("Transaction submitted:", tx.hash);
    const receipt = await tx.wait();
    console.log("✅ Market created successfully!");
    console.log("Gas used:", receipt.gasUsed.toString());

  } catch (error) {
    console.log("\n🔴 Market creation failed!");
    console.log("Error:", error.message);
    
    if (error.message.includes("CurveRegistry not found")) {
      console.log("\n🔴 ROOT CAUSE: CurveRegistry is not registered in VersionedRegistry");
      console.log("\nFIX:");
      console.log("1. Deploy CurveRegistry contract");
      console.log("2. Register it in VersionedRegistry with key: keccak256('CurveRegistry')");
    } else if (error.message.includes("Curve not registered")) {
      console.log("\n🔴 ROOT CAUSE: LMSRCurve is not registered in CurveRegistry");
      console.log("\nFIX:");
      console.log("1. Deploy LMSRCurve contract");
      console.log("2. Register it in CurveRegistry with name: 'LMSRCurve'");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
