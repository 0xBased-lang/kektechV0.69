# Test 006: Claiming Winnings & Payout Validation

## Metadata
- **Test ID**: Test-006
- **Date**: NOT STARTED
- **Tester**: -
- **Environment**: BasedAI Mainnet
- **Budget Allocated**: 0.1 BASED (gas fees for claims)
- **Actual Cost**: -
- **Prerequisites**: Tests 001-005 completed, market FINALIZED with outcome

## Objective
Validate winner payout calculations:
- Correct payout amounts calculated
- Claim transactions succeed
- BASED transferred correctly
- Positions marked as claimed
- Cannot claim twice
- Losers cannot claim

## Test Configuration
**Market**: From previous tests (FINALIZED state)
**Outcome**: YES (example - will vary based on actual resolution)
**Test Positions**:
- Position A: 10 YES shares (winner)
- Position B: 5 NO shares (loser)

## Test Steps

### Phase 1: Pre-Claim Verification
**Before any claims, verify state**

1. Confirm market state = FINALIZED
2. Confirm outcome determined (YES or NO)
3. Read user position:
   - YES shares: _____
   - NO shares: _____
4. Calculate expected payout:
   ```
   If YES won:
     Payout = (user_YES_shares / total_YES_shares) × total_liquidity
   If NO won:
     Payout = (user_NO_shares / total_NO_shares) × total_liquidity
   ```
5. Record current wallet balance
6. Verify claim button enabled for winning shares
7. Verify claim button disabled for losing shares

### Phase 2: Calculate Expected Payout
**Use market data to predict exact payout**

**Example Calculation** (if YES won):
```javascript
Total liquidity: 5.0 BASED
User YES shares: 10
Total YES shares: 50

Expected payout = (10 / 50) × 5.0 = 1.0 BASED

User profit = 1.0 - 0.5 (original bet) = 0.5 BASED profit
```

**Record**:
- Expected payout: _____ BASED
- Original cost basis: _____ BASED
- Expected profit/loss: _____ BASED

### Phase 3: Claim Winnings (Winner)
**Test claiming with winning shares**

1. Navigate to `/portfolio` page
2. Locate finalized market in "Claimable Winnings" section
3. Verify claim button shows amount: "Claim X.XX BASED"
4. Click "Claim" button
5. Review transaction details in wallet
6. Approve transaction
7. Wait for confirmation
8. Record transaction hash

### Phase 4: Verify Claim Success
**Confirm payout received correctly**

1. Transaction status = Success
2. Gas used ≈ 100,000 gas
3. WinningsClaimed event emitted with:
   - marketId
   - user address
   - amount claimed
4. Wallet balance increased by payout amount
5. Position marked as "Claimed" in frontend
6. Position removed from "Claimable" section
7. Appears in transaction history

### Phase 5: Verify Cannot Claim Twice
**Prevent double-claiming exploit**

1. Try to claim same position again
2. Expected: Revert with "Already claimed"
3. Frontend: Claim button disabled or shows "Claimed ✓"
4. Transaction not even sent (prevented by frontend)

### Phase 6: Verify Losers Cannot Claim
**Test with losing shares (if available)**

1. Switch to account with losing shares (NO shares if YES won)
2. Navigate to `/portfolio`
3. Verify market shows in "Positions" but not "Claimable"
4. Verify claim button disabled or not shown
5. If try to claim directly via contract:
   Expected: Revert "No winnings to claim"

### Phase 7: Batch Claim (If Multiple Markets)
**Test "Claim All" functionality**

If multiple markets have claimable winnings:
1. Verify all shown in "Claimable Winnings" section
2. Click "Claim All Winnings" button
3. Review batch transaction
4. Approve transaction
5. Verify all claims processed
6. Verify total amount received = sum of all payouts
7. Verify all positions marked as claimed

### Phase 8: Payout Accuracy Verification
**Ensure math is exactly correct**

1. Compare actual payout to expected (from Phase 2)
2. Acceptable variance: ±0.01% (rounding only)
3. If variance > 0.01%, investigate calculation error
4. Document any discrepancies

**Example**:
```
Expected: 1.0000 BASED
Received: 0.9998 BASED
Variance: -0.02% (acceptable - rounding)

Expected: 1.0000 BASED
Received: 0.9500 BASED
Variance: -5.0% (NOT ACCEPTABLE - issue!)
```

## Execution Log
[Detailed execution with timestamps and amounts]

## Results
- **Overall**: ⏸️ NOT STARTED
- **Payout Expected**: _____ BASED
- **Payout Received**: _____ BASED
- **Variance**: _____%
- **Gas Used**: _____
- **Total Cost**: _____ BASED (gas only)

## Edge Cases

### Edge Case 1: Zero Winnings
**Scenario**: User bet on winning side but amount rounds to 0
1. Test with tiny position (0.01 shares)
2. Expected: Either claim 0.00001 BASED or revert "No winnings"

### Edge Case 2: Claim During Resolution
**Scenario**: Try to claim while market still in RESOLVING
1. Verify claim disabled
2. Expected: Revert "Market not finalized"

### Edge Case 3: Partial Winner
**Scenario**: User has both YES and NO shares
1. YES wins → Can claim YES portion
2. NO shares worthless
3. Frontend shows only claimable (YES) amount

## Verification Checklist
- [ ] Expected payout calculated correctly
- [ ] Claim transaction succeeded
- [ ] Correct amount received
- [ ] Gas costs acceptable (~100k)
- [ ] WinningsClaimed event emitted
- [ ] Position marked as claimed
- [ ] Cannot claim twice (prevented)
- [ ] Losers cannot claim (prevented)
- [ ] Batch claim works (if applicable)
- [ ] Payout accuracy within 0.01%
- [ ] Frontend updates correctly
- [ ] Transaction in history

## Economic Verification
- [ ] Creator bond refunded (if market resolved fairly)
- [ ] Platform fees deducted correctly (if applicable)
- [ ] Liquidity conservation: Total paid out ≤ Total liquidity
- [ ] Winners receive proportional share
- [ ] No BASED created or destroyed unexpectedly

## Next Steps
- **If PASS**: Test 007 (edge cases)
- **If FAIL**: Document payout calculation errors

---
**Status**: ⏸️ NOT STARTED | **Last Updated**: 2025-11-07
