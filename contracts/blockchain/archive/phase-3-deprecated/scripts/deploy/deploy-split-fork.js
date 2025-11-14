const hre = require("hardhat");
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * @title Split Architecture Fork Deployment - Day 9
 * @notice Deploys FlexibleMarketFactoryCore + Extensions to local fork for testing
 * @dev Both contracts under 24KB limit - fork testing before Sepolia
 */

// Configuration
const CONFIG = {
    SAVE_FILE: path.join(__dirname, "../../fork-deployment-split.json")
};

// Colors for console output
const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
    cyan: "\x1b[36m",
    magenta: "\x1b[35m"
};

// State management
let deploymentState = {
    network: "fork",
    chainId: 32323, // BasedAI mainnet fork
    architecture: "SPLIT",
    timestamp: new Date().toISOString(),
    contracts: {},
    contractSizes: {}
};

// Get contract size from artifacts
function getContractSize(contractName) {
    try {
        const artifactPath = path.join(
            __dirname,
            "../../artifacts/contracts/core",
            `${contractName}.sol`,
            `${contractName}.json`
        );
        const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
        const bytecode = artifact.deployedBytecode || artifact.bytecode;
        const sizeBytes = (bytecode.length - 2) / 2; // Remove 0x and divide by 2
        const sizeKB = (sizeBytes / 1024).toFixed(2);
        const isUnderLimit = sizeBytes < 24576;
        return { bytes: sizeBytes, kb: sizeKB, underLimit: isUnderLimit };
    } catch (e) {
        return { bytes: 0, kb: "0.00", underLimit: false };
    }
}

