const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * @title Ultra-Cautious Sepolia Deployment
 * @notice Deploys contracts ONE AT A TIME with verification at each step
 * @dev Maximum safety: verify, save, backup after EACH deployment
 */

const DEPLOYMENT_LOG = path.join(__dirname, "../../deployments/sepolia-deployment.json");
const BACKUP_LOG = path.join(__dirname, "../../deployments/sepolia-backup.txt");
const ENV_FILE = path.join(__dirname, "../../.env");

// Ensure deployments directory exists
const deploymentsDir = path.join(__dirname, "../../deployments");
if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
}

// Colors
const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    red: "\x1b[31m",
    cyan: "\x1b[36m"
};

let deploymentState = {
    network: "sepolia",
    chainId: 11155111,
    deployer: "",
    timestamp: new Date().toISOString(),
    contracts: {},
    gasUsed: "0",
    totalCost: "0"
};

// Load existing state if any
function loadState() {
    if (fs.existsSync(DEPLOYMENT_LOG)) {
        try {
            const existing = JSON.parse(fs.readFileSync(DEPLOYMENT_LOG, "utf8"));
            console.log(`${colors.yellow}⚠️  Found existing deployment state${colors.reset}`);
            console.log(`${colors.yellow}   Timestamp: ${existing.timestamp}${colors.reset}`);
            console.log(`${colors.yellow}   Contracts: ${Object.keys(existing.contracts).length}${colors.reset}\n`);

            // Ask if we should continue or start fresh
            deploymentState = existing;
            return true;
        } catch (e) {
            console.log(`${colors.red}❌ Could not load existing state: ${e.message}${colors.reset}\n`);
        }
    }
    return false;
}

// Save state immediately
function saveState() {
    try {
        // Save as JSON
        fs.writeFileSync(
            DEPLOYMENT_LOG,
            JSON.stringify(deploymentState, null, 2),
            "utf8"
        );

        // Save as human-readable backup
        const backup = [
            `KEKTECH 3.0 Sepolia Deployment`,
            `Timestamp: ${deploymentState.timestamp}`,
            `Deployer: ${deploymentState.deployer}`,
            `Network: ${deploymentState.network} (Chain ID: ${deploymentState.chainId})`,
            ``,
            `DEPLOYED CONTRACTS:`,
            `==================`,
            ...Object.entries(deploymentState.contracts).map(([name, data]) =>
                `${name}:\n  Address: ${data.address}\n  TX Hash: ${data.txHash}\n  Block: ${data.blockNumber}\n  Gas Used: ${data.gasUsed}\n`
            ),
            ``,
            `TOTAL GAS USED: ${deploymentState.gasUsed}`,
            `TOTAL COST: ${deploymentState.totalCost} ETH`
        ].join('\n');

        fs.writeFileSync(BACKUP_LOG, backup, "utf8");

        console.log(`${colors.green}💾 State saved to: ${DEPLOYMENT_LOG}${colors.reset}`);
        console.log(`${colors.green}💾 Backup saved to: ${BACKUP_LOG}${colors.reset}\n`);

        return true;
    } catch (e) {
        console.log(`${colors.red}❌ ERROR saving state: ${e.message}${colors.reset}\n`);
        return false;
    }
}

// Verify contract exists on blockchain
async function verifyContractExists(address, name) {
    console.log(`${colors.blue}🔍 Verifying ${name} on blockchain...${colors.reset}`);

    try {
        const code = await hre.ethers.provider.getCode(address);

        if (code === "0x" || code === "0x0") {
            console.log(`${colors.red}❌ NO CODE at address ${address}${colors.reset}`);
            return false;
        }

        const codeLength = code.length;
        console.log(`${colors.green}✅ Contract verified! Code length: ${codeLength} bytes${colors.reset}\n`);
        return true;
    } catch (e) {
        console.log(`${colors.red}❌ Verification failed: ${e.message}${colors.reset}\n`);
        return false;
    }
}

