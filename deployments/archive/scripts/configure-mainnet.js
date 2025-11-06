/**
 * KEKTECH 3.0 - BasedAI Mainnet Configuration
 *
 * Phase 2: Configuration
 *
 * This script configures the deployed contracts step-by-step:
 * - Register contracts in MasterRegistry (6 transactions)
 * - Set protocol parameters (3-5 transactions)
 * - Grant roles to owner (2 transactions)
 * - Transfer ownership (1 transaction)
 *
 * PREREQUISITES:
 * - All 7 contracts must be deployed (Phase 1 complete)
 * - deployment-state.json must exist with contract addresses
 *
 * SAFETY FEATURES:
 * - Resumable from any step
 * - Verifies each transaction before proceeding
 * - Saves state after each transaction
 * - Detailed logging of all operations
 */

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Color codes for terminal output
const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    green: "\x1b[32m",
    cyan: "\x1b[36m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
    magenta: "\x1b[35m"
};

// Configuration parameters
const CONFIG = {
    // Protocol fees
    protocolFeeBps: 200,      // 2%
    creatorFeeBps: 100,       // 1%
    minimumBet: ethers.parseEther("0.01"), // 0.01 BASED

    // Wallets
    owner: "0x25fD72154857Bd204345808a690d51a61A81EB0b",
    treasury: "0x25fD72154857Bd204345808a690d51a61A81EB0b",
    incentives: "0x25fD72154857Bd204345808a690d51a61A81EB0b"
};

// Transaction options (discovered working configuration)
const TX_OPTIONS = {
    gasLimit: 6000000,
    gasPrice: ethers.parseUnits("1", "gwei"),
    type: 0 // Legacy transaction
};

// State file
const STATE_FILE = path.join(__dirname, "deployment-state.json");

// Load deployment state
function loadState() {
    if (!fs.existsSync(STATE_FILE)) {
        console.error(`${colors.red}❌ Error: deployment-state.json not found!${colors.reset}`);
        console.error(`${colors.yellow}Please run deployment script first.${colors.reset}\n`);
        process.exit(1);
    }

    const data = fs.readFileSync(STATE_FILE, "utf8");
    const state = JSON.parse(data);

    // Verify all contracts are deployed
    const requiredContracts = [
        "MasterRegistry",
        "ParameterStorage",
        "AccessControlManager",
        "ProposalManagerV2",
        "FlexibleMarketFactory",
        "ResolutionManager",
        "RewardDistributor"
    ];

    for (const contract of requiredContracts) {
        if (!state.deployedContracts[contract]) {
            console.error(`${colors.red}❌ Error: ${contract} not deployed!${colors.reset}`);
            console.error(`${colors.yellow}Please complete Phase 1 deployment first.${colors.reset}\n`);
            process.exit(1);
        }
    }

    return state;
}

// Save state
function saveState(state) {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    console.log(`${colors.cyan}📝 State saved${colors.reset}\n`);
}

// Log transaction
function logTransaction(state, step, description, txHash, gasUsed) {
    const tx = {
        step: step,
        description: description,
        txHash: txHash,
        gasUsed: gasUsed.toString(),
        timestamp: new Date().toISOString()
    };

    state.transactions.push(tx);

    console.log(`${colors.green}✅ Transaction confirmed:${colors.reset}`);
    console.log(`   Description: ${description}`);
    console.log(`   Tx Hash: ${txHash}`);
    console.log(`   Gas Used: ${gasUsed.toString()}`);
    console.log();
}

// Wait for user confirmation
async function confirmProceed(message) {
    console.log(`${colors.yellow}${message}${colors.reset}`);
    console.log(`${colors.cyan}Proceeding in 3 seconds...${colors.reset}\n`);
    await new Promise(resolve => setTimeout(resolve, 3000));
}

