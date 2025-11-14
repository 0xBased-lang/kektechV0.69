const hre = require("hardhat");
const { ethers } = require("hardhat");

/**
 * SIMPLE TEST: Verify CurveRegistry lookup works
 *
 * This script tests JUST the curve lookup to isolate the issue
 */
async function main() {
    console.log("\n🧪 SIMPLE CURVEREGISTRY LOOKUP TEST\n");
    console.log("=" + "=".repeat(60) + "\n");

    const [deployer] = await ethers.getSigners();
    console.log(`Deployer: ${deployer.address}\n`);

    // ==================== STEP 1: DEPLOY INFRASTRUCTURE ====================
    console.log("📦 STEP 1: Deploying Core Infrastructure...\n");

    console.log("  1.1 Deploying MasterRegistry...");
    const MasterRegistry = await ethers.getContractFactory("MasterRegistry");
    const masterRegistry = await MasterRegistry.deploy();
    await masterRegistry.waitForDeployment();
    const registryAddress = await masterRegistry.getAddress();
    console.log(`  ✅ MasterRegistry: ${registryAddress}\n`);

    console.log("  1.2 Deploying AccessControlManager...");
    const AccessControlManager = await ethers.getContractFactory("AccessControlManager");
    const accessControl = await AccessControlManager.deploy(registryAddress);
    await accessControl.waitForDeployment();
    const accessControlAddress = await accessControl.getAddress();
    console.log(`  ✅ AccessControlManager: ${accessControlAddress}\n`);

    // Register AccessControl in MasterRegistry
    const setAclTx = await masterRegistry.setContract(ethers.id("AccessControlManager"), accessControlAddress);
    await setAclTx.wait();
    console.log(`  ✅ AccessControl registered in MasterRegistry\n`);

    // ==================== STEP 2: DEPLOY CURVEREGISTRY ====================
    console.log("📦 STEP 2: Deploying CurveRegistry...\n");

    console.log("  2.1 Deploying CurveRegistry (with AccessControlManager)...");
    const CurveRegistry = await ethers.getContractFactory("CurveRegistry");
    const curveRegistry = await CurveRegistry.deploy(accessControlAddress);  // ✅ CORRECT: Pass AccessControlManager
    await curveRegistry.waitForDeployment();
    const curveRegistryAddress = await curveRegistry.getAddress();
    console.log(`  ✅ CurveRegistry: ${curveRegistryAddress}\n`);

    // Register CurveRegistry in MasterRegistry
    const setCrTx = await masterRegistry.setContract(ethers.id("CurveRegistry"), curveRegistryAddress);
    await setCrTx.wait();
    console.log(`  ✅ CurveRegistry registered in MasterRegistry\n`);

    // ==================== STEP 3: DEPLOY & REGISTER LMSR ====================
    console.log("📦 STEP 3: Deploying & Registering LMSR...\n");

    console.log("  3.1 Deploying LMSR...");
    const LMSRBondingCurve = await ethers.getContractFactory("LMSRBondingCurve");
    const lmsrCurve = await LMSRBondingCurve.deploy();
    await lmsrCurve.waitForDeployment();
    const lmsrAddress = await lmsrCurve.getAddress();
    console.log(`  ✅ LMSR: ${lmsrAddress}\n`);

    console.log("  3.2 Registering LMSR in CurveRegistry...");
    const registerTx = await curveRegistry.registerCurve(
        lmsrAddress,
        "v1.0.0",
        "Logarithmic Market Scoring Rule",
        "DeFi",
        "",
        []
    );
    await registerTx.wait();
    console.log(`  ✅ LMSR registered\n`);

    // ==================== STEP 4: VERIFY REGISTRATION ====================
    console.log("🔍 STEP 4: Verifying Registration...\n");

    const curveName = await lmsrCurve.curveName();
    console.log(`  Curve name from contract: "${curveName}"`);

    const lookedUpAddress = await curveRegistry.getCurveByName(curveName);
    console.log(`  Looked up address: ${lookedUpAddress}`);

    if (lookedUpAddress.toLowerCase() === lmsrAddress.toLowerCase()) {
        console.log(`  ✅ Lookup SUCCESS! Addresses match!\n`);
    } else {
        console.log(`  ❌ Lookup FAILED! Addresses don't match!`);
        console.log(`     Expected: ${lmsrAddress}`);
        console.log(`     Got:      ${lookedUpAddress}\n`);
        process.exit(1);
    }

    const [isRegistered, isActive] = await curveRegistry.isCurveActive(lookedUpAddress);
    console.log(`  Is registered: ${isRegistered}`);
    console.log(`  Is active: ${isActive}\n`);

    if (!isRegistered || !isActive) {
        console.log(`  ❌ Curve not active!`);
        process.exit(1);
    }

    // ==================== STEP 5: DEPLOY FACTORY ====================
    console.log("📦 STEP 5: Deploying FlexibleMarketFactory...\n");

    console.log("  5.1 Deploying ParameterStorage...");
    const ParameterStorage = await ethers.getContractFactory("ParameterStorage");
    const parameterStorage = await ParameterStorage.deploy(registryAddress);
    await parameterStorage.waitForDeployment();
    const paramStorageAddress = await parameterStorage.getAddress();
    console.log(`  ✅ ParameterStorage: ${paramStorageAddress}\n`);

    // Register ParameterStorage
    const setParamTx = await masterRegistry.setContract(ethers.id("ParameterStorage"), paramStorageAddress);
    await setParamTx.wait();
    console.log(`  ✅ ParameterStorage registered\n`);

    console.log("  5.2 Deploying FlexibleMarketFactory...");
    const minCreatorBond = ethers.parseEther("0.1");
    const FlexibleMarketFactory = await ethers.getContractFactory("FlexibleMarketFactory");
    const factory = await FlexibleMarketFactory.deploy(registryAddress, minCreatorBond);
    await factory.waitForDeployment();
    const factoryAddress = await factory.getAddress();
    console.log(`  ✅ FlexibleMarketFactory: ${factoryAddress}\n`);

    // Register factory
    const setFactoryTx = await masterRegistry.setContract(ethers.id("FlexibleMarketFactory"), factoryAddress);
    await setFactoryTx.wait();
    console.log(`  ✅ Factory registered in MasterRegistry\n`);

    // ==================== STEP 6: VERIFY FACTORY CAN FIND CURVEREGISTRY ====================
    console.log("🔍 STEP 6: Verifying Factory Can Find CurveRegistry...\n");

    const factoryCurveRegistryAddr = await masterRegistry.getContract(ethers.id("CurveRegistry"));
    console.log(`  Factory will look up CurveRegistry address: ${factoryCurveRegistryAddr}`);

    if (factoryCurveRegistryAddr.toLowerCase() === curveRegistryAddress.toLowerCase()) {
        console.log(`  ✅ Factory will find CORRECT CurveRegistry!\n`);
    } else {
        console.log(`  ❌ Factory will find WRONG CurveRegistry!`);
        console.log(`     Expected: ${curveRegistryAddress}`);
        console.log(`     Got:      ${factoryCurveRegistryAddr}\n`);
        process.exit(1);
    }

    // Test lookup through factory's perspective
    const factoryRegistry = CurveRegistry.attach(factoryCurveRegistryAddr);
    const factoryLookup = await factoryRegistry.getCurveByName(curveName);
    console.log(`  Factory perspective lookup: ${factoryLookup}`);

    if (factoryLookup.toLowerCase() === lmsrAddress.toLowerCase()) {
        console.log(`  ✅ Factory perspective lookup SUCCESS!\n`);
    } else {
        console.log(`  ❌ Factory perspective lookup FAILED!\n`);
        process.exit(1);
    }

    // ==================== STEP 7: TRY MARKET CREATION ====================
    console.log("🚀 STEP 7: Attempting Market Creation...\n");

    const resolutionTime = Math.floor(Date.now() / 1000) + 86400; // 24 hours
    const creatorBond = ethers.parseEther("0.1"); // 0.1 BASED bond

    const marketConfig = {
        question: "Will Bitcoin reach $100k by end of 2025?",
        description: "Test market for LMSR curve validation",
        resolutionTime: resolutionTime,
        creatorBond: creatorBond,
        category: ethers.id("Crypto"),  // bytes32
        outcome1: "Yes",
        outcome2: "No"
    };

    const CurveType_LMSR = 0;
    const liquidityInEth = "10.0"; // 10 BASED liquidity
    const curveParams = ethers.parseEther(liquidityInEth);

    console.log(`  Market: "${marketConfig.question}"`);
    console.log(`  Curve: LMSR`);
    console.log(`  Liquidity: ${liquidityInEth} BASED\n`);

    try {
        console.log("  📝 Calling createMarketWithCurve...");
        const createTx = await factory.createMarketWithCurve(
            marketConfig,
            CurveType_LMSR,
            curveParams,
            { value: creatorBond } // Creator bond (must match marketConfig.creatorBond)
        );

        console.log(`  ⏳ Waiting for transaction...`);
        const receipt = await createTx.wait();
        console.log(`  ✅ Market created successfully!`);
        console.log(`     Tx: ${receipt.hash}\n`);

        console.log("\n" + "=".repeat(60));
        console.log("🎉 TEST PASSED! ALL SYSTEMS WORKING! 🎉");
        console.log("=".repeat(60) + "\n");

    } catch (error) {
        console.log(`\n❌ Market creation FAILED!`);
        console.log(`Error: ${error.message}\n`);

        // Try to decode custom error
        if (error.data) {
            console.log(`Error data: ${error.data}`);
        }

        console.log("\n" + "=".repeat(60));
        console.log("❌ TEST FAILED - SEE ERROR ABOVE");
        console.log("=".repeat(60) + "\n");

        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
