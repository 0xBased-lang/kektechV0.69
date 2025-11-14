const hre = require("hardhat");
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * @title Validate Unified Deployment - Complete Testing
 * @notice Creates test market with correct config and validates full lifecycle
 */

// Configuration
const STATE_FILE = path.join(__dirname, "../fork-deployment-unified.json");

// Colors
const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
    cyan: "\x1b[36m",
    magenta: "\x1b[35m"
};

async function main() {
    console.log(`\n${colors.magenta}🧪 VALIDATING UNIFIED DEPLOYMENT${colors.reset}\n`);

    // Load deployment state
    const deploymentState = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
    const factoryAddr = deploymentState.contracts.FlexibleMarketFactoryUnified;

    const [deployer] = await ethers.getSigners();
    const factory = await ethers.getContractAt("FlexibleMarketFactoryUnified", factoryAddr);

    console.log(`${colors.cyan}📋 Configuration${colors.reset}`);
    console.log(`   Factory: ${colors.yellow}${factoryAddr}${colors.reset}`);
    console.log(`   Deployer: ${colors.yellow}${deployer.address}${colors.reset}\n`);

    try {
        // ═════════════════════════════════════════════════════════════
        // STEP 1: Create Test Market with CORRECT Config
        // ═════════════════════════════════════════════════════════════
        console.log(`${colors.cyan}🧪 Step 1/4: Creating Test Market${colors.reset}`);

        const bondAmount = ethers.parseEther("0.1");

        // Get current block timestamp from blockchain (not system time!)
        const currentBlock = await ethers.provider.getBlock('latest');
        const resolutionTime = currentBlock.timestamp + 86400; // 24 hours from now

        const marketConfig = {
            question: "Will Phase 4 complete successfully?",
            description: "Test market for Phase 4.3 unified deployment validation",
            resolutionTime: resolutionTime,
            creatorBond: bondAmount,
            category: ethers.keccak256(ethers.toUtf8Bytes("Technology")),
            outcome1: "Yes - Phase 4 will complete",
            outcome2: "No - Phase 4 will not complete"
        };

        console.log(`${colors.cyan}   Config:${colors.reset}`);
        console.log(`      Question: ${marketConfig.question}`);
        console.log(`      Resolution: ${new Date(resolutionTime * 1000).toISOString()}`);
        console.log(`      Bond: ${ethers.formatEther(bondAmount)} BASED\n`);

        const createTx = await factory.createMarket(marketConfig, { value: bondAmount });
        const createReceipt = await createTx.wait();

        // Get market address from event
        const marketCreatedEvent = createReceipt.logs.find(log => {
            try {
                const parsed = factory.interface.parseLog(log);
                return parsed && parsed.name === "MarketCreated";
            } catch (e) {
                return false;
            }
        });

        if (!marketCreatedEvent) {
            throw new Error("MarketCreated event not found!");
        }

        const parsedEvent = factory.interface.parseLog(marketCreatedEvent);
        const marketAddr = parsedEvent.args[0];

        console.log(`${colors.green}   ✅ Market created: ${marketAddr}${colors.reset}`);
        console.log(`${colors.cyan}      Gas used: ${createReceipt.gasUsed.toString()} gas${colors.reset}\n`);

        // Save market address
        deploymentState.contracts.TestMarket = marketAddr;
        deploymentState.gasCosts = deploymentState.gasCosts || {};
        deploymentState.gasCosts.createMarket = createReceipt.gasUsed.toString();

        // Verify market state
        const marketData = await factory.getMarketData(marketAddr);
        const approvalData = await factory.getApprovalData(marketAddr);

        console.log(`${colors.cyan}   Market State:${colors.reset}`);
        console.log(`      Exists: ${colors.green}${marketData.exists}${colors.reset}`);
        console.log(`      Active: ${marketData.isActive ? colors.yellow + 'true (unexpected!)' : colors.green + 'false (correct)'}${colors.reset}`);
        console.log(`      Bond: ${colors.green}${ethers.formatEther(marketData.creatorBond)} BASED${colors.reset}`);
        console.log(`      Approved: ${approvalData.approved ? colors.yellow + 'true' : colors.green + 'false (correct)'}${colors.reset}\n`);

        // ═════════════════════════════════════════════════════════════
        // STEP 2: Approve Market
        // ═════════════════════════════════════════════════════════════
        console.log(`${colors.cyan}🧪 Step 2/4: Approving Market${colors.reset}`);

        const approveTx = await factory.adminApproveMarket(marketAddr);
        const approveReceipt = await approveTx.wait();
        deploymentState.gasCosts.approveMarket = approveReceipt.gasUsed.toString();

        console.log(`${colors.green}   ✅ Market approved${colors.reset}`);
        console.log(`${colors.cyan}      Gas used: ${approveReceipt.gasUsed.toString()} gas${colors.reset}\n`);

        // ═════════════════════════════════════════════════════════════
        // STEP 3: Refund Bond
        // ═════════════════════════════════════════════════════════════
        console.log(`${colors.cyan}🧪 Step 3/4: Refunding Creator Bond${colors.reset}`);

        const refundTx = await factory.refundCreatorBond(marketAddr, "Approved - Phase 4.3 validation");
        const refundReceipt = await refundTx.wait();
        deploymentState.gasCosts.refundBond = refundReceipt.gasUsed.toString();

        console.log(`${colors.green}   ✅ Bond refunded${colors.reset}`);
        console.log(`${colors.cyan}      Gas used: ${refundReceipt.gasUsed.toString()} gas${colors.reset}\n`);

        // ═════════════════════════════════════════════════════════════
        // STEP 4: Activate Market
        // ═════════════════════════════════════════════════════════════
        console.log(`${colors.cyan}🧪 Step 4/4: Activating Market${colors.reset}`);

        const activateTx = await factory.activateMarket(marketAddr);
        const activateReceipt = await activateTx.wait();
        deploymentState.gasCosts.activateMarket = activateReceipt.gasUsed.toString();

        console.log(`${colors.green}   ✅ Market activated${colors.reset}`);
        console.log(`${colors.cyan}      Gas used: ${activateReceipt.gasUsed.toString()} gas${colors.reset}\n`);

        // Verify final state
        const marketDataFinal = await factory.getMarketData(marketAddr);
        console.log(`${colors.cyan}   Final State:${colors.reset}`);
        console.log(`      Active: ${colors.green}${marketDataFinal.isActive}${colors.reset}`);
        console.log(`      Bond: ${colors.green}${ethers.formatEther(marketDataFinal.creatorBond)} BASED${colors.reset}\n`);

        // Calculate totals
        const totalGas = parseInt(deploymentState.gasCosts.createMarket) +
                        parseInt(deploymentState.gasCosts.approveMarket) +
                        parseInt(deploymentState.gasCosts.refundBond) +
                        parseInt(deploymentState.gasCosts.activateMarket);
        deploymentState.gasCosts.totalLifecycle = totalGas.toString();

        // Mark validation complete
        deploymentState.validation = {
            marketCreated: true,
            marketApproved: true,
            bondRefunded: true,
            marketActivated: true,
            lifecycleComplete: true
        };

        // Save updated state
        fs.writeFileSync(STATE_FILE, JSON.stringify(deploymentState, null, 2));

        // ═════════════════════════════════════════════════════════════
        // SUCCESS SUMMARY
        // ═════════════════════════════════════════════════════════════
        console.log(`${colors.green}╔══════════════════════════════════════════════════════════╗${colors.reset}`);
        console.log(`${colors.green}║        🎉 VALIDATION SUCCESSFUL! 🎉                     ║${colors.reset}`);
        console.log(`${colors.green}╚══════════════════════════════════════════════════════════╝${colors.reset}\n`);

        console.log(`${colors.cyan}⚡ Gas Costs Summary:${colors.reset}`);
        console.log(`   Create:      ${colors.yellow}${parseInt(deploymentState.gasCosts.createMarket).toLocaleString()} gas${colors.reset}`);
        console.log(`   Approve:     ${colors.yellow}${parseInt(deploymentState.gasCosts.approveMarket).toLocaleString()} gas${colors.reset}`);
        console.log(`   Refund:      ${colors.yellow}${parseInt(deploymentState.gasCosts.refundBond).toLocaleString()} gas${colors.reset}`);
        console.log(`   Activate:    ${colors.yellow}${parseInt(deploymentState.gasCosts.activateMarket).toLocaleString()} gas${colors.reset}`);
        console.log(`   ${colors.magenta}Total:       ${totalGas.toLocaleString()} gas${colors.reset}\n`);

        console.log(`${colors.cyan}✅ Validation Complete:${colors.reset}`);
        console.log(`   Market Created:     ${colors.green}✅${colors.reset}`);
        console.log(`   Market Approved:    ${colors.green}✅${colors.reset}`);
        console.log(`   Bond Refunded:      ${colors.green}✅${colors.reset}`);
        console.log(`   Market Activated:   ${colors.green}✅${colors.reset}`);
        console.log(`   Test Market:        ${colors.yellow}${marketAddr}${colors.reset}\n`);

        console.log(`${colors.cyan}📄 State updated: fork-deployment-unified.json${colors.reset}\n`);

    } catch (error) {
        console.log(`\n${colors.red}╔══════════════════════════════════════════════════════════╗${colors.reset}`);
        console.log(`${colors.red}║           ❌ VALIDATION FAILED! ❌                      ║${colors.reset}`);
        console.log(`${colors.red}╚══════════════════════════════════════════════════════════╝${colors.reset}\n`);
        console.log(`${colors.red}Error: ${error.message}${colors.reset}\n`);
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