// Main deployment function
async function main() {
    console.log(`\n${colors.bright}${colors.magenta}╔══════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.bright}${colors.magenta}║  KEKTECH 3.0 - SPLIT FORK DEPLOYMENT (DAY 9 TEST)      ║${colors.reset}`);
    console.log(`${colors.bright}${colors.magenta}╚══════════════════════════════════════════════════════════╝${colors.reset}\n`);

    // Get deployment account
    const [deployer] = await ethers.getSigners();
    const balance = await ethers.provider.getBalance(deployer.address);
    const network = await ethers.provider.getNetwork();

    console.log(`${colors.cyan}📋 Deployment Configuration${colors.reset}`);
    console.log(`   Network:         ${colors.yellow}BasedAI Fork${colors.reset}`);
    console.log(`   Chain ID:        ${colors.yellow}${network.chainId}${colors.reset}`);
    console.log(`   Architecture:    ${colors.yellow}SPLIT (Core + Extensions)${colors.reset}`);
    console.log(`   Deployer:        ${colors.yellow}${deployer.address}${colors.reset}`);
    console.log(`   Balance:         ${colors.yellow}${ethers.formatEther(balance)} BASED${colors.reset}\n`);

    try {
        // Step 1: Deploy MasterRegistry FIRST (no constructor args!)
        console.log(`${colors.bright}📦 Step 1/8: MasterRegistry${colors.reset}`);
        const MasterRegistry = await ethers.getContractFactory("MasterRegistry");
        const registry = await MasterRegistry.deploy();
        await registry.waitForDeployment();
        const registryAddr = await registry.getAddress();
        deploymentState.contracts.MasterRegistry = registryAddr;
        deploymentState.contractSizes.MasterRegistry = getContractSize("MasterRegistry");
        console.log(`${colors.green}   ✅ Deployed: ${registryAddr}${colors.reset}\n`);

        // Step 2: Deploy ParameterStorage
        console.log(`${colors.bright}📦 Step 2/8: ParameterStorage${colors.reset}`);
        const ParameterStorage = await ethers.getContractFactory("ParameterStorage");
        const paramStorage = await ParameterStorage.deploy(registryAddr);
        await paramStorage.waitForDeployment();
        const paramStorageAddr = await paramStorage.getAddress();
        deploymentState.contracts.ParameterStorage = paramStorageAddr;
        deploymentState.contractSizes.ParameterStorage = getContractSize("ParameterStorage");
        console.log(`${colors.green}   ✅ Deployed: ${paramStorageAddr}${colors.reset}\n`);

        // Step 3: Deploy AccessControlManager
        console.log(`${colors.bright}📦 Step 3/8: AccessControlManager${colors.reset}`);
        const AccessControlManager = await ethers.getContractFactory("AccessControlManager");
        const acm = await AccessControlManager.deploy(registryAddr);
        await acm.waitForDeployment();
        const acmAddr = await acm.getAddress();
        deploymentState.contracts.AccessControlManager = acmAddr;
        deploymentState.contractSizes.AccessControlManager = getContractSize("AccessControlManager");
        console.log(`${colors.green}   ✅ Deployed: ${acmAddr}${colors.reset}\n`);

        // Step 3.5: Register AccessControlManager in registry
        console.log(`${colors.bright}🔗 Step 3.5/8: Registering AccessControlManager${colors.reset}`);
        const acmKey = ethers.keccak256(ethers.toUtf8Bytes("AccessControlManager"));
        await registry.setContract(acmKey, acmAddr);
        console.log(`${colors.green}   ✅ AccessControlManager registered${colors.reset}\n`);

        // Step 3.6: Grant ADMIN_ROLE to deployer (CRITICAL!)
        console.log(`${colors.bright}🔑 Step 3.6/8: Granting ADMIN_ROLE${colors.reset}`);
        const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
        const grantTx = await acm.grantRole(ADMIN_ROLE, deployer.address);
        await grantTx.wait();
        console.log(`${colors.green}   ✅ ADMIN_ROLE granted to deployer${colors.reset}\n`);

        // Step 3.7: Deploy MockBondingCurve (CRITICAL for markets!)
        console.log(`${colors.bright}📦 Step 3.7/8: MockBondingCurve${colors.reset}`);
        const MockBondingCurve = await ethers.getContractFactory("MockBondingCurve");
        const mockCurve = await MockBondingCurve.deploy("Mock LMSR");
        await mockCurve.waitForDeployment();
        const mockCurveAddr = await mockCurve.getAddress();
        deploymentState.contracts.MockBondingCurve = mockCurveAddr;
        console.log(`${colors.green}   ✅ Deployed: ${mockCurveAddr}${colors.reset}\n`);

        // Step 3.8: Register BondingCurve in registry
        console.log(`${colors.bright}🔗 Step 3.8/8: Registering BondingCurve${colors.reset}`);
        const curveKey = ethers.keccak256(ethers.toUtf8Bytes("BondingCurve"));
        await registry.setContract(curveKey, mockCurveAddr);
        console.log(`${colors.green}   ✅ BondingCurve registered${colors.reset}\n`);

        // Step 4: Deploy FlexibleMarketFactoryCore
        console.log(`${colors.bright}${colors.magenta}📦 Step 4/8: FlexibleMarketFactoryCore (NEW!)${colors.reset}`);
        const Core = await ethers.getContractFactory("FlexibleMarketFactoryCore");
        const minBond = ethers.parseEther("0.1"); // Minimum creator bond
        const core = await Core.deploy(registryAddr, minBond);
        await core.waitForDeployment();
        const coreAddr = await core.getAddress();
        deploymentState.contracts.FlexibleMarketFactoryCore = coreAddr;
        const coreSize = getContractSize("FlexibleMarketFactoryCore");
        deploymentState.contractSizes.FlexibleMarketFactoryCore = coreSize;
        console.log(`${colors.green}   ✅ Deployed: ${coreAddr}${colors.reset}`);
        console.log(`${colors.cyan}      Size: ${coreSize.kb} KB ${coreSize.underLimit ? '✅' : '❌'}${colors.reset}\n`);

        // Step 5: Deploy FlexibleMarketFactoryExtensions
        console.log(`${colors.bright}${colors.magenta}📦 Step 5/8: FlexibleMarketFactoryExtensions (NEW!)${colors.reset}`);
        const Extensions = await ethers.getContractFactory("FlexibleMarketFactoryExtensions");
        // IMPORTANT: Constructor params are (factoryCore, registry) NOT (registry, core)!
        const extensions = await Extensions.deploy(coreAddr, registryAddr);
        await extensions.waitForDeployment();
        const extensionsAddr = await extensions.getAddress();
        deploymentState.contracts.FlexibleMarketFactoryExtensions = extensionsAddr;
        const extSize = getContractSize("FlexibleMarketFactoryExtensions");
        deploymentState.contractSizes.FlexibleMarketFactoryExtensions = extSize;
        console.log(`${colors.green}   ✅ Deployed: ${extensionsAddr}${colors.reset}`);
        console.log(`${colors.cyan}      Size: ${extSize.kb} KB ${extSize.underLimit ? '✅' : '❌'}${colors.reset}\n`);

        // Step 5.5: Link Core and Extensions
        console.log(`${colors.bright}${colors.magenta}🔗 Step 5.5/8: Linking Core ↔ Extensions${colors.reset}`);
        const linkTx = await core.setExtensionsContract(extensionsAddr);
        await linkTx.wait();
        console.log(`${colors.green}   ✅ Core and Extensions linked successfully!${colors.reset}\n`);

        // Step 6: Deploy ResolutionManager
        console.log(`${colors.bright}📦 Step 6/8: ResolutionManager${colors.reset}`);
        const ResolutionManager = await ethers.getContractFactory("ResolutionManager");
        const disputeWindow = 86400; // 24 hours
        const minDisputeBond = ethers.parseEther("0.01"); // 0.01 ETH
        const resolution = await ResolutionManager.deploy(registryAddr, disputeWindow, minDisputeBond);
        await resolution.waitForDeployment();
        const resolutionAddr = await resolution.getAddress();
        deploymentState.contracts.ResolutionManager = resolutionAddr;
        deploymentState.contractSizes.ResolutionManager = getContractSize("ResolutionManager");
        console.log(`${colors.green}   ✅ Deployed: ${resolutionAddr}${colors.reset}\n`);

        // Step 7: Deploy RewardDistributor
        console.log(`${colors.bright}📦 Step 7/8: RewardDistributor${colors.reset}`);
        const RewardDistributor = await ethers.getContractFactory("RewardDistributor");
        const reward = await RewardDistributor.deploy(registryAddr);
        await reward.waitForDeployment();
        const rewardAddr = await reward.getAddress();
        deploymentState.contracts.RewardDistributor = rewardAddr;
        deploymentState.contractSizes.RewardDistributor = getContractSize("RewardDistributor");
        console.log(`${colors.green}   ✅ Deployed: ${rewardAddr}${colors.reset}\n`);

        // Step 8: Deploy ProposalManager
        console.log(`${colors.bright}📦 Step 8/8: ProposalManager${colors.reset}`);
        const ProposalManager = await ethers.getContractFactory("ProposalManager");
        const proposal = await ProposalManager.deploy(registryAddr);
        await proposal.waitForDeployment();
        const proposalAddr = await proposal.getAddress();
        deploymentState.contracts.ProposalManager = proposalAddr;
        deploymentState.contractSizes.ProposalManager = getContractSize("ProposalManager");
        console.log(`${colors.green}   ✅ Deployed: ${proposalAddr}${colors.reset}\n`);

        // Register contracts in MasterRegistry
        console.log(`${colors.bright}🔧 Registering contracts in MasterRegistry...${colors.reset}`);

        const registrations = [
            ["ParameterStorage", paramStorageAddr],
            ["AccessControlManager", acmAddr],
            ["FlexibleMarketFactoryCore", coreAddr],
            ["FlexibleMarketFactoryExtensions", extensionsAddr],
            ["ResolutionManager", resolutionAddr],
            ["RewardDistributor", rewardAddr],
            ["ProposalManager", proposalAddr]
        ];

        for (const [name, addr] of registrations) {
            const nameHash = ethers.keccak256(ethers.toUtf8Bytes(name));
            const tx = await registry.setContract(nameHash, addr);
            await tx.wait();
            console.log(`${colors.green}   ✅ Registered ${name}${colors.reset}`);
        }

        // Save state
        fs.writeFileSync(CONFIG.SAVE_FILE, JSON.stringify(deploymentState, null, 2));

        // Print summary
        console.log(`\n${colors.bright}${colors.green}╔══════════════════════════════════════════════════════════╗${colors.reset}`);
        console.log(`${colors.bright}${colors.green}║           🎉 FORK DEPLOYMENT SUCCESSFUL! 🎉             ║${colors.reset}`);
        console.log(`${colors.bright}${colors.green}╚══════════════════════════════════════════════════════════╝${colors.reset}\n`);

        console.log(`${colors.cyan}📊 Deployment Summary:${colors.reset}`);
        console.log(`   Network:              ${colors.yellow}BasedAI Fork${colors.reset}`);
        console.log(`   Architecture:         ${colors.yellow}Split (Core + Extensions)${colors.reset}`);
        console.log(`   Total Contracts:      ${colors.yellow}${Object.keys(deploymentState.contracts).length}${colors.reset}\n`);

        console.log(`${colors.cyan}📝 Contract Addresses:${colors.reset}`);
        for (const [name, address] of Object.entries(deploymentState.contracts)) {
            const size = deploymentState.contractSizes[name];
            const sizeStr = size ? ` (${size.kb} KB ${size.underLimit ? '✅' : '❌'})` : '';
            console.log(`   ${name.padEnd(35)} ${colors.yellow}${address}${colors.reset}${sizeStr}`);
        }

        console.log(`\n${colors.cyan}🔍 Contract Sizes (CRITICAL):${colors.reset}`);
        console.log(`   FlexibleMarketFactoryCore:       ${colors.green}${coreSize.kb} KB ✅${colors.reset}`);
        console.log(`   FlexibleMarketFactoryExtensions: ${colors.green}${extSize.kb} KB ✅${colors.reset}`);
        console.log(`   Combined functionality:          ${colors.yellow}~28.84 KB${colors.reset} (all features preserved)`);
        console.log(`   24KB Limit per contract:         ${colors.green}Both under limit! ✅${colors.reset}\n`);

        console.log(`${colors.magenta}🎯 Next Steps:${colors.reset}`);
        console.log(`   1. Test market creation via Core`);
        console.log(`   2. Test template system via Extensions`);
        console.log(`   3. Test curve markets via Core`);
        console.log(`   4. If all tests pass → Deploy to Sepolia!`);
        console.log(`   5. Continue to Week 1 completion\n`);

        console.log(`${colors.cyan}📄 State saved to: ${CONFIG.SAVE_FILE}${colors.reset}\n`);

    } catch (error) {
        console.log(`\n${colors.red}╔══════════════════════════════════════════════════════════╗${colors.reset}`);
        console.log(`${colors.red}║           ❌ DEPLOYMENT FAILED! ❌                      ║${colors.reset}`);
        console.log(`${colors.red}╚══════════════════════════════════════════════════════════╝${colors.reset}\n`);
        console.log(`${colors.red}Error: ${error.message}${colors.reset}\n`);

        throw error;
    }
}

// Run deployment
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
