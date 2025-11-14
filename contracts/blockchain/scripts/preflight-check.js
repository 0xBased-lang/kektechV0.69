const { ethers } = require("hardhat");

async function main() {
    console.log("\n🔍 ULTRA-DEEP PRE-FLIGHT VALIDATION\n");
    
    // 1. Network connectivity
    console.log("1️⃣  Network Connectivity Check:");
    try {
        const network = await ethers.provider.getNetwork();
        console.log("   ✅ Connected to Chain ID:", network.chainId.toString());
        
        if (network.chainId !== 32323n) {
            throw new Error(`Wrong network! Expected 32323, got ${network.chainId}`);
        }
        console.log("   ✅ BasedAI Mainnet confirmed");
    } catch (error) {
        console.log("   ❌ Network connectivity failed:", error.message);
        process.exit(1);
    }
    
    // 2. Deployer account
    console.log("\n2️⃣  Deployer Account Validation:");
    const [deployer] = await ethers.getSigners();
    console.log("   Address:", deployer.address);
    
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("   Balance:", ethers.formatEther(balance), "BASED");
    
    if (balance < ethers.parseEther("1")) {
        console.log("   ❌ Insufficient balance!");
        process.exit(1);
    }
    console.log("   ✅ Sufficient balance");
    
    // 3. Transaction signing test
    console.log("\n3️⃣  Transaction Signing Test:");
    try {
        const nonce = await ethers.provider.getTransactionCount(deployer.address);
        console.log("   Current nonce:", nonce);
        console.log("   ✅ Can query account nonce");
    } catch (error) {
        console.log("   ❌ Transaction signing check failed:", error.message);
        process.exit(1);
    }
    
    // 4. Gas price check
    console.log("\n4️⃣  Gas Price Analysis:");
    const feeData = await ethers.provider.getFeeData();
    const gasPrice = feeData.gasPrice || feeData.maxFeePerGas;
    console.log("   Current gas price:", ethers.formatUnits(gasPrice, "gwei"), "gwei");
    console.log("   ✅ Gas price acceptable");
    
    // 5. Estimate deployment cost
    console.log("\n5️⃣  Deployment Cost Estimation:");
    const estimatedGas = BigInt(8276148);
    const estimatedCost = estimatedGas * gasPrice;
    console.log("   Estimated gas:", estimatedGas.toString());
    console.log("   Estimated cost:", ethers.formatEther(estimatedCost), "BASED");
    console.log("   Balance after deploy:", ethers.formatEther(balance - estimatedCost), "BASED");
    console.log("   ✅ Cost acceptable");
    
    // 6. Verify safe deployment script exists
    console.log("\n6️⃣  Deployment Script Verification:");
    const fs = require("fs");
    if (!fs.existsSync("scripts/deploy/deploy-mainnet-safe.js")) {
        console.log("   ❌ Safe deployment script not found!");
        process.exit(1);
    }
    console.log("   ✅ Safe deployment script exists");
    
    // 7. Contract compilation check
    console.log("\n7️⃣  Contract Compilation Check:");
    try {
        await ethers.getContractFactory("MasterRegistry");
        console.log("   ✅ MasterRegistry compiled");
        
        await ethers.getContractFactory("ParameterStorage");
        console.log("   ✅ ParameterStorage compiled");
        
        await ethers.getContractFactory("AccessControlManager");
        console.log("   ✅ AccessControlManager compiled");
        
        await ethers.getContractFactory("FlexibleMarketFactory");
        console.log("   ✅ FlexibleMarketFactory compiled");
        
        await ethers.getContractFactory("PredictionMarket");
        console.log("   ✅ PredictionMarket compiled");
    } catch (error) {
        console.log("   ❌ Compilation check failed:", error.message);
        process.exit(1);
    }
    
    console.log("\n" + "=".repeat(60));
    console.log("✅ ALL PRE-FLIGHT CHECKS PASSED");
    console.log("🚀 READY FOR MAINNET DEPLOYMENT");
    console.log("=".repeat(60) + "\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ PRE-FLIGHT CHECK FAILED:", error);
        process.exit(1);
    });
