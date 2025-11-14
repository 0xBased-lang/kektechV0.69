const { ethers } = require("hardhat");

async function main() {
  console.log("\n🔍 Checking Market 1 Details...\n");

  const market = await ethers.getContractAt("PredictionMarket", "0x31d2BC49A6FD4a066F5f8AC61Acd0E6c9105DD84");

  // Get all relevant state
  const currentState = await market.currentState();
  const isResolved = await market.isResolved();
  const resolutionTime = await market.resolutionTime();
  const result = await market.result();

  const now = Math.floor(Date.now() / 1000);
  const resTime = Number(resolutionTime);

  console.log("Current State:", Number(currentState), ["PROPOSED", "APPROVED", "ACTIVE", "RESOLVING", "DISPUTED", "FINALIZED"][Number(currentState)]);
  console.log("Is Resolved:", isResolved);
  console.log("Result:", Number(result), ["UNRESOLVED", "OUTCOME1", "OUTCOME2"][Number(result)]);
  console.log("");
  console.log("Resolution Time:", new Date(resTime * 1000).toLocaleString());
  console.log("Current Time:", new Date(now * 1000).toLocaleString());
  console.log("Time Until Resolution:", (resTime - now), "seconds");
  console.log("");

  if (now >= resTime) {
    console.log("⚠️  BETTING CLOSED: Resolution time has passed!");
    console.log("💡 Market can now be resolved, but cannot accept new bets");
  } else {
    console.log("✅ BETTING OPEN: Resolution time is", Math.floor((resTime - now) / 3600), "hours away");
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
