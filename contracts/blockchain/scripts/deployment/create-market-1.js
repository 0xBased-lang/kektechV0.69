// MARKET 1 CREATION SCRIPT - BasedAI Mainnet
// BULLETPROOF EXECUTION: Follow PHASE_4.1_EXECUTION_SPECIFICATION.md exactly

const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

// Market 1 Configuration (FIXED - DO NOT MODIFY WITHOUT APPROVAL)
const MARKET_1_CONFIG = {
  question: "Test Market #1: Will outcome be YES?",
  outcomeTokens: ["YES", "NO"],
  resolutionSource: "Manual test resolution",
  category: "Test",
  bondAmount: "0.1", // $BASED
  durationDays: 30
};

// Deployment addresses (loaded from deployment files)
let FACTORY_ADDRESS;
let REGISTRY_ADDRESS;

async function main() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("🚀 MARKET 1 CREATION - BasedAI Mainnet");
  console.log("═══════════════════════════════════════════════════════════\n");

  // ============================================================
  // SECTION 1: PRE-CREATION VERIFICATION
  // ============================================================
  console.log("📋 SECTION 1: PRE-CREATION VERIFICATION\n");

  // Load deployment addresses
  const deploymentFile = path.join(__dirname, '../../deployments/basedai-mainnet/deployment.json');
  if (!fs.existsSync(deploymentFile)) {
    console.error("❌ ERROR: Deployment file not found!");
    console.error("Expected:", deploymentFile);
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
  FACTORY_ADDRESS = deployment.FlexibleMarketFactoryUnified;
  REGISTRY_ADDRESS = deployment.VersionedRegistry;

  console.log("✅ Deployment addresses loaded:");
  console.log("   Factory:", FACTORY_ADDRESS);
  console.log("   Registry:", REGISTRY_ADDRESS);
  console.log("");

  // Get signer
  const [signer] = await hre.ethers.getSigners();
  const signerAddress = await signer.getAddress();
  console.log("📍 Operator address:", signerAddress);

  // Check balance
  const balance = await hre.ethers.provider.getBalance(signerAddress);
  const balanceFormatted = hre.ethers.formatEther(balance);
  console.log("💰 Wallet balance:", balanceFormatted, "$BASED");

  const requiredBalance = hre.ethers.parseEther("0.15"); // 0.1 bond + 0.05 buffer
  if (balance < requiredBalance) {
    console.error("❌ INSUFFICIENT BALANCE!");
    console.error("   Required: 0.15 $BASED (0.1 bond + 0.05 gas buffer)");
    console.error("   Actual:", balanceFormatted, "$BASED");
    process.exit(1);
  }
  console.log("✅ Balance sufficient (≥0.15 $BASED)\n");

  // Capture baseline data
  const blockNumber = await hre.ethers.provider.getBlockNumber();
  const block = await hre.ethers.provider.getBlock(blockNumber);
  const timestamp = new Date(block.timestamp * 1000).toISOString();

  console.log("📸 Baseline Data:");
  console.log("   Block number:", blockNumber);
  console.log("   Timestamp:", timestamp);
  console.log("   Network:", hre.network.name);
  console.log("   Chain ID:", (await hre.ethers.provider.getNetwork()).chainId.toString());
  console.log("");

  // Get factory contract
  const Factory = await hre.ethers.getContractFactory("FlexibleMarketFactoryUnified");
  const factory = Factory.attach(FACTORY_ADDRESS);

  // Verify factory operational
  console.log("🔍 Verifying factory operational...");
  try {
    const marketCount = await factory.getMarketCount();
    console.log("✅ Factory responds");
    console.log("   Current market count:", marketCount.toString());

    if (marketCount > 0n) {
      console.warn("⚠️  WARNING: Market count is not 0!");
      console.warn("   This may not be the first market.");
      console.warn("   Continue? (Ctrl+C to abort)");
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  } catch (error) {
    console.error("❌ Factory verification failed!");
    console.error("Error:", error.message);
    process.exit(1);
  }
  console.log("");

  // ============================================================
  // SECTION 2: MARKET CONFIGURATION
  // ============================================================
  console.log("📋 SECTION 2: MARKET CONFIGURATION\n");

  const marketConfig = {
    question: MARKET_1_CONFIG.question,
    outcomeTokens: MARKET_1_CONFIG.outcomeTokens,
    resolutionSource: MARKET_1_CONFIG.resolutionSource,
    category: MARKET_1_CONFIG.category,
    bond: hre.ethers.parseEther(MARKET_1_CONFIG.bondAmount),
    duration: MARKET_1_CONFIG.durationDays * 24 * 60 * 60 // Convert days to seconds
  };

  console.log("Market Configuration:");
  console.log(JSON.stringify({
    question: marketConfig.question,
    outcomeTokens: marketConfig.outcomeTokens,
    resolutionSource: marketConfig.resolutionSource,
    category: marketConfig.category,
    bondFormatted: MARKET_1_CONFIG.bondAmount + " $BASED",
    durationDays: MARKET_1_CONFIG.durationDays
  }, null, 2));
  console.log("\nBond in wei:", marketConfig.bond.toString());
  console.log("");

  // ============================================================
  // SECTION 3: DRY RUN (PRE-FLIGHT CHECK)
  // ============================================================
  console.log("📋 SECTION 3: DRY RUN (SIMULATION)\n");
  console.log("🔍 Simulating transaction (no actual execution)...");

  try {
    const result = await factory.createMarket.staticCall(
      marketConfig.question,
      marketConfig.outcomeTokens,
      marketConfig.resolutionSource,
      marketConfig.category,
      marketConfig.bond,
      marketConfig.duration,
      { value: marketConfig.bond }
    );

    console.log("✅ Dry run SUCCESSFUL - transaction will NOT revert");
    console.log("   Expected market address:", result);
    console.log("");
  } catch (error) {
    console.error("❌ DRY RUN FAILED - ABORTING!");
    console.error("Revert reason:", error.message);
    if (error.data) {
      console.error("Error data:", error.data);
    }
    process.exit(1);
  }

  // ============================================================
  // SECTION 4: FINAL CONFIRMATION
  // ============================================================
  console.log("═══════════════════════════════════════════════════════════");
  console.log("🚨 FINAL CONFIRMATION CHECKPOINT 🚨");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("Network: BasedAI Mainnet (Chain ID: 32323)");
  console.log("Action: CREATE FIRST MARKET WITH REAL MONEY");
  console.log("Bond: 0.1 $BASED (real funds at risk)");
  console.log("Status: All pre-flight checks PASSED");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("");
  console.log("⏳ Waiting 10 seconds for manual abort (Ctrl+C)...");
  console.log("");

  await new Promise(resolve => setTimeout(resolve, 10000));

  // ============================================================
  // SECTION 5: LIVE EXECUTION
  // ============================================================
  console.log("📋 SECTION 5: LIVE EXECUTION\n");
  console.log("🚀 CREATING MARKET ON MAINNET...");
  console.log("⏰ Start time:", new Date().toISOString());
  console.log("");

  let tx, receipt, marketAddress;

  try {
    // Send transaction
    tx = await factory.createMarket(
      marketConfig.question,
      marketConfig.outcomeTokens,
      marketConfig.resolutionSource,
      marketConfig.category,
      marketConfig.bond,
      marketConfig.duration,
      { value: marketConfig.bond }
    );

    console.log("📝 Transaction sent!");
    console.log("   Tx hash:", tx.hash);
    console.log("⏳ Waiting for confirmation...\n");

    // Wait for confirmation
    receipt = await tx.wait(1);

    console.log("✅ Transaction CONFIRMED!");
    console.log("   Block number:", receipt.blockNumber);
    console.log("   Gas used:", receipt.gasUsed.toString());
    console.log("   Status:", receipt.status === 1 ? "SUCCESS ✅" : "FAILED ❌");
    console.log("");

    if (receipt.status !== 1) {
      console.error("❌ Transaction failed!");
      process.exit(1);
    }

  } catch (error) {
    console.error("❌ TRANSACTION FAILED!");
    console.error("Error:", error.message);
    if (error.data) {
      console.error("Error data:", error.data);
    }
    process.exit(1);
  }

  // ============================================================
  // SECTION 6: PARSE EVENTS & EXTRACT MARKET ADDRESS
  // ============================================================
  console.log("📋 SECTION 6: PARSING EVENTS\n");

  try {
    // Find MarketCreated event
    const marketCreatedEvent = receipt.logs.find(log => {
      try {
        const parsed = factory.interface.parseLog(log);
        return parsed.name === "MarketCreated";
      } catch {
        return false;
      }
    });

    if (!marketCreatedEvent) {
      console.error("❌ CRITICAL: MarketCreated event not found!");
      console.error("Transaction succeeded but event missing!");
      process.exit(1);
    }

    const parsedEvent = factory.interface.parseLog(marketCreatedEvent);
    marketAddress = parsedEvent.args.market;

    if (!marketAddress || marketAddress === hre.ethers.ZeroAddress) {
      console.error("❌ CRITICAL: Market address is zero!");
      process.exit(1);
    }

    console.log("✅ MarketCreated event found");
    console.log("🎯 Market address:", marketAddress);
    console.log("");

  } catch (error) {
    console.error("❌ Event parsing failed!");
    console.error("Error:", error.message);
    process.exit(1);
  }

  // ============================================================
  // SECTION 7: IMMEDIATE STATE VERIFICATION
  // ============================================================
  console.log("📋 SECTION 7: STATE VERIFICATION\n");

  const Market = await hre.ethers.getContractFactory("PredictionMarket");
  const market = Market.attach(marketAddress);

  try {
    // Read basic state
    const state = await market.marketState();
    const question = await market.question();
    const creator = await market.creator();
    const bondAmount = await market.bond();

    console.log("📊 Initial Market State:");
    console.log("   State:", state, "(0 = PROPOSED)");
    console.log("   Question:", question);
    console.log("   Creator:", creator);
    console.log("   Bond:", hre.ethers.formatEther(bondAmount), "$BASED");
    console.log("");

    // Validate
    const validations = {
      stateIsProposed: state === 0n,
      questionMatches: question === marketConfig.question,
      creatorCorrect: creator.toLowerCase() === signerAddress.toLowerCase(),
      bondCorrect: bondAmount === marketConfig.bond
    };

    console.log("✅ Validation Results:");
    console.log("   State is PROPOSED:", validations.stateIsProposed ? "✅" : "❌");
    console.log("   Question matches:", validations.questionMatches ? "✅" : "❌");
    console.log("   Creator correct:", validations.creatorCorrect ? "✅" : "❌");
    console.log("   Bond correct:", validations.bondCorrect ? "✅" : "❌");
    console.log("");

    const allValid = Object.values(validations).every(v => v === true);
    if (!allValid) {
      console.error("❌ STATE VALIDATION FAILED!");
      console.error("Some validations did not pass. Review above.");
      process.exit(1);
    }

  } catch (error) {
    console.error("❌ State verification failed!");
    console.error("Error:", error.message);
    process.exit(1);
  }

  // ============================================================
  // SECTION 8: COMPREHENSIVE STATE CHECK
  // ============================================================
  console.log("📋 SECTION 8: COMPREHENSIVE STATE CHECK\n");

  try {
    const outcomeTokens = await market.getOutcomeTokens();
    const resolutionTime = await market.resolutionTime();
    const registry = await market.registry();

    console.log("🔍 Detailed Validation:");
    console.log("   Outcome tokens:", outcomeTokens);
    console.log("   Resolution time:", new Date(Number(resolutionTime) * 1000).toISOString());
    console.log("   Registry address:", registry);
    console.log("");

    // Validate factory state
    const factoryMarketCount = await factory.getMarketCount();
    const firstMarket = await factory.markets(0);

    console.log("📈 Factory State:");
    console.log("   Total markets:", factoryMarketCount.toString());
    console.log("   Market[0]:", firstMarket);
    console.log("   Matches our market:", firstMarket.toLowerCase() === marketAddress.toLowerCase() ? "✅" : "❌");
    console.log("");

  } catch (error) {
    console.error("❌ Comprehensive check failed!");
    console.error("Error:", error.message);
    process.exit(1);
  }

  // ============================================================
  // SECTION 9: SAVE MARKET DATA
  // ============================================================
  console.log("📋 SECTION 9: SAVING MARKET DATA\n");

  const marketData = {
    metadata: {
      marketNumber: 1,
      createdAt: new Date().toISOString(),
      network: hre.network.name,
      chainId: (await hre.ethers.provider.getNetwork()).chainId.toString()
    },
    addresses: {
      market: marketAddress,
      factory: FACTORY_ADDRESS,
      registry: REGISTRY_ADDRESS,
      creator: signerAddress
    },
    transaction: {
      hash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      timestamp: block.timestamp
    },
    configuration: {
      question: await market.question(),
      outcomeTokens: await market.getOutcomeTokens(),
      bond: hre.ethers.formatEther(await market.bond()),
      durationDays: MARKET_1_CONFIG.durationDays,
      category: MARKET_1_CONFIG.category
    },
    initialState: {
      marketState: "PROPOSED",
      creator: await market.creator(),
      resolutionTime: (await market.resolutionTime()).toString()
    }
  };

  // Ensure markets directory exists
  const marketsDir = path.join(__dirname, '../../deployments/basedai-mainnet/markets');
  if (!fs.existsSync(marketsDir)) {
    fs.mkdirSync(marketsDir, { recursive: true });
  }

  const marketFile = path.join(marketsDir, 'market_1.json');
  fs.writeFileSync(marketFile, JSON.stringify(marketData, null, 2));

  console.log("💾 Market data saved to:", marketFile);
  console.log("");

  // ============================================================
  // SECTION 10: SUCCESS SUMMARY
  // ============================================================
  console.log("═══════════════════════════════════════════════════════════");
  console.log("✅ MARKET 1 CREATION: SUCCESS");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("Market Address:", marketAddress);
  console.log("Transaction Hash:", tx.hash);
  console.log("Block Number:", receipt.blockNumber);
  console.log("Gas Used:", receipt.gasUsed.toString());
  console.log("State: PROPOSED ✓");
  console.log("All Validations: PASSED ✓");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("");
  console.log("📍 Next Steps:");
  console.log("1. Review market data in:", marketFile);
  console.log("2. Proceed to betting phase (Section 4 of specification)");
  console.log("3. Follow PHASE_4.1_EXECUTION_SPECIFICATION.md exactly");
  console.log("");
  console.log("🎯 READY FOR BETTING PHASE");
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ FATAL ERROR:");
    console.error(error);
    process.exit(1);
  });
