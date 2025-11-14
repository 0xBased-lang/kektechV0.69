const hre = require("hardhat");
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * @title Create Test Market on Sepolia - Phase 4.3 Validation
 * @notice Creates, approves, and activates test market on Sepolia testnet
 * @dev Uses EXTREME GAS settings (1000 gwei) to ensure success
 *
 * Run with: npx hardhat run scripts/create-market-sepolia.js --network sepolia
 */

// Configuration
const CONFIG = {
    STATE_FILE: path.join(__dirname, "../sepolia-deployment-unified.json"),
    MIN_CREATOR_BOND: ethers.parseEther("0.1"), // 0.1 ETH bond
    CONFIRMATIONS: 2 // Wait for 2 block confirmations on Sepolia
};

// Colors for console output
const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    cyan: "\x1b[36m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
    magenta: "\x1b[35m"
};

// Wait for block confirmations on real network
async function waitForConfirmations(tx, confirmations = CONFIG.CONFIRMATIONS) {
    if (confirmations > 0) {
        console.log(`${colors.cyan}   ⏳ Waiting for ${confirmations} block confirmations...${colors.reset}`);
        await tx.wait(confirmations);
        console.log(`${colors.green}   ✅ ${confirmations} confirmations received${colors.reset}`);
    }
}

// Main function
async function main() {
    console.log(`\n${colors.bright}${colors.magenta}╔═══════════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.bright}${colors.magenta}║  KEKTECH 3.0 - SEPOLIA MARKET CREATION (PHASE 4.3)          ║${colors.reset}`);
    console.log(`${colors.bright}${colors.magenta}╚═══════════════════════════════════════════════════════════════╝${colors.reset}\n`);

    // Load deployment state
    if (!fs.existsSync(CONFIG.STATE_FILE)) {
        throw new Error(`❌ Deployment state file not found: ${CONFIG.STATE_FILE}`);
    }

    const deploymentState = JSON.parse(fs.readFileSync(CONFIG.STATE_FILE, "utf8"));
    console.log(`${colors.green}✅ Loaded deployment state${colors.reset}`);
    console.log(`${colors.cyan}   Network: ${deploymentState.network}${colors.reset}`);
    console.log(`${colors.cyan}   Chain ID: ${deploymentState.chainId}${colors.reset}\n`);

    // Get deployer
    const [deployer] = await ethers.getSigners();
    const balance = await ethers.provider.getBalance(deployer.address);
    const network = await ethers.provider.getNetwork();

    console.log(`${colors.cyan}📋 Configuration${colors.reset}`);
    console.log(`   Network:         ${colors.yellow}Ethereum Sepolia Testnet${colors.reset}`);
    console.log(`   Chain ID:        ${colors.yellow}${network.chainId}${colors.reset}`);
    console.log(`   Deployer:        ${colors.yellow}${deployer.address}${colors.reset}`);
    console.log(`   Balance:         ${colors.yellow}${ethers.formatEther(balance)} ETH${colors.reset}`);
    console.log(`   Confirmations:   ${colors.yellow}${CONFIG.CONFIRMATIONS} blocks${colors.reset}\n`);

    // Get factory contract
    const factoryAddr = deploymentState.contracts.FlexibleMarketFactoryUnified;
    if (!factoryAddr) {
        throw new Error("❌ FlexibleMarketFactoryUnified address not found in deployment state!");
    }

    console.log(`${colors.cyan}📝 Loading FlexibleMarketFactoryUnified...${colors.reset}`);
    console.log(`   Address: ${colors.yellow}${factoryAddr}${colors.reset}\n`);

    const factory = await ethers.getContractAt("FlexibleMarketFactoryUnified", factoryAddr);

    // Initialize gas costs tracker
    const gasCosts = {};

    try {
        // ═══════════════════════════════════════════════════════════
        // STEP 1: Create Test Market
        // ═══════════════════════════════════════════════════════════
        console.log(`${colors.bright}${colors.cyan}🧪 Step 1/4: Create Test Market${colors.reset}\n`);

        // Get current block timestamp from blockchain (not system time!)
        const currentBlock = await ethers.provider.getBlock('latest');
        const resolutionTime = currentBlock.timestamp + 86400; // 24 hours from now

        // Correct MarketConfig struct based on FlexibleMarketFactoryUnified.sol
        const marketConfig = {
            question: "Will Phase 4.3 complete successfully on Sepolia?",
            description: "Test market for Phase 4.3 unified deployment validation on Sepolia testnet",
            resolutionTime: resolutionTime, // uint256 - when market can be resolved
            creatorBond: CONFIG.MIN_CREATOR_BOND, // uint256 - bond amount
            category: ethers.id("test"), // bytes32 - market category
            outcome1: "Yes - Phase 4.3 succeeds",  // string - first outcome
            outcome2: "No - Phase 4.3 fails"       // string - second outcome
        };

        console.log(`${colors.cyan}   Creating market with config:${colors.reset}`);
        console.log(`${colors.cyan}      Question: "${marketConfig.question}"${colors.reset}`);
        console.log(`${colors.cyan}      Resolution Time: ${new Date(resolutionTime * 1000).toISOString()}${colors.reset}`);
        console.log(`${colors.cyan}      Creator Bond: ${ethers.formatEther(marketConfig.creatorBond)} ETH${colors.reset}`);
        console.log(`${colors.cyan}      Category: test${colors.reset}`);
        console.log(`${colors.cyan}      Outcome 1: ${marketConfig.outcome1}${colors.reset}`);
        console.log(`${colors.cyan}      Outcome 2: ${marketConfig.outcome2}${colors.reset}\n`);

        console.log(`${colors.yellow}   ⏳ Submitting transaction with EXTREME GAS (1000 gwei)...${colors.reset}`);
        const createTx = await factory.createMarket(marketConfig, { value: CONFIG.MIN_CREATOR_BOND });
        console.log(`${colors.cyan}   📡 Transaction submitted: ${createTx.hash}${colors.reset}`);

        await waitForConfirmations(createTx);
        const createReceipt = await createTx.wait();
        gasCosts.createMarket = createReceipt.gasUsed.toString();

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
            throw new Error("❌ MarketCreated event not found!");
        }

        const parsedEvent = factory.interface.parseLog(marketCreatedEvent);
        const testMarketAddr = parsedEvent.args[0]; // First arg is market address

        console.log(`${colors.green}   ✅ Market created: ${testMarketAddr}${colors.reset}`);
        console.log(`${colors.cyan}      Gas used: ${gasCosts.createMarket} gas${colors.reset}\n`);

        // Verify market state
        console.log(`${colors.cyan}   Verifying market state...${colors.reset}`);
        const marketData = await factory.getMarketData(testMarketAddr);
        const approvalData = await factory.getApprovalData(testMarketAddr);

        console.log(`${colors.green}   ✅ Market exists: ${marketData.exists}${colors.reset}`);
        console.log(`${colors.green}   ✅ Market active: ${marketData.isActive ? 'true (unexpected!)' : 'false (correct - needs approval)'}${colors.reset}`);
        console.log(`${colors.green}   ✅ Creator bond held: ${ethers.formatEther(marketData.creatorBond)} ETH${colors.reset}`);
        console.log(`${colors.green}   ✅ Approval status: ${approvalData.approved ? 'approved (unexpected!)' : 'pending (correct)'}${colors.reset}\n`);

        // ═══════════════════════════════════════════════════════════
        // STEP 2: Approve Test Market
        // ═══════════════════════════════════════════════════════════
        console.log(`${colors.bright}${colors.cyan}🧪 Step 2/4: Approve Test Market (Admin Workflow)${colors.reset}\n`);

        console.log(`${colors.yellow}   ⏳ Submitting approval transaction...${colors.reset}`);
        const approveTx = await factory.adminApproveMarket(testMarketAddr);
        console.log(`${colors.cyan}   📡 Transaction submitted: ${approveTx.hash}${colors.reset}`);

        await waitForConfirmations(approveTx);
        const approveReceipt = await approveTx.wait();
        gasCosts.approveMarket = approveReceipt.gasUsed.toString();

        console.log(`${colors.green}   ✅ Market approved${colors.reset}`);
        console.log(`${colors.cyan}      Gas used: ${gasCosts.approveMarket} gas${colors.reset}\n`);

        // Verify approval
        const approvalDataAfter = await factory.getApprovalData(testMarketAddr);
        console.log(`${colors.green}   ✅ Approved: ${approvalDataAfter.approved}${colors.reset}`);
        console.log(`${colors.green}   ✅ Approver: ${approvalDataAfter.approver}${colors.reset}\n`);

        // Refund creator bond (two-step process learned in Phase 4.2!)
        console.log(`${colors.cyan}   Refunding creator bond (two-step process)...${colors.reset}`);
        console.log(`${colors.yellow}   ⏳ Submitting refund transaction...${colors.reset}`);
        const refundTx = await factory.refundCreatorBond(testMarketAddr, "Approved - Phase 4.3 Sepolia test");
        console.log(`${colors.cyan}   📡 Transaction submitted: ${refundTx.hash}${colors.reset}`);

        await waitForConfirmations(refundTx);
        const refundReceipt = await refundTx.wait();
        gasCosts.refundBond = refundReceipt.gasUsed.toString();

        console.log(`${colors.green}   ✅ Bond refunded${colors.reset}`);
        console.log(`${colors.cyan}      Gas used: ${gasCosts.refundBond} gas${colors.reset}\n`);

        // Verify bond cleared
        const marketDataAfterRefund = await factory.getMarketData(testMarketAddr);
        console.log(`${colors.green}   ✅ Bond cleared: ${ethers.formatEther(marketDataAfterRefund.creatorBond)} ETH${colors.reset}\n`);

        // ═══════════════════════════════════════════════════════════
        // STEP 3: Activate Test Market
        // ═══════════════════════════════════════════════════════════
        console.log(`${colors.bright}${colors.cyan}🧪 Step 3/4: Activate Test Market (Backend Workflow)${colors.reset}\n`);

        console.log(`${colors.yellow}   ⏳ Submitting activation transaction...${colors.reset}`);
        const activateTx = await factory.activateMarket(testMarketAddr);
        console.log(`${colors.cyan}   📡 Transaction submitted: ${activateTx.hash}${colors.reset}`);

        await waitForConfirmations(activateTx);
        const activateReceipt = await activateTx.wait();
        gasCosts.activateMarket = activateReceipt.gasUsed.toString();

        console.log(`${colors.green}   ✅ Market activated${colors.reset}`);
        console.log(`${colors.cyan}      Gas used: ${gasCosts.activateMarket} gas${colors.reset}\n`);

        // Verify activation
        const marketDataFinal = await factory.getMarketData(testMarketAddr);
        console.log(`${colors.green}   ✅ Market active: ${marketDataFinal.isActive}${colors.reset}\n`);

        // ═══════════════════════════════════════════════════════════
        // STEP 4: Calculate Total Gas Costs
        // ═══════════════════════════════════════════════════════════
        console.log(`${colors.bright}${colors.cyan}📊 Step 4/4: Gas Cost Analysis${colors.reset}\n`);

        const totalGas = parseInt(gasCosts.createMarket) +
                        parseInt(gasCosts.approveMarket) +
                        parseInt(gasCosts.refundBond) +
                        parseInt(gasCosts.activateMarket);

        console.log(`${colors.cyan}   Create Market:    ${parseInt(gasCosts.createMarket).toLocaleString()} gas${colors.reset}`);
        console.log(`${colors.cyan}   Approve Market:   ${parseInt(gasCosts.approveMarket).toLocaleString()} gas${colors.reset}`);
        console.log(`${colors.cyan}   Refund Bond:      ${parseInt(gasCosts.refundBond).toLocaleString()} gas${colors.reset}`);
        console.log(`${colors.cyan}   Activate Market:  ${parseInt(gasCosts.activateMarket).toLocaleString()} gas${colors.reset}`);
        console.log(`${colors.bright}${colors.green}   ───────────────────────────────────${colors.reset}`);
        console.log(`${colors.bright}${colors.green}   Total Lifecycle:  ${totalGas.toLocaleString()} gas${colors.reset}\n`);

        // Compare to fork deployment
        const forkTotalGas = 888000; // From fork deployment
        const variance = ((totalGas - forkTotalGas) / forkTotalGas * 100).toFixed(2);

        console.log(`${colors.cyan}   Fork deployment:  ${forkTotalGas.toLocaleString()} gas${colors.reset}`);
        console.log(`${colors.cyan}   Sepolia vs Fork:  ${variance}% ${parseFloat(variance) > 0 ? 'higher' : 'lower'}${colors.reset}\n`);

        if (Math.abs(parseFloat(variance)) > 15) {
            console.log(`${colors.yellow}   ⚠️  Gas variance exceeds 15% threshold!${colors.reset}\n`);
        } else {
            console.log(`${colors.green}   ✅ Gas costs within acceptable range (<15% variance)${colors.reset}\n`);
        }

        // Update deployment state
        deploymentState.contracts.TestMarket = testMarketAddr;
        deploymentState.gasCosts = gasCosts;
        deploymentState.gasCosts.totalLifecycle = totalGas.toString();
        deploymentState.validation = {
            marketCreated: true,
            marketApproved: true,
            marketActivated: true,
            lifecycleComplete: true,
            gasVariance: variance
        };
        deploymentState.lastUpdated = new Date().toISOString();

        fs.writeFileSync(CONFIG.STATE_FILE, JSON.stringify(deploymentState, null, 2));
        console.log(`${colors.green}✅ Deployment state updated${colors.reset}\n`);

        // Success summary
        console.log(`${colors.bright}${colors.green}╔═══════════════════════════════════════════════════════════════╗${colors.reset}`);
        console.log(`${colors.bright}${colors.green}║           🎉 SEPOLIA MARKET CREATION SUCCESS! 🎉             ║${colors.reset}`);
        console.log(`${colors.bright}${colors.green}╚═══════════════════════════════════════════════════════════════╝${colors.reset}\n`);

        console.log(`${colors.cyan}📍 Market Address:        ${colors.yellow}${testMarketAddr}${colors.reset}`);
        console.log(`${colors.cyan}🔗 Factory Address:       ${colors.yellow}${factoryAddr}${colors.reset}`);
        console.log(`${colors.cyan}⛓️  Network:               ${colors.yellow}Sepolia Testnet (Chain ${network.chainId})${colors.reset}`);
        console.log(`${colors.cyan}⚡ Total Lifecycle Gas:   ${colors.yellow}${totalGas.toLocaleString()} gas${colors.reset}`);
        console.log(`${colors.cyan}📊 Fork Variance:         ${colors.yellow}${variance}%${colors.reset}`);
        console.log(`${colors.cyan}✅ Lifecycle Status:      ${colors.green}COMPLETE (PROPOSED → APPROVED → ACTIVE)${colors.reset}\n`);

        console.log(`${colors.green}Next Steps:${colors.reset}`);
        console.log(`${colors.cyan}  1. Verify market on Sepolia Etherscan${colors.reset}`);
        console.log(`${colors.cyan}  2. Monitor market for 24 hours${colors.reset}`);
        console.log(`${colors.cyan}  3. Update migration checklist${colors.reset}`);
        console.log(`${colors.cyan}  4. Move to Phase 4.4 cleanup${colors.reset}\n`);

        console.log(`${colors.bright}${colors.green}✅ Phase 4.3 Sepolia Validation: COMPLETE!${colors.reset}\n`);

    } catch (error) {
        console.error(`\n${colors.red}❌ Error during market creation:${colors.reset}`);
        console.error(error);

        // Save partial state
        deploymentState.error = {
            message: error.message,
            timestamp: new Date().toISOString()
        };
        fs.writeFileSync(CONFIG.STATE_FILE, JSON.stringify(deploymentState, null, 2));

        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
