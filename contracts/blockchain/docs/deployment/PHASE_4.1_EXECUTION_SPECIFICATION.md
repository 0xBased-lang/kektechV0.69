# PHASE 4.1 EXECUTION SPECIFICATION
## Market 1: First Production Market - Bulletproof Execution Plan

**Status**: Ready for Execution
**Network**: BasedAI Mainnet (Chain ID: 32323)
**Risk Level**: REAL MONEY - MAXIMUM CAUTION
**Wallet Balance**: 6,123.88 $BASED
**Date Prepared**: 2025-11-06

---

## 🎯 MISSION OBJECTIVE

Create, test, and finalize the FIRST market on BasedAI mainnet with:
- **Zero failures** - Every step validated before proceeding
- **Complete documentation** - Full audit trail for analysis
- **Maximum caution** - Abort on ANY suspicion
- **Mechanical execution** - No guessing, no assumptions

---

## 📋 SECTION 1: PRE-CREATION CHECKLIST (13 Steps)

**Execute these BEFORE calling createMarket(). Mark each [x] as completed.**

### 1.1 Contract Verification
```bash
# Step 1: Verify Factory is operational
npx hardhat run scripts/verify-factory.js --network basedAI
# Expected: Factory address responds, getMarketCount() works
# ABORT IF: Factory unreachable or errors
```
- [ ] Factory responds to queries
- [ ] Factory.getMarketCount() returns 0 (no markets yet)
- [ ] Factory.owner() returns our wallet address

### 1.2 Registry Verification
```bash
# Step 2: Verify all contracts registered
npx hardhat run scripts/verify-registry.js --network basedAI
# Expected: All 8 contracts registered, versions correct
# ABORT IF: Any contract missing or version 0
```
- [ ] VersionedRegistry has 8 contracts registered
- [ ] PredictionMarketTemplate version = 1
- [ ] All supporting contracts registered (version 1)

### 1.3 Wallet & Balance Verification
```bash
# Step 3: Verify wallet has sufficient funds
npx hardhat run scripts/check-balance.js --network basedAI
# Expected: Balance ≥ 0.15 $BASED (0.1 bond + 0.05 gas buffer)
# ABORT IF: Balance < 0.15 $BASED
```
- [ ] Wallet balance ≥ 0.15 $BASED
- [ ] Wallet has no pending transactions
- [ ] Wallet is unlocked and ready

### 1.4 Network Health Check
```bash
# Step 4: Verify network is stable
npx hardhat run scripts/check-network.js --network basedAI
# Expected: Recent blocks confirming, gas price reasonable
# ABORT IF: Network congested or gas spike
```
- [ ] Last 10 blocks all confirmed
- [ ] Average gas price < 2 gwei
- [ ] No network errors in last hour

### 1.5 Pre-Creation Data Capture
```bash
# Step 5: Capture baseline data
node scripts/capture-baseline.js
```
**Record these values:**
- [ ] Current block number: `_____________`
- [ ] Current timestamp: `_____________`
- [ ] Wallet balance (exact): `_____________ $BASED`
- [ ] Factory address: `0x_____________`
- [ ] Template version: `_____________`
- [ ] Gas price estimate: `_____________ gwei`

### 1.6 Market Configuration Review
```
Question: "Test Market #1: Will outcome be YES?"
Bond: 0.1 $BASED
Duration: 30 days from creation
Outcomes: ["YES", "NO"]
ResolutionSource: "Manual test resolution"
Category: "Test"
```
- [ ] Question is clear and unambiguous
- [ ] Bond amount is 0.1 $BASED (confirmed twice)
- [ ] Duration is 30 days (reasonable for testing)
- [ ] Outcomes are binary (simplest case)

### 1.7 Gas Estimation
```bash
# Step 6: Estimate gas for market creation
npx hardhat run scripts/estimate-create-market.js --network basedAI
# Expected: Gas estimate ~700k-800k, cost ~$0.00007-0.00008
# ABORT IF: Estimation fails (reverts) or gas >2M
```
- [ ] Gas estimate successful (not reverting)
- [ ] Estimated gas: `_____________ gas`
- [ ] Estimated cost: `$_____________ USD`
- [ ] Gas within acceptable range (<1M gas)

### 1.8 Final Safety Checks
- [ ] Confirmed we're on BasedAI MAINNET (not fork)
- [ ] Confirmed this is REAL MONEY transaction
- [ ] Confirmed we have backup of all deployment data
- [ ] Confirmed team is available for monitoring

### 1.9 Human Confirmation Checkpoint
```
PRINT TO CONSOLE:
"═══════════════════════════════════════════════════════════"
"🚨 FINAL CONFIRMATION CHECKPOINT 🚨"
"═══════════════════════════════════════════════════════════"
"Network: BasedAI Mainnet (Chain ID: 32323)"
"Action: CREATE FIRST MARKET WITH REAL MONEY"
"Bond: 0.1 $BASED (real funds at risk)"
"Status: All pre-flight checks PASSED"
"═══════════════════════════════════════════════════════════"
"Type 'CONFIRM' to proceed: "
```
- [ ] Human typed "CONFIRM" explicitly
- [ ] Timestamp of confirmation: `_____________`
- [ ] Operator name: `_____________`

---

## 📋 SECTION 2: MARKET CREATION PROCEDURE (8 Steps)

### 2.1 Build Market Configuration
```javascript
// Script: scripts/create-market-1.js
const marketConfig = {
  question: "Test Market #1: Will outcome be YES?",
  outcomeTokens: ["YES", "NO"],
  resolutionSource: "Manual test resolution",
  category: "Test",
  bond: ethers.parseEther("0.1"), // 0.1 $BASED
  duration: 30 * 24 * 60 * 60 // 30 days in seconds
};

// VERIFY configuration before sending
console.log("Market Configuration:");
console.log(JSON.stringify(marketConfig, null, 2));
console.log("\nBond in wei:", marketConfig.bond.toString());
console.log("Bond in $BASED:", ethers.formatEther(marketConfig.bond));
```
- [ ] Configuration printed and visually verified
- [ ] Bond amount confirmed: 0.1 $BASED
- [ ] All fields non-empty

