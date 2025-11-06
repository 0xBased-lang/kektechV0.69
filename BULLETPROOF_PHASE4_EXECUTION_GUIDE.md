# 🛡️ BULLETPROOF PHASE 4 EXECUTION GUIDE
**ULTRA-CONSERVATIVE 72-HOUR VALIDATION PROTOCOL**

**Document Version**: 1.0
**Created**: November 6, 2025
**Status**: ✅ READY FOR EXECUTION
**Approach**: Maximum caution, zero tolerance for ambiguity, fail-fast philosophy

---

## 🎯 EXECUTIVE SUMMARY

**Objective**: Validate deployed BasedAI mainnet contracts through 72+ hours of systematic testing before public launch.

**Current State**:
- ✅ All 9 contracts deployed to BasedAI mainnet
- ✅ All 8 contracts registered in VersionedRegistry
- ✅ 6,123.88 $BASED available in deployment wallet
- ✅ System ready for validation testing

**Risk Level**: HIGH (real money, first public deployment, reputation at stake)

**Success Definition**: 72+ hours of stable operation with ZERO critical issues and 100% confidence for public launch.

**Failure Definition**: ANY critical issue, unexpected behavior, or confidence level <95% results in NO-GO decision.

---

## 📋 TABLE OF CONTENTS

