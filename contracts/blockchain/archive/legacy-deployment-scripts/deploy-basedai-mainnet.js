const { ethers } = require("hardhat");
const fs = require("fs");
require("dotenv").config();

// Colors for console output
const colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m"
};

// Deployment configuration - loaded from .env
const DEPLOYMENT_CONFIG = {
    owner: process.env.MAINNET_OWNER,
    treasury: process.env.TEAM_WALLET,
    incentives: process.env.INCENTIVES_WALLET,

    // Economic parameters
    minCreatorBond: ethers.parseEther("0.1"), // 0.1 BASED for initial testing
    minimumBet: ethers.parseEther("0.01"),    // 0.01 BASED minimum bet
    minDisputeBond: ethers.parseEther("0.1"), // 0.1 BASED to dispute

    // Time windows
    disputeWindow: 86400,    // 24 hours
    resolutionWindow: 172800, // 48 hours

    // Fee structure (in basis points)
    protocolFeeBps: 250,     // 2.5%
    creatorFeeBps: 150,      // 1.5%
    treasuryFeeBps: 50,      // 0.5%
    stakerIncentiveBps: 50   // 0.5%
};

async function main() {
    console.log(`\n${colors.cyan}═══════════════════════════════════════════════════`);
    console.log(`${colors.cyan}    KEKTECH 3.0 - BasedAI Mainnet Deployment`);
    console.log(`${colors.cyan}═══════════════════════════════════════════════════${colors.reset}\n`);

    // Get network info
    const network = await ethers.provider.getNetwork();
    console.log(`${colors.blue}Network:${colors.reset} BasedAI Mainnet (Chain ID: ${network.chainId})`);

    // Get deployer account
    const [deployer] = await ethers.getSigners();
    const balance = await ethers.provider.getBalance(deployer.address);

    console.log(`${colors.blue}Deployer:${colors.reset} ${deployer.address}`);
    console.log(`${colors.blue}Balance:${colors.reset} ${ethers.formatEther(balance)} BASED`);
    console.log(`${colors.blue}Owner:${colors.reset} ${DEPLOYMENT_CONFIG.owner}`);
    console.log(`${colors.blue}Treasury:${colors.reset} ${DEPLOYMENT_CONFIG.treasury}`);
    console.log(`${colors.blue}Incentives:${colors.reset} ${DEPLOYMENT_CONFIG.incentives}`);

    // Check if we have enough gas
    if (balance < ethers.parseEther("50")) {
        console.log(`\n${colors.red}WARNING: Low balance for deployment!${colors.reset}`);
        console.log(`Recommended: 100 BASED, Current: ${ethers.formatEther(balance)} BASED`);

        const readline = require("readline").createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const answer = await new Promise((resolve) => {
            readline.question(`${colors.yellow}Continue anyway? (yes/no): ${colors.reset}`, (ans) => {
                readline.close();
                resolve(ans.toLowerCase() === "yes");
            });
        });

        if (!answer) {
            console.log(`${colors.red}Deployment cancelled.${colors.reset}`);
            process.exit(1);
        }
    }

    console.log(`\n${colors.yellow}═══════════════════════════════════════════════════`);
    console.log(`${colors.yellow}    Starting Contract Deployment...`);
    console.log(`${colors.yellow}═══════════════════════════════════════════════════${colors.reset}\n`);

    const deployedContracts = {};

    try {
        // BasedAI network with Paris EVM requires higher gas limit
        const gasLimit = 6000000; // Required for Paris EVM on BasedAI network

        // 1. Deploy MasterRegistry (no dependencies)
        console.log(`${colors.cyan}[1/7] Deploying MasterRegistry...${colors.reset}`);
        const Registry = await ethers.getContractFactory("MasterRegistry");
        const registry = await Registry.deploy({ gasLimit });
        await registry.waitForDeployment();
        deployedContracts.MasterRegistry = await registry.getAddress();
        console.log(`${colors.green}✓ MasterRegistry deployed at:${colors.reset} ${deployedContracts.MasterRegistry}`);

        // 2. Deploy ParameterStorage
        console.log(`${colors.cyan}[2/7] Deploying ParameterStorage...${colors.reset}`);
        const ParamStorage = await ethers.getContractFactory("ParameterStorage");
        const paramStorage = await ParamStorage.deploy(deployedContracts.MasterRegistry, { gasLimit });
        await paramStorage.waitForDeployment();
        deployedContracts.ParameterStorage = await paramStorage.getAddress();
        console.log(`${colors.green}✓ ParameterStorage deployed at:${colors.reset} ${deployedContracts.ParameterStorage}`);

        // 3. Deploy AccessControlManager
        console.log(`${colors.cyan}[3/7] Deploying AccessControlManager...${colors.reset}`);
        const ACM = await ethers.getContractFactory("AccessControlManager");
        const acm = await ACM.deploy(deployedContracts.MasterRegistry, { gasLimit });
        await acm.waitForDeployment();
        deployedContracts.AccessControlManager = await acm.getAddress();
        console.log(`${colors.green}✓ AccessControlManager deployed at:${colors.reset} ${deployedContracts.AccessControlManager}`);

        // 4. Deploy ProposalManagerV2
        console.log(`${colors.cyan}[4/7] Deploying ProposalManagerV2...${colors.reset}`);
        const ProposalMgr = await ethers.getContractFactory("ProposalManagerV2");
        const proposalMgr = await ProposalMgr.deploy(deployedContracts.MasterRegistry, { gasLimit });
        await proposalMgr.waitForDeployment();
        deployedContracts.ProposalManagerV2 = await proposalMgr.getAddress();
        console.log(`${colors.green}✓ ProposalManagerV2 deployed at:${colors.reset} ${deployedContracts.ProposalManagerV2}`);

        // 5. Deploy FlexibleMarketFactory
        console.log(`${colors.cyan}[5/7] Deploying FlexibleMarketFactory...${colors.reset}`);
        const Factory = await ethers.getContractFactory("FlexibleMarketFactory");
        const factory = await Factory.deploy(
            deployedContracts.MasterRegistry,
            DEPLOYMENT_CONFIG.minCreatorBond,
            { gasLimit }
        );
        await factory.waitForDeployment();
        deployedContracts.FlexibleMarketFactory = await factory.getAddress();
        console.log(`${colors.green}✓ FlexibleMarketFactory deployed at:${colors.reset} ${deployedContracts.FlexibleMarketFactory}`);

        // 6. Deploy ResolutionManager
        console.log(`${colors.cyan}[6/7] Deploying ResolutionManager...${colors.reset}`);
        const Resolution = await ethers.getContractFactory("ResolutionManager");
        const resolution = await Resolution.deploy(
            deployedContracts.MasterRegistry,
            DEPLOYMENT_CONFIG.disputeWindow,
            DEPLOYMENT_CONFIG.minDisputeBond,
            { gasLimit }
        );
        await resolution.waitForDeployment();
        deployedContracts.ResolutionManager = await resolution.getAddress();
        console.log(`${colors.green}✓ ResolutionManager deployed at:${colors.reset} ${deployedContracts.ResolutionManager}`);

        // 7. Deploy RewardDistributor
        console.log(`${colors.cyan}[7/7] Deploying RewardDistributor...${colors.reset}`);
        const Rewards = await ethers.getContractFactory("RewardDistributor");
        const rewards = await Rewards.deploy(deployedContracts.MasterRegistry, { gasLimit });
        await rewards.waitForDeployment();
        deployedContracts.RewardDistributor = await rewards.getAddress();
        console.log(`${colors.green}✓ RewardDistributor deployed at:${colors.reset} ${deployedContracts.RewardDistributor}`);

        console.log(`\n${colors.yellow}═══════════════════════════════════════════════════`);
        console.log(`${colors.yellow}    Configuring Contracts...`);
        console.log(`${colors.yellow}═══════════════════════════════════════════════════${colors.reset}\n`);

        // Get contract instances
        const registryContract = await ethers.getContractAt("MasterRegistry", deployedContracts.MasterRegistry);
        const paramStorageContract = await ethers.getContractAt("ParameterStorage", deployedContracts.ParameterStorage);
        const acmContract = await ethers.getContractAt("AccessControlManager", deployedContracts.AccessControlManager);

        // Register all contracts in MasterRegistry
        console.log(`${colors.cyan}Registering contracts in MasterRegistry...${colors.reset}`);

        await registryContract.setContract(ethers.id("ParameterStorage"), deployedContracts.ParameterStorage, { gasLimit });
        console.log(`  ✓ ParameterStorage registered`);

        await registryContract.setContract(ethers.id("AccessControlManager"), deployedContracts.AccessControlManager, { gasLimit });
        console.log(`  ✓ AccessControlManager registered`);

        await registryContract.setContract(ethers.id("ProposalManager"), deployedContracts.ProposalManagerV2, { gasLimit });
        console.log(`  ✓ ProposalManagerV2 registered`);

        await registryContract.setContract(ethers.id("FlexibleMarketFactory"), deployedContracts.FlexibleMarketFactory, { gasLimit });
        console.log(`  ✓ FlexibleMarketFactory registered`);

        await registryContract.setContract(ethers.id("ResolutionManager"), deployedContracts.ResolutionManager, { gasLimit });
        console.log(`  ✓ ResolutionManager registered`);

        await registryContract.setContract(ethers.id("RewardDistributor"), deployedContracts.RewardDistributor, { gasLimit });
        console.log(`  ✓ RewardDistributor registered`);

        // Set parameters
        console.log(`\n${colors.cyan}Setting protocol parameters...${colors.reset}`);

        await paramStorageContract.setParameter(ethers.id("protocolFeeBps"), DEPLOYMENT_CONFIG.protocolFeeBps, { gasLimit });
        console.log(`  ✓ Protocol fee set to ${DEPLOYMENT_CONFIG.protocolFeeBps / 100}%`);

        await paramStorageContract.setParameter(ethers.id("creatorFeeBps"), DEPLOYMENT_CONFIG.creatorFeeBps, { gasLimit });
        console.log(`  ✓ Creator fee set to ${DEPLOYMENT_CONFIG.creatorFeeBps / 100}%`);

        await paramStorageContract.setParameter(ethers.id("minimumBet"), DEPLOYMENT_CONFIG.minimumBet, { gasLimit });
        console.log(`  ✓ Minimum bet set to ${ethers.formatEther(DEPLOYMENT_CONFIG.minimumBet)} BASED`);

        // Set wallet addresses
        await paramStorageContract.setAddressParameter(ethers.id("TEAM_TREASURY"), DEPLOYMENT_CONFIG.treasury, { gasLimit });
        console.log(`  ✓ Team treasury set to ${DEPLOYMENT_CONFIG.treasury}`);

        await paramStorageContract.setAddressParameter(ethers.id("INCENTIVES_WALLET"), DEPLOYMENT_CONFIG.incentives, { gasLimit });
        console.log(`  ✓ Incentives wallet set to ${DEPLOYMENT_CONFIG.incentives}`);

        // Grant roles
        console.log(`\n${colors.cyan}Setting up access control...${colors.reset}`);

        const RESOLVER_ROLE = ethers.id("RESOLVER_ROLE");
        const ADMIN_ROLE = ethers.id("ADMIN_ROLE");

        await acmContract.grantRole(RESOLVER_ROLE, DEPLOYMENT_CONFIG.owner, { gasLimit });
        console.log(`  ✓ RESOLVER_ROLE granted to owner`);

        await acmContract.grantRole(ADMIN_ROLE, DEPLOYMENT_CONFIG.owner, { gasLimit });
        console.log(`  ✓ ADMIN_ROLE granted to owner`);

        // Transfer ownership (LAST STEP!)
        console.log(`\n${colors.cyan}Transferring ownership...${colors.reset}`);
        await registryContract.transferOwnership(DEPLOYMENT_CONFIG.owner, { gasLimit });
        console.log(`${colors.green}✓ Ownership transferred to:${colors.reset} ${DEPLOYMENT_CONFIG.owner}`);

        // Save deployment info
        const deploymentInfo = {
            network: "basedai_mainnet",
            chainId: Number(network.chainId),
            timestamp: new Date().toISOString(),
            deployer: deployer.address,
            contracts: deployedContracts,
            configuration: {
                owner: DEPLOYMENT_CONFIG.owner,
                treasury: DEPLOYMENT_CONFIG.treasury,
                incentives: DEPLOYMENT_CONFIG.incentives,
                parameters: {
                    minCreatorBond: DEPLOYMENT_CONFIG.minCreatorBond.toString(),
                    minimumBet: DEPLOYMENT_CONFIG.minimumBet.toString(),
                    minDisputeBond: DEPLOYMENT_CONFIG.minDisputeBond.toString(),
                    disputeWindow: DEPLOYMENT_CONFIG.disputeWindow,
                    resolutionWindow: DEPLOYMENT_CONFIG.resolutionWindow,
                    protocolFeeBps: DEPLOYMENT_CONFIG.protocolFeeBps,
                    creatorFeeBps: DEPLOYMENT_CONFIG.creatorFeeBps
                }
            }
        };

        const filename = `basedai-mainnet-deployment-${Date.now()}.json`;
        fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));

        console.log(`\n${colors.green}═══════════════════════════════════════════════════`);
        console.log(`${colors.green}    DEPLOYMENT SUCCESSFUL!`);
        console.log(`${colors.green}═══════════════════════════════════════════════════${colors.reset}\n`);

        console.log(`${colors.blue}Deployment details saved to:${colors.reset} ${filename}`);

        console.log(`\n${colors.magenta}Contract Addresses:${colors.reset}`);
        Object.entries(deployedContracts).forEach(([name, address]) => {
            console.log(`  ${name}: ${address}`);
        });

        console.log(`\n${colors.yellow}Next Steps:${colors.reset}`);
        console.log(`  1. Verify contracts on BasedAI Explorer`);
        console.log(`  2. Create test market to verify functionality`);
        console.log(`  3. Update frontend with contract addresses`);
        console.log(`  4. Begin private testing phase`);

    } catch (error) {
        console.log(`\n${colors.red}═══════════════════════════════════════════════════`);
        console.log(`${colors.red}    DEPLOYMENT FAILED!`);
        console.log(`${colors.red}═══════════════════════════════════════════════════${colors.reset}\n`);
        console.error(`${colors.red}Error:${colors.reset}`, error);

        // Save partial deployment if any contracts were deployed
        if (Object.keys(deployedContracts).length > 0) {
            const filename = `basedai-mainnet-partial-${Date.now()}.json`;
            fs.writeFileSync(filename, JSON.stringify({
                status: "FAILED",
                contracts: deployedContracts,
                error: error.message
            }, null, 2));
            console.log(`\n${colors.yellow}Partial deployment saved to:${colors.reset} ${filename}`);
        }

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