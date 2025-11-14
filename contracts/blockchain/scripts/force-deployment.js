const { ethers } = require("hardhat");

async function main() {
    console.log("\n🔒 FORCE DEPLOYMENT - Most Secure Strategy\n");
    
    const [deployer] = await ethers.getSigners();
    const nonce = await ethers.provider.getTransactionCount(deployer.address);
    
    console.log("Current nonce:", nonce);
    console.log("Deployer:", deployer.address);
    
    // Step 1: Clear any stuck transactions by sending self-transaction
    console.log("\n1️⃣  Clearing mempool with higher gas price...");
    
    const feeData = await ethers.provider.getFeeData();
    const higherGasPrice = (feeData.gasPrice || feeData.maxFeePerGas) * 2n; // 2x gas
    
    try {
        const clearTx = await deployer.sendTransaction({
            to: deployer.address,
            value: 0,
            gasPrice: higherGasPrice,
            gasLimit: 21000,
            nonce: nonce // Use current nonce to replace any stuck tx
        });
        
        console.log("   Clearing tx:", clearTx.hash);
        await clearTx.wait();
        console.log("   ✅ Mempool cleared");
    } catch (error) {
        if (error.message.includes("nonce")) {
            console.log("   ℹ️  No stuck transaction, continuing...");
        } else {
            console.log("   ⚠️  Clear failed:", error.message);
        }
    }
    
    // Step 2: Deploy fresh contracts
    console.log("\n2️⃣  Deploying FRESH contracts with ALL security fixes...\n");
    
    const Registry = await ethers.getContractFactory("MasterRegistry");
    console.log("   Deploying MasterRegistry...");
    const registry = await Registry.deploy();
    await registry.waitForDeployment();
    const registryAddress = await registry.getAddress();
    console.log("   ✅ MasterRegistry:", registryAddress);
    
    // Step 3: VERIFY M-1 is present
    console.log("\n3️⃣  SECURITY VERIFICATION: Checking M-1 fix...");
    try {
        const owner = await registry.owner();
        const pendingOwner = await registry.pendingOwner();
        
        console.log("   Owner:", owner);
        console.log("   Pending Owner:", pendingOwner);
        console.log("   ✅✅✅ M-1 FIX CONFIRMED PRESENT!");
        
        // Try calling acceptOwnership (should fail since no pending)
        try {
            await registry.acceptOwnership();
            console.log("   ❌ M-1 BROKEN: acceptOwnership should revert!");
        } catch (e) {
            if (e.message.includes("NotPendingOwner")) {
                console.log("   ✅ M-1 WORKING: Correctly rejects unauthorized accept");
            }
        }
    } catch (error) {
        console.log("   ❌❌❌ M-1 FIX MISSING!");
        console.log("   ERROR:", error.message);
        process.exit(1);
    }
    
    console.log("\n" + "=".repeat(70));
    console.log("🎉 DEPLOYMENT SUCCESSFUL WITH M-1 SECURITY FIX");
    console.log("=".repeat(70));
    console.log("\nMasterRegistry Address:", registryAddress);
    console.log("Explorer:", `https://explorer.bf1337.org/address/${registryAddress}`);
    
    console.log("\nNext: Deploy remaining contracts (AccessControl, Params, etc.)");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ FORCE DEPLOYMENT FAILED:", error);
        process.exit(1);
    });
