const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * @title Deploy to BasedAI Fork - Using Sepolia as Template
 * @notice Deploys all contracts to local BasedAI fork for comprehensive testing
 * @dev This allows unlimited free testing before mainnet deployment
 */

const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    cyan: "\x1b[36m",
    magenta: "\x1b[35m",
    bright: "\x1b[1m"
};

async function main() {
    console.log(`${colors.cyan}${colors.bright}
╔══════════════════════════════════════════════════════╗
║   KEKTECH 3.0 - BasedAI Fork Deployment             ║
║   Local Testing Environment Setup                    ║
╚══════════════════════════════════════════════════════╝
${colors.reset}\n`);

    const [deployer] = await hre.ethers.getSigners();

    console.log(`${colors.yellow}🔧 Deployment Configuration:${colors.reset}`);
    console.log(`   Network: ${hre.network.name}`);
    console.log(`   Chain ID: ${(await hre.ethers.provider.getNetwork()).chainId}`);
    console.log(`   Deployer: ${deployer.address}`);

    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log(`   Balance: ${hre.ethers.formatEther(balance)} ETH`);
    console.log('');

    const deployedContracts = {};

    try {
        // ========================================
        // STEP 1: Deploy MasterRegistry
        // ========================================
        console.log(`${colors.cyan}${colors.bright}STEP 1/8: Deploying MasterRegistry${colors.reset}\n`);

        const MasterRegistry = await hre.ethers.getContractFactory("MasterRegistry");
        const masterRegistry = await MasterRegistry.deploy();
        await masterRegistry.waitForDeployment();

        deployedContracts.masterRegistry = await masterRegistry.getAddress();
        console.log(`${colors.green}✅ MasterRegistry deployed: ${deployedContracts.masterRegistry}${colors.reset}\n`);

        // ========================================
        // STEP 2: Deploy AccessControlManager
        // ========================================
        console.log(`${colors.cyan}${colors.bright}STEP 2/8: Deploying AccessControlManager${colors.reset}\n`);

        const AccessControlManager = await hre.ethers.getContractFactory("AccessControlManager");
        const accessControl = await AccessControlManager.deploy(deployedContracts.masterRegistry);
        await accessControl.waitForDeployment();

        deployedContracts.accessControl = await accessControl.getAddress();
        console.log(`${colors.green}✅ AccessControlManager deployed: ${deployedContracts.accessControl}${colors.reset}\n`);

        // ========================================
        // STEP 3: Deploy ParameterStorage
        // ========================================
        console.log(`${colors.cyan}${colors.bright}STEP 3/8: Deploying ParameterStorage${colors.reset}\n`);

        const ParameterStorage = await hre.ethers.getContractFactory("ParameterStorage");
        const parameterStorage = await ParameterStorage.deploy(deployedContracts.masterRegistry);
        await parameterStorage.waitForDeployment();

        deployedContracts.parameterStorage = await parameterStorage.getAddress();
        console.log(`${colors.green}✅ ParameterStorage deployed: ${deployedContracts.parameterStorage}${colors.reset}\n`);

        // ========================================
        // STEP 4: Deploy ProposalManagerV2
        // ========================================
        console.log(`${colors.cyan}${colors.bright}STEP 4/8: Deploying ProposalManagerV2${colors.reset}\n`);

        const ProposalManagerV2 = await hre.ethers.getContractFactory("ProposalManagerV2");
        const proposalManager = await ProposalManagerV2.deploy(deployedContracts.masterRegistry);
        await proposalManager.waitForDeployment();

        deployedContracts.proposalManager = await proposalManager.getAddress();
        console.log(`${colors.green}✅ ProposalManagerV2 deployed: ${deployedContracts.proposalManager}${colors.reset}\n`);

        // ========================================
        // STEP 5: Deploy PredictionMarket Implementation
        // ========================================
        console.log(`${colors.cyan}${colors.bright}STEP 5/8: Deploying PredictionMarket Implementation${colors.reset}\n`);

        const PredictionMarket = await hre.ethers.getContractFactory("PredictionMarket");
        const predictionMarket = await PredictionMarket.deploy();
        await predictionMarket.waitForDeployment();

        deployedContracts.predictionMarket = await predictionMarket.getAddress();
        console.log(`${colors.green}✅ PredictionMarket deployed: ${deployedContracts.predictionMarket}${colors.reset}\n`);

        // ========================================
        // STEP 6: Deploy FlexibleMarketFactory
        // ========================================
        console.log(`${colors.cyan}${colors.bright}STEP 6/8: Deploying FlexibleMarketFactory${colors.reset}\n`);

        const FlexibleMarketFactory = await hre.ethers.getContractFactory("FlexibleMarketFactory");
        const marketFactory = await FlexibleMarketFactory.deploy(
            deployedContracts.masterRegistry,
            hre.ethers.parseEther("0.01") // Min creator bond
        );
        await marketFactory.waitForDeployment();

        deployedContracts.marketFactory = await marketFactory.getAddress();
        console.log(`${colors.green}✅ FlexibleMarketFactory deployed: ${deployedContracts.marketFactory}${colors.reset}\n`);

        // ========================================
        // STEP 7: Deploy ResolutionManager
        // ========================================
        console.log(`${colors.cyan}${colors.bright}STEP 7/8: Deploying ResolutionManager${colors.reset}\n`);

        const ResolutionManager = await hre.ethers.getContractFactory("ResolutionManager");
        const resolutionManager = await ResolutionManager.deploy(
            deployedContracts.masterRegistry,
            604800, // 7 days dispute window
            hre.ethers.parseEther("0.01") // Min dispute bond
        );
        await resolutionManager.waitForDeployment();

        deployedContracts.resolutionManager = await resolutionManager.getAddress();
        console.log(`${colors.green}✅ ResolutionManager deployed: ${deployedContracts.resolutionManager}${colors.reset}\n`);

        // ========================================
        // STEP 8: Deploy RewardDistributor
        // ========================================
        console.log(`${colors.cyan}${colors.bright}STEP 8/8: Deploying RewardDistributor${colors.reset}\n`);

        const RewardDistributor = await hre.ethers.getContractFactory("RewardDistributor");
        const rewardDistributor = await RewardDistributor.deploy(deployedContracts.masterRegistry);
        await rewardDistributor.waitForDeployment();

        deployedContracts.rewardDistributor = await rewardDistributor.getAddress();
        console.log(`${colors.green}✅ RewardDistributor deployed: ${deployedContracts.rewardDistributor}${colors.reset}\n`);

        // ========================================
        // REGISTRY REGISTRATION
        // ========================================
        console.log(`${colors.cyan}${colors.bright}═══ REGISTRY REGISTRATION ═══${colors.reset}\n`);
        console.log(`${colors.yellow}📝 Registering contracts in MasterRegistry...${colors.reset}\n`);

        await masterRegistry.setContract(
            hre.ethers.keccak256(hre.ethers.toUtf8Bytes("AccessControlManager")),
            deployedContracts.accessControl
        );
        console.log(`${colors.green}✅ AccessControlManager registered${colors.reset}`);

        await masterRegistry.setContract(
            hre.ethers.keccak256(hre.ethers.toUtf8Bytes("ParameterStorage")),
            deployedContracts.parameterStorage
        );
        console.log(`${colors.green}✅ ParameterStorage registered${colors.reset}`);

        await masterRegistry.setContract(
            hre.ethers.keccak256(hre.ethers.toUtf8Bytes("ProposalManager")),
            deployedContracts.proposalManager
        );
        console.log(`${colors.green}✅ ProposalManager registered${colors.reset}`);

        await masterRegistry.setContract(
            hre.ethers.keccak256(hre.ethers.toUtf8Bytes("ResolutionManager")),
            deployedContracts.resolutionManager
        );
        console.log(`${colors.green}✅ ResolutionManager registered${colors.reset}`);

        await masterRegistry.setContract(
            hre.ethers.keccak256(hre.ethers.toUtf8Bytes("RewardDistributor")),
            deployedContracts.rewardDistributor
        );
        console.log(`${colors.green}✅ RewardDistributor registered${colors.reset}`);

        await masterRegistry.setContract(
            hre.ethers.keccak256(hre.ethers.toUtf8Bytes("FlexibleMarketFactory")),
            deployedContracts.marketFactory
        );
        console.log(`${colors.green}✅ FlexibleMarketFactory registered${colors.reset}\n`);

        // ========================================
        // CONFIGURATION
        // ========================================
        console.log(`${colors.cyan}${colors.bright}═══ CONFIGURATION ═══${colors.reset}\n`);

        // Grant roles
        console.log(`${colors.yellow}📝 Configuring access control roles...${colors.reset}\n`);

        const RESOLVER_ROLE = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("RESOLVER_ROLE"));
        const FACTORY_ROLE = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("FACTORY_ROLE"));

        await accessControl.grantRole(RESOLVER_ROLE, deployedContracts.resolutionManager);
        console.log(`${colors.green}✅ RESOLVER_ROLE granted to ResolutionManager${colors.reset}`);

        await accessControl.grantRole(FACTORY_ROLE, deployedContracts.marketFactory);
        console.log(`${colors.green}✅ FACTORY_ROLE granted to MarketFactory${colors.reset}`);

        await accessControl.grantRole(FACTORY_ROLE, deployer.address);
        console.log(`${colors.green}✅ FACTORY_ROLE granted to Deployer (for testing)${colors.reset}\n`);

        // Set parameters
        console.log(`${colors.yellow}📝 Setting system parameters...${colors.reset}\n`);

        const minCreatorBondKey = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("MIN_CREATOR_BOND"));
        await parameterStorage.setParameter(minCreatorBondKey, hre.ethers.parseEther("0.01"));
        console.log(`${colors.green}✅ MIN_CREATOR_BOND set to 0.01 ETH${colors.reset}`);

        const minBetKey = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("minimumBet"));
        await parameterStorage.setParameter(minBetKey, hre.ethers.parseEther("0.001"));
        console.log(`${colors.green}✅ minimumBet set to 0.001 ETH${colors.reset}`);

        const platformFeeKey = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("PLATFORM_FEE_BPS"));
        await parameterStorage.setParameter(platformFeeKey, 250n);
        console.log(`${colors.green}✅ PLATFORM_FEE_BPS set to 250 (2.5%)${colors.reset}\n`);

        // ========================================
        // SAVE DEPLOYMENT
        // ========================================
        console.log(`${colors.cyan}${colors.bright}═══ SAVING DEPLOYMENT ═══${colors.reset}\n`);

        const deployment = {
            network: hre.network.name,
            chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
            deployer: deployer.address,
            timestamp: new Date().toISOString(),
            contracts: deployedContracts
        };

        const deploymentsDir = path.join(__dirname, "../../deployments");
        if (!fs.existsSync(deploymentsDir)) {
            fs.mkdirSync(deploymentsDir, { recursive: true });
        }

        const filePath = path.join(deploymentsDir, "fork-deployment.json");
        fs.writeFileSync(filePath, JSON.stringify(deployment, null, 2));
        console.log(`${colors.green}✅ Deployment saved to: ${filePath}${colors.reset}\n`);

        // Update .env.fork
        const envContent = `# BasedAI Fork Deployment - ${new Date().toISOString()}
FORK_MASTER_REGISTRY_ADDRESS=${deployedContracts.masterRegistry}
FORK_ACCESS_CONTROL_MANAGER_ADDRESS=${deployedContracts.accessControl}
FORK_PARAMETER_STORAGE_ADDRESS=${deployedContracts.parameterStorage}
FORK_PROPOSAL_MANAGER_V2_ADDRESS=${deployedContracts.proposalManager}
FORK_FLEXIBLE_MARKET_FACTORY_ADDRESS=${deployedContracts.marketFactory}
FORK_RESOLUTION_MANAGER_ADDRESS=${deployedContracts.resolutionManager}
FORK_REWARD_DISTRIBUTOR_ADDRESS=${deployedContracts.rewardDistributor}
FORK_PREDICTION_MARKET_ADDRESS=${deployedContracts.predictionMarket}
`;

        fs.writeFileSync(".env.fork", envContent);
        console.log(`${colors.green}✅ Addresses saved to .env.fork${colors.reset}\n`);

        // ========================================
        // FINAL SUMMARY
        // ========================================
        const finalBalance = await hre.ethers.provider.getBalance(deployer.address);
        const gasSpent = balance - finalBalance;

        console.log(`${colors.green}${colors.bright}
═══════════════════════════════════════════════════
  ✅ FORK DEPLOYMENT COMPLETE!
═══════════════════════════════════════════════════
${colors.reset}\n`);

        console.log(`${colors.cyan}📊 Deployment Summary:${colors.reset}`);
        console.log(`   Network: ${hre.network.name}`);
        console.log(`   Chain ID: ${deployment.chainId}`);
        console.log(`   Contracts: 8/8 deployed ✅`);
        console.log(`   Configuration: Complete ✅`);
        console.log(`   Gas Spent: ${hre.ethers.formatEther(gasSpent)} ETH (simulated)\n`);

        console.log(`${colors.cyan}🔗 Deployed Contracts:${colors.reset}`);
        Object.entries(deployedContracts).forEach(([name, address]) => {
            console.log(`   ${name}: ${address}`);
        });
        console.log('');

        console.log(`${colors.green}${colors.bright}🎉 Ready for comprehensive local testing!${colors.reset}\n`);

        return deployedContracts;

    } catch (error) {
        console.error(`${colors.yellow}❌ Deployment error:${colors.reset}`);
        console.error(error);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