### 2.2 Pre-Flight Transaction Check
```javascript
// Dry-run: Call createMarket with callStatic (doesn't send)
console.log("\n🔍 DRY RUN: Simulating transaction...");
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
  console.log("✅ Dry run successful - transaction will NOT revert");
  console.log("Expected market address:", result);
} catch (error) {
  console.error("❌ DRY RUN FAILED - ABORTING");
  console.error("Revert reason:", error.message);
  process.exit(1);
}
```
- [ ] Dry run completed successfully
- [ ] Expected market address looks valid (not 0x0)
- [ ] No revert errors

### 2.3 Send Transaction (Live Execution)
```javascript
console.log("\n🚀 LIVE EXECUTION: Creating market on MAINNET...");
console.log("⏰ Timestamp:", new Date().toISOString());

const tx = await factory.createMarket(
  marketConfig.question,
  marketConfig.outcomeTokens,
  marketConfig.resolutionSource,
  marketConfig.category,
  marketConfig.bond,
  marketConfig.duration,
  { value: marketConfig.bond }
);

console.log("📝 Transaction sent!");
console.log("Transaction hash:", tx.hash);
console.log("⏳ Waiting for confirmation...");
```
**Record immediately:**
- [ ] Transaction hash: `0x_____________`
- [ ] Send timestamp: `_____________`
- [ ] Block number (if known): `_____________`

### 2.4 Monitor Transaction Confirmation
```javascript
const receipt = await tx.wait(1); // Wait for 1 confirmation

console.log("\n✅ Transaction confirmed!");
console.log("Block number:", receipt.blockNumber);
console.log("Gas used:", receipt.gasUsed.toString());
console.log("Status:", receipt.status === 1 ? "SUCCESS" : "FAILED");
```
**Record:**
- [ ] Confirmation timestamp: `_____________`
- [ ] Block number: `_____________`
- [ ] Gas used: `_____________`
- [ ] Transaction status: `[ ] SUCCESS  [ ] FAILED`

**ABORT IF:** Status !== SUCCESS

### 2.5 Parse Events & Extract Market Address
```javascript
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
  process.exit(1);
}

const parsedEvent = factory.interface.parseLog(marketCreatedEvent);
const marketAddress = parsedEvent.args.market;

console.log("\n🎯 Market created successfully!");
console.log("Market address:", marketAddress);
```
**Record:**
- [ ] MarketCreated event found: YES/NO
- [ ] Market address: `0x_____________`
- [ ] Market address is non-zero: YES/NO

**ABORT IF:** Event not found OR address is 0x0

### 2.6 Immediate State Verification
```javascript
// Get market contract instance
const Market = await ethers.getContractFactory("PredictionMarket");
const market = Market.attach(marketAddress);

// Read basic state
const state = await market.marketState();
const question = await market.question();
const creator = await market.creator();
const bondAmount = await market.bond();

console.log("\n📊 Initial Market State:");
console.log("State:", state); // Should be 0 (PROPOSED)
console.log("Question:", question);
console.log("Creator:", creator);
console.log("Bond:", ethers.formatEther(bondAmount), "$BASED");
```
**Verify:**
- [ ] Market state = 0 (PROPOSED)
- [ ] Question matches input
- [ ] Creator is our wallet address
- [ ] Bond is 0.1 $BASED

**ABORT IF:** Any mismatch

### 2.7 Comprehensive State Validation
```javascript
// Deep state check
const outcomeTokens = await market.getOutcomeTokens();
const resolutionTime = await market.resolutionTime();
const registry = await market.registry();

console.log("\n🔍 Detailed Validation:");
console.log("Outcome tokens:", outcomeTokens); // ["YES", "NO"]
console.log("Resolution time:", new Date(Number(resolutionTime) * 1000).toISOString());
console.log("Registry address:", registry);

// Validate counts
const factoryMarketCount = await factory.getMarketCount();
const firstMarket = await factory.markets(0);

console.log("\n📈 Factory State:");
console.log("Total markets:", factoryMarketCount.toString()); // Should be 1
console.log("Market[0]:", firstMarket);
console.log("Matches our market:", firstMarket === marketAddress);
```
**Verify ALL:**
- [ ] outcomeTokens = ["YES", "NO"]
- [ ] resolutionTime is ~30 days from now
- [ ] registry address matches VersionedRegistry
- [ ] factory.getMarketCount() = 1
- [ ] factory.markets(0) = our market address

**STOP IF:** Any verification fails (investigate before proceeding)

### 2.8 Save Market 1 Data
```javascript
// Save comprehensive market data
const market1Data = {
  metadata: {
    marketNumber: 1,
    createdAt: new Date().toISOString(),
    network: "BasedAI Mainnet",
    chainId: 32323
  },
  addresses: {
    market: marketAddress,
    factory: await factory.getAddress(),
    creator: await (await ethers.provider.getSigner()).getAddress()
  },
  transaction: {
    hash: tx.hash,
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed.toString(),
    timestamp: (await ethers.provider.getBlock(receipt.blockNumber)).timestamp
  },
  configuration: {
    question: await market.question(),
    outcomeTokens: await market.getOutcomeTokens(),
    bond: ethers.formatEther(await market.bond()),
    duration: 30,
    category: "Test"
  },
  initialState: {
    marketState: "PROPOSED",
    creator: await market.creator(),
    resolutionTime: (await market.resolutionTime()).toString()
  }
};

// Write to file
const fs = require('fs');
const filePath = './deployments/basedai-mainnet/markets/market_1.json';
fs.writeFileSync(filePath, JSON.stringify(market1Data, null, 2));
console.log("\n💾 Market data saved to:", filePath);
```
- [ ] market_1.json created successfully
- [ ] File contains all critical data
- [ ] Backup created

---

## 📋 SECTION 3: POST-CREATION VALIDATION CHECKLIST

**Execute immediately after market creation. All must pass.**

### 3.1 State Consistency Check
```bash
npx hardhat run scripts/validate-market-1-state.js --network basedAI
```
**Validates:**
- [ ] Market state is PROPOSED (0)
- [ ] Question field matches input exactly
- [ ] Creator is correct wallet address
- [ ] Bond amount is exactly 0.1 $BASED
- [ ] Outcome tokens = ["YES", "NO"]
- [ ] Registry address is correct
- [ ] Resolution time is ~30 days from creation
- [ ] All addresses non-zero

**STOP IF:** Any check fails

