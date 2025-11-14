const hre = require("hardhat");
const { ethers } = require("hardhat");

/**
 * FORK DEPLOYMENT SCRIPT
 *
 * Purpose: Deploy complete KEKTECH 3.0 system to BasedAI fork for testing
 * Network: forkedBasedAI (localhost:8545 forking BasedAI mainnet)
 *
 * This script deploys:
 * 1. MasterRegistry
 * 2. AccessControlManager
 * 3. ParameterStorage
 * 4. RewardDistributor
 * 5. ResolutionManager
 * 6. FlexibleMarketFactory
 * 7. MarketTemplateRegistry
 * 8. ParimutuelMarket (template)
 *
 * Output: Deployment addresses and verification checklist
 */

async function main() {
    console.log("\n🚀 ========================================");
    console.log("🚀 KEKTECH 3.0 - FORK DEPLOYMENT");
    console.log("🚀 ========================================\n");

    // Get signers
    const [deployer, admin, resolver] = await ethers.getSigners();

    console.log("📋 Deployment Configuration:");
    console.log("   Network:", hre.network.name);
    console.log("   Chain ID:", (await ethers.provider.getNetwork()).chainId);
    console.log("   Deployer:", deployer.address);
    console.log("   Admin:", admin.address);
    console.log("   Resolver:", resolver.address);

    const deployerBalance = await ethers.provider.getBalance(deployer.address);
    console.log("   Deployer Balance:", ethers.formatEther(deployerBalance), "ETH\n");

    const deployedContracts = {};

    try {
        // ========================================
        // STEP 1: Deploy MasterRegistry
        // ========================================
        console.log("📦 [1/8] Deploying MasterRegistry...");
        const MasterRegistry = await ethers.getContractFactory("MasterRegistry");
        const registry = await MasterRegistry.deploy();
        await registry.waitForDeployment();
        deployedContracts.MasterRegistry = await registry.getAddress();
        console.log("   ✅ MasterRegistry:", deployedContracts.MasterRegistry);

        // ========================================
        // STEP 2: Deploy AccessControlManager
        // ========================================
        console.log("\n📦 [2/8] Deploying AccessControlManager...");
        const AccessControlManager = await ethers.getContractFactory("AccessControlManager");
        const accessControl = await AccessControlManager.deploy(registry.target);
        await accessControl.waitForDeployment();
        deployedContracts.AccessControlManager = await accessControl.getAddress();
        console.log("   ✅ AccessControlManager:", deployedContracts.AccessControlManager);

        // Register in MasterRegistry
        await registry.setContract(
            ethers.keccak256(ethers.toUtf8Bytes("AccessControlManager")),
            accessControl.target
        );
        console.log("   ✅ Registered in MasterRegistry");

        // ========================================
        // STEP 3: Deploy ParameterStorage
        // ========================================
        console.log("\n📦 [3/8] Deploying ParameterStorage...");
        const ParameterStorage = await ethers.getContractFactory("ParameterStorage");
        const paramStorage = await ParameterStorage.deploy(registry.target);
        await paramStorage.waitForDeployment();
        deployedContracts.ParameterStorage = await paramStorage.getAddress();
        console.log("   ✅ ParameterStorage:", deployedContracts.ParameterStorage);

        await registry.setContract(
            ethers.keccak256(ethers.toUtf8Bytes("ParameterStorage")),
            paramStorage.target
        );
        console.log("   ✅ Registered in MasterRegistry");

        // ========================================
        // STEP 4: Deploy RewardDistributor
        // ========================================
        console.log("\n📦 [4/8] Deploying RewardDistributor...");
        const RewardDistributor = await ethers.getContractFactory("RewardDistributor");
        const rewardDistributor = await RewardDistributor.deploy(registry.target);
        await rewardDistributor.waitForDeployment();
        deployedContracts.RewardDistributor = await rewardDistributor.getAddress();
        console.log("   ✅ RewardDistributor:", deployedContracts.RewardDistributor);

        await registry.setContract(
            ethers.keccak256(ethers.toUtf8Bytes("RewardDistributor")),
            rewardDistributor.target
        );
        console.log("   ✅ Registered in MasterRegistry");

        // ========================================
        // STEP 5: Deploy ResolutionManager
        // ========================================
        console.log("\n📦 [5/8] Deploying ResolutionManager...");
        const disputeWindow = 7 * 24 * 60 * 60; // 7 days
        const minDisputeBond = ethers.parseEther("0.1"); // 0.1 ETH

        const ResolutionManager = await ethers.getContractFactory("ResolutionManager");
        const resolutionManager = await ResolutionManager.deploy(
            registry.target,
            disputeWindow,
            minDisputeBond
        );
        await resolutionManager.waitForDeployment();
        deployedContracts.ResolutionManager = await resolutionManager.getAddress();
        console.log("   ✅ ResolutionManager:", deployedContracts.ResolutionManager);

        await registry.setContract(
            ethers.keccak256(ethers.toUtf8Bytes("ResolutionManager")),
            resolutionManager.target
        );
        console.log("   ✅ Registered in MasterRegistry");

        // ========================================
        // STEP 6: Deploy FlexibleMarketFactory
        // ========================================
        console.log("\n📦 [6/8] Deploying FlexibleMarketFactory...");
        const minBond = ethers.parseEther("0.01"); // 0.01 ETH

        const FlexibleMarketFactory = await ethers.getContractFactory("FlexibleMarketFactory");
        const factory = await FlexibleMarketFactory.deploy(registry.target, minBond);
        await factory.waitForDeployment();
        deployedContracts.FlexibleMarketFactory = await factory.getAddress();
        console.log("   ✅ FlexibleMarketFactory:", deployedContracts.FlexibleMarketFactory);

        await registry.setContract(
            ethers.keccak256(ethers.toUtf8Bytes("FlexibleMarketFactory")),
            factory.target
        );
        console.log("   ✅ Registered in MasterRegistry");

        // ========================================
        // STEP 7: Deploy MarketTemplateRegistry
        // ========================================
        console.log("\n📦 [7/8] Deploying MarketTemplateRegistry...");
        const MarketTemplateRegistry = await ethers.getContractFactory("MarketTemplateRegistry");
        const templateRegistry = await MarketTemplateRegistry.deploy(registry.target);
        await templateRegistry.waitForDeployment();
        deployedContracts.MarketTemplateRegistry = await templateRegistry.getAddress();
        console.log("   ✅ MarketTemplateRegistry:", deployedContracts.MarketTemplateRegistry);

        await registry.setContract(
            ethers.keccak256(ethers.toUtf8Bytes("MarketTemplateRegistry")),
            templateRegistry.target
        );
        console.log("   ✅ Registered in MasterRegistry");

        // ========================================
        // STEP 8: Deploy ParimutuelMarket Template
        // ========================================
        console.log("\n📦 [8/8] Deploying ParimutuelMarket Template...");
        const ParimutuelMarket = await ethers.getContractFactory("ParimutuelMarket");
        const marketTemplate = await ParimutuelMarket.deploy();
        await marketTemplate.waitForDeployment();
        deployedContracts.ParimutuelMarket = await marketTemplate.getAddress();
        console.log("   ✅ ParimutuelMarket Template:", deployedContracts.ParimutuelMarket);

        // ========================================
        // SETUP ROLES (BEFORE TEMPLATE REGISTRATION)
        // ========================================
        console.log("\n🔐 Setting up roles...");

        const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
        const RESOLVER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("RESOLVER_ROLE"));

        // Grant deployer admin role temporarily for template registration
        await accessControl.grantRole(ADMIN_ROLE, deployer.address);
        console.log("   ✅ Granted ADMIN_ROLE to deployer (temporary):", deployer.address);

        await accessControl.grantRole(ADMIN_ROLE, admin.address);
        console.log("   ✅ Granted ADMIN_ROLE to:", admin.address);

        await accessControl.grantRole(RESOLVER_ROLE, resolver.address);
        console.log("   ✅ Granted RESOLVER_ROLE to:", resolver.address);

        // Register template (now deployer has admin role)
        const templateId = ethers.keccak256(ethers.toUtf8Bytes("PARIMUTUEL_V1"));
        await templateRegistry.registerTemplate(templateId, marketTemplate.target);
        console.log("\n   ✅ Template registered with ID:", templateId);

        // ========================================
        // DEPLOYMENT SUMMARY
        // ========================================
        console.log("\n✅ ========================================");
        console.log("✅ DEPLOYMENT COMPLETE!");
        console.log("✅ ========================================\n");

        console.log("📋 Deployed Contracts:");
        for (const [name, address] of Object.entries(deployedContracts)) {
            console.log(`   ${name.padEnd(30)} ${address}`);
        }

        console.log("\n👥 Roles:");
        console.log(`   Deployer: ${deployer.address}`);
        console.log(`   Admin:    ${admin.address}`);
        console.log(`   Resolver: ${resolver.address}`);

        console.log("\n🧪 Next Steps:");
        console.log("   1. Run fork tests: npm run test:fork");
        console.log("   2. Or manual testing with scripts/test/fork-manual-test.js");
        console.log("   3. Verify all security fixes work correctly\n");

        // Save deployment addresses
        const fs = require('fs');
        const deploymentData = {
            network: hre.network.name,
            chainId: (await ethers.provider.getNetwork()).chainId.toString(),
            timestamp: new Date().toISOString(),
            deployer: deployer.address,
            admin: admin.address,
            resolver: resolver.address,
            contracts: deployedContracts
        };

        fs.writeFileSync(
            'fork-deployment.json',
            JSON.stringify(deploymentData, null, 2)
        );
        console.log("💾 Deployment data saved to: fork-deployment.json\n");

    } catch (error) {
        console.error("\n❌ DEPLOYMENT FAILED!");
        console.error("Error:", error.message);
        console.error("\nStack:", error.stack);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
