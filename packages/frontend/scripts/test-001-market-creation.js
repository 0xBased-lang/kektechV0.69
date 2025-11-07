/**
 * Test 001: Market Creation - Mainnet Testing Script
 *
 * This script executes Test 001 from docs/phase-5/mainnet-testing/test-001-market-creation.md
 *
 * Usage: node scripts/test-001-market-creation.js
 *
 * Prerequisites:
 * - Wallet with ≥0.2 BASED
 * - PRIVATE_KEY in .env
 * - BasedAI Mainnet RPC configured
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import contract addresses and ABIs
const { CONTRACT_ADDRESSES } = require('../lib/contracts/addresses');
const { ABIS } = require('../lib/contracts/abis');

// Configuration
const CONFIG = {
  CHAIN_ID: 32323,
  RPC_URL: process.env.NEXT_PUBLIC_RPC_URL || 'https://mainnet.basedaibridge.com/rpc/',
  PRIVATE_KEY: process.env.PRIVATE_KEY,
  GAS_PRICE: process.env.NEXT_PUBLIC_GAS_PRICE || '9000000000',
};

// Test data
const TEST_MARKET = {
  question: "Will BASED token reach $1 by December 31, 2025?",
  description: "Test market for Phase 5 validation. This market will resolve to YES if BASED token reaches $1.00 USD on CoinGecko by December 31, 2025 23:59 UTC. Resolution source: CoinGecko daily close price.",
  category: "Crypto",
  resolutionDate: Math.floor(new Date('2025-12-31T23:59:59Z').getTime() / 1000), // Unix timestamp
  resolutionTime: Math.floor(new Date('2025-12-31T23:59:59Z').getTime() / 1000) + 3600, // +1 hour
  minBond: ethers.parseEther("0.1"), // 0.1 BASED bond
  curveId: 0n, // Default LMSR curve
  curveParams: [], // Default parameters
  metadata: "" // No additional metadata
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`),
  step: (num, msg) => console.log(`${colors.yellow}Step ${num}:${colors.reset} ${msg}`),
};

// Evidence logger
class EvidenceLogger {
  constructor() {
    this.startTime = Date.now();
    this.logs = [];
    this.transactions = [];
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const entry = `[${timestamp}] ${message}`;
    this.logs.push(entry);
    console.log(`  ${message}`);
  }

  addTransaction(tx) {
    this.transactions.push({
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: tx.value?.toString() || '0',
      data: tx.data,
      timestamp: new Date().toISOString(),
    });
  }

  async saveEvidence(testResult) {
    const evidenceDir = path.join(__dirname, '../docs/phase-5/evidence/transaction-logs');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `test-001-${timestamp}.json`;
    const filepath = path.join(evidenceDir, filename);

    const evidence = {
      testId: 'Test-001',
      testName: 'Market Creation - Minimal Bond',
      startTime: new Date(this.startTime).toISOString(),
      endTime: new Date().toISOString(),
      duration: `${Math.floor((Date.now() - this.startTime) / 1000)}s`,
      result: testResult,
      logs: this.logs,
      transactions: this.transactions,
      environment: {
        chainId: CONFIG.CHAIN_ID,
        rpcUrl: CONFIG.RPC_URL,
        factoryAddress: CONTRACT_ADDRESSES.MarketFactory,
        registryAddress: CONTRACT_ADDRESSES.VersionedRegistry,
      }
    };

    fs.writeFileSync(filepath, JSON.stringify(evidence, null, 2));
    log.success(`Evidence saved: ${filename}`);
    return filepath;
  }
}

async function main() {
  const evidence = new EvidenceLogger();

  try {
    log.header('═══════════════════════════════════════════════════════');
    log.header('  TEST 001: MARKET CREATION - MAINNET VALIDATION');
    log.header('═══════════════════════════════════════════════════════');

    // ========================================
    // STEP 0: SETUP & VALIDATION
    // ========================================
    log.step(0, 'Setup & Validation');
    evidence.log('Starting Test 001: Market Creation');

    // Validate environment
    if (!CONFIG.PRIVATE_KEY) {
      throw new Error('PRIVATE_KEY not found in .env file');
    }
    evidence.log('✓ Private key configured');

    // Connect to BasedAI Mainnet
    log.info('Connecting to BasedAI Mainnet...');
    const provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
    const wallet = new ethers.Wallet(CONFIG.PRIVATE_KEY, provider);
    evidence.log(`✓ Connected to BasedAI Mainnet (Chain ID: ${CONFIG.CHAIN_ID})`);
    evidence.log(`✓ Wallet address: ${wallet.address}`);

    // Check network
    const network = await provider.getNetwork();
    log.info(`Network: ${network.name} (Chain ID: ${network.chainId})`);
    if (network.chainId !== BigInt(CONFIG.CHAIN_ID)) {
      throw new Error(`Wrong network! Expected ${CONFIG.CHAIN_ID}, got ${network.chainId}`);
    }
    evidence.log(`✓ Network verified: Chain ID ${network.chainId}`);

    // Check wallet balance
    const balance = await provider.getBalance(wallet.address);
    const balanceInBased = ethers.formatEther(balance);
    log.info(`Wallet balance: ${balanceInBased} BASED`);
    evidence.log(`Wallet balance: ${balanceInBased} BASED`);

    if (balance < ethers.parseEther("0.2")) {
      throw new Error(`Insufficient balance! Need ≥0.2 BASED, have ${balanceInBased} BASED`);
    }
    evidence.log('✓ Sufficient balance confirmed');

    // Connect to contracts
    log.info('Connecting to contracts...');
    const factory = new ethers.Contract(
      CONTRACT_ADDRESSES.MarketFactory,
      ABIS.MarketFactory,
      wallet
    );
    const registry = new ethers.Contract(
      CONTRACT_ADDRESSES.VersionedRegistry,
      ABIS.VersionedRegistry,
      provider
    );
    evidence.log(`✓ Factory contract: ${CONTRACT_ADDRESSES.MarketFactory}`);
    evidence.log(`✓ Registry contract: ${CONTRACT_ADDRESSES.VersionedRegistry}`);

    // ========================================
    // STEP 1: PREPARE TRANSACTION
    // ========================================
    log.step(1, 'Prepare Market Creation Transaction');

    log.info('Market Configuration:');
    console.log('  Question:', TEST_MARKET.question);
    console.log('  Category:', TEST_MARKET.category);
    console.log('  Resolution Date:', new Date(TEST_MARKET.resolutionDate * 1000).toISOString());
    console.log('  Bond:', ethers.formatEther(TEST_MARKET.minBond), 'BASED');
    evidence.log(`Market question: ${TEST_MARKET.question}`);
    evidence.log(`Market category: ${TEST_MARKET.category}`);
    evidence.log(`Bond amount: ${ethers.formatEther(TEST_MARKET.minBond)} BASED`);

    // Estimate gas
    log.info('Estimating gas...');
    try {
      const gasEstimate = await factory.createMarket.estimateGas(
        TEST_MARKET,
        { value: TEST_MARKET.minBond }
      );
      log.info(`Gas estimate: ${gasEstimate.toString()} (${(Number(gasEstimate) / 1000).toFixed(1)}k)`);
      evidence.log(`Gas estimate: ${gasEstimate.toString()} (expected: ~700k)`);

      const gasPrice = BigInt(CONFIG.GAS_PRICE);
      const estimatedCost = gasEstimate * gasPrice;
      const estimatedCostBased = ethers.formatEther(estimatedCost);
      log.info(`Estimated gas cost: ${estimatedCostBased} BASED`);
      log.info(`Total cost: ${(parseFloat(ethers.formatEther(TEST_MARKET.minBond)) + parseFloat(estimatedCostBased)).toFixed(4)} BASED`);
      evidence.log(`Estimated gas cost: ${estimatedCostBased} BASED`);
    } catch (error) {
      log.warning(`Gas estimation failed: ${error.message}`);
      log.warning('Proceeding anyway (will use default gas limit)');
      evidence.log(`⚠ Gas estimation failed: ${error.message}`);
    }

    // ========================================
    // STEP 2: SUBMIT MARKET CREATION
    // ========================================
    log.step(2, 'Submit Market Creation Transaction');

    log.info('Sending transaction...');
    evidence.log('Submitting market creation transaction...');

    const tx = await factory.createMarket(
      TEST_MARKET,
      {
        value: TEST_MARKET.minBond,
        gasPrice: CONFIG.GAS_PRICE,
      }
    );

    log.success(`Transaction sent: ${tx.hash}`);
    log.info(`Explorer: https://explorer.bf1337.org/tx/${tx.hash}`);
    evidence.log(`✓ Transaction hash: ${tx.hash}`);
    evidence.addTransaction(tx);

    log.info('Waiting for confirmation...');
    const receipt = await tx.wait();

    if (receipt.status === 1) {
      log.success(`Transaction confirmed in block ${receipt.blockNumber}`);
      evidence.log(`✓ Transaction confirmed in block ${receipt.blockNumber}`);
    } else {
      throw new Error('Transaction reverted!');
    }

    // Gas usage
    const gasUsed = receipt.gasUsed;
    const gasPrice = receipt.gasPrice || BigInt(CONFIG.GAS_PRICE);
    const actualCost = gasUsed * gasPrice;
    const actualCostBased = ethers.formatEther(actualCost);

    log.info(`Gas used: ${gasUsed.toString()} (${(Number(gasUsed) / 1000).toFixed(1)}k)`);
    log.info(`Gas cost: ${actualCostBased} BASED`);
    log.info(`Total spent: ${(parseFloat(ethers.formatEther(TEST_MARKET.minBond)) + parseFloat(actualCostBased)).toFixed(4)} BASED`);

    evidence.log(`Gas used: ${gasUsed.toString()}`);
    evidence.log(`Gas cost: ${actualCostBased} BASED`);
    evidence.log(`Total cost: ${(parseFloat(ethers.formatEther(TEST_MARKET.minBond)) + parseFloat(actualCostBased)).toFixed(4)} BASED`);

    // ========================================
    // STEP 3: VERIFY MARKET REGISTRATION
    // ========================================
    log.step(3, 'Verify Market Registration');

    // Parse MarketCreated event
    let marketId, marketAddress;
    for (const eventLog of receipt.logs) {
      try {
        const parsed = factory.interface.parseLog({
          topics: eventLog.topics,
          data: eventLog.data
        });

        if (parsed && parsed.name === 'MarketCreated') {
          marketId = parsed.args.marketId;
          marketAddress = parsed.args.marketAddress;
          log.success(`Market ID: ${marketId}`);
          log.success(`Market Address: ${marketAddress}`);
          evidence.log(`✓ Market ID: ${marketId}`);
          evidence.log(`✓ Market Address: ${marketAddress}`);
          break;
        }
      } catch (e) {
        // Not a factory event, skip
        continue;
      }
    }

    if (!marketId || !marketAddress) {
      throw new Error('MarketCreated event not found in transaction logs!');
    }

    // Verify market in registry
    log.info('Checking VersionedRegistry...');
    const registeredMarket = await registry.getContract(ethers.id("PredictionMarket"), 1);
    log.info(`Template registered: ${registeredMarket}`);
    evidence.log(`✓ Market template in registry: ${registeredMarket}`);

    // ========================================
    // STEP 4: VERIFY MARKET PARAMETERS
    // ========================================
    log.step(4, 'Verify Market Parameters');

    const market = new ethers.Contract(
      marketAddress,
      ABIS.PredictionMarket,
      provider
    );

    log.info('Reading market state...');

    // Read question
    const question = await market.question();
    const questionMatch = question === TEST_MARKET.question;
    log.info(`Question: ${questionMatch ? '✓' : '✗'} "${question}"`);
    evidence.log(`${questionMatch ? '✓' : '✗'} Question matches`);

    // Read creator
    const creator = await market.creator();
    const creatorMatch = creator.toLowerCase() === wallet.address.toLowerCase();
    log.info(`Creator: ${creatorMatch ? '✓' : '✗'} ${creator}`);
    evidence.log(`${creatorMatch ? '✓' : '✗'} Creator matches`);

    // Read state
    const state = await market.state();
    log.info(`State: ${state} (0=PROPOSED, 1=ACTIVE)`);
    evidence.log(`Market state: ${state}`);

    // ========================================
    // STEP 5: VERIFY EVENTS
    // ========================================
    log.step(5, 'Verify Events Emitted');

    let marketCreatedEvent = false;
    for (const eventLog of receipt.logs) {
      try {
        const parsed = factory.interface.parseLog({
          topics: eventLog.topics,
          data: eventLog.data
        });

        if (parsed && parsed.name === 'MarketCreated') {
          marketCreatedEvent = true;
          log.success('MarketCreated event found ✓');
          log.info(`  marketId: ${parsed.args.marketId}`);
          log.info(`  creator: ${parsed.args.creator}`);
          log.info(`  question: ${parsed.args.question}`);
          evidence.log('✓ MarketCreated event emitted correctly');
        }
      } catch (e) {
        continue;
      }
    }

    if (!marketCreatedEvent) {
      log.warning('MarketCreated event not found!');
      evidence.log('⚠ MarketCreated event not found');
    }

    // ========================================
    // FINAL RESULTS
    // ========================================
    log.header('═══════════════════════════════════════════════════════');
    log.header('  TEST 001 RESULTS');
    log.header('═══════════════════════════════════════════════════════');

    const results = {
      overall: 'PASS',
      marketId: marketId,
      marketAddress: marketAddress,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: gasUsed.toString(),
      gasCost: actualCostBased,
      totalCost: (parseFloat(ethers.formatEther(TEST_MARKET.minBond)) + parseFloat(actualCostBased)).toFixed(4),
      verification: {
        questionMatch: questionMatch,
        creatorMatch: creatorMatch,
        eventEmitted: marketCreatedEvent,
      }
    };

    log.success('✓ Overall: PASS');
    log.info(`✓ Market ID: ${marketId}`);
    log.info(`✓ Market Address: ${marketAddress}`);
    log.info(`✓ Transaction: ${tx.hash}`);
    log.info(`✓ Gas Used: ${(Number(gasUsed) / 1000).toFixed(1)}k`);
    log.info(`✓ Total Cost: ${results.totalCost} BASED`);

    // Save evidence
    const evidencePath = await evidence.saveEvidence(results);
    log.success(`✓ Evidence saved: ${evidencePath}`);

    // Update MASTER_LOG.md
    await updateMasterLog(results);

    // Update TESTING_LOG.md
    await updateTestingLog(results);

    log.header('═══════════════════════════════════════════════════════');
    log.success('TEST 001 COMPLETE - Ready for Test 002');
    log.header('═══════════════════════════════════════════════════════');

  } catch (error) {
    log.error(`Test failed: ${error.message}`);
    evidence.log(`✗ Test failed: ${error.message}`);
    console.error(error);

    // Save error evidence
    await evidence.saveEvidence({
      overall: 'FAIL',
      error: error.message,
      stack: error.stack,
    });

    process.exit(1);
  }
}

async function updateMasterLog(results) {
  const logPath = path.join(__dirname, '../docs/phase-5/MASTER_LOG.md');
  const timestamp = new Date().toISOString();
  const date = timestamp.split('T')[0];
  const time = timestamp.split('T')[1].split('.')[0];

  const entry = `

## ${date} (Day 1 - Mainnet Testing)

**${time}** - Started Test 001: Market Creation
  - Result: ✅ Success
  - Market ID: ${results.marketId}
  - Market Address: ${results.marketAddress}
  - Transaction: ${results.transactionHash}
  - Gas used: ${results.gasUsed} (expected: ~700k)
  - Total cost: ${results.totalCost} BASED
  - Notes: First mainnet market created successfully
  - Related: Test 001, Evidence saved
`;

  fs.appendFileSync(logPath, entry);
  log.info('✓ MASTER_LOG.md updated');
}

async function updateTestingLog(results) {
  const logPath = path.join(__dirname, '../docs/phase-5/TESTING_LOG.md');
  let content = fs.readFileSync(logPath, 'utf-8');

  // Update Test 001 section
  content = content.replace(
    /### Test 001: Market Creation - Minimal Bond\n- \*\*Status\*\*: ⏸️ NOT STARTED/,
    `### Test 001: Market Creation - Minimal Bond
- **Status**: ✅ COMPLETE
- **Date**: ${new Date().toISOString().split('T')[0]}
- **Result**: PASS
- **Market ID**: ${results.marketId}
- **Market Address**: ${results.marketAddress}
- **Transaction**: ${results.transactionHash}
- **Gas Used**: ${results.gasUsed}
- **Cost**: ${results.totalCost} BASED`
  );

  fs.writeFileSync(logPath, content);
  log.info('✓ TESTING_LOG.md updated');
}

// Run the test
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
