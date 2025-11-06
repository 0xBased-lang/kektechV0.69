/**
 * KEKTECH 3.0 - Step-by-Step BasedAI Mainnet Deployment
 *
 * This script deploys contracts ONE AT A TIME with detailed logging
 * and documentation for maximum transparency and control.
 *
 * WORKING CONFIGURATION (discovered through testing):
 * - Transaction Type: 0 (Legacy)
 * - Gas Limit: 6,000,000
 * - Gas Price: 1 Gwei
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

// Deployment configuration
const DEPLOYMENT_CONFIG = {
    // Protocol parameters
    protocolFeeBps: 200,      // 2%
    creatorFeeBps: 100,       // 1%
    minimumBet: ethers.parseEther("0.01"), // 0.01 BASED
    minCreatorBond: ethers.parseEther("1"), // 1 BASED
    disputeWindow: 86400,     // 24 hours
    minDisputeBond: ethers.parseEther("10"), // 10 BASED

    // Wallet addresses
    owner: "0x25fD72154857Bd204345808a690d51a61A81EB0b",
    treasury: "0x25fD72154857Bd204345808a690d51a61A81EB0b",
    incentives: "0x25fD72154857Bd204345808a690d51a61A81EB0b"
};

// Transaction options that work on BasedAI
const TX_OPTIONS = {
    gasLimit: 6000000,
    gasPrice: ethers.parseUnits("1", "gwei"), // 1 Gwei
    type: 0 // Legacy transaction
};

// Deployment state file
const STATE_FILE = path.join(__dirname, "deployment-state.json");

// Load or initialize deployment state
function loadState() {
    if (fs.existsSync(STATE_FILE)) {
        const data = fs.readFileSync(STATE_FILE, "utf8");
        return JSON.parse(data);
    }
    return {
        network: "basedai_mainnet",
        chainId: 32323,
        deployedContracts: {},
        transactions: [],
        currentStep: 0,
        status: "not_started"
    };
}

// Save deployment state
function saveState(state) {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    console.log(`${colors.cyan}📝 State saved to: ${STATE_FILE}${colors.reset}\n`);
}

// Log transaction details
function logTransaction(state, contractName, txHash, address, gasUsed) {
    const tx = {
        step: state.currentStep,
        contract: contractName,
        txHash: txHash,
        address: address,
        gasUsed: gasUsed.toString(),
        timestamp: new Date().toISOString()
    };
    state.transactions.push(tx);

    console.log(`${colors.green}✅ Transaction confirmed:${colors.reset}`);
    console.log(`   Contract: ${contractName}`);
    console.log(`   Address: ${address}`);
    console.log(`   Tx Hash: ${txHash}`);
    console.log(`   Gas Used: ${gasUsed.toString()}`);
    console.log();
}

// Main deployment function
async function main() {
    console.log(`\n${colors.bright}${"=".repeat(70)}${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}KEKTECH 3.0 - STEP-BY-STEP BASEDAI MAINNET DEPLOYMENT${colors.reset}`);
    console.log(`${colors.bright}${"=".repeat(70)}${colors.reset}\n`);

    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log(`${colors.cyan}Deployer Address:${colors.reset} ${deployer.address}`);

    // Get network info
    const network = await ethers.provider.getNetwork();
    console.log(`${colors.cyan}Network:${colors.reset} ${network.name}`);
    console.log(`${colors.cyan}Chain ID:${colors.reset} ${network.chainId}`);

    // Check balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log(`${colors.cyan}Balance:${colors.reset} ${ethers.formatEther(balance)} BASED`);

    // Display transaction configuration
    console.log(`\n${colors.yellow}Transaction Configuration:${colors.reset}`);
    console.log(`  Gas Limit: ${TX_OPTIONS.gasLimit.toLocaleString()}`);
    console.log(`  Gas Price: ${ethers.formatUnits(TX_OPTIONS.gasPrice, "gwei")} Gwei`);
    console.log(`  Type: ${TX_OPTIONS.type} (Legacy Transaction)`);

    // Load deployment state
    let state = loadState();
    console.log(`\n${colors.cyan}Current Deployment State:${colors.reset}`);
    console.log(`  Status: ${state.status}`);
    console.log(`  Current Step: ${state.currentStep}/11`);
    console.log(`  Deployed Contracts: ${Object.keys(state.deployedContracts).length}/7`);

    console.log(`\n${colors.bright}${"=".repeat(70)}${colors.reset}\n`);

    // Ask for confirmation
    if (state.currentStep === 0) {
        console.log(`${colors.yellow}⚠️  This will deploy KEKTECH 3.0 to BasedAI MAINNET${colors.reset}`);
        console.log(`${colors.yellow}⚠️  Estimated total cost: ~0.025 BASED${colors.reset}`);
        console.log(`\n${colors.cyan}Starting deployment in 3 seconds...${colors.reset}\n`);
        await new Promise(resolve => setTimeout(resolve, 3000));
    }

    try {
        state.status = "in_progress";
        saveState(state);

        // STEP 1: Deploy MasterRegistry
        if (state.currentStep === 0) {
            console.log(`${colors.magenta}[STEP 1/11] Deploying MasterRegistry${colors.reset}`);
            console.log(`${colors.cyan}Description:${colors.reset} Central registry for all protocol contracts`);
            console.log();

            const Registry = await ethers.getContractFactory("MasterRegistry");
            console.log(`  ⏳ Sending transaction...`);

            const registry = await Registry.deploy(TX_OPTIONS);
            console.log(`  ✅ Transaction sent: ${registry.deploymentTransaction().hash}`);
            console.log(`  ⏳ Waiting for confirmation...`);

            const receipt = await registry.deploymentTransaction().wait();
            const address = await registry.getAddress();

            state.deployedContracts.MasterRegistry = address;
            state.currentStep = 1;
            logTransaction(state, "MasterRegistry", receipt.hash, address, receipt.gasUsed);
            saveState(state);
        }

        // STEP 2: Deploy ParameterStorage
        if (state.currentStep === 1) {
            console.log(`${colors.magenta}[STEP 2/11] Deploying ParameterStorage${colors.reset}`);
            console.log(`${colors.cyan}Description:${colors.reset} Stores all configurable protocol parameters`);
            console.log();

            const ParamStorage = await ethers.getContractFactory("ParameterStorage");
            console.log(`  ⏳ Sending transaction...`);

            const paramStorage = await ParamStorage.deploy(
                state.deployedContracts.MasterRegistry,
                TX_OPTIONS
            );
            console.log(`  ✅ Transaction sent: ${paramStorage.deploymentTransaction().hash}`);
            console.log(`  ⏳ Waiting for confirmation...`);

            const receipt = await paramStorage.deploymentTransaction().wait();
            const address = await paramStorage.getAddress();

            state.deployedContracts.ParameterStorage = address;
            state.currentStep = 2;
            logTransaction(state, "ParameterStorage", receipt.hash, address, receipt.gasUsed);
            saveState(state);
        }

        // STEP 3: Deploy AccessControlManager
        if (state.currentStep === 2) {
            console.log(`${colors.magenta}[STEP 3/11] Deploying AccessControlManager${colors.reset}`);
            console.log(`${colors.cyan}Description:${colors.reset} Manages roles and permissions`);
            console.log();

            const ACM = await ethers.getContractFactory("AccessControlManager");
            console.log(`  ⏳ Sending transaction...`);

            const acm = await ACM.deploy(
                state.deployedContracts.MasterRegistry,
                TX_OPTIONS
            );
            console.log(`  ✅ Transaction sent: ${acm.deploymentTransaction().hash}`);
            console.log(`  ⏳ Waiting for confirmation...`);

            const receipt = await acm.deploymentTransaction().wait();
            const address = await acm.getAddress();

            state.deployedContracts.AccessControlManager = address;
            state.currentStep = 3;
            logTransaction(state, "AccessControlManager", receipt.hash, address, receipt.gasUsed);
            saveState(state);
        }

        // STEP 4: Deploy ProposalManagerV2
        if (state.currentStep === 3) {
            console.log(`${colors.magenta}[STEP 4/11] Deploying ProposalManagerV2${colors.reset}`);
            console.log(`${colors.cyan}Description:${colors.reset} Handles community governance proposals`);
            console.log();

            const ProposalMgr = await ethers.getContractFactory("ProposalManagerV2");
            console.log(`  ⏳ Sending transaction...`);

            const proposalMgr = await ProposalMgr.deploy(
                state.deployedContracts.MasterRegistry,
                TX_OPTIONS
            );
            console.log(`  ✅ Transaction sent: ${proposalMgr.deploymentTransaction().hash}`);
            console.log(`  ⏳ Waiting for confirmation...`);

            const receipt = await proposalMgr.deploymentTransaction().wait();
            const address = await proposalMgr.getAddress();

            state.deployedContracts.ProposalManagerV2 = address;
            state.currentStep = 4;
            logTransaction(state, "ProposalManagerV2", receipt.hash, address, receipt.gasUsed);
            saveState(state);
        }

        // STEP 5: Deploy FlexibleMarketFactory
        if (state.currentStep === 4) {
            console.log(`${colors.magenta}[STEP 5/11] Deploying FlexibleMarketFactory${colors.reset}`);
            console.log(`${colors.cyan}Description:${colors.reset} Creates prediction markets`);
            console.log();

            const Factory = await ethers.getContractFactory("FlexibleMarketFactory");
            console.log(`  ⏳ Sending transaction...`);

            const factory = await Factory.deploy(
                state.deployedContracts.MasterRegistry,
                DEPLOYMENT_CONFIG.minCreatorBond,
                TX_OPTIONS
            );
            console.log(`  ✅ Transaction sent: ${factory.deploymentTransaction().hash}`);
            console.log(`  ⏳ Waiting for confirmation...`);

            const receipt = await factory.deploymentTransaction().wait();
            const address = await factory.getAddress();

            state.deployedContracts.FlexibleMarketFactory = address;
            state.currentStep = 5;
            logTransaction(state, "FlexibleMarketFactory", receipt.hash, address, receipt.gasUsed);
            saveState(state);
        }

        // STEP 6: Deploy ResolutionManager
        if (state.currentStep === 5) {
            console.log(`${colors.magenta}[STEP 6/11] Deploying ResolutionManager${colors.reset}`);
            console.log(`${colors.cyan}Description:${colors.reset} Manages market resolution and disputes`);
            console.log();

            const Resolution = await ethers.getContractFactory("ResolutionManager");
            console.log(`  ⏳ Sending transaction...`);

            const resolution = await Resolution.deploy(
                state.deployedContracts.MasterRegistry,
                DEPLOYMENT_CONFIG.disputeWindow,
                DEPLOYMENT_CONFIG.minDisputeBond,
                TX_OPTIONS
            );
            console.log(`  ✅ Transaction sent: ${resolution.deploymentTransaction().hash}`);
            console.log(`  ⏳ Waiting for confirmation...`);

            const receipt = await resolution.deploymentTransaction().wait();
            const address = await resolution.getAddress();

            state.deployedContracts.ResolutionManager = address;
            state.currentStep = 6;
            logTransaction(state, "ResolutionManager", receipt.hash, address, receipt.gasUsed);
            saveState(state);
        }

        // STEP 7: Deploy RewardDistributor
        if (state.currentStep === 6) {
            console.log(`${colors.magenta}[STEP 7/11] Deploying RewardDistributor${colors.reset}`);
            console.log(`${colors.cyan}Description:${colors.reset} Distributes fees and rewards`);
            console.log();

            const Rewards = await ethers.getContractFactory("RewardDistributor");
            console.log(`  ⏳ Sending transaction...`);

            const rewards = await Rewards.deploy(
                state.deployedContracts.MasterRegistry,
                TX_OPTIONS
            );
            console.log(`  ✅ Transaction sent: ${rewards.deploymentTransaction().hash}`);
            console.log(`  ⏳ Waiting for confirmation...`);

            const receipt = await rewards.deploymentTransaction().wait();
            const address = await rewards.getAddress();

            state.deployedContracts.RewardDistributor = address;
            state.currentStep = 7;
            logTransaction(state, "RewardDistributor", receipt.hash, address, receipt.gasUsed);
            saveState(state);
        }

        console.log(`${colors.bright}${"=".repeat(70)}${colors.reset}`);
        console.log(`${colors.green}✅ ALL 7 CONTRACTS DEPLOYED SUCCESSFULLY!${colors.reset}`);
        console.log(`${colors.bright}${"=".repeat(70)}${colors.reset}\n`);

        // Display all deployed contracts
        console.log(`${colors.cyan}Deployed Contract Addresses:${colors.reset}`);
        Object.entries(state.deployedContracts).forEach(([name, address]) => {
            console.log(`  ${name}: ${address}`);
        });

        state.status = "contracts_deployed";
        saveState(state);

        console.log(`\n${colors.yellow}Next steps: Configuration (run this script again)${colors.reset}\n`);

    } catch (error) {
        console.error(`\n${colors.red}❌ DEPLOYMENT FAILED${colors.reset}`);
        console.error(`${colors.red}Error at step ${state.currentStep + 1}:${colors.reset}`, error.message);
        console.error(`\n${colors.yellow}State saved. You can resume by running this script again.${colors.reset}\n`);

        state.status = "failed";
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
