# KektvVouchersOffersV3 - Test Scenarios

## Critical Fix Verification

### Test 1: General Offer Acceptance (THE BUG FIX!)
**Scenario:** User accepts a general offer (voucherOwner = 0x0)
```
1. User A makes general offer: 1 Platinum for 1000 BASED
2. User B owns 1 Platinum voucher
3. User B calls acceptOffer(offerId)
4. Expected: SUCCESS ✅
   - Voucher transferred from B to A
   - 1000 BASED transferred from contract to B
   - Offer marked inactive

V2 Result: FAIL ❌ (checked balanceOf(0x0, tokenId) = 0)
V3 Result: SUCCESS ✅ (checks balanceOf(msg.sender, tokenId) = 1)
```

### Test 2: Targeted Offer Still Works
**Scenario:** User accepts a targeted offer (voucherOwner = specific address)
```
1. User A makes targeted offer to User B: 1 Gold for 500 BASED
2. User B owns 1 Gold voucher
3. User B calls acceptOffer(offerId)
4. Expected: SUCCESS ✅
   - Same behavior as V2 (should still work)
```

### Test 3: General Offer - Insufficient Balance
**Scenario:** User tries to accept but doesn't own vouchers
```
1. User A makes general offer: 1 Platinum for 1000 BASED
2. User C owns 0 Platinum vouchers
3. User C calls acceptOffer(offerId)
4. Expected: REVERT ❌ InsufficientVoucherBalance
   - Correctly checks User C's balance (0)
```

### Test 4: General Offer - Multiple Accepters Race
**Scenario:** Two users both own vouchers and try to accept
```
1. User A makes general offer: 1 Gold for 500 BASED
2. User B owns 2 Gold, User C owns 1 Gold
3. User B calls acceptOffer(offerId) - SUCCESS ✅
4. User C calls acceptOffer(offerId) - REVERT ❌ OfferNotActive
   - Offer already accepted by B
```

### Test 5: General Offer With Marketplace Listing
**Scenario:** User has voucher listed on marketplace
```
1. User B lists 1 Platinum on marketplace
2. User A makes general offer: 1 Platinum for 1000 BASED
3. User B calls acceptOffer(offerId)
4. Expected: REVERT ❌ (voucher locked in marketplace)
5. User B cancels marketplace listing
6. User B calls acceptOffer(offerId) again
7. Expected: SUCCESS ✅
   - Frontend auto-delist will handle this automatically!
```

## Edge Cases

### Test 6: General Offer - Wrong Token
**Scenario:** User owns vouchers but wrong type
```
1. Offer: 1 Platinum for 1000 BASED
2. User owns: 5 Gold vouchers
3. Expected: REVERT ❌ InsufficientVoucherBalance
```

### Test 7: Targeted Offer - Wrong Recipient Tries
**Scenario:** General user tries to accept targeted offer
```
1. Offer targeted to User B: 1 Gold for 500 BASED
2. User C (owns Gold) calls acceptOffer(offerId)
3. Expected: REVERT ❌ OnlyVoucherOwner
```

### Test 8: General Offer Rejection (Should Fail!)
**Scenario:** User tries to reject general offer
```
1. User A makes general offer (voucherOwner = 0x0)
2. User B calls rejectOffer(offerId)
3. Expected: REVERT ❌ OnlyVoucherOwner
   - msg.sender != 0x0, so always fails
   - This is correct! General offers can only be cancelled by offerer
```

## Security Tests

### Test 9: Reentrancy Attack Prevention
**Scenario:** Malicious contract tries reentrancy on acceptOffer
```
1. Deploy malicious contract with onERC1155Received hook
2. Malicious contract makes offer
3. User accepts offer
4. onERC1155Received tries to call acceptOffer again
5. Expected: REVERT ❌ ReentrancyGuard prevents it
```

### Test 10: Payment Failure Handling
**Scenario:** Recipient contract rejects BASED payment
```
1. Make offer to contract with no receive/fallback
2. Contract tries to accept offer
3. Expected: REVERT ❌ TransferFailed
   - Vouchers not transferred
   - Offer still active
   - No funds lost
```

## Deployment Verification

### Post-Deployment Checklist
- [ ] Contract deployed to correct address
- [ ] Voucher contract address set correctly
- [ ] Min offer value set correctly (0.001 BASED)
- [ ] Owner is correct address
- [ ] Contract not paused
- [ ] General offer acceptance works
- [ ] Targeted offer acceptance works
- [ ] Frontend connected to new address
- [ ] Old offers migrated or documented
