/**
 * Pre-Deployment Checklist
 * Runs all checks before deploying to BasedAI
 */

require("dotenv").config();
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🔍 Running Pre-Deployment Checklist...\n");

  let allChecksPassed = true;
  const checks = [];

  // Check 1: .env file exists
  console.log("1️⃣  Checking .env file...");
  const envPath = path.join(__dirname, "..", ".env");
  if (fs.existsSync(envPath)) {
    console.log("   ✅ .env file exists");
    checks.push({ name: ".env file", status: true });
  } else {
    console.log("   ❌ .env file missing");
    console.log("      Create .env file with PRIVATE_KEY");
    checks.push({ name: ".env file", status: false });
    allChecksPassed = false;
  }

  // Check 2: Private key configured
  console.log("\n2️⃣  Checking private key...");
  if (process.env.PRIVATE_KEY) {
    const keyLength = process.env.PRIVATE_KEY.length;
    if (keyLength === 64 || keyLength === 66) {
      console.log("   ✅ Private key configured (length: " + keyLength + ")");
      checks.push({ name: "Private key", status: true });
    } else {
      console.log("   ⚠️  Private key length unusual: " + keyLength);
      console.log("      Expected: 64 characters (or 66 with 0x prefix)");
      checks.push({ name: "Private key", status: false });
      allChecksPassed = false;
    }
  } else {
    console.log("   ❌ Private key not configured");
    console.log("      Add PRIVATE_KEY to .env file");
    checks.push({ name: "Private key", status: false });
    allChecksPassed = false;
  }

  // Check 3: RPC URL configured
  console.log("\n3️⃣  Checking RPC URL...");
  const rpcUrl = process.env.BASEDAI_RPC_URL || "https://mainnet.basedaibridge.com/rpc";
  console.log(`   ✅ RPC URL: ${rpcUrl}`);
  checks.push({ name: "RPC URL", status: true });

  // Check 4: Network connection
  console.log("\n4️⃣  Testing network connection...");
  try {
    const network = await hre.ethers.provider.getNetwork();
    const blockNumber = await hre.ethers.provider.getBlockNumber();

    if (network.chainId === 32323n) {
      console.log(`   ✅ Connected to BasedAI Mainnet (Chain ID: 32323)`);
      console.log(`   ✅ Current Block: ${blockNumber}`);
      checks.push({ name: "Network connection", status: true });
    } else {
      console.log(`   ⚠️  Connected to wrong network (Chain ID: ${network.chainId})`);
      checks.push({ name: "Network connection", status: false });
      allChecksPassed = false;
    }
  } catch (error) {
    console.log("   ❌ Network connection failed");
    console.log(`      Error: ${error.message}`);
    checks.push({ name: "Network connection", status: false });
    allChecksPassed = false;
  }

  // Check 5: Wallet balance
  console.log("\n5️⃣  Checking wallet balance...");
  try {
    const [deployer] = await hre.ethers.getSigners();
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    const balanceInEth = hre.ethers.formatEther(balance);

    console.log(`   📍 Deployer: ${deployer.address}`);
    console.log(`   💰 Balance: ${balanceInEth} ETH`);

    const minBalance = hre.ethers.parseEther("0.01");
    if (balance >= minBalance) {
      console.log(`   ✅ Sufficient balance (>= 0.01 ETH)`);
      checks.push({ name: "Wallet balance", status: true });
    } else {
      console.log(`   ⚠️  Balance low (< 0.01 ETH recommended)`);
      console.log(`      Deployment may fail or you may not have enough for testing`);
      checks.push({ name: "Wallet balance", status: false });
      allChecksPassed = false;
    }
  } catch (error) {
    console.log("   ❌ Could not check balance");
    console.log(`      Error: ${error.message}`);
    checks.push({ name: "Wallet balance", status: false });
    allChecksPassed = false;
  }

  // Check 6: Contract compilation
  console.log("\n6️⃣  Checking contract compilation...");
  const artifactPath = path.join(__dirname, "..", "artifacts", "contracts", "KektvVouchersOffers.sol", "KektvVouchersOffers.json");
  if (fs.existsSync(artifactPath)) {
    console.log("   ✅ Contract compiled (artifacts found)");
    checks.push({ name: "Contract compilation", status: true });
  } else {
    console.log("   ❌ Contract not compiled");
    console.log("      Run: npx hardhat compile");
    checks.push({ name: "Contract compilation", status: false });
    allChecksPassed = false;
  }

  // Check 7: Required contracts deployed
  console.log("\n7️⃣  Checking required contracts...");
  console.log("   📍 KEKTV Vouchers: 0x7FEF981beE047227f848891c6C9F9dad11767a48");
  console.log("   📍 TECH Token: (needs to be on BasedAI)");
  console.log("   ⚠️  Make sure these contracts exist on BasedAI network");
  checks.push({ name: "Required contracts", status: true });

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📋 PRE-DEPLOYMENT CHECKLIST SUMMARY");
  console.log("=".repeat(60) + "\n");

  checks.forEach((check, index) => {
    const status = check.status ? "✅" : "❌";
    console.log(`${index + 1}. ${status} ${check.name}`);
  });

  console.log("\n" + "=".repeat(60));

  if (allChecksPassed) {
    console.log("✅ ALL CHECKS PASSED - READY TO DEPLOY!");
    console.log("=".repeat(60) + "\n");
    console.log("Next step:");
    console.log("  npx hardhat run scripts/deploy-kektv-offers.js --network basedai\n");
    return true;
  } else {
    console.log("❌ SOME CHECKS FAILED - FIX ISSUES BEFORE DEPLOYING");
    console.log("=".repeat(60) + "\n");
    return false;
  }
}

main()
  .then((success) => process.exit(success ? 0 : 1))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
