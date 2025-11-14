const { ethers } = require("hardhat");
const config = require("../../config/parameters");
const fs = require("fs");
const path = require("path");

/**
 * KEKTECH 3.0 - Parameter Initialization Script
 *
 * This script initializes ALL system parameters on mainnet
 * Run ONCE after deployment to set up the system
 *
 * Steps:
 * 1. Load deployed contract addresses
 * 2. Initialize ParameterStorage with all fee parameters
 * 3. Set resolution parameters in ResolutionManager
 * 4. Enable market creation
 * 5. Set testing mode (15-min dispute windows)
 * 6. Verify all parameters set correctly
 */

async function main() {
  console.log("\n🎛️  KEKTECH Parameter Initialization");
  console.log("=====================================\n");

  // Get signer
  const [signer] = await ethers.getSigners();
  console.log(`Admin Address: ${signer.address}`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(signer.address))} BASED\n`);

  // Load deployed contracts from deployment.json (has actual addresses)
  const deploymentPath = path.join(__dirname, "../../../../deployments/basedai-mainnet/deployment.json");
  if (!fs.existsSync(deploymentPath)) {
    throw new Error("❌ Deployment file not found! Deploy contracts first.");
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  console.log("📝 Loaded deployment from:", deploymentPath);

  // Get contract instances directly from deployment addresses
  const paramStorage = await ethers.getContractAt(
    "ParameterStorage",
    deployment.contracts.ParameterStorage
  );

  const resolutionManager = await ethers.getContractAt(
    "ResolutionManager",
    deployment.contracts.ResolutionManager
  );

  console.log("\n📋 Contract Addresses:");
  console.log(`  VersionedRegistry:  ${deployment.contracts.VersionedRegistry}`);
  console.log(`  ParameterStorage:   ${deployment.contracts.ParameterStorage}`);
  console.log(`  ResolutionManager:  ${deployment.contracts.ResolutionManager}\n`);

  // ===== STEP 0: Verify Admin Permissions =====
  console.log("🔐 Step 0: Verifying Admin Permissions...");

  const accessControl = await ethers.getContractAt(
    "AccessControlManager",
    deployment.contracts.AccessControlManager
  );

  const ADMIN_ROLE = ethers.id("ADMIN_ROLE");
  const hasAdminRole = await accessControl.hasRole(ADMIN_ROLE, signer.address);

  if (!hasAdminRole) {
    console.log("  ⚠️  Admin role not found for:", signer.address);
    console.log("  🔧 Granting ADMIN_ROLE...");
    const tx = await accessControl.grantRole(ADMIN_ROLE, signer.address);
    await tx.wait();
    console.log("  ✅ ADMIN_ROLE granted");
  } else {
    console.log("  ✅ Admin role verified for:", signer.address);
  }

  // ===== STEP 1: Initialize Fee Parameters =====
  console.log("💰 Step 1: Initializing Fee Parameters...");

  const feeParams = [
    { key: "protocolFeeBps", value: config.fees.protocolFeeBps },
    { key: "creatorFeeBps", value: config.fees.creatorFeeBps },
    { key: "stakerIncentiveBps", value: config.fees.stakerIncentiveBps },
    { key: "treasuryFeeBps", value: config.fees.treasuryFeeBps },
    { key: "platformFeePercent", value: config.fees.platformFeePercent },
  ];

  for (const param of feeParams) {
    const key = ethers.id(param.key);

    // Try to get current value, but if parameter doesn't exist, just set it
    let currentValue;
    try {
      currentValue = await paramStorage.getParameter(key);
    } catch (e) {
      currentValue = 0n; // Parameter doesn't exist yet
    }

    if (currentValue.toString() === "0") {
      console.log(`  Setting ${param.key} = ${param.value}`);

      // Use higher gas price to override stuck transactions
      const tx = await paramStorage.setParameter(key, param.value, {
        gasLimit: 500000,
        maxPriorityFeePerGas: ethers.parseUnits("2", "gwei"),
        maxFeePerGas: ethers.parseUnits("3", "gwei")
      });

      console.log(`  📝 Transaction sent: ${tx.hash}`);
      await tx.wait();
      console.log(`  ✅ Set ${param.key}`);
    } else {
      console.log(`  ⚠️  ${param.key} already set to ${currentValue} (skipping)`);
    }
  }

  // ===== STEP 2: Initialize Market Parameters =====
  console.log("\n🎯 Step 2: Initializing Market Parameters...");

  const marketParams = [
    { key: "minimumBet", value: config.market.minimumBet },
    { key: "maximumBet", value: config.market.maximumBet },
  ];

  for (const param of marketParams) {
    const key = ethers.id(param.key);

    let currentValue;
    try {
      currentValue = await paramStorage.getParameter(key);
    } catch (e) {
      currentValue = 0n;
    }

    if (currentValue.toString() === "0") {
      console.log(`  Setting ${param.key} = ${ethers.formatEther(param.value)} BASED`);

      const tx = await paramStorage.setParameter(key, param.value, {
        gasLimit: 500000,
        maxPriorityFeePerGas: ethers.parseUnits("2", "gwei"),
        maxFeePerGas: ethers.parseUnits("3", "gwei")
      });

      console.log(`  📝 Transaction sent: ${tx.hash}`);
      await tx.wait();
      console.log(`  ✅ Set ${param.key}`);
    } else {
      console.log(`  ⚠️  ${param.key} already set to ${ethers.formatEther(currentValue)} BASED (skipping)`);
    }
  }

  // ===== STEP 3: Set Resolution Parameters (TESTING MODE) =====
  console.log("\n⏱️  Step 3: Setting Resolution Parameters (TESTING MODE)...");

  // Check current dispute window
  let currentDisputeWindow;
  try {
    currentDisputeWindow = await resolutionManager.disputeWindow();
  } catch (e) {
    currentDisputeWindow = 0n;
  }

  if (currentDisputeWindow.toString() === "0") {
    console.log(`  Setting disputeWindow = ${config.resolution.disputeWindow / 60} minutes (TESTING)`);

    const tx = await resolutionManager.setDisputeWindow(config.resolution.disputeWindow, {
      gasLimit: 500000,
      maxPriorityFeePerGas: ethers.parseUnits("2", "gwei"),
      maxFeePerGas: ethers.parseUnits("3", "gwei")
    });

    console.log(`  📝 Transaction sent: ${tx.hash}`);
    await tx.wait();
    console.log("  ✅ Dispute window set to TESTING mode (15 minutes)");
  } else {
    console.log(`  ⚠️  Dispute window already set to ${currentDisputeWindow} seconds (skipping)`);
  }

  // Set minimum dispute bond
  let currentMinBond;
  try {
    currentMinBond = await resolutionManager.minDisputeBond();
  } catch (e) {
    currentMinBond = 0n;
  }

  if (currentMinBond.toString() === "0") {
    console.log(`  Setting minDisputeBond = ${ethers.formatEther(config.resolution.minDisputeBond)} BASED`);

    const tx = await resolutionManager.setMinDisputeBond(config.resolution.minDisputeBond, {
      gasLimit: 500000,
      maxPriorityFeePerGas: ethers.parseUnits("2", "gwei"),
      maxFeePerGas: ethers.parseUnits("3", "gwei")
    });

    console.log(`  📝 Transaction sent: ${tx.hash}`);
    await tx.wait();
    console.log("  ✅ Minimum dispute bond set");
  } else {
    console.log(`  ⚠️  Min dispute bond already set to ${ethers.formatEther(currentMinBond)} BASED (skipping)`);
  }

  // ===== STEP 4: Enable Market Creation =====
  console.log("\n🚀 Step 4: Enabling Market Creation...");

  const marketCreationActiveKey = ethers.id("marketCreationActive");
  const isActive = await paramStorage.getBoolParameter(marketCreationActiveKey);

  if (!isActive) {
    console.log("  Enabling market creation...");

    const tx = await paramStorage.setBoolParameter(marketCreationActiveKey, true, {
      gasLimit: 500000,
      maxPriorityFeePerGas: ethers.parseUnits("2", "gwei"),
      maxFeePerGas: ethers.parseUnits("3", "gwei")
    });

    console.log(`  📝 Transaction sent: ${tx.hash}`);
    await tx.wait();
    console.log("  ✅ Market creation ENABLED");
  } else {
    console.log("  ✅ Market creation already enabled");
  }

  // ===== STEP 5: Verify All Parameters =====
  console.log("\n✅ Step 5: Verifying All Parameters...");
  console.log("\n📊 Current Parameter Values:");
  console.log("============================");

  // Fee parameters
  console.log("\n💰 Fee Distribution:");
  for (const param of feeParams) {
    const value = await paramStorage.getParameter(ethers.id(param.key));
    const percentage = (Number(value) / 100).toFixed(2);
    console.log(`  ${param.key.padEnd(25)} ${value.toString().padStart(4)} (${percentage}%)`);
  }

  // Market parameters
  console.log("\n🎯 Market Limits:");
  for (const param of marketParams) {
    const value = await paramStorage.getParameter(ethers.id(param.key));
    console.log(`  ${param.key.padEnd(25)} ${ethers.formatEther(value)} BASED`);
  }

  // Resolution parameters
  console.log("\n⏱️  Resolution Settings:");
  const disputeWindow = await resolutionManager.disputeWindow();
  const minBond = await resolutionManager.minDisputeBond();
  console.log(`  Dispute Window:            ${disputeWindow} seconds (${Number(disputeWindow) / 60} minutes)`);
  console.log(`  Min Dispute Bond:          ${ethers.formatEther(minBond)} BASED`);
  console.log(`  Agreement Threshold:       ${config.resolution.agreementThreshold}% (auto-finalize)`);
  console.log(`  Disagreement Threshold:    ${config.resolution.disagreementThreshold}% (flag dispute)`);

  // Flags
  console.log("\n🚩 System Flags:");
  const marketCreationActive = await paramStorage.getBoolParameter(marketCreationActiveKey);
  console.log(`  Market Creation:           ${marketCreationActive ? '✅ ENABLED' : '❌ DISABLED'}`);

  // ===== Summary =====
  console.log("\n" + "=".repeat(50));
  console.log("✅ PARAMETER INITIALIZATION COMPLETE!");
  console.log("=".repeat(50));
  console.log("\n📋 Summary:");
  console.log("  • Total Fees:              5.0% (500 BPS)");
  console.log("    - Protocol Fee:          2.5%");
  console.log("    - Creator Fee:           1.5%");
  console.log("    - Staker Incentive:      0.5%");
  console.log("    - Treasury Fee:          0.5%");
  console.log("  • Winners Receive:         95%");
  console.log("  • Dispute Window:          15 minutes (TESTING MODE)");
  console.log("  • Market Creation:         ENABLED");
  console.log("\n⚠️  SYSTEM STATUS:");
  console.log("  • Mode:                    TESTING (rapid iteration)");
  console.log("  • Production Ready:        NO (switch dispute window to 48h first)");
  console.log("\n🔄 To Switch to Production Mode:");
  console.log("  Run: node scripts/mainnet/switch-to-production.js");
  console.log("  OR manually set dispute window to 48 hours in admin panel");
  console.log("\n📝 Next Steps:");
  console.log("  1. Create first test market");
  console.log("  2. Test full lifecycle (create → approve → bet → resolve)");
  console.log("  3. Verify fees distribute correctly");
  console.log("  4. Switch to production mode when confident");
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
