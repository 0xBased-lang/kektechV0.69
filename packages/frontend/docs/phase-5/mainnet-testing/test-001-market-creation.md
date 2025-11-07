# Test 001: Market Creation - Minimal Bond

## Metadata
- **Test ID**: Test-001
- **Date**: NOT STARTED
- **Tester**: -
- **Environment**: BasedAI Mainnet (Chain ID: 32323)
- **Budget Allocated**: 0.15 BASED (0.1 bond + 0.05 gas buffer)
- **Actual Cost**: -

## Objective
Validate that FlexibleMarketFactoryUnified creates prediction markets correctly with minimal bond (0.1 BASED).

**Why This Test Matters**: This is the first real transaction on mainnet. It validates that our factory contract is working correctly and that all market creation parameters are properly configured.

## Prerequisites
- [ ] Wallet has ≥0.2 BASED (for bond + gas + buffer)
- [ ] Factory contract deployed at: `0x3eaF643482Fe35d13DB812946E14F5345eb60d62`
- [ ] VersionedRegistry deployed at: `0x67F8F023f6cFAe44353d797D6e0B157F2579301A`
- [ ] Wallet connected to BasedAI Mainnet
- [ ] Frontend `/create` page accessible (or direct contract interaction)

## Test Configuration

**Market Parameters**:
```javascript
{
  question: "Will BASED token reach $1 by December 31, 2025?",
  description: "Test market for Phase 5 validation. This market will resolve to YES if BASED token (contract 0x...) reaches $1.00 USD on CoinGecko by December 31, 2025 23:59 UTC. Resolution source: CoinGecko daily close price.",
  category: "Crypto",
  resolutionDate: 1735689599, // Dec 31, 2025 23:59 UTC (Unix timestamp)
  bond: parseEther("0.1"), // 0.1 BASED
  curveId: 0, // Default LMSR curve
  curveParams: [], // Default parameters
  metadata: "" // No additional metadata
}
```

## Test Steps

### Step 1: Prepare Transaction
**Expected**: Market config assembled correctly, wallet has sufficient funds

1. Open frontend `/create` page or prepare contract call
2. Fill in market parameters (above)
3. Verify bond amount: 0.1 BASED
4. Check wallet balance ≥ 0.2 BASED
5. Review estimated gas: ~700,000 gas (~0.0007 BASED)

### Step 2: Submit Market Creation
**Expected**: Transaction succeeds, market ID returned

1. Click "Create Market" or call `factory.createMarket(config, {value: bond})`
2. Approve transaction in wallet (MetaMask/WalletConnect)
3. Wait for transaction confirmation (1-2 blocks)
4. Record transaction hash
5. Verify transaction status: Success

### Step 3: Verify Market Registration
**Expected**: Market appears in VersionedRegistry, has correct state

1. Get market ID from transaction receipt
2. Check VersionedRegistry for market address
3. Verify market state = PROPOSED or ACTIVE
4. Verify bond locked = 0.1 BASED
5. Verify creator role assigned correctly

### Step 4: Verify Market Parameters
**Expected**: All parameters match input

1. Read market.question → matches input
2. Read market.description → matches input
3. Read market.category → matches input
4. Read market.resolutionDate → matches input
5. Read market.creator → matches wallet address

### Step 5: Verify Events Emitted
**Expected**: MarketCreated event emitted with correct data

1. Check transaction logs for `MarketCreated` event
2. Verify event parameters:
   - marketId: matches returned ID
   - creator: matches wallet address
   - question: matches input
   - bond: 0.1 BASED

## Execution Log

**[Date/Time]** - Pre-test preparation
- [ ] Wallet balance checked: ___ BASED
- [ ] Contracts deployed and verified
- [ ] Frontend accessible

**[Date/Time]** - Step 1: Prepare Transaction
- Transaction: -
- Result: ⏸️ NOT STARTED
- Notes: -

**[Date/Time]** - Step 2: Submit Market Creation
- Transaction: 0x... (link)
- Result: -
- Gas used: -
- Gas estimated: 700,000
- Variance: -
- Notes: -

**[Date/Time]** - Step 3: Verify Registration
- Market ID: -
- Market Address: -
- State: -
- Bond locked: -
- Notes: -

**[Date/Time]** - Step 4: Verify Parameters
- All parameters match: -
- Notes: -

**[Date/Time]** - Step 5: Verify Events
- MarketCreated event found: -
- Event data correct: -
- Notes: -

## Results

- **Overall**: ⏸️ NOT STARTED / ✅ PASS / ❌ FAIL / ⚠️ PARTIAL
- **Metrics**:
  - Gas used: - (expected: 700,000, variance: -)
  - Cost: - BASED (expected: 0.1007 BASED)
  - Time taken: - minutes
  - Block confirmations: -
- **Evidence**:
  - Screenshots: `docs/phase-5/evidence/screenshots/test-001-*.png`
  - Transaction log: `docs/phase-5/evidence/transaction-logs/test-001-tx.json`
  - Video: (optional)

## Issues Found

[None yet - will be logged if issues discovered]

## Verification Checklist

- [ ] Transaction succeeded
- [ ] Market created with correct ID
- [ ] Market registered in VersionedRegistry
- [ ] State is correct (PROPOSED or ACTIVE)
- [ ] Bond locked correctly (0.1 BASED)
- [ ] Creator role assigned
- [ ] All parameters match input
- [ ] MarketCreated event emitted
- [ ] Frontend displays new market (if using UI)
- [ ] No unexpected errors in console
- [ ] Documented in MASTER_LOG.md
- [ ] Documented in TESTING_LOG.md
- [ ] Screenshots saved
- [ ] Transaction log exported

## Next Steps

**If PASS**:
- [ ] Proceed to Test 002: Betting Flow - Small Amount
- [ ] Use this market ID for betting tests

**If FAIL**:
- [ ] Create Issue Report (ISSUE_TRACKER.md)
- [ ] Document root cause investigation
- [ ] Implement fix (FIX_LOG.md)
- [ ] Re-run Test 001
- [ ] Extract lesson (LESSONS_LEARNED.md)

## Notes & Observations

[Space for any additional observations during testing]

---

**Test Status**: ⏸️ NOT STARTED
**Last Updated**: 2025-11-07 23:15 PST
