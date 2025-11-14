const { ethers } = require("hardhat");

async function main() {
    console.log("\n🔍 BasedAI Mainnet - Deployer Account Check\n");
    
    const [deployer] = await ethers.getSigners();
    
    console.log("   Address:", deployer.address);
    
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("   Balance:", ethers.formatEther(balance), "BASED");
    
    const feeData = await ethers.provider.getFeeData();
    const gasPrice = feeData.gasPrice || feeData.maxFeePerGas;
    console.log("   Gas Price:", ethers.formatUnits(gasPrice, "gwei"), "gwei");
    
    // Estimate deployment cost (from fork testing)
    const estimatedGas = BigInt(8276148);
    const estimatedCost = estimatedGas * gasPrice;
    console.log("   Estimated Deploy Cost:", ethers.formatEther(estimatedCost), "BASED");
    console.log("   Sufficient Funds:", balance > estimatedCost ? "✅ YES" : "❌ NO\n");
    
    if (balance <= estimatedCost) {
        console.log("⚠️  WARNING: Insufficient funds for deployment!");
        console.log("   Need at least:", ethers.formatEther(estimatedCost * BigInt(12) / BigInt(10)), "BASED (with 20% buffer)");
        process.exit(1);
    }
    
    console.log("✅ Account ready for deployment!\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
