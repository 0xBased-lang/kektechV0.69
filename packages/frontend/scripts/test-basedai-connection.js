/**
 * Test Connection to BasedAI Network
 * Verifies RPC connection and BASED token balance
 */

require("dotenv").config();
const { ethers } = require("ethers");

async function main() {
  console.log("🔍 Testing BasedAI Network Connection...\n");

  try {
    // Get RPC URL
    const rpcUrl = process.env.BASEDAI_RPC_URL || "https://mainnet.basedaibridge.com/rpc";
    console.log(`📡 RPC URL: ${rpcUrl}`);

    // Create provider
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // Get network info
    const network = await provider.getNetwork();
    console.log(`✅ Connected to Network`);
    console.log(`🔗 Chain ID: ${network.chainId}`);

    // Verify it's BasedAI
    if (network.chainId === 32323n) {
      console.log(`✅ Network Verified: BasedAI Mainnet (32323)\n`);
    } else {
      console.log(`⚠️  Unexpected Chain ID: ${network.chainId} (expected 32323)\n`);
    }

    // Get current block
    const blockNumber = await provider.getBlockNumber();
    console.log(`📦 Current Block: ${blockNumber}`);

    // Get deployer wallet
    if (!process.env.PRIVATE_KEY) {
      throw new Error("PRIVATE_KEY not found in .env file");
    }

    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    console.log(`\n👤 Deployer Address: ${wallet.address}`);

    // Get BASED balance
    const balance = await provider.getBalance(wallet.address);
    const balanceInBased = ethers.formatEther(balance);
    console.log(`💰 BASED Balance: ${balanceInBased} BASED`);

    // Check if sufficient
    const minBalance = ethers.parseEther("0.01");
    if (balance >= minBalance) {
      console.log(`✅ Balance Sufficient: ${balanceInBased} BASED (>= 0.01 BASED required)\n`);
    } else if (balance > 0n) {
      console.log(`⚠️  Balance Low: ${balanceInBased} BASED (< 0.01 BASED recommended)`);
      console.log(`   Deployment may work but testing may require more BASED\n`);
    } else {
      console.log(`❌ No BASED Balance: ${balanceInBased} BASED`);
      console.log(`   You need BASED tokens to deploy and test\n`);
      return false;
    }

    // Test a simple RPC call
    const gasPrice = await provider.getFeeData();
    console.log(`⛽ Gas Price: ${ethers.formatUnits(gasPrice.gasPrice || 0n, "gwei")} Gwei`);

    console.log("\n✅ All Checks Passed - BasedAI Connection Ready!\n");
    return true;

  } catch (error) {
    console.error("\n❌ BasedAI Connection Failed:");
    console.error(error.message);
    console.log("\nPossible Issues:");
    console.log("1. Check BASEDAI_RPC_URL is correct");
    console.log("2. Verify internet connection");
    console.log("3. BasedAI RPC might be down - try alternative endpoint");
    console.log("4. Check PRIVATE_KEY is valid 64-character hex");
    return false;
  }
}

main()
  .then((success) => process.exit(success ? 0 : 1))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
