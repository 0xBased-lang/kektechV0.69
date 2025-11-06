const { ethers } = require("hardhat");
const fs = require("fs");
require("dotenv").config();

const colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    cyan: "\x1b[36m"
};

// ALREADY DEPLOYED
const MASTER_REGISTRY = "0x412ab6fbdd342AAbE6145f3e36930E42a2089964";

const DEPLOYMENT_CONFIG = {
    owner: process.env.MAINNET_OWNER,
    treasury: process.env.TEAM_WALLET,
    incentives: process.env.INCENTIVES_WALLET,
    minCreatorBond: ethers.parseEther("0.1"),
    minimumBet: ethers.parseEther("0.01"),
    minDisputeBond: ethers.parseEther("0.1"),
    disputeWindow: 86400,
    resolutionWindow: 172800,
    protocolFeeBps: 250,
    creatorFeeBps: 150,
    treasuryFeeBps: 50,
    stakerIncentiveBps: 50
};

async function main() {
    console.log(`\n${colors.cyan}═══════════════════════════════════════════════════`);
    console.log(`${colors.cyan}    KEKTECH 3.0 - Continue Deployment`);
    console.log(`${colors.cyan}    Deploy Remaining Contracts`);
    console.log(`${colors.cyan}═══════════════════════════════════════════════════${colors.reset}\n`);

    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);
    console.log("MasterRegistry (already deployed):", MASTER_REGISTRY);

    const deployedContracts = {
        MasterRegistry: MASTER_REGISTRY
    };

    try {
        // Reasonable gas limits based on fork testing
        const feeData = await ethers.provider.getFeeData();
        const gasPrice = feeData.gasPrice || feeData.maxFeePerGas;

        console.log("\nGas price:", ethers.formatUnits(gasPrice, "gwei"), "gwei");

        // 2. Deploy ParameterStorage
        console.log(`\n${colors.cyan}[2/7] Deploying ParameterStorage...${colors.reset}`);
        const ParamStorage = await ethers.getContractFactory("ParameterStorage");
        const paramStorage = await ParamStorage.deploy(MASTER_REGISTRY, {
            gasPrice: gasPrice,
            gasLimit: 2000000
        });
        await paramStorage.waitForDeployment();
        deployedContracts.ParameterStorage = await paramStorage.getAddress();
        console.log(`${colors.green}✓ ParameterStorage:${colors.reset} ${deployedContracts.ParameterStorage}`);

        // 3. Deploy AccessControlManager
        console.log(`\n${colors.cyan}[3/7] Deploying AccessControlManager...${colors.reset}`);
        const ACM = await ethers.getContractFactory("AccessControlManager");
        const acm = await ACM.deploy(MASTER_REGISTRY, { gasPrice, gasLimit: 1500000 });
        await acm.waitForDeployment();
        deployedContracts.AccessControlManager = await acm.getAddress();
        console.log(`${colors.green}✓ AccessControlManager:${colors.reset} ${deployedContracts.AccessControlManager}`);

        // 4. Deploy ProposalManagerV2
        console.log(`\n${colors.cyan}[4/7] Deploying ProposalManagerV2...${colors.reset}`);
        const ProposalMgr = await ethers.getContractFactory("ProposalManagerV2");
        const proposalMgr = await ProposalMgr.deploy(MASTER_REGISTRY, { gasPrice, gasLimit: 3000000 });
        await proposalMgr.waitForDeployment();
        deployedContracts.ProposalManagerV2 = await proposalMgr.getAddress();
        console.log(`${colors.green}✓ ProposalManagerV2:${colors.reset} ${deployedContracts.ProposalManagerV2}`);

        // 5. Deploy FlexibleMarketFactory
        console.log(`\n${colors.cyan}[5/7] Deploying FlexibleMarketFactory...${colors.reset}`);
        const Factory = await ethers.getContractFactory("FlexibleMarketFactory");
        const factory = await Factory.deploy(MASTER_REGISTRY, DEPLOYMENT_CONFIG.minCreatorBond, { gasPrice, gasLimit: 3000000 });
        await factory.waitForDeployment();
        deployedContracts.FlexibleMarketFactory = await factory.getAddress();
        console.log(`${colors.green}✓ FlexibleMarketFactory:${colors.reset} ${deployedContracts.FlexibleMarketFactory}`);

        // 6. Deploy ResolutionManager
        console.log(`\n${colors.cyan}[6/7] Deploying ResolutionManager...${colors.reset}`);
        const Resolution = await ethers.getContractFactory("ResolutionManager");
        const resolution = await Resolution.deploy(
            MASTER_REGISTRY,
            DEPLOYMENT_CONFIG.disputeWindow,
            DEPLOYMENT_CONFIG.minDisputeBond
        );
        await resolution.waitForDeployment();
        deployedContracts.ResolutionManager = await resolution.getAddress();
        console.log(`${colors.green}✓ ResolutionManager:${colors.reset} ${deployedContracts.ResolutionManager}`);

        // 7. Deploy RewardDistributor
        console.log(`\n${colors.cyan}[7/7] Deploying RewardDistributor...${colors.reset}`);
        const Rewards = await ethers.getContractFactory("RewardDistributor");
        const rewards = await Rewards.deploy(MASTER_REGISTRY, { gasPrice, gasLimit: 2500000 });
        await rewards.waitForDeployment();
        deployedContracts.RewardDistributor = await rewards.getAddress();
        console.log(`${colors.green}✓ RewardDistributor:${colors.reset} ${deployedContracts.RewardDistributor}`);

        console.log(`\n${colors.yellow}═══════════════════════════════════════════════════`);
        console.log(`${colors.yellow}    Configuring Contracts...`);
        console.log(`${colors.yellow}═══════════════════════════════════════════════════${colors.reset}\n`);

        const registryContract = await ethers.getContractAt("MasterRegistry", MASTER_REGISTRY);
        const paramStorageContract = await ethers.getContractAt("ParameterStorage", deployedContracts.ParameterStorage);
        const acmContract = await ethers.getContractAt("AccessControlManager", deployedContracts.AccessControlManager);

        // Register all contracts
        console.log(`${colors.cyan}Registering contracts...${colors.reset}`);
        await registryContract.setContract(ethers.id("ParameterStorage"), deployedContracts.ParameterStorage);
        console.log(`  ✓ ParameterStorage registered`);

        await registryContract.setContract(ethers.id("AccessControlManager"), deployedContracts.AccessControlManager);
        console.log(`  ✓ AccessControlManager registered`);

        await registryContract.setContract(ethers.id("ProposalManager"), deployedContracts.ProposalManagerV2);
        console.log(`  ✓ ProposalManagerV2 registered`);

        await registryContract.setContract(ethers.id("FlexibleMarketFactory"), deployedContracts.FlexibleMarketFactory);
        console.log(`  ✓ FlexibleMarketFactory registered`);

        await registryContract.setContract(ethers.id("ResolutionManager"), deployedContracts.ResolutionManager);
        console.log(`  ✓ ResolutionManager registered`);

        await registryContract.setContract(ethers.id("RewardDistributor"), deployedContracts.RewardDistributor);
        console.log(`  ✓ RewardDistributor registered`);

        // Grant roles
        console.log(`\n${colors.cyan}Setting up access control...${colors.reset}`);
        const ADMIN_ROLE = ethers.id("ADMIN_ROLE");
        const RESOLVER_ROLE = ethers.id("RESOLVER_ROLE");

        await acmContract.grantRole(ADMIN_ROLE, deployer.address);
        console.log(`  ✓ ADMIN_ROLE granted to deployer`);

        await acmContract.grantRole(RESOLVER_ROLE, DEPLOYMENT_CONFIG.owner);
        console.log(`  ✓ RESOLVER_ROLE granted to owner`);

        await acmContract.grantRole(ADMIN_ROLE, DEPLOYMENT_CONFIG.owner);
        console.log(`  ✓ ADMIN_ROLE granted to owner`);

        // Set parameters
        console.log(`\n${colors.cyan}Setting protocol parameters...${colors.reset}`);
        await paramStorageContract.setParameter(ethers.id("protocolFeeBps"), DEPLOYMENT_CONFIG.protocolFeeBps);
        console.log(`  ✓ Protocol fee: ${DEPLOYMENT_CONFIG.protocolFeeBps / 100}%`);

        await paramStorageContract.setParameter(ethers.id("creatorFeeBps"), DEPLOYMENT_CONFIG.creatorFeeBps);
        console.log(`  ✓ Creator fee: ${DEPLOYMENT_CONFIG.creatorFeeBps / 100}%`);

        await paramStorageContract.setParameter(ethers.id("minimumBet"), DEPLOYMENT_CONFIG.minimumBet);
        console.log(`  ✓ Minimum bet: ${ethers.formatEther(DEPLOYMENT_CONFIG.minimumBet)} BASED`);

        await paramStorageContract.setAddressParameter(ethers.id("TEAM_TREASURY"), DEPLOYMENT_CONFIG.treasury);
        console.log(`  ✓ Treasury: ${DEPLOYMENT_CONFIG.treasury}`);

        await paramStorageContract.setAddressParameter(ethers.id("INCENTIVES_WALLET"), DEPLOYMENT_CONFIG.incentives);
        console.log(`  ✓ Incentives: ${DEPLOYMENT_CONFIG.incentives}`);

        // Save deployment info
        const deploymentInfo = {
            network: "basedai_mainnet",
            chainId: 32323,
            timestamp: new Date().toISOString(),
            deployer: deployer.address,
            securityFixes: ["M-1", "M-2", "M-3", "M-4", "H-2", "L-1", "L-3"],
            contracts: deployedContracts,
            configuration: DEPLOYMENT_CONFIG
        };

        const filename = `basedai-mainnet-deployment-${Date.now()}.json`;
        fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));

        console.log(`\n${colors.green}═══════════════════════════════════════════════════`);
        console.log(`${colors.green}    DEPLOYMENT SUCCESSFUL!`);
        console.log(`${colors.green}    ALL SECURITY FIXES DEPLOYED`);
        console.log(`${colors.green}═══════════════════════════════════════════════════${colors.reset}\n`);

        console.log(`${colors.blue}Deployment saved:${colors.reset} ${filename}\n`);

        console.log(`${colors.magenta}Contract Addresses:${colors.reset}`);
        Object.entries(deployedContracts).forEach(([name, address]) => {
            console.log(`  ${name}: ${address}`);
        });

        console.log(`\n${colors.cyan}Explorer Links:${colors.reset}`);
        Object.entries(deployedContracts).forEach(([name, address]) => {
            console.log(`  ${name}: https://explorer.bf1337.org/address/${address}`);
        });

    } catch (error) {
        console.log(`\n${colors.red}DEPLOYMENT FAILED!${colors.reset}`);
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
