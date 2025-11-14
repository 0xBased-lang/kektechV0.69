const hre = require("hardhat");

async function main() {
    console.log("\n🔍 Verifying Wallet Information...\n");
    
    // Get signer from hardhat config
    const [deployer] = await hre.ethers.getSigners();
    
    console.log("📋 Wallet Details:");
    console.log("   Address:", deployer.address);
    
    // Check balance
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("   Balance:", hre.ethers.formatEther(balance), "ETH");
    
    // Network info
    const network = await hre.ethers.provider.getNetwork();
    console.log("\n🌐 Network:");
    console.log("   Name:", network.name);
    console.log("   Chain ID:", network.chainId.toString());
    
    console.log("\n📍 Etherscan Link:");
    console.log("   https://sepolia.etherscan.io/address/" + deployer.address);
}

main().then(() => process.exit(0)).catch(console.error);
