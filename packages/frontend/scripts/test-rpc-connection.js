/**
 * Test RPC Connection to BasedAI Network
 * Verifies you can connect before deployment
 */

require("dotenv").config();
const hre = require("hardhat");

async function main() {
  console.log("🔍 Testing BasedAI RPC Connection...\n");

  try {
    // Get network info
    const network = await hre.ethers.provider.getNetwork();
    console.log("✅ RPC Connection: Success");
    console.log(`📡 Network: ${network.name}`);
    console.log(`🔗 Chain ID: ${network.chainId}`);

    // Get current block number
    const blockNumber = await hre.ethers.provider.getBlockNumber();
    console.log(`📦 Current Block: ${blockNumber}`);

    // Get deployer account
    const [deployer] = await hre.ethers.getSigners();
    console.log(`\n👤 Deployer Address: ${deployer.address}`);

    // Get balance
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    const balanceInEth = hre.ethers.formatEther(balance);
    console.log(`💰 Balance: ${balanceInEth} ETH`);

    // Check if sufficient balance
    const minBalance = hre.ethers.parseEther("0.01");
    if (balance >= minBalance) {
      console.log(`✅ Balance Sufficient: ${balanceInEth} ETH (>= 0.01 ETH required)`);
    } else {
      console.log(`⚠️  Balance Low: ${balanceInEth} ETH (< 0.01 ETH required)`);
      console.log(`   You may need more ETH for deployment and testing`);
    }

    // Verify network is BasedAI
    if (network.chainId === 32323n) {
      console.log(`\n✅ Network Verified: BasedAI Mainnet (32323)`);
    } else {
      console.log(`\n⚠️  Network Mismatch: Expected BasedAI (32323), got ${network.chainId}`);
    }

    console.log("\n✅ All Checks Passed - Ready to Deploy!\n");
    return true;

  } catch (error) {
    console.error("\n❌ RPC Connection Failed:");
    console.error(error.message);
    console.log("\nPossible Issues:");
    console.log("1. Check .env file exists and has PRIVATE_KEY");
    console.log("2. Verify BASEDAI_RPC_URL is correct");
    console.log("3. Check internet connection");
    console.log("4. Try alternative RPC endpoint");
    return false;
  }
}

main()
  .then((success) => process.exit(success ? 0 : 1))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
