const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
    const stateFile = "./sepolia-deployment-unified.json";
    const state = JSON.parse(fs.readFileSync(stateFile, "utf8"));
    
    const [deployer] = await ethers.getSigners();
    const acmAddr = state.contracts.AccessControlManager;
    const acm = await ethers.getContractAt("AccessControlManager", acmAddr);
    
    const BACKEND_ROLE = ethers.id("BACKEND_ROLE");
    
    console.log("Deployer:", deployer.address);
    console.log("BACKEND_ROLE:", BACKEND_ROLE);
    
    const hasRole = await acm.hasRole(BACKEND_ROLE, deployer.address);
    console.log("Has BACKEND_ROLE:", hasRole);
    
    if (!hasRole) {
        console.log("\nGranting BACKEND_ROLE...");
        const tx = await acm.grantRole(BACKEND_ROLE, deployer.address);
        console.log("Transaction:", tx.hash);
        
        const receipt = await tx.wait(2);
        console.log("Confirmed! Gas:", receipt.gasUsed.toString());
        console.log("Has BACKEND_ROLE after grant:", await acm.hasRole(BACKEND_ROLE, deployer.address));
    }
}

main().catch(console.error);
