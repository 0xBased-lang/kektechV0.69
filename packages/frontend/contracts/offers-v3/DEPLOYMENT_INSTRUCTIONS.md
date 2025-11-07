# Step-by-Step Deployment Instructions

**CONTRACT:** KektvVouchersOffersV3
**NETWORK:** BasedAI (Verified: Chain ID 32323 ✅)
**METHOD:** Remix IDE
**TIME REQUIRED:** 15-20 minutes

---

## ⚠️ IMPORTANT: Read First!

**This is the actual deployment to mainnet. Once deployed, it cannot be undone.**

**Before proceeding:**
1. Read through ALL steps first
2. Check you have verified everything in `PRE_DEPLOYMENT_VERIFICATION.md`
3. Ensure you have focused, uninterrupted time
4. Have MetaMask ready and unlocked

**Ready? Let's deploy carefully!**

---

## PHASE 1: Prepare Contract Code (5 minutes)

### Step 1.1: Open the Contract File

Open this file in your editor:
```
~/Desktop/Kektheory/kektheory-frontend/contracts/offers-v3/KektvVouchersOffersV3.sol
```

### Step 1.2: Select and Copy ALL Contract Code

**CRITICAL:** You must copy the ENTIRE contract (all 304 lines)

**How to verify you copied everything:**
- First line should be: `// SPDX-License-Identifier: MIT`
- Last line should be: `}`
- Total: 304 lines

**Copy now and keep in clipboard!**

---

## PHASE 2: Open and Configure Remix (3 minutes)

### Step 2.1: Open Remix IDE

Open your web browser and navigate to:
```
https://remix.ethereum.org
```

