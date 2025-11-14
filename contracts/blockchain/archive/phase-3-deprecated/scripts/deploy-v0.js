const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// Color codes for console output
const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    red: "\x1b[31m",
    cyan: "\x1b[36m"
};

// Deployment configuration
const DEPLOYMENT_CONFIG = {
    // Module deployment order (dependencies first)
    deploymentOrder: [
        "MasterRegistry",
        "ParameterStorage",
        "AccessControlManager",
        "FlexibleMarketFactory",
        "ProposalManager",
        "PredictionMarket",     // Factory will deploy these
        "ResolutionManager",
        "RewardDistributor"
    ],

    // Initial parameters (from .env or defaults)
    parameters: {
        protocolFeeBps: process.env.INITIAL_PROTOCOL_FEE_BPS || 250,
        creatorFeeBps: process.env.INITIAL_CREATOR_FEE_BPS || 150,
        stakerIncentiveBps: process.env.INITIAL_STAKER_INCENTIVE_BPS || 50,
        treasuryFeeBps: process.env.INITIAL_TREASURY_FEE_BPS || 50,
        resolutionWindow: process.env.INITIAL_RESOLUTION_WINDOW || 172800,
        creatorBondAmount: process.env.INITIAL_CREATOR_BOND || "1000000000000000000",
        minBondAmount: process.env.INITIAL_MIN_BOND || "100000000000000000",
        marketCreationActive: true,
        experimentalMarketsActive: false,
        emergencyPause: false
    }
};

