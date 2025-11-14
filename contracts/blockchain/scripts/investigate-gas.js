const { ethers } = require("hardhat");

async function main() {
    console.log("\n🔍 Investigating Gas Issue\n");
    
    const [deployer] = await ethers.getSigners();
    const balance = await ethers.provider.getBalance(deployer.address);
    const feeData = await ethers.provider.getFeeData();
    
    console.log("Deployer balance:", ethers.formatEther(balance), "BASED");
    console.log("\nFee Data:");
    console.log("  gasPrice:", feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, "gwei") + " gwei" : "null");
    console.log("  maxFeePerGas:", feeData.maxFeePerGas ? ethers.formatUnits(feeData.maxFeePerGas, "gwei") + " gwei" : "null");
    console.log("  maxPriorityFeePerGas:", feeData.maxPriorityFeePerGas ? ethers.formatUnits(feeData.maxPriorityFeePerGas, "gwei") + " gwei" : "null");
    
    // Try estimating deployment
    console.log("\n🧪 Testing contract deployment gas estimation:");
    try {
        const Registry = await ethers.getContractFactory("MasterRegistry");
        const deployTx = await Registry.getDeployTransaction();
        
        console.log("\nDeploy transaction data length:", deployTx.data.length, "bytes");
        
        // Try with lower gas limit
        console.log("\n✅ Attempting deployment without explicit gasLimit...");
        const registry = await Registry.deploy();
        const deployReceipt = await registry.deploymentTransaction().wait();
        
        console.log("\n🎉 SUCCESS! Contract deployed at:", await registry.getAddress());
        console.log("   Gas used:", deployReceipt.gasUsed.toString());
        console.log("   Gas price:", ethers.formatUnits(deployReceipt.gasPrice, "gwei"), "gwei");
        console.log("   Cost:", ethers.formatEther(deployReceipt.gasUsed * deployReceipt.gasPrice), "BASED");
    } catch (error) {
        console.log("\n❌ Deployment failed:", error.message);
        
        // Check if it's really a gas issue
        if (error.message.includes("insufficient funds")) {
            const gasLimit = 6000000n;
            const gasPrice = feeData.gasPrice || feeData.maxFeePerGas;
            const requiredFunds = gasLimit * gasPrice;
            
            console.log("\n💰 Gas Calculation:");
            console.log("   Gas limit:", gasLimit.toString());
            console.log("   Gas price:", gasPrice.toString(), "wei");
            console.log("   Required funds:", ethers.formatEther(requiredFunds), "BASED");
            console.log("   Your balance:", ethers.formatEther(balance), "BASED");
            console.log("   Shortfall:", ethers.formatEther(requiredFunds - balance), "BASED");
        }
    }
}

main().catch(console.error);
