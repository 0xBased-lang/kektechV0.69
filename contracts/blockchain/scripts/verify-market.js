const { ethers } = require("hardhat");

async function main() {
    const factoryAddr = "0x7C1F088c77caD4e10C053c84e8BCF4E2290092b1";
    const marketAddr = "0xE11B1EC6D221919e46aA470c3BcBf899ae28879C";
    
    const factory = await ethers.getContractAt("FlexibleMarketFactoryUnified", factoryAddr);
    
    // Check if market exists
    const isMarket = await factory.isMarket(marketAddr);
    console.log("isMarket:", isMarket);
    
    // Try to get market data
    try {
        const marketData = await factory.getMarketData(marketAddr);
        console.log("Market exists:", marketData.exists);
        console.log("Market active:", marketData.isActive);
        console.log("Creator bond:", ethers.formatEther(marketData.creatorBond), "ETH");
    } catch (e) {
        console.log("Error getting market data:", e.message);
    }
}

main().catch(console.error);