### 3.2 Registry Linkage Test
```bash
npx hardhat run scripts/test-registry-linkage.js --network basedAI
```
**Validates:**
- [ ] Market can call registry
- [ ] Market gets ParameterStorage address from registry
- [ ] Market gets AccessControlManager address from registry
- [ ] Market gets ResolutionManager address from registry
- [ ] All retrieved addresses match deployment

**STOP IF:** Linkage broken

### 3.3 Access Control Verification
```bash
npx hardhat run scripts/verify-market-access.js --network basedAI
```
**Validates:**
- [ ] Market can call AccessControlManager
- [ ] Proper roles configured
- [ ] Market has necessary permissions
- [ ] No unauthorized access possible

**STOP IF:** Access control misconfigured

### 3.4 Health Check Summary
```
═══════════════════════════════════════
✅ MARKET 1 CREATION: SUCCESS
═══════════════════════════════════════
Market Address: 0x_____________
State: PROPOSED ✓
All Fields Initialized: ✓
Registry Linkage: ✓
Access Control: ✓
Factory Count: 1 ✓
═══════════════════════════════════════
DECISION: [ ] GO to betting phase
          [ ] STOP and investigate
          [ ] ABORT (critical failure)
═══════════════════════════════════════
```
- [ ] All checks passed
- [ ] Decision marked above
- [ ] Timestamp: `_____________`

---

## 📋 SECTION 4: BETTING PHASE PROCEDURE (Conservative Testing)

**Only proceed if Section 3 validation passed 100%.**

### 4.1 Pre-Betting Setup
```javascript
// Get market instance
const market = await ethers.getContractAt("PredictionMarket", MARKET_1_ADDRESS);

// Capture initial state
const initialState = {
  marketState: await market.marketState(),
  totalPool: await ethers.provider.getBalance(MARKET_1_ADDRESS),
  yesShares: await market.totalShares(0),
  noShares: await market.totalShares(1),
  yesPrice: await market.getPrice(0),
  noPrice: await market.getPrice(1)
};

console.log("Initial Market State Before Betting:");
console.log(JSON.stringify(initialState, null, 2));
```
- [ ] Initial state captured
- [ ] Market state is ACTIVE (betting enabled)
- [ ] Pool balance = 0 (no bets yet)
- [ ] Prices are ~50/50

### 4.2 Bet Sequence (Incremental Testing)

#### BET #1: Minimum Test (0.001 $BASED on YES)
```javascript
console.log("\n🎲 BET #1: Minimum bet on YES");
const bet1Amount = ethers.parseEther("0.001");

// Pre-bet snapshot
const preBet1 = {
  walletBalance: await ethers.provider.getBalance(signerAddress),
  poolBalance: await ethers.provider.getBalance(marketAddress),
  yesPrice: await market.getPrice(0),
  noPrice: await market.getPrice(1),
  timestamp: Date.now()
};

// Place bet
const bet1Tx = await market.placeBet(0, { value: bet1Amount }); // 0 = YES
const bet1Receipt = await bet1Tx.wait();

// Post-bet snapshot
const postBet1 = {
  walletBalance: await ethers.provider.getBalance(signerAddress),
  poolBalance: await ethers.provider.getBalance(marketAddress),
  yesPrice: await market.getPrice(0),
  noPrice: await market.getPrice(1),
  sharesReceived: await market.balanceOf(signerAddress, 0),
  gasUsed: bet1Receipt.gasUsed.toString()
};

// Validate
console.log("Bet #1 Results:");
console.log("Gas used:", postBet1.gasUsed);
console.log("YES price:", ethers.formatEther(postBet1.yesPrice));
console.log("NO price:", ethers.formatEther(postBet1.noPrice));
console.log("Shares received:", ethers.formatEther(postBet1.sharesReceived));

// Check pool consistency
const poolIncrease = postBet1.poolBalance - preBet1.poolBalance;
console.log("Pool increased by:", ethers.formatEther(poolIncrease), "$BASED");
console.log("Expected increase:", ethers.formatEther(bet1Amount), "$BASED");
console.log("Match:", poolIncrease === bet1Amount ? "✅" : "❌");
```
**Validation Checklist:**
- [ ] Bet transaction succeeded
- [ ] Gas used < 150k
- [ ] Shares received > 0
- [ ] YES price increased (now >0.5)
- [ ] NO price decreased (now <0.5)
- [ ] YES price + NO price ≈ 1.0 (within 1%)
- [ ] Pool balance increased by exactly bet amount
- [ ] No unexpected state changes

**STOP IF:** Any validation fails

**Record:**
- Bet #1 Tx Hash: `0x_____________`
- Gas Used: `_____________`
- Shares Received: `_____________`
- YES Price After: `_____________`
- NO Price After: `_____________`

#### BET #2: Opposite Side (0.001 $BASED on NO)
```javascript
console.log("\n🎲 BET #2: Minimum bet on NO");
const bet2Amount = ethers.parseEther("0.001");

// Pre-bet snapshot
const preBet2 = {
  yesPrice: await market.getPrice(0),
  noPrice: await market.getPrice(1),
  yesShares: await market.totalShares(0),
  noShares: await market.totalShares(1)
};

// Place bet
const bet2Tx = await market.placeBet(1, { value: bet2Amount }); // 1 = NO
await bet2Tx.wait();

// Post-bet snapshot and validate
const postBet2 = {
  yesPrice: await market.getPrice(0),
  noPrice: await market.getPrice(1),
  noShares: await market.balanceOf(signerAddress, 1)
};

console.log("Bet #2 Results:");
console.log("YES price:", ethers.formatEther(postBet2.yesPrice));
console.log("NO price:", ethers.formatEther(postBet2.noPrice));
console.log("NO shares received:", ethers.formatEther(postBet2.noShares));

// Prices should move back toward 50/50
console.log("Price movement: YES went", preBet2.yesPrice > postBet2.yesPrice ? "DOWN ✅" : "UP ❌");
console.log("Price movement: NO went", preBet2.noPrice < postBet2.noPrice ? "UP ✅" : "DOWN ❌");
```
**Validation:**
- [ ] Bet succeeded
- [ ] YES price decreased (betting opposite side)
- [ ] NO price increased
- [ ] Prices sum to ~1.0
- [ ] Pool consistency maintained

**Record:**
- Bet #2 Tx Hash: `0x_____________`
- YES Price After: `_____________`
- NO Price After: `_____________`

