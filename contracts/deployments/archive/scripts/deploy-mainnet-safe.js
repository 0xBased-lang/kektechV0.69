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
    console.log(`${colors.cyan}    WITH M-1 SECURITY FIX (2-Step Ownership)`);
    console.log(`${colors.cyan}═══════════════════════════════════════════════════${colors.reset}\n`);

    // Get network info
    const network = await ethers.provider.getNetwork();
    console.log(`${colors.blue}Network:${colors.reset} BasedAI Mainnet (Chain ID: ${network.chainId})`);

    // Verify we're on mainnet
    if (network.chainId !== 32323n) {
        console.log(`${colors.red}ERROR: Not on BasedAI Mainnet (expected 32323, got ${network.chainId})${colors.reset}`);
        process.exit(1);
    }

    // Get deployer account
    const [deployer] = await ethers.getSigners();
    const balance = await ethers.provider.getBalance(deployer.address);

    console.log(`${colors.blue}Deployer:${colors.reset} ${deployer.address}`);
    console.log(`${colors.blue}Balance:${colors.reset} ${ethers.formatEther(balance)} BASED`);
    console.log(`${colors.blue}Owner:${colors.reset} ${DEPLOYMENT_CONFIG.owner}`);
    console.log(`${colors.blue}Treasury:${colors.reset} ${DEPLOYMENT_CONFIG.treasury}`);
    console.log(`${colors.blue}Incentives:${colors.reset} ${DEPLOYMENT_CONFIG.incentives}`);

    // Security check: Warn if owner = deployer (should use multisig)
    if (DEPLOYMENT_CONFIG.owner.toLowerCase() === deployer.address.toLowerCase()) {
        console.log(`\n${colors.yellow}⚠️  WARNING: Owner = Deployer address${colors.reset}`);
        console.log(`${colors.yellow}   Recommended: Use multisig for production owner${colors.reset}`);
        console.log(`${colors.yellow}   Current: Will deploy then optionally transfer to multisig later${colors.reset}\n`);
    }

    // Check if we have enough gas
    if (balance < ethers.parseEther("1")) {
        console.log(`\n${colors.red}ERROR: Insufficient balance for deployment!${colors.reset}`);
        console.log(`Minimum: 1 BASED, Current: ${ethers.formatEther(balance)} BASED`);
        process.exit(1);
    }

    console.log(`\n${colors.yellow}═══════════════════════════════════════════════════`);
    console.log(`${colors.yellow}    Starting Contract Deployment...`);
    console.log(`${colors.yellow}═══════════════════════════════════════════════════${colors.reset}\n`);

    const deployedContracts = {};

    try {
        // Let ethers auto-estimate gas (BasedAI network compatible)
        // Removed explicit gasLimit to avoid "insufficient funds" error

        // 1. Deploy MasterRegistry (WITH M-1 FIX!)
        console.log(`${colors.cyan}[1/7] Deploying MasterRegistry (with M-1: 2-step ownership)...${colors.reset}`);
        const Registry = await ethers.getContractFactory("MasterRegistry");
        const registry = await Registry.deploy();
        await registry.waitForDeployment();
        deployedContracts.MasterRegistry = await registry.getAddress();
        console.log(`${colors.green}✓ MasterRegistry deployed at:${colors.reset} ${deployedContracts.MasterRegistry}`);

        // Verify M-1 is present
        const hasAcceptOwnership = typeof registry.acceptOwnership === 'function';
        console.log(`  ${hasAcceptOwnership ? '✅' : '❌'} M-1 Fix verified: acceptOwnership() exists`);

        // 2. Deploy ParameterStorage
        console.log(`${colors.cyan}[2/7] Deploying ParameterStorage...${colors.reset}`);
        const ParamStorage = await ethers.getContractFactory("ParameterStorage");
        const paramStorage = await ParamStorage.deploy(deployedContracts.MasterRegistry);
        await paramStorage.waitForDeployment();
        deployedContracts.ParameterStorage = await paramStorage.getAddress();
        console.log(`${colors.green}✓ ParameterStorage deployed at:${colors.reset} ${deployedContracts.ParameterStorage}`);

        // 3. Deploy AccessControlManager
        console.log(`${colors.cyan}[3/7] Deploying AccessControlManager...${colors.reset}`);
        const ACM = await ethers.getContractFactory("AccessControlManager");
        const acm = await ACM.deploy(deployedContracts.MasterRegistry);
        await acm.waitForDeployment();
        deployedContracts.AccessControlManager = await acm.getAddress();
        console.log(`${colors.green}✓ AccessControlManager deployed at:${colors.reset} ${deployedContracts.AccessControlManager}`);

        // 4. Deploy ProposalManagerV2
        console.log(`${colors.cyan}[4/7] Deploying ProposalManagerV2...${colors.reset}`);
        const ProposalMgr = await ethers.getContractFactory("ProposalManagerV2");
        const proposalMgr = await ProposalMgr.deploy(deployedContracts.MasterRegistry);
        await proposalMgr.waitForDeployment();
        deployedContracts.ProposalManagerV2 = await proposalMgr.getAddress();
        console.log(`${colors.green}✓ ProposalManagerV2 deployed at:${colors.reset} ${deployedContracts.ProposalManagerV2}`);

        // 5. Deploy FlexibleMarketFactory (WITH M-3 & H-2 FIXES!)
        console.log(`${colors.cyan}[5/7] Deploying FlexibleMarketFactory (with M-3, H-2 fixes)...${colors.reset}`);
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
        const rewards = await Rewards.deploy(deployedContracts.MasterRegistry);
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

        // Grant ADMIN_ROLE to deployer for parameter setting
        console.log(`\n${colors.cyan}Setting up access control...${colors.reset}`);
        const ADMIN_ROLE = ethers.id("ADMIN_ROLE");
        await acmContract.grantRole(ADMIN_ROLE, deployer.address);
        console.log(`  ✓ ADMIN_ROLE granted to deployer (for parameter setting)`);

        // Set parameters
        console.log(`\n${colors.cyan}Setting protocol parameters...${colors.reset}`);

        await paramStorageContract.setParameter(ethers.id("protocolFeeBps"), DEPLOYMENT_CONFIG.protocolFeeBps);
        console.log(`  ✓ Protocol fee set to ${DEPLOYMENT_CONFIG.protocolFeeBps / 100}%`);

        await paramStorageContract.setParameter(ethers.id("creatorFeeBps"), DEPLOYMENT_CONFIG.creatorFeeBps);
        console.log(`  ✓ Creator fee set to ${DEPLOYMENT_CONFIG.creatorFeeBps / 100}%`);

        await paramStorageContract.setParameter(ethers.id("minimumBet"), DEPLOYMENT_CONFIG.minimumBet);
        console.log(`  ✓ Minimum bet set to ${ethers.formatEther(DEPLOYMENT_CONFIG.minimumBet)} BASED`);

        // Set wallet addresses
        await paramStorageContract.setAddressParameter(ethers.id("TEAM_TREASURY"), DEPLOYMENT_CONFIG.treasury);
        console.log(`  ✓ Team treasury set to ${DEPLOYMENT_CONFIG.treasury}`);

        await paramStorageContract.setAddressParameter(ethers.id("INCENTIVES_WALLET"), DEPLOYMENT_CONFIG.incentives);
        console.log(`  ✓ Incentives wallet set to ${DEPLOYMENT_CONFIG.incentives}`);

        // Grant roles to final owner
        const RESOLVER_ROLE = ethers.id("RESOLVER_ROLE");
        await acmContract.grantRole(RESOLVER_ROLE, DEPLOYMENT_CONFIG.owner);
        console.log(`  ✓ RESOLVER_ROLE granted to owner`);

        await acmContract.grantRole(ADMIN_ROLE, DEPLOYMENT_CONFIG.owner);
        console.log(`  ✓ ADMIN_ROLE granted to owner`);

        // M-1: 2-STEP OWNERSHIP TRANSFER (SAFE!)
        console.log(`\n${colors.cyan}Initiating M-1: 2-Step Ownership Transfer...${colors.reset}`);

        if (DEPLOYMENT_CONFIG.owner.toLowerCase() !== deployer.address.toLowerCase()) {
            // Different owner - use 2-step transfer
            console.log(`${colors.yellow}  Step 1: Initiating transfer to ${DEPLOYMENT_CONFIG.owner}...${colors.reset}`);
            const tx = await registryContract.transferOwnership(DEPLOYMENT_CONFIG.owner);
            await tx.wait();
            console.log(`  ✓ Transfer initiated (pending owner set)`);

            console.log(`\n${colors.yellow}⚠️  IMPORTANT: Owner must accept ownership!${colors.reset}`);
            console.log(`${colors.yellow}  Step 2: New owner must call: registry.acceptOwnership()${colors.reset}`);
            console.log(`${colors.yellow}  Until accepted, deployer retains control (SAFE!)${colors.reset}\n`);
        } else {
            // Same address - no transfer needed
            console.log(`  ${colors.green}ℹ️  Owner = Deployer, no transfer needed${colors.reset}`);
            console.log(`  ${colors.yellow}  Can transfer to multisig later using M-1 2-step process${colors.reset}`);
        }

        // Save deployment info
        const deploymentInfo = {
            network: "basedai_mainnet",
            chainId: Number(network.chainId),
            timestamp: new Date().toISOString(),
            deployer: deployer.address,
            securityFixes: {
                "M-1": "2-step ownership transfer (implemented)",
                "M-2": "Role-based parameter access (implemented)",
                "M-3": "Bond tracking accuracy (implemented)",
                "M-4": "Minimum bet enforcement (implemented)",
                "H-2": "Double-spend prevention (implemented)",
                "L-1": "Slippage protection (implemented)",
                "L-3": "Market cancellation (implemented)"
            },
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
        console.log(`${colors.green}    ALL SECURITY FIXES DEPLOYED (M-1, M-2, M-3, M-4, H-2, L-1, L-3)`);
        console.log(`${colors.green}═══════════════════════════════════════════════════${colors.reset}\n`);

        console.log(`${colors.blue}Deployment details saved to:${colors.reset} ${filename}`);

        console.log(`\n${colors.magenta}Contract Addresses:${colors.reset}`);
        Object.entries(deployedContracts).forEach(([name, address]) => {
            console.log(`  ${name}: ${address}`);
        });

        console.log(`\n${colors.yellow}Next Steps:${colors.reset}`);
        console.log(`  1. Verify contracts on BasedAI Explorer`);
        console.log(`  2. If owner ≠ deployer: Owner must call acceptOwnership()`);
        console.log(`  3. Create test market to verify functionality`);
        console.log(`  4. Update frontend with contract addresses`);
        console.log(`  5. Begin private testing phase`);

        console.log(`\n${colors.cyan}Explorer Links:${colors.reset}`);
        const explorerBase = "https://explorer.bf1337.org/address/";
        Object.entries(deployedContracts).forEach(([name, address]) => {
            console.log(`  ${name}: ${explorerBase}${address}`);
        });

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
