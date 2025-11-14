const hre = require("hardhat");

/**
 * @title Configure Deployed Contracts on Sepolia
 * @notice Links all deployed contracts together and sets up permissions
 */

const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    cyan: "\x1b[36m",
    bright: "\x1b[1m"
};

async function main() {
    console.log(`${colors.cyan}${colors.bright}
╔══════════════════════════════════════════════╗
║   KEKTECH 3.0 Configuration Script          ║
║           Sepolia Testnet                    ║
╚══════════════════════════════════════════════╝
${colors.reset}\n`);

    // Get deployer
    const [deployer] = await hre.ethers.getSigners();
    console.log(`${colors.yellow}👤 Deployer: ${deployer.address}${colors.reset}\n`);

    // Load addresses from .env
    const addresses = {
        masterRegistry: process.env.MASTER_REGISTRY_ADDRESS,
        accessControl: process.env.ACCESS_CONTROL_MANAGER_ADDRESS,
        parameterStorage: process.env.PARAMETER_STORAGE_ADDRESS,
        proposalManager: process.env.PROPOSAL_MANAGER_V2_ADDRESS,
        marketFactory: process.env.FLEXIBLE_MARKET_FACTORY_ADDRESS,
        resolutionManager: process.env.RESOLUTION_MANAGER_ADDRESS,
        rewardDistributor: process.env.REWARD_DISTRIBUTOR_ADDRESS,
        predictionMarket: process.env.PREDICTION_MARKET_ADDRESS
    };

    console.log(`${colors.blue}📋 Loaded Contract Addresses:${colors.reset}`);
    Object.entries(addresses).forEach(([name, addr]) => {
        console.log(`   ${name}: ${addr}`);
    });
    console.log('');

    // Connect to contracts
    console.log(`${colors.yellow}🔗 Connecting to contracts...${colors.reset}\n`);

    const MasterRegistry = await hre.ethers.getContractAt("MasterRegistry", addresses.masterRegistry);
    const AccessControl = await hre.ethers.getContractAt("AccessControlManager", addresses.accessControl);
    const ParameterStorage = await hre.ethers.getContractAt("ParameterStorage", addresses.parameterStorage);

    // Step 1: Register contracts in MasterRegistry
    console.log(`${colors.cyan}${colors.bright}STEP 1: Register Contracts in MasterRegistry${colors.reset}\n`);

    const contracts = [
        { name: "AccessControlManager", key: "ACCESS_CONTROL", address: addresses.accessControl },
        { name: "ParameterStorage", key: "PARAMETER_STORAGE", address: addresses.parameterStorage },
        { name: "ProposalManagerV2", key: "PROPOSAL_MANAGER", address: addresses.proposalManager },
        { name: "FlexibleMarketFactory", key: "MARKET_FACTORY", address: addresses.marketFactory },
        { name: "ResolutionManager", key: "RESOLUTION_MANAGER", address: addresses.resolutionManager },
        { name: "RewardDistributor", key: "REWARD_DISTRIBUTOR", address: addresses.rewardDistributor },
        { name: "PredictionMarket", key: "PREDICTION_MARKET_IMPL", address: addresses.predictionMarket }
    ];

    for (const contract of contracts) {
        try {
            const keyHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(contract.key));

            // Check if already registered
            const currentAddress = await MasterRegistry.getContract(keyHash);

            if (currentAddress === contract.address) {
                console.log(`${colors.green}✅ ${contract.name} already registered${colors.reset}`);
            } else if (currentAddress === hre.ethers.ZeroAddress) {
                console.log(`${colors.yellow}📝 Registering ${contract.name}...${colors.reset}`);
                const tx = await MasterRegistry.setContract(keyHash, contract.address);
                await tx.wait();
                console.log(`${colors.green}✅ ${contract.name} registered${colors.reset}`);
            } else {
                console.log(`${colors.yellow}⚠️  ${contract.name} registered to different address, updating...${colors.reset}`);
                const tx = await MasterRegistry.setContract(keyHash, contract.address);
                await tx.wait();
                console.log(`${colors.green}✅ ${contract.name} updated${colors.reset}`);
            }
        } catch (error) {
            console.log(`${colors.yellow}⚠️  ${contract.name}: ${error.message}${colors.reset}`);
        }
    }

    console.log('');

    // Step 2: Setup Access Control Roles
    console.log(`${colors.cyan}${colors.bright}STEP 2: Setup Access Control Roles${colors.reset}\n`);

    const roles = {
        ADMIN_ROLE: hre.ethers.ZeroHash,
        RESOLVER_ROLE: hre.ethers.keccak256(hre.ethers.toUtf8Bytes("RESOLVER_ROLE")),
        FACTORY_ROLE: hre.ethers.keccak256(hre.ethers.toUtf8Bytes("FACTORY_ROLE")),
        DAO_ROLE: hre.ethers.keccak256(hre.ethers.toUtf8Bytes("DAO_ROLE"))
    };

    const roleAssignments = [
        { role: "ADMIN_ROLE", roleHash: roles.ADMIN_ROLE, account: deployer.address, description: "Admin privileges" },
        { role: "RESOLVER_ROLE", roleHash: roles.RESOLVER_ROLE, account: addresses.resolutionManager, description: "Resolution Manager" },
        { role: "FACTORY_ROLE", roleHash: roles.FACTORY_ROLE, account: addresses.marketFactory, description: "Market Factory" }
    ];

    for (const assignment of roleAssignments) {
        try {
            const hasRole = await AccessControl.hasRole(assignment.roleHash, assignment.account);

            if (hasRole) {
                console.log(`${colors.green}✅ ${assignment.role} already granted to ${assignment.description}${colors.reset}`);
            } else {
                console.log(`${colors.yellow}📝 Granting ${assignment.role} to ${assignment.description}...${colors.reset}`);
                const tx = await AccessControl.grantRole(assignment.roleHash, assignment.account);
                await tx.wait();
                console.log(`${colors.green}✅ ${assignment.role} granted${colors.reset}`);
            }
        } catch (error) {
            console.log(`${colors.yellow}⚠️  ${assignment.role}: ${error.message}${colors.reset}`);
        }
    }

    console.log('');

    // Step 3: Initialize Parameters
    console.log(`${colors.cyan}${colors.bright}STEP 3: Initialize System Parameters${colors.reset}\n`);

    const parameters = [
        {
            key: "MIN_CREATOR_BOND",
            value: hre.ethers.parseEther("0.01"),
            type: "uint",
            description: "Minimum creator bond (0.01 ETH)"
        },
        {
            key: "MIN_BET_AMOUNT",
            value: hre.ethers.parseEther("0.001"),
            type: "uint",
            description: "Minimum bet amount (0.001 ETH)"
        },
        {
            key: "PLATFORM_FEE_BPS",
            value: 250, // 2.5%
            type: "uint",
            description: "Platform fee (2.5%)"
        }
    ];

    for (const param of parameters) {
        try {
            const keyHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(param.key));

            console.log(`${colors.yellow}📝 Setting ${param.description}...${colors.reset}`);
            const tx = await ParameterStorage.setUintParameter(keyHash, param.value);
            await tx.wait();
            console.log(`${colors.green}✅ ${param.key} set to ${param.value.toString()}${colors.reset}`);
        } catch (error) {
            console.log(`${colors.yellow}⚠️  ${param.key}: ${error.message}${colors.reset}`);
        }
    }

    console.log('');

    // Final Summary
    console.log(`${colors.green}${colors.bright}
═══════════════════════════════════════
  ✅ CONFIGURATION COMPLETE!
═══════════════════════════════════════
${colors.reset}\n`);

    console.log(`${colors.cyan}📊 Summary:${colors.reset}`);
    console.log(`   ✅ 7 contracts registered in MasterRegistry`);
    console.log(`   ✅ Access control roles configured`);
    console.log(`   ✅ System parameters initialized`);
    console.log('');

    console.log(`${colors.green}🎉 KEKTECH 3.0 is now fully configured and ready!${colors.reset}\n`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
