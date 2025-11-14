# Test 005: Dispute Flow & Community Governance

## Metadata
- **Test ID**: Test-005
- **Date**: NOT STARTED
- **Tester**: -
- **Environment**: BasedAI Mainnet
- **Budget Allocated**: 0.6 BASED (0.5 stake + 0.1 gas)
- **Actual Cost**: -
- **Prerequisites**: Test 004 (market in RESOLVING state)

## Objective
Validate community dispute mechanism:
- Users can challenge incorrect resolutions
- Dispute stake locks correctly
- Market enters DISPUTED state
- Community signaling works
- Admin review process functions

## Test Configuration
**Market**: From Test 004 (in RESOLVING state)
**Dispute Stake**: 0.5 BASED (configurable)
**Dispute Reason**: "Resolution incorrect based on documented criteria"

## Test Steps

### Phase 1: Market Resolution (Setup)
**Prerequisite**: Market must be in RESOLVING state with outcome determined

1. Verify market state = RESOLVING
2. Note the resolved outcome (YES or NO)
3. Check 48-hour dispute window active
4. Record current timestamp

### Phase 2: Raise Dispute
**Who Can Dispute**: Any user (not just bettors)
**When**: Within 48-hour window after resolution

1. Navigate to market detail page
2. Click "Dispute Resolution" button
3. Enter dispute reason: "Resolution incorrect - [specific reason]"
4. Review required stake: 0.5 BASED
5. Submit dispute transaction
6. Approve in wallet
7. Record transaction hash

### Phase 3: Verify Dispute Registered
**Expected**: Market enters DISPUTED state, stake locked

1. Transaction succeeds
2. Read market.state → 4 (DISPUTED)
3. Dispute stake transferred and locked
4. DisputeRaised event emitted with:
   - marketId
   - disputor address
   - stake amount
   - timestamp
5. Frontend displays "DISPUTED" badge
6. Resolution paused

### Phase 4: Community Signaling (If Implemented)
**Purpose**: Let community signal agreement with dispute

1. Other users can signal support for dispute
2. Signal "Dispute Valid" or "Resolution Correct"
3. Votes recorded on-chain or off-chain
4. Signals visible in frontend

**Test**:
1. From different wallet, signal support for dispute
2. Verify signal recorded
3. Frontend shows community sentiment

### Phase 5: Admin Review
**Expected**: Admin reviews evidence, makes final decision

**Possible Outcomes**:
- **A**: Admin agrees with dispute → Outcome changed → Disputor stake returned + reward
- **B**: Admin rejects dispute → Original outcome stands → Disputor loses stake
- **C**: Admin inconclusive → Further review or default to original

**Test**:
1. Admin reviews dispute reason
2. Admin checks resolution source (CoinGecko, etc.)
3. Admin makes determination
4. Admin calls `resolveDispute(marketId, decision)`
5. Transaction succeeds

### Phase 6: Dispute Resolution Finalization
**Expected**: Market returns to FINALIZED with final outcome

1. Market state → FINALIZED
2. Outcome locked (possibly changed)
3. Disputor stake handled appropriately:
   - If dispute valid: Stake returned + reward
   - If dispute invalid: Stake slashed/redistributed
4. DisputeResolved event emitted
5. Winners can now claim based on final outcome

### Phase 7: Verify Dispute Economics
**If Dispute Valid**:
- Disputor receives: 0.5 BASED stake back + reward
- Market outcome corrected
- Original bettors on correct side can claim

**If Dispute Invalid**:
- Disputor loses: 0.5 BASED stake
- Stake redistributed to original winners
- Original outcome stands

## Edge Cases to Test

### Edge Case 1: Multiple Disputes
**Scenario**: What if 2+ users dispute?
1. First dispute succeeds
2. Try second dispute while first active
3. Expected: Revert "Already disputed" OR allow with separate tracking

### Edge Case 2: Dispute After Window
**Scenario**: Try to dispute after 48 hours
1. Wait for dispute window to expire
2. Try to raise dispute
3. Expected: Revert "Dispute window closed"

### Edge Case 3: Dispute with Insufficient Stake
**Scenario**: Try to dispute with less than required stake
1. Call dispute with 0.4 BASED (< 0.5 required)
2. Expected: Revert "Insufficient dispute stake"

## Execution Log
[Detailed execution with timestamps]

## Results
- **Overall**: ⏸️ NOT STARTED
- **Dispute Raised**: -
- **Dispute Outcome**: -
- **Stake Handled**: -
- **Final Market State**: -

## Verification Checklist
- [ ] Dispute transaction succeeded
- [ ] Market entered DISPUTED state
- [ ] Dispute stake locked correctly
- [ ] DisputeRaised event emitted
- [ ] Frontend displays dispute status
- [ ] Community signaling works (if implemented)
- [ ] Admin review process functional
- [ ] Dispute resolved appropriately
- [ ] Market finalized with correct outcome
- [ ] Stake handled according to outcome
- [ ] DisputeResolved event emitted

## Security Considerations
- [ ] Only valid disputes accepted (not spam)
- [ ] Stake prevents frivolous disputes
- [ ] Admin cannot unfairly resolve
- [ ] Original bettors protected
- [ ] Dispute window enforced strictly

## Next Steps
- **If PASS**: Test 006 (claiming winnings)
- **If FAIL**: Document dispute mechanism issues

---
**Status**: ⏸️ NOT STARTED | **Last Updated**: 2025-11-07
