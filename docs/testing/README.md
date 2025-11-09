# KEKTECH Testing Documentation - Quick Reference

## 🚀 Quick Start

### Run All Tests
```bash
# Smart contract tests
cd packages/blockchain
npm test                    # 320/347 passing

# Frontend E2E tests
cd packages/frontend
npm run test:e2e           # 50/52 passing

# Run specific test file
npm test -- test/hardhat/PredictionMarket.test.js
```

### Before Deployment
```bash
# 1. Run all tests
npm test && npm run test:e2e

# 2. Check test results
# Expected: 320/347 contract tests passing
# Expected: 50/52 E2E tests passing

# 3. Deploy to Vercel
cd packages/frontend
vercel --prod

# 4. Run smoke tests on production
PLAYWRIGHT_BASE_URL=https://kektech-frontend-[hash].vercel.app npm run test:e2e:smoke
```

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| [TESTING_MASTER_GUIDE.md](./TESTING_MASTER_GUIDE.md) | Comprehensive testing guide |
| [PLAYWRIGHT_TESTS.md](./PLAYWRIGHT_TESTS.md) | E2E test catalog & procedures |
| [CONTRACT_TESTS.md](./CONTRACT_TESTS.md) | Smart contract test reference |
| [DEPLOYMENT_TESTING.md](./DEPLOYMENT_TESTING.md) | Pre/post deployment testing |
| [TEST_RESULTS/](./TEST_RESULTS/) | Historical test results |

## 🧪 Testing Layers

1. **Smart Contract Tests** (Hardhat)
   - 347 total tests
   - 320 currently passing (92%)
   - 27 pending (marked obsolete)
   - Location: `packages/blockchain/test/hardhat/`

2. **Frontend E2E Tests** (Playwright)
   - 52 total tests
   - 50 currently passing (96%)
   - Location: `packages/frontend/tests/e2e/`

3. **Integration Tests**
   - Contract + Frontend interactions
   - Real wallet connection tests
   - Transaction flow validation

4. **Manual Testing**
   - Critical user flows
   - Admin operations
   - Edge case scenarios

## 🎯 When to Test

- **Before any deployment**: Run full test suite
- **After fixing bugs**: Run affected test suites
- **Before major features**: Comprehensive testing
- **Weekly health check**: Run all tests
- **After dependency updates**: Full regression testing

## ⚡ Common Commands

```bash
# Quick test (critical tests only)
npm run test:quick

# With gas reporting
npm run test:gas

# With coverage
npm run coverage

# Specific test pattern
npm test -- --grep "Market Creation"

# E2E on specific browser
npm run test:e2e -- --project chromium

# E2E headed mode (see browser)
npm run test:e2e -- --headed

# E2E debug mode
npm run test:e2e -- --debug
```

## 📊 Test Results Documentation

After running tests, document results using the template:

```bash
cp docs/testing/TEST_RESULTS/TEMPLATE.md \
   docs/testing/TEST_RESULTS/TEST_RESULTS_$(date +%Y-%m-%d).md
```

Fill in:
- Date/time
- Environment (local/preview/production)
- Pass/fail counts
- Failed test details
- Screenshots of failures
- Action items

## 🔍 Troubleshooting

### Tests Failing Locally
1. Clear node_modules: `rm -rf node_modules && npm install`
2. Clear Hardhat cache: `npx hardhat clean`
3. Restart from fresh state

### E2E Tests Failing
1. Check if frontend is running: `npm run dev`
2. Check contract addresses are correct
3. Check wallet connection working
4. Try headed mode to see what's happening: `--headed`

### CI/CD Failing
1. Check GitHub Actions tab for errors
2. Verify paths are correct (`packages/blockchain` not `expansion-packs/...`)
3. Check artifact upload uses v4 not v3

## 🆘 Need Help?

- Check [TESTING_MASTER_GUIDE.md](./TESTING_MASTER_GUIDE.md) for detailed procedures
- Review specific test documentation in PLAYWRIGHT_TESTS.md or CONTRACT_TESTS.md
- Check historical test results in TEST_RESULTS/ for patterns

---

**Last Updated**: November 8, 2025
**System Status**: Live on BasedAI Mainnet (Nov 6, 2025)
