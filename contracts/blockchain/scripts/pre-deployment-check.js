const hre = require("hardhat");

/**
 * Pre-Deployment Safety Checks
 * Verifies everything is ready before spending real ETH
 */

async function main() {
    console.log('\n🔍 PRE-DEPLOYMENT SAFETY CHECKS\n');
    console.log('═══════════════════════════════════════\n');

    let allPassed = true;

    // 1. Network Check
    console.log('1️⃣  Network Configuration');
    const network = hre.network.name;
    const chainId = hre.network.config.chainId;

    console.log(`   Network: ${network}`);
    console.log(`   Chain ID: ${chainId}`);

    if (network !== 'sepolia') {
        console.log('   ❌ WRONG NETWORK! Expected: sepolia');
        allPassed = false;
    } else if (chainId !== 11155111) {
        console.log('   ❌ WRONG CHAIN ID! Expected: 11155111');
        allPassed = false;
    } else {
        console.log('   ✅ Correct network\n');
    }

    // 2. Wallet Check
    console.log('2️⃣  Wallet Configuration');
    const [deployer] = await hre.ethers.getSigners();
    const address = deployer.address;
    const balance = await deployer.provider.getBalance(address);
    const balanceEth = hre.ethers.formatEther(balance);

    console.log(`   Address: ${address}`);
    console.log(`   Balance: ${balanceEth} ETH`);

    if (parseFloat(balanceEth) < 0.27) {
        console.log('   ⚠️  WARNING: Balance may be insufficient');
        console.log('   Recommended: 0.27 ETH minimum');
        allPassed = false;
    } else {
        console.log('   ✅ Sufficient balance\n');
    }

    // 3. RPC Connection
    console.log('3️⃣  RPC Connection');
    try {
        const blockNumber = await deployer.provider.getBlockNumber();
        console.log(`   Current Block: ${blockNumber}`);
        console.log('   ✅ RPC responding\n');
    } catch (e) {
        console.log('   ❌ RPC connection failed!');
        console.log(`   Error: ${e.message}`);
        allPassed = false;
    }

    // 4. Contract Compilation
    console.log('4️⃣  Contract Compilation');
    const requiredContracts = [
        'MasterRegistry',
        'AccessControlManager',
        'ParameterStorage',
        'ProposalManagerV2',
        'FlexibleMarketFactory',
        'ResolutionManager',
        'RewardDistributor',
        'PredictionMarket'
    ];

    let compilationPassed = true;
    for (const contractName of requiredContracts) {
        try {
            await hre.ethers.getContractFactory(contractName);
            console.log(`   ✅ ${contractName}`);
        } catch (e) {
            console.log(`   ❌ ${contractName} - ${e.message}`);
            compilationPassed = false;
            allPassed = false;
        }
    }
    if (compilationPassed) {
        console.log('   ✅ All contracts compiled\n');
    } else {
        console.log('   ❌ Compilation issues detected!\n');
    }

    // 5. Gas Price Check
    console.log('5️⃣  Gas Price Check');
    try {
        const feeData = await deployer.provider.getFeeData();
        const gasPriceGwei = hre.ethers.formatUnits(feeData.gasPrice, 'gwei');

        console.log(`   Current Gas Price: ${gasPriceGwei} gwei`);

        if (parseFloat(gasPriceGwei) > 50) {
            console.log('   ⚠️  Gas price is HIGH! Consider waiting');
        } else if (parseFloat(gasPriceGwei) > 30) {
            console.log('   ⚠️  Gas price is moderate');
        } else {
            console.log('   ✅ Gas price is good');
        }
        console.log('');
    } catch (e) {
        console.log('   ⚠️  Could not fetch gas price');
        console.log('');
    }

    // 6. Deployment Directory
    console.log('6️⃣  Deployment Directory');
    const fs = require('fs');
    const path = require('path');
    const deploymentsDir = path.join(__dirname, '../deployments');

    if (fs.existsSync(deploymentsDir)) {
        console.log(`   ✅ Directory exists: ${deploymentsDir}\n`);
    } else {
        console.log('   ❌ Deployments directory missing!');
        allPassed = false;
    }

    // 7. Etherscan API Key
    console.log('7️⃣  Etherscan Configuration');
    if (process.env.ETHERSCAN_API_KEY && process.env.ETHERSCAN_API_KEY !== 'YOUR_ETHERSCAN_API_KEY') {
        console.log('   ✅ Etherscan API key configured\n');
    } else {
        console.log('   ⚠️  Etherscan API key not set');
        console.log('   (Verification will be manual)\n');
    }

    // Final Summary
    console.log('═══════════════════════════════════════\n');

    if (allPassed) {
        console.log('✅ ALL SAFETY CHECKS PASSED!\n');
        console.log('🚀 Ready to deploy to Sepolia\n');
        console.log('📋 Estimated Costs:');
        console.log('   Deployment: ~0.25 ETH');
        console.log('   Configuration: ~0.02 ETH');
        console.log('   Total: ~0.27 ETH\n');
        console.log(`💰 Your balance: ${balanceEth} ETH`);
        console.log(`💰 After deployment: ~${(parseFloat(balanceEth) - 0.27).toFixed(4)} ETH\n`);
        console.log('═══════════════════════════════════════\n');

        return 0;
    } else {
        console.log('❌ SAFETY CHECKS FAILED!\n');
        console.log('⚠️  Please fix the issues above before deploying\n');
        console.log('═══════════════════════════════════════\n');

        return 1;
    }
}

main()
    .then((code) => process.exit(code))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
