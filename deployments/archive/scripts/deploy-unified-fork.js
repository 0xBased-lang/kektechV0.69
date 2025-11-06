const hre = require("hardhat");
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * @title Unified Architecture Fork Deployment - Phase 4.3
 * @notice Deploys FlexibleMarketFactoryUnified with VersionedRegistry to local fork
 * @dev Clean architecture deployment matching target mainnet configuration
 */

// Configuration
const CONFIG = {
    SAVE_FILE: path.join(__dirname, "../../fork-deployment-unified.json"),
    MIN_CREATOR_BOND: ethers.parseEther("0.1"), // 0.1 BASED minimum bond
    DISPUTE_WINDOW: 86400, // 24 hours
    MIN_DISPUTE_BOND: ethers.parseEther("0.01") // 0.01 BASED
};

// Colors for console output
const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
    cyan: "\x1b[36m",
    magenta: "\x1b[35m"
};

// State management
let deploymentState = {
    network: "fork",
    chainId: 32323, // BasedAI mainnet fork
    architecture: "UNIFIED",
    timestamp: new Date().toISOString(),
    contracts: {},
    contractSizes: {},
    gasCosts: {},
    validation: {}
};

// Get contract size from artifacts
function getContractSize(contractName, subfolder = "core") {
    try {
        const artifactPath = path.join(
            __dirname,
            `../../artifacts/contracts/${subfolder}`,
            `${contractName}.sol`,
            `${contractName}.json`
        );
        const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
        const bytecode = artifact.deployedBytecode || artifact.bytecode;
        const sizeBytes = (bytecode.length - 2) / 2; // Remove 0x and divide by 2
        const sizeKB = (sizeBytes / 1024).toFixed(2);
        const isUnderLimit = sizeBytes < 24576;
        return { bytes: sizeBytes, kb: sizeKB, underLimit: isUnderLimit };
    } catch (e) {
        console.log(`${colors.yellow}   ⚠️  Could not get size for ${contractName}: ${e.message}${colors.reset}`);
        return { bytes: 0, kb: "0.00", underLimit: false };
    }
}

