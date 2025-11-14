const { ethers } = require("hardhat");

async function main() {
    const factoryAddr = "0x7C1F088c77caD4e10C053c84e8BCF4E2290092b1";
    const marketAddr = "0xE11B1EC6D221919e46aA470c3BcBf899ae28879C";
    
    const factory = await ethers.getContractAt("FlexibleMarketFactoryUnified", factoryAddr);
    const [signer] = await ethers.getSigners();
    
    console.log("Signer:", signer.address);
    console.log("Factory:", factoryAddr);
    console.log("Market:", marketAddr);
    console.log("");
    
    console.log("Attempting to approve market...");
    try {
        // Try with call first to see revert reason
        await factory.adminApproveMarket.staticCall(marketAddr);
        console.log("Static call succeeded! Now sending transaction...");
        
        const tx = await factory.adminApproveMarket(marketAddr);
        console.log("Transaction sent:", tx.hash);
        
        const receipt = await tx.wait();
        console.log("Transaction confirmed!");
        console.log("Gas used:", receipt.gasUsed.toString());
    } catch (error) {
        console.log("Error:", error.message);
        if (error.data) {
            console.log("Error data:", error.data);
        }
    }
}

main().catch(console.error);
