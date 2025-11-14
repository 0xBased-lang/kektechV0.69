const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 CHECKING BASEDAI NETWORK GAS PRICES...\n");

    try {
        // Get network info
        const network = await ethers.provider.getNetwork();
        console.log("Network:", network.name);
        console.log("Chain ID:", network.chainId, "\n");

        // Get current gas price
        const feeData = await ethers.provider.getFeeData();
        const gasPriceGwei = ethers.formatUnits(feeData.gasPrice, "gwei");
        console.log("📊 Current Gas Prices:");
        console.log("Gas Price:", gasPriceGwei, "gwei");
        console.log("Gas Price in wei:", feeData.gasPrice.toString(), "\n");

        // Get latest block
        const blockNumber = await ethers.provider.getBlockNumber();
        const block = await ethers.provider.getBlock(blockNumber);
        console.log("📦 Latest Block:");
        console.log("Block Number:", blockNumber);
        console.log("Block Gas Limit:", block.gasLimit.toString());
        console.log("Block Gas Used:", block.gasUsed.toString(), "\n");

        // Estimate deployment costs
        console.log("💰 ESTIMATED DEPLOYMENT COSTS:\n");

        const gasPrice = feeData.gasPrice;

        // Approximate gas costs per contract (conservative estimates)
        const estimates = [
            { name: "MasterRegistry", gas: 500000n },
            { name: "ParameterStorage", gas: 600000n },
            { name: "AccessControlManager", gas: 450000n },
            { name: "ProposalManagerV2", gas: 1000000n },
            { name: "FlexibleMarketFactory", gas: 2000000n },
            { name: "ResolutionManager", gas: 1100000n },
            { name: "RewardDistributor", gas: 800000n }
        ];

        let totalGas = 0n;

        console.log("Contract Deployments:");
        estimates.forEach(contract => {
            const cost = gasPrice * contract.gas;
            totalGas += contract.gas;
            const costEth = ethers.formatEther(cost);
            console.log("  " + contract.name + ": ~" + contract.gas.toString() + " gas = " + costEth + " BASED");
        });

        console.log("");

        // Configuration transactions (smaller gas costs)
        const configGas = 100000n * 15n; // 15 configuration transactions
        totalGas += configGas;

        const configCost = gasPrice * configGas;
        const configCostEth = ethers.formatEther(configCost);
        console.log("Configuration (15 txs): ~" + configGas.toString() + " gas = " + configCostEth + " BASED");

        console.log("\n" + "=".repeat(70));
        const totalCost = gasPrice * totalGas;
        const totalCostEth = ethers.formatEther(totalCost);
        console.log("TOTAL ESTIMATED GAS: " + totalGas.toString());
        console.log("TOTAL ESTIMATED COST: " + totalCostEth + " BASED");
        console.log("=".repeat(70) + "\n");

        // Get deployer balance
        const [deployer] = await ethers.getSigners();
        const balance = await ethers.provider.getBalance(deployer.address);
        const balanceEth = ethers.formatEther(balance);
        const remaining = ethers.formatEther(balance - totalCost);

        console.log("Your Balance: " + balanceEth + " BASED");
        console.log("Estimated Cost: " + totalCostEth + " BASED");
        console.log("Remaining After: " + remaining + " BASED");

        if (balance > totalCost * 2n) {
            console.log("\n✅ SUFFICIENT BALANCE - Plenty of buffer!");
        } else if (balance > totalCost) {
            console.log("\n⚠️  TIGHT BALANCE - Should be enough but close");
        } else {
            console.log("\n❌ INSUFFICIENT BALANCE - Need more BASED!");
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
