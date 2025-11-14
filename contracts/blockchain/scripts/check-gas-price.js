const { ethers } = require("hardhat");

async function main() {
    console.log("\n⛽ Checking BasedAI Gas Prices...\n");

    const feeData = await ethers.provider.getFeeData();

    console.log("Gas Price:", ethers.formatUnits(feeData.gasPrice || 0n, "gwei"), "gwei");
    console.log("Max Fee Per Gas:", ethers.formatUnits(feeData.maxFeePerGas || 0n, "gwei"), "gwei");
    console.log("Max Priority Fee:", ethers.formatUnits(feeData.maxPriorityFeePerGas || 0n, "gwei"), "gwei");

    console.log("\nEstimated costs:");
    const gasLimit = 5000000n;
    const gasPrice = feeData.gasPrice || 1000000000n; // 1 gwei fallback

    const cost = gasLimit * gasPrice;
    console.log("5M gas limit cost:", ethers.formatEther(cost), "$BASED");

    const [deployer] = await ethers.getSigners();
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Wallet balance:", ethers.formatEther(balance), "$BASED");

    if (balance >= cost * 9n) {
        console.log("\n✅ Sufficient for 9 deployments");
    } else {
        console.log("\n❌ Insufficient for 9 deployments");
        console.log("   Need:", ethers.formatEther(cost * 9n), "$BASED");
        console.log("   Have:", ethers.formatEther(balance), "$BASED");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
