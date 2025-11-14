const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * @title Multi-Network Progressive Deployment
 * @notice Deploys KEKTECH contracts progressively across networks
 * @dev Follows the pattern: Local → Sepolia → Fork → Testnet → Mainnet
 */

// Color codes for console output
const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    red: "\x1b[31m",
    cyan: "\x1b[36m",
    magenta: "\x1b[35m"
};

// Network configurations with specific settings
const NETWORK_CONFIGS = {
    localhost: {
        displayName: "Local Hardhat",
        chainId: 31337,
        confirmations: 1,
        gasPrice: 0,
        verify: false,
        tags: ["local", "development"]
    },
    sepolia: {
        displayName: "Ethereum Sepolia",
        chainId: 11155111,
        confirmations: 2,
        gasPrice: "auto",
        verify: true,
        tags: ["testnet", "public", "cheap"]
    },
    forkedBasedAI: {
        displayName: "Forked BasedAI Mainnet",
        chainId: 32323,
        confirmations: 1,
        gasPrice: 0,
        verify: false,
        tags: ["fork", "mainnet-simulation"]
    },
    basedai_testnet: {
        displayName: "BasedAI Testnet",
        chainId: 32324,
        confirmations: 3,
        gasPrice: "auto",
        verify: true,
        tags: ["testnet", "basedai"]
    },
    basedai_mainnet: {
        displayName: "BasedAI Mainnet",
        chainId: 32323,
        confirmations: 5,
        gasPrice: "auto",
        verify: true,
        tags: ["mainnet", "production"]
    }
};

// Deployment tracking
let deploymentResults = {};

async function main() {
    // Get network from command line or default to localhost
    const networkName = hre.network.name;
    const networkConfig = NETWORK_CONFIGS[networkName];

    if (!networkConfig) {
        console.error(`${colors.red}Unknown network: ${networkName}${colors.reset}`);
        console.log(`${colors.yellow}Available networks: ${Object.keys(NETWORK_CONFIGS).join(", ")}${colors.reset}`);
        process.exit(1);
    }

    console.log(`${colors.cyan}${colors.bright}
╔══════════════════════════════════════════════╗
║     KEKTECH 3.0 Multi-Network Deployment    ║
║            ${networkConfig.displayName.padEnd(30)} ║
╚══════════════════════════════════════════════╝
${colors.reset}`);

    // Display network information
    console.log(`${colors.blue}Network: ${networkConfig.displayName}${colors.reset}`);
    console.log(`${colors.blue}Chain ID: ${networkConfig.chainId}${colors.reset}`);
    console.log(`${colors.blue}Tags: ${networkConfig.tags.join(", ")}${colors.reset}\n`);

    // Get signers
    const [deployer] = await hre.ethers.getSigners();
    console.log(`${colors.yellow}Deployer: ${deployer.address}${colors.reset}`);

    // Check balance
    const balance = await deployer.getBalance();
    console.log(`${colors.yellow}Balance: ${hre.ethers.utils.formatEther(balance)} ETH${colors.reset}\n`);

    // Network-specific checks
    if (networkName === "basedai_mainnet") {
        await confirmMainnetDeployment();
    }

    // Start deployment
    deploymentResults = {
        network: networkName,
        chainId: networkConfig.chainId,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        contracts: {},
        gasUsed: {},
        verified: {}
    };

    try {
        // Deploy contracts based on network
        if (networkConfig.tags.includes("mainnet") || networkConfig.tags.includes("production")) {
            await deployProduction(deployer, networkConfig);
        } else {
            await deployDevelopment(deployer, networkConfig);
        }

        // Save deployment results
        await saveDeploymentResults(networkName);

        // Display summary
        displayDeploymentSummary(networkName, networkConfig);

    } catch (error) {
        console.error(`${colors.red}Deployment failed:${colors.reset}`, error);
        process.exit(1);
    }
}

