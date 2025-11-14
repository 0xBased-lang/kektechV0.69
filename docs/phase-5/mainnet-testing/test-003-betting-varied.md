# Test 003: Betting Flow - Varied Amounts (4.0 BASED Total)

## Metadata
- **Test ID**: Test-003
- **Date**: NOT STARTED
- **Tester**: -
- **Environment**: BasedAI Mainnet
- **Budget Allocated**: 4.5 BASED (4.0 bets + 0.5 gas buffer)
- **Actual Cost**: -
- **Prerequisites**: Tests 001-002 completed

## Objective
Test LMSR curve pricing under different bet sizes. Validate that:
- Small bets have minimal price impact
- Large bets move prices significantly
- Pricing remains mathematically correct across all sizes
- No arbitrage opportunities exist

## Test Configuration
**5 Sequential Bets**:
```javascript
Bet A: 0.1 BASED on YES  (small)
Bet B: 0.5 BASED on NO   (medium)
Bet C: 1.0 BASED on YES  (large)
Bet D: 0.5 BASED on YES  (medium)
Bet E: 2.0 BASED on NO   (large)
Total: 4.1 BASED
```

## Test Steps

### Before All Bets
1. Record initial market state:
   - Total liquidity: _____
   - YES shares: _____
   - NO shares: _____
   - YES odds: _____% | NO odds: _____%

### Bet A: Small YES (0.1 BASED)
**Expected**: Minimal price movement (<1%)
1. Place bet
2. Record: shares received, new odds, gas used
3. Verify price impact < 1%

### Bet B: Medium NO (0.5 BASED)
**Expected**: Moderate price movement (2-5%)
1. Place bet (opposite direction from Bet A)
2. Record: shares received, new odds, gas used
3. Verify price impact 2-5%
4. Verify YES odds decreased from Bet A

### Bet C: Large YES (1.0 BASED)
**Expected**: Significant price movement (5-10%)
1. Place bet (largest so far)
2. Record: shares received, new odds, gas used
3. Verify price impact 5-10%
4. Verify diminishing returns (shares per BASED decreased)

### Bet D: Medium YES (0.5 BASED)
**Expected**: Reduced share issuance (higher price now)
1. Place bet (same direction as Bet C)
2. Record: shares received compared to Bet B
3. Verify: Receives fewer shares than Bet B (same amount, higher price)

### Bet E: Large NO (2.0 BASED)
**Expected**: Major price correction (10-20%)
1. Place bet (largest bet, opposite direction)
2. Record: shares received, final odds, gas used
3. Verify: Strong price movement toward NO
4. Verify: Market rebalances after heavy YES bias

### After All Bets
1. Record final market state
2. Verify total liquidity = initial + 4.1 BASED
3. Verify LMSR invariant maintained
4. Calculate total shares issued vs liquidity

## Price Discovery Validation

**Expected Behavior**:
```
Initial:  YES 50% | NO 50%
After A:  YES 51% | NO 49%  (+1% YES)
After B:  YES 48% | NO 52%  (-3% YES, NO gained)
After C:  YES 56% | NO 44%  (+8% YES, large bet)
After D:  YES 59% | NO 41%  (+3% YES, stacking)
After E:  YES 45% | NO 55%  (-14% YES, 2.0 NO reversal)
```

## Execution Log
[Detailed execution with timestamps and transaction hashes]

## Results
- **Overall**: ⏸️ NOT STARTED
- **Total Spent**: - BASED
- **Total Shares**: - (across all bets)
- **Final Odds**: YES __% | NO __%
- **Price Impact Range**: Min __% | Max __%

## Analysis Questions
- [ ] Do large bets move price proportionally more?
- [ ] Are diminishing returns evident (less shares per BASED as price rises)?
- [ ] Does LMSR prevent arbitrage?
- [ ] Is gas usage consistent regardless of bet size?
- [ ] Do rapid consecutive bets work correctly?

## Verification Checklist
- [ ] All 5 bets succeeded
- [ ] Price discovery working correctly
- [ ] Larger bets had larger price impact
- [ ] No mathematical errors in share calculations
- [ ] Market balanced correctly after opposing bets
- [ ] Gas costs scaled reasonably
- [ ] All events emitted correctly

## Next Steps
- **If PASS**: Test 004 (state transitions)
- **If FAIL**: Document issue, analyze LMSR math

---
**Status**: ⏸️ NOT STARTED | **Last Updated**: 2025-11-07
