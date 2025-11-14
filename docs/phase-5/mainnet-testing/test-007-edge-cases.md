# Test 007: Edge Cases & Stress Testing

## Metadata
- **Test ID**: Test-007
- **Date**: NOT STARTED
- **Tester**: -
- **Environment**: BasedAI Mainnet
- **Budget Allocated**: 1.5 BASED (various edge case tests)
- **Actual Cost**: -
- **Prerequisites**: All previous tests completed

## Objective
Test unusual but valid scenarios to ensure robustness:
- Zero liquidity markets
- Single-sided betting
- Rapid consecutive bets
- Invalid operations
- Boundary conditions
- Recovery scenarios

## Test Budget Breakdown
```
Edge Case 1: Zero liquidity       → 0.1 BASED
Edge Case 2: Single-sided bets    → 0.5 BASED
Edge Case 3: Rapid bet spam       → 0.5 BASED
Edge Case 4: Boundary tests       → 0.2 BASED
Edge Case 5: Invalid operations   → 0.0 BASED (gas only)
Edge Case 6: Recovery scenarios   → 0.2 BASED
Reserve: 0.0 BASED
```

## Edge Cases

### Edge Case 1: Zero Liquidity Market
**Scenario**: Market created, no bets placed, then resolved

**Objective**: Verify system handles markets with no liquidity

**Steps**:
1. Create new market with 0.1 BASED bond
2. Do NOT place any bets
3. Wait for resolution date (or use test market with immediate resolution)
4. Resolve market to YES
5. Verify resolution succeeds
6. Verify no winners (no bets)
7. Verify creator bond refunded

**Expected Results**:
- Resolution succeeds even with zero bets
- No payout calculations needed
- Market state = FINALIZED
- Creator receives bond back
- No errors or reverts

**Verification**:
- [ ] Resolution transaction succeeded
- [ ] Market finalized correctly
- [ ] Bond refunded to creator
- [ ] No unexpected errors

---

### Edge Case 2: Single-Sided Market (All YES)
**Scenario**: All bets on same outcome, resolve to that outcome

**Objective**: Verify proportional distribution when all bets same side

**Steps**:
1. Create new market
2. Place 5 bets ALL on YES:
   - User A: 0.1 BASED YES
   - User B: 0.1 BASED YES
   - User C: 0.1 BASED YES
   - User D: 0.1 BASED YES
   - User E: 0.1 BASED YES
   Total: 0.5 BASED, all YES
3. Resolve market to YES
4. Calculate expected payouts:
   - Each user: (0.1 / 0.5) × 0.5 = 0.1 BASED
   - Net profit: 0 BASED each (break even)

**Expected Results**:
- All users receive their money back (break even)
- No profit since no counter-bets
- Payouts proportional to stake
- System handles this gracefully

**Verification**:
- [ ] All users can claim
- [ ] Each receives their original stake back
- [ ] No profit/loss (as expected)
- [ ] Math checks out

---

### Edge Case 3: Rapid Consecutive Bets
**Scenario**: Submit 10 bets in quick succession

**Objective**: Test system under rapid transaction load

**Steps**:
1. Create new market
2. Prepare 10 bet transactions
3. Submit all in rapid succession (within 30 seconds)
4. Monitor transaction pool
5. Wait for all confirmations
6. Verify all bets processed correctly

**Expected Results**:
- All transactions succeed (no nonce conflicts)
- Price updates correctly for each bet
- No race conditions
- Gas costs remain consistent
- LMSR curve maintained throughout

**Verification**:
- [ ] All 10 bets succeeded
- [ ] Correct order preserved
- [ ] Price discovery accurate
- [ ] No reverts or errors
- [ ] Gas costs stable

---

### Edge Case 4: Boundary Conditions

#### 4A: Maximum Bet Size
**Test**: Place bet with large amount (e.g., 10 BASED)
- Verify shares calculated correctly
- Verify price impact significant but not breaking
- Verify no overflow errors

#### 4B: Minimum Bet Size
**Test**: Place bet with minimum allowed (e.g., 0.01 BASED)
- Verify shares > 0
- Verify position tracked correctly
- Verify claim works for tiny amounts

