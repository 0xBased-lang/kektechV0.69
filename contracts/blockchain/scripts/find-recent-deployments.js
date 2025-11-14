const { ethers } = require("hardhat");

async function main() {
    console.log("\n🔍 Finding Recent Contract Deployments\n");
    
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);
    
    // Check blocks from 3 hours ago (blocks 2522840-2522920)
    const startBlock = 2522840;
    const endBlock = 2522920;
    
    console.log(`\nScanning blocks ${startBlock} to ${endBlock}...\n`);
    
    const deployments = [];
    
    for (let blockNum = startBlock; blockNum <= endBlock; blockNum++) {
        try {
            const block = await ethers.provider.getBlock(blockNum, true);
            
            if (!block || !block.transactions) continue;
            
            for (const tx of block.transactions) {
                if (!tx || !tx.from) continue;
                
                // Check if from our deployer and is contract creation
                if (tx.from.toLowerCase() === deployer.address.toLowerCase() && !tx.to) {
                    const receipt = await ethers.provider.getTransactionReceipt(tx.hash);
                    
                    if (receipt && receipt.contractAddress) {
                        deployments.push({
                            block: blockNum,
                            hash: tx.hash,
                            address: receipt.contractAddress
                        });
                        
                        console.log(`Block ${blockNum}: ${receipt.contractAddress}`);
                    }
                }
            }
        } catch (error) {
            // Skip errors
        }
    }
    
    console.log(`\n\nFound ${deployments.length} deployments:\n`);
    
    // Now check each one for M-1
    for (const deployment of deployments) {
        console.log(`\nChecking ${deployment.address}...`);
        
        try {
            const registry = await ethers.getContractAt("MasterRegistry", deployment.address);
            const owner = await registry.owner();
            
            console.log("  ✅ Type: MasterRegistry");
            console.log("  Owner:", owner);
            
            try {
                const pendingOwner = await registry.pendingOwner();
                console.log("  ✅✅✅ M-1 FIX PRESENT! pendingOwner =", pendingOwner);
            } catch (e) {
                console.log("  ❌❌❌ M-1 FIX MISSING!");
            }
        } catch (e) {
            console.log("  Not MasterRegistry");
        }
    }
}

main().catch(console.error);
