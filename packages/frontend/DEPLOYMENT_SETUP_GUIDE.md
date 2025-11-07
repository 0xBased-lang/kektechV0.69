# 🚀 DEPLOYMENT SETUP GUIDE - Step 1

**Goal**: Prepare your environment for bulletproof BasedAI deployment

---

## ✅ STEP 1: CREATE .ENV FILE

### Option A: Manual Creation (Safe)

1. Create `.env` file in project root:
```bash
cd /Users/seman/Desktop/Kektheory/kektech-nextjs
touch .env
```

2. Open `.env` in your editor and add:
```bash
# BasedAI Deployment Configuration
PRIVATE_KEY=your_private_key_here_without_0x_prefix

# BasedAI RPC (default provided)
BASEDAI_RPC_URL=https://mainnet.basedaibridge.com/rpc
```

3. **IMPORTANT**: Replace `your_private_key_here_without_0x_prefix` with your ACTUAL private key

### How to Get Your Private Key

**From MetaMask**:
1. Open MetaMask
2. Click account menu (top right)
3. Select "Account Details"
4. Click "Show Private Key"
5. Enter password
6. Copy private key (remove "0x" prefix if present)

**Security Notes**:
- ⚠️ NEVER commit `.env` to git (already in .gitignore)
- ⚠️ NEVER share your private key
- ⚠️ Use a separate wallet for deployment (not your main wallet)
- ✅ `.env` is local only, never uploaded

---

## ✅ STEP 2: VERIFY WALLET BALANCE

You need BasedAI ETH for gas. Check your balance:

### Method 1: Using BasedAI Explorer
1. Go to BasedAI explorer (if available)
2. Enter your wallet address
3. Check ETH balance

### Method 2: Using RPC (I'll create script for this)
```bash
# Will check balance automatically
npm run check-balance
```

**Required Balance**: ~0.01 ETH for deployment
- Contract deployment: ~0.005 ETH
- Testing transactions: ~0.005 ETH
- Buffer: Best to have 0.02+ ETH

### How to Get BasedAI ETH

If you need BasedAI ETH:
1. **Bridge from Ethereum**: Use BasedAI bridge
2. **Buy directly**: If BasedAI has DEX/CEX support
3. **Testnet**: Use BasedAI faucet (if deploying to testnet)

---

## ✅ STEP 3: TEST RPC CONNECTION

Before deploying, let's verify you can connect to BasedAI:

### I'll Create Test Script

Run this to verify RPC works:
```bash
npm run test-rpc
```

**Expected Output**:
```
✅ RPC Connection: Success
✅ Current Block: 12345678
✅ Network: BasedAI Mainnet (32323)
✅ Wallet Address: 0x...
✅ Wallet Balance: 0.XX ETH
```

---

## ✅ STEP 4: FINAL PRE-DEPLOYMENT CHECKLIST

Before we deploy, verify:

- [ ] `.env` file created with private key
- [ ] Private key is correct (64 characters, hex)
- [ ] Wallet has >0.01 ETH on BasedAI
- [ ] RPC connection test passed
- [ ] Contract compiled successfully
- [ ] All tests passing (47/47)

---

## 🚨 SAFETY CHECKLIST

- [ ] Using separate wallet for deployment (not main wallet)
- [ ] Private key never committed to git
- [ ] `.env` in .gitignore (already done)
- [ ] Wallet address confirmed correct
- [ ] Network is BasedAI Mainnet (32323)

---

## 🎯 WHAT I'LL DO NEXT

Once you've created `.env` and have BasedAI ETH, I'll:

1. Create RPC test script
2. Create balance checker script
3. Review deployment script
4. Run pre-deployment validation
5. Deploy to BasedAI
6. Verify deployment
7. Test all functions on real network

---

## 📝 YOUR ACTION ITEMS

1. **Create `.env` file** with your private key
2. **Verify** you have BasedAI ETH (~0.01+ ETH)
3. **Let me know** when ready, and I'll continue with automated checks

---

## ⚡ QUICK START (If You're Ready Now)

If you have:
- ✅ Private key ready
- ✅ BasedAI ETH in wallet
- ✅ Ready to deploy

Just tell me: **"Ready to deploy"** and I'll:
1. Create helper scripts
2. Test connection
3. Deploy contract
4. Validate deployment
5. Run real network tests

---

**Full Strategy**: See `/Users/seman/Desktop/Kektheory/BULLETPROOF_DEPLOYMENT_STRATEGY.md`

**This is the most bulletproof approach because we test on REAL network first, build frontend second with complete certainty.**
