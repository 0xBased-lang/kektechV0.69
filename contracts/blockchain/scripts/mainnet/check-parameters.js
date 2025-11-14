const { ethers } = require("hardhat");
const config = require("../../config/parameters");
const fs = require("fs");
const path = require("path");

/**
 * KEKTECH 3.0 - Check Current Parameters
 *
 * This script displays all current parameter values from the live contracts
 * Useful for verification and debugging
 */

async function main() {
  console.log("\n📊 KEKTECH Parameter Status Check");
  console.log("===================================\n");

  // Load deployed contracts
  const deploymentPath = path.join(__dirname, "../../../../deployments/basedai-mainnet/contracts.json");
  if (!fs.existsSync(deploymentPath)) {
    throw new Error("❌ Deployment file not found!");
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));

  const registry = await ethers.getContractAt(
    "VersionedRegistry",
    deployment.VersionedRegistry
  );

  const paramStorageAddr = await registry.getContract(ethers.id("ParameterStorage"));
  const paramStorage = await ethers.getContractAt("ParameterStorage", paramStorageAddr);

  const resolutionManagerAddr = await registry.getContract(ethers.id("ResolutionManager"));
  const resolutionManager = await ethers.getContractAt("ResolutionManager", resolutionManagerAddr);

  // ===== Fee Parameters =====
  console.log("💰 FEE DISTRIBUTION (in Basis Points)");
  console.log("─────────────────────────────────────");

  const feeParams = [
    "protocolFeeBps",
    "creatorFeeBps",
    "stakerIncentiveBps",
    "treasuryFeeBps",
    "platformFeePercent",
  ];

  let totalFees = 0;
  for (const param of feeParams) {
    const value = await paramStorage.getParameter(ethers.id(param));
    const percentage = (Number(value) / 100).toFixed(2);
    const expected = config.fees[param];
    const match = value.toString() === expected.toString() ? "✅" : "❌";

    console.log(`  ${match} ${param.padEnd(25)} ${value.toString().padStart(4)} (${percentage}%)  [Expected: ${expected}]`);

    if (param !== "platformFeePercent") {
      totalFees += Number(value);
    }
  }

  console.log(`\n  Total Fees:                ${totalFees} BPS (${(totalFees / 100).toFixed(2)}%)`);
  console.log(`  Winners Receive:           ${10000 - totalFees} BPS (${((10000 - totalFees) / 100).toFixed(2)}%)`);

  // ===== Market Parameters =====
  console.log("\n🎯 MARKET PARAMETERS");
  console.log("─────────────────────────────────────");

  const marketParams = [
    { key: "minimumBet", expected: config.market.minimumBet },
    { key: "maximumBet", expected: config.market.maximumBet },
  ];

  for (const param of marketParams) {
    const value = await paramStorage.getParameter(ethers.id(param.key));
    const match = value === param.expected ? "✅" : "❌";
    console.log(`  ${match} ${param.key.padEnd(25)} ${ethers.formatEther(value).padStart(8)} BASED  [Expected: ${ethers.formatEther(param.expected)}]`);
  }

  // ===== Resolution Parameters =====
  console.log("\n⏱️  RESOLUTION PARAMETERS");
  console.log("─────────────────────────────────────");

  const disputeWindow = await resolutionManager.disputeWindow();
  const minDisputeBond = await resolutionManager.minDisputeBond();

  const disputeWindowMinutes = Number(disputeWindow) / 60;
  const disputeWindowHours = disputeWindowMinutes / 60;

  const isTesting = disputeWindow === BigInt(config.resolution.disputeWindow);
  const isProduction = disputeWindow === BigInt(config.resolutionProduction.disputeWindow);

  let mode = "UNKNOWN";
  if (isTesting) mode = "TESTING (15 min)";
  if (isProduction) mode = "PRODUCTION (48 hours)";

  console.log(`  Dispute Window:            ${disputeWindow} seconds`);
  console.log(`                             ${disputeWindowMinutes.toFixed(0)} minutes`);
  console.log(`                             ${disputeWindowHours.toFixed(2)} hours`);
  console.log(`  Mode:                      ${mode}`);
  console.log(`\n  Min Dispute Bond:          ${ethers.formatEther(minDisputeBond)} BASED`);
  console.log(`  Agreement Threshold:       ${config.resolution.agreementThreshold}% (auto-finalize)`);
  console.log(`  Disagreement Threshold:    ${config.resolution.disagreementThreshold}% (flag dispute)`);

  // ===== Boolean Flags =====
  console.log("\n🚩 SYSTEM FLAGS");
  console.log("─────────────────────────────────────");

  const flagKeys = [
    "marketCreationActive",
    "experimentalMarketsActive",
    "emergencyPause",
  ];

  for (const key of flagKeys) {
    try {
      const value = await paramStorage.getBoolParameter(ethers.id(key));
      const status = value ? "✅ ENABLED" : "❌ DISABLED";
      console.log(`  ${key.padEnd(30)} ${status}`);
    } catch (e) {
      console.log(`  ${key.padEnd(30)} ⚠️  NOT SET`);
    }
  }

  // ===== Summary =====
  console.log("\n" + "=".repeat(50));
  console.log("📋 SUMMARY");
  console.log("=".repeat(50));
  console.log(`\n  Current Mode:              ${mode}`);
  console.log(`  Market Creation:           ${await paramStorage.getBoolParameter(ethers.id("marketCreationActive")) ? "ENABLED" : "DISABLED"}`);
  console.log(`  Total Platform Fees:       ${(totalFees / 100).toFixed(2)}%`);
  console.log(`  Creator Earnings:          1.5% of volume`);
  console.log(`  Winners Receive:           95% of total pool`);

  if (isTesting) {
    console.log(`\n  ⚠️  TESTING MODE ACTIVE`);
    console.log(`     • Dispute windows: 15 minutes (rapid iteration)`);
    console.log(`     • Suitable for: Development, testing, validation`);
    console.log(`     • Switch to production: node scripts/mainnet/switch-to-production.js`);
  } else if (isProduction) {
    console.log(`\n  ✅ PRODUCTION MODE ACTIVE`);
    console.log(`     • Dispute windows: 48 hours (normal operation)`);
    console.log(`     • Ready for: Live markets, real users`);
  } else {
    console.log(`\n  ⚠️  CUSTOM MODE DETECTED`);
    console.log(`     • Dispute window: ${disputeWindowHours.toFixed(2)} hours`);
    console.log(`     • Not a standard configuration`);
  }

  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
