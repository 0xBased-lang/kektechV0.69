const { ethers } = require("hardhat");

async function main() {
  console.log("\n🧪 Testing Single Bet on Market 1...\n");

  const [signer] = await ethers.getSigners();
  console.log("Account:", signer.address);

  const balance = await ethers.provider.getBalance(signer.address);
  console.log("Balance:", ethers.formatEther(balance), "BASED\n");

  const market = await ethers.getContractAt("PredictionMarket", "0x31d2BC49A6FD4a066F5f8AC61Acd0E6c9105DD84");

  // Check state
  const state = await market.currentState();
  console.log("Market State:", Number(state), ["PROPOSED", "APPROVED", "ACTIVE"][Number(state)]);

  if (Number(state) !== 2) {
    console.log("❌ Market not ACTIVE, cannot bet");
    return;
  }

  // Get current odds
  const odds = await market.getOdds();
  console.log("Current Odds:", odds.map(o => o.toString()));
  console.log("");

  // Try bet with different gas limits
  const betAmount = ethers.parseEther("10"); // 10 BASED
  const outcome = 1; // Outcome 1
  const minOdds = 0; // No slippage protection

  console.log("Placing bet:");
  console.log("- Amount: 10 BASED");
  console.log("- Outcome: 1");
  console.log("- Min Odds: 0 (no slippage protection)");
  console.log("");

  try {
    console.log("Attempting with 1M gas limit...");
    const tx = await market.placeBet(outcome, minOdds, {
      value: betAmount,
      gasLimit: 1000000,
      gasPrice: ethers.parseUnits("9", "gwei")
    });

    console.log("✅ Transaction sent:", tx.hash);
    console.log("Waiting for confirmation...");

    const receipt = await tx.wait();
    console.log("✅ BET PLACED SUCCESSFULLY!");
    console.log("Gas used:", receipt.gasUsed.toString());
    console.log("Cost:", ethers.formatEther(BigInt(receipt.gasUsed) * BigInt(9000000000)), "BASED");
    console.log("");

    // Get new odds
    const newOdds = await market.getOdds();
    console.log("New Odds:", newOdds.map(o => o.toString()));

  } catch (error) {
    console.log("❌ Bet failed:", error.message);

    if (error.receipt) {
      console.log("Gas used before revert:", error.receipt.gasUsed.toString());
    }
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
