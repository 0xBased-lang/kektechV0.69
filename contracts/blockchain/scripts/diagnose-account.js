const { ethers } = require("hardhat");

async function main() {
    console.log("\n🔍 DIAGNOSING ACCOUNT STATE ON BASEDAI\n");

    const [deployer] = await ethers.getSigners();

    console.log("=".repeat(70));
    console.log("ACCOUNT INFORMATION");
    console.log("=".repeat(70));

    // Basic info
    console.log("Address:", deployer.address);
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Balance:", ethers.formatEther(balance), "BASED");

    // Check nonce
    const nonce = await ethers.provider.getTransactionCount(deployer.address);
    console.log("Nonce:", nonce);
    console.log("Has sent transactions?", nonce > 0 ? "YES ✅" : "NO ❌");

    // Check account code (should be empty for EOA)
    const code = await ethers.provider.getCode(deployer.address);
    console.log("Account type:", code === "0x" ? "EOA (normal wallet) ✅" : "Contract");

    console.log("\n" + "=".repeat(70));
    console.log("NETWORK STATE");
    console.log("=".repeat(70));

    // Network info
    const network = await ethers.provider.getNetwork();
    console.log("Chain ID:", network.chainId.toString());

    // Fee data
    const feeData = await ethers.provider.getFeeData();
    console.log("Gas Price:", feeData.gasPrice?.toString(), "wei");
    console.log("Max Fee Per Gas:", feeData.maxFeePerGas?.toString());
    console.log("Max Priority Fee:", feeData.maxPriorityFeePerGas?.toString());

    // Block info
    const blockNumber = await ethers.provider.getBlockNumber();
    console.log("Latest Block:", blockNumber);

    const block = await ethers.provider.getBlock(blockNumber);
    console.log("Block Gas Limit:", block?.gasLimit.toString());
    console.log("Block Gas Used:", block?.gasUsed.toString());
    console.log("Base Fee:", block?.baseFeePerGas?.toString());

    console.log("\n" + "=".repeat(70));
    console.log("TESTING SIMPLE TRANSACTION");
    console.log("=".repeat(70));

    // Test if we can send a simple self-transfer
    console.log("\n💡 Testing if we can send a simple transaction...");
    console.log("This will send 0.001 BASED to yourself as a test\n");

    try {
        const testTx = {
            to: deployer.address,
            value: ethers.parseEther("0.001"),
            gasLimit: 21000
        };

        console.log("Estimating gas for test transaction...");
        const gasEstimate = await ethers.provider.estimateGas(testTx);
        console.log("✅ Gas estimate:", gasEstimate.toString());

        const gasCost = gasEstimate * (feeData.gasPrice || 0n);
        const totalCost = testTx.value + gasCost;
        console.log("Value to send:", ethers.formatEther(testTx.value), "BASED");
        console.log("Gas cost:", ethers.formatEther(gasCost), "BASED");
        console.log("Total cost:", ethers.formatEther(totalCost), "BASED");

        if (balance >= totalCost) {
            console.log("✅ SUFFICIENT FUNDS for test transaction");
            console.log("\n🚀 Sending test transaction...");

            const tx = await deployer.sendTransaction(testTx);
            console.log("Transaction hash:", tx.hash);
            console.log("Waiting for confirmation...");

            const receipt = await tx.wait();
            console.log("✅ TRANSACTION CONFIRMED!");
            console.log("Block:", receipt.blockNumber);
            console.log("Gas used:", receipt.gasUsed.toString());
            console.log("Status:", receipt.status === 1 ? "SUCCESS ✅" : "FAILED ❌");

            // Check new nonce
            const newNonce = await ethers.provider.getTransactionCount(deployer.address);
            console.log("New nonce:", newNonce);

            // Check new balance
            const newBalance = await ethers.provider.getBalance(deployer.address);
            console.log("New balance:", ethers.formatEther(newBalance), "BASED");

            console.log("\n✅ ACCOUNT IS WORKING - Simple transactions work!");
            console.log("This means the issue is specific to contract deployment...");

        } else {
            console.log("❌ INSUFFICIENT FUNDS even for test transaction");
            console.log("This suggests a fundamental balance/network issue");
        }

    } catch (error) {
        console.log("❌ Test transaction FAILED:");
        console.log("Error:", error.message);
        if (error.data) console.log("Error data:", error.data);
        if (error.error) console.log("Inner error:", error.error);

        console.log("\n🔍 This tells us the issue affects even simple transactions!");
    }

    console.log("\n" + "=".repeat(70));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