1. [Pre-Execution Validation Gate](#1-pre-execution-validation-gate) (15 verification steps)
2. [Market Specifications](#2-market-specifications) (6 progressive test markets)
3. [Checkpoint Decision Matrix](#3-checkpoint-decision-matrix) (objective criteria)
4. [Monitoring Configuration](#4-monitoring-configuration) (exact metrics & thresholds)
5. [Failure Recovery Procedures](#5-failure-recovery-procedures) (13 failure scenarios)
6. [Decision Documentation](#6-decision-documentation) (templates & proof)
7. [Execution Timeline](#7-execution-timeline) (hour-by-hour plan)
8. [Emergency Protocols](#8-emergency-protocols) (stop conditions & escalation)

---

## 1. PRE-EXECUTION VALIDATION GATE

**⚠️ CRITICAL: ALL 15 steps MUST pass before creating ANY test market**

**Abort Condition**: If ANY step fails, STOP immediately and escalate to team.

### Step-by-Step Pre-Flight Checklist

#### 1.1 Contract Deployment Verification (4 steps)

**Step 1.1.1: Verify all 9 contracts deployed**
```bash
# Run verification script
npx hardhat run scripts/verify-deployment.js --network basedai_mainnet

# Expected output: 9 contract addresses confirmed
# Abort if: Any address is 0x0000... or undefined
```
**Pass Criteria**: All 9 unique addresses returned
**Fail Action**: Re-deploy missing contracts
**Responsible**: Technical lead
**Estimated Time**: 2 minutes

---

**Step 1.1.2: Verify all 8 contracts registered in VersionedRegistry**
```bash
# Check registry for each contract
npx hardhat run scripts/verify-registry.js --network basedai_mainnet

# Expected output: 8 contracts at version 1
# Abort if: Any contract not found or version != 1
```
**Pass Criteria**: All 8 contracts at version 1
**Fail Action**: Re-run registry configuration
**Responsible**: Technical lead
**Estimated Time**: 2 minutes

---

**Step 1.1.3: Verify contract sizes <24KB**
```bash
# Check bytecode sizes
npx hardhat size-contracts

# Expected: All contracts <24KB (largest: ~18KB)
# Abort if: Any contract ≥24KB
```
**Pass Criteria**: All contracts <24KB
**Fail Action**: CRITICAL - Cannot deploy oversized contracts
**Responsible**: Technical lead
**Estimated Time**: 1 minute

---

**Step 1.1.4: Verify contract verification on BasedAI explorer**
```bash
# Check each contract on block explorer
# Manually verify source code matches deployed bytecode

# Expected: All 9 contracts verified
# Abort if: Any contract not verified or bytecode mismatch
```
**Pass Criteria**: All 9 contracts verified on explorer
**Fail Action**: Submit verification to explorer
**Responsible**: Technical lead
**Estimated Time**: 10 minutes

---

#### 1.2 System Configuration Verification (5 steps)

**Step 1.2.1: Verify AccessControlManager roles configured**
```bash
# Check ADMIN_ROLE, RESOLVER_ROLE, etc.
npx hardhat run scripts/verify-access-control.js --network basedai_mainnet

# Expected: Deployer has ADMIN_ROLE, all roles exist
# Abort if: Roles not configured or incorrect addresses
```
**Pass Criteria**: All roles configured correctly
**Fail Action**: Grant missing roles
**Responsible**: Technical lead
**Estimated Time**: 3 minutes

---

**Step 1.2.2: Verify ParameterStorage default values**
```bash
# Check dispute window, min bond, fees, etc.
npx hardhat run scripts/verify-parameters.js --network basedai_mainnet

# Expected: All parameters match specification
# Abort if: Any parameter incorrect or missing
```
**Pass Criteria**: All parameters as specified
**Fail Action**: Update ParameterStorage values
**Responsible**: Technical lead
**Estimated Time**: 3 minutes

---

**Step 1.2.3: Verify Factory can read from VersionedRegistry**
```bash
# Test factory.getLatestContract("PredictionMarket")
npx hardhat run scripts/test-factory-registry.js --network basedai_mainnet

# Expected: Factory returns correct PredictionMarket address
# Abort if: Factory cannot read or returns wrong address
```
**Pass Criteria**: Factory successfully reads registry
**Fail Action**: Check factory-registry integration
**Responsible**: Technical lead
**Estimated Time**: 2 minutes

---

**Step 1.2.4: Verify ResolutionManager dispute parameters**
```bash
# Check dispute window, thresholds, etc.
npx hardhat run scripts/verify-resolution-params.js --network basedai_mainnet

# Expected: 48h dispute window, 75% finalization, 40% dispute
# Abort if: Parameters incorrect
```
**Pass Criteria**: Dispute parameters as specified
**Fail Action**: Update ResolutionManager configuration
**Responsible**: Technical lead
**Estimated Time**: 2 minutes

---

**Step 1.2.5: Verify RewardDistributor fee configuration**
```bash
# Check platform fee, creator fee, resolver fee
npx hardhat run scripts/verify-fees.js --network basedai_mainnet

# Expected: Total fees ≤10%, distribution as specified
# Abort if: Fees incorrect or exceed 10%
```
**Pass Criteria**: Fees configured correctly
**Fail Action**: Update RewardDistributor configuration
**Responsible**: Technical lead
**Estimated Time**: 2 minutes

---

#### 1.3 Wallet & Network Verification (3 steps)

**Step 1.3.1: Verify wallet balance sufficient**
```bash
# Check deployer wallet balance
npx hardhat run scripts/check-basedai-balance.js --network basedai_mainnet

# Expected: ≥500 $BASED available (for 72h testing)
# Abort if: Balance <500 $BASED
```
**Pass Criteria**: Wallet balance ≥500 $BASED
**Fail Action**: Fund wallet with more $BASED
**Responsible**: Financial approver
**Estimated Time**: 1 minute

---

**Step 1.3.2: Verify network connectivity stable**
```bash
# Test RPC connection 10 times
npx hardhat run scripts/test-network-stability.js --network basedai_mainnet

# Expected: 10/10 successful connections, <2s latency
# Abort if: Any connection fails or latency >5s
```
**Pass Criteria**: 100% successful connections
**Fail Action**: Check RPC endpoint health
**Responsible**: Technical lead
**Estimated Time**: 2 minutes

---

**Step 1.3.3: Verify gas price estimates stable**
```bash
# Check current gas price on BasedAI
npx hardhat run scripts/check-gas-price.js --network basedai_mainnet

# Expected: Gas price <10 gwei (or network standard)
# Abort if: Gas price spike or network congestion
```
**Pass Criteria**: Gas price within normal range
**Fail Action**: Wait for gas to normalize
**Responsible**: Technical lead
**Estimated Time**: 1 minute

---

#### 1.4 Monitoring & Documentation Verification (3 steps)

**Step 1.4.1: Verify monitoring scripts operational**
```bash
# Test health check script
npx hardhat run scripts/monitor-health.js --network basedai_mainnet

# Expected: Script runs successfully, returns system status
# Abort if: Script fails or errors out
```
**Pass Criteria**: Monitoring script runs successfully
**Fail Action**: Fix monitoring scripts
**Responsible**: Technical lead
**Estimated Time**: 2 minutes

---

**Step 1.4.2: Verify backup/logging systems ready**
```bash
# Ensure logs directory exists and writable
mkdir -p logs/phase4-validation
touch logs/phase4-validation/test.log

# Expected: Directory created, file writable
# Abort if: Cannot create logs
```
**Pass Criteria**: Logging system ready
**Fail Action**: Fix file permissions
**Responsible**: Technical lead
**Estimated Time**: 1 minute

---

**Step 1.4.3: Verify team communication ready**
```
# Manual check:
□ Team members available for 72h monitoring
□ Communication channels active (Discord/Slack)
□ Escalation contacts available
□ Decision-making authority clear

# Abort if: Any team member unavailable or unclear responsibilities
```
**Pass Criteria**: All team members ready
**Fail Action**: Delay until team available
**Responsible**: Project manager
**Estimated Time**: 5 minutes

---

### 1.5 Pre-Execution Gate Summary

**Total Time**: ~45 minutes
**All Steps Pass**: ✅ Proceed to Market 1 creation
**Any Step Fails**: ❌ STOP, fix issue, re-run ALL 15 steps

**Decision Point**: Document validation results in `logs/phase4-validation/pre-execution-validation.json`

```json
{
  "timestamp": "ISO-8601",
  "validationPassed": true/false,
  "results": {
    "contractDeployment": "PASS/FAIL",
    "systemConfiguration": "PASS/FAIL",
    "walletNetwork": "PASS/FAIL",
    "monitoringDocs": "PASS/FAIL"
  },
  "decision": "PROCEED/ABORT",
  "approvedBy": "Name",
  "notes": "Any observations"
}
```

---

## 2. MARKET SPECIFICATIONS

**Progressive Testing Strategy**: Each market tests increasingly complex scenarios.

**Overall Success Criteria**: 6/6 markets complete successfully with ZERO critical issues.

---

### Market 1: BASELINE VALIDATION
**Purpose**: Test basic market creation and lifecycle (simplest possible case)

**Timing**: Hour 0-4 (4 hours total)

**Market Configuration**:
```javascript
{
  question: "Will this test market resolve to YES?",
  outcomes: ["YES", "NO"],
  bond: 0.01, // $BASED (minimum bond)
  resolutionTime: currentTime + 4 hours,
  category: "Test",
  description: "Baseline validation market - will be resolved to YES",
  virtualLiquidity: 10 // $BASED
}
```

**Why This Configuration**:
- Self-referential question (predictable outcome)
- Minimum bond (low risk)
- Short duration (fast validation)
- Simple binary outcome (no complexity)
- Standard virtual liquidity (10 $BASED)

---

#### Market 1 Testing Procedure

**Step 1.1: Create Market** (Minutes 0-5)
```bash
npx hardhat run scripts/markets/create-market-1-baseline.js --network basedai_mainnet
```

**Expected Result**:
- Transaction confirms in <30 seconds
- Market created in PROPOSED state
- Event: MarketCreated emitted
- Market ID returned
- 0.01 $BASED bond locked

**Success Criteria**:
- ✅ Transaction successful
- ✅ Gas cost <1M gas (~$0.0001)
- ✅ Market state = PROPOSED
- ✅ Bond locked correctly
- ✅ All events emitted

**Failure Conditions**:
- ❌ Transaction reverts
- ❌ Gas cost >2M gas
- ❌ Incorrect state
- ❌ Bond not locked
- ❌ Missing events

**Abort Trigger**: If ANY failure condition met, STOP immediately, document issue, escalate.

---

**Step 1.2: Approve Market** (Minutes 5-10)
```bash
npx hardhat run scripts/markets/approve-market.js --network basedai_mainnet --marketId [ID]
```

**Expected Result**:
- Transaction confirms in <30 seconds
- Market transitions to APPROVED state
- Bond returned to creator
- Event: MarketApproved emitted

**Success Criteria**:
- ✅ PROPOSED → APPROVED transition
- ✅ Bond returned
- ✅ Events emitted correctly
- ✅ Gas cost <200k gas

**Failure Conditions**:
- ❌ Transition fails
- ❌ Bond not returned
- ❌ Missing events

**Abort Trigger**: STOP if any failure.

---

**Step 1.3: Activate Market** (Minutes 10-15)
```bash
npx hardhat run scripts/markets/activate-market.js --network basedai_mainnet --marketId [ID]
```

**Expected Result**:
- Market transitions to ACTIVE state
- Betting enabled
- Event: MarketActivated emitted

**Success Criteria**:
- ✅ APPROVED → ACTIVE transition
- ✅ Betting enabled
- ✅ Virtual liquidity applied
- ✅ Events emitted

**Failure Conditions**:
- ❌ Transition fails
- ❌ Betting not enabled

**Abort Trigger**: STOP if any failure.

---

**Step 1.4: Place Test Bets** (Minutes 15-45)

**Bet 1: Minimum YES bet**
```bash
npx hardhat run scripts/bets/place-bet.js --network basedai_mainnet \
  --marketId [ID] --outcome YES --amount 0.001
```
**Expected**: Bet placed, price updates, shares minted
**Validate**: Gas <150k, price change ≤20%, shares correct

---

**Bet 2: Minimum NO bet**
```bash
npx hardhat run scripts/bets/place-bet.js --network basedai_mainnet \
  --marketId [ID] --outcome NO --amount 0.001
```
**Expected**: Bet placed, price rebalances
**Validate**: LMSR pricing accurate (±5%), market balanced

---

**Bet 3: Medium YES bet**
```bash
npx hardhat run scripts/bets/place-bet.js --network basedai_mainnet \
  --marketId [ID] --outcome YES --amount 0.01
```
**Expected**: Price moves toward YES
**Validate**: Price discovery working, liquidity adequate

---

**Bet 4: Medium NO bet**
```bash
npx hardhat run scripts/bets/place-bet.js --network basedai_mainnet \
  --marketId [ID] --outcome NO --amount 0.01
```
**Expected**: Price rebalances
**Validate**: Virtual liquidity prevents extreme prices

---

**Bet 5: Edge case (tiny amount)**
```bash
npx hardhat run scripts/bets/place-bet.js --network basedai_mainnet \
  --marketId [ID] --outcome YES --amount 0.0001
```
**Expected**: Bet accepted despite tiny amount
**Validate**: No precision errors, rounding correct

---

**Step 1.5: Wait for Resolution Time** (Minutes 45-240)

**Monitoring During Wait**:
```bash
# Every 30 minutes (5 times):
npx hardhat run scripts/monitor-market.js --network basedai_mainnet --marketId [ID]
```

**What to Check**:
- Market still in ACTIVE state
- No unexpected state changes
- Balances correct
- No errors in events

**Validation Logs**: Record all observations in `logs/phase4-validation/market1-monitoring.json`

---

**Step 1.6: Propose Outcome** (Minutes 240-245)
```bash
npx hardhat run scripts/resolution/propose-outcome.js --network basedai_mainnet \
  --marketId [ID] --outcome YES
```

**Expected Result**:
- ACTIVE → RESOLVING transition
- Dispute window opens (48h default, can use shorter for testing)
- Event: ResolutionProposed emitted

**Success Criteria**:
- ✅ State transition correct
- ✅ Dispute window active
- ✅ Events emitted

**Failure Conditions**:
- ❌ Transition fails
- ❌ Dispute window not opened

---

**Step 1.7: Finalize Market** (Minutes 245-250, after dispute window)

**Note**: For testing, we can use admin override to skip dispute window, OR wait 48h for real-world test.

**Option A: Admin Override (Fast)**
```bash
npx hardhat run scripts/resolution/admin-finalize.js --network basedai_mainnet \
  --marketId [ID] --outcome YES
```

**Option B: Wait 48h** (Real-world test)
```bash
# After 48h dispute window:
npx hardhat run scripts/resolution/finalize-market.js --network basedai_mainnet \
  --marketId [ID]
```

**Expected Result**:
- RESOLVING → FINALIZED transition
- Market locked
- Payouts calculated
- Fees distributed
- Event: MarketFinalized emitted

**Success Criteria**:
- ✅ State transition correct
- ✅ Payouts calculated accurately
- ✅ Fees split correctly (platform + creator + resolver)
- ✅ Events emitted

---

**Step 1.8: Claim Winnings** (Minutes 250-255)
```bash
# For each bettor:
npx hardhat run scripts/claim/claim-winnings.js --network basedai_mainnet \
  --marketId [ID] --address [bettor]
```

**Expected Result**:
- Winnings calculated correctly
- Transfers successful
- Shares burned
- Events emitted

**Success Criteria**:
- ✅ All winners can claim
- ✅ Amounts correct (bet + profit - fees)
- ✅ No double-claiming possible

---

#### Market 1 Success Criteria Summary

**All Must Pass**:
- [ ] Market created successfully (PROPOSED)
- [ ] Approval working (PROPOSED → APPROVED)
- [ ] Activation working (APPROVED → ACTIVE)
- [ ] 5 bets placed without errors
- [ ] LMSR pricing accurate (±5% of expected)
- [ ] Gas costs <2x estimates
- [ ] State transitions correct
- [ ] Resolution working (ACTIVE → RESOLVING → FINALIZED)
- [ ] Payouts correct
- [ ] Zero unexpected behaviors
- [ ] Zero errors in logs

**Checkpoint Decision**: After Market 1, decide GO/NO-GO for Market 2.

**GO Criteria**: All success criteria met + confidence ≥8/10
**NO-GO Criteria**: Any critical failure or confidence <8/10

---

### Market 2: LMSR STRESS TEST
**Purpose**: Test LMSR pricing under rapid betting and price discovery

**Timing**: Hour 4-8 (4 hours)

**Market Configuration**:
```javascript
{
  question: "Will the next Bitcoin block be even-numbered?",
  outcomes: ["EVEN", "ODD"],
  bond: 0.5, // $BASED (higher bond)
  resolutionTime: currentTime + 1 hour,
  category: "Crypto",
  description: "LMSR stress test - rapid betting scenario",
  virtualLiquidity: 50 // $BASED (higher liquidity for stress test)
}
```

**Why This Configuration**:
- Near-term resolution (verifiable quickly)
- Binary outcome (50/50 probability)
- Higher bond (test bond economics)
- Higher virtual liquidity (test LMSR at scale)
- Rapid betting scenario (stress test pricing)

---

#### Market 2 Testing Procedure

**Step 2.1: Create, Approve, Activate** (Minutes 0-10)
```bash
# Same as Market 1, but with Market 2 config
npx hardhat run scripts/markets/create-market-2-lmsr-stress.js --network basedai_mainnet
```

**Expected**: Same as Market 1, but higher bond (0.5 $BASED)

---

**Step 2.2: Rapid Betting Sequence** (Minutes 10-60)

**Objective**: Place 20 bets rapidly to stress-test LMSR pricing

**Betting Pattern**:
```javascript
// 10 bets on EVEN (increasing sizes)
Bet 1: 0.001 EVEN
Bet 2: 0.005 EVEN
Bet 3: 0.01 EVEN
Bet 4: 0.05 EVEN
Bet 5: 0.1 EVEN
Bet 6: 0.2 EVEN
Bet 7: 0.5 EVEN
Bet 8: 1.0 EVEN
Bet 9: 2.0 EVEN
Bet 10: 5.0 EVEN

// 10 bets on ODD (rebalancing)
Bet 11: 0.001 ODD
Bet 12: 0.005 ODD
Bet 13: 0.01 ODD
Bet 14: 0.05 ODD
Bet 15: 0.1 ODD
Bet 16: 0.2 ODD
Bet 17: 0.5 ODD
Bet 18: 1.0 ODD
Bet 19: 2.0 ODD
Bet 20: 5.0 ODD
```

**Execute**:
```bash
npx hardhat run scripts/bets/rapid-betting-sequence.js --network basedai_mainnet --marketId [ID]
```

---

**Validation During Rapid Betting**:

**Price Movement Checks** (After each bet):
```javascript
// Check that prices move as expected by LMSR
// EVEN bets should increase EVEN price, decrease ODD price
// ODD bets should increase ODD price, decrease EVEN price

// Expected price range after all bets: 45%-55% (balanced)
```

**Gas Cost Checks**:
```javascript
// Each bet should cost <200k gas
// No gas spikes or anomalies
```

**State Consistency Checks**:
```javascript
// Pool balances = sum of all bets
// Share supplies = calculated from LMSR
// No precision errors or rounding issues
```

**Success Criteria**:
- ✅ All 20 bets placed successfully
- ✅ Price discovery smooth (no extreme jumps)
- ✅ Final prices balanced (45%-55%)
- ✅ Gas costs consistent (<200k per bet)
- ✅ No precision errors
- ✅ Pool accounting correct
- ✅ Virtual liquidity working as designed

**Failure Conditions**:
- ❌ Any bet reverts
- ❌ Price goes to 0% or 100%
- ❌ Gas cost spikes >2x
- ❌ Precision errors detected
- ❌ Pool balance mismatch

---

**Step 2.3: Wait for Bitcoin Block** (Minutes 60-70)

**Monitor**: Wait for next Bitcoin block, verify block number

---

**Step 2.4: Resolve and Finalize** (Minutes 70-80)

**Determine Outcome**:
```bash
# Check latest Bitcoin block on blockchain explorer
# If block number is even: outcome = EVEN
# If block number is odd: outcome = ODD
```

**Propose and Finalize**:
```bash
npx hardhat run scripts/resolution/propose-outcome.js --network basedai_mainnet \
  --marketId [ID] --outcome [EVEN/ODD]

# Admin finalize (skip dispute window for test)
npx hardhat run scripts/resolution/admin-finalize.js --network basedai_mainnet \
  --marketId [ID] --outcome [EVEN/ODD]
```

---

**Step 2.5: Validate Payouts** (Minutes 80-90)

**Calculate Expected Payouts**:
```javascript
// Winners: All bets on correct outcome
// Calculate expected payout per share using LMSR
// Validate actual payouts match expected (±0.1%)
```

**Claim All Winnings**:
```bash
npx hardhat run scripts/claim/claim-all-winnings.js --network basedai_mainnet --marketId [ID]
```

**Validation**:
- ✅ All winners can claim
- ✅ Payout amounts accurate (±0.1%)
- ✅ No losers can claim
- ✅ Platform fees collected correctly

---

#### Market 2 Success Criteria Summary

**All Must Pass**:
- [ ] 20 rapid bets placed successfully
- [ ] LMSR pricing accurate throughout
- [ ] Price discovery smooth (no jumps >10%)
- [ ] Final prices balanced (45%-55%)
- [ ] Gas costs consistent
- [ ] Resolution correct (matches Bitcoin block)
- [ ] Payouts accurate (±0.1%)
- [ ] Zero errors or anomalies

**Checkpoint Decision**: After Market 2, decide GO/NO-GO for Market 3.

---

### Market 3: EDGE CASE TESTING
**Purpose**: Test edge cases (tiny bets, first bettor bonus, precision)

**Timing**: Hour 8-20 (12 hours)

**Market Configuration**:
```javascript
{
  question: "Will Ethereum price be >$3000 in 12 hours?",
  outcomes: ["YES", "NO"],
  bond: 0.01, // $BASED (minimum)
  resolutionTime: currentTime + 12 hours,
  category: "Crypto",
  description: "Edge case testing - tiny bets and precision",
  virtualLiquidity: 10 // $BASED
}
```

---

#### Market 3 Testing Procedure

**Step 3.1: Create, Approve, Activate** (Minutes 0-10)
```bash
npx hardhat run scripts/markets/create-market-3-edge-cases.js --network basedai_mainnet
```

---

**Step 3.2: Edge Case Bet Sequence** (Minutes 10-60)

**Test Case 1: Dust Amounts**
```bash
# Bet 1: 0.0000001 $BASED (dust amount)
npx hardhat run scripts/bets/place-bet.js --marketId [ID] --outcome YES --amount 0.0000001

# Expected: Either accepts with correct rounding OR rejects with clear error
# Validate: No silent precision loss
```

---

**Test Case 2: First Bettor Experience**
```bash
# Bet 2: 0.01 $BASED (first real bet)
npx hardhat run scripts/bets/place-bet.js --marketId [ID] --outcome YES --amount 0.01

# Expected: First bettor gets shares at fair price (not advantaged by virtual liquidity)
# Validate: Price = ~50% before bet, moves to ~51-52% after
```

---

**Test Case 3: Immediate Counter-Bet**
```bash
# Bet 3: 0.01 $BASED on NO (immediately after)
npx hardhat run scripts/bets/place-bet.js --marketId [ID] --outcome NO --amount 0.01

# Expected: Price rebalances to ~50%
# Validate: Virtual liquidity prevents extreme price swings
```

---

**Test Case 4: Large Bet on Low Liquidity**
```bash
# Bet 4: 5 $BASED on YES (50% of virtual liquidity)
npx hardhat run scripts/bets/place-bet.js --marketId [ID] --outcome YES --amount 5

# Expected: Price moves significantly but not to 100%
# Validate: Price caps at reasonable level (e.g., <80%)
```

---

**Test Case 5: Extreme Rebalancing**
```bash
# Bet 5: 10 $BASED on NO (100% of virtual liquidity)
npx hardhat run scripts/bets/place-bet.js --marketId [ID] --outcome NO --amount 10

# Expected: Market rebalances, price moves toward NO
# Validate: Price discovery still functioning
```

---

**Test Case 6: Fractional Amounts**
```bash
# Bet 6: 0.123456789 $BASED (many decimals)
npx hardhat run scripts/bets/place-bet.js --marketId [ID] --outcome YES --amount 0.123456789

# Expected: Full precision maintained OR rounds consistently
# Validate: No precision loss, accounting correct
```

---

**Validation Checks**:
- ✅ All edge case bets handled correctly
- ✅ No precision errors
- ✅ Virtual liquidity prevents extreme prices
- ✅ First bettor not disadvantaged
- ✅ Dust amounts handled (accept or reject cleanly)
- ✅ Fractional amounts precise

---

**Step 3.3: Wait for Resolution Time** (Hours 1-12)

**Monitoring**:
```bash
# Every 2 hours (6 times):
npx hardhat run scripts/monitor-market.js --marketId [ID]
```

---

**Step 3.4: Resolution** (Hour 12)

**Check Ethereum Price**:
```bash
# Query price oracle or API
# Determine: YES if >$3000, NO if ≤$3000
```

**Propose and Finalize**:
```bash
npx hardhat run scripts/resolution/propose-outcome.js --marketId [ID] --outcome [YES/NO]
npx hardhat run scripts/resolution/admin-finalize.js --marketId [ID] --outcome [YES/NO]
```

---

**Step 3.5: Validate Edge Case Payouts**

**Special Validations**:
```javascript
// Validate dust bet payout (if accepted)
// Validate first bettor payout (fair treatment)
// Validate fractional amount payout (full precision)
// Validate large bet payout (LMSR accurate at scale)
```

---

#### Market 3 Success Criteria Summary

**All Must Pass**:
- [ ] All edge case bets handled correctly
- [ ] No precision errors detected
- [ ] Virtual liquidity working as designed
- [ ] First bettor not disadvantaged
- [ ] Dust/fractional amounts handled properly
- [ ] Large bets don't break pricing
- [ ] Payouts accurate for all edge cases

**Checkpoint Decision**: After Market 3, decide GO/NO-GO for Market 4.

---

### Market 4: ECONOMIC ATTACK TESTING
**Purpose**: Test resistance to economic attacks and manipulation

**Timing**: Hour 20-44 (24 hours)

**Market Configuration**:
```javascript
{
  question: "Will gold price increase in the next 24 hours?",
  outcomes: ["YES", "NO"],
  bond: 10, // $BASED (high bond - significant economic commitment)
  resolutionTime: currentTime + 24 hours,
  category: "Commodities",
  description: "Economic attack resistance testing",
  virtualLiquidity: 100 // $BASED (high liquidity)
}
```

---

#### Market 4 Testing Procedure

**Attack Vector 1: Price Manipulation**
```bash
# Attempt to manipulate price to 99%
# Bet 1: 50 $BASED on YES
# Expected: Price moves but virtual liquidity prevents >95%
# Validate: Market still functional, not broken
```

---

**Attack Vector 2: Liquidity Drain**
```bash
# Attempt to drain all liquidity
# Bet 2: 100 $BASED on NO (equal to virtual liquidity)
# Expected: Market rebalances, liquidity remains
# Validate: Cannot fully drain, market still operational
```

---

**Attack Vector 3: Rapid Direction Changes**
```bash
# Bet 3: 25 $BASED on YES
# Bet 4: 25 $BASED on NO
# Bet 5: 25 $BASED on YES
# Bet 6: 25 $BASED on NO
# Expected: Prices oscillate but converge to equilibrium
# Validate: No profit from manipulation, fees prevent gaming
```

---

**Attack Vector 4: Last-Minute Betting**
```bash
# Wait until 5 minutes before resolution
# Bet 7: 50 $BASED on [insider info outcome]
# Expected: Market accepts but price reflects late bet cost
# Validate: LMSR pricing makes late manipulation expensive
```

---

**Validation Checks**:
- ✅ No attack vector breaks the market
- ✅ Prices stay within reasonable bounds (0.1%-99.9%)
- ✅ Virtual liquidity prevents total manipulation
- ✅ Fees make gaming unprofitable
- ✅ Late bets are expensive (as designed)
- ✅ Market recovers from attack attempts

---

#### Market 4 Success Criteria Summary

**All Must Pass**:
- [ ] All economic attacks mitigated
- [ ] Prices stay within bounds (0.1%-99.9%)
- [ ] Virtual liquidity effective
- [ ] Fees prevent profitable gaming
- [ ] Market resilient to manipulation
- [ ] Zero exploits discovered

**Checkpoint Decision**: After Market 4, decide GO/NO-GO for Markets 5-6.

**Critical**: If ANY exploit found, STOP immediately. Markets 5-6 are only for final confidence building.

---

### Market 5: DISPUTE FLOW TESTING
**Purpose**: Test community dispute system and auto-finalization

**Timing**: Hour 44-50 (6 hours)

**Market Configuration**:
```javascript
{
  question: "Should this market be disputed? (Test question)",
  outcomes: ["YES", "NO"],
  bond: 1, // $BASED
  resolutionTime: currentTime + 6 hours,
  category: "Test",
  description: "Dispute system testing - intentional dispute scenario",
  virtualLiquidity: 10 // $BASED
}
```

---

#### Market 5 Testing Procedure

**Step 5.1: Create and Complete Normal Flow**
```bash
# Create, approve, activate, bet, wait for resolution
```

---

**Step 5.2: Propose Controversial Outcome**
```bash
# Intentionally propose outcome that should be disputed
npx hardhat run scripts/resolution/propose-outcome.js --marketId [ID] --outcome NO

# Expected: Enters RESOLVING state, dispute window opens
```

---

**Step 5.3: Submit Community Dispute Signals**
```bash
# Simulate community disagreement (≥40% disagree)
npx hardhat run scripts/dispute/submit-signals.js --marketId [ID] \
  --agree 30 --disagree 70

# Expected: Auto-dispute triggers (≥40% threshold)
# Market transitions: RESOLVING → DISPUTED
```

**Validation**:
- ✅ Community signals aggregated correctly
- ✅ Auto-dispute triggered at ≥40% threshold
- ✅ State transition correct (RESOLVING → DISPUTED)
- ✅ Event: CommunityDisputeFlagged emitted

---

**Step 5.4: Admin Resolution of Dispute**
```bash
# Admin reviews and finalizes with correct outcome
npx hardhat run scripts/resolution/admin-finalize.js --marketId [ID] --outcome YES

# Expected: DISPUTED → FINALIZED
```

**Validation**:
- ✅ Admin can override dispute
- ✅ Correct outcome enforced
- ✅ Payouts based on final outcome

---

#### Market 5 Success Criteria Summary

**All Must Pass**:
- [ ] Dispute signals aggregated correctly
- [ ] Auto-dispute triggers at ≥40% threshold
- [ ] State transitions correct (RESOLVING → DISPUTED → FINALIZED)
- [ ] Admin override working
- [ ] Events emitted correctly

---

### Market 6: AUTO-FINALIZATION TESTING
**Purpose**: Test auto-finalization at ≥75% agreement

**Timing**: Hour 50-56 (6 hours)

**Market Configuration**:
```javascript
{
  question: "Should this market auto-finalize? (Test question)",
  outcomes: ["YES", "NO"],
  bond: 1, // $BASED
  resolutionTime: currentTime + 6 hours,
  category: "Test",
  description: "Auto-finalization testing - community agreement",
  virtualLiquidity: 10 // $BASED
}
```

---

#### Market 6 Testing Procedure

**Step 6.1: Create and Complete Normal Flow**
```bash
# Create, approve, activate, bet, wait for resolution
```

---

**Step 6.2: Propose Clear Outcome**
```bash
npx hardhat run scripts/resolution/propose-outcome.js --marketId [ID] --outcome YES

# Expected: Enters RESOLVING state
```

---

**Step 6.3: Submit Community Agreement Signals**
```bash
# Simulate strong community agreement (≥75%)
npx hardhat run scripts/dispute/submit-signals.js --marketId [ID] \
  --agree 80 --disagree 20

# Expected: Auto-finalization triggers (≥75% threshold)
# Market transitions: RESOLVING → FINALIZED
```

**Validation**:
- ✅ Community signals aggregated correctly
- ✅ Auto-finalization triggered at ≥75% threshold
- ✅ State transition correct (RESOLVING → FINALIZED)
- ✅ Event: MarketAutoFinalized emitted
- ✅ Payouts calculated correctly

---

**Step 6.4: Validate Automatic Finalization**
```bash
# Verify no admin intervention needed
# Verify outcome matches community consensus
# Verify payouts correct
```

---

#### Market 6 Success Criteria Summary

**All Must Pass**:
- [ ] Community signals aggregated correctly
- [ ] Auto-finalization triggers at ≥75% threshold
- [ ] State transition correct (RESOLVING → FINALIZED)
- [ ] No admin intervention needed
- [ ] Payouts correct

---

## 3. CHECKPOINT DECISION MATRIX

**Objective Criteria for Go/No-Go Decisions at Each Checkpoint**

---

### Checkpoint 1: After Market 1 (Hour 4)

**Decision Question**: Can we proceed to Market 2 (LMSR stress test)?

**Objective Criteria** (ALL must be YES):

| Criterion | Measurement | Pass Threshold | Actual | Pass? |
|-----------|-------------|----------------|--------|-------|
| Market created successfully | Transaction status | Confirmed | _____ | ☐ |
| All state transitions working | PROPOSED→APPROVED→ACTIVE→RESOLVING→FINALIZED | 5/5 correct | _____ | ☐ |
| Gas costs acceptable | Total gas for lifecycle | <2M gas | _____ | ☐ |
| LMSR pricing accurate | Price deviation from expected | ±5% | _____ | ☐ |
| 5 bets placed successfully | Bet transaction status | 5/5 confirmed | _____ | ☐ |
| Payouts correct | Actual vs calculated | ±0.1% | _____ | ☐ |
| Zero critical errors | Error logs | 0 critical | _____ | ☐ |
| Team confidence | Subjective assessment | ≥8/10 | _____ | ☐ |

**Decision Rules**:
- **GO**: All 8 criteria PASS → Proceed to Market 2
- **ESCALATE**: 1-2 criteria FAIL (non-critical) → Team review, decide case-by-case
- **ABORT**: 3+ criteria FAIL OR any critical failure → STOP, fix issues, restart from Market 1

**Documentation Required**:
```json
{
  "checkpoint": 1,
  "timestamp": "ISO-8601",
  "marketId": "0x...",
  "criteria": {
    "marketCreated": true/false,
    "stateTransitions": true/false,
    "gasCosts": { "actual": 0, "threshold": 2000000, "pass": true/false },
    "lmsrPricing": { "deviation": 0, "threshold": 5, "pass": true/false },
    "betsPlaced": { "actual": 5, "threshold": 5, "pass": true/false },
    "payoutsCorrect": { "deviation": 0, "threshold": 0.1, "pass": true/false },
    "zeroCriticalErrors": true/false,
    "teamConfidence": { "score": 0, "threshold": 8, "pass": true/false }
  },
  "decision": "GO/ESCALATE/ABORT",
  "reasoning": "Detailed rationale",
  "approvedBy": "Name",
  "nextSteps": "Proceed to Market 2 OR Fix issues"
}
```

**File Location**: `logs/phase4-validation/checkpoint1-decision.json`

---

### Checkpoint 2: After Market 2 (Hour 8)

**Decision Question**: Can we proceed to Market 3 (edge case testing)?

**Objective Criteria** (ALL must be YES):

| Criterion | Measurement | Pass Threshold | Actual | Pass? |
|-----------|-------------|----------------|--------|-------|
| 20 rapid bets successful | Bet transaction status | 20/20 confirmed | _____ | ☐ |
| Price discovery smooth | Max price jump between bets | <10% | _____ | ☐ |
| Final prices balanced | Price after all bets | 45%-55% | _____ | ☐ |
| Gas costs consistent | Gas per bet | <300k gas | _____ | ☐ |
| No precision errors | Pool accounting | 100% accurate | _____ | ☐ |
| Virtual liquidity working | Price bounds | 0.1%-99.9% | _____ | ☐ |
| Resolution correct | Outcome matches Bitcoin block | 100% accurate | _____ | ☐ |
| Payouts accurate | Actual vs calculated (LMSR) | ±0.1% | _____ | ☐ |
| Zero errors or anomalies | Error logs | 0 critical/high | _____ | ☐ |
| Team confidence | Subjective assessment | ≥8/10 | _____ | ☐ |

**Decision Rules**:
- **GO**: All 10 criteria PASS → Proceed to Market 3
- **ESCALATE**: 1-2 criteria FAIL (non-critical) → Team review
- **ABORT**: 3+ criteria FAIL OR pricing errors → STOP, investigate

**Documentation**: Same format as Checkpoint 1

**File Location**: `logs/phase4-validation/checkpoint2-decision.json`

---

### Checkpoint 3: After Market 3 (Hour 20)

**Decision Question**: Do we have 95% confidence to proceed to Markets 4-6?

**Objective Criteria** (ALL must be YES):

| Criterion | Measurement | Pass Threshold | Actual | Pass? |
|-----------|-------------|----------------|--------|-------|
| All edge cases handled | Edge case test results | 6/6 pass | _____ | ☐ |
| No precision errors | Dust/fractional bets | 100% accurate | _____ | ☐ |
| First bettor fair | Price before/after first bet | ~50% → ~51-52% | _____ | ☐ |
| Virtual liquidity effective | Price bounds | 0.1%-99.9% | _____ | ☐ |
| Large bets don't break pricing | 5 $BASED bet | Price <80% | _____ | ☐ |
| All payouts accurate | Edge case payouts | ±0.1% | _____ | ☐ |
| Cumulative: 3 markets successful | Success rate | 3/3 (100%) | _____ | ☐ |
| Cumulative: Zero critical issues | Total critical errors | 0 | _____ | ☐ |
| Cumulative: Gas costs acceptable | Average gas per operation | <2x estimates | _____ | ☐ |
| Team confidence | Subjective assessment | ≥9/10 | _____ | ☐ |

**Decision Rules**:
- **GO**: All 10 criteria PASS → Proceed to Markets 4-6 (final validation)
- **ESCALATE**: 1-2 criteria FAIL → Team review, decide if Markets 4-6 needed
- **ABORT**: 3+ criteria FAIL OR edge case issues → STOP, fix issues

**Special Note**: This checkpoint requires HIGHER confidence (9/10 vs 8/10) because we're moving to economic attack testing.

**Documentation**: Same format as Checkpoint 1

**File Location**: `logs/phase4-validation/checkpoint3-decision.json`

---

### Checkpoint 4: After Market 4 (Hour 44)

**Decision Question**: Are we ready for final Markets 5-6 (dispute testing)?

**CRITICAL CHECKPOINT**: If ANY economic exploit found, ABORT immediately.

**Objective Criteria** (ALL must be YES):

| Criterion | Measurement | Pass Threshold | Actual | Pass? |
|-----------|-------------|----------------|--------|-------|
| No exploits discovered | Economic attack tests | 0 exploits | _____ | ☐ |
| Prices stayed within bounds | Min/max prices | 0.1%-99.9% | _____ | ☐ |
| Virtual liquidity resilient | 100 $BASED bet | Market functional | _____ | ☐ |
| Fees prevent gaming | Attack profitability | Net loss for attacker | _____ | ☐ |
| Late bets expensive | Last-minute bet cost | >10% premium | _____ | ☐ |
| Market recovered from attacks | Post-attack functionality | 100% operational | _____ | ☐ |
| Cumulative: 4 markets successful | Success rate | 4/4 (100%) | _____ | ☐ |
| Cumulative: Zero critical issues | Total critical errors | 0 | _____ | ☐ |
| Cumulative: System stable | Uptime | 100% | _____ | ☐ |
| Team confidence | Subjective assessment | ≥9/10 | _____ | ☐ |

**Decision Rules**:
- **GO**: All 10 criteria PASS → Proceed to Markets 5-6 (dispute testing)
- **ABORT**: ANY criterion FAIL → STOP immediately

**CRITICAL**: No escalation at this checkpoint. Either GO or ABORT.

**Documentation**: Same format as Checkpoint 1

**File Location**: `logs/phase4-validation/checkpoint4-decision.json`

---

### Checkpoint 5: After Markets 5-6 (Hour 56)

**Decision Question**: Is the system ready for 16-hour final monitoring before go-live decision?

**Objective Criteria** (ALL must be YES):

| Criterion | Measurement | Pass Threshold | Actual | Pass? |
|-----------|-------------|----------------|--------|-------|
| Dispute signals working | Aggregation accuracy | 100% correct | _____ | ☐ |
| Auto-dispute at ≥40% | Dispute threshold | Triggered correctly | _____ | ☐ |
| Auto-finalize at ≥75% | Finalization threshold | Triggered correctly | _____ | ☐ |
| Admin override working | Override functionality | 100% working | _____ | ☐ |
| State transitions correct | Dispute flow states | All correct | _____ | ☐ |
| Events emitted correctly | Dispute events | All emitted | _____ | ☐ |
| Cumulative: 6 markets successful | Success rate | 6/6 (100%) | _____ | ☐ |
| Cumulative: Zero critical issues | Total critical errors | 0 | _____ | ☐ |
| Cumulative: 56h stable | System uptime | 100% | _____ | ☐ |
| Team confidence | Subjective assessment | ≥9/10 | _____ | ☐ |

**Decision Rules**:
- **GO**: All 10 criteria PASS → Proceed to final 16h monitoring
- **ABORT**: ANY criterion FAIL → STOP, investigate

**Documentation**: Same format as Checkpoint 1

**File Location**: `logs/phase4-validation/checkpoint5-decision.json`

---

### Final Checkpoint: After 72 Hours (Hour 72)

**Decision Question**: GO or NO-GO for public launch?

**FINAL GO/NO-GO DECISION**

**Objective Criteria** (ALL must be YES):

| Criterion | Measurement | Pass Threshold | Actual | Pass? |
|-----------|-------------|----------------|--------|-------|
| 72+ hours stable | System uptime | 100% | _____ | ☐ |
| Zero critical errors | Total critical errors | 0 | _____ | ☐ |
| Zero medium errors | Total medium errors | 0 | _____ | ☐ |
| 100% transaction success | Success rate | 100% | _____ | ☐ |
| Gas costs acceptable | Average gas | <2x estimates | _____ | ☐ |
| LMSR pricing accurate | Cumulative deviation | ±5% | _____ | ☐ |
| All markets functional | Market success rate | 6/6 (100%) | _____ | ☐ |
| State transitions correct | Transition success rate | 100% | _____ | ☐ |
| No unexpected behaviors | Anomaly count | 0 | _____ | ☐ |
| Team confidence | Subjective assessment | ≥9/10 | _____ | ☐ |
| All documentation complete | Logs & decisions | 100% documented | _____ | ☐ |
| All stakeholders approve | Team sign-off | 100% approval | _____ | ☐ |

**Decision Rules**:
- **GO FOR PUBLIC LAUNCH**: All 12 criteria PASS → Proceed to public announcement
- **NO-GO**: ANY criterion FAIL → Delay launch, fix issues, restart validation

**CRITICAL**: This is the FINAL decision. No escalation, no exceptions.

**Documentation**:
```json
{
  "finalCheckpoint": true,
  "timestamp": "ISO-8601",
  "durationHours": 72,
  "criteria": {
    // All 12 criteria with actual measurements
  },
  "cumulativeMetrics": {
    "totalMarkets": 6,
    "successfulMarkets": 6,
    "failedMarkets": 0,
    "totalBets": 0,
    "successfulBets": 0,
    "failedBets": 0,
    "totalGas": 0,
    "averageGasPerOperation": 0,
    "criticalErrors": 0,
    "mediumErrors": 0,
    "lowErrors": 0,
    "systemUptime": "100%"
  },
  "decision": "GO/NO-GO",
  "reasoning": "Comprehensive rationale for decision",
  "proof": "Links to all logs, metrics, checkpoints",
  "teamApprovals": [
    { "name": "Technical Lead", "approved": true, "timestamp": "ISO-8601" },
    { "name": "Project Manager", "approved": true, "timestamp": "ISO-8601" },
    { "name": "Security Reviewer", "approved": true, "timestamp": "ISO-8601" }
  ],
  "nextSteps": "Public launch preparation OR Issue remediation"
}
```

**File Location**: `logs/phase4-validation/final-go-no-go-decision.json`

---

## 4. MONITORING CONFIGURATION

**Real-Time Continuous Monitoring with Automated Alerts**

---

### 4.1 Monitoring Metrics

**Category 1: Transaction Metrics**

| Metric | Description | Collection Frequency | Alert Threshold |
|--------|-------------|---------------------|-----------------|
| Transaction Success Rate | % of transactions confirmed | Real-time (per tx) | <100% |
| Transaction Failures | Count of failed transactions | Real-time (per tx) | >0 |
| Gas Cost Per Operation | Actual gas used | Real-time (per tx) | >2x estimate |
| Block Confirmation Time | Time to confirmation | Real-time (per tx) | >60 seconds |
| Pending Transaction Count | Txs waiting for confirmation | Every 1 minute | >3 pending |

**Monitoring Script**: `scripts/monitor-transactions.js` (runs continuously)

---

**Category 2: Market State Metrics**

| Metric | Description | Collection Frequency | Alert Threshold |
|--------|-------------|---------------------|-----------------|
| Market State | Current state enum | Every 5 minutes | Unexpected state |
| State Transition Validity | Correct transitions | Per transition | Invalid transition |
| Pool Balance | Total $BASED in pool | Every 5 minutes | Mismatch vs expected |
| Share Supply | Total shares minted | Every 5 minutes | Mismatch vs pool |
| Virtual Liquidity | Applied correctly | Every 5 minutes | Not applied |

**Monitoring Script**: `scripts/monitor-market-state.js` (every 5 minutes)

---

**Category 3: LMSR Pricing Metrics**

| Metric | Description | Collection Frequency | Alert Threshold |
|--------|-------------|---------------------|-----------------|
| Price Accuracy | Calculated vs actual | Per bet | >5% deviation |
| Price Bounds | Min/max prices | Per bet | <0.1% or >99.9% |
| Price Jumps | Large movements | Per bet | >10% single jump |
| Share Price | Cost per share | Per bet | Negative or zero |
| Pool Ratio | YES pool / NO pool | Per bet | >1000:1 imbalance |

**Monitoring Script**: `scripts/monitor-lmsr-pricing.js` (per bet)

---

**Category 4: Event Emission Metrics**

| Metric | Description | Collection Frequency | Alert Threshold |
|--------|-------------|---------------------|-----------------|
| Event Completeness | All expected events | Per transaction | Missing events |
| Event Data Accuracy | Event parameters | Per event | Incorrect data |
| Event Order | Sequence of events | Per block | Out of order |

**Monitoring Script**: `scripts/monitor-events.js` (per block)

---

**Category 5: System Health Metrics**

| Metric | Description | Collection Frequency | Alert Threshold |
|--------|-------------|---------------------|-----------------|
| System Uptime | % time operational | Continuous | <100% |
| Error Rate | Errors per hour | Every 15 minutes | >0 critical, >3 medium |
| Warning Rate | Warnings per hour | Every 15 minutes | >10 warnings |
| Response Time | Query response time | Every 5 minutes | >5 seconds |
| Network Latency | RPC latency | Every 1 minute | >3 seconds |

**Monitoring Script**: `scripts/monitor-system-health.js` (continuous)

---

### 4.2 Automated Alerting System

**Alert Levels**:

**🔴 CRITICAL (Immediate Action)**:
- Transaction failure
- State corruption
- LMSR pricing error >10%
- Security vulnerability
- Fund loss detected
- System down

**Action**: Page team immediately, STOP all operations

---

**🟠 HIGH (Urgent Review)**:
- Gas cost spike >2x
- LMSR pricing deviation 5-10%
- Missing events
- Price out of bounds
- Error rate >1/hour

**Action**: Team review within 15 minutes, consider pause

---

**🟡 MEDIUM (Monitor Closely)**:
- Gas cost increase 1.5-2x
- LMSR pricing deviation 3-5%
- Warning rate >5/hour
- Network latency >2s
- Unexpected behavior (non-critical)

**Action**: Team awareness, increase monitoring frequency

---

**🔵 LOW (Informational)**:
- Gas cost increase 1-1.5x
- LMSR pricing deviation <3%
- Warning rate 1-5/hour
- Minor anomalies

**Action**: Log for analysis, no immediate action

---

### 4.3 Monitoring Schedule

**Hour 0-4 (Market 1)**: INTENSIVE
```bash
# Real-time transaction monitoring
scripts/monitor-transactions.js --continuous

# Every 1 minute:
scripts/monitor-market-state.js --market [ID] --interval 1m

# Every 5 minutes:
scripts/monitor-lmsr-pricing.js --market [ID] --interval 5m
scripts/monitor-system-health.js --interval 5m
```

---

**Hour 4-8 (Market 2)**: INTENSIVE
```bash
# Same as Hour 0-4, plus:
# Per-bet LMSR monitoring (rapid betting)
scripts/monitor-lmsr-pricing.js --market [ID] --per-bet
```

---

**Hour 8-20 (Market 3)**: ACTIVE
```bash
# Every 5 minutes:
scripts/monitor-market-state.js --market [ID] --interval 5m
scripts/monitor-system-health.js --interval 5m

# Every 15 minutes:
scripts/comprehensive-health-check.js --interval 15m
```

---

**Hour 20-44 (Market 4)**: INTENSIVE (Economic Attack)
```bash
# Real-time transaction monitoring (attack attempts)
scripts/monitor-transactions.js --continuous

# Every 1 minute:
scripts/monitor-market-state.js --market [ID] --interval 1m
scripts/monitor-lmsr-pricing.js --market [ID] --interval 1m

# Every 5 minutes:
scripts/monitor-system-health.js --interval 5m
```

---

**Hour 44-56 (Markets 5-6)**: ACTIVE
```bash
# Every 5 minutes:
scripts/monitor-market-state.js --all-markets --interval 5m
scripts/monitor-system-health.js --interval 5m

# Every 15 minutes:
scripts/comprehensive-health-check.js --interval 15m
```

---

**Hour 56-72 (Final Monitoring)**: REGULAR
```bash
# Every 15 minutes:
scripts/comprehensive-health-check.js --interval 15m

# Every hour:
scripts/generate-status-report.js --interval 1h
```

---

### 4.4 Data Preservation

**Continuous Backup Strategy**:

**Real-Time Logs** (Every transaction):
```bash
# Transaction logs
logs/phase4-validation/transactions/tx-[hash].json

# Event logs
logs/phase4-validation/events/event-[blockNumber]-[logIndex].json
```

---

**Periodic Snapshots** (Every 15 minutes):
```bash
# System state snapshot
logs/phase4-validation/snapshots/snapshot-[timestamp].json

# Contains:
# - All market states
# - Pool balances
# - Share supplies
# - Pricing data
# - Error counts
# - System metrics
```

---

**Checkpoint Backups** (At each checkpoint):
```bash
# Full checkpoint backup
logs/phase4-validation/checkpoints/checkpoint[1-6]-[timestamp].tar.gz

# Contains:
# - All logs up to checkpoint
# - Decision documentation
# - Metrics summary
# - Team approvals
```

---

**Final Archive** (After 72 hours):
```bash
# Complete Phase 4 archive
logs/phase4-validation/phase4-complete-[timestamp].tar.gz

# Contains:
# - All transaction logs
# - All event logs
# - All snapshots
# - All checkpoints
# - Decision documents
# - Final report
# - Team approvals
```

---

### 4.5 Critical Alert Configuration

**Slack/Discord Webhook Integration**:
```javascript
// Alert configuration
const ALERTS = {
  CRITICAL: {
    channels: ['#urgent', '@technical-lead', '@project-manager'],
    soundAlert: true,
    phoneAlert: true,
    action: 'STOP_ALL_OPERATIONS'
  },
  HIGH: {
    channels: ['#urgent', '@technical-lead'],
    soundAlert: true,
    phoneAlert: false,
    action: 'REVIEW_WITHIN_15MIN'
  },
  MEDIUM: {
    channels: ['#monitoring'],
    soundAlert: false,
    phoneAlert: false,
    action: 'INCREASE_MONITORING'
  },
  LOW: {
    channels: ['#monitoring'],
    soundAlert: false,
    phoneAlert: false,
    action: 'LOG_ONLY'
  }
};
```

---

## 5. FAILURE RECOVERY PROCEDURES

**13 Failure Scenarios with Detection & Recovery**

---

### 5.1 Critical Failures (STOP IMMEDIATELY)

#### Failure 1: Transaction Reverts During Market Creation

**Detection**:
```bash
# Monitoring script detects transaction status: "reverted"
# Error log shows revert reason
```

**Symptoms**:
- createMarket() transaction fails
- No MarketCreated event emitted
- Bond not locked

**Root Cause Analysis**:
```javascript
// Check revert reason:
// 1. Insufficient bond? (Check min bond requirement)
// 2. Registry misconfiguration? (Check factory can read registry)
// 3. Out of gas? (Check gas limit)
// 4. Contract paused? (Check factory pause state)
// 5. Access control? (Check caller has permission)
```

**Recovery Procedure**:
1. **STOP** all market creation attempts
2. **Document** exact revert reason from transaction logs
3. **Identify** root cause from checklist above
4. **Fix** issue:
   - Insufficient bond → Increase bond amount
   - Registry issue → Re-configure factory-registry connection
   - Gas issue → Increase gas limit in transaction
   - Paused → Unpause factory (if appropriate)
   - Access → Grant necessary roles
5. **Re-validate** all 15 pre-execution checks
6. **Restart** from Market 1 (fresh start)

**Estimated Recovery Time**: 1-4 hours

---

#### Failure 2: LMSR Pricing Error >10%

**Detection**:
```bash
# LMSR monitor detects: calculated price != actual price
# Deviation >10%
```

**Symptoms**:
- Bet accepted but price update incorrect
- Share price negative or unrealistic
- Pool ratio imbalanced beyond virtual liquidity

**Root Cause Analysis**:
```javascript
// Check LMSR implementation:
// 1. Overflow/underflow in calculations? (Check SafeMath)
// 2. Precision loss? (Check fixed-point math)
// 3. Virtual liquidity not applied? (Check initialization)
// 4. Rounding errors? (Check rounding direction)
// 5. Bug in bonding curve? (Check LMSRCurve.sol)
```

**Recovery Procedure**:
1. **STOP** all betting immediately
2. **Document** exact pricing deviation and bet details
3. **Analyze** transaction logs for calculation errors
4. **Identify** if bug is in:
   - PredictionMarket.sol (market contract)
   - LMSRCurve.sol (pricing logic)
   - Library (CurveMarketLogic)
5. **Fix** identified bug
6. **Re-deploy** affected contract(s) to fork
7. **Re-test** LMSR pricing with 100 test bets
8. **If fork passes** → Deploy fix to mainnet (new version)
9. **Migrate** existing markets (if possible) OR deprecate and restart
10. **Restart** validation from Market 1

**Estimated Recovery Time**: 1-3 days (requires code fix + testing)

**CRITICAL**: This is a severe issue. Consider NO-GO until fully resolved.

---

#### Failure 3: State Corruption

**Detection**:
```bash
# State monitor detects: market in invalid state
# E.g., currentState = 255 (invalid enum value)
# OR state transition impossible (e.g., FINALIZED → ACTIVE)
```

**Symptoms**:
- Market state doesn't match expected
- State transitions fail
- Functions revert with InvalidState error

**Root Cause Analysis**:
```javascript
// Check state management:
// 1. State variable corrupted? (Memory issue)
// 2. Reentrancy attack? (Check reentrancy guards)
// 3. Race condition? (Check state change atomicity)
// 4. Bug in state transition logic? (Check PredictionMarket.sol)
// 5. External contract interference? (Check access control)
```

**Recovery Procedure**:
1. **STOP** all operations immediately
2. **Document** current state vs expected state
3. **Analyze** all transactions affecting the market
4. **Determine** if corruption is:
   - Isolated to one market → Deprecate that market
   - Systemic → CRITICAL BUG, ABORT deployment
5. **If isolated**:
   - Mark market as corrupted
   - Refund all participants
   - Continue with new market
6. **If systemic**:
   - ABORT Phase 4
   - Fix bug in contracts
   - Re-deploy and restart validation
7. **Security audit** all state management code

**Estimated Recovery Time**:
- Isolated: 2-4 hours
- Systemic: 1-2 weeks (requires fix + audit)

**CRITICAL**: Systemic state corruption = NO-GO for public launch.

---

#### Failure 4: Fund Loss Detected

**Detection**:
```bash
# Balance monitor detects: pool balance < expected
# E.g., sum of bets = 10 $BASED, but pool = 9 $BASED
```

**Symptoms**:
- Pool balance doesn't match sum of bets
- Users cannot withdraw full winnings
- Funds "disappear" from contract

**Root Cause Analysis**:
```javascript
// CRITICAL SECURITY ISSUE
// Check for:
// 1. Reentrancy vulnerability? (Check all external calls)
// 2. Integer overflow/underflow? (Check SafeMath usage)
// 3. Fee calculation bug? (Check RewardDistributor)
// 4. Transfer bug? (Check all token transfers)
// 5. Malicious exploit? (Check transaction history)
```

**Recovery Procedure**:
1. **STOP** all operations immediately
2. **FREEZE** all contracts (emergency pause)
3. **Document** exact fund discrepancy
4. **Audit** all transactions for fund flow
5. **Identify** where funds went:
   - Lost to bug → Identify bug, estimate impact
   - Stolen → Forensic analysis, consider legal action
   - Fee miscalculation → Recalculate correct amounts
6. **Determine** if recoverable:
   - Recoverable → Execute recovery transaction
   - Unrecoverable → Plan compensation for users
7. **Security audit** all financial logic
8. **Fix** vulnerability
9. **Re-deploy** with fix
10. **Compensate** affected users if needed
11. **Restart** validation from scratch

**Estimated Recovery Time**: 1-4 weeks (severe issue)

**CRITICAL**: Fund loss = ABORT deployment, fix vulnerability, full security audit required.

---

#### Failure 5: Security Vulnerability Discovered

**Detection**:
```bash
# Security monitor or team identifies:
# - Exploitable bug
# - Attack vector
# - Unsafe code pattern
```

**Symptoms**:
- Potential for malicious exploitation
- Code doesn't match security best practices
- Known vulnerability pattern detected

**Root Cause Analysis**:
```javascript
// Run comprehensive security audit:
// 1. Reentrancy? (Check CEI pattern)
// 2. Access control? (Check all onlyRole modifiers)
// 3. Integer issues? (Check SafeMath)
// 4. External call safety? (Check all .call())
// 5. Flash loan attack? (Check LMSR manipulation)
```

**Recovery Procedure**:
1. **STOP** all operations immediately
2. **Document** exact vulnerability
3. **Assess severity**:
   - Critical (fund loss possible) → ABORT deployment
   - High (state corruption possible) → Fix urgently
   - Medium (unexpected behavior) → Fix before launch
   - Low (theoretical only) → Document, consider fix
4. **Fix** vulnerability in code
5. **Security audit** by multiple reviewers
6. **Re-deploy** with fix
7. **Re-validate** all previous tests
8. **Restart** Phase 4 from beginning

**Estimated Recovery Time**:
- Critical: 2-4 weeks
- High: 1-2 weeks
- Medium: 3-7 days

**CRITICAL**: Critical or High severity = ABORT deployment until fixed and audited.

---

### 5.2 High-Priority Failures (Urgent Review)

#### Failure 6: Gas Cost Spike >2x Estimate

**Detection**:
```bash
# Gas monitor detects: actual gas > 2x estimate
# E.g., placeBet() costs 400k gas (expected: 150k)
```

**Symptoms**:
- Operations much more expensive than expected
- May impact user affordability
- Could indicate inefficiency or attack

**Root Cause Analysis**:
```javascript
// Check for:
// 1. Network congestion? (Check BasedAI gas prices)
// 2. Inefficient code path? (Profile gas usage)
// 3. Unexpected state? (Check market complexity)
// 4. Attack attempt? (Check for spam or griefing)
// 5. Bug causing extra computation? (Check logic)
```

**Recovery Procedure**:
1. **Pause** new operations (don't stop existing)
2. **Document** gas costs (expected vs actual)
3. **Analyze** transaction trace to find expensive operations
4. **Determine** if issue is:
   - Network (temporary) → Wait for gas to normalize
   - Code inefficiency → Optimize contract
   - Attack → Block attacker, review security
   - Bug → Fix and redeploy
5. **If network issue**:
   - Wait 1-4 hours
   - Retry when gas normalizes
6. **If code issue**:
   - Optimize contract
   - Deploy optimized version
   - Migrate or restart
7. **Resume** operations after fix

**Estimated Recovery Time**: 2 hours - 2 days

**Decision**: If gas cost persists >2x, consider NO-GO until optimized.

---

#### Failure 7: Missing Events

**Detection**:
```bash
# Event monitor detects: expected event not emitted
# E.g., MarketCreated event missing after createMarket()
```

**Symptoms**:
- Transaction succeeds but events missing
- Monitoring cannot track state changes
- Frontend won't update correctly

**Root Cause Analysis**:
```javascript
// Check for:
// 1. Event emission bug? (Check emit statements)
// 2. Revert after event? (Check transaction flow)
// 3. Wrong event parameters? (Check event data)
// 4. Gas limit reached? (Check if event was last operation)
// 5. RPC issue? (Check if event exists on-chain)
```

**Recovery Procedure**:
1. **Continue** operations (not critical to core functionality)
2. **Document** missing events
3. **Verify** events exist on-chain (check block explorer)
4. **If events missing on-chain**:
   - Bug in contract → Fix emit statements
   - Gas issue → Increase gas limit
5. **If events exist but not detected**:
   - RPC issue → Switch RPC endpoint
   - Monitoring bug → Fix monitoring script
6. **Test** event emission thoroughly
7. **Resume** normal monitoring

**Estimated Recovery Time**: 2-8 hours

**Decision**: Missing events are HIGH priority but not a blocker if core functionality works.

---

#### Failure 8: Price Out of Bounds (0% or 100%)

**Detection**:
```bash
# LMSR monitor detects: price = 0% or price = 100%
```

**Symptoms**:
- Extreme price (0% or 100%)
- One outcome becomes "free"
- Virtual liquidity not working

**Root Cause Analysis**:
```javascript
// Check for:
// 1. Virtual liquidity not applied? (Check initialization)
// 2. Massive bet on one side? (Check bet amounts)
// 3. LMSR calculation bug? (Check edge cases)
// 4. Overflow/underflow? (Check SafeMath)
// 5. Price manipulation attack? (Check bet history)
```

**Recovery Procedure**:
1. **Pause** betting on affected market
2. **Document** bet history leading to 0%/100%
3. **Analyze** if issue is:
   - Virtual liquidity bug → Fix initialization
   - Legitimate large bet → Expected behavior (allow)
   - LMSR bug → Fix calculation
   - Attack → Block and review
4. **If bug**:
   - Fix contract
   - Redeploy
   - Migrate or restart
5. **If legitimate**:
   - Verify LMSR working correctly
   - Resume betting
6. **If attack**:
   - Identify attacker
   - Block address
   - Review security

**Estimated Recovery Time**: 4-24 hours

**Decision**: If due to bug, HIGH priority fix. If legitimate, continue with monitoring.

---

### 5.3 Medium-Priority Failures (Monitor Closely)

#### Failure 9: Unexpected Behavior (Non-Critical)

**Detection**:
```bash
# Monitoring detects: behavior doesn't match specification
# E.g., event emitted twice, function returns unexpected value
```

**Symptoms**:
- Behavior differs from expected
- Not breaking core functionality
- Could indicate underlying issue

**Recovery Procedure**:
1. **Document** unexpected behavior
2. **Assess** severity (does it impact core functionality?)
3. **Investigate** root cause
4. **If non-critical**:
   - Log for future fix
   - Continue with increased monitoring
5. **If potentially critical**:
   - Escalate to HIGH priority
   - Follow urgent review procedure

**Estimated Recovery Time**: Varies

---

#### Failure 10: Network Latency >2s

**Detection**:
```bash
# Network monitor detects: RPC latency >2 seconds
```

**Symptoms**:
- Slow responses from RPC
- Delayed confirmations
- Monitoring script timeouts

**Recovery Procedure**:
1. **Switch** to backup RPC endpoint
2. **Test** latency on multiple endpoints
3. **Use** fastest endpoint
4. **Monitor** for improvement
5. **If persistent**:
   - Contact BasedAI support
   - Consider delay in validation timeline

**Estimated Recovery Time**: Minutes to hours

---

### 5.4 Silent Failure Detection

**Most Dangerous: Failures that don't throw errors**

#### Silent Failure 1: LMSR Pricing Slightly Off

**Detection**:
```javascript
// Continuous validation against independent LMSR implementation
const expectedPrice = calculateLMSRPriceIndependent(pool, bet);
const actualPrice = await market.getCurrentPrice();
const deviation = Math.abs(expectedPrice - actualPrice) / expectedPrice;

if (deviation > 0.01) { // >1% deviation
  ALERT('LMSR pricing deviation detected', { expected, actual, deviation });
}
```

**Recovery**: Investigate pricing logic, validate LMSR implementation.

---

#### Silent Failure 2: Events Emitted with Wrong Data

**Detection**:
```javascript
// Validate event data matches expected values
const event = await getMarketCreatedEvent(txHash);
if (event.marketId !== expectedMarketId ||
    event.creator !== expectedCreator ||
    event.bond !== expectedBond) {
  ALERT('Event data mismatch', { expected, actual });
}
```

**Recovery**: Fix event emission logic, ensure correct parameters.

---

#### Silent Failure 3: State Transitions Work But Logic Wrong

**Detection**:
```javascript
// Validate state machine logic against specification
const actualState = await market.currentState();
const expectedState = calculateExpectedState(history);

if (actualState !== expectedState) {
  ALERT('State transition logic error', { expected, actual, history });
}
```

**Recovery**: Review state machine implementation, fix logic errors.

---

## 6. DECISION DOCUMENTATION

**Templates for Recording All Decisions with Proof**

---

### 6.1 Decision Documentation Template

**File**: `logs/phase4-validation/decisions/decision-[checkpoint]-[timestamp].json`

```json
{
  "decisionId": "CHECKPOINT_[1-6]_[YYYYMMDD_HHMMSS]",
  "timestamp": "ISO-8601 format",
  "checkpoint": 1-6,
  "decisionQuestion": "Can we proceed to [next step]?",

  "context": {
    "currentPhase": "Phase 4 Hour X",
    "marketsTested": 0-6,
    "cumulativeRuntime": "X hours",
    "teamMembers": ["Name1", "Name2"]
  },

  "objectiveCriteria": {
    "criterion1": {
      "description": "Market created successfully",
      "measurement": "Transaction status",
      "threshold": "Confirmed",
      "actual": "Confirmed",
      "pass": true,
      "evidence": "logs/transactions/tx-0x123.json"
    },
    "criterion2": {
      // ... all criteria from checkpoint matrix
    }
  },

  "subjectiveAssessment": {
    "teamConfidence": {
      "score": 8,
      "threshold": 8,
      "pass": true,
      "reasoning": "All tests passed, no anomalies observed, system stable"
    },
    "observations": [
      "Gas costs slightly higher than expected but within threshold",
      "LMSR pricing performed excellently under stress",
      "No edge cases discovered"
    ],
    "concerns": [
      "Network latency spiked briefly at Hour 2 (resolved)",
      "One transaction took 45s to confirm (within acceptable range)"
    ]
  },

  "cumulativeMetrics": {
    "totalMarkets": 1,
    "successfulMarkets": 1,
    "failedMarkets": 0,
    "totalTransactions": 15,
    "successfulTransactions": 15,
    "failedTransactions": 0,
    "totalGas": 2500000,
    "averageGasPerOperation": 166667,
    "criticalErrors": 0,
    "highErrors": 0,
    "mediumErrors": 0,
    "lowWarnings": 2,
    "systemUptimePercent": 100
  },

  "decision": "GO",
  "reasoning": "All 8 objective criteria passed. Team confidence at 8/10 (threshold). Gas costs within acceptable range (1.5x estimate). LMSR pricing accurate (±3% deviation). Zero critical or high errors. System stable for 4 hours. Recommend proceeding to Market 2 (LMSR stress test).",

  "approvals": [
    {
      "name": "Technical Lead",
      "role": "Technical Decision",
      "approved": true,
      "timestamp": "ISO-8601",
      "notes": "All technical criteria met. Confident in proceeding."
    },
    {
      "name": "Project Manager",
      "role": "Overall Decision",
      "approved": true,
      "timestamp": "ISO-8601",
      "notes": "Team ready. Timeline on track. Proceed to Market 2."
    }
  ],

  "nextSteps": [
    "Proceed to Market 2 (LMSR stress test)",
    "Maintain monitoring frequency (every 5 minutes)",
    "Execute rapid betting sequence (20 bets)",
    "Validate LMSR pricing under stress"
  ],

  "evidence": {
    "transactionLogs": "logs/phase4-validation/transactions/",
    "eventLogs": "logs/phase4-validation/events/",
    "monitoringLogs": "logs/phase4-validation/monitoring/market1/",
    "snapshotBackups": "logs/phase4-validation/snapshots/checkpoint1/",
    "videoRecording": "Optional: screen recording of tests"
  },

  "signature": {
    "technicalLead": "Digital signature or cryptographic hash",
    "projectManager": "Digital signature or cryptographic hash"
  }
}
```

---

### 6.2 Final Go/No-Go Documentation Template

**File**: `logs/phase4-validation/FINAL_GO_NO_GO_DECISION.json`

```json
{
  "decisionId": "FINAL_GO_NO_GO_[YYYYMMDD_HHMMSS]",
  "timestamp": "ISO-8601 format",
  "decisionType": "FINAL_PUBLIC_LAUNCH",

  "executiveSummary": {
    "decision": "GO" or "NO-GO",
    "confidence": "95%",
    "recommendation": "Proceed to public launch on [date]",
    "keyFindings": [
      "72 hours stable operation achieved",
      "6 test markets completed successfully",
      "Zero critical issues discovered",
      "LMSR pricing accurate across all scenarios",
      "Economic attack resistance validated"
    ]
  },

  "validationSummary": {
    "duration": "72 hours",
    "markets": {
      "total": 6,
      "successful": 6,
      "failed": 0,
      "descriptions": [
        "Market 1: Baseline validation - PASS",
        "Market 2: LMSR stress test - PASS",
        "Market 3: Edge case testing - PASS",
        "Market 4: Economic attack testing - PASS",
        "Market 5: Dispute flow testing - PASS",
        "Market 6: Auto-finalization testing - PASS"
      ]
    },
    "transactions": {
      "total": 150,
      "successful": 150,
      "failed": 0,
      "successRate": "100%"
    },
    "errors": {
      "critical": 0,
      "high": 0,
      "medium": 0,
      "low": 5,
      "warnings": 20
    },
    "uptime": "100%"
  },

  "criteriaAssessment": {
    // All 12 final criteria from Checkpoint 6
    "criterion1_72hStable": {
      "pass": true,
      "evidence": "logs/uptime-report.json"
    },
    // ... all 12 criteria
  },

  "riskAssessment": {
    "identifiedRisks": [
      {
        "risk": "Network gas price volatility",
        "likelihood": "Medium",
        "impact": "Low",
        "mitigation": "Monitor gas prices, adjust transaction timing"
      }
    ],
    "residualRisk": "Low",
    "acceptableForLaunch": true
  },

  "performanceMetrics": {
    "gasCosts": {
      "createMarket": { "average": 890000, "target": 1000000, "variance": "-11%" },
      "placeBet": { "average": 165000, "target": 150000, "variance": "+10%" },
      "resolveMarket": { "average": 280000, "target": 300000, "variance": "-7%" }
    },
    "lmsrAccuracy": {
      "averageDeviation": "2.3%",
      "maxDeviation": "4.8%",
      "target": "±5%",
      "status": "PASS"
    },
    "systemResponse": {
      "averageLatency": "1.2s",
      "maxLatency": "3.1s",
      "target": "<5s",
      "status": "PASS"
    }
  },

  "securityAssessment": {
    "vulnerabilities": {
      "critical": 0,
      "high": 0,
      "medium": 0,
      "low": 0
    },
    "exploitsAttempted": [
      "Price manipulation - FAILED (protected by LMSR)",
      "Liquidity drain - FAILED (protected by virtual liquidity)",
      "Economic attack - FAILED (fees prevent profitability)"
    ],
    "securityScore": "98/100",
    "readyForProduction": true
  },

  "teamConsensus": {
    "technicalLead": {
      "recommendation": "GO",
      "confidence": "95%",
      "reasoning": "All technical validations passed. System stable and secure."
    },
    "projectManager": {
      "recommendation": "GO",
      "confidence": "95%",
      "reasoning": "Timeline met. Criteria exceeded. Team confident."
    },
    "securityReviewer": {
      "recommendation": "GO",
      "confidence": "95%",
      "reasoning": "Zero vulnerabilities. Attack resistance validated."
    },
    "consensus": "GO"
  },

  "launchPlan": {
    "publicAnnouncementDate": "2025-11-XX",
    "frontendEnableDate": "2025-11-XX",
    "postLaunchMonitoring": "Intensive (every 15 min for first 24h)",
    "escalationPlan": "Pause if any critical issue, immediate team review",
    "rollbackPlan": "Emergency pause function, user refunds if needed"
  },

  "archiveLocation": "logs/phase4-validation/phase4-complete-[timestamp].tar.gz",

  "signatures": {
    "technicalLead": "Digital signature",
    "projectManager": "Digital signature",
    "securityReviewer": "Digital signature",
    "stakeholder1": "Digital signature"
  }
}
```

---

### 6.3 Proof Requirements

**For Each Decision, Provide**:

1. **Transaction Proof**: All transaction hashes, block numbers, timestamps
2. **Event Proof**: All events emitted, parameters, log indices
3. **State Proof**: Market states at each checkpoint (snapshots)
4. **Metric Proof**: Gas costs, prices, balances (actual measurements)
5. **Error Proof**: Error logs (or proof of zero errors)
6. **Uptime Proof**: Continuous monitoring logs showing 100% uptime
7. **Team Proof**: Signed approvals from all decision-makers

**Storage**:
- All proof stored in `logs/phase4-validation/proof/`
- Proof linked in decision documentation
- Proof archived in final archive

---

## 7. EXECUTION TIMELINE

**Hour-by-Hour Plan for 72-Hour Validation**

---

### Day 1 (Hours 0-24)

#### Hour 0 - Pre-Execution Validation
```
00:00 - 00:15 | Team briefing, role assignments
00:15 - 01:00 | Execute all 15 pre-execution validation steps
01:00 - 01:15 | Review validation results, GO/NO-GO decision
```

**Deliverable**: Pre-execution validation passed (or ABORT)

---

#### Hours 1-4 - Market 1 (Baseline Validation)
```
01:15 - 01:20 | Create Market 1
01:20 - 01:25 | Approve Market 1
01:25 - 01:30 | Activate Market 1
01:30 - 02:00 | Place 5 test bets
02:00 - 04:00 | Monitor market (wait for resolution)
04:00 - 04:10 | Propose outcome
04:10 - 04:15 | Finalize market
04:15 - 04:20 | Claim winnings
04:20 - 04:45 | Checkpoint 1 decision (GO/NO-GO for Market 2)
```

**Deliverable**: Market 1 complete, Checkpoint 1 decision documented

---

#### Hours 5-8 - Market 2 (LMSR Stress Test)
```
05:00 - 05:10 | Create, approve, activate Market 2
05:10 - 06:10 | Rapid betting sequence (20 bets)
06:10 - 07:00 | Monitor market, wait for Bitcoin block
07:00 - 07:10 | Check Bitcoin block, propose outcome
07:10 - 07:20 | Finalize market
07:20 - 07:30 | Validate payouts, claim winnings
07:30 - 08:00 | Checkpoint 2 decision (GO/NO-GO for Market 3)
```

**Deliverable**: Market 2 complete, Checkpoint 2 decision documented

---

#### Hours 9-20 - Market 3 (Edge Case Testing)
```
09:00 - 09:10 | Create, approve, activate Market 3
09:10 - 10:00 | Edge case bet sequence (6 special bets)
10:00 - 20:00 | Monitor market (12-hour wait for Ethereum price)
20:00 - 20:10 | Check ETH price, propose outcome
20:10 - 20:20 | Finalize market
20:20 - 20:30 | Validate edge case payouts
20:30 - 21:00 | Checkpoint 3 decision (GO/NO-GO for Market 4)
```

**Deliverable**: Market 3 complete, Checkpoint 3 decision documented

**Day 1 Summary**:
- 3 markets completed
- 3 checkpoints passed
- 21 hours runtime
- Team review and rest (Hours 21-24)

---

### Day 2 (Hours 24-48)

#### Hours 24-44 - Market 4 (Economic Attack Testing)
```
24:00 - 24:10 | Create, approve, activate Market 4
24:10 - 26:00 | Execute economic attack sequence (7 attack bets)
26:00 - 44:00 | Monitor market (24-hour wait for gold price)
44:00 - 44:10 | Check gold price, propose outcome
44:10 - 44:20 | Finalize market
44:20 - 44:30 | Validate attack resistance
44:30 - 45:00 | Checkpoint 4 decision (CRITICAL: GO/ABORT for Markets 5-6)
```

**Deliverable**: Market 4 complete, Checkpoint 4 decision documented

**CRITICAL CHECKPOINT**: If ANY exploit found, ABORT immediately. No Markets 5-6.

---

#### Hours 45-48 - Market 5 (Dispute Flow) + Rest
```
45:00 - 45:10 | Create, approve, activate Market 5
45:10 - 46:00 | Place bets
46:00 - 51:00 | Wait for resolution time (6 hours)
```

**Day 2 Summary**:
- Market 4 completed (economic attack)
- Market 5 in progress
- Checkpoint 4 passed (critical)
- Team rest during Market 5 wait

---

### Day 3 (Hours 48-72)

#### Hours 51-56 - Complete Market 5 + Market 6
```
51:00 - 51:10 | Propose controversial outcome (Market 5)
51:10 - 51:20 | Submit dispute signals (≥40% disagree)
51:20 - 51:30 | Validate auto-dispute triggered
51:30 - 51:40 | Admin finalize disputed market
51:40 - 52:00 | Validate Market 5 complete

52:00 - 52:10 | Create, approve, activate Market 6
52:10 - 53:00 | Place bets
53:00 - 58:00 | Wait for resolution time (6 hours)
58:00 - 58:10 | Propose clear outcome
58:10 - 58:20 | Submit agreement signals (≥75% agree)
58:20 - 58:30 | Validate auto-finalization triggered
58:30 - 59:00 | Checkpoint 5 decision (GO/NO-GO for final monitoring)
```

**Deliverable**: Markets 5-6 complete, Checkpoint 5 decision documented

---

#### Hours 59-72 - Final Monitoring + Decision
```
59:00 - 71:00 | Final 12-hour monitoring (no new markets)
                 - Every 15 min: Comprehensive health check
                 - Every 1 hour: Status report generation
                 - Continuous: System uptime monitoring

71:00 - 72:00 | Final checkpoint decision meeting
                 - Review all 6 markets
                 - Review all checkpoints
                 - Review cumulative metrics
                 - Team consensus
                 - Document final GO/NO-GO decision

72:00         | FINAL DECISION: Public launch or delay
```

**Deliverable**: Final GO/NO-GO decision documented with proof

---

### Timeline Flexibility

**Buffer Time**: Each market has 1-2 hour buffer for:
- Unexpected delays
- Team review time
- Documentation
- Breaks

**If Ahead of Schedule**: Use extra time for:
- Additional monitoring
- Deeper analysis
- Team review
- Documentation

**If Behind Schedule**: Acceptable to extend to 80-84 hours (but document why)

---

## 8. EMERGENCY PROTOCOLS

**Stop Conditions & Escalation Procedures**

---

### 8.1 Immediate Stop Conditions

**STOP ALL OPERATIONS if ANY of these occur**:

1. Transaction failure with unknown cause
2. State corruption detected
3. Fund loss or balance mismatch
4. LMSR pricing error >10%
5. Security vulnerability discovered
6. Critical error in logs
7. Attack exploit successful
8. Network completely down
9. Contract behaving unexpectedly
10. Team consensus to stop

**Action**: Execute emergency stop procedure (Section 8.2)

---

### 8.2 Emergency Stop Procedure

**Step 1: STOP** (Execute within 1 minute)
```bash
# 1. Stop all automated scripts
killall monitor-*.js

# 2. Do NOT create new markets or bets
# (Manual hold - no more transactions)

# 3. Alert entire team
scripts/emergency/send-critical-alert.js --message "EMERGENCY STOP TRIGGERED"
```

---

**Step 2: ASSESS** (Within 5 minutes)
```bash
# 1. Capture current state snapshot
scripts/emergency/capture-state-snapshot.js

# 2. Review recent transactions
scripts/emergency/review-recent-transactions.js

# 3. Check error logs
cat logs/phase4-validation/errors/*.log

# 4. Identify issue
# (Manual assessment by technical lead)
```

---

**Step 3: DOCUMENT** (Within 10 minutes)
```json
// Create emergency report
{
  "timestamp": "ISO-8601",
  "stopTrigger": "Description of what triggered stop",
  "currentState": "All market states, balances, etc.",
  "recentTransactions": "Last 10 transactions",
  "errorLogs": "Relevant error messages",
  "teamPresent": ["Names of team members"],
  "initialAssessment": "Technical lead's assessment"
}
```

---

**Step 4: DECIDE** (Within 30 minutes)

**Team Meeting**:
- Technical lead presents findings
- Assess severity: Critical / High / Medium
- Decide action:
  - **Fix and Resume**: Issue fixable within 1-4 hours
  - **Fix and Restart**: Issue requires restarting Phase 4
  - **Abort Deployment**: Issue requires major fix, re-audit, re-deploy

**Decision Documented**:
```json
{
  "decision": "FIX_AND_RESUME | FIX_AND_RESTART | ABORT_DEPLOYMENT",
  "severity": "CRITICAL | HIGH | MEDIUM",
  "fixRequired": "Description of fix",
  "estimatedTime": "1-4 hours | 1-3 days | 1-4 weeks",
  "approvedBy": ["Technical Lead", "Project Manager", "Security Reviewer"]
}
```

---

**Step 5: EXECUTE** (Varies by decision)

**If FIX AND RESUME**:
1. Implement fix
2. Test fix on fork
3. Resume from where stopped
4. Document in logs

**If FIX AND RESTART**:
1. Implement fix
2. Deploy fix to mainnet (new version)
3. Restart Phase 4 from Market 1
4. Document lessons learned

**If ABORT DEPLOYMENT**:
1. Emergency pause all contracts (if possible)
2. Notify stakeholders
3. Implement comprehensive fix
4. Full security re-audit
5. Re-deploy and restart entire validation

---

### 8.3 Escalation Matrix

**Level 1: LOW (Informational)**
- **Who Handles**: Monitoring scripts automatically
- **Notification**: Log only
- **Response Time**: Not urgent
- **Example**: Gas cost 1.2x estimate

---

**Level 2: MEDIUM (Monitor Closely)**
- **Who Handles**: Technical lead
- **Notification**: Slack/Discord notification
- **Response Time**: Review within 1 hour
- **Example**: Warning rate >5/hour

---

**Level 3: HIGH (Urgent Review)**
- **Who Handles**: Technical lead + project manager
- **Notification**: Slack/Discord urgent + phone
- **Response Time**: Review within 15 minutes
- **Example**: Gas cost 2x estimate

---

**Level 4: CRITICAL (Immediate Action)**
- **Who Handles**: Entire team
- **Notification**: All channels + phone calls
- **Response Time**: Immediate (within 1 minute)
- **Example**: Transaction failure, state corruption, fund loss

---

### 8.4 Communication Protocol

**Internal Communication**:
```
Slack Channels:
- #phase4-monitoring (all updates)
- #phase4-urgent (HIGH and CRITICAL alerts)
- #phase4-decisions (all checkpoint decisions)

Phone Tree:
1. Technical Lead (first contact)
2. Project Manager (second contact)
3. Security Reviewer (parallel to PM)
4. All team members (if CRITICAL)
```

**External Communication** (if needed):
```
Stakeholders:
- Notify if: Deployment delay >24 hours
- Method: Email update
- Frequency: Daily until resolved

Community:
- Notify if: Deployment canceled or major delay
- Method: Twitter/Discord announcement
- Content: High-level only, no technical details
```

---

### 8.5 Rollback Decision Tree

```
Issue Detected
    │
    ├─ Can fix in <1 hour?
    │   ├─ Yes → Fix and Resume (Level 2-3)
    │   └─ No → Escalate
    │
    ├─ Can fix in <4 hours?
    │   ├─ Yes → Fix and Resume (Level 3)
    │   └─ No → Escalate
    │
    ├─ Can fix in <1 day?
    │   ├─ Yes → Fix and Restart (Level 4)
    │   └─ No → Escalate
    │
    └─ Requires >1 day?
        └─ Abort Deployment (Level 4 CRITICAL)
```

---

## 🎯 EXECUTION READINESS CHECKLIST

**Before starting Market 1, verify ALL**:

- [ ] All 15 pre-execution validation steps PASSED
- [ ] All team members present and ready
- [ ] All monitoring scripts running
- [ ] All backup systems operational
- [ ] All documentation templates prepared
- [ ] Emergency procedures reviewed
- [ ] Communication channels active
- [ ] Decision-making authority clear
- [ ] Stop conditions understood
- [ ] Escalation contacts available

**Final GO Decision**: All checkboxes above must be checked.

**Approval**:
- Technical Lead: _______________ Date: ______
- Project Manager: ______________ Date: ______

---

## 📊 SUCCESS CRITERIA SUMMARY

**Phase 4 is ONLY successful if**:

1. ✅ All 6 markets complete successfully
2. ✅ All 6 checkpoints pass
3. ✅ 72+ hours stable operation
4. ✅ Zero critical errors
5. ✅ Zero medium errors
6. ✅ Gas costs <2x estimates
7. ✅ LMSR pricing accurate (±5%)
8. ✅ All state transitions correct
9. ✅ No security vulnerabilities
10. ✅ No economic exploits
11. ✅ Team confidence ≥9/10
12. ✅ All documentation complete

**If ALL 12 criteria met**: ✅ **GO FOR PUBLIC LAUNCH**

**If ANY criterion fails**: ❌ **NO-GO** → Fix issues, restart validation

---

**END OF BULLETPROOF PHASE 4 EXECUTION GUIDE**

This guide is designed to be executed mechanically with zero ambiguity. Follow each step exactly as written. Document every decision with proof. Build confidence for public launch through systematic validation.

🛡️ **Bulletproof = Cautious + Thorough + Systematic + Documented**

Good luck! 🚀