async function main() {
    console.log(`\n${colors.bright}${"=".repeat(70)}${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}KEKTECH 3.0 - BASEDAI MAINNET CONFIGURATION (PHASE 2)${colors.reset}`);
    console.log(`${colors.bright}${"=".repeat(70)}${colors.reset}\n`);

    // Get deployer
    const [deployer] = await ethers.getSigners();
    console.log(`${colors.cyan}Deployer Address:${colors.reset} ${deployer.address}`);

    // Get network info
    const network = await ethers.provider.getNetwork();
    console.log(`${colors.cyan}Network:${colors.reset} ${network.name}`);
    console.log(`${colors.cyan}Chain ID:${colors.reset} ${network.chainId}`);

    // Check balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log(`${colors.cyan}Balance:${colors.reset} ${ethers.formatEther(balance)} BASED`);

    // Load deployment state
    let state = loadState();

    console.log(`\n${colors.cyan}Deployed Contracts:${colors.reset}`);
    Object.entries(state.deployedContracts).forEach(([name, address]) => {
        console.log(`  ${name}: ${address}`);
    });

    console.log(`\n${colors.yellow}Transaction Configuration:${colors.reset}`);
    console.log(`  Gas Limit: ${TX_OPTIONS.gasLimit.toLocaleString()}`);
    console.log(`  Gas Price: ${ethers.formatUnits(TX_OPTIONS.gasPrice, "gwei")} Gwei`);
    console.log(`  Type: ${TX_OPTIONS.type} (Legacy)`);

    console.log(`\n${colors.bright}${"=".repeat(70)}${colors.reset}\n`);

    // Initialize configuration step if not set
    if (!state.configStep) {
        state.configStep = 0;
        state.status = "configuration_pending";
    }

    console.log(`${colors.cyan}Configuration Status:${colors.reset}`);
    console.log(`  Current Step: ${state.configStep}/12`);
    console.log(`  Status: ${state.status}\n`);

    try {
        // Get contract instances
        const registry = await ethers.getContractAt(
            "MasterRegistry",
            state.deployedContracts.MasterRegistry
        );

        const paramStorage = await ethers.getContractAt(
            "ParameterStorage",
            state.deployedContracts.ParameterStorage
        );

        const acm = await ethers.getContractAt(
            "AccessControlManager",
            state.deployedContracts.AccessControlManager
        );

        // =====================================================================
        // STEP 8: REGISTER CONTRACTS (6 transactions)
        // =====================================================================

        console.log(`${colors.bright}${colors.magenta}PHASE 8: REGISTERING CONTRACTS IN MASTER REGISTRY${colors.reset}`);
        console.log(`${colors.cyan}Purpose:${colors.reset} Link all contracts so they can find each other\n`);

        await confirmProceed("⚠️  This will execute 6 transactions to register all contracts.");

        // 8.1: Register ParameterStorage
        if (state.configStep === 0) {
            console.log(`${colors.magenta}[8.1/12] Registering ParameterStorage${colors.reset}`);
            console.log(`  ⏳ Sending transaction...`);

            const tx = await registry.setContract(
                ethers.id("ParameterStorage"),
                state.deployedContracts.ParameterStorage,
                TX_OPTIONS
            );
            console.log(`  ✅ Transaction sent: ${tx.hash}`);
            console.log(`  ⏳ Waiting for confirmation...`);

            const receipt = await tx.wait();
            state.configStep = 1;
            logTransaction(state, "8.1", "Register ParameterStorage", receipt.hash, receipt.gasUsed);
            saveState(state);
        }

        // 8.2: Register AccessControlManager
        if (state.configStep === 1) {
            console.log(`${colors.magenta}[8.2/12] Registering AccessControlManager${colors.reset}`);
            console.log(`  ⏳ Sending transaction...`);

            const tx = await registry.setContract(
                ethers.id("AccessControlManager"),
                state.deployedContracts.AccessControlManager,
                TX_OPTIONS
            );
            console.log(`  ✅ Transaction sent: ${tx.hash}`);
            console.log(`  ⏳ Waiting for confirmation...`);

            const receipt = await tx.wait();
            state.configStep = 2;
            logTransaction(state, "8.2", "Register AccessControlManager", receipt.hash, receipt.gasUsed);
            saveState(state);
        }

        // 8.3: Register ProposalManager
        if (state.configStep === 2) {
            console.log(`${colors.magenta}[8.3/12] Registering ProposalManagerV2${colors.reset}`);
            console.log(`  ⏳ Sending transaction...`);

            const tx = await registry.setContract(
                ethers.id("ProposalManager"),
                state.deployedContracts.ProposalManagerV2,
                TX_OPTIONS
            );
            console.log(`  ✅ Transaction sent: ${tx.hash}`);
            console.log(`  ⏳ Waiting for confirmation...`);

            const receipt = await tx.wait();
            state.configStep = 3;
            logTransaction(state, "8.3", "Register ProposalManagerV2", receipt.hash, receipt.gasUsed);
            saveState(state);
        }

        // 8.4: Register FlexibleMarketFactory
        if (state.configStep === 3) {
            console.log(`${colors.magenta}[8.4/12] Registering FlexibleMarketFactory${colors.reset}`);
            console.log(`  ⏳ Sending transaction...`);

            const tx = await registry.setContract(
                ethers.id("FlexibleMarketFactory"),
                state.deployedContracts.FlexibleMarketFactory,
                TX_OPTIONS
            );
            console.log(`  ✅ Transaction sent: ${tx.hash}`);
            console.log(`  ⏳ Waiting for confirmation...`);

            const receipt = await tx.wait();
            state.configStep = 4;
            logTransaction(state, "8.4", "Register FlexibleMarketFactory", receipt.hash, receipt.gasUsed);
            saveState(state);
        }

        // 8.5: Register ResolutionManager
        if (state.configStep === 4) {
            console.log(`${colors.magenta}[8.5/12] Registering ResolutionManager${colors.reset}`);
            console.log(`  ⏳ Sending transaction...`);

            const tx = await registry.setContract(
                ethers.id("ResolutionManager"),
                state.deployedContracts.ResolutionManager,
                TX_OPTIONS
            );
            console.log(`  ✅ Transaction sent: ${tx.hash}`);
            console.log(`  ⏳ Waiting for confirmation...`);

            const receipt = await tx.wait();
            state.configStep = 5;
            logTransaction(state, "8.5", "Register ResolutionManager", receipt.hash, receipt.gasUsed);
            saveState(state);
        }

        // 8.6: Register RewardDistributor
        if (state.configStep === 5) {
            console.log(`${colors.magenta}[8.6/12] Registering RewardDistributor${colors.reset}`);
            console.log(`  ⏳ Sending transaction...`);

            const tx = await registry.setContract(
                ethers.id("RewardDistributor"),
                state.deployedContracts.RewardDistributor,
                TX_OPTIONS
            );
            console.log(`  ✅ Transaction sent: ${tx.hash}`);
            console.log(`  ⏳ Waiting for confirmation...`);

            const receipt = await tx.wait();
            state.configStep = 6;
            logTransaction(state, "8.6", "Register RewardDistributor", receipt.hash, receipt.gasUsed);
            saveState(state);
        }

        console.log(`${colors.green}✅ All contracts registered!${colors.reset}\n`);

        // =====================================================================
        // STEP 9: CONFIGURE PARAMETERS (3 transactions)
        // =====================================================================

        console.log(`${colors.bright}${colors.magenta}PHASE 9: CONFIGURING PROTOCOL PARAMETERS${colors.reset}`);
        console.log(`${colors.cyan}Purpose:${colors.reset} Set economic parameters and wallet addresses\n`);

        await confirmProceed("⚠️  This will execute 3 transactions to configure parameters.");

        // 9.1: Set Protocol Fee
        if (state.configStep === 6) {
            console.log(`${colors.magenta}[9.1/12] Setting Protocol Fee to ${CONFIG.protocolFeeBps / 100}%${colors.reset}`);
            console.log(`  ⏳ Sending transaction...`);

            const tx = await paramStorage.setParameter(
                ethers.id("protocolFeeBps"),
                CONFIG.protocolFeeBps,
                TX_OPTIONS
            );
            console.log(`  ✅ Transaction sent: ${tx.hash}`);
            console.log(`  ⏳ Waiting for confirmation...`);

            const receipt = await tx.wait();
            state.configStep = 7;
            logTransaction(state, "9.1", `Set Protocol Fee to ${CONFIG.protocolFeeBps / 100}%`, receipt.hash, receipt.gasUsed);
            saveState(state);
        }

        // 9.2: Set Creator Fee
        if (state.configStep === 7) {
            console.log(`${colors.magenta}[9.2/12] Setting Creator Fee to ${CONFIG.creatorFeeBps / 100}%${colors.reset}`);
            console.log(`  ⏳ Sending transaction...`);

            const tx = await paramStorage.setParameter(
                ethers.id("creatorFeeBps"),
                CONFIG.creatorFeeBps,
                TX_OPTIONS
            );
            console.log(`  ✅ Transaction sent: ${tx.hash}`);
            console.log(`  ⏳ Waiting for confirmation...`);

            const receipt = await tx.wait();
            state.configStep = 8;
            logTransaction(state, "9.2", `Set Creator Fee to ${CONFIG.creatorFeeBps / 100}%`, receipt.hash, receipt.gasUsed);
            saveState(state);
        }

        // 9.3: Set Minimum Bet
        if (state.configStep === 8) {
            console.log(`${colors.magenta}[9.3/12] Setting Minimum Bet to ${ethers.formatEther(CONFIG.minimumBet)} BASED${colors.reset}`);
            console.log(`  ⏳ Sending transaction...`);

            const tx = await paramStorage.setParameter(
                ethers.id("minimumBet"),
                CONFIG.minimumBet,
                TX_OPTIONS
            );
            console.log(`  ✅ Transaction sent: ${tx.hash}`);
            console.log(`  ⏳ Waiting for confirmation...`);

            const receipt = await tx.wait();
            state.configStep = 9;
            logTransaction(state, "9.3", `Set Minimum Bet to ${ethers.formatEther(CONFIG.minimumBet)} BASED`, receipt.hash, receipt.gasUsed);
            saveState(state);
        }

        console.log(`${colors.green}✅ All parameters configured!${colors.reset}\n`);

        // =====================================================================
        // STEP 10: GRANT ROLES (2 transactions)
        // =====================================================================

        console.log(`${colors.bright}${colors.magenta}PHASE 10: GRANTING ROLES${colors.reset}`);
        console.log(`${colors.cyan}Purpose:${colors.reset} Assign administrative permissions\n`);

        await confirmProceed("⚠️  This will execute 2 transactions to grant roles.");

        // 10.1: Grant RESOLVER_ROLE
        if (state.configStep === 9) {
            console.log(`${colors.magenta}[10.1/12] Granting RESOLVER_ROLE to owner${colors.reset}`);
            console.log(`  ⏳ Sending transaction...`);

            const RESOLVER_ROLE = ethers.id("RESOLVER_ROLE");
            const tx = await acm.grantRole(RESOLVER_ROLE, CONFIG.owner, TX_OPTIONS);
            console.log(`  ✅ Transaction sent: ${tx.hash}`);
            console.log(`  ⏳ Waiting for confirmation...`);

            const receipt = await tx.wait();
            state.configStep = 10;
            logTransaction(state, "10.1", "Grant RESOLVER_ROLE to owner", receipt.hash, receipt.gasUsed);
            saveState(state);
        }

        // 10.2: Grant ADMIN_ROLE
        if (state.configStep === 10) {
            console.log(`${colors.magenta}[10.2/12] Granting ADMIN_ROLE to owner${colors.reset}`);
            console.log(`  ⏳ Sending transaction...`);

            const ADMIN_ROLE = ethers.id("ADMIN_ROLE");
            const tx = await acm.grantRole(ADMIN_ROLE, CONFIG.owner, TX_OPTIONS);
            console.log(`  ✅ Transaction sent: ${tx.hash}`);
            console.log(`  ⏳ Waiting for confirmation...`);

            const receipt = await tx.wait();
            state.configStep = 11;
            logTransaction(state, "10.2", "Grant ADMIN_ROLE to owner", receipt.hash, receipt.gasUsed);
            saveState(state);
        }

        console.log(`${colors.green}✅ All roles granted!${colors.reset}\n`);

        // =====================================================================
        // STEP 11: TRANSFER OWNERSHIP (1 transaction)
        // =====================================================================

        console.log(`${colors.bright}${colors.magenta}PHASE 11: OWNERSHIP TRANSFER${colors.reset}`);
        console.log(`${colors.cyan}Purpose:${colors.reset} Transfer MasterRegistry ownership (if different from deployer)\n`);

        const currentOwner = await registry.owner();
        console.log(`${colors.cyan}Current Owner:${colors.reset} ${currentOwner}`);
        console.log(`${colors.cyan}Target Owner:${colors.reset} ${CONFIG.owner}`);

        if (currentOwner.toLowerCase() === CONFIG.owner.toLowerCase()) {
            console.log(`${colors.yellow}ℹ️  Owner is already correct, skipping transfer.${colors.reset}\n`);
            state.configStep = 12;
            saveState(state);
        } else {
            await confirmProceed("⚠️  CRITICAL: This will transfer ownership! This is irreversible!");

            if (state.configStep === 11) {
                console.log(`${colors.magenta}[11/12] Transferring ownership to ${CONFIG.owner}${colors.reset}`);
                console.log(`  ⏳ Sending transaction...`);

                const tx = await registry.transferOwnership(CONFIG.owner, TX_OPTIONS);
                console.log(`  ✅ Transaction sent: ${tx.hash}`);
                console.log(`  ⏳ Waiting for confirmation...`);

                const receipt = await tx.wait();
                state.configStep = 12;
                logTransaction(state, "11", `Transfer ownership to ${CONFIG.owner}`, receipt.hash, receipt.gasUsed);
                saveState(state);

                console.log(`${colors.green}✅ Ownership transferred!${colors.reset}\n`);
            }
        }

        // =====================================================================
        // CONFIGURATION COMPLETE
        // =====================================================================

        state.status = "fully_configured";
        saveState(state);

        console.log(`${colors.bright}${"=".repeat(70)}${colors.reset}`);
        console.log(`${colors.green}${colors.bright}✅ CONFIGURATION COMPLETE!${colors.reset}`);
        console.log(`${colors.bright}${"=".repeat(70)}${colors.reset}\n`);

        // Calculate total gas used
        const configTransactions = state.transactions.filter(tx => tx.step >= 8);
        const totalGas = configTransactions.reduce((sum, tx) => sum + BigInt(tx.gasUsed), 0n);
        const totalCost = totalGas * TX_OPTIONS.gasPrice;

        console.log(`${colors.cyan}Configuration Summary:${colors.reset}`);
        console.log(`  Total Transactions: ${configTransactions.length}`);
        console.log(`  Total Gas Used: ${totalGas.toString()}`);
        console.log(`  Total Cost: ${ethers.formatEther(totalCost)} BASED`);
        console.log();

        console.log(`${colors.green}KEKTECH 3.0 is now FULLY OPERATIONAL on BasedAI Mainnet!${colors.reset}\n`);

        console.log(`${colors.cyan}Contract Addresses:${colors.reset}`);
        Object.entries(state.deployedContracts).forEach(([name, address]) => {
            console.log(`  ${name}: ${address}`);
        });

        console.log(`\n${colors.yellow}Next Steps:${colors.reset}`);
        console.log(`  1. Verify contracts on BasedAI explorer`);
        console.log(`  2. Test creating a market`);
        console.log(`  3. Test placing bets`);
        console.log(`  4. Test market resolution`);
        console.log(`  5. Deploy frontend application`);
        console.log();

    } catch (error) {
        console.error(`\n${colors.red}❌ CONFIGURATION FAILED${colors.reset}`);
        console.error(`${colors.red}Error at step ${state.configStep + 1}:${colors.reset}`, error.message);
        console.error(`\n${colors.yellow}State saved. You can resume by running this script again.${colors.reset}\n`);

        state.status = "configuration_failed";
        state.error = error.message;
        saveState(state);

        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