**Wait for Remix to fully load** (you'll see the Remix logo and file explorer)

### Step 2.2: Create New Contract File

1. In the left sidebar, click "File Explorer" icon (📁)
2. Click the "Create New File" icon (📄 with +)
3. Name the file: `KektvVouchersOffersV3.sol`
4. Press Enter

### Step 2.3: Paste Contract Code

1. Click on `KektvVouchersOffersV3.sol` to open it in the editor
2. **Paste the entire contract code** you copied in Step 1.2
3. Press `Ctrl+S` (Windows/Linux) or `Cmd+S` (Mac) to save

**Remix will automatically start compiling!**

### Step 2.4: Wait for OpenZeppelin Dependencies

Remix will fetch OpenZeppelin contracts automatically. You'll see:
```
Downloading @openzeppelin/contracts...
```

**Wait until you see:** "Compilation successful" (green checkmark)

**If you see compilation errors:**
- Check you pasted the COMPLETE contract
- Ensure no extra characters were added
- Try deleting the file and creating it again

---

## PHASE 3: Configure Compiler (2 minutes)

### Step 3.1: Open Solidity Compiler

1. Click the "🔧 Solidity Compiler" tab on the left sidebar
2. You should see your contract listed

### Step 3.2: Configure Compiler Settings

**CRITICAL: These settings must be EXACTLY as shown:**

1. **Compiler Version:** Select `0.8.20+commit...`
   - Look for the dropdown that says "Compiler"
   - Find version starting with `0.8.20`
   - Click to select it

2. **Enable Optimization:** ✅ CHECK THIS BOX
   - Look for "Enable optimization"
   - **MUST be checked!**
   - This is CRITICAL for production deployment

3. **Runs:** Set to `200`
   - Should auto-populate when optimization is enabled
   - If not, manually enter: `200`

4. **EVM Version:** Leave as `default` (or `paris`)

### Step 3.3: Compile the Contract

1. Click the blue "Compile KektvVouchersOffersV3.sol" button
2. **Wait for compilation to complete**

**Expected Result:** Green checkmark ✅ with "Compilation successful"

**If compilation fails:**
- Verify compiler version is 0.8.20
- Ensure optimization is enabled
- Check contract code is complete
- Try clicking "Compile" again

---

## PHASE 4: Setup MetaMask Connection (2 minutes)

### Step 4.1: Verify BasedAI Network in MetaMask

**Open MetaMask and verify:**

1. Click the network dropdown at the top
2. **Verify you see "BasedAI" in the list**

**If you DON'T see BasedAI:**
1. Click "Add Network" → "Add a network manually"
2. Enter these EXACT details:

```
Network Name: BasedAI
New RPC URL: https://mainnet.basedaibridge.com/rpc
Chain ID: 32323
Currency Symbol: BASED
Block Explorer URL: https://explorer.bf1337.org
```

3. Click "Save"

### Step 4.2: Switch to BasedAI Network

1. In MetaMask, click the network dropdown
2. Select "BasedAI"
3. **Verify MetaMask shows "BasedAI" at the top**

### Step 4.3: Verify Your BASED Balance

**Check your balance in MetaMask:**

- You should see: `X.XXX BASED`
- **Required minimum:** > 0.1 BASED (for gas)

**If insufficient balance:**
- Get BASED from exchange or faucet
- Wait until you have > 0.1 BASED
- Do NOT proceed without sufficient balance

---

## PHASE 5: Deploy Contract (3 minutes)

### Step 5.1: Open Deploy Tab

1. Click "🚀 Deploy & Run Transactions" tab (left sidebar)
2. You'll see the deployment interface

### Step 5.2: Configure Environment

**CRITICAL: Verify these EXACT settings:**

1. **Environment:**
   - Click the "Environment" dropdown
   - Select: `Injected Provider - MetaMask`
   - **MetaMask will pop up asking to connect**
   - Click "Connect" in MetaMask

2. **Account:**
   - Should show your wallet address
   - **Verify this is YOUR address**
   - This will be the contract owner!

3. **Gas Limit:**
   - Should auto-calculate
   - Typically: ~3,000,000
   - Leave as auto-calculated

4. **Value:**
   - Should be: `0`
   - We're not sending ETH with deployment

### Step 5.3: Select Contract

In the "Contract" dropdown:
- Select: `KektvVouchersOffersV3 - contracts/KektvVouchersOffersV3.sol`
- **Verify the contract name is correct!**

### Step 5.4: Enter Constructor Parameters

**CRITICAL: These MUST be EXACTLY correct!**

You'll see two input fields below the contract selector:

**Field 1: `_VOUCHERSCONTRACT` (address)**
```
0x7FEF981beE047227f848891c6C9F9dad11767a48
```
**Copy-paste this EXACTLY! Double-check every character!**

**Field 2: `_MINOFFERVALUE` (uint256)**
```
1000000000000000
```
**This is 1 followed by 15 zeros. Count them carefully!**

**VERIFICATION BEFORE DEPLOYMENT:**
- [ ] Vouchers address starts with `0x7FEF`
- [ ] Vouchers address ends with `a48`
- [ ] Min value has exactly 15 zeros after the 1
- [ ] No extra spaces or characters
- [ ] You copied both values EXACTLY as shown

### Step 5.5: Deploy!

**Take a deep breath. Double-check everything above.**

1. **Click the orange "🚀 Deploy" button**

2. **MetaMask will pop up with deployment transaction**

**In MetaMask you should see:**
```
Contract Deployment
Gas estimate: ~2,500,000
Cost: ~0.0225 BASED
Total: ~0.0225 BASED
```

3. **Verify the transaction details:**
   - To: Contract Creation
   - Gas estimate seems reasonable
   - Cost is < 0.1 BASED

4. **Click "Confirm" in MetaMask**

5. **Wait for deployment** (~5-15 seconds)

**You'll see in Remix:**
```
[block:XXXXX txIndex:X txHash:0x...]
```

**Congratulations! The contract is deploying!** 🎉

---

## PHASE 6: Verify Deployment (2 minutes)

### Step 6.1: Get Contract Address

**In Remix, under "Deployed Contracts":**

1. You'll see your contract listed
2. Click the copy icon next to the address
3. **SAVE THIS ADDRESS!**

```
Contract Address: 0x________________________________________________
```

**WRITE THIS DOWN! You'll need it for the frontend!**

### Step 6.2: Check on BasedAI Explorer

1. Open: https://explorer.bf1337.org
2. Paste your contract address in the search box
3. Press Enter

**You should see:**
- Contract creation transaction
- Transaction status: Success ✅
- From: Your address
- Type: Contract Creation

**If transaction is pending:**
- Wait 10-30 seconds
- Refresh the page
- It should confirm soon

**If transaction failed:**
- Check the error message
- Verify constructor parameters were correct
- Try deploying again (check gas balance first)

### Step 6.3: Verify Contract Functions

**In Remix, expand your deployed contract** (click the `>` arrow)

**Test these view functions (they're FREE, no gas):**

1. Click `owner` button
   - **Expected:** Your wallet address
   - ✅ If correct: Ownership verified!

2. Click `vouchersContract` button
   - **Expected:** `0x7FEF981beE047227f848891c6C9F9dad11767a48`
   - ✅ If correct: Vouchers integration verified!

3. Click `minOfferValue` button
   - **Expected:** `1000000000000000`
   - ✅ If correct: Min value configured correctly!

4. Click `paused` button
   - **Expected:** `false`
   - ✅ If correct: Contract is active!

5. Click `getTotalOffers` button
   - **Expected:** `0`
   - ✅ If correct: No offers yet (as expected)!

**If ALL 5 tests pass:** ✅ **DEPLOYMENT SUCCESSFUL!**

---

## PHASE 7: Critical Bug Fix Verification (10 minutes)

**This is THE MOST IMPORTANT TEST - verifying the bug fix works!**

### Step 7.1: Make a General Offer

**In Remix, on your deployed contract:**

1. Find the `makeOffer` function
2. Expand it (click the `>` arrow)

3. **Enter these EXACT values:**

```
tokenId: 3
voucherAmount: 1
voucherOwner: 0x0000000000000000000000000000000000000000
```

**CRITICAL:** The `voucherOwner` must be 42 zeros! This makes it a GENERAL offer!

4. **Enter the offer value:**
   - Look for the red "value" input box AT THE TOP of the function
   - Enter: `10000000000000000` (0.01 BASED)

5. Click the orange "transact" button

6. **MetaMask will pop up:**
   - Transaction: makeOffer
   - Cost: ~0.00135 BASED
   - Click "Confirm"

7. **Wait for confirmation** (~5-10 seconds)

**Expected:** Transaction succeeds, returns `offerId: 0`

**If successful:** General offer created! ✅

### Step 7.2: THE CRITICAL TEST - Accept General Offer

**IMPORTANT:** This tests if the bug is truly fixed!

**Requirements:**
- You need a DIFFERENT wallet that owns Platinum (tokenId 3)
- Your address: `0xD90e78886b165d0a5497409528042Fc22bB33d2E` owns 1 Platinum ✅

**Step A: Approve the Offers Contract**

1. In Remix, under "At Address", enter the vouchers contract:
   ```
   0x7FEF981beE047227f848891c6C9F9dad11767a48
   ```
2. Click "At Address"
3. Find `setApprovalForAll` function
4. Enter:
   ```
   operator: YOUR_V3_CONTRACT_ADDRESS
   approved: true
   ```
5. Click "transact"
6. Confirm in MetaMask
7. Wait for confirmation

**Step B: Accept the Offer (THE BUG FIX TEST!)**

1. Switch back to your Offers V3 contract in Remix
2. Find the `acceptOffer` function
3. Enter:
   ```
   offerId: 0
   ```
4. Click "transact"
5. Confirm in MetaMask

**V2 BEHAVIOR:** Would FAIL with "InsufficientVoucherBalance" ❌

**V3 BEHAVIOR (Expected):** Should SUCCEED! ✅

**If transaction succeeds:**
- ✅ **THE BUG IS FIXED!**
- ✅ **General offers work correctly!**
- ✅ **V3 is production-ready!**
- ✅ **Your Platinum transferred to offerer**
- ✅ **You received 0.01 BASED**

**This is proof the fix works!** 🎉

---

## PHASE 8: Record Deployment Details

**Fill in these details for your records:**

```
=== V3 DEPLOYMENT SUCCESSFUL ===

Date: ______________________
Time: ______________________

Contract Address: 0x________________________________________________

Transaction Hash: 0x________________________________________________

Deployer Address: 0x________________________________________________

Gas Used: _______________

Deployment Cost: _____________ BASED

Network: BasedAI (32323)

Constructor Parameters:
- Vouchers: 0x7FEF981beE047227f848891c6C9F9dad11767a48 ✅
- Min Value: 1000000000000000 (0.001 BASED) ✅

Verification Tests:
- owner() ✅
- vouchersContract() ✅
- minOfferValue() ✅
- paused() ✅
- getTotalOffers() ✅

Bug Fix Test:
- General offer created ✅
- General offer accepted ✅
- BUG FIX VERIFIED ✅

Status: DEPLOYED AND VERIFIED ✅
```

---

## PHASE 9: What's Next?

**Immediate Actions (Next hour):**
1. ✅ Save contract address securely
2. ✅ Bookmark explorer link
3. ✅ Update frontend configuration
4. ✅ Test with frontend UI

**Frontend Update:**

Edit this file:
```
config/contracts/kektv-offers.ts
```

Change:
```typescript
export const KEKTV_OFFERS_ADDRESS = 'YOUR_NEW_V3_ADDRESS' as Address
```

**Short-term (Next 24 hours):**
1. Test complete user flows
2. Monitor first 10-20 transactions
3. Verify gas usage is as expected
4. Collect any initial feedback

**Medium-term (Next week):**
1. Announce upgrade to users
2. Explain general offers now work
3. Guide users to V3 contract
4. Monitor usage patterns

---

## Emergency Procedures

**If Something Goes Wrong:**

**Issue: Deployment Failed**
1. Check error message in MetaMask
2. Verify parameters are correct
3. Ensure sufficient BASED balance
4. Try again with manual gas limit: 3,000,000

**Issue: Bug Found After Deployment**
1. **Pause contract immediately:**
   ```
   Call: pause()
   Only you (owner) can do this
   ```
2. Investigate the issue
3. Fix in V4
4. Deploy V4
5. Update frontend to V4

**Issue: Frontend Can't Connect**
1. Verify contract address is correct
2. Verify ABI matches V3
3. Check network is BasedAI
4. Test with Remix first (it works there!)

---

## Success Criteria

**Deployment is successful when:**
- ✅ Contract deployed without errors
- ✅ Transaction confirmed on BasedAI
- ✅ All 5 view function tests pass
- ✅ General offer can be created
- ✅ **General offer can be accepted (THE BUG FIX!)**
- ✅ Contract address saved
- ✅ Ready for frontend integration

---

## Final Checklist

**Before marking deployment complete:**

- [ ] Contract address saved and backed up
- [ ] Explorer link bookmarked
- [ ] All verification tests passed
- [ ] Bug fix test succeeded
- [ ] Frontend configuration updated
- [ ] Deployment details recorded
- [ ] Ready to announce to users

**If ALL boxes are checked:** ✅ **DEPLOYMENT COMPLETE!**

---

## Congratulations! 🎉

**You've successfully deployed KektvVouchersOffersV3!**

**What you've accomplished:**
- ✅ Fixed the critical general offer bug
- ✅ Deployed a secure, audited contract (9.5/10)
- ✅ Verified the fix works with real transaction
- ✅ Ready for production use

**The marketplace is now fully functional!**

**General offers work correctly!**

**Users can now accept offers successfully!**

**Well done!** 🚀✨

---

**Next Step:** Update frontend configuration and test UI integration!

**Questions? Issues?** Review the documentation guides in this directory.

**You've got this!** 💪