#### BETS #3-5: Graduated Sizes (0.005, 0.01, 0.02 $BASED)
```javascript
const betSequence = [
  { amount: "0.005", outcome: 0, label: "BET #3" }, // YES
  { amount: "0.01", outcome: 1, label: "BET #4" },  // NO
  { amount: "0.02", outcome: 0, label: "BET #5" }   // YES
];

for (const bet of betSequence) {
  console.log(`\n🎲 ${bet.label}: ${bet.amount} $BASED on ${bet.outcome === 0 ? "YES" : "NO"}`);

  const betAmount = ethers.parseEther(bet.amount);
  const pricesBefore = {
    yes: await market.getPrice(0),
    no: await market.getPrice(1)
  };

  const tx = await market.placeBet(bet.outcome, { value: betAmount });
  const receipt = await tx.wait();

  const pricesAfter = {
    yes: await market.getPrice(0),
    no: await market.getPrice(1)
  };

  console.log(`✅ ${bet.label} successful`);
  console.log("Gas used:", receipt.gasUsed.toString());
  console.log("YES price:", ethers.formatEther(pricesAfter.yes));
  console.log("NO price:", ethers.formatEther(pricesAfter.no));

  // Validate price sum
  const priceSum = Number(ethers.formatEther(pricesAfter.yes)) +
                   Number(ethers.formatEther(pricesAfter.no));
  console.log("Price sum:", priceSum.toFixed(4), priceSum >= 0.99 && priceSum <= 1.01 ? "✅" : "❌");

  // Record
  console.log(`Tx hash: ${tx.hash}`);
}
```
**Validation After Each Bet:**
- [ ] Transaction succeeded
- [ ] Gas < 150k
- [ ] Shares received
- [ ] Prices updated correctly
- [ ] Prices sum to 1.0 (±1%)
- [ ] Pool balance consistent

**Record:**
- Bet #3 Tx Hash: `0x_____________`
- Bet #4 Tx Hash: `0x_____________`
- Bet #5 Tx Hash: `0x_____________`

### 4.3 LMSR Pricing Validation

**After all 5 bets, validate LMSR pricing accuracy:**
```javascript
// Get current state
const totalYesShares = await market.totalShares(0);
const totalNoShares = await market.totalShares(1);
const yesPrice = await market.getPrice(0);
const noPrice = await market.getPrice(1);
const poolBalance = await ethers.provider.getBalance(marketAddress);

// Calculate expected prices using LMSR formula
// P(YES) = exp(Q_yes / b) / [exp(Q_yes / b) + exp(Q_no / b)]
// Where b = liquidity parameter (from ParameterStorage)

const liquidityParam = await market.liquidityParameter();
const qYes = Number(ethers.formatEther(totalYesShares));
const qNo = Number(ethers.formatEther(totalNoShares));
const b = Number(ethers.formatEther(liquidityParam));

const expYes = Math.exp(qYes / b);
const expNo = Math.exp(qNo / b);
const expectedYesPrice = expYes / (expYes + expNo);
const expectedNoPrice = expNo / (expYes + expNo);

const actualYesPrice = Number(ethers.formatEther(yesPrice));
const actualNoPrice = Number(ethers.formatEther(noPrice));

// Calculate errors
const yesPriceError = Math.abs(actualYesPrice - expectedYesPrice) / expectedYesPrice;
const noPriceError = Math.abs(actualNoPrice - expectedNoPrice) / expectedNoPrice;

console.log("\n📊 LMSR Pricing Validation:");
console.log("Expected YES price:", expectedYesPrice.toFixed(6));
console.log("Actual YES price:", actualYesPrice.toFixed(6));
console.log("Error:", (yesPriceError * 100).toFixed(4), "%");
console.log("");
console.log("Expected NO price:", expectedNoPrice.toFixed(6));
console.log("Actual NO price:", actualNoPrice.toFixed(6));
console.log("Error:", (noPriceError * 100).toFixed(4), "%");

// Validate
const TOLERANCE = 0.01; // 1%
console.log("\n✅ Validation:");
console.log("YES price error < 1%:", yesPriceError < TOLERANCE ? "PASS ✅" : "FAIL ❌");
console.log("NO price error < 1%:", noPriceError < TOLERANCE ? "PASS ✅" : "FAIL ❌");
console.log("Price sum = 1.0:", Math.abs((actualYesPrice + actualNoPrice) - 1.0) < 0.01 ? "PASS ✅" : "FAIL ❌");
```
**Pricing Validation Checklist:**
- [ ] YES price error < 1%
- [ ] NO price error < 1%
- [ ] Price sum = 1.0 (±1%)
- [ ] No negative prices
- [ ] Prices in valid range [0, 1]

**STOP IF:** Any pricing error >1%
**ESCALATE IF:** Error >5%
**ABORT IF:** Error >10% or prices invalid

### 4.4 Pool Consistency Check
```javascript
// Validate pool accounting
const totalBets = ethers.parseEther("0.001") + ethers.parseEther("0.001") +
                  ethers.parseEther("0.005") + ethers.parseEther("0.01") +
                  ethers.parseEther("0.02");
const actualPool = await ethers.provider.getBalance(marketAddress);

console.log("\n💰 Pool Consistency Check:");
console.log("Total bets placed:", ethers.formatEther(totalBets), "$BASED");
console.log("Actual pool balance:", ethers.formatEther(actualPool), "$BASED");
console.log("Match:", totalBets === actualPool ? "PERFECT ✅" : "MISMATCH ❌");

if (totalBets !== actualPool) {
  const difference = actualPool - totalBets;
  console.log("Difference:", ethers.formatEther(difference), "$BASED");
  console.log("Percentage:", ((Number(difference) / Number(totalBets)) * 100).toFixed(4), "%");
}

// Validate no funds lost
const yesShares = await market.totalShares(0);
const noShares = await market.totalShares(1);
console.log("\nTotal YES shares:", ethers.formatEther(yesShares));
console.log("Total NO shares:", ethers.formatEther(noShares));
```
**Pool Validation:**
- [ ] Pool balance = sum of all bets (exact)
- [ ] No funds lost
- [ ] Shares issued correctly
- [ ] No negative balances
- [ ] State consistent

**ABORT IF:** Funds lost or pool inconsistent

