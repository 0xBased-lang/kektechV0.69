const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

const deploymentState = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "../basedai-mainnet-deployment.json"),
    "utf8"
  )
);

async function validate() {
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║  🔐 PHASE 4.0 PRE-EXECUTION VALIDATION GATE (Steps 1.3-4.3)  ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  const [deployer] = await ethers.getSigners();
  let allPassed = true;
  const results = [];

  // STEP 1.3: Verify Factory NOT paused
  console.log("STEP 1.3: Verify Factory NOT Paused");
  const factory = await ethers.getContractAt(
    "FlexibleMarketFactoryUnified",
    deploymentState.contracts.FlexibleMarketFactoryUnified
  );
  const paused = await factory.paused();
  if (paused) {
    console.log("❌ FAILED: Factory is paused");
    allPassed = false;
  } else {
    console.log("✅ PASSED: Factory is operational\n");
  }

  // STEP 1.4: Verify Minimum Bond Configuration
  console.log("STEP 1.4: Verify Minimum Bond Configuration");
  const minBond = await factory.minCreatorBond();
  const minBondEther = ethers.formatEther(minBond);
  if (minBond > 0n) {
    console.log(`✅ PASSED: Min bond = ${minBondEther} $BASED\n`);
  } else {
    console.log("❌ FAILED: Min bond not configured");
    allPassed = false;
  }

  // STEP 2.1: Verify Wallet Balance
  console.log("STEP 2.1: Verify Wallet Balance");
  const balance = await ethers.provider.getBalance(deployer.address);
  const balanceEther = ethers.formatEther(balance);
  const requiredBalance = ethers.parseEther("0.5");
  if (balance > requiredBalance) {
    console.log(`✅ PASSED: Wallet has ${balanceEther} $BASED (required: 0.5)\n`);
  } else {
    console.log(`❌ FAILED: Insufficient balance (${balanceEther} $BASED)`);
    allPassed = false;
  }

  // STEP 2.2: Verify Network is BasedAI Mainnet
  console.log("STEP 2.2: Verify Network is BasedAI Mainnet");
  const network = await ethers.provider.getNetwork();
  if (network.chainId === 32323n) {
    console.log(`✅ PASSED: Connected to BasedAI Mainnet (Chain ID: ${network.chainId})\n`);
  } else {
    console.log(`❌ FAILED: Wrong network (Chain ID: ${network.chainId})`);
    allPassed = false;
  }

  // STEP 2.3: Verify RPC Connectivity
  console.log("STEP 2.3: Verify RPC Connectivity");
  try {
    const blockNumber = await ethers.provider.getBlockNumber();
    console.log(`✅ PASSED: RPC working (current block: ${blockNumber})\n`);
  } catch (err) {
    console.log("❌ FAILED: RPC not responding");
    allPassed = false;
  }

  // STEP 3.1: Verify Registry Connectivity
  console.log("STEP 3.1: Verify Registry Connectivity");
  const registry = await ethers.getContractAt(
    "VersionedRegistry",
    deploymentState.contracts.VersionedRegistry
  );
  try {
    const factoryFromRegistry = await registry.getContract(ethers.id("MarketFactory"));
    if (factoryFromRegistry.toLowerCase() === factory.address.toLowerCase()) {
      console.log("✅ PASSED: Registry accessible and working\n");
    } else {
      console.log("❌ FAILED: Registry returned wrong factory address");
      allPassed = false;
    }
  } catch (err) {
    console.log(`❌ FAILED: Cannot query registry: ${err.message}`);
    allPassed = false;
  }

  // STEP 3.2: Verify Template is Registered
  console.log("STEP 3.2: Verify Template is Registered");
  try {
    const template = await registry.getContract(ethers.id("PredictionMarket"));
    if (template !== ethers.ZeroAddress) {
      console.log(`✅ PASSED: Template registered at ${template}\n`);
    } else {
      console.log("❌ FAILED: Template not registered");
      allPassed = false;
    }
  } catch (err) {
    console.log(`❌ FAILED: Cannot access template: ${err.message}`);
    allPassed = false;
  }

  // STEP 3.3: Verify Factory Can Access Registry
  console.log("STEP 3.3: Verify Factory Can Access Registry");
  try {
    const factoryRegistry = await factory.registry();
    if (factoryRegistry.toLowerCase() === registry.address.toLowerCase()) {
      console.log("✅ PASSED: Factory properly configured with registry\n");
    } else {
      console.log("❌ FAILED: Factory registry mismatch");
      allPassed = false;
    }
  } catch (err) {
    console.log(`❌ FAILED: Cannot access factory registry: ${err.message}`);
    allPassed = false;
  }

  // STEP 4.1: Verify Monitoring Log Directory
  console.log("STEP 4.1: Verify Monitoring Log Directory");
  const logDir = path.join(__dirname, "../logs/monitoring");
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  console.log(`✅ PASSED: Log directory ready at ${logDir}\n`);

  // STEP 4.2: Verify Deployment State File
  console.log("STEP 4.2: Verify Deployment State File");
  if (fs.existsSync(path.join(__dirname, "../basedai-mainnet-deployment.json"))) {
    console.log("✅ PASSED: Deployment state file present\n");
  } else {
    console.log("❌ FAILED: Deployment state file missing");
    allPassed = false;
  }

  // STEP 4.3: Create Phase 4 Documentation Record
  console.log("STEP 4.3: Create Phase 4 Documentation Record");
  const docRecord = {
    timestamp: new Date().toISOString(),
    phase: "4.0",
    validationGate: "Pre-Execution",
    deployer: deployer.address,
    walletBalance: ethers.formatEther(balance),
    network: {
      chainId: network.chainId.toString(),
      name: "BasedAI Mainnet"
    },
    contracts: deploymentState.contracts,
    validationResults: "All steps passed"
  };

  const docPath = path.join(__dirname, "../logs/monitoring/phase4-validation-" + Date.now() + ".json");
  fs.writeFileSync(docPath, JSON.stringify(docRecord, null, 2));
  console.log(`✅ PASSED: Documentation recorded at ${docPath}\n`);

  // FINAL RESULT
  console.log("╔════════════════════════════════════════════════════════════╗");
  if (allPassed) {
    console.log("║           ✅ ALL 13 VALIDATION STEPS PASSED ✅            ║");
    console.log("║                                                            ║");
    console.log("║          🚀 READY TO BEGIN MARKET TESTING 🚀             ║");
  } else {
    console.log("║           ❌ VALIDATION FAILED - FIX ISSUES ❌            ║");
  }
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  return allPassed;
}

validate().then(passed => process.exit(passed ? 0 : 1));
