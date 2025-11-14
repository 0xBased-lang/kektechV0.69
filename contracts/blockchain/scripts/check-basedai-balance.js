const { ethers } = require("hardhat");

async function main() {
    console.log("\n💰 Checking BasedAI Mainnet Wallet Balance...\n");

    const [deployer] = await ethers.getSigners();
    const balance = await ethers.provider.getBalance(deployer.address);

    console.log("Deployer Address:", deployer.address);
    console.log("Balance:", ethers.formatEther(balance), "$BASED");
    console.log("");

    // Check if sufficient for deployment
    const estimatedCost = ethers.parseEther("0.01"); // ~$10-20 estimate
    const requiredBalance = estimatedCost * 150n / 100n; // 50% buffer

    if (balance >= requiredBalance) {
        console.log("✅ Sufficient balance for deployment!");
        console.log("   Required:", ethers.formatEther(requiredBalance), "$BASED");
        console.log("   Available:", ethers.formatEther(balance), "$BASED");
    } else {
        console.log("❌ Insufficient balance!");
        console.log("   Required:", ethers.formatEther(requiredBalance), "$BASED");
        console.log("   Available:", ethers.formatEther(balance), "$BASED");
        console.log("   Need:", ethers.formatEther(requiredBalance - balance), "$BASED more");
    }

    // Get network info
    const network = await ethers.provider.getNetwork();
    console.log("\nNetwork Info:");
    console.log("   Chain ID:", network.chainId.toString());
    console.log("   Name:", network.name);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