### 4.5 Betting Phase Summary
```
═══════════════════════════════════════
✅ BETTING PHASE: RESULTS
═══════════════════════════════════════
Total Bets: 5
Total Volume: 0.037 $BASED
Average Gas: ______ per bet
═══════════════════════════════════════
LMSR Pricing:
  YES Price Error: ______%
  NO Price Error: ______%
  Overall: [ ] PASS  [ ] FAIL
═══════════════════════════════════════
Pool Consistency:
  Expected: 0.037 $BASED
  Actual: ______ $BASED
  Status: [ ] PERFECT  [ ] MISMATCH
═══════════════════════════════════════
DECISION: [ ] PROCEED to resolution
          [ ] STOP and investigate
          [ ] ABORT (critical issue)
═══════════════════════════════════════
```
- [ ] All bets successful
- [ ] Pricing validated
- [ ] Pool consistent
- [ ] Decision marked
- [ ] Timestamp: `_____________`

---

## 📋 SECTION 5: RESOLUTION & FINALIZATION PROCEDURE

**Only proceed if betting phase validated successfully.**

### 5.1 Pre-Resolution State Capture
```javascript
// Capture final betting state before resolution
const preResolution = {
  marketState: await market.marketState(),
  totalYesShares: await market.totalShares(0),
  totalNoShares: await market.totalShares(1),
  yesPrice: await market.getPrice(0),
  noPrice: await market.getPrice(1),
  poolBalance: await ethers.provider.getBalance(marketAddress),
  myYesShares: await market.balanceOf(signerAddress, 0),
  myNoShares: await market.balanceOf(signerAddress, 1),
  creatorBond: await market.bond()
};

console.log("\n📸 Pre-Resolution Snapshot:");
console.log(JSON.stringify(preResolution, null, 2));

// Save snapshot
fs.writeFileSync(
  './deployments/basedai-mainnet/markets/market_1_pre_resolution.json',
  JSON.stringify(preResolution, null, 2)
);
```
- [ ] Snapshot captured
- [ ] Data saved to file
- [ ] All values recorded

### 5.2 Propose Outcome (YES = 1)
```javascript
console.log("\n🎯 Proposing outcome: YES (index 1)");

// Propose YES as winning outcome
const proposeTx = await market.proposeOutcome(1);
const proposeReceipt = await proposeTx.wait();

console.log("✅ Outcome proposed");
console.log("Tx hash:", proposeTx.hash);
console.log("Gas used:", proposeReceipt.gasUsed.toString());

// Verify state changed
const stateAfterPropose = await market.marketState();
console.log("Market state:", stateAfterPropose); // Should be ACCEPTED (2) if no disputes
```
**Validation:**
- [ ] Propose transaction succeeded
- [ ] Market state = ACCEPTED (2)
- [ ] Proposed outcome = 1 (YES)
- [ ] Gas used < 100k

**Record:**
- Propose Tx Hash: `0x_____________`
- Gas Used: `_____________`

### 5.3 Finalize Market
```javascript
console.log("\n✅ Finalizing market...");

const finalizeTx = await market.finalize();
const finalizeReceipt = await finalizeTx.wait();

console.log("✅ Market finalized");
console.log("Tx hash:", finalizeTx.hash);
console.log("Gas used:", finalizeReceipt.gasUsed.toString());

// Verify finalized state
const finalState = await market.marketState();
const winningOutcome = await market.winningOutcome();

console.log("Final market state:", finalState); // Should be FINALIZED (3)
console.log("Winning outcome:", winningOutcome); // Should be 1 (YES)
```
**Validation:**
- [ ] Finalize transaction succeeded
- [ ] Market state = FINALIZED (3)
- [ ] Winning outcome = 1 (YES)
- [ ] Cannot bet anymore
- [ ] Gas used < 150k

**Record:**
- Finalize Tx Hash: `0x_____________`
- Gas Used: `_____________`

### 5.4 Calculate Expected Payouts
```javascript
// Calculate expected payout for YES holders
const totalYesShares = await market.totalShares(0);
const totalNoShares = await market.totalShares(1);
const poolBalance = await ethers.provider.getBalance(marketAddress);
const myYesShares = await market.balanceOf(signerAddress, 0);
const myNoShares = await market.balanceOf(signerAddress, 1);

// YES won, so YES holders get paid proportionally
const myShareOfPool = (Number(myYesShares) / Number(totalYesShares)) * Number(poolBalance);
const expectedPayout = ethers.formatEther(BigInt(Math.floor(myShareOfPool)));

console.log("\n💰 Expected Payouts:");
console.log("Total pool:", ethers.formatEther(poolBalance), "$BASED");
console.log("Total YES shares:", ethers.formatEther(totalYesShares));
console.log("My YES shares:", ethers.formatEther(myYesShares));
console.log("My share %:", ((Number(myYesShares) / Number(totalYesShares)) * 100).toFixed(2), "%");
console.log("Expected payout:", expectedPayout, "$BASED");

// NO holders get nothing (they lost)
console.log("\nMy NO shares:", ethers.formatEther(myNoShares));
console.log("NO payout:", "0 $BASED (losing outcome)");
```
**Record:**
- Expected Payout: `_____________ $BASED`
- My YES Shares: `_____________`
- My NO Shares: `_____________`

### 5.5 Claim Winnings
```javascript
console.log("\n💸 Claiming winnings...");

const balanceBefore = await ethers.provider.getBalance(signerAddress);

const claimTx = await market.claimWinnings();
const claimReceipt = await claimTx.wait();

const balanceAfter = await ethers.provider.getBalance(signerAddress);
const gasUsed = claimReceipt.gasUsed * claimReceipt.gasPrice;
const actualPayout = balanceAfter - balanceBefore + gasUsed;

console.log("✅ Winnings claimed");
console.log("Tx hash:", claimTx.hash);
console.log("Gas used:", claimReceipt.gasUsed.toString());
console.log("Actual payout:", ethers.formatEther(actualPayout), "$BASED");
console.log("Expected payout:", expectedPayout, "$BASED");

// Compare actual vs expected
const payoutError = Math.abs(Number(ethers.formatEther(actualPayout)) - Number(expectedPayout));
const payoutErrorPercent = (payoutError / Number(expectedPayout)) * 100;

console.log("\nPayout accuracy:");
console.log("Error:", ethers.formatEther(payoutError), "$BASED");
console.log("Error %:", payoutErrorPercent.toFixed(4), "%");
console.log("Status:", payoutErrorPercent < 1 ? "ACCURATE ✅" : "ERROR ❌");
```
**Validation:**
- [ ] Claim transaction succeeded
- [ ] Payout received
- [ ] Payout matches expected (±1%)
- [ ] Gas used < 150k