async function deployDevelopment(deployer, networkConfig) {
    console.log(`${colors.cyan}Starting DEVELOPMENT deployment...${colors.reset}\n`);

    // Phase 1: Core Infrastructure
    console.log(`${colors.yellow}[PHASE 1] Deploying Core Infrastructure${colors.reset}`);

    const MasterRegistry = await hre.ethers.getContractFactory("MasterRegistry");
    const registry = await MasterRegistry.deploy();
    await registry.deployed();
    await registry.deployTransaction.wait(networkConfig.confirmations);

    deploymentResults.contracts.MasterRegistry = registry.address;
    console.log(`${colors.green}✓ MasterRegistry: ${registry.address}${colors.reset}`);

    // Phase 2: Deploy other core modules
    console.log(`\n${colors.yellow}[PHASE 2] Deploying Core Modules${colors.reset}`);

    // ParameterStorage (if exists)
    try {
        const ParameterStorage = await hre.ethers.getContractFactory("ParameterStorage");
        const params = await ParameterStorage.deploy(registry.address);
        await params.deployed();
        await params.deployTransaction.wait(networkConfig.confirmations);

        deploymentResults.contracts.ParameterStorage = params.address;
        console.log(`${colors.green}✓ ParameterStorage: ${params.address}${colors.reset}`);

        // Register in registry
        const PARAM_KEY = hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes("PARAMETER_STORAGE"));
        await registry.setContract(PARAM_KEY, params.address);
    } catch (error) {
        console.log(`${colors.yellow}⚠ ParameterStorage not found (implement later)${colors.reset}`);
    }

    // Verification if enabled
    if (networkConfig.verify && hre.network.name !== "localhost" && hre.network.name !== "forkedBasedAI") {
        console.log(`\n${colors.yellow}[PHASE 3] Verifying Contracts${colors.reset}`);
        await verifyContracts(deploymentResults.contracts, networkConfig);
    }
}

async function deployProduction(deployer, networkConfig) {
    console.log(`${colors.red}${colors.bright}⚠️  PRODUCTION DEPLOYMENT ⚠️${colors.reset}\n`);

    // Additional safety checks
    const confirmations = await promptConfirmation(
        "Are you SURE you want to deploy to MAINNET? This will use real funds!"
    );

    if (!confirmations) {
        console.log(`${colors.yellow}Deployment cancelled${colors.reset}`);
        process.exit(0);
    }

    // Check multisig setup
    const multisigAddress = process.env.MAINNET_MULTISIG;
    if (!multisigAddress || multisigAddress === "0x0000000000000000000000000000000000000000") {
        console.error(`${colors.red}ERROR: Multisig address not configured${colors.reset}`);
        process.exit(1);
    }

    console.log(`${colors.cyan}Multisig Address: ${multisigAddress}${colors.reset}\n`);

    // Deploy with production parameters
    await deployDevelopment(deployer, networkConfig);

    // Transfer ownership to multisig
    console.log(`\n${colors.yellow}[FINAL] Transferring ownership to multisig${colors.reset}`);

    const registry = await hre.ethers.getContractAt(
        "MasterRegistry",
        deploymentResults.contracts.MasterRegistry
    );

    const tx = await registry.transferOwnership(multisigAddress);
    await tx.wait(networkConfig.confirmations);

    console.log(`${colors.green}✓ Ownership transferred to: ${multisigAddress}${colors.reset}`);
}

async function verifyContracts(contracts, networkConfig) {
    for (const [name, address] of Object.entries(contracts)) {
        try {
            console.log(`${colors.blue}Verifying ${name}...${colors.reset}`);

            await hre.run("verify:verify", {
                address: address,
                constructorArguments: name === "MasterRegistry" ? [] : [contracts.MasterRegistry]
            });

            deploymentResults.verified[name] = true;
            console.log(`${colors.green}✓ ${name} verified${colors.reset}`);
        } catch (error) {
            console.log(`${colors.yellow}⚠ ${name} verification failed: ${error.message}${colors.reset}`);
            deploymentResults.verified[name] = false;
        }
    }
}

