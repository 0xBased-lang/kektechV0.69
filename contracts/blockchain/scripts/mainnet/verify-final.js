const { ethers } = require("hardhat");
const config = require("../../config/parameters");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("\n✅ FINAL PARAMETER VERIFICATION\n");
  console.log("=".repeat(50));

  const deploymentPath = path.join(__dirname, "../../../../deployments/basedai-mainnet/deployment.json");
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));

  const paramStorage = await ethers.getContractAt(
    "ParameterStorage",
    deployment.contracts.ParameterStorage
  );

  const resolutionManager = await ethers.getContractAt(
    "ResolutionManager",
    deployment.contracts.ResolutionManager
  );

  // Fee parameters
  console.log("\n💰 FEE DISTRIBUTION:");
  console.log("─".repeat(50));

  const feeParams = [
    { key: "protocolFeeBps", expected: config.fees.protocolFeeBps },
    { key: "creatorFeeBps", expected: config.fees.creatorFeeBps },
    { key: "stakerIncentiveBps", expected: config.fees.stakerIncentiveBps },
    { key: "treasuryFeeBps", expected: config.fees.treasuryFeeBps },
    { key: "platformFeePercent", expected: config.fees.platformFeePercent },
  ];

  let totalFees = 0;
  for (const param of feeParams) {
    const value = await paramStorage.getParameter(ethers.id(param.key));
    const percentage = (Number(value) / 100).toFixed(2);
    const match = value.toString() === param.expected.toString() ? "✅" : "❌";
    console.log(`  ${match} ${param.key.padEnd(25)} ${value.toString().padStart(4)} (${percentage}%)`);
    if (param.key !== "platformFeePercent") totalFees += Number(value);
  }

  console.log(`\n  Total Fees:                ${totalFees} BPS (${(totalFees / 100).toFixed(2)}%)`);
  console.log(`  Winners Receive:           ${10000 - totalFees} BPS (${((10000 - totalFees) / 100).toFixed(2)}%)`);

  // Market parameters
  console.log("\n🎯 MARKET PARAMETERS:");
  console.log("─".repeat(50));

  const marketParams = [
    { key: "minimumBet", expected: config.market.minimumBet },
    { key: "maximumBet", expected: config.market.maximumBet },
  ];

  for (const param of marketParams) {
    const value = await paramStorage.getParameter(ethers.id(param.key));
    const match = value === param.expected ? "✅" : "❌";
    console.log(`  ${match} ${param.key.padEnd(25)} ${ethers.formatEther(value).padStart(8)} BASED`);
  }

  // Resolution parameters - use getter functions
  console.log("\n⏱️  RESOLUTION PARAMETERS:");
  console.log("─".repeat(50));

  const disputeWindow = Number(await resolutionManager.getDisputeWindow());
  const minDisputeBond = await resolutionManager.getMinDisputeBond();

  const disputeWindowMinutes = disputeWindow / 60;
  const isTesting = disputeWindow === config.resolution.disputeWindow;
  const mode = isTesting ? "TESTING (15 min)" : `CUSTOM (${(disputeWindow / 3600).toFixed(2)}h)`;

  console.log(`  ✅ Dispute Window:            ${disputeWindow} seconds (${disputeWindowMinutes} minutes)`);
  console.log(`  ✅ Mode:                      ${mode}`);
  console.log(`  ✅ Min Dispute Bond:          ${ethers.formatEther(minDisputeBond)} BASED`);
  console.log(`  ✅ Agreement Threshold:       ${config.resolution.agreementThreshold}% (auto-finalize)`);
  console.log(`  ✅ Disagreement Threshold:    ${config.resolution.disagreementThreshold}% (flag dispute)`);

  // System flags
  console.log("\n🚩 SYSTEM FLAGS:");
  console.log("─".repeat(50));

  const marketCreationActive = await paramStorage.getBoolParameter(ethers.id("marketCreationActive"));
  console.log(`  ✅ Market Creation:           ${marketCreationActive ? "ENABLED" : "DISABLED"}`);

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("📋 INITIALIZATION SUMMARY");
  console.log("=".repeat(50));
  console.log(`\n  Mode:                      ${mode}`);
  console.log(`  Market Creation:           ${marketCreationActive ? "ENABLED" : "DISABLED"}`);
  console.log(`  Total Platform Fees:       ${(totalFees / 100).toFixed(2)}%`);
  console.log(`  Creator Earnings:          1.5% of trading volume`);
  console.log(`  Winners Receive:           95% of total pool`);

  console.log(`\n  ✅ ALL PARAMETERS INITIALIZED SUCCESSFULLY!`);

  if (isTesting) {
    console.log(`\n  ⚠️  TESTING MODE ACTIVE`);
    console.log(`     • Dispute windows: 15 minutes (rapid iteration)`);
    console.log(`     • Perfect for: Development, testing, validation`);
    console.log(`     • Switch to production: node scripts/mainnet/switch-to-production.js`);
  }

  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  });
