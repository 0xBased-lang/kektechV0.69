const { ethers } = require("hardhat");

async function main() {
    // Test if ethers.id() matches keccak256() for the keys used
    const keys = [
        "ParameterStorage",
        "AccessControlManager",
        "ProposalManager",
        "FlexibleMarketFactory",
        "ResolutionManager",
        "RewardDistributor",
        "RESOLVER_ROLE",
        "ADMIN_ROLE"
    ];

    console.log("\n=== Testing Key Consistency ===\n");

    for (const key of keys) {
        const ethersId = ethers.id(key);
        const keccak = ethers.keccak256(ethers.toUtf8Bytes(key));

        console.log(`Key: "${key}"`);
        console.log(`  ethers.id():       ${ethersId}`);
        console.log(`  keccak256():       ${keccak}`);
        console.log(`  Match: ${ethersId === keccak ? "✅ YES" : "❌ NO"}`);
        console.log("");
    }

    // Now test what the contracts are actually looking for
    console.log("\n=== Contract Key Constants (from MasterRegistry.sol) ===\n");

    // These are from MasterRegistry.sol constants
    const contractKeys = {
        "PARAMETER_STORAGE": ethers.keccak256(ethers.toUtf8Bytes("PARAMETER_STORAGE")),
        "ACCESS_CONTROL": ethers.keccak256(ethers.toUtf8Bytes("ACCESS_CONTROL")),
        "MARKET_FACTORY": ethers.keccak256(ethers.toUtf8Bytes("MARKET_FACTORY")),
        "PROPOSAL_MANAGER": ethers.keccak256(ethers.toUtf8Bytes("PROPOSAL_MANAGER")),
        "RESOLUTION_MANAGER": ethers.keccak256(ethers.toUtf8Bytes("RESOLUTION_MANAGER")),
        "REWARD_DISTRIBUTOR": ethers.keccak256(ethers.toUtf8Bytes("REWARD_DISTRIBUTOR"))
    };

    for (const [name, hash] of Object.entries(contractKeys)) {
        console.log(`${name}: ${hash}`);
    }

    console.log("\n=== What Deployment Script is Setting ===\n");

    // These are from the deployment script
    const deploymentKeys = {
        "ParameterStorage": ethers.id("ParameterStorage"),
        "AccessControlManager": ethers.id("AccessControlManager"),
        "ProposalManager": ethers.id("ProposalManager"),
        "FlexibleMarketFactory": ethers.id("FlexibleMarketFactory"),
        "ResolutionManager": ethers.id("ResolutionManager"),
        "RewardDistributor": ethers.id("RewardDistributor")
    };

    for (const [name, hash] of Object.entries(deploymentKeys)) {
        console.log(`${name}: ${hash}`);
    }

    console.log("\n⚠️  CRITICAL MISMATCH DETECTED!");
    console.log("Contracts look for keccak256('PARAMETER_STORAGE') but deployment sets ethers.id('ParameterStorage')");
    console.log("These are DIFFERENT values and contracts won't find each other!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });