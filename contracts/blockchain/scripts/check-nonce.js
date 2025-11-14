const { ethers } = require("hardhat");

async function main() {
    console.log("\n🔍 NONCE STATUS CHECK\n");

    const [deployer] = await ethers.getSigners();

    console.log("Wallet Address:", deployer.address);

    // Get transaction count (nonce)
    const nonce = await ethers.provider.getTransactionCount(deployer.address, "latest");
    const pendingNonce = await ethers.provider.getTransactionCount(deployer.address, "pending");

    console.log("Latest Nonce:", nonce);
    console.log("Pending Nonce:", pendingNonce);
    console.log("Pending Transactions:", pendingNonce - nonce);

    if (pendingNonce > nonce) {
        console.log("\n⚠️  WARNING: You have", pendingNonce - nonce, "pending transaction(s)");
        console.log("💡 Wait for pending transactions to confirm before deploying");
    } else {
        console.log("\n✅ No pending transactions - safe to deploy");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