async function main() {
    console.log(`${colors.cyan}${colors.bright}
╔══════════════════════════════════════════════╗
║     KEKTECH 3.0 - V0 Bootstrap Deployment   ║
║            BasedAI Chain (Local)             ║
╚══════════════════════════════════════════════╝
${colors.reset}`);

    // Get signers
    const [deployer] = await hre.ethers.getSigners();
    console.log(`${colors.blue}Deployer address: ${deployer.address}${colors.reset}`);

    const balance = await deployer.getBalance();
    console.log(`${colors.blue}Deployer balance: ${hre.ethers.utils.formatEther(balance)} ETH${colors.reset}\n`);

    // Deployment tracking
    const deployedContracts = {};
    const deploymentInfo = {
        network: hre.network.name,
        chainId: hre.network.config.chainId,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        contracts: {},
        gasUsed: {},
        parameters: DEPLOYMENT_CONFIG.parameters
    };

    try {
        // ============= PHASE 1: Deploy Master Registry =============
        console.log(`${colors.yellow}[PHASE 1] Deploying Master Registry...${colors.reset}`);

        const MasterRegistry = await hre.ethers.getContractFactory("MasterRegistry");
        const masterRegistry = await MasterRegistry.deploy();
        await masterRegistry.deployed();

        deployedContracts.MasterRegistry = masterRegistry;
        deploymentInfo.contracts.MasterRegistry = masterRegistry.address;

        console.log(`${colors.green}✓ MasterRegistry deployed at: ${masterRegistry.address}${colors.reset}`);

        // ============= PHASE 2: Deploy Core Modules =============
        console.log(`\n${colors.yellow}[PHASE 2] Deploying Core Modules...${colors.reset}`);

        // Deploy ParameterStorage
        const ParameterStorage = await hre.ethers.getContractFactory("ParameterStorage");
        const parameterStorage = await ParameterStorage.deploy(masterRegistry.address);
        await parameterStorage.deployed();

        deployedContracts.ParameterStorage = parameterStorage;
        deploymentInfo.contracts.ParameterStorage = parameterStorage.address;

        console.log(`${colors.green}✓ ParameterStorage deployed at: ${parameterStorage.address}${colors.reset}`);

        // Deploy AccessControlManager
        const AccessControlManager = await hre.ethers.getContractFactory("AccessControlManager");
        const accessControl = await AccessControlManager.deploy(masterRegistry.address);
        await accessControl.deployed();

        deployedContracts.AccessControlManager = accessControl;
        deploymentInfo.contracts.AccessControlManager = accessControl.address;

        console.log(`${colors.green}✓ AccessControlManager deployed at: ${accessControl.address}${colors.reset}`);

        // ============= PHASE 3: Register Core Modules =============
        console.log(`\n${colors.yellow}[PHASE 3] Registering Core Modules in Registry...${colors.reset}`);

        const registrations = [
            {
                key: hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes("PARAMETER_STORAGE")),
                address: parameterStorage.address,
                name: "PARAMETER_STORAGE"
            },
            {
                key: hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes("ACCESS_CONTROL")),
                address: accessControl.address,
                name: "ACCESS_CONTROL"
            }
        ];

        // Batch registration for gas efficiency
        const keys = registrations.map(r => r.key);
        const addresses = registrations.map(r => r.address);

        const tx = await masterRegistry.batchSetContracts(keys, addresses);
        const receipt = await tx.wait();

        console.log(`${colors.green}✓ Core modules registered (Gas used: ${receipt.gasUsed})${colors.reset}`);

        // ============= PHASE 4: Deploy Market Modules =============
        console.log(`\n${colors.yellow}[PHASE 4] Deploying Market Modules...${colors.reset}`);

        // Deploy FlexibleMarketFactory
        const FlexibleMarketFactory = await hre.ethers.getContractFactory("FlexibleMarketFactory");
        const marketFactory = await FlexibleMarketFactory.deploy(masterRegistry.address);
        await marketFactory.deployed();

        deployedContracts.FlexibleMarketFactory = marketFactory;
        deploymentInfo.contracts.FlexibleMarketFactory = marketFactory.address;

        console.log(`${colors.green}✓ FlexibleMarketFactory deployed at: ${marketFactory.address}${colors.reset}`);

        // Deploy ProposalManager
        const ProposalManager = await hre.ethers.getContractFactory("ProposalManager");
        const proposalManager = await ProposalManager.deploy(masterRegistry.address);
        await proposalManager.deployed();

        deployedContracts.ProposalManager = proposalManager;
        deploymentInfo.contracts.ProposalManager = proposalManager.address;

        console.log(`${colors.green}✓ ProposalManager deployed at: ${proposalManager.address}${colors.reset}`);

        // Deploy ResolutionManager
        const ResolutionManager = await hre.ethers.getContractFactory("ResolutionManager");
        const resolutionManager = await ResolutionManager.deploy(masterRegistry.address);
        await resolutionManager.deployed();

        deployedContracts.ResolutionManager = resolutionManager;
        deploymentInfo.contracts.ResolutionManager = resolutionManager.address;

        console.log(`${colors.green}✓ ResolutionManager deployed at: ${resolutionManager.address}${colors.reset}`);

        // Deploy RewardDistributor
        const RewardDistributor = await hre.ethers.getContractFactory("RewardDistributor");
        const rewardDistributor = await RewardDistributor.deploy(masterRegistry.address);
        await rewardDistributor.deployed();

        deployedContracts.RewardDistributor = rewardDistributor;
        deploymentInfo.contracts.RewardDistributor = rewardDistributor.address;

        console.log(`${colors.green}✓ RewardDistributor deployed at: ${rewardDistributor.address}${colors.reset}`);

        // ============= PHASE 5: Register Market Modules =============
        console.log(`\n${colors.yellow}[PHASE 5] Registering Market Modules...${colors.reset}`);

        const marketRegistrations = [
            {
                key: hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes("MARKET_FACTORY")),
                address: marketFactory.address,
                name: "MARKET_FACTORY"
            },
            {
                key: hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes("PROPOSAL_MANAGER")),
                address: proposalManager.address,
                name: "PROPOSAL_MANAGER"
            },
            {
                key: hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes("RESOLUTION_MANAGER")),
                address: resolutionManager.address,
                name: "RESOLUTION_MANAGER"
            },
            {
                key: hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes("REWARD_DISTRIBUTOR")),
                address: rewardDistributor.address,
                name: "REWARD_DISTRIBUTOR"
            }
        ];

        const marketKeys = marketRegistrations.map(r => r.key);
        const marketAddresses = marketRegistrations.map(r => r.address);

        const tx2 = await masterRegistry.batchSetContracts(marketKeys, marketAddresses);
        const receipt2 = await tx2.wait();

        console.log(`${colors.green}✓ Market modules registered (Gas used: ${receipt2.gasUsed})${colors.reset}`);

        // ============= PHASE 6: Configure Parameters =============
        console.log(`\n${colors.yellow}[PHASE 6] Configuring Initial Parameters...${colors.reset}`);

        // Set initial parameters
        const paramConfig = DEPLOYMENT_CONFIG.parameters;

        await parameterStorage.setParameter("protocolFeeBps", paramConfig.protocolFeeBps);
        await parameterStorage.setParameter("creatorFeeBps", paramConfig.creatorFeeBps);
        await parameterStorage.setParameter("stakerIncentiveBps", paramConfig.stakerIncentiveBps);
        await parameterStorage.setParameter("treasuryFeeBps", paramConfig.treasuryFeeBps);
        await parameterStorage.setParameter("resolutionWindow", paramConfig.resolutionWindow);
        await parameterStorage.setParameter("creatorBondAmount", paramConfig.creatorBondAmount);

        console.log(`${colors.green}✓ Parameters configured${colors.reset}`);

        // ============= PHASE 7: Setup Access Control =============
        console.log(`\n${colors.yellow}[PHASE 7] Setting up Access Control...${colors.reset}`);

        const ADMIN_ROLE = hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes("ADMIN_ROLE"));
        const EMERGENCY_ROLE = hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes("EMERGENCY_ROLE"));

        await accessControl.grantRole(ADMIN_ROLE, deployer.address);
        await accessControl.grantRole(EMERGENCY_ROLE, deployer.address);

        console.log(`${colors.green}✓ Roles granted to deployer${colors.reset}`);

        // ============= PHASE 8: Verification & Testing =============
        console.log(`\n${colors.yellow}[PHASE 8] Running Deployment Verification...${colors.reset}`);

        // Verify all contracts are registered
        const registeredContracts = await masterRegistry.getAllContracts();
        console.log(`${colors.cyan}Total registered contracts: ${registeredContracts[0].length}${colors.reset}`);

        // Verify parameters
        const protocolFee = await parameterStorage.getParameter("protocolFeeBps");
        console.log(`${colors.cyan}Protocol fee: ${protocolFee} bps${colors.reset}`);

        // ============= PHASE 9: Save Deployment Info =============
        console.log(`\n${colors.yellow}[PHASE 9] Saving Deployment Information...${colors.reset}`);

        // Create deployments directory if it doesn't exist
        const deploymentsDir = path.join(__dirname, "../deployments");
        if (!fs.existsSync(deploymentsDir)) {
            fs.mkdirSync(deploymentsDir, { recursive: true });
        }

        // Save deployment info
        const fileName = `deployment-${hre.network.name}-${Date.now()}.json`;
        const filePath = path.join(deploymentsDir, fileName);

        fs.writeFileSync(filePath, JSON.stringify(deploymentInfo, null, 2));

        console.log(`${colors.green}✓ Deployment info saved to: ${fileName}${colors.reset}`);

        // ============= DEPLOYMENT COMPLETE =============
        console.log(`\n${colors.green}${colors.bright}
╔══════════════════════════════════════════════╗
║         DEPLOYMENT SUCCESSFUL! 🎉           ║
╚══════════════════════════════════════════════╝
${colors.reset}`);

        console.log(`${colors.cyan}Summary:${colors.reset}`);
        console.log(`  Network: ${hre.network.name}`);
        console.log(`  Chain ID: ${hre.network.config.chainId}`);
        console.log(`  Master Registry: ${masterRegistry.address}`);
        console.log(`  Total Modules: ${Object.keys(deployedContracts).length}`);
        console.log(`\n${colors.yellow}Next Steps:${colors.reset}`);
        console.log(`  1. Run integration tests: npm run test`);
        console.log(`  2. Verify deployment: npm run verify:local`);
        console.log(`  3. Create first market: npm run create:market`);

    } catch (error) {
        console.error(`\n${colors.red}Deployment failed:${colors.reset}`, error);
        process.exit(1);
    }
}

// Execute deployment
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });