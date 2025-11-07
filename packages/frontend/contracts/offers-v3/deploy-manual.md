# Manual Deployment Guide - KektvVouchersOffersV3

## Pre-Deployment Checklist

### ✅ Contract Verification
- [x] Contract code created (KektvVouchersOffersV3.sol)
- [x] Bug fix implemented (general offer balance checking)
- [x] Security features: ReentrancyGuard, Pausable, Ownable
- [x] Test scenarios documented
- [x] OpenZeppelin contracts v4.9+

### ✅ Configuration Parameters
```
Vouchers Contract: 0x7FEF981beE047227f848891c6C9F9dad11767a48
Min Offer Value: 1000000000000000 (0.001 BASED)
Network: BasedAI (32323)
RPC: https://mainnet.basedaibridge.com/rpc
Explorer: https://explorer.bf1337.org
```

### ✅ Deployment Requirements
- [ ] Deployer wallet has sufficient BASED (>0.1 for gas)
- [ ] Private key secured and ready
- [ ] Network connectivity verified
- [ ] Contract files ready for compilation

## Deployment Options

### Option A: Remix IDE (Easiest, Recommended)

**Step 1: Open Remix**
Navigate to: https://remix.ethereum.org

**Step 2: Create Contract Files**
1. Create new file: `KektvVouchersOffersV3.sol`
2. Copy the entire contract code from your local file
3. Remix will auto-compile on save

**Step 3: Configure Compiler**
- Compiler version: 0.8.20
- Enable optimization: YES (200 runs)
- EVM Version: Paris (or default)

**Step 4: Install Dependencies**
- Remix automatically handles OpenZeppelin imports
- Or use: import "@openzeppelin/contracts@4.9.3/..."

**Step 5: Connect to BasedAI**
1. Click "Deploy & Run Transactions" tab
2. Environment: Select "Injected Provider - MetaMask"
3. Ensure MetaMask is connected to BasedAI network:
   - Network Name: BasedAI
   - RPC URL: https://mainnet.basedaibridge.com/rpc
   - Chain ID: 32323
   - Symbol: BASED
   - Explorer: https://explorer.bf1337.org

**Step 6: Deploy Contract**
1. Select contract: `KektvVouchersOffersV3`
2. Constructor parameters:
   - `_vouchersContract`: `0x7FEF981beE047227f848891c6C9F9dad11767a48`
   - `_minOfferValue`: `1000000000000000`
3. Click "Deploy"
4. Confirm transaction in MetaMask
5. Wait for confirmation (~5-10 seconds)

**Step 7: Verify Deployment**
1. Copy deployed contract address
2. Check on explorer: https://explorer.bf1337.org/address/[ADDRESS]
3. Call view functions to verify:
   - `owner()` → Should return your address
   - `vouchersContract()` → Should return vouchers address
   - `minOfferValue()` → Should return 1000000000000000
   - `paused()` → Should return false

### Option B: Foundry/Cast (Advanced)

**Prerequisites:**
```bash
# Install Foundry if not already installed
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

**Step 1: Create Foundry Project**
```bash
cd ~/Desktop/Kektheory/kektheory-frontend/contracts/offers-v3-foundry
forge init --force
```

**Step 2: Install Dependencies**
```bash
forge install OpenZeppelin/openzeppelin-contracts@v4.9.3
```

**Step 3: Configure Foundry**
Create `foundry.toml`:
```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc_version = "0.8.20"
optimizer = true
optimizer_runs = 200

[rpc_endpoints]
basedai = "https://mainnet.basedaibridge.com/rpc"

[etherscan]
basedai = { key = "no-key-needed", url = "https://explorer.bf1337.org/api" }
```

**Step 4: Copy Contract**
```bash
cp ../KektvVouchersOffersV3.sol src/
```

**Step 5: Create Deployment Script**
Create `script/Deploy.s.sol`:
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/KektvVouchersOffersV3.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address vouchersContract = 0x7FEF981beE047227f848891c6C9F9dad11767a48;
        uint256 minOfferValue = 1000000000000000; // 0.001 BASED

        vm.startBroadcast(deployerPrivateKey);

        KektvVouchersOffersV3 offersV3 = new KektvVouchersOffersV3(
            vouchersContract,
            minOfferValue
        );

        console.log("KektvVouchersOffersV3 deployed to:", address(offersV3));
        console.log("Vouchers Contract:", vouchersContract);
        console.log("Min Offer Value:", minOfferValue);

        vm.stopBroadcast();
    }
}
```

**Step 6: Deploy**
```bash
export PRIVATE_KEY="your-private-key-here"

forge script script/Deploy.s.sol:DeployScript \
  --rpc-url basedai \
  --broadcast \
  --verify \
  --legacy
```

### Option C: Hardhat (If Node.js 22 Available)

**Requires Node.js 22.x LTS**
```bash
# Check version
node --version

# If version OK, proceed with hardhat deployment
cd ~/Desktop/Kektheory/kektheory-frontend/contracts/offers-v3
export PRIVATE_KEY="your-key"
npm test  # Run tests first
npx hardhat run scripts/deploy.js --network basedai
```

## Post-Deployment Verification

### Step 1: Verify Contract on Explorer
1. Go to: https://explorer.bf1337.org/address/[YOUR_CONTRACT_ADDRESS]
2. Check contract creation transaction succeeded
3. Review contract code (if verified)

