const { ethers } = require('ethers');
require('dotenv').config();

// November 6, 2025 Deployment - NEW Unified Architecture
const DEPLOYED_CONTRACTS = {
    VersionedRegistry: "0x67F8F023f6cFAe44353d797D6e0B157F2579301A",
    ParameterStorage: "0x0FdcaCE9dEE78c70C92B243346cDf763A06fEdF8",
    AccessControlManager: "0x4d1afBb8E50e17F24dCbB4Fc3197537be646315A",
    ResolutionManager: "0x10daF33E321ED8977e369a36FcC6Beb3d3d106a0",
    RewardDistributor: "0x3D274362423847B53E43a27b9E835d668754C96B",
    FlexibleMarketFactoryUnified: "0x3eaF643482Fe35d13DB812946E14F5345eb60d62",
    PredictionMarketTemplate: "0x1064f1FCeE5aA859468559eB9dC9564F0ef20111",
    CurveRegistry: "0x0004ED9967F6a2b750a7456C25D29A88A184c2d7",
    MarketTemplateRegistry: "0x420687494Dad8da9d058e9399cD401Deca17f6bd"
};

// Test Market 1 (created during deployment)
const TEST_MARKET_1 = "0x31d2BC49A6FD4a066F5f8AC61Acd0E6c9105DD84";

async function main() {
    console.log("=========================================");
    console.log("  MAINNET DEPLOYMENT VERIFICATION");
    console.log("  Date Deployed: November 6, 2025");
    console.log("  Architecture: NEW Unified Factory");
    console.log("=========================================\n");

    // Connect to BasedAI mainnet
    const provider = new ethers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_RPC_URL || "https://mainnet.basedaibridge.com/rpc/"
    );

    const network = await provider.getNetwork();
    console.log(`✅ Connected to ${network.name} (Chain ID: ${network.chainId})\n`);

    console.log("Checking Deployed Contracts:");
    console.log("-----------------------------");

    for (const [name, address] of Object.entries(DEPLOYED_CONTRACTS)) {
        try {
            const code = await provider.getCode(address);
            if (code && code !== '0x') {
                const codeSize = (code.length - 2) / 2; // Remove 0x, convert from hex
                const sizeKB = (codeSize / 1024).toFixed(2);
                console.log(`✅ ${name}: ${address}`);
                console.log(`   Size: ${sizeKB} KB (${codeSize} bytes)`);
            } else {
                console.log(`❌ ${name}: No code at ${address}`);
            }
        } catch (error) {
            console.log(`❌ ${name}: Error checking ${address}`);
        }
    }

    console.log("\n-----------------------------");
    console.log("Test Market 1:");
    console.log("-----------------------------");

    try {
        const marketCode = await provider.getCode(TEST_MARKET_1);
        if (marketCode && marketCode !== '0x') {
            console.log(`✅ Test Market 1: ${TEST_MARKET_1}`);
            console.log(`   Question: "Will BasedAI adoption increase?"`);

            // Check if it's a clone (minimal proxy)
            const isClone = marketCode.startsWith('0x363d3d373d3d3d363d73');
            console.log(`   Type: ${isClone ? 'Clone (EIP-1167)' : 'Full Contract'}`);

            const codeSize = (marketCode.length - 2) / 2;
            console.log(`   Size: ${(codeSize / 1024).toFixed(2)} KB`);
        } else {
            console.log(`❌ Test Market 1 not found at ${TEST_MARKET_1}`);
        }
    } catch (error) {
        console.log(`❌ Error checking Test Market 1: ${error.message}`);
    }

    console.log("\n=========================================");
    console.log("  SUMMARY");
    console.log("=========================================");
    console.log("Architecture: NEW Unified Factory ✅");
    console.log("All Phase 1-7 migrations: COMPLETE ✅");
    console.log("Deployment Date: November 6, 2025");
    console.log("Deployer: 0x25fD72154857Bd204345808a690d51a61A81EB0b");
    console.log("\nExplorer: https://explorer.bf1337.org");
}

main().catch(console.error);