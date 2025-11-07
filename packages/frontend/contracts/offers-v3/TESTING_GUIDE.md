# Testing Guide - MUST Complete Before Deployment

**CRITICAL: Do NOT deploy without running these tests!**

---

## Current Status

**Node.js Version Issue:**
```
Current: v23.11.0 ❌
Required: v22.x LTS (even number) ✅
Issue: Hardhat not compatible with Node 23
```

**Testing Status:**
- ❌ Tests have NOT been run yet
- ❌ Bug fix NOT verified in tests
- ⚠️ Contract MUST NOT be deployed until tested

---

## PHASE 1: Install Node Version Manager

### Option A: Install nvm (Recommended)

**Step 1: Install nvm**

Open Terminal and run:
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
```

**Step 2: Activate nvm**

Close and reopen Terminal, OR run:
```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```

**Step 3: Verify nvm installed**
```bash
nvm --version
# Should show: 0.39.0 or similar
```

**Step 4: Install Node 22 LTS**
```bash
nvm install 22
```

**Step 5: Switch to Node 22**
```bash
nvm use 22
```

**Step 6: Verify Node version**
```bash
node --version
# Should show: v22.x.x ✅
```

---

## PHASE 2: Prepare Hardhat Test Environment

**Navigate to contracts directory:**
```bash
cd ~/Desktop/Kektheory/kektheory-frontend/contracts/offers-v3
```

**Install dependencies (if not already done):**
```bash
npm install
```

This will install:
- hardhat
- @nomicfoundation/hardhat-toolbox
- @openzeppelin/contracts
- ethers
- chai

**Expected:** Installation completes without errors

---

## PHASE 3: Compile Contracts

**Compile the contracts:**
```bash
npx hardhat compile
```

**Expected Output:**
```
Compiled 5 Solidity files successfully
✓ KektvVouchersOffersV3
✓ MockERC1155Vouchers
✓ OpenZeppelin contracts
```

**If compilation fails:**
- Verify Node version is 22.x
- Check contract code is complete
- Ensure OpenZeppelin is installed
- Try: `npm install` again

---

## PHASE 4: Run Test Suite

**Run all tests:**
```bash
npx hardhat test
```

**Expected Output:**
```
KektvVouchersOffersV3
  🔥 CRITICAL: General Offer Bug Fix
    ✓ Should accept general offer with vouchers (V3 BUG FIX!)
    ✓ Should fail to accept general offer without vouchers
    ✓ Should allow multiple users to race for general offer

  Targeted Offers (Backward Compatibility)
    ✓ Should accept targeted offer (V2 behavior preserved)
    ✓ Should reject targeted offer from wrong user

  Offer Lifecycle
    ✓ Should create offer with correct parameters
    ✓ Should cancel offer and refund

  Security
    ✓ Should enforce minimum offer value
    ✓ Should protect against reentrancy

  View Functions
    ✓ Should track user offers
    ✓ Should track received offers

  11 passing (2s)
```

**Critical Tests to Verify:**
1. ✅ "Should accept general offer with vouchers (V3 BUG FIX!)"
   - **THIS IS THE MOST IMPORTANT TEST!**
   - Verifies general offers can be accepted
   - V2 would fail this test
   - V3 must pass this test

2. ✅ "Should fail to accept general offer without vouchers"
   - Verifies proper validation

3. ✅ "Should allow multiple users to race for general offer"
   - Verifies race condition handling

---

## PHASE 5: Analyze Test Results

### If ALL Tests Pass ✅

**Verification:**
```
✓ 11 passing tests
✓ 0 failing tests
✓ Critical bug fix test passed
✓ Security tests passed
✓ Backward compatibility verified
```

**Status:** ✅ **READY FOR DEPLOYMENT**

**Next Step:** Proceed to deployment following `DEPLOYMENT_INSTRUCTIONS.md`

---

### If ANY Test Fails ❌

**STOP! Do NOT deploy!**

**Analyze the failure:**
1. Read the error message carefully
2. Identify which test failed
3. Check the specific assertion that failed
4. Review the relevant contract code

**Common Issues:**

**Issue 1: General offer test fails**
```
Error: InsufficientVoucherBalance
```
- **Problem:** Bug fix not working correctly
- **Action:** Review `_getVoucherHolder()` logic
- **DO NOT DEPLOY!**

**Issue 2: Compilation errors**
```
Error: Compiler error
```
- **Problem:** Contract code issue
- **Action:** Fix syntax/logic errors
- **DO NOT DEPLOY!**

**Issue 3: Timeout errors**
```
Error: Timeout
```
- **Problem:** Test taking too long
- **Action:** Increase timeout in hardhat.config.js
- **Re-run tests**

---

## PHASE 6: Manual Test Verification

**Even after tests pass, verify the critical test manually:**

**Test: General Offer Acceptance**

```javascript
// In Hardhat console (npx hardhat console)

