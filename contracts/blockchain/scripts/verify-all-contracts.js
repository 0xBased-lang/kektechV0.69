const hre = require("hardhat");

async function verifyContract(contractName, address, constructorArguments = []) {
    console.log(`\n🔍 Verifying ${contractName} at ${address}...`);

    try {
        await hre.run("verify:verify", {
            address: address,
            constructorArguments: constructorArguments,
        });
        console.log(`✅ ${contractName} verified successfully!`);
        return true;
    } catch (error) {
        if (error.message.includes("Already Verified")) {
            console.log(`✅ ${contractName} already verified`);
            return true;
        } else if (error.message.includes("does not have bytecode")) {
            console.log(`❌ ${contractName} - No bytecode at address (might be wrong address)`);
            return false;
        } else {
            console.log(`❌ ${contractName} verification failed:`, error.message);
            return false;
        }
    }
}

async function main() {
    console.log("🚀 Starting Sepolia Contract Verification");
    console.log("==========================================\n");

    // Get deployed addresses from environment
    const contracts = [
        {
            name: "MasterRegistry",
            address: process.env.MASTER_REGISTRY_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3",
            args: []
        },
        {
            name: "AccessControlManager",
            address: process.env.ACCESS_CONTROL_MANAGER_ADDRESS || "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
            args: []
        },
        {
            name: "ParameterStorage",
            address: process.env.PARAMETER_STORAGE_ADDRESS || "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
            args: []
        },
        {
            name: "CategoryRegistry",
            address: process.env.CATEGORY_REGISTRY_ADDRESS || "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
            args: []
        },
        {
            name: "ProposalManagerV2",
            address: process.env.PROPOSAL_MANAGER_V2_ADDRESS || "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
            args: []
        },
        {
            name: "FlexibleMarketFactory",
            address: process.env.FLEXIBLE_MARKET_FACTORY_ADDRESS || "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
            args: []
        },
        {
            name: "ResolutionManager",
            address: process.env.RESOLUTION_MANAGER_ADDRESS || "0x0165878A594ca255338adfa4d48449f69242Eb8F",
            args: []
        },
        {
            name: "RewardDistributor",
            address: process.env.REWARD_DISTRIBUTOR_ADDRESS || "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853",
            args: []
        },
        {
            name: "PredictionMarket",
            address: process.env.PREDICTION_MARKET_ADDRESS || "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
            args: []
        }
    ];

    let successCount = 0;
    let failCount = 0;

    console.log(`📋 Verifying ${contracts.length} contracts on Sepolia Etherscan\n`);

    // Verify each contract with a small delay between requests
    for (const contract of contracts) {
        const success = await verifyContract(contract.name, contract.address, contract.args);
        if (success) {
            successCount++;
        } else {
            failCount++;
        }

        // Wait 5 seconds between verifications to avoid rate limiting
        if (contracts.indexOf(contract) < contracts.length - 1) {
            console.log("⏳ Waiting 5 seconds before next verification...");
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }

    console.log("\n==========================================");
    console.log("📊 VERIFICATION SUMMARY");
    console.log("==========================================");
    console.log(`✅ Successfully verified: ${successCount}/${contracts.length}`);
    console.log(`❌ Failed: ${failCount}/${contracts.length}`);

    if (successCount === contracts.length) {
        console.log("\n🎉 All contracts verified successfully!");
        console.log("\n🔗 View on Sepolia Etherscan:");
        contracts.forEach(contract => {
            console.log(`${contract.name}: https://sepolia.etherscan.io/address/${contract.address}#code`);
        });
    } else {
        console.log("\n⚠️ Some contracts failed verification. Check errors above.");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
