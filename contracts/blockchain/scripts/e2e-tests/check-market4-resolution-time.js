const { ethers } = require("hardhat");

async function main() {
  console.log("\n⏰ CHECKING MARKET 4 RESOLUTION TIME...\n");

  const market = await ethers.getContractAt(
    "PredictionMarket",
    "0x73dd2C0c42e34C3A8E73f28e97c58c1d0d70eEa7" // Market 4
  );

  const resolutionTime = await market.resolutionTime();
  const currentTime = Math.floor(Date.now() / 1000);
  const state = await market.currentState();

  console.log("Current Time:", new Date(currentTime * 1000).toLocaleString());
  console.log("Resolution Time:", new Date(Number(resolutionTime) * 1000).toLocaleString());
  console.log("Current State:", Number(state), state === 2 ? "(ACTIVE)" : "");

  const timeUntilResolution = Number(resolutionTime) - currentTime;

  if (timeUntilResolution > 0) {
    const minutesRemaining = Math.floor(timeUntilResolution / 60);
    const secondsRemaining = timeUntilResolution % 60;
    console.log(`\n⏳ Time until resolution: ${minutesRemaining}m ${secondsRemaining}s`);
    console.log("❌ Market cannot be resolved yet!");
    console.log("\nOptions:");
    console.log("1. Wait for resolution time to pass");
    console.log("2. Create a new market with shorter resolution time");
  } else {
    const minutesPast = Math.floor(-timeUntilResolution / 60);
    console.log(`\n✅ Resolution time passed ${minutesPast} minutes ago!`);
    console.log("Market is ready for resolution! 🚀");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
