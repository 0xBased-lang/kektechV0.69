const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    
    console.log("\n🔍 Checking Transaction Status\n");
    console.log("Deployer:", deployer.address);
    
    const nonce = await ethers.provider.getTransactionCount(deployer.address, "latest");
    const pendingNonce = await ethers.provider.getTransactionCount(deployer.address, "pending");
    
    console.log("Latest nonce:", nonce);
    console.log("Pending nonce:", pendingNonce);
    console.log("Stuck transactions:", pendingNonce - nonce);
    
    if (pendingNonce > nonce) {
        console.log("\n⚠️  There are", pendingNonce - nonce, "pending transactions!");
        console.log("   Waiting for transactions to clear...");
        
        // Wait a bit for transactions to process
        console.log("   Sleeping 30 seconds...");
        await new Promise(resolve => setTimeout(resolve, 30000));
        
        const newNonce = await ethers.provider.getTransactionCount(deployer.address, "latest");
        console.log("   New nonce:", newNonce);
        
        if (newNonce === nonce) {
            console.log("\n❌ Transactions still pending. Options:");
            console.log("   1. Wait longer for network to process");
            console.log("   2. Send a transaction with higher gas price to replace");
            console.log("   3. Wait for transaction to drop from mempool (~10 min)");
        } else {
            console.log("\n✅ Transactions cleared!");
        }
    } else {
        console.log("\n✅ No pending transactions - ready to deploy");
    }
}

main().catch(console.error);
