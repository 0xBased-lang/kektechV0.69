# Test 002: Betting Flow - Small Amount (0.1 BASED)

## Metadata
- **Test ID**: Test-002
- **Date**: NOT STARTED
- **Tester**: -
- **Environment**: BasedAI Mainnet
- **Budget Allocated**: 0.15 BASED (0.1 bet + 0.05 gas buffer)
- **Actual Cost**: -
- **Prerequisite**: Test 001 completed successfully

## Objective
Validate betting mechanics with minimal risk (0.1 BASED bet). Verify LMSR pricing calculations, share issuance, and position tracking work correctly with small amounts.

## Prerequisites
- [ ] Test 001 completed with market created
- [ ] Market ID from Test 001: _____
- [ ] Market state = ACTIVE
- [ ] Wallet has ≥0.2 BASED
- [ ] Frontend `/markets/[id]` page accessible

## Test Configuration
**Market**: Market from Test 001
**Bet Parameters**:
```javascript
{
  marketId: "[from Test 001]",
  outcome: 0, // YES
  amount: parseEther("0.1") // 0.1 BASED
}
```

## Test Steps

### Step 1: Pre-Bet State
1. Record current market liquidity
2. Record YES/NO share distribution
3. Record current odds (YES%, NO%)
4. Record wallet balance
5. Screenshot market state

### Step 2: Calculate Expected Shares
1. Use LMSR formula to calculate expected shares
2. Expected: ~5-10 shares for 0.1 BASED (depends on liquidity)
3. Calculate expected price impact
4. Note: Should be minimal (<1%) for small bet

### Step 3: Place Bet (YES Outcome)
1. Navigate to market detail page
2. Select YES outcome
3. Enter amount: 0.1 BASED
4. Review share estimate in UI
5. Click "Place Bet"
6. Approve transaction in wallet
7. Record transaction hash
8. Wait for confirmation

### Step 4: Verify Transaction Success
1. Transaction status = Success
2. Gas used ≈ 100,000 gas
3. No revert errors
4. BetPlaced event emitted

### Step 5: Verify Share Issuance
1. Read user position from contract
2. Shares received matches estimate (±0.5%)
3. Frontend displays updated position
4. Position card shows:
   - YES shares: [amount]
   - Value: [current market value]
   - Cost basis: 0.1 BASED

### Step 6: Verify Market State Update
1. Market liquidity increased by 0.1 BASED
2. YES share percentage increased slightly
3. NO share percentage decreased slightly
4. Odds updated correctly
5. Frontend displays updated market stats

### Step 7: Verify Price Impact
1. Calculate actual price movement
2. Should be <1% for 0.1 BASED bet
3. LMSR curve maintained correctly

## Execution Log
[Record detailed execution steps with timestamps]

## Results
- **Overall**: ⏸️ NOT STARTED
- **Metrics**:
  - Gas used: - (expected: ~100k)
  - Shares received: - (expected: ~5-10)
  - Price impact: - (expected: <1%)
  - Total cost: - BASED

## Verification Checklist
- [ ] Transaction succeeded
- [ ] Shares issued correctly
- [ ] Position visible in frontend
- [ ] Market liquidity increased
- [ ] Odds updated correctly
- [ ] Gas usage acceptable
- [ ] BetPlaced event emitted
- [ ] No console errors

## Next Steps
- **If PASS**: Proceed to Test 003 (varied bet amounts)
- **If FAIL**: Document issue, fix, re-test

---
**Status**: ⏸️ NOT STARTED | **Last Updated**: 2025-11-07