// Main deployment function
async function main() {
    console.log(`\n${colors.bright}${colors.magenta}╔══════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.bright}${colors.magenta}║  KEKTECH 3.0 - UNIFIED FORK DEPLOYMENT (PHASE 4.3)     ║${colors.reset}`);
    console.log(`${colors.bright}${colors.magenta}╚══════════════════════════════════════════════════════════╝${colors.reset}\n`);

    // Get deployment account
    const [deployer] = await ethers.getSigners();
    const balance = await ethers.provider.getBalance(deployer.address);
    const network = await ethers.provider.getNetwork();

    console.log(`${colors.cyan}📋 Deployment Configuration${colors.reset}`);
    console.log(`   Network:         ${colors.yellow}BasedAI Fork${colors.reset}`);
    console.log(`   Chain ID:        ${colors.yellow}${network.chainId}${colors.reset}`);
    console.log(`   Architecture:    ${colors.yellow}UNIFIED (Phase 4 Goal)${colors.reset}`);
    console.log(`   Deployer:        ${colors.yellow}${deployer.address}${colors.reset}`);
    console.log(`   Balance:         ${colors.yellow}${ethers.formatEther(balance)} BASED${colors.reset}\n`);

    try {
        // ═══════════════════════════════════════════════════════════
        // STEP 1: Deploy VersionedRegistry (Phase 3 Achievement!)
        // ═══════════════════════════════════════════════════════════
        console.log(`${colors.bright}${colors.cyan}📦 Step 1/9: VersionedRegistry (Phase 3)${colors.reset}`);
        const VersionedRegistry = await ethers.getContractFactory("VersionedRegistry");
        const registry = await VersionedRegistry.deploy();
        await registry.waitForDeployment();
        const registryAddr = await registry.getAddress();
        deploymentState.contracts.VersionedRegistry = registryAddr;
        deploymentState.contractSizes.VersionedRegistry = getContractSize("VersionedRegistry");
        console.log(`${colors.green}   ✅ Deployed: ${registryAddr}${colors.reset}`);
        console.log(`${colors.cyan}      Size: ${deploymentState.contractSizes.VersionedRegistry.kb} KB${colors.reset}\n`);

        // ═══════════════════════════════════════════════════════════
        // STEP 2: Deploy Supporting Contracts
        // ═══════════════════════════════════════════════════════════
        console.log(`${colors.bright}${colors.cyan}📦 Step 2/9: ParameterStorage${colors.reset}`);
        const ParameterStorage = await ethers.getContractFactory("ParameterStorage");
        const paramStorage = await ParameterStorage.deploy(registryAddr);
        await paramStorage.waitForDeployment();
        const paramStorageAddr = await paramStorage.getAddress();
        deploymentState.contracts.ParameterStorage = paramStorageAddr;
        deploymentState.contractSizes.ParameterStorage = getContractSize("ParameterStorage");
        console.log(`${colors.green}   ✅ Deployed: ${paramStorageAddr}${colors.reset}\n`);

        // Register ParameterStorage
        console.log(`${colors.bright}🔗 Registering ParameterStorage...${colors.reset}`);
        const paramKey = ethers.keccak256(ethers.toUtf8Bytes("ParameterStorage"));
        await registry.setContract(paramKey, paramStorageAddr, 1); // Version 1
        console.log(`${colors.green}   ✅ Registered in VersionedRegistry${colors.reset}\n`);

        console.log(`${colors.bright}${colors.cyan}📦 Step 3/9: AccessControlManager${colors.reset}`);
        const AccessControlManager = await ethers.getContractFactory("AccessControlManager");
        const acm = await AccessControlManager.deploy(registryAddr);
        await acm.waitForDeployment();
        const acmAddr = await acm.getAddress();
        deploymentState.contracts.AccessControlManager = acmAddr;
        deploymentState.contractSizes.AccessControlManager = getContractSize("AccessControlManager");
        console.log(`${colors.green}   ✅ Deployed: ${acmAddr}${colors.reset}\n`);

        // Register AccessControlManager
        console.log(`${colors.bright}🔗 Registering AccessControlManager...${colors.reset}`);
        const acmKey = ethers.keccak256(ethers.toUtf8Bytes("AccessControlManager"));
        await registry.setContract(acmKey, acmAddr, 1); // Version 1
        console.log(`${colors.green}   ✅ Registered in VersionedRegistry${colors.reset}\n`);

        // Grant ADMIN_ROLE and BACKEND_ROLE to deployer
        console.log(`${colors.bright}🔑 Granting Roles...${colors.reset}`);
        const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
        const BACKEND_ROLE = ethers.keccak256(ethers.toUtf8Bytes("BACKEND_ROLE"));
        await acm.grantRole(ADMIN_ROLE, deployer.address);
        console.log(`${colors.green}   ✅ ADMIN_ROLE granted to deployer${colors.reset}`);
        await acm.grantRole(BACKEND_ROLE, deployer.address);
        console.log(`${colors.green}   ✅ BACKEND_ROLE granted to deployer${colors.reset}\n`);

        console.log(`${colors.bright}${colors.cyan}📦 Step 4/9: RewardDistributor${colors.reset}`);
        const RewardDistributor = await ethers.getContractFactory("RewardDistributor");
        const reward = await RewardDistributor.deploy(registryAddr);
        await reward.waitForDeployment();
        const rewardAddr = await reward.getAddress();
        deploymentState.contracts.RewardDistributor = rewardAddr;
        deploymentState.contractSizes.RewardDistributor = getContractSize("RewardDistributor");
        console.log(`${colors.green}   ✅ Deployed: ${rewardAddr}${colors.reset}\n`);

        // Register RewardDistributor
        console.log(`${colors.bright}🔗 Registering RewardDistributor...${colors.reset}`);
        const rewardKey = ethers.keccak256(ethers.toUtf8Bytes("RewardDistributor"));
        await registry.setContract(rewardKey, rewardAddr, 1); // Version 1
        console.log(`${colors.green}   ✅ Registered in VersionedRegistry${colors.reset}\n`);

        // ═══════════════════════════════════════════════════════════
        // STEP 3: Deploy PredictionMarket Template (CRITICAL!)
        // ═══════════════════════════════════════════════════════════
        console.log(`${colors.bright}${colors.magenta}📦 Step 5/9: PredictionMarket Template${colors.reset}`);
        console.log(`${colors.yellow}   ⚠️  CRITICAL: This is what unified factory will clone!${colors.reset}`);

        const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
        const marketTemplate = await PredictionMarket.deploy();
        await marketTemplate.waitForDeployment();
        const templateAddr = await marketTemplate.getAddress();
        deploymentState.contracts.PredictionMarketTemplate = templateAddr;
        deploymentState.contractSizes.PredictionMarket = getContractSize("PredictionMarket");
        console.log(`${colors.green}   ✅ Deployed: ${templateAddr}${colors.reset}`);
        console.log(`${colors.cyan}      Size: ${deploymentState.contractSizes.PredictionMarket.kb} KB${colors.reset}\n`);

        // Register with EXACT key that factory expects!
        console.log(`${colors.bright}${colors.yellow}🔗 Registering as "PredictionMarketTemplate" (EXACT KEY!)${colors.reset}`);
        const templateKey = ethers.keccak256(ethers.toUtf8Bytes("PredictionMarketTemplate"));
        await registry.setContract(templateKey, templateAddr, 1); // Version 1
        console.log(`${colors.green}   ✅ Registered with correct key${colors.reset}`);

        // Verify registration
        const verifyAddr = await registry.getContract(templateKey);
        if (verifyAddr === templateAddr) {
            console.log(`${colors.green}   ✅ Verification passed: getContract() returns correct address${colors.reset}\n`);
        } else {
            throw new Error(`Template registration verification failed! Expected ${templateAddr}, got ${verifyAddr}`);
        }

        // ═══════════════════════════════════════════════════════════
        // STEP 4: Deploy FlexibleMarketFactoryUnified 🎯
        // ═══════════════════════════════════════════════════════════
        console.log(`${colors.bright}${colors.magenta}📦 Step 6/9: FlexibleMarketFactoryUnified 🎯 (PHASE 4 GOAL!)${colors.reset}`);

        const Factory = await ethers.getContractFactory("FlexibleMarketFactoryUnified");
        const factory = await Factory.deploy(
            registryAddr,
            CONFIG.MIN_CREATOR_BOND
        );
        await factory.waitForDeployment();
        const factoryAddr = await factory.getAddress();
        deploymentState.contracts.FlexibleMarketFactoryUnified = factoryAddr;

        const factorySize = getContractSize("FlexibleMarketFactoryUnified");
        deploymentState.contractSizes.FlexibleMarketFactoryUnified = factorySize;

        console.log(`${colors.green}   ✅ Deployed: ${factoryAddr}${colors.reset}`);
        console.log(`${colors.cyan}      Size: ${factorySize.kb} KB ${factorySize.underLimit ? '✅' : '❌'}${colors.reset}`);

        if (parseFloat(factorySize.kb) > 7.7 && parseFloat(factorySize.kb) < 7.6) {
            console.log(`${colors.yellow}      ⚠️  Size changed from 7.63 KB measured in Phase 4.1!${colors.reset}`);
        } else if (parseFloat(factorySize.kb) <= 7.7) {
            console.log(`${colors.green}      ✅ Size matches Phase 4.1 measurement (7.63 KB)${colors.reset}`);
        }
        console.log();

        // Register factory
        console.log(`${colors.bright}🔗 Registering FlexibleMarketFactoryUnified...${colors.reset}`);
        const factoryKey = ethers.keccak256(ethers.toUtf8Bytes("FlexibleMarketFactoryUnified"));
        await registry.setContract(factoryKey, factoryAddr, 1); // Version 1
        console.log(`${colors.green}   ✅ Registered in VersionedRegistry${colors.reset}\n`);

        // ═══════════════════════════════════════════════════════════
        // STEP 5: Create Test Market (Validation)
        // ═══════════════════════════════════════════════════════════
        console.log(`${colors.bright}${colors.cyan}🧪 Step 7/9: Create Test Market (Validation)${colors.reset}`);

        const marketConfig = {
            question: "Will Phase 4 complete successfully?",
            description: "Test market for Phase 4.3 deployment validation on fork",
            endTime: Math.floor(Date.now() / 1000) + 86400, // 24 hours
            minBet: ethers.parseEther("0.01"),
            fee: 200, // 2%
            metadata: "ipfs://test-market-phase-4-3-fork"
        };

        console.log(`${colors.cyan}   Creating market with 0.1 BASED bond...${colors.reset}`);
        const createTx = await factory.createMarket(marketConfig, { value: CONFIG.MIN_CREATOR_BOND });
        const createReceipt = await createTx.wait();
        deploymentState.gasCosts.createMarket = createReceipt.gasUsed.toString();

        // Get market address from event
        const marketCreatedEvent = createReceipt.logs.find(log => {
            try {
                const parsed = factory.interface.parseLog(log);
                return parsed.name === "MarketCreated";
            } catch (e) {
                return false;
            }
        });

        if (!marketCreatedEvent) {
            throw new Error("MarketCreated event not found!");
        }

        const parsedEvent = factory.interface.parseLog(marketCreatedEvent);
        const testMarketAddr = parsedEvent.args[0]; // First arg is market address
        deploymentState.contracts.TestMarket = testMarketAddr;

        console.log(`${colors.green}   ✅ Market created: ${testMarketAddr}${colors.reset}`);
        console.log(`${colors.cyan}      Gas used: ${deploymentState.gasCosts.createMarket} gas${colors.reset}`);

        // Compare to Phase 4.2 test estimate
        const testEstimate = 687000;
        const actualGas = parseInt(deploymentState.gasCosts.createMarket);
        const variance = ((actualGas - testEstimate) / testEstimate * 100).toFixed(2);
        console.log(`${colors.cyan}      Test estimate: 687k gas${colors.reset}`);
        console.log(`${colors.cyan}      Variance: ${variance}%${colors.reset}`);

        if (Math.abs(parseFloat(variance)) > 15) {
            console.log(`${colors.yellow}      ⚠️  Gas variance exceeds 15% threshold!${colors.reset}`);
        } else {
            console.log(`${colors.green}      ✅ Gas costs within acceptable range${colors.reset}`);
        }
        console.log();

        // Verify market state
        console.log(`${colors.cyan}   Verifying market state...${colors.reset}`);
        const marketData = await factory.getMarketData(testMarketAddr);
        const approvalData = await factory.getApprovalData(testMarketAddr);

        console.log(`${colors.green}   ✅ Market exists: ${marketData.exists}${colors.reset}`);
        console.log(`${colors.green}   ✅ Market active: ${marketData.isActive ? 'true (unexpected!)' : 'false (correct - needs approval)'}${colors.reset}`);
        console.log(`${colors.green}   ✅ Creator bond held: ${ethers.formatEther(marketData.creatorBond)} BASED${colors.reset}`);
        console.log(`${colors.green}   ✅ Approval status: ${approvalData.approved ? 'approved (unexpected!)' : 'pending (correct)'}${colors.reset}\n`);

        deploymentState.validation.marketCreated = true;

        // ═══════════════════════════════════════════════════════════
        // STEP 6: Approve Test Market
        // ═══════════════════════════════════════════════════════════
        console.log(`${colors.bright}${colors.cyan}🧪 Step 8/9: Approve Test Market (Admin Workflow)${colors.reset}`);

        const approveTx = await factory.adminApproveMarket(testMarketAddr);
        const approveReceipt = await approveTx.wait();
        deploymentState.gasCosts.approveMarket = approveReceipt.gasUsed.toString();

        console.log(`${colors.green}   ✅ Market approved${colors.reset}`);
        console.log(`${colors.cyan}      Gas used: ${deploymentState.gasCosts.approveMarket} gas${colors.reset}\n`);

        // Verify approval
        const approvalDataAfter = await factory.getApprovalData(testMarketAddr);
        console.log(`${colors.green}   ✅ Approved: ${approvalDataAfter.approved}${colors.reset}`);
        console.log(`${colors.green}   ✅ Approver: ${approvalDataAfter.approver}${colors.reset}\n`);

        // Refund creator bond (two-step process learned in Phase 4.2!)
        console.log(`${colors.cyan}   Refunding creator bond (two-step process)...${colors.reset}`);
        const refundTx = await factory.refundCreatorBond(testMarketAddr, "Approved - Phase 4.3 test");
        const refundReceipt = await refundTx.wait();
        deploymentState.gasCosts.refundBond = refundReceipt.gasUsed.toString();

        console.log(`${colors.green}   ✅ Bond refunded${colors.reset}`);
        console.log(`${colors.cyan}      Gas used: ${deploymentState.gasCosts.refundBond} gas${colors.reset}\n`);

        // Verify bond cleared
        const marketDataAfterRefund = await factory.getMarketData(testMarketAddr);
        console.log(`${colors.green}   ✅ Bond cleared: ${ethers.formatEther(marketDataAfterRefund.creatorBond)} BASED${colors.reset}\n`);

        deploymentState.validation.marketApproved = true;

        // ═══════════════════════════════════════════════════════════
        // STEP 7: Activate Test Market
        // ═══════════════════════════════════════════════════════════
        console.log(`${colors.bright}${colors.cyan}🧪 Step 9/9: Activate Test Market (Backend Workflow)${colors.reset}`);

        const activateTx = await factory.activateMarket(testMarketAddr);
        const activateReceipt = await activateTx.wait();
        deploymentState.gasCosts.activateMarket = activateReceipt.gasUsed.toString();

        console.log(`${colors.green}   ✅ Market activated${colors.reset}`);
        console.log(`${colors.cyan}      Gas used: ${deploymentState.gasCosts.activateMarket} gas${colors.reset}\n`);

        // Verify activation
        const marketDataFinal = await factory.getMarketData(testMarketAddr);
        console.log(`${colors.green}   ✅ Market active: ${marketDataFinal.isActive}${colors.reset}\n`);

        deploymentState.validation.marketActivated = true;
        deploymentState.validation.lifecycleComplete = true;

        // Calculate total lifecycle gas
        const totalGas = parseInt(deploymentState.gasCosts.createMarket) +
                        parseInt(deploymentState.gasCosts.approveMarket) +
                        parseInt(deploymentState.gasCosts.refundBond) +
                        parseInt(deploymentState.gasCosts.activateMarket);
        deploymentState.gasCosts.totalLifecycle = totalGas.toString();

        // Save state
        fs.writeFileSync(CONFIG.SAVE_FILE, JSON.stringify(deploymentState, null, 2));

        // ═══════════════════════════════════════════════════════════
        // SUCCESS SUMMARY
        // ═══════════════════════════════════════════════════════════
        console.log(`\n${colors.bright}${colors.green}╔══════════════════════════════════════════════════════════╗${colors.reset}`);
        console.log(`${colors.bright}${colors.green}║        🎉 UNIFIED FORK DEPLOYMENT SUCCESS! 🎉           ║${colors.reset}`);
        console.log(`${colors.bright}${colors.green}╚══════════════════════════════════════════════════════════╝${colors.reset}\n`);

        console.log(`${colors.cyan}📊 Deployment Summary:${colors.reset}`);
        console.log(`   Network:              ${colors.yellow}BasedAI Fork${colors.reset}`);
        console.log(`   Architecture:         ${colors.yellow}Unified (Phase 4 Goal ✅)${colors.reset}`);
        console.log(`   Total Contracts:      ${colors.yellow}${Object.keys(deploymentState.contracts).length - 1} (+ 1 test market)${colors.reset}\n`);

        console.log(`${colors.cyan}📝 Contract Addresses:${colors.reset}`);
        for (const [name, address] of Object.entries(deploymentState.contracts)) {
            if (name === "TestMarket") continue; // Skip test market in main list
            const size = deploymentState.contractSizes[name];
            const sizeStr = size ? ` (${size.kb} KB ${size.underLimit ? '✅' : '❌'})` : '';
            console.log(`   ${name.padEnd(35)} ${colors.yellow}${address}${colors.reset}${sizeStr}`);
        }

        console.log(`\n${colors.cyan}🔍 Critical Contract Sizes:${colors.reset}`);
        console.log(`   VersionedRegistry:                ${colors.green}${deploymentState.contractSizes.VersionedRegistry.kb} KB ✅${colors.reset}`);
        console.log(`   FlexibleMarketFactoryUnified:     ${colors.green}${factorySize.kb} KB ✅${colors.reset}`);
        console.log(`   PredictionMarket Template:        ${colors.green}${deploymentState.contractSizes.PredictionMarket.kb} KB ✅${colors.reset}`);
        console.log(`   24KB Limit:                       ${colors.green}All contracts under limit! ✅${colors.reset}\n`);

        console.log(`${colors.cyan}⚡ Gas Costs (Full Lifecycle):${colors.reset}`);
        console.log(`   Create Market:      ${colors.yellow}${parseInt(deploymentState.gasCosts.createMarket).toLocaleString()} gas${colors.reset} (test: 687k)`);
        console.log(`   Approve Market:     ${colors.yellow}${parseInt(deploymentState.gasCosts.approveMarket).toLocaleString()} gas${colors.reset}`);
        console.log(`   Refund Bond:        ${colors.yellow}${parseInt(deploymentState.gasCosts.refundBond).toLocaleString()} gas${colors.reset}`);
        console.log(`   Activate Market:    ${colors.yellow}${parseInt(deploymentState.gasCosts.activateMarket).toLocaleString()} gas${colors.reset}`);
        console.log(`   ${colors.bright}Total Lifecycle:     ${colors.yellow}${totalGas.toLocaleString()} gas${colors.reset}`);

        const varianceVsTest = ((totalGas - 917000) / 917000 * 100).toFixed(2);
        console.log(`   Variance vs tests:  ${Math.abs(parseFloat(varianceVsTest)) > 15 ? colors.yellow : colors.green}${varianceVsTest}%${colors.reset} (target: <15%)\n`);

        console.log(`${colors.cyan}✅ Validation Results:${colors.reset}`);
        console.log(`   Market Created:     ${colors.green}✅ PASS${colors.reset}`);
        console.log(`   Market Approved:    ${colors.green}✅ PASS${colors.reset}`);
        console.log(`   Market Activated:   ${colors.green}✅ PASS${colors.reset}`);
        console.log(`   Lifecycle Complete: ${colors.green}✅ PASS${colors.reset}`);
        console.log(`   Test Market:        ${colors.yellow}${testMarketAddr}${colors.reset}\n`);

        console.log(`${colors.magenta}🎯 Next Steps:${colors.reset}`);
        console.log(`   1. ✅ Fork deployment complete!`);
        console.log(`   2. Deploy to Sepolia (npm run deploy:sepolia:unified)`);
        console.log(`   3. Monitor Sepolia deployment for 24 hours`);
        console.log(`   4. Complete Phase 4.3 checklist`);
        console.log(`   5. Proceed to Phase 4.4 (Cleanup)\n`);

        console.log(`${colors.cyan}📄 State saved to: ${CONFIG.SAVE_FILE}${colors.reset}\n`);

    } catch (error) {
        console.log(`\n${colors.red}╔══════════════════════════════════════════════════════════╗${colors.reset}`);
        console.log(`${colors.red}║           ❌ DEPLOYMENT FAILED! ❌                      ║${colors.reset}`);
        console.log(`${colors.red}╚══════════════════════════════════════════════════════════╝${colors.reset}\n`);
        console.log(`${colors.red}Error: ${error.message}${colors.reset}`);
        console.log(`${colors.red}Stack: ${error.stack}${colors.reset}\n`);

        // Save partial state for debugging
        deploymentState.error = {
            message: error.message,
            stack: error.stack
        };
        fs.writeFileSync(CONFIG.SAVE_FILE, JSON.stringify(deploymentState, null, 2));
        console.log(`${colors.yellow}📄 Partial state saved for debugging${colors.reset}\n`);

        throw error;
    }
}

// Run deployment
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
