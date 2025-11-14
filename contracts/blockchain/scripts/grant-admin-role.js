const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
    const stateFile = "./sepolia-deployment-unified.json";
    const state = JSON.parse(fs.readFileSync(stateFile, "utf8"));
    
    const [deployer] = await ethers.getSigners();
    const acmAddr = state.contracts.AccessControlManager;
    const acm = await ethers.getContractAt("AccessControlManager", acmAddr);
    
    const ADMIN_ROLE = ethers.id("ADMIN_ROLE");
    
    console.log("Deployer:", deployer.address);
    console.log("ACM:", acmAddr);
    console.log("ADMIN_ROLE:", ADMIN_ROLE);
    console.log("");
    
    // Check if already has role
    const hasRole = await acm.hasRole(ADMIN_ROLE, deployer.address);
    console.log("Has ADMIN_ROLE:", hasRole);
    
    if (!hasRole) {
        console.log("\nGranting ADMIN_ROLE...");
        const tx = await acm.grantRole(ADMIN_ROLE, deployer.address);
        console.log("Transaction:", tx.hash);
        
        const receipt = await tx.wait(2);
        console.log("Confirmed! Gas:", receipt.gasUsed.toString());
        
        const hasRoleAfter = await acm.hasRole(ADMIN_ROLE, deployer.address);
        console.log("Has ADMIN_ROLE after grant:", hasRoleAfter);
    }
}

main().catch(console.error);
