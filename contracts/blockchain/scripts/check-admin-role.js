const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
    const stateFile = "./sepolia-deployment-unified.json";
    const state = JSON.parse(fs.readFileSync(stateFile, "utf8"));
    
    const [deployer] = await ethers.getSigners();
    const factoryAddr = state.contracts.FlexibleMarketFactoryUnified;
    const acmAddr = state.contracts.AccessControlManager;
    
    const factory = await ethers.getContractAt("FlexibleMarketFactoryUnified", factoryAddr);
    const acm = await ethers.getContractAt("AccessControlManager", acmAddr);
    
    console.log("Deployer:", deployer.address);
    console.log("Factory:", factoryAddr);
    console.log("ACM:", acmAddr);
    
    // Check if factory has admin methods
    try {
        const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
        const hasRole = await acm.hasRole(DEFAULT_ADMIN_ROLE, deployer.address);
        console.log("\nDeployer has DEFAULT_ADMIN_ROLE:", hasRole);
    } catch (e) {
        console.log("Error checking role:", e.message);
    }
}

main().catch(console.error);