async function saveDeploymentResults(networkName) {
    const deploymentsDir = path.join(__dirname, "../../deployments");
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const fileName = `deployment-${networkName}-${Date.now()}.json`;
    const filePath = path.join(deploymentsDir, fileName);

    fs.writeFileSync(filePath, JSON.stringify(deploymentResults, null, 2));

    console.log(`\n${colors.green}Deployment saved: ${fileName}${colors.reset}`);

    // Also save a "latest" file for easy access
    const latestPath = path.join(deploymentsDir, `deployment-${networkName}-latest.json`);
    fs.writeFileSync(latestPath, JSON.stringify(deploymentResults, null, 2));
}

function displayDeploymentSummary(networkName, networkConfig) {
    console.log(`\n${colors.green}${colors.bright}
╔══════════════════════════════════════════════╗
║         DEPLOYMENT SUCCESSFUL! 🎉           ║
╚══════════════════════════════════════════════╝
${colors.reset}`);

    console.log(`${colors.cyan}Summary:${colors.reset}`);
    console.log(`  Network: ${networkConfig.displayName}`);
    console.log(`  Chain ID: ${networkConfig.chainId}`);
    console.log(`  Contracts Deployed: ${Object.keys(deploymentResults.contracts).length}`);

    console.log(`\n${colors.cyan}Deployed Contracts:${colors.reset}`);
    for (const [name, address] of Object.entries(deploymentResults.contracts)) {
        const verified = deploymentResults.verified[name] ? "✓" : "✗";
        console.log(`  ${name}: ${address} ${verified}`);
    }

    // Network-specific next steps
    console.log(`\n${colors.yellow}Next Steps:${colors.reset}`);

    if (networkName === "localhost") {
        console.log(`  1. Run tests: npm test`);
        console.log(`  2. Deploy to Sepolia: npm run deploy:sepolia`);
    } else if (networkName === "sepolia") {
        console.log(`  1. Test on Sepolia Explorer`);
        console.log(`  2. Deploy to fork: npm run deploy:fork`);
    } else if (networkName === "forkedBasedAI") {
        console.log(`  1. Run integration tests on fork`);
        console.log(`  2. Deploy to testnet: npm run deploy:testnet`);
    } else if (networkName === "basedai_testnet") {
        console.log(`  1. Community testing period`);
        console.log(`  2. Bug bounty program`);
        console.log(`  3. Prepare for mainnet: npm run deploy:mainnet`);
    } else if (networkName === "basedai_mainnet") {
        console.log(`  1. Verify multisig control`);
        console.log(`  2. Monitor contract activity`);
        console.log(`  3. Enable public access`);
    }
}

async function confirmMainnetDeployment() {
    console.log(`${colors.red}${colors.bright}
╔══════════════════════════════════════════════╗
║           ⚠️  MAINNET WARNING ⚠️              ║
║                                              ║
║   You are about to deploy to MAINNET!       ║
║   This will use real funds and is           ║
║   IRREVERSIBLE!                              ║
║                                              ║
║   Checklist:                                 ║
║   □ All tests passing                       ║
║   □ Security audit complete                 ║
║   □ Gas optimization done                   ║
║   □ Multisig configured                     ║
║   □ Team approval received                  ║
╚══════════════════════════════════════════════╝
${colors.reset}`);

    // Add a delay to make sure user reads warning
    await new Promise(resolve => setTimeout(resolve, 3000));
}

async function promptConfirmation(message) {
    const readline = require("readline").createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        readline.question(`${colors.yellow}${message} (yes/no): ${colors.reset}`, (answer) => {
            readline.close();
            resolve(answer.toLowerCase() === "yes");
        });
    });
}

// Execute deployment
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });