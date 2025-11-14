const { ethers } = require("hardhat");

async function main() {
    console.log("\n🔍 MANUAL DEPLOYMENT TEST - DETAILED ERROR ANALYSIS\n");

    try {
        // Get deployer
        const [deployer] = await ethers.getSigners();
        console.log("Deployer:", deployer.address);

        // Get balance
        const balance = await ethers.provider.getBalance(deployer.address);
        console.log("Balance:", ethers.formatEther(balance), "BASED");

        // Get network info
        const network = await ethers.provider.getNetwork();
        console.log("Network:", network.name, "Chain ID:", network.chainId);

        // Get fee data
        const feeData = await ethers.provider.getFeeData();
        console.log("\nFee Data:");
        console.log("  Gas Price:", feeData.gasPrice?.toString(), "wei");
        console.log("  Max Fee:", feeData.maxFeePerGas?.toString());
        console.log("  Max Priority Fee:", feeData.maxPriorityFeePerGas?.toString());

        // Try to get the contract factory
        console.log("\n📝 Getting MasterRegistry contract factory...");
        const Registry = await ethers.getContractFactory("MasterRegistry");
        console.log("✅ Contract factory loaded");

        // Get deployment transaction
        console.log("\n📝 Getting deployment transaction...");
        const deployTx = await Registry.getDeployTransaction();
        console.log("✅ Deployment transaction created");
        console.log("  Data length:", deployTx.data.length, "bytes");

        // Try different gas configurations
        const gasConfigs = [
            { name: "Auto (no params)", params: {} },
            { name: "Manual 6M gas only", params: { gasLimit: 6000000 } },
            { name: "Manual gas + price", params: { gasLimit: 6000000, gasPrice: feeData.gasPrice } },
            { name: "Manual gas + type 2", params: { gasLimit: 6000000, maxFeePerGas: feeData.maxFeePerGas, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas } },
        ];

        for (const config of gasConfigs) {
            console.log(`\n🧪 Testing: ${config.name}`);
            console.log("   Parameters:", JSON.stringify(config.params, (key, value) =>
                typeof value === 'bigint' ? value.toString() : value
            , 2));

            try {
                // Try to estimate gas with these params
                const estimateTx = {
                    from: deployer.address,
                    data: deployTx.data,
                    ...config.params
                };

                console.log("   Estimating gas...");
                const gasEstimate = await ethers.provider.estimateGas(estimateTx);
                console.log("   ✅ Gas estimate:", gasEstimate.toString());

                // Calculate cost
                const gasPrice = config.params.gasPrice || feeData.gasPrice || 0n;
                const gasLimit = config.params.gasLimit || gasEstimate;
                const cost = BigInt(gasLimit) * BigInt(gasPrice);
                console.log("   💰 Estimated cost:", ethers.formatEther(cost), "BASED");

                // Check if we have enough
                if (balance >= cost) {
                    console.log("   ✅ SUFFICIENT FUNDS");
                    console.log("   📢 THIS CONFIGURATION SHOULD WORK!");
                } else {
                    console.log("   ❌ INSUFFICIENT FUNDS");
                    console.log("   Need:", ethers.formatEther(cost), "BASED");
                    console.log("   Have:", ethers.formatEther(balance), "BASED");
                }

            } catch (error) {
                console.log("   ❌ FAILED:", error.message);
                if (error.data) {
                    console.log("   Error data:", error.data);
                }
                if (error.error) {
                    console.log("   Inner error:", error.error);
                }
            }
        }

        console.log("\n" + "=".repeat(70));
        console.log("📊 ANALYSIS COMPLETE");
        console.log("=".repeat(70));

    } catch (error) {
        console.error("\n❌ FATAL ERROR:", error);
        if (error.stack) {
            console.error("\nStack trace:", error.stack);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
