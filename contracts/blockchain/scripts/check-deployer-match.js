const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
    console.log("\n🔍 INVESTIGATING DEPLOYER ADDRESS MISMATCH\n");

    // Get the signer from Hardhat
    const [deployer] = await ethers.getSigners();
    console.log("Deployer from private key:", deployer.address);

    // Get balance of this address
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Balance of deployer:", ethers.formatEther(balance), "BASED\n");

    // Check the configured addresses
    console.log("Configured Addresses:");
    console.log("MAINNET_OWNER:", process.env.MAINNET_OWNER);
    console.log("TEAM_WALLET:", process.env.TEAM_WALLET);
    console.log("INCENTIVES_WALLET:", process.env.INCENTIVES_WALLET);

    // Check if deployer matches owner
    const matchesOwner = deployer.address.toLowerCase() === process.env.MAINNET_OWNER?.toLowerCase();
    console.log("\n❓ Does deployer match MAINNET_OWNER?", matchesOwner ? "YES ✅" : "NO ❌");

    if (!matchesOwner) {
        console.log("\n⚠️  WARNING: Deployer address does NOT match MAINNET_OWNER!");
        console.log("The private key in .env generates:", deployer.address);
        console.log("But MAINNET_OWNER is set to:", process.env.MAINNET_OWNER);
        console.log("\n💡 SOLUTION: The funds are at", process.env.MAINNET_OWNER);
        console.log("But you're trying to deploy from:", deployer.address);
        console.log("\nYou need to either:");
        console.log("1. Use the private key for", process.env.MAINNET_OWNER);
        console.log("2. OR send BASED to", deployer.address);
    } else {
        console.log("\n✅ Addresses match! This is not the issue.");
        console.log("\nThe problem must be something else with BasedAI network.");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