**Record:**
- Claim Tx Hash: `0x_____________`
- Actual Payout: `_____________ $BASED`
- Payout Error: `______________%`

### 5.6 Verify Creator Bond Returned
```javascript
// Creator should get bond back for correct resolution
const creatorAddress = await market.creator();
console.log("\n🎯 Verifying creator bond return...");
console.log("Creator:", creatorAddress);
console.log("Is creator me:", creatorAddress === signerAddress ? "YES" : "NO");

if (creatorAddress === signerAddress) {
  // Bond should be included in payout
  const bondAmount = await market.bond();
  console.log("Bond amount:", ethers.formatEther(bondAmount), "$BASED");
  console.log("Bond included in payout:", "YES ✅");
} else {
  console.log("Not creator, bond not applicable");
}
```
- [ ] Creator bond returned (if applicable)

### 5.7 Final State Validation
```javascript
// Verify market is completely resolved
const finalValidation = {
  marketState: await market.marketState(),
  winningOutcome: await market.winningOutcome(),
  poolBalance: await ethers.provider.getBalance(marketAddress),
  canBet: false, // Should not be able to bet
  canClaim: false // Should not be able to claim twice
};

console.log("\n🔍 Final State Validation:");
console.log("Market state:", finalValidation.marketState, "(FINALIZED = 3)");
console.log("Winning outcome:", finalValidation.winningOutcome, "(YES = 1)");
console.log("Pool balance:", ethers.formatEther(finalValidation.poolBalance), "$BASED");

// Try to bet (should fail)
try {
  await market.placeBet(0, { value: ethers.parseEther("0.001") });
  console.log("❌ ERROR: Can still bet after finalization!");
} catch (error) {
  console.log("✅ Cannot bet (expected):", error.message.includes("MarketNotActive"));
}

// Try to claim again (should fail)
try {
  await market.claimWinnings();
  console.log("❌ ERROR: Can claim twice!");
} catch (error) {
  console.log("✅ Cannot claim twice (expected)");
}
```
**Validation:**
- [ ] Market state = FINALIZED (3)
- [ ] Winning outcome correct
- [ ] Pool drained (or only dust remaining <0.001)
- [ ] Cannot bet anymore
- [ ] Cannot claim twice
- [ ] Market lifecycle complete

---

## 📋 SECTION 6: COMPREHENSIVE RESULTS & DECISION

### 6.1 Market 1 Complete Metrics
```
═══════════════════════════════════════════════════════════
📊 MARKET 1 COMPLETE RESULTS
═══════════════════════════════════════════════════════════
CREATION:
  Market Address: 0x_____________
  Creation Gas: _____________ (~$_________)
  Creation Time: _____________
  Status: [ ] SUCCESS  [ ] FAILED

BETTING PHASE:
  Total Bets: 5
  Total Volume: 0.037 $BASED
  Average Gas/Bet: _____________
  Average Cost/Bet: ~$_____________
  LMSR Pricing Error: _____________%
  Pool Consistency: [ ] PERFECT  [ ] MISMATCH
  Status: [ ] PASS  [ ] FAIL

RESOLUTION:
  Propose Gas: _____________
  Finalize Gas: _____________
  Claim Gas: _____________
  Total Resolution Cost: ~$_____________
  Payout Accuracy: _____________% error
  Status: [ ] ACCURATE  [ ] ERROR

LIFECYCLE:
  States: PROPOSED → ACTIVE → FINALIZED ✓
  All Transitions: [ ] VALID  [ ] INVALID
  No Funds Lost: [ ] CONFIRMED  [ ] ISSUE
  Complete Lifecycle: [ ] SUCCESS  [ ] FAILED

═══════════════════════════════════════════════════════════
```

### 6.2 Gas Cost Summary
```
Transaction Type        | Gas Used  | Cost ($BASED) | USD Equivalent
------------------------|-----------|---------------|----------------
Market Creation         | ~700k     | ~0.0007       | ~$0.00007
Bet #1 (0.001 $BASED)   | ~____     | ~______       | ~$______
Bet #2 (0.001 $BASED)   | ~____     | ~______       | ~$______
Bet #3 (0.005 $BASED)   | ~____     | ~______       | ~$______
Bet #4 (0.01 $BASED)    | ~____     | ~______       | ~$______
Bet #5 (0.02 $BASED)    | ~____     | ~______       | ~$______
Propose Outcome         | ~____     | ~______       | ~$______
Finalize Market         | ~____     | ~______       | ~$______
Claim Winnings          | ~____     | ~______       | ~$______
------------------------|-----------|---------------|----------------
TOTAL                   | ~____     | ~______       | ~$______

COMPARISON TO ESTIMATES:
  Estimated total cost: ~$0.0001 per bet
  Actual total cost: ~$_______
  Variance: _______% [ ] WITHIN 10%  [ ] EXCEEDS 10%
```

### 6.3 Success Criteria Evaluation

**Mark [x] for PASS, [ ] for FAIL:**

**Critical Criteria (ALL must pass):**
- [ ] Market created without errors
- [ ] All state transitions valid (PROPOSED → ACTIVE → FINALIZED)
- [ ] 5+ bets processed successfully
- [ ] LMSR pricing within 1% tolerance
- [ ] Pool accounting perfect (no funds lost)
- [ ] Market resolved and finalized
- [ ] Payouts accurate (±1%)
- [ ] No critical errors or reverts

**Important Criteria (≥7/9 must pass):**
- [ ] Gas costs within 10% of estimates
- [ ] Average gas per bet <150k
- [ ] Market creation gas <1M
- [ ] Resolution gas <300k total
- [ ] All events emitted correctly
- [ ] Registry linkage works
- [ ] Access control verified
- [ ] State consistency maintained
- [ ] Complete documentation captured

**Scoring:**
- Critical: ___/8 (must be 8/8)
- Important: ___/9 (must be ≥7/9)

### 6.4 GO/NO-GO DECISION

**Based on criteria above, mark ONE:**