#### 4C: Maximum Market Lifetime
**Test**: Market with very far future date (e.g., 10 years)
- Verify timestamp handling correct
- Verify countdown displays correctly
- Verify no overflow in date calculations

#### 4D: Minimum Market Lifetime
**Test**: Market with very near date (e.g., 1 hour)
- Verify can still bet
- Verify resolution triggers on time
- Verify dispute window works correctly

**Verification**:
- [ ] Large bets work correctly
- [ ] Small bets work correctly
- [ ] Long-term markets work
- [ ] Short-term markets work
- [ ] No boundary overflow errors

---

### Edge Case 5: Invalid Operations (Should Fail)

#### 5A: Bet After Resolution Date
**Test**: Try to bet on market past resolution date
- **Expected**: Revert "Market closed" or "Betting period ended"
- **Verify**: Frontend prevents this

#### 5B: Claim Before Finalization
**Test**: Try to claim while market in RESOLVING
- **Expected**: Revert "Market not finalized"
- **Verify**: Frontend disables claim button

#### 5C: Bet on FINALIZED Market
**Test**: Try to bet on finalized market
- **Expected**: Revert "Market finalized"
- **Verify**: Market not shown in active list

#### 5D: Create Market with Invalid Parameters
**Test**: Try to create with resolution date in past
- **Expected**: Revert "Invalid resolution date"
- **Verify**: Frontend validation catches this

#### 5E: Bet with Insufficient Balance
**Test**: Try to bet more than wallet balance
- **Expected**: Revert "Insufficient balance"
- **Verify**: Frontend shows balance warning

**Verification**:
- [ ] All invalid operations correctly rejected
- [ ] Appropriate error messages
- [ ] Frontend prevents where possible
- [ ] Contract protection as fallback

---

### Edge Case 6: Recovery Scenarios

#### 6A: Failed Transaction Recovery
**Test**: Transaction fails (out of gas, rejected)
- Verify state unchanged
- Verify can retry transaction
- Verify no funds lost

#### 6B: Partial State Update
**Test**: If possible, test interrupted state change
- Verify atomicity (all or nothing)
- Verify no corrupted state

#### 6C: Network Disconnect During Bet
**Test**: Submit bet, disconnect network mid-transaction
- Reconnect and verify transaction status
- Verify either: succeeded, pending, or failed (no limbo)
- Verify can recover from any state

**Verification**:
- [ ] Failed transactions recoverable
- [ ] State remains consistent
- [ ] No funds lost in failures
- [ ] Retry mechanism works

---

## Stress Test: Gas Costs Across Scenarios

**Objective**: Verify gas costs scale reasonably

| Operation | Expected Gas | Actual Gas | Variance |
|-----------|--------------|------------|----------|
| Create market | 700k | - | - |
| First bet | 110k | - | - |
| Nth bet (N>1) | 95k | - | - |
| State change | 80k | - | - |
| Dispute raise | 150k | - | - |
| Claim winnings | 100k | - | - |
| Batch claim (5) | 400k | - | - |

**Verification**:
- [ ] Gas costs within ±10% of estimates
- [ ] No unexpected spikes
- [ ] Subsequent bets cheaper (storage savings)
- [ ] Batch operations more efficient

---

## Execution Log
[Detailed execution of all edge cases]

## Results Summary
- **Overall**: ⏸️ NOT STARTED
- **Edge Cases Tested**: 0 / 15+
- **Edge Cases Passed**: -
- **Critical Issues Found**: -
- **Total Spent**: _____ BASED

## Verification Checklist
- [ ] Zero liquidity market works
- [ ] Single-sided betting works
- [ ] Rapid consecutive bets work
- [ ] Boundary conditions handled
- [ ] Invalid operations rejected
- [ ] Recovery scenarios work
- [ ] Gas costs acceptable
- [ ] No unexpected errors
- [ ] All edge cases documented

## Critical Findings
[Any critical issues that must be fixed before launch]

## Non-Critical Findings
[Issues that can be addressed post-launch]

## Next Steps
- **If PASS**: Mainnet testing complete! Proceed to page building (Day 5)
- **If FAIL**: Document issues, prioritize fixes, re-test

---
**Status**: ⏸️ NOT STARTED | **Last Updated**: 2025-11-07
