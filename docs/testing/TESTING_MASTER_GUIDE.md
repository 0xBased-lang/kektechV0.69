# KEKTECH Testing Master Guide

## 🎯 Overview

This guide provides comprehensive testing procedures for the KEKTECH prediction market platform deployed on BasedAI mainnet.

**System Status**:
- **Deployed**: November 6, 2025
- **Network**: BasedAI (Chain ID: 32323)
- **Frontend**: https://kektech-frontend-[hash].vercel.app
- **Test Coverage**: 92% passing (320/347 tests)

---

## 📋 Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Testing Layers](#testing-layers)
3. [Quick Reference](#quick-reference)
4. [Detailed Testing Procedures](#detailed-testing-procedures)
5. [Test Result Documentation](#test-result-documentation)
6. [Troubleshooting](#troubleshooting)

---

## Testing Philosophy

### Core Principles
- **Test Before Deploy**: Never deploy without passing tests
- **Document Everything**: Record all test results
- **Automate What Matters**: Critical paths must have automated tests
- **Manual Validation**: Some things need human verification

### Test-Driven Approach
1. Write tests first (when adding features)
2. Run tests frequently (before commits)
3. Fix failures immediately (don't accumulate debt)
4. Document results (for future reference)

---

## Testing Layers

### Layer 1: Smart Contract Tests (Hardhat)
**Location**: `packages/blockchain/test/hardhat/`
**Framework**: Hardhat + Mocha + Chai
**Coverage**: 347 tests (320 passing, 27 pending)

**What We Test**:
- Contract deployment
- Function logic
- State transitions
- Access control
- Gas optimization
- Security vulnerabilities

**Run Command**:
```bash
cd packages/blockchain
npm test
```

**Expected Output**:
```
320 passing (2m 15s)
27 pending
0 failing
```

### Layer 2: Frontend E2E Tests (Playwright)
**Location**: `packages/frontend/tests/e2e/`
**Framework**: Playwright
**Coverage**: 52 tests (50 passing)

**What We Test**:
- User journeys
- Wallet connection
- Market interactions
- Admin functions
- Mobile responsiveness
- Cross-browser compatibility

**Run Command**:
```bash
cd packages/frontend
npm run test:e2e
```

**Expected Output**:
```
50 passed (18m 30s)
2 failed
```

### Layer 3: Integration Tests
**What We Test**:
- Frontend → Smart Contract interactions
- Event listening
- Real transactions
- State synchronization

**How to Run**:
```bash
# Start local blockchain fork
npm run node:fork

# Deploy contracts
npm run deploy:fork

# Run E2E against fork
PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run test:e2e
```

### Layer 4: Manual Testing
**What Requires Manual Testing**:
- Complex user flows
- Visual design verification
- Accessibility validation
- Mobile device testing
- Admin operations

**Manual Test Checklist**: See [MANUAL_TESTING_CHECKLIST.md](./MANUAL_TESTING_CHECKLIST.md)

---

## Quick Reference

### Pre-Deployment Checklist
```bash
# 1. Run all contract tests
cd packages/blockchain
npm test
# Expected: 320/347 passing

# 2. Run E2E tests
cd packages/frontend
npm run test:e2e
# Expected: 50/52 passing

# 3. Build frontend
npm run build
# Expected: Build successful

# 4. Check for critical failures
# ✅ No failing tests in critical paths
# ✅ Build completes successfully
# ✅ No console errors in production build

# 5. Ready to deploy!
```

### Post-Deployment Validation
```bash
# 1. Deploy to Vercel
vercel --prod

# 2. Get deployment URL
# Example: https://kektech-frontend-abc123.vercel.app

# 3. Run smoke tests
PLAYWRIGHT_BASE_URL=https://kektech-frontend-abc123.vercel.app \
  npm run test:e2e:smoke

# 4. Manual verification
# - Visit site
# - Connect wallet
# - Place test bet
# - Verify transaction

# 5. Document deployment
# See DEPLOYMENT_LOG.md template
```

---

## Detailed Testing Procedures

### Procedure 1: Full Contract Test Suite

**When to Run**: Before any deployment, after contract changes

**Steps**:
1. Navigate to blockchain package:
   ```bash
   cd packages/blockchain
   ```

2. Clean previous artifacts:
   ```bash
   npx hardhat clean
   rm -rf artifacts cache
   ```

3. Compile contracts:
   ```bash
   npx hardhat compile
   ```

4. Run all tests:
   ```bash
   npm test
   ```

5. Review output:
   - **Expected**: 320 passing, 27 pending, 0 failing
   - **If failures**: Note which tests failed
   - **Action**: Fix failures before proceeding

6. Document results:
   ```bash
   npm test > test-results/contract-tests-$(date +%Y%m%d).log 2>&1
   ```

### Procedure 2: E2E Test Suite

**When to Run**: Before deployment, after frontend changes

**Steps**:
1. Ensure frontend is built:
   ```bash
   cd packages/frontend
   npm run build
   ```

2. Start development server (for local testing):
   ```bash
   npm run dev
   # Runs on http://localhost:3000
   ```

3. Run Playwright tests:
   ```bash
   npm run test:e2e
   ```

4. Review results:
   - **Expected**: 50/52 passing
   - **Known failures**: Document in TEST_RESULTS

5. Run specific browser:
   ```bash
   # Chrome only
   npm run test:e2e -- --project chromium

   # Firefox only
   npm run test:e2e -- --project firefox

   # Mobile Safari
   npm run test:e2e -- --project mobile-safari
   ```

6. Debug failures:
   ```bash
   # Run in headed mode (see browser)
   npm run test:e2e -- --headed --debug

   # Run specific test
   npm run test:e2e -- --grep "wallet connection"
   ```

### Procedure 3: Gas Usage Validation

**When to Run**: After optimization attempts

**Steps**:
1. Run tests with gas reporting:
   ```bash
   cd packages/blockchain
   npm run test:gas
   ```

2. Review gas costs:
   - **createMarket**: <700k gas
   - **placeBet**: <100k gas
   - **resolveMarket**: <150k gas
   - **claimWinnings**: <80k gas

3. Compare to baseline:
   ```bash
   # Check baseline file
   cat gas-baseline.json

   # Compare current vs baseline
   node scripts/compare-gas-usage.js
   ```

4. Document changes:
   - If increased: Explain why
   - If decreased: Celebrate and document technique

### Procedure 4: Security Validation

**When to Run**: Before mainnet deployment, after security changes

**Steps**:
1. Run Slither analysis:
   ```bash
   cd packages/blockchain
   slither . --compile-force-framework hardhat
   ```

2. Review findings:
   - **Critical**: Must fix before deployment
   - **High**: Should fix before deployment
   - **Medium**: Consider fixing
   - **Low**: Document and monitor

3. Run Hardhat security tests:
   ```bash
   npm run test:security
   ```

4. Check access control:
   ```bash
   npm test -- test/hardhat/AccessControlManager.test.js
   ```

5. Verify reentrancy guards:
   ```bash
   # Check all tests pass
   grep -r "ReentrancyGuard" test/
   ```

### Procedure 5: Production Smoke Tests

**When to Run**: After deployment to production

**Steps**:
1. Set production URL:
   ```bash
   export PLAYWRIGHT_BASE_URL=https://kektech-frontend-abc123.vercel.app
   ```

2. Run critical path tests:
   ```bash
   npm run test:e2e:smoke
   ```

3. Manual verification:
   - [ ] Homepage loads
   - [ ] Markets display
   - [ ] Wallet connects
   - [ ] Can place bet
   - [ ] Transaction confirms
   - [ ] No console errors

4. Performance check:
   - [ ] Load time <3 seconds
   - [ ] No layout shift
   - [ ] Responsive on mobile

5. Document deployment:
   ```markdown
   ## Deployment - [DATE]
   - URL: https://...
   - Tests: ✅ 50/52 E2E passing
   - Performance: ✅ <3s load
   - Issues: None
   ```

---

## Test Result Documentation

### Template Usage

After running any test suite:

```bash
# Copy template
cp docs/testing/TEST_RESULTS/TEMPLATE.md \
   docs/testing/TEST_RESULTS/TEST_RESULTS_$(date +%Y-%m-%d).md

# Edit with results
nano docs/testing/TEST_RESULTS/TEST_RESULTS_$(date +%Y-%m-%d).md
```

### Required Information

- **Date/Time**: When tests were run
- **Environment**: local/fork/preview/production
- **Commit Hash**: `git rev-parse HEAD`
- **Test Counts**: Passing/failing/pending
- **Failed Tests**: List each failure with reason
- **Screenshots**: For E2E failures
- **Action Items**: What needs fixing
- **Sign-off**: Who verified the results

---

## Troubleshooting

### Issue: Contract tests failing with "insufficient gas"

**Solution**:
```bash
# Increase gas limit in hardhat.config.js
blockGasLimit: 30000000
```

### Issue: E2E tests timeout

**Solution**:
```bash
# Increase timeout in playwright.config.ts
timeout: 60000  # 60 seconds
```

### Issue: Wallet connection fails in tests

**Solution**:
1. Check MetaMask test wallet has testnet funds
2. Verify network configuration matches
3. Clear browser cache: `npx playwright clean`

### Issue: Tests pass locally but fail in CI

**Solution**:
1. Check paths are correct (packages/blockchain not expansion-packs/...)
2. Verify Node version matches: `.nvmrc`
3. Check environment variables are set in GitHub Secrets

### Issue: Gas costs higher than expected

**Solution**:
1. Review recent contract changes
2. Run gas profiler: `npm run test:gas:profile`
3. Check for unnecessary storage operations
4. Consider optimization techniques

---

## 📞 Support

- **Documentation Issues**: Update this guide
- **Test Failures**: Check TEST_RESULTS/ for patterns
- **New Tests**: Follow existing test patterns
- **Questions**: Review CONTRACT_TESTS.md or PLAYWRIGHT_TESTS.md

---

**Last Updated**: November 8, 2025
**Maintained By**: KEKTECH Development Team
**Next Review**: Weekly
