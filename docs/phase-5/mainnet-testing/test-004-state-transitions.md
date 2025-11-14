# Test 004: Market State Transitions (Full Lifecycle)

## Metadata
- **Test ID**: Test-004
- **Date**: NOT STARTED
- **Tester**: -
- **Environment**: BasedAI Mainnet
- **Budget Allocated**: 1.0 BASED (gas fees for state changes)
- **Actual Cost**: -
- **Prerequisites**: Tests 001-003 completed

## Objective
Validate complete market lifecycle state machine:
```
PROPOSED → ACTIVE → RESOLVING → FINALIZED
         ↓
      REJECTED (alternative path)
```

## Test Configuration
**New Market Created**: For clean state transition testing
**Timeline**:
- T+0: Create market (PROPOSED)
- T+1min: Approve market (→ ACTIVE) or wait 24h for auto-approval
- T+betting: Place bets while ACTIVE
- T+resolution: Pass resolution date (→ RESOLVING)
- T+48h: Dispute window closes (→ FINALIZED)

## Test Steps

### State 0: PROPOSED
**Trigger**: Market creation (Test 001)
**Expected Behavior**:
- New market created
- State = PROPOSED (0)
- Betting disabled
- Market visible but not tradable

**Verification**:
1. Read market.state → 0 (PROPOSED)
2. Try to bet → Should revert "Market not active"
3. Frontend shows "Pending Approval" badge
4. Market appears in "Proposed" filter

### State 1: ACTIVE
**Trigger**: Admin approval OR 24-hour auto-approval
**Expected Behavior**:
- State = ACTIVE (1)
- Betting enabled
- Market appears in main list
- Resolution countdown starts

**Test Path A - Manual Approval** (If admin role available):
1. Call `approveMarket(marketId)` from admin account
2. Transaction succeeds
3. State changes to ACTIVE
4. StateChanged event emitted

**Test Path B - Auto-Approval** (If timer implemented):
1. Wait 24 hours OR fast-forward time in test
2. Check state automatically transitions
3. No transaction needed

**Verification**:
1. Read market.state → 1 (ACTIVE)
2. Place test bet → Should succeed
3. Frontend shows "Active" badge
4. Countdown timer displays correctly

### State 2: RESOLVING
**Trigger**: Resolution date passes
**Expected Behavior**:
- State = RESOLVING (2)
- Betting disabled
- 48-hour dispute window begins
- Market outcome determined but not finalized

**Test**:
1. Wait for resolution date to pass (or use test market with near date)
2. Call resolution function or auto-transition
3. Verify state changes to RESOLVING

**Verification**:
1. Read market.state → 2 (RESOLVING)
2. Try to bet → Should revert "Market closed"
3. Frontend shows "Resolving" badge
4. Dispute timer shows 48 hours remaining

### State 3: FINALIZED
**Trigger**: 48-hour dispute window expires with no disputes
**Expected Behavior**:
- State = FINALIZED (3)
- Outcome locked
- Winners can claim payouts
- Market immutable

**Test**:
1. Wait 48 hours after RESOLVING (or use test market)
2. Call finalize function or auto-transition
3. Verify state changes to FINALIZED

**Verification**:
1. Read market.state → 3 (FINALIZED)
2. Try to bet → Should revert "Market finalized"
3. Try to claim → Should succeed (Test 006)
4. Frontend shows "Finalized" badge with outcome
5. Outcome display: "Resolved: YES" or "Resolved: NO"

### Alternative State 4: REJECTED (Optional)
**Trigger**: Admin rejects during PROPOSED
**Expected Behavior**:
- Market never becomes active
- Creator bond returned
- Market removed from active list

**Test** (If rejection implemented):
1. Create market
2. Admin calls `rejectMarket(marketId)`
3. Verify state = REJECTED
4. Verify bond refunded

## State Transition Matrix

| From | To | Trigger | Transaction | Gas Est. |
|------|----|---------|-----------| ---------|
| PROPOSED | ACTIVE | approve() | Yes | ~50k |
| PROPOSED | REJECTED | reject() | Yes | ~30k |
| ACTIVE | RESOLVING | time passes | Auto or manual | ~80k |
| RESOLVING | FINALIZED | 48h + no disputes | Auto or manual | ~100k |
| RESOLVING | DISPUTED | dispute raised | Yes | ~150k |

## Execution Log
[Document each state transition with timestamps]

## Results
- **Overall**: ⏸️ NOT STARTED
- **All Transitions Tested**: -
- **Total Gas Used**: -
- **Issues Found**: -

## Verification Checklist
- [ ] PROPOSED state works correctly
- [ ] ACTIVE state enables betting
- [ ] RESOLVING state disables betting
- [ ] FINALIZED state enables claiming
- [ ] All StateChanged events emitted
- [ ] Frontend displays correct badges
- [ ] Betting disabled at appropriate states
- [ ] Claiming enabled at FINALIZED
- [ ] No unexpected state transitions
- [ ] Gas costs acceptable

## Next Steps
- **If PASS**: Test 005 (dispute flow)
- **If FAIL**: Document state machine issues

---
**Status**: ⏸️ NOT STARTED | **Last Updated**: 2025-11-07
