# Phase 5 Mainnet Testing - Pre-Flight Checklist

**Purpose**: Ensure everything is ready BEFORE executing first mainnet transaction

**⚠️ CRITICAL**: Complete this checklist before running `test-001-market-creation.js`

---

## ✅ PRE-FLIGHT CHECKLIST

### 1. Environment Configuration

- [ ] `.env` file exists in project root
- [ ] `PRIVATE_KEY` is set (64 hex characters, starts with 0x)
- [ ] `NEXT_PUBLIC_RPC_URL` is set to BasedAI mainnet
- [ ] `NEXT_PUBLIC_CHAIN_ID` is 32323
- [ ] `.env` is in `.gitignore` (NEVER commit private keys!)

**Verify**:
```bash
# Check .env exists
ls -la .env

# Check variables (DON'T show PRIVATE_KEY!)
grep "NEXT_PUBLIC" .env

# Verify .gitignore
grep ".env" .gitignore
```

---

### 2. Wallet & Balance

- [ ] Wallet has ≥10 BASED (for all tests)
- [ ] Wallet address confirmed
- [ ] Network is BasedAI Mainnet (Chain ID: 32323)
- [ ] You're using a TEST wallet (not main holdings)

**Verify**:
```bash
node scripts/check-wallet.js
```

**Expected Output**:
```
✓ Wallet: 0x1234...5678
✓ Network: BasedAI Mainnet (32323)
✓ Balance: 10.5 BASED
✓ Sufficient for testing ✓
```

**If balance < 10 BASED**:
1. Fund wallet from exchange
2. Wait for confirmation
3. Re-run check

---

### 3. Documentation System

- [ ] `docs/phase-5/` directory exists
- [ ] All 7 core documentation files created
- [ ] All 7 test templates created
- [ ] Evidence directories created
- [ ] Git is tracking documentation

**Verify**:
```bash
ls -la docs/phase-5/
ls -la docs/phase-5/mainnet-testing/
ls -la docs/phase-5/evidence/
```

**Expected**: 14 files minimum

---

### 4. Contract Verification

- [ ] Contract addresses configured in `lib/contracts/addresses.ts`
- [ ] All 9 contracts deployed and verified
- [ ] ABIs imported correctly
- [ ] Can connect to contracts via scripts

**Verify**:
```bash
node scripts/verify-contracts.js
```

**Expected Output**:
```
✓ VersionedRegistry: 0x67F8...
✓ ParameterStorage: 0x0Fdc...
✓ AccessControlManager: 0x4d1a...
✓ ResolutionManager: 0x10da...
✓ RewardDistributor: 0x3D27...
✓ MarketFactory: 0x3eaF...
✓ PredictionMarketTemplate: 0x1064...
✓ CurveRegistry: 0x5AcC...
✓ MarketTemplateRegistry: 0x4206...
All contracts verified ✓
```

---

### 5. Dependencies

- [ ] Node.js installed (v18+)
- [ ] NPM packages installed
- [ ] `ethers` package available
- [ ] `dotenv` package available

**Verify**:
```bash
node --version  # Should be v18 or higher
npm list ethers dotenv
```

**If not installed**:
```bash
npm install
npm install ethers dotenv
```

---

### 6. Understanding & Readiness

- [ ] I understand these are REAL transactions with REAL BASED
- [ ] I have read `MAINNET_TESTING_GUIDE.md`
- [ ] I have read `test-001-market-creation.md` template
- [ ] I know how to document results in `MASTER_LOG.md`
- [ ] I know how to create Issue Reports if problems occur
- [ ] I'm ready to spend ~0.15 BASED on Test 001
- [ ] I'm prepared to spend up to 10 BASED total (all tests)

---

### 7. Backup & Safety

- [ ] Documentation system is backed up (Git committed)
- [ ] I have alternative RPC URL (in case primary fails)
- [ ] I know how to check transactions on BasedAI explorer
- [ ] I can recover wallet from seed phrase if needed
- [ ] `.env` backup stored SECURELY (not in Git!)

**BasedAI Explorer**:
- https://explorer.bf1337.org
- Check transactions: `https://explorer.bf1337.org/tx/[HASH]`
- Check addresses: `https://explorer.bf1337.org/address/[ADDRESS]`

---

### 8. Emergency Procedures

**Know what to do if**:

- [ ] Transaction fails → Document in ISSUE_TRACKER.md, investigate
- [ ] Ran out of BASED mid-test → Fund wallet, resume from last successful test
- [ ] RPC connection fails → Try alternative RPC, document downtime
- [ ] Unexpected error → Stop, document everything, create Issue Report
- [ ] Lost transaction receipt → Check BasedAI explorer with tx hash

---

## 🎯 FINAL GO/NO-GO DECISION

**Review all checkboxes above. ALL must be checked before proceeding.**

### If ALL ✅ are checked:
**🟢 GO FOR LAUNCH**
```bash
# Execute Test 001
node scripts/test-001-market-creation.js
```

### If ANY ❌ remain:
**🔴 NO-GO**
- Fix remaining items
- Re-run this checklist
- Do NOT proceed until 100% ready

---

## 📝 LAUNCH AUTHORIZATION

**I hereby confirm**:
- [x] All checklist items completed
- [x] I understand the risks
- [x] I'm ready to execute Test 001
- [x] I will document everything
- [x] I will create Issue Reports for any problems

**Authorized By**: _________________
**Date**: _________________
**Time**: _________________

**First Command to Execute**:
```bash
node scripts/test-001-market-creation.js
```

---

## 🚀 POST-LAUNCH

**After Test 001 completes**:
1. Review output in console
2. Check `MASTER_LOG.md` was updated
3. Check `TESTING_LOG.md` was updated
4. Review evidence file in `docs/phase-5/evidence/transaction-logs/`
5. Verify transaction on BasedAI explorer
6. If successful → Proceed to Test 002
7. If failed → Create Issue Report, investigate, fix, retry

---

**Last Updated**: 2025-11-07 23:35 PST
**Status**: Ready for pre-flight check
**Next**: Complete checklist, then execute Test 001
