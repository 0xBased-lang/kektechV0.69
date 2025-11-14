const { ethers } = require('hardhat');

async function main() {
    const [deployer] = await ethers.getSigners();
    const balance = await ethers.provider.getBalance(deployer.address);
    const network = await ethers.provider.getNetwork();

    console.log('\n📊 Wallet Information:');
    console.log('   Network:', network.name, `(Chain ID: ${network.chainId})`);
    console.log('   Address:', deployer.address);
    console.log('   Balance:', ethers.formatEther(balance), 'ETH');

    // Estimate if balance is sufficient
    const minRequired = ethers.parseEther('0.2'); // Rough estimate
    if (balance < minRequired) {
        console.log('   ⚠️  WARNING: Balance may be insufficient');
        console.log('   💡 Recommended: At least 0.2 ETH\n');
    } else {
        console.log('   ✅ Balance sufficient for deployment\n');
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
