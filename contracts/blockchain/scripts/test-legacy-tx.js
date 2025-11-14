const { ethers } = require("hardhat");

async function main() {
    console.log("\n🔍 TESTING LEGACY VS EIP-1559 TRANSACTIONS\n");

    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Balance:", ethers.formatEther(balance), "BASED\n");

    // Get network info
    const network = await ethers.provider.getNetwork();
    console.log("Network:", network.name);
    console.log("Chain ID:", network.chainId);

    // Check if network supports EIP-1559
    const feeData = await ethers.provider.getFeeData();
    console.log("\nCurrent Fee Data:");
    console.log("- Gas Price:", feeData.gasPrice?.toString(), "wei");
    console.log("- Max Fee:", feeData.maxFeePerGas?.toString(), "wei");
    console.log("- Max Priority Fee:", feeData.maxPriorityFeePerGas?.toString(), "wei");

    console.log("\n" + "=".repeat(70));
    console.log("ATTEMPT 1: Legacy Transaction (Type 0)");
    console.log("=".repeat(70));

    try {
        const MasterRegistry = await ethers.getContractFactory("MasterRegistry");

        // Force legacy transaction with explicit gas price
        const txOptions = {
            gasLimit: 6000000,
            gasPrice: ethers.parseUnits("1", "gwei"), // 1 Gwei explicit
            type: 0 // Force legacy transaction
        };

        console.log("\nTransaction Options:");
        console.log("- Gas Limit:", txOptions.gasLimit);
        console.log("- Gas Price:", txOptions.gasPrice.toString(), "wei");
        console.log("- Type:", txOptions.type, "(legacy)");

        const estimatedGas = await ethers.provider.estimateGas({
            data: MasterRegistry.bytecode,
            from: deployer.address,
            ...txOptions
        });

        console.log("- Estimated Gas:", estimatedGas.toString());

        const cost = estimatedGas * txOptions.gasPrice;
        console.log("- Estimated Cost:", ethers.formatEther(cost), "BASED");
        console.log("- Sufficient Funds:", cost < balance ? "✅ YES" : "❌ NO");

        console.log("\n🚀 Attempting deployment...");
        const registry = await MasterRegistry.deploy(txOptions);

        console.log("✅ Transaction sent!");
        console.log("Tx Hash:", registry.deploymentTransaction().hash);

        console.log("⏳ Waiting for confirmation...");
        await registry.waitForDeployment();

        const address = await registry.getAddress();
        console.log("✅ SUCCESS! Deployed at:", address);

        return true;

    } catch (error) {
        console.log("❌ FAILED!");
        console.log("Error:", error.message);
        if (error.transaction) {
            console.log("\nTransaction Details:");
            console.log(JSON.stringify(error.transaction, null, 2));
        }
    }

    console.log("\n" + "=".repeat(70));
    console.log("ATTEMPT 2: Higher Gas Price Legacy Transaction");
    console.log("=".repeat(70));

    try {
        const MasterRegistry = await ethers.getContractFactory("MasterRegistry");

        // Try with even higher gas price
        const txOptions = {
            gasLimit: 6000000,
            gasPrice: ethers.parseUnits("10", "gwei"), // 10 Gwei
            type: 0
        };

        console.log("\nTransaction Options:");
        console.log("- Gas Limit:", txOptions.gasLimit);
        console.log("- Gas Price:", txOptions.gasPrice.toString(), "wei");

        const estimatedGas = await ethers.provider.estimateGas({
            data: MasterRegistry.bytecode,
            from: deployer.address,
            gasLimit: txOptions.gasLimit
        });

        const cost = estimatedGas * txOptions.gasPrice;
        console.log("- Estimated Cost:", ethers.formatEther(cost), "BASED");
        console.log("- Sufficient Funds:", cost < balance ? "✅ YES" : "❌ NO");

        console.log("\n🚀 Attempting deployment...");
        const registry = await MasterRegistry.deploy(txOptions);

        console.log("✅ Transaction sent!");
        console.log("Tx Hash:", registry.deploymentTransaction().hash);

        console.log("⏳ Waiting for confirmation...");
        await registry.waitForDeployment();

        const address = await registry.getAddress();
        console.log("✅ SUCCESS! Deployed at:", address);

        return true;

    } catch (error) {
        console.log("❌ FAILED!");
        console.log("Error:", error.message);
    }

    console.log("\n" + "=".repeat(70));
    console.log("ATTEMPT 3: Minimal Gas Price");
    console.log("=".repeat(70));

    try {
        const MasterRegistry = await ethers.getContractFactory("MasterRegistry");

        // Try with current network gas price
        const currentGasPrice = feeData.gasPrice || ethers.parseUnits("1", "gwei");

        const txOptions = {
            gasLimit: 6000000,
            gasPrice: currentGasPrice,
            type: 0
        };

        console.log("\nTransaction Options:");
        console.log("- Gas Limit:", txOptions.gasLimit);
        console.log("- Gas Price:", txOptions.gasPrice.toString(), "wei");

        const estimatedGas = await ethers.provider.estimateGas({
            data: MasterRegistry.bytecode,
            from: deployer.address,
            gasLimit: txOptions.gasLimit
        });

        const cost = estimatedGas * txOptions.gasPrice;
        console.log("- Estimated Cost:", ethers.formatEther(cost), "BASED");
        console.log("- Sufficient Funds:", cost < balance ? "✅ YES" : "❌ NO");

        console.log("\n🚀 Attempting deployment...");
        const registry = await MasterRegistry.deploy(txOptions);

        console.log("✅ Transaction sent!");
        console.log("Tx Hash:", registry.deploymentTransaction().hash);

        console.log("⏳ Waiting for confirmation...");
        await registry.waitForDeployment();

        const address = await registry.getAddress();
        console.log("✅ SUCCESS! Deployed at:", address);

    } catch (error) {
        console.log("❌ FAILED!");
        console.log("Error:", error.message);

        console.log("\n" + "=".repeat(70));
        console.log("FULL ERROR DETAILS");
        console.log("=".repeat(70));
        console.log(error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