### Step 2: Test Read Functions
Using Remix or Cast:
```javascript
// owner()
// Expected: Your deployer address

// vouchersContract()
// Expected: 0x7FEF981beE047227f848891c6C9F9dad11767a48

// minOfferValue()
// Expected: 1000000000000000

// paused()
// Expected: false

// getTotalOffers()
// Expected: 0
```

### Step 3: Test Write Functions (CRITICAL BUG FIX TEST!)

**Test 1: Make General Offer**
```javascript
// Function: makeOffer(tokenId, amount, voucherOwner)
// Params:
//   tokenId: 3 (Platinum)
//   amount: 1
//   voucherOwner: 0x0000000000000000000000000000000000000000
//   value: 10000000000000000 (0.01 BASED)

// Expected: SUCCESS
// Returns: offerId (probably 0)
// Event: OfferMade(0, msg.sender, 0x0, 3, 1, 0.01 BASED)
```

**Test 2: Accept General Offer (THE BUG FIX!)**
```javascript
// Switch to different account that owns Platinum voucher
// Your address: 0xD90e78886b165d0a5497409528042Fc22bB33d2E

// 1. Ensure you own Platinum (tokenId 3)
// Check: vouchers.balanceOf(YOUR_ADDRESS, 3)
// Expected: >= 1

// 2. Approve offers contract
// vouchers.setApprovalForAll(OFFERS_V3_ADDRESS, true)

// 3. Accept offer
// Function: acceptOffer(offerId)
// Params: offerId: 0

// V2 BEHAVIOR: Would FAIL with InsufficientVoucherBalance
// V3 BEHAVIOR: Should SUCCEED! ✅

// Expected Results:
// - Transaction succeeds
// - Your Platinum transferred to offerer
// - You receive 0.01 BASED
// - Offer marked inactive
```

### Step 4: Monitor First Transactions
```bash
# Watch for transactions to your contract
# https://explorer.bf1337.org/address/[CONTRACT_ADDRESS]/transactions

# Key metrics:
# - Gas used for makeOffer: ~150,000
# - Gas used for acceptOffer: ~200,000
# - Gas used for cancelOffer: ~80,000
```

## Deployment Cost Estimate

**On BasedAI (9 gwei gas price):**
```
Contract Deployment: ~2,500,000 gas
Cost: 2,500,000 × 9 = 22,500,000 gwei
    = 0.0225 BASED
    ≈ $0.000022 USD

Total deployment cost: Essentially FREE! 🎉
```

## Troubleshooting

### Issue: Remix can't find OpenZeppelin
**Solution:** Change imports to use GitHub URLs:
```solidity
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/token/ERC1155/IERC1155.sol";
```

### Issue: MetaMask not connecting
**Solution:**
1. Check BasedAI network is added to MetaMask
2. Verify RPC URL is correct
3. Try switching networks and back

### Issue: Transaction fails with "insufficient funds"
**Solution:**
1. Check BASED balance
2. Ensure at least 0.1 BASED for deployment
3. Get BASED from: [BasedAI Faucet or Exchange]

### Issue: Can't verify contract
**Solution:**
- BasedAI explorer may not support automatic verification
- Manual verification possible via explorer interface
- Code transparency through GitHub is acceptable

## Security Considerations

### Pre-Deployment Security Checklist
- [x] Code reviewed for vulnerabilities
- [x] ReentrancyGuard on all state-changing functions
- [x] Access control via Ownable
- [x] Emergency pause function available
- [x] No use of delegatecall or selfdestruct
- [x] Safe external calls (checks-effects-interactions pattern)
- [x] OpenZeppelin battle-tested libraries

### Post-Deployment Security
- [ ] Owner address is secure (hardware wallet recommended)
- [ ] Monitor contract for unusual activity
- [ ] Have emergency pause plan ready
- [ ] Document owner private key backup securely
- [ ] Consider transferring ownership to multisig

## Next Steps After Deployment

1. **Save Contract Address**
   ```
   V3 Offers Contract: 0x... (SAVE THIS!)
   ```

2. **Update Frontend Configuration**
   ```typescript
   // config/contracts/kektv-offers.ts
   export const KEKTV_OFFERS_V3_ADDRESS = '0xYOUR_NEW_ADDRESS'
   ```

3. **Test General Offer Flow**
   - Make general offer from one account
   - Accept from different account with vouchers
   - Verify success! 🎉

4. **Announce Upgrade**
   - Inform users of V3 contract
   - Explain general offers now work
   - Provide migration instructions

5. **Monitor Initial Usage**
   - Watch first 10-20 transactions
   - Verify no unexpected behavior
   - Be ready to pause if needed

## Success Criteria

✅ Contract deployed successfully
✅ All view functions return expected values
✅ General offer can be created
✅ General offer can be accepted (BUG FIX VERIFIED!)
✅ Targeted offer still works
✅ No errors in first test transactions
✅ Frontend configuration updated
✅ Users can interact with V3 contract

---

## Emergency Procedures

### If something goes wrong:

**Option 1: Pause Contract**
```javascript
// As owner, call:
pause()
// All offers operations stop
// Gives time to investigate
```

**Option 2: Emergency Withdrawal (if needed)**
```javascript
// Offers contract doesn't hold funds long-term
// But can pause to prevent new offers
// Users can still cancel existing offers to get refunds
```

**Option 3: Deploy New Version**
- If critical bug found
- Deploy V4 with fix
- Update frontend to new address
- V3 remains pausable for safety

---

**Ready to deploy? Follow Option A (Remix) for easiest deployment!**
