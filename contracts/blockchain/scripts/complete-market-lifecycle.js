const hre = require("hardhat");
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * @title Complete Market Lifecycle on Sepolia - Phase 4.3
 * @notice Approve and activate existing market (already created)
 * @dev Market 0xE11B1EC6D221919e46aA470c3BcBf899ae28879C already exists
 */

// Configuration
const CONFIG = {
    STATE_FILE: path.join(__dirname, "../sepolia-deployment-unified.json"),
    MARKET_ADDR: "0xE11B1EC6D221919e46aA470c3BcBf899ae28879C",
    CONFIRMATIONS: 2
};

// Colors
const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    cyan: "\x1b[36m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
    magenta: "\x1b[35m"
};

// Wait for confirmations
async function waitForConfirmations(tx, confirmations = CONFIG.CONFIRMATIONS) {
    if (confirmations > 0) {
        console.log(`${colors.cyan}   ⏳ Waiting for ${confirmations} block confirmations...${colors.reset}`);
        await tx.wait(confirmations);
        console.log(`${colors.green}   ✅ ${confirmations} confirmations received${colors.reset}`);
    }
}

async function main() {
    console.log(`\n${colors.bright}${colors.magenta}╔═══════════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.bright}${colors.magenta}║  KEKTECH 3.0 - COMPLETE MARKET LIFECYCLE (PHASE 4.3)        ║${colors.reset}`);
    console.log(`${colors.bright}${colors.magenta}╚═══════════════════════════════════════════════════════════════╝${colors.reset}\n`);

    // Load state
    const deploymentState = JSON.parse(fs.readFileSync(CONFIG.STATE_FILE, "utf8"));
    const [deployer] = await ethers.getSigners();
    const network = await ethers.provider.getNetwork();

    console.log(`${colors.cyan}📋 Configuration${colors.reset}`);
    console.log(`   Network:         ${colors.yellow}Ethereum Sepolia${colors.reset}`);
    console.log(`   Chain ID:        ${colors.yellow}${network.chainId}${colors.reset}`);
    console.log(`   Market:          ${colors.yellow}${CONFIG.MARKET_ADDR}${colors.reset}`);
    console.log(`   Deployer:        ${colors.yellow}${deployer.address}${colors.reset}\n`);

    const factoryAddr = deploymentState.contracts.FlexibleMarketFactoryUnified;
    const factory = await ethers.getContractAt("FlexibleMarketFactoryUnified", factoryAddr);

    const gasCosts = {};

    try {
        // Verify market exists
        console.log(`${colors.cyan}📍 Verifying market...${colors.reset}`);
        const marketData = await factory.getMarketData(CONFIG.MARKET_ADDR);
        console.log(`${colors.green}   ✅ Market exists: ${marketData.exists}${colors.reset}`);
        console.log(`${colors.cyan}   Market active: ${marketData.isActive}${colors.reset}`);
        console.log(`${colors.cyan}   Creator bond: ${ethers.formatEther(marketData.creatorBond)} ETH${colors.reset}\n`);

        // ═══════════════════════════════════════════════════════════
        // STEP 1: Approve Market
        // ═══════════════════════════════════════════════════════════
        console.log(`${colors.bright}${colors.cyan}🧪 Step 1/3: Approve Market${colors.reset}\n`);

        const approvalDataBefore = await factory.getApprovalData(CONFIG.MARKET_ADDR);
        console.log(`${colors.cyan}   Current approval status: ${approvalDataBefore.approved ? 'approved' : 'pending'}${colors.reset}\n`);

        if (!approvalDataBefore.approved) {
            console.log(`${colors.yellow}   ⏳ Submitting approval transaction...${colors.reset}`);
            const approveTx = await factory.adminApproveMarket(CONFIG.MARKET_ADDR);
            console.log(`${colors.cyan}   📡 Transaction: ${approveTx.hash}${colors.reset}`);

            await waitForConfirmations(approveTx);
            const approveReceipt = await approveTx.wait();
            gasCosts.approveMarket = approveReceipt.gasUsed.toString();

            console.log(`${colors.green}   ✅ Market approved!${colors.reset}`);
            console.log(`${colors.cyan}      Gas used: ${gasCosts.approveMarket} gas${colors.reset}\n`);
        } else {
            console.log(`${colors.green}   ✅ Already approved${colors.reset}\n`);
        }

        // Verify approval
        const approvalDataAfter = await factory.getApprovalData(CONFIG.MARKET_ADDR);
        console.log(`${colors.green}   ✅ Approved: ${approvalDataAfter.approved}${colors.reset}`);
        console.log(`${colors.green}   ✅ Approver: ${approvalDataAfter.approver}${colors.reset}\n`);

        // ═══════════════════════════════════════════════════════════
        // STEP 2: Refund Creator Bond
        // ═══════════════════════════════════════════════════════════
        console.log(`${colors.bright}${colors.cyan}🧪 Step 2/3: Refund Creator Bond${colors.reset}\n`);

        const bondBefore = marketData.creatorBond;
        console.log(`${colors.cyan}   Current bond: ${ethers.formatEther(bondBefore)} ETH${colors.reset}\n`);

        if (bondBefore > 0n) {
            console.log(`${colors.yellow}   ⏳ Submitting refund transaction...${colors.reset}`);
            const refundTx = await factory.refundCreatorBond(CONFIG.MARKET_ADDR, "Approved - Phase 4.3 Sepolia");
            console.log(`${colors.cyan}   📡 Transaction: ${refundTx.hash}${colors.reset}`);

            await waitForConfirmations(refundTx);
            const refundReceipt = await refundTx.wait();
            gasCosts.refundBond = refundReceipt.gasUsed.toString();

            console.log(`${colors.green}   ✅ Bond refunded!${colors.reset}`);
            console.log(`${colors.cyan}      Gas used: ${gasCosts.refundBond} gas${colors.reset}\n`);
        } else {
            console.log(`${colors.green}   ✅ Already refunded${colors.reset}\n`);
        }

        // Verify refund
        const marketDataAfterRefund = await factory.getMarketData(CONFIG.MARKET_ADDR);
        console.log(`${colors.green}   ✅ Bond cleared: ${ethers.formatEther(marketDataAfterRefund.creatorBond)} ETH${colors.reset}\n`);

        // ═══════════════════════════════════════════════════════════
        // STEP 3: Activate Market
        // ═══════════════════════════════════════════════════════════
        console.log(`${colors.bright}${colors.cyan}🧪 Step 3/3: Activate Market${colors.reset}\n`);

        console.log(`${colors.yellow}   ⏳ Submitting activation transaction...${colors.reset}`);
        const activateTx = await factory.activateMarket(CONFIG.MARKET_ADDR);
        console.log(`${colors.cyan}   📡 Transaction: ${activateTx.hash}${colors.reset}`);

        await waitForConfirmations(activateTx);
        const activateReceipt = await activateTx.wait();
        gasCosts.activateMarket = activateReceipt.gasUsed.toString();

        console.log(`${colors.green}   ✅ Market activated!${colors.reset}`);
        console.log(`${colors.cyan}      Gas used: ${gasCosts.activateMarket} gas${colors.reset}\n`);

        // Verify activation
        const marketDataFinal = await factory.getMarketData(CONFIG.MARKET_ADDR);
        console.log(`${colors.green}   ✅ Market active: ${marketDataFinal.isActive}${colors.reset}\n`);

        // ═══════════════════════════════════════════════════════════
        // Gas Cost Summary
        // ═══════════════════════════════════════════════════════════
        console.log(`${colors.bright}${colors.cyan}📊 Gas Cost Summary${colors.reset}\n`);

        const createGas = 688796; // From earlier creation
        const approveGas = parseInt(gasCosts.approveMarket || "0");
        const refundGas = parseInt(gasCosts.refundBond || "0");
        const activateGas = parseInt(gasCosts.activateMarket || "0");
        const totalGas = createGas + approveGas + refundGas + activateGas;

        console.log(`${colors.cyan}   Create Market:    ${createGas.toLocaleString()} gas${colors.reset}`);
        console.log(`${colors.cyan}   Approve Market:   ${approveGas.toLocaleString()} gas${colors.reset}`);
        console.log(`${colors.cyan}   Refund Bond:      ${refundGas.toLocaleString()} gas${colors.reset}`);
        console.log(`${colors.cyan}   Activate Market:  ${activateGas.toLocaleString()} gas${colors.reset}`);
        console.log(`${colors.bright}${colors.green}   ───────────────────────────────────${colors.reset}`);
        console.log(`${colors.bright}${colors.green}   Total Lifecycle:  ${totalGas.toLocaleString()} gas${colors.reset}\n`);

        // Update state
        deploymentState.contracts.TestMarket = CONFIG.MARKET_ADDR;
        deploymentState.gasCosts = {
            ...gasCosts,
            createMarket: createGas.toString(),
            totalLifecycle: totalGas.toString()
        };
        deploymentState.validation = {
            marketCreated: true,
            marketApproved: true,
            marketActivated: true,
            lifecycleComplete: true
        };
        deploymentState.lastUpdated = new Date().toISOString();

        fs.writeFileSync(CONFIG.STATE_FILE, JSON.stringify(deploymentState, null, 2));

        // Success!
        console.log(`${colors.bright}${colors.green}╔═══════════════════════════════════════════════════════════════╗${colors.reset}`);
        console.log(`${colors.bright}${colors.green}║         🎉 MARKET LIFECYCLE COMPLETE! 🎉                     ║${colors.reset}`);
        console.log(`${colors.bright}${colors.green}╚═══════════════════════════════════════════════════════════════╝${colors.reset}\n`);

        console.log(`${colors.cyan}📍 Market:            ${colors.yellow}${CONFIG.MARKET_ADDR}${colors.reset}`);
        console.log(`${colors.cyan}🔗 Factory:           ${colors.yellow}${factoryAddr}${colors.reset}`);
        console.log(`${colors.cyan}⛓️  Network:           ${colors.yellow}Sepolia (${network.chainId})${colors.reset}`);
        console.log(`${colors.cyan}⚡ Total Gas:         ${colors.yellow}${totalGas.toLocaleString()} gas${colors.reset}`);
        console.log(`${colors.cyan}✅ Lifecycle:         ${colors.green}PROPOSED → APPROVED → ACTIVE${colors.reset}\n`);

        console.log(`${colors.bright}${colors.green}✅ Phase 4.3 Sepolia Market Lifecycle: COMPLETE!${colors.reset}\n`);

    } catch (error) {
        console.error(`\n${colors.red}❌ Error:${colors.reset}`, error.message);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
