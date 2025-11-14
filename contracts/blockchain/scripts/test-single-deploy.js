const { ethers } = require("hardhat");

async function main() {
    console.log("\n🔍 TESTING SINGLE CONTRACT DEPLOYMENT\n");

    try {
        // Get network info
        const network = await ethers.provider.getNetwork();
        console.log("Network:", network.name, "Chain ID:", network.chainId);

        // Get deployer
        const [deployer] = await ethers.getSigners();
        console.log("Deployer:", deployer.address);

        // Get balance
        const balance = await ethers.provider.getBalance(deployer.address);
        console.log("Balance:", ethers.formatEther(balance), "BASED\n");

        // Get gas price
        const feeData = await ethers.provider.getFeeData();
        console.log("Current Gas Price:", feeData.gasPrice.toString(), "wei");
        console.log("Gas Price:", ethers.formatUnits(feeData.gasPrice, "gwei"), "gwei\n");

        // Try to estimate gas for MasterRegistry deployment
        console.log("Attempting to estimate deployment gas for MasterRegistry...\n");

        const Registry = await ethers.getContractFactory("MasterRegistry");

        // Try to estimate deployment gas
        const deployTransaction = await Registry.getDeployTransaction();
        console.log("Deploy transaction data length:", deployTransaction.data.length, "bytes");

        try {
            const gasEstimate = await ethers.provider.estimateGas({
                from: deployer.address,
                data: deployTransaction.data
            });
            console.log("Estimated Gas:", gasEstimate.toString());
            console.log("Estimated Cost:", ethers.formatEther(gasEstimate * feeData.gasPrice), "BASED");

            const totalCost = gasEstimate * feeData.gasPrice;
            console.log("\nCan afford deployment?", balance > totalCost ? "YES ✅" : "NO ❌");
            console.log("Balance:", ethers.formatEther(balance), "BASED");
            console.log("Required:", ethers.formatEther(totalCost), "BASED");

        } catch (estimateError) {
            console.log("❌ Gas estimation failed:");
            console.log("Error:", estimateError.message);
        }

    } catch (error) {
        console.error("\n❌ Error:", error.message);
        if (error.data) {
            console.error("Error data:", error.data);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
