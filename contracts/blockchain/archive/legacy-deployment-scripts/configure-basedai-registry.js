const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m'
};

// Load deployment state
const STATE_FILE = path.join(__dirname, "../../basedai-mainnet-deployment.json");

// Configuration
const CONFIG = {
    CONFIRMATIONS: 2,
    DELAY_BETWEEN_TXS: 30000,  // 30 seconds
    GAS_LIMIT: 5000000          // 5M gas limit
};

// Helper: Delay
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    console.log(`${colors.bright}${colors.cyan}╔═══════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}║         🔧 BASEDAI REGISTRY CONFIGURATION                ║${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}╚═══════════════════════════════════════════════════════════╝${colors.reset}\n`);

    // Load deployment state
    if (!fs.existsSync(STATE_FILE)) {
        console.log(`${colors.red}❌ ERROR: Deployment state file not found!${colors.reset}`);
        console.log(`${colors.red}   Expected: ${STATE_FILE}${colors.reset}`);
        console.log(`${colors.red}   Run deployment script first!${colors.reset}\n`);
        process.exit(1);
    }

    const deploymentState = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));

    // Verify all contracts are deployed
    const requiredContracts = [
        "VersionedRegistry",
        "ParameterStorage",
        "AccessControlManager",
        "ResolutionManager",
        "RewardDistributor",
        "FlexibleMarketFactoryUnified",
        "PredictionMarketTemplate",
        "CurveRegistry",
        "MarketTemplateRegistry"
    ];

    console.log(`${colors.cyan}Verifying deployment state...${colors.reset}`);
    for (const contract of requiredContracts) {
        if (!deploymentState.contracts[contract]) {
            console.log(`${colors.red}❌ ERROR: ${contract} not found in deployment state!${colors.reset}\n`);
            process.exit(1);
        }
        console.log(`${colors.green}   ✅ ${contract}${colors.reset}`);
    }
    console.log();

    // Get network info
    const [deployer] = await ethers.getSigners();
    const balance = await ethers.provider.getBalance(deployer.address);
    const network = await ethers.provider.getNetwork();

    console.log(`${colors.bright}Deployer:${colors.reset} ${deployer.address}`);
    console.log(`${colors.bright}Balance:${colors.reset}  ${ethers.formatEther(balance)} $BASED`);
    console.log(`${colors.bright}Network:${colors.reset}  ${network.name} (Chain ID: ${network.chainId})\n`);

    // SAFETY CHECK: Confirm correct network
    if (network.chainId !== 32323n) {
        console.log(`${colors.red}❌ ERROR: Wrong network! Expected Chain ID 32323, got ${network.chainId}${colors.reset}`);
        console.log(`${colors.red}   CONFIGURATION STOPPED${colors.reset}\n`);
        process.exit(1);
    }

    console.log(`${colors.green}✅ Pre-flight checks passed${colors.reset}\n`);
    console.log(`${colors.yellow}⚠️  ULTRA-CONSERVATIVE MODE: Will stop at ANY issue${colors.reset}\n`);

    // Get registry instance
    const registry = await ethers.getContractAt(
        "VersionedRegistry",
        deploymentState.contracts.VersionedRegistry
    );

    // Get gas price
    const feeData = await ethers.provider.getFeeData();
    const gasPrice = feeData.gasPrice || ethers.parseUnits("10", "gwei");

    // Gas options
    const gasOptions = {
        gasLimit: CONFIG.GAS_LIMIT,
        gasPrice: gasPrice
    };

    // Contracts to register (excluding VersionedRegistry itself)
    const contractsToRegister = [
        { name: "AccessControlManager", key: "AccessControlManager" },
        { name: "ResolutionManager", key: "ResolutionManager" },
        { name: "ParameterStorage", key: "ParameterStorage" },
        { name: "RewardDistributor", key: "RewardDistributor" },
        { name: "MarketFactory", key: "FlexibleMarketFactoryUnified" },
        { name: "PredictionMarket", key: "PredictionMarketTemplate" },
        { name: "CurveRegistry", key: "CurveRegistry" },
        { name: "MarketTemplateRegistry", key: "MarketTemplateRegistry" }
    ];

    try {
        console.log(`${colors.bright}${colors.cyan}Registering contracts in VersionedRegistry...${colors.reset}\n`);

        let registeredCount = 0;

        for (const contract of contractsToRegister) {
            console.log(`${colors.cyan}📝 Registering ${contract.name}...${colors.reset}`);

            // Check if already registered
            try {
                const existingAddress = await registry.getContract(ethers.id(contract.name));
                if (existingAddress !== ethers.ZeroAddress) {
                    console.log(`${colors.green}   ✅ Already registered at ${existingAddress}${colors.reset}\n`);
                    registeredCount++;
                    continue;
                }
            } catch (error) {
                // Not registered yet, continue
            }

            // Register contract at version 1
            const address = deploymentState.contracts[contract.key];
            const tx = await registry.setContract(ethers.id(contract.name), address, 1);

            console.log(`${colors.dim}   ⏳ Waiting for ${CONFIG.CONFIRMATIONS} confirmations...${colors.reset}`);
            const receipt = await tx.wait(CONFIG.CONFIRMATIONS);
            console.log(`${colors.green}   ✅ Registered at: ${address}${colors.reset}`);
            console.log(`${colors.dim}   📋 Block: ${receipt.blockNumber}, Gas Used: ${receipt.gasUsed.toString()}${colors.reset}\n`);

            registeredCount++;
            await delay(CONFIG.DELAY_BETWEEN_TXS);
        }

        // Update deployment state
        deploymentState.status = "REGISTRY_CONFIGURED";
        deploymentState.timestamp = new Date().toISOString();
        deploymentState.note = "All contracts registered in VersionedRegistry successfully.";
        fs.writeFileSync(STATE_FILE, JSON.stringify(deploymentState, null, 2));

        console.log(`${colors.green}${colors.bright}╔═══════════════════════════════════════════════════════════╗${colors.reset}`);
        console.log(`${colors.green}${colors.bright}║       ✅ REGISTRY CONFIGURATION COMPLETE! ✅             ║${colors.reset}`);
        console.log(`${colors.green}${colors.bright}╚═══════════════════════════════════════════════════════════╝${colors.reset}\n`);

        console.log(`${colors.cyan}Registered ${registeredCount}/8 contracts in VersionedRegistry${colors.reset}\n`);

        // Verify all registrations
        console.log(`${colors.bright}${colors.cyan}📋 Verification:${colors.reset}`);
        console.log(`${colors.dim}────────────────────────────────────────────────────────────${colors.reset}`);

        for (const contract of contractsToRegister) {
            const address = await registry.getContract(ethers.id(contract.name));
            const version = await registry.getContractVersion(ethers.id(contract.name));
            console.log(`${colors.bright}${contract.name}:${colors.reset}`);
            console.log(`   ${address} (v${version})`);
        }
        console.log(`${colors.dim}────────────────────────────────────────────────────────────${colors.reset}\n`);

        console.log(`${colors.yellow}⚠️  NEXT STEP: Create first test market${colors.reset}`);
        console.log(`${colors.dim}   npx hardhat run scripts/create-test-market-mainnet.js --network basedai_mainnet${colors.reset}\n`);

    } catch (error) {
        console.log(`${colors.red}${colors.bright}\n╔═══════════════════════════════════════════════════════════╗${colors.reset}`);
        console.log(`${colors.red}${colors.bright}║            ❌ CONFIGURATION FAILED ❌                     ║${colors.reset}`);
        console.log(`${colors.red}${colors.bright}╚═══════════════════════════════════════════════════════════╝${colors.reset}\n`);

        console.log(`${colors.red}Error: ${error.message}${colors.reset}\n`);

        deploymentState.status = "CONFIGURATION_FAILED";
        deploymentState.error = error.message;
        deploymentState.timestamp = new Date().toISOString();
        fs.writeFileSync(STATE_FILE, JSON.stringify(deploymentState, null, 2));

        console.log(`${colors.yellow}State saved. Review error and retry.${colors.reset}\n`);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