// Deploy a single contract with full verification
async function deploySingleContract(name, contractName, constructorArgs = [], deployer) {
    console.log(`\n${colors.cyan}${colors.bright}═══════════════════════════════════════${colors.reset}`);
    console.log(`${colors.cyan}${colors.bright}  Deploying: ${name}${colors.reset}`);
    console.log(`${colors.cyan}${colors.bright}═══════════════════════════════════════${colors.reset}\n`);

    // Check if already deployed
    if (deploymentState.contracts[name]) {
        console.log(`${colors.yellow}⚠️  ${name} already deployed!${colors.reset}`);
        console.log(`${colors.yellow}   Address: ${deploymentState.contracts[name].address}${colors.reset}`);

        // Verify it still exists
        const exists = await verifyContractExists(deploymentState.contracts[name].address, name);
        if (exists) {
            console.log(`${colors.green}✅ Using existing deployment${colors.reset}\n`);
            return deploymentState.contracts[name].address;
        } else {
            console.log(`${colors.red}❌ Contract no longer exists! Redeploying...${colors.reset}\n`);
        }
    }

    try {
        // Get contract factory
        console.log(`${colors.blue}📋 Getting contract factory...${colors.reset}`);
        const ContractFactory = await hre.ethers.getContractFactory(contractName);

        // Estimate gas
        console.log(`${colors.blue}⛽ Estimating deployment gas...${colors.reset}`);
        const deployTx = ContractFactory.getDeployTransaction(...constructorArgs);
        const gasEstimate = await deployer.estimateGas(deployTx);
        const gasPrice = await hre.ethers.provider.getFeeData();

        const estimatedCost = gasEstimate * gasPrice.gasPrice;
        console.log(`   Gas Estimate: ${gasEstimate.toString()}`);
        console.log(`   Gas Price: ${hre.ethers.formatUnits(gasPrice.gasPrice, "gwei")} gwei`);
        console.log(`   Estimated Cost: ${hre.ethers.formatEther(estimatedCost)} ETH\n`);

        // Deploy
        console.log(`${colors.yellow}🚀 Deploying contract...${colors.reset}`);
        const contract = await ContractFactory.deploy(...constructorArgs);

        console.log(`${colors.yellow}⏳ Waiting for deployment transaction...${colors.reset}`);
        const deploymentTx = contract.deploymentTransaction();
        console.log(`   TX Hash: ${deploymentTx.hash}\n`);

        // Wait for confirmation
        console.log(`${colors.yellow}⏳ Waiting for confirmation (2 blocks)...${colors.reset}`);
        await contract.waitForDeployment();

        const address = await contract.getAddress();
        const receipt = await deploymentTx.wait(2); // Wait for 2 confirmations

        console.log(`${colors.green}✅ Contract deployed!${colors.reset}`);
        console.log(`   Address: ${address}`);
        console.log(`   Block: ${receipt.blockNumber}`);
        console.log(`   Gas Used: ${receipt.gasUsed.toString()}`);
        console.log(`   Cost: ${hre.ethers.formatEther(receipt.gasUsed * deploymentTx.gasPrice)} ETH\n`);

        // IMMEDIATE VERIFICATION
        const verified = await verifyContractExists(address, name);
        if (!verified) {
            throw new Error(`Contract deployment failed verification!`);
        }

        // Save state IMMEDIATELY
        deploymentState.contracts[name] = {
            address: address,
            contractName: contractName,
            constructorArgs: constructorArgs,
            txHash: deploymentTx.hash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString(),
            cost: hre.ethers.formatEther(receipt.gasUsed * deploymentTx.gasPrice),
            verified: true,
            timestamp: new Date().toISOString()
        };

        // Update totals
        const totalGas = Object.values(deploymentState.contracts)
            .reduce((sum, c) => sum + BigInt(c.gasUsed), 0n);
        const totalCost = Object.values(deploymentState.contracts)
            .reduce((sum, c) => sum + parseFloat(c.cost), 0);

        deploymentState.gasUsed = totalGas.toString();
        deploymentState.totalCost = totalCost.toFixed(6);

        // SAVE STATE
        const saved = saveState();
        if (!saved) {
            console.log(`${colors.red}⚠️  WARNING: Could not save deployment state!${colors.reset}`);
            console.log(`${colors.red}   MANUALLY RECORD THIS ADDRESS: ${address}${colors.reset}\n`);
        }

        // Small delay to ensure blockchain sync
        console.log(`${colors.blue}⏳ Waiting 5 seconds for blockchain propagation...${colors.reset}`);
        await new Promise(resolve => setTimeout(resolve, 5000));

        return address;

    } catch (error) {
        console.log(`${colors.red}❌ Deployment failed: ${error.message}${colors.reset}\n`);
        throw error;
    }
}

