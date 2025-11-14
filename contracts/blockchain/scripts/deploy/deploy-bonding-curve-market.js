const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Deploy BondingCurveMarket and integrate with existing KEKTECH 3.0 system
 *
 * This script assumes the core KEKTECH contracts are already deployed:
 * - MasterRegistry
 * - AccessControlManager
 * - ResolutionManager
 * - RewardDistributor
 * - FlexibleMarketFactory
 */

async function main() {
    console.log("\n");
    console.log("═══════════════════════════════════════════════════════════");
    console.log("   BONDING CURVE MARKET DEPLOYMENT - KEKTECH 3.0");
    console.log("═══════════════════════════════════════════════════════════");
    console.log(`   Network: ${network.name}`);
    console.log(`   Chain ID: ${network.config.chainId}`);
    console.log("═══════════════════════════════════════════════════════════");
    console.log("\n");

    // Get deployer
    const [deployer] = await ethers.getSigners();
    console.log("📱 Deployer Address:", deployer.address);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Deployer Balance:", ethers.formatEther(balance), "ETH");
    console.log("\n");

    // ========================================
    // STEP 1: Load Existing Deployment
    // ========================================
    console.log("📂 [1/6] Loading existing deployment...");

    const deploymentFile = path.join(
        __dirname,
        `../../deployments/${network.name}-deployment.json`
    );

    if (!fs.existsSync(deploymentFile)) {
        console.error("❌ No existing deployment found!");
        console.error("   Please run the main deployment script first.");
        process.exit(1);
    }

    const existingDeployment = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
    console.log("   ✅ Loaded deployment from:", deploymentFile);

    // Verify required contracts exist
    const required = [
        'MasterRegistry',
        'AccessControlManager',
        'ResolutionManager',
        'RewardDistributor',
        'FlexibleMarketFactory'
    ];

    for (const contract of required) {
        if (!existingDeployment[contract]) {
            console.error(`❌ Missing required contract: ${contract}`);
            process.exit(1);
        }
        console.log(`   ✅ Found ${contract}:`, existingDeployment[contract]);
    }

    // ========================================
    // STEP 2: Deploy Libraries
    // ========================================
    console.log("\n📚 [2/6] Deploying libraries...");

    // Deploy DualCurveMath
    console.log("   Deploying DualCurveMath...");
    const DualCurveMath = await ethers.getContractFactory("DualCurveMath");
    const dualCurveMath = await DualCurveMath.deploy();
    await dualCurveMath.waitForDeployment();
    const dualCurveMathAddress = await dualCurveMath.getAddress();
    console.log("   ✅ DualCurveMath deployed:", dualCurveMathAddress);

    // Deploy FeeCalculator
    console.log("   Deploying FeeCalculator...");
    const FeeCalculator = await ethers.getContractFactory("FeeCalculator");
    const feeCalculator = await FeeCalculator.deploy();
    await feeCalculator.waitForDeployment();
    const feeCalculatorAddress = await feeCalculator.getAddress();
    console.log("   ✅ FeeCalculator deployed:", feeCalculatorAddress);

    // ========================================
    // STEP 3: Deploy Market Implementation
    // ========================================
    console.log("\n📦 [3/6] Deploying BondingCurveMarket implementation...");

    const BondingCurveMarket = await ethers.getContractFactory(
        "BondingCurveMarketIntegrated",
        {
            libraries: {
                DualCurveMath: dualCurveMathAddress,
                FeeCalculator: feeCalculatorAddress
            }
        }
    );

    const bondingCurveMarket = await BondingCurveMarket.deploy();
    await bondingCurveMarket.waitForDeployment();
    const marketAddress = await bondingCurveMarket.getAddress();
    console.log("   ✅ BondingCurveMarket deployed:", marketAddress);

    // ========================================
    // STEP 4: Register in MarketTemplateRegistry
    // ========================================
    console.log("\n📝 [4/6] Registering market template...");

    // Get registry contract
    const registry = await ethers.getContractAt(
        "MasterRegistry",
        existingDeployment.MasterRegistry
    );

    // Get MarketTemplateRegistry
    let templateRegistryAddress;
    try {
        templateRegistryAddress = await registry.getContract(
            ethers.keccak256(ethers.toUtf8Bytes("MarketTemplateRegistry"))
        );
        console.log("   Found MarketTemplateRegistry:", templateRegistryAddress);
    } catch (error) {
        console.log("   MarketTemplateRegistry not found in registry");
        templateRegistryAddress = existingDeployment.MarketTemplateRegistry;
    }

    if (templateRegistryAddress && templateRegistryAddress !== ethers.ZeroAddress) {
        try {
            const templateRegistry = await ethers.getContractAt(
                "MarketTemplateRegistry",
                templateRegistryAddress
            );

            // Register the bonding curve template
            const templateId = ethers.keccak256(ethers.toUtf8Bytes("BONDING_CURVE"));
            await templateRegistry.registerTemplate(
                templateId,
                marketAddress,
                "Bonding Curve Market",
                "1.0.0",
                true // active
            );
            console.log("   ✅ Registered template with ID:", templateId);
        } catch (error) {
            console.log("   ⚠️ Could not register template:", error.message);
        }
    }

    // ========================================
    // STEP 5: Configure Factory (Optional)
    // ========================================
    console.log("\n🏭 [5/6] Configuring factory...");

    try {
        const factory = await ethers.getContractAt(
            "FlexibleMarketFactory",
            existingDeployment.FlexibleMarketFactory
        );

        // Add bonding curve as allowed market type
        console.log("   Adding BondingCurve to allowed market types...");
        await factory.addMarketType(
            "BONDING_CURVE",
            marketAddress,
            ethers.parseEther("0.01"), // min bond
            500 // max fee (5%)
        );
        console.log("   ✅ Added to factory");
    } catch (error) {
        console.log("   ⚠️ Could not configure factory:", error.message);
    }

    // ========================================
    // STEP 6: Save Deployment Info
    // ========================================
    console.log("\n💾 [6/6] Saving deployment info...");

    // Update deployment file
    existingDeployment.BondingCurveMarket = marketAddress;
    existingDeployment.DualCurveMath = dualCurveMathAddress;
    existingDeployment.FeeCalculator = feeCalculatorAddress;
    existingDeployment.bondingCurveDeploymentBlock = await ethers.provider.getBlockNumber();
    existingDeployment.bondingCurveDeploymentTime = new Date().toISOString();

    // Save updated deployment
    fs.writeFileSync(
        deploymentFile,
        JSON.stringify(existingDeployment, null, 2)
    );
    console.log("   ✅ Updated deployment file");

    // Save ABI files
    const abiDir = path.join(__dirname, `../../deployments/abis`);
    if (!fs.existsSync(abiDir)) {
        fs.mkdirSync(abiDir, { recursive: true });
    }

    // Save BondingCurveMarket ABI
    const marketArtifact = await ethers.getContractFactory("BondingCurveMarketIntegrated");
    fs.writeFileSync(
        path.join(abiDir, "BondingCurveMarket.json"),
        JSON.stringify(marketArtifact.interface.format('json'), null, 2)
    );
    console.log("   ✅ Saved BondingCurveMarket ABI");

    // ========================================
    // DEPLOYMENT SUMMARY
    // ========================================
    console.log("\n");
    console.log("═══════════════════════════════════════════════════════════");
    console.log("   🎉 BONDING CURVE DEPLOYMENT COMPLETE!");
    console.log("═══════════════════════════════════════════════════════════");
    console.log("\n📋 Deployed Contracts:");
    console.log("   DualCurveMath:", dualCurveMathAddress);
    console.log("   FeeCalculator:", feeCalculatorAddress);
    console.log("   BondingCurveMarket:", marketAddress);
    console.log("\n📊 Gas Usage:");
    const receipt = await ethers.provider.getTransactionReceipt(bondingCurveMarket.deploymentTransaction().hash);
    console.log("   Deployment Gas:", receipt.gasUsed.toString());
    console.log("\n📁 Files Created:");
    console.log("   - Updated:", deploymentFile);
    console.log("   - ABI:", path.join(abiDir, "BondingCurveMarket.json"));
    console.log("\n");
    console.log("═══════════════════════════════════════════════════════════");
    console.log("   Next Steps:");
    console.log("   1. Verify contracts on Etherscan");
    console.log("   2. Create test markets");
    console.log("   3. Test resolution flow with ResolutionManager");
    console.log("   4. Monitor gas usage and fees");
    console.log("═══════════════════════════════════════════════════════════");
    console.log("\n");
}

// Execute deployment
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });