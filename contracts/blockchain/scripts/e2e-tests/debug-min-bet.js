const { ethers } = require("hardhat");

async function main() {
  console.log("\n🔍 Debugging Minimum Bet Failure...\n");

  const [signer] = await ethers.getSigners();
  console.log("Account:", signer.address);

  const market = await ethers.getContractAt("PredictionMarket", "0x31d2BC49A6FD4a066F5f8AC61Acd0E6c9105DD84");

  // Get current state
  const state = await market.currentState();
  const liquidity = await market.getLiquidity();
  const shares = await market.getShares();
  const odds = await market.getOdds();

  console.log("Market State:", Number(state), "(2 = ACTIVE)");
  console.log("Liquidity (pools): [", ethers.formatEther(liquidity[0]), ",", ethers.formatEther(liquidity[1]), "]");
  console.log("Shares: [", ethers.formatEther(shares[0]), ",", ethers.formatEther(shares[1]), "]");
  console.log("Odds: [", odds[0].toString(), ",", odds[1].toString(), "]");
  console.log("");

  // Try different bet amounts
  const testAmounts = ["0.01", "0.05", "0.1", "0.5", "1", "5"];

  for (const amount of testAmounts) {
    console.log(`\n--- Testing ${amount} BASED bet ---`);

    try {
      // First, simulate the bet (read-only)
      const estimate = await market.placeBet.estimateGas(1, 0, {
        value: ethers.parseEther(amount),
      });

      console.log(`✅ Estimate succeeded: ${estimate.toString()} gas`);

      // Now try the actual transaction
      const tx = await market.placeBet(1, 0, {
        value: ethers.parseEther(amount),
        gasLimit: 1100000,
        gasPrice: ethers.parseUnits("9", "gwei"),
      });

      const receipt = await tx.wait();
      console.log(`✅ Transaction succeeded!`);
      console.log(`   Gas used: ${receipt.gasUsed.toString()}`);
      console.log(`   Tx: ${receipt.hash}`);

      // Check updated state
      const newLiquidity = await market.getLiquidity();
      const newOdds = await market.getOdds();
      console.log(`   New Liquidity: [${ethers.formatEther(newLiquidity[0])}, ${ethers.formatEther(newLiquidity[1])}]`);
      console.log(`   New Odds: [${newOdds[0].toString()}, ${newOdds[1].toString()}]`);
    } catch (error) {
      console.log(`❌ Failed: ${error.message.substring(0, 100)}...`);

      // Try to get more error details
      if (error.receipt) {
        console.log(`   Gas used before revert: ${error.receipt.gasUsed.toString()}`);
      }
    }
  }

  console.log("\n✅ Debug complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