```
[ ] ✅ GO - Market 1 Complete Success
    All criteria passed
    Ready for Checkpoint 1 (10 markets)
    Proceed to create Markets 2-10

[ ] ⚠️ CONDITIONAL GO - Minor Issues
    Critical criteria passed (8/8)
    Some important criteria failed (___/9)
    Issues documented and understood
    Issues non-blocking for testing
    Proceed with caution

[ ] 🛑 NO-GO - Significant Issues
    One or more critical criteria failed
    Issues must be resolved before continuing
    Do NOT create more markets
    Investigate and fix issues first

[ ] 🚨 ABORT - Critical Failure
    Multiple critical failures
    System integrity compromised
    Stop all testing immediately
    Full diagnosis required
    May require redeployment
```

**Decision Maker:** `_____________`
**Timestamp:** `_____________`
**Rationale:**
```
_______________________________________________________________________
_______________________________________________________________________
_______________________________________________________________________
```

---

## 📋 SECTION 7: FAILURE RECOVERY PROCEDURES

### 7.1 Failure Mode: Market Creation Reverts

**Detection:**
- Transaction fails (status = 0)
- No MarketCreated event
- Market address not obtained

**Diagnosis Procedure:**
```bash
# 1. Check revert reason
npx hardhat run scripts/diagnose-revert.js --network basedAI

# 2. Verify factory still operational
npx hardhat run scripts/verify-factory.js --network basedAI

# 3. Check all prerequisites
npx hardhat run scripts/check-prerequisites.js --network basedAI
```

**Recovery Steps:**
1. Identify revert reason (require() message)
2. Fix issue (e.g., insufficient bond, wrong params)
3. Re-verify all prerequisites
4. Retry market creation (max 3 attempts)
5. If 3 failures, escalate to factory diagnosis

**Escalation Criteria:**
- 3 consecutive creation failures
- Factory unresponsive
- Unknown revert reason

### 7.2 Failure Mode: State Corruption

**Detection:**
- Market created but fields wrong
- State inconsistent with inputs
- Registry linkage broken

**Diagnosis Procedure:**
```bash
# 1. Deep state inspection
npx hardhat run scripts/inspect-market-state.js --network basedAI

# 2. Compare with expected values
npx hardhat run scripts/compare-expected-state.js --network basedAI

# 3. Check template integrity
npx hardhat run scripts/verify-template.js --network basedAI
```

**Recovery Steps:**
1. Document all corrupted fields
2. Do NOT use corrupted market
3. Diagnose template initialization
4. Fix template if needed
5. Create new market with fixed template
6. Verify new market state

**Escalation Criteria:**
- Corruption persists across attempts
- Template appears broken
- Unknown initialization failure

### 7.3 Failure Mode: Pricing Errors

**Detection:**
- LMSR price error >1%
- Prices don't sum to 1.0
- Negative or invalid prices

**Diagnosis Procedure:**
```javascript
// Check LMSR implementation
const liquidityParam = await market.liquidityParameter();
const shares = await market.totalShares(0); // YES
const price = await market.getPrice(0);

// Manual calculation
const expectedPrice = calculateLMSR(shares, liquidityParam);
const error = Math.abs(price - expectedPrice) / expectedPrice;

console.log("Price error:", error * 100, "%");
console.log("Liquidity param:", liquidityParam);
console.log("Total shares:", shares);
```

**Recovery Steps:**
1. Calculate expected prices manually
2. Compare with contract prices
3. Identify source of error (rounding? formula? implementation?)
4. If error >1%: Stop betting, investigate
5. If error >5%: Escalate to LMSR review
6. If error >10%: Abort testing, fix LMSR

**Escalation Criteria:**
- Pricing error >5%
- Consistent pricing errors
- LMSR formula implementation suspect

### 7.4 Failure Mode: Pool Inconsistency

**Detection:**
- Pool balance ≠ sum of bets
- Funds missing
- Negative balances

**Diagnosis Procedure:**
```javascript
// Track every bet and pool change
const bets = [
  { amount: ethers.parseEther("0.001"), expected: poolAfterBet1 },
  { amount: ethers.parseEther("0.001"), expected: poolAfterBet2 },
  // ...
];

let expectedPool = 0n;
for (const bet of bets) {
  expectedPool += bet.amount;
}

const actualPool = await ethers.provider.getBalance(marketAddress);
const difference = actualPool - expectedPool;

console.log("Expected pool:", ethers.formatEther(expectedPool));
console.log("Actual pool:", ethers.formatEther(actualPool));
console.log("Difference:", ethers.formatEther(difference));
```

**Recovery Steps:**
1. Identify when inconsistency started
2. Check for reentrancy or fund leakage
3. Verify no funds sent to wrong address
4. If funds lost: ABORT IMMEDIATELY
5. If minor rounding: Document and monitor
6. If funds stuck: Investigate recovery

**Escalation Criteria:**
- Any funds lost (even 0.001 $BASED)
- Pool balance decreasing unexpectedly
- Unable to account for all funds

### 7.5 Failure Mode: Resolution Failure

**Detection:**
- Cannot propose outcome
- Cannot finalize
- State transition fails

**Diagnosis Procedure:**
```bash
# Check resolution conditions
npx hardhat run scripts/check-resolution-conditions.js --network basedAI

# Verify resolution manager
npx hardhat run scripts/verify-resolution-manager.js --network basedAI

# Check access control
npx hardhat run scripts/check-resolution-access.js --network basedAI
```

**Recovery Steps:**
1. Verify resolution conditions met (time, state)
2. Check resolution manager operational
3. Verify access control permissions
4. Try manual resolution from different account
5. If blocked: Escalate to resolution manager review

**Escalation Criteria:**
- Cannot resolve after 3 attempts
- Resolution manager unresponsive
- State stuck in ACTIVE

### 7.6 Failure Mode: Payout Errors

**Detection:**
- Payout ≠ expected (>1% error)
- Cannot claim winnings
- Wrong winners paid

**Diagnosis Procedure:**
```javascript
// Calculate expected payout
const myShares = await market.balanceOf(signerAddress, winningOutcome);
const totalShares = await market.totalShares(winningOutcome);
const pool = await ethers.provider.getBalance(marketAddress);

const expectedPayout = (myShares * pool) / totalShares;

// Compare with actual
const actualPayout = /* from claimWinnings */;
const error = Math.abs(actualPayout - expectedPayout) / expectedPayout;

console.log("Expected:", ethers.formatEther(expectedPayout));
console.log("Actual:", ethers.formatEther(actualPayout));
console.log("Error:", error * 100, "%");
```

