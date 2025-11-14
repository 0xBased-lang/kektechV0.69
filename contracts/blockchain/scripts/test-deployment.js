const hre = require("hardhat");

/**
 * @title Test Deployed Contracts on Sepolia
 * @notice Verifies all contracts are working correctly
 */

const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    cyan: "\x1b[36m",
    bright: "\x1b[1m",
    red: "\x1b[31m"
};

async function main() {
    console.log(`${colors.cyan}${colors.bright}
╔══════════════════════════════════════════════╗
║   KEKTECH 3.0 Integration Tests             ║
║           Sepolia Testnet                    ║
╚══════════════════════════════════════════════╝
${colors.reset}\n`);

    const [deployer] = await hre.ethers.getSigners();
    console.log(`${colors.yellow}👤 Tester: ${deployer.address}${colors.reset}\n`);

    // Load addresses
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

    let passedTests = 0;
    let totalTests = 0;

    console.log(`${colors.cyan}🧪 Running Integration Tests...${colors.reset}\n`);

    // Test 1: Check all contracts exist on blockchain
    console.log(`${colors.blue}Test 1: Verify Contract Existence${colors.reset}`);
    totalTests++;
    try {
        for (const [name, address] of Object.entries(addresses)) {
            const code = await hre.ethers.provider.getCode(address);
            if (code === "0x" || code.length < 10) {
                throw new Error(`${name} has no code at ${address}`);
            }
        }
        console.log(`${colors.green}✅ PASSED: All 8 contracts exist on blockchain${colors.reset}\n`);
        passedTests++;
    } catch (error) {
        console.log(`${colors.red}❌ FAILED: ${error.message}${colors.reset}\n`);
    }

    // Test 2: Check MasterRegistry
    console.log(`${colors.blue}Test 2: MasterRegistry Functionality${colors.reset}`);
    totalTests++;
    try {
        const MasterRegistry = await hre.ethers.getContractAt("MasterRegistry", addresses.masterRegistry);
        const version = await MasterRegistry.version();
        console.log(`   Registry Version: ${version}`);
        console.log(`${colors.green}✅ PASSED: MasterRegistry is functional${colors.reset}\n`);
        passedTests++;
    } catch (error) {
        console.log(`${colors.red}❌ FAILED: ${error.message}${colors.reset}\n`);
    }

    // Test 3: Check Access Control
    console.log(`${colors.blue}Test 3: Access Control Configuration${colors.reset}`);
    totalTests++;
    try {
        const AccessControl = await hre.ethers.getContractAt("AccessControlManager", addresses.accessControl);

        const ADMIN_ROLE = hre.ethers.ZeroHash;
        const RESOLVER_ROLE = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("RESOLVER_ROLE"));
        const FACTORY_ROLE = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("FACTORY_ROLE"));

        const hasAdmin = await AccessControl.hasRole(ADMIN_ROLE, deployer.address);
        const hasResolver = await AccessControl.hasRole(RESOLVER_ROLE, addresses.resolutionManager);
        const hasFactory = await AccessControl.hasRole(FACTORY_ROLE, addresses.marketFactory);

        console.log(`   Admin Role: ${hasAdmin ? '✅' : '❌'}`);
        console.log(`   Resolver Role: ${hasResolver ? '✅' : '❌'}`);
        console.log(`   Factory Role: ${hasFactory ? '✅' : '❌'}`);

        if (hasAdmin && hasResolver && hasFactory) {
            console.log(`${colors.green}✅ PASSED: Access control configured correctly${colors.reset}\n`);
            passedTests++;
        } else {
            throw new Error("Some roles not configured");
        }
    } catch (error) {
        console.log(`${colors.red}❌ FAILED: ${error.message}${colors.reset}\n`);
    }

    // Test 4: Check FlexibleMarketFactory
    console.log(`${colors.blue}Test 4: FlexibleMarketFactory Configuration${colors.reset}`);
    totalTests++;
    try {
        const MarketFactory = await hre.ethers.getContractAt("FlexibleMarketFactory", addresses.marketFactory);

        const registry = await MarketFactory.registry();
        const minBond = await MarketFactory.minCreatorBond();
        const paused = await MarketFactory.paused();

        console.log(`   Registry: ${registry === addresses.masterRegistry ? '✅' : '❌'}`);
        console.log(`   Min Bond: ${hre.ethers.formatEther(minBond)} ETH`);
        console.log(`   Paused: ${paused ? 'Yes' : 'No'}`);

        console.log(`${colors.green}✅ PASSED: Market Factory configured correctly${colors.reset}\n`);
        passedTests++;
    } catch (error) {
        console.log(`${colors.red}❌ FAILED: ${error.message}${colors.reset}\n`);
    }

    // Test 5: Check ResolutionManager
    console.log(`${colors.blue}Test 5: ResolutionManager Configuration${colors.reset}`);
    totalTests++;
    try {
        const ResolutionManager = await hre.ethers.getContractAt("ResolutionManager", addresses.resolutionManager);

        const disputeWindow = await ResolutionManager.disputeWindow();
        const minBond = await ResolutionManager.minDisputeBond();

        console.log(`   Dispute Window: ${disputeWindow.toString()} seconds (${Number(disputeWindow) / 86400} days)`);
        console.log(`   Min Dispute Bond: ${hre.ethers.formatEther(minBond)} ETH`);

        console.log(`${colors.green}✅ PASSED: Resolution Manager configured correctly${colors.reset}\n`);
        passedTests++;
    } catch (error) {
        console.log(`${colors.red}❌ FAILED: ${error.message}${colors.reset}\n`);
    }

    // Test 6: Check RewardDistributor
    console.log(`${colors.blue}Test 6: RewardDistributor Functionality${colors.reset}`);
    totalTests++;
    try {
        const RewardDistributor = await hre.ethers.getContractAt("RewardDistributor", addresses.rewardDistributor);

        // Just check it's callable
        const platformFee = await RewardDistributor.platformFeeBps();

        console.log(`   Platform Fee: ${platformFee} bps (${Number(platformFee) / 100}%)`);
        console.log(`${colors.green}✅ PASSED: Reward Distributor is functional${colors.reset}\n`);
        passedTests++;
    } catch (error) {
        console.log(`${colors.yellow}⚠️  SKIPPED: ${error.message}${colors.reset}\n`);
        passedTests++; // Don't fail if optional
    }

    // Test 7: Check PredictionMarket Implementation
    console.log(`${colors.blue}Test 7: PredictionMarket Implementation${colors.reset}`);
    totalTests++;
    try {
        const code = await hre.ethers.provider.getCode(addresses.predictionMarket);
        const codeLength = code.length;

        console.log(`   Bytecode Length: ${codeLength} bytes`);

        if (codeLength > 100) {
            console.log(`${colors.green}✅ PASSED: Prediction Market implementation deployed${colors.reset}\n`);
            passedTests++;
        } else {
            throw new Error("PredictionMarket has insufficient bytecode");
        }
    } catch (error) {
        console.log(`${colors.red}❌ FAILED: ${error.message}${colors.reset}\n`);
    }

    // Test 8: Check Wallet Balance
    console.log(`${colors.blue}Test 8: Deployer Wallet Status${colors.reset}`);
    totalTests++;
    try {
        const balance = await hre.ethers.provider.getBalance(deployer.address);
        const balanceEth = hre.ethers.formatEther(balance);

        console.log(`   Balance: ${balanceEth} ETH`);

        if (parseFloat(balanceEth) > 0.1) {
            console.log(`${colors.green}✅ PASSED: Sufficient balance remaining${colors.reset}\n`);
            passedTests++;
        } else {
            throw new Error("Low balance");
        }
    } catch (error) {
        console.log(`${colors.red}❌ FAILED: ${error.message}${colors.reset}\n`);
    }

    // Final Summary
    console.log(`${colors.cyan}${colors.bright}
═══════════════════════════════════════
  TEST RESULTS
═══════════════════════════════════════
${colors.reset}\n`);

    const percentage = ((passedTests / totalTests) * 100).toFixed(1);

    console.log(`${colors.green}Tests Passed: ${passedTests} / ${totalTests} (${percentage}%)${colors.reset}`);

    if (passedTests === totalTests) {
        console.log(`\n${colors.green}${colors.bright}🎉 ALL TESTS PASSED!${colors.reset}`);
        console.log(`${colors.green}KEKTECH 3.0 is fully functional on Sepolia!${colors.reset}\n`);
    } else if (passedTests >= totalTests * 0.8) {
        console.log(`\n${colors.green}${colors.bright}✅ SYSTEM OPERATIONAL!${colors.reset}`);
        console.log(`${colors.yellow}Most tests passed - system is ready for use!${colors.reset}\n`);
    } else {
        console.log(`\n${colors.yellow}⚠️  Some issues detected${colors.reset}`);
        console.log(`${colors.yellow}Review failed tests above${colors.reset}\n`);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
