const hre = require("hardhat");

async function main() {
    console.log("\n🔍 Checking Sepolia Wallet Status...\n");

    const [deployer] = await hre.ethers.getSigners();
    const balance = await hre.ethers.provider.getBalance(deployer.address);

    console.log("📋 Deployer Information:");
    console.log("   Address:", deployer.address);
    console.log("   Balance:", hre.ethers.formatEther(balance), "ETH");

    // Check network
    const network = await hre.ethers.provider.getNetwork();
    console.log("\n🌐 Network Information:");
    console.log("   Name:", network.name);
    console.log("   Chain ID:", network.chainId.toString());

    // Check if we have enough for deployment
    const minRequired = hre.ethers.parseEther("0.3");
    console.log("\n💰 Funding Check:");
    console.log("   Minimum Required: 0.3 ETH");
    console.log("   Current Balance:", hre.ethers.formatEther(balance), "ETH");

    if (balance < minRequired) {
        console.log("\n⚠️  WARNING: Balance may be insufficient!");
        console.log("   Recommended: At least 0.5 ETH for full deployment");
        console.log("   Get testnet ETH from:");
        console.log("   - https://sepoliafaucet.com/");
        console.log("   - https://faucet.sepolia.dev/");
        console.log("   - https://sepolia-faucet.pk910.de/");
    } else {
        console.log("\n✅ Sufficient balance for deployment!");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