// Get contracts
const vouchers = await ethers.getContractAt("MockERC1155Vouchers", VOUCHERS_ADDRESS);
const offers = await ethers.getContractAt("KektvVouchersOffersV3", OFFERS_ADDRESS);

// Setup: Mint voucher to user
await vouchers.mint(user.address, 3, 1, "0x");

// Setup: Approve offers contract
await vouchers.connect(user).setApprovalForAll(offers.address, true);

// Test: Make general offer
await offers.connect(offerer).makeOffer(
  3, // tokenId
  1, // amount
  ethers.ZeroAddress, // voucherOwner (GENERAL OFFER!)
  { value: ethers.parseEther("1.0") }
);

// Test: Accept general offer (THE CRITICAL TEST!)
await offers.connect(user).acceptOffer(0);

// Verify: Should succeed! ✅
// V2 would fail here with InsufficientVoucherBalance ❌
```

**If this manual test succeeds:** ✅ Bug fix is verified working!

---

## Testing Checklist

**Before marking tests complete:**

- [ ] Node.js 22 installed and active
- [ ] Hardhat dependencies installed
- [ ] Contracts compile successfully
- [ ] All 11 tests pass
- [ ] Zero failing tests
- [ ] **CRITICAL:** General offer test passes
- [ ] Security tests pass
- [ ] Backward compatibility tests pass
- [ ] Manual verification performed (optional but recommended)

**If ALL boxes checked:** ✅ **SAFE TO PROCEED TO DEPLOYMENT**

**If ANY box unchecked:** ❌ **DO NOT DEPLOY YET**

---

## CRITICAL UNDERSTANDING

**Why Testing is Non-Negotiable:**

1. **Bug Verification:** We MUST verify the bug fix works in tests before mainnet
2. **Security Validation:** Tests catch security issues before real money is at risk
3. **Regression Prevention:** Ensure V3 didn't break V2 functionality
4. **Confidence Building:** Tests prove the contract works as intended

**What Tests Verify:**

✅ General offers can be accepted (THE BUG FIX!)
✅ Targeted offers still work (backward compatibility)
✅ Security features function correctly
✅ Edge cases are handled properly
✅ State management is correct
✅ No unexpected behaviors

**Risk of Deploying Without Tests:**

❌ Bug fix might not work
❌ Security vulnerabilities might exist
❌ Edge cases might fail
❌ Real money could be lost
❌ Contract might need emergency pause
❌ Reputation damage

---

## Test Results Template

**After running tests, fill this out:**

```
=== HARDHAT TEST RESULTS ===

Date: _____________________
Time: _____________________

Node Version: v22.________  ✅

Compilation:
- Status: [ ] Success  [ ] Failed
- Warnings: _____________________

Test Results:
- Total Tests: 11
- Passing: _____
- Failing: _____
- Time: _____ seconds

Critical Test (General Offer):
- Status: [ ] PASSED ✅  [ ] FAILED ❌
- Notes: _____________________

Security Tests:
- Status: [ ] PASSED ✅  [ ] FAILED ❌
- Notes: _____________________

Backward Compatibility:
- Status: [ ] PASSED ✅  [ ] FAILED ❌
- Notes: _____________________

Overall Result:
- [ ] ALL TESTS PASSED - Safe to deploy ✅
- [ ] TESTS FAILED - DO NOT DEPLOY ❌

Sign-off:
_____________________
Date: _____________________
```

---

## Next Steps After Testing

**If tests PASS:**
1. ✅ Document test results
2. ✅ Sign off on testing checklist
3. ✅ Proceed to `DEPLOYMENT_INSTRUCTIONS.md`
4. ✅ Deploy with confidence

**If tests FAIL:**
1. ❌ DO NOT deploy
2. ❌ Analyze failure cause
3. ❌ Fix the issue
4. ❌ Re-run tests until all pass
5. ❌ Only then proceed to deployment

---

## Emergency Testing Scenarios

**Scenario 1: Cannot install Node 22**
- **Alternative:** Use Remix IDE deployment without local tests
- **Risk:** Higher (no automated test verification)
- **Mitigation:** Extensive manual testing on mainnet after deployment
- **Recommendation:** Only if absolutely necessary

**Scenario 2: Tests timeout or hang**
- **Solution:** Increase timeout in hardhat.config.js to 120000 (2 min)
- **Solution:** Run tests with `--bail` flag to stop on first failure
- **Solution:** Run individual test files

**Scenario 3: OpenZeppelin import errors**
- **Solution:** Ensure `@openzeppelin/contracts` is installed
- **Solution:** Check version matches contract imports (v4.9+)
- **Solution:** Clear cache: `npx hardhat clean`

---

## Conclusion

**Testing is MANDATORY before mainnet deployment!**

**Do NOT skip this phase!**

**The tests verify:**
- ✅ Your bug fix works
- ✅ Contract is secure
- ✅ No regressions introduced
- ✅ Edge cases handled

**Only deploy after ALL tests pass!** 🧪✅

---

**Next Document:** After tests pass, proceed to `DEPLOYMENT_INSTRUCTIONS.md`