async function main() {
    console.log(`${colors.cyan}${colors.bright}
╔══════════════════════════════════════════════╗
║   KEKTECH 3.0 Ultra-Cautious Deployment     ║
║           Sepolia Testnet                    ║
╚══════════════════════════════════════════════╝
${colors.reset}\n`);

    // Load existing state
    const hasExisting = loadState();

    // Get deployer
    const [deployer] = await hre.ethers.getSigners();
    deploymentState.deployer = deployer.address;

    console.log(`${colors.yellow}👤 Deployer: ${deployer.address}${colors.reset}`);

    const balance = await deployer.provider.getBalance(deployer.address);
    console.log(`${colors.yellow}💰 Balance: ${hre.ethers.formatEther(balance)} ETH${colors.reset}\n`);

    if (balance < hre.ethers.parseEther("0.3")) {
        console.log(`${colors.red}⚠️  WARNING: Balance may be insufficient!${colors.reset}`);
        console.log(`${colors.red}   Recommended: 0.3 ETH minimum${colors.reset}\n`);
    }

    // Deploy contracts one by one
    try {
        console.log(`${colors.bright}Starting deployment sequence...${colors.reset}\n`);

        // 1. MasterRegistry
        const masterRegistry = await deploySingleContract(
            "MasterRegistry",
            "MasterRegistry",
            [],
            deployer
        );

        // 2. AccessControlManager
        const accessControl = await deploySingleContract(
            "AccessControlManager",
            "AccessControlManager",
            [masterRegistry],
            deployer
        );

        // 3. ParameterStorage
        const parameterStorage = await deploySingleContract(
            "ParameterStorage",
            "ParameterStorage",
            [masterRegistry],
            deployer
        );

        // 4. ProposalManagerV2
        const proposalManager = await deploySingleContract(
            "ProposalManagerV2",
            "ProposalManagerV2",
            [masterRegistry],
            deployer
        );

        // 5. FlexibleMarketFactory (registry, minCreatorBond)
        const minCreatorBond = hre.ethers.parseEther("0.01"); // 0.01 ETH
        const marketFactory = await deploySingleContract(
            "FlexibleMarketFactory",
            "FlexibleMarketFactory",
            [masterRegistry, minCreatorBond],
            deployer
        );

        // 6. ResolutionManager (registry, disputeWindow, minDisputeBond)
        const disputeWindow = 7 * 24 * 60 * 60; // 7 days in seconds
        const minDisputeBond = hre.ethers.parseEther("0.01"); // 0.01 ETH
        const resolutionManager = await deploySingleContract(
            "ResolutionManager",
            "ResolutionManager",
            [masterRegistry, disputeWindow, minDisputeBond],
            deployer
        );

        // 7. RewardDistributor
        const rewardDistributor = await deploySingleContract(
            "RewardDistributor",
            "RewardDistributor",
            [masterRegistry],
            deployer
        );

        // 8. PredictionMarket (implementation)
        const predictionMarket = await deploySingleContract(
            "PredictionMarket",
            "PredictionMarket",
            [],
            deployer
        );

        // Final summary
        console.log(`\n${colors.green}${colors.bright}═══════════════════════════════════════${colors.reset}`);
        console.log(`${colors.green}${colors.bright}  ✅ ALL CONTRACTS DEPLOYED!${colors.reset}`);
        console.log(`${colors.green}${colors.bright}═══════════════════════════════════════${colors.reset}\n`);

        console.log(`${colors.cyan}📊 DEPLOYMENT SUMMARY:${colors.reset}\n`);
        Object.entries(deploymentState.contracts).forEach(([name, data]) => {
            console.log(`${colors.bright}${name}:${colors.reset}`);
            console.log(`  Address: ${data.address}`);
            console.log(`  TX: ${data.txHash}`);
            console.log(`  Cost: ${data.cost} ETH\n`);
        });

        console.log(`${colors.cyan}💰 Total Gas Used: ${deploymentState.gasUsed}${colors.reset}`);
        console.log(`${colors.cyan}💰 Total Cost: ${deploymentState.totalCost} ETH${colors.reset}\n`);

        // Update .env file
        console.log(`${colors.yellow}📝 Updating .env file...${colors.reset}`);
        let envContent = fs.readFileSync(ENV_FILE, "utf8");

        Object.entries(deploymentState.contracts).forEach(([name, data]) => {
            const envKey = `${name.replace(/([A-Z])/g, '_$1').toUpperCase().substring(1)}_ADDRESS`;
            const regex = new RegExp(`${envKey}=.*`, 'g');
            if (regex.test(envContent)) {
                envContent = envContent.replace(regex, `${envKey}=${data.address}`);
            } else {
                envContent += `\n${envKey}=${data.address}`;
            }
        });

        fs.writeFileSync(ENV_FILE, envContent, "utf8");
        console.log(`${colors.green}✅ .env file updated!${colors.reset}\n`);

        // Final verification
        console.log(`${colors.yellow}🔍 Running final verification...${colors.reset}\n`);
        let allVerified = true;
        for (const [name, data] of Object.entries(deploymentState.contracts)) {
            const verified = await verifyContractExists(data.address, name);
            if (!verified) {
                allVerified = false;
                console.log(`${colors.red}❌ ${name} verification FAILED!${colors.reset}`);
            }
        }

        if (allVerified) {
            console.log(`${colors.green}${colors.bright}\n✅ ALL CONTRACTS VERIFIED ON BLOCKCHAIN!${colors.reset}\n`);
        } else {
            console.log(`${colors.red}${colors.bright}\n⚠️  Some contracts failed verification!${colors.reset}\n`);
        }

        console.log(`${colors.cyan}📁 Deployment records saved to:${colors.reset}`);
        console.log(`   - ${DEPLOYMENT_LOG}`);
        console.log(`   - ${BACKUP_LOG}\n`);

        console.log(`${colors.green}✅ Deployment complete!${colors.reset}\n`);

    } catch (error) {
        console.log(`${colors.red}${colors.bright}\n❌ DEPLOYMENT FAILED!${colors.reset}`);
        console.log(`${colors.red}Error: ${error.message}${colors.reset}\n`);

        console.log(`${colors.yellow}📋 Partial deployment state saved${colors.reset}`);
        console.log(`${colors.yellow}   Check: ${DEPLOYMENT_LOG}${colors.reset}\n`);

        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