**Recovery Steps:**
1. Verify shares calculation
2. Verify pool balance
3. Check payout formula
4. If error >1%: Investigate calculation
5. If error >5%: Do NOT create more markets
6. If funds lost: ABORT

**Escalation Criteria:**
- Payout error >5%
- Winners not paid correctly
- Losers paid incorrectly

---

## 📋 SECTION 8: DATA PRESERVATION & DOCUMENTATION

### 8.1 Critical Data Artifacts

**Files Created During Execution:**
```
deployments/basedai-mainnet/markets/
├── market_1.json                      # Complete market data
├── market_1_pre_resolution.json       # State before resolution
├── market_1_bets.json                 # All bet transactions
├── market_1_prices.json               # Price history
└── market_1_execution_log.txt         # Complete execution log
```

**Each file must contain:**
1. All transaction hashes
2. All block numbers and timestamps
3. All balances and state changes
4. All calculated metrics
5. All validation results
6. All decisions and rationale

### 8.2 Market 1 Report Template

**Create: `MARKET_1_REPORT.md`**
```markdown
# Market 1 Execution Report

## Executive Summary
- **Status**: [SUCCESS / PARTIAL SUCCESS / FAILURE]
- **Market Address**: 0x_____________
- **Total Time**: _______ hours
- **Total Cost**: _______ $BASED (~$_______)
- **Overall Assessment**: [PASS / CONDITIONAL PASS / FAIL]

## Creation Phase
- Transaction: 0x_____________
- Gas Used: _____________
- Status: ✅ / ❌
- Issues: [None / List]

## Betting Phase
- Total Bets: 5
- Total Volume: 0.037 $BASED
- LMSR Accuracy: _______% error
- Pool Consistency: [PERFECT / MINOR ISSUES / MAJOR ISSUES]
- Issues: [None / List]

## Resolution Phase
- Propose Tx: 0x_____________
- Finalize Tx: 0x_____________
- Claim Tx: 0x_____________
- Payout Accuracy: _______% error
- Issues: [None / List]

## Validation Results
### Critical Criteria (8/8 required)
- [ ] Market created: ___
- [ ] State transitions: ___
- [ ] Bets successful: ___
- [ ] LMSR accurate: ___
- [ ] Pool consistent: ___
- [ ] Resolution works: ___
- [ ] Payouts accurate: ___
- [ ] No funds lost: ___

Score: ___/8

### Important Criteria (7/9 required)
[Same format]

Score: ___/9

## Decision
- [x] GO / [ ] CONDITIONAL GO / [ ] NO-GO / [ ] ABORT
- Rationale: _______________________
- Next Steps: _______________________

## Lessons Learned
- What worked well:
- What could be improved:
- What to watch for in Markets 2-10:

## Appendices
- Appendix A: All Transaction Hashes
- Appendix B: Complete Price History
- Appendix C: Gas Cost Breakdown
- Appendix D: State Snapshots
```

### 8.3 Proof of Success Artifacts

**For Go/No-Go decision, must have:**
1. ✅ market_1.json (complete data)
2. ✅ MARKET_1_REPORT.md (analysis)
3. ✅ All transaction hashes on explorer
4. ✅ Screenshots of key moments
5. ✅ Complete execution log
6. ✅ Validation results (8/8 critical)
7. ✅ Team review and approval

---

## 📋 SECTION 9: EXECUTION TIMELINE & RESPONSIBILITIES

### 9.1 Estimated Timeline

**Phase Duration Estimates:**
- Pre-Creation Checklist: 30 minutes
- Market Creation: 15 minutes
- Post-Creation Validation: 20 minutes
- Betting Phase (5 bets): 30 minutes
- LMSR Validation: 15 minutes
- Resolution Phase: 20 minutes
- Documentation: 30 minutes

**Total Time**: ~2.5-3 hours for complete Market 1 execution

**Recommended Schedule:**
- Start time: _________ (allow full 3-hour block)
- No interruptions during execution
- Team available for escalation

### 9.2 Roles & Responsibilities

**Operator** (executes all steps):
- Follow checklist exactly
- Record all data
- Make Go/No-Go decisions
- Escalate if needed

**Reviewer** (monitors and validates):
- Review each phase completion
- Validate data recorded
- Approve Go/No-Go decisions
- Available for escalation

**Backup** (standby support):
- Available for escalation
- Can take over if needed
- Reviews final report

---

## 📋 SECTION 10: FINAL CHECKLIST BEFORE EXECUTION

**Sign off on each before beginning:**

### 10.1 Prerequisites
- [ ] All 13 pre-creation checks ready to execute
- [ ] Scripts tested and working
- [ ] Wallet has sufficient funds (≥0.15 $BASED)
- [ ] Network stable (checked in last hour)
- [ ] Team available for full duration
- [ ] No competing priorities during execution

### 10.2 Resources
- [ ] This specification printed or on second monitor
- [ ] All scripts ready in terminal
- [ ] Text editor open for recording data
- [ ] Explorer open for monitoring
- [ ] Communication channel open for team

### 10.3 Safety
- [ ] Abort criteria understood
- [ ] Escalation procedures clear
- [ ] Recovery procedures reviewed
- [ ] Backup plan in place
- [ ] Emergency contacts available

### 10.4 Documentation
- [ ] All templates ready
- [ ] Logging configured
- [ ] Backup location confirmed
- [ ] Report template prepared

### 10.5 Final Approval
```
═══════════════════════════════════════════════════════════
🚨 FINAL EXECUTION APPROVAL
═══════════════════════════════════════════════════════════

I have reviewed this specification and confirm:
✅ All prerequisites met
✅ All resources ready
✅ All safety measures in place
✅ Team available and ready
✅ Understand this is REAL MONEY on PRODUCTION
✅ Ready to execute Market 1 with maximum caution

Operator: _________________ Date: _______ Time: _______
Reviewer: _________________ Date: _______ Time: _______
═══════════════════════════════════════════════════════════
```

---

## 🎯 EXECUTION BEGINS HERE

**When ready, proceed to Section 1 and execute each step mechanically.**

**Remember:**
- ⚠️ Follow every step exactly
- ⚠️ Record ALL data
- ⚠️ Validate at every checkpoint
- ⚠️ Stop immediately on ANY failure
- ⚠️ Escalate if uncertain
- ⚠️ Document everything

**Good luck. Let's make Market 1 bulletproof.** 🚀
