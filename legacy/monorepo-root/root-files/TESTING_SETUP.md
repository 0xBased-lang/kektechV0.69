# E2E Testing Setup Guide

## ✅ What's Complete

All 6 E2E test suites are **fully automated** and ready to run:

1. **Test 1: Wallet Connection** - Programmatic wallet creation & auth
2. **Test 2: Proposal Voting** - Authenticated on-chain voting 
3. **Test 3: Admin Approval** - Market approval workflow
4. **Test 4: Market Trading** - Real BASED token bets
5. **Test 5: Error Handling** - Comprehensive error scenarios
6. **Test 6: Complete Journey** - Full 10-phase user journey

## 🔧 Setup Required

### Step 1: Configure Test Wallets

Edit `.env.test` and add your test wallet private keys:

```bash
# Test wallet (for regular user actions)
TEST_WALLET_PRIVATE_KEY="your_test_wallet_private_key_without_0x"

# Admin wallet (for admin actions)
ADMIN_WALLET_PRIVATE_KEY="your_admin_wallet_private_key_without_0x"
```

**IMPORTANT:**
- Use test wallets with small amounts of BASED only!
- Private keys should NOT have `0x` prefix
- Never commit these keys to git (.env.test is in .gitignore)

### Step 2: Fund Test Wallets

Your test wallets need small amounts of BASED:
- Test wallet: ~5 BASED (for betting)
- Admin wallet: ~1 BASED (for gas)

### Step 3: Grant Admin Role

The admin wallet needs the `ADMIN_ROLE` on the AccessControlManager contract:

```solidity
// From an existing admin account:
AccessControlManager.grantRole(ADMIN_ROLE, adminWalletAddress);
```

## 🚀 Running Tests

### Run All E2E Tests
```bash
cd packages/frontend
npm run test:e2e
```

### Run Specific Test Suite
```bash
npx playwright test tests/e2e/01-wallet-connection.spec.ts
npx playwright test tests/e2e/06-complete-journey.spec.ts
```

### Run with Visible Browser
```bash
npx playwright test --headed
```

### Interactive UI Mode
```bash
npm run test:e2e:ui
```

### View Test Report
```bash
npx playwright show-report
```

## 📊 Expected Results

When properly configured, you'll see:

```
Running 33+ tests using 1 worker

  ✓  Wallet Connection › should connect wallet programmatically
  ✓  Wallet Connection › should create Supabase session
  ✓  Proposal Voting › should vote with authentication
  ✓  Admin Approval › should approve market
  ✓  Market Trading › should place bet with real BASED
  ✓  Error Handling › should handle invalid addresses
  ✓  Complete Journey › full automated user journey

  33 passed (125s)
```

## 🎯 What Each Test Does

### Test 1: Wallet Connection (6 tests)
- Creates wallet programmatically (no MetaMask popup!)
- Supabase authentication
- Balance checking
- Disconnect/reconnect
- Network validation

### Test 2: Proposal Voting (8 tests)
- Authenticated voting
- Vote persistence
- Vote count validation
- Multiple votes from same wallet

### Test 3: Admin Approval (10 tests)
- Admin wallet connection
- Market state transitions
- Approve/reject markets
- Role verification

### Test 4: Market Trading (9 tests)
- Real BASED token bets
- Share balance validation
- Sell shares
- Claim winnings

### Test 5: Error Handling (14 tests)
- Network errors
- Authentication errors
- Validation errors
- Transaction errors
- UI error states
- Recovery mechanisms

### Test 6: Complete Journey (3 tests)
- Full 10-phase automated journey
- Performance validation
- Responsive design testing

## 🔍 Troubleshooting

### "Supabase config missing"
- Check that `.env.test` exists
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set

### "Cannot navigate to invalid URL"
- Ensure dev server is running on port 3006
- Check `playwright.config.ts` baseURL setting

### Tests Skip/Fail
- Verify test wallet private keys are correct (no 0x prefix)
- Ensure wallets have BASED tokens
- Confirm admin wallet has ADMIN_ROLE granted
- Check network connectivity to BasedAI RPC

### "Insufficient funds" Errors
- Add more BASED to test wallets
- Test wallet needs ~5 BASED
- Admin wallet needs ~1 BASED

## 📚 Documentation

- **Full Test Guide**: `tests/e2e/TESTING_SUMMARY.md`
- **Helper API Reference**: See helper files in `tests/e2e/helpers/`
- **Playwright Docs**: https://playwright.dev

## 🎉 Benefits

Once configured, you get:
- ✅ 100% automated E2E testing
- ✅ Real blockchain validation
- ✅ Zero manual wallet interaction
- ✅ CI/CD ready
- ✅ Comprehensive coverage

**The infrastructure is complete - just add your test wallet keys and run!**
