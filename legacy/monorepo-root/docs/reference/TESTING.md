# KEKTECH Testing Master Guide

## 🎯 Overview

This guide provides comprehensive testing procedures for the KEKTECH prediction market platform deployed on BasedAI mainnet.

**System Status**:
- **Deployed**: November 6, 2025
- **Network**: BasedAI (Chain ID: 32323)
- **Frontend**: https://kektech.vercel.app
- **Test Coverage**: 92% passing (319/347 tests)

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
**Coverage**: 347 tests (319 passing, 28 failing)

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

**Current Output**:
```
319 passing (2m 15s)
28 failing
```

**Known Issues**: See [CURRENT_STATUS.md](../../CURRENT_STATUS.md) for details on failing tests.

### Layer 2: Frontend E2E Tests (Playwright)
**Location**: `packages/frontend/tests/e2e/`
**Framework**: Playwright
**Coverage**: E2E tests for critical user journeys

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

**Per Claude Code Instructions**:
Use Playwright for frontend testing as specified in [CLAUDE.md](../../CLAUDE.md).

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

---

## Quick Reference

### Pre-Deployment Checklist
```bash
# 1. Run all contract tests
cd packages/blockchain
npm test
# Current: 319/347 passing (28 known failures)

# 2. Run E2E tests
cd packages/frontend
npm run test:e2e

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
# Live URL: https://kektech.vercel.app

# 3. Run smoke tests
PLAYWRIGHT_BASE_URL=https://kektech.vercel.app \
  npm run test:e2e:smoke

# 4. Manual verification
# - Visit site
# - Connect wallet
# - Place test bet
# - Verify transaction

# 5. Update CURRENT_STATUS.md with results
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
   - **Current**: 319 passing, 28 failing
   - **If new failures**: Note which tests failed
   - **Action**: Document in CURRENT_STATUS.md

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

4. Review results and document in CURRENT_STATUS.md

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

4. Document changes in CURRENT_STATUS.md

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
   export PLAYWRIGHT_BASE_URL=https://kektech.vercel.app
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

5. Document deployment in CURRENT_STATUS.md

---

## Test Result Documentation

### Documentation Standards

After running any test suite, update [CURRENT_STATUS.md](../../CURRENT_STATUS.md) with:

- **Date/Time**: When tests were run
- **Environment**: local/fork/preview/production
- **Commit Hash**: `git rev-parse HEAD`
- **Test Counts**: Passing/failing
- **Failed Tests**: List each failure with reason
- **Screenshots**: For E2E failures (if applicable)
- **Action Items**: What needs fixing

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
1. Check paths are correct (packages/blockchain)
2. Verify Node version matches: `.nvmrc`
3. Check environment variables are set in GitHub Secrets

### Issue: Gas costs higher than expected

**Solution**:
1. Review recent contract changes
2. Run gas profiler: `npm run test:gas:profile`
3. Check for unnecessary storage operations
4. Consider optimization techniques

---

## Integration with Development Workflow

### Pre-Commit Testing
```bash
# Run quick test suite before committing
npm test -- --grep "critical"

# If using CodeRabbit (per CLAUDE.md)
# Review will run automatically on commit
```

### Pre-PR Testing
```bash
# Full test suite before creating PR
cd packages/blockchain && npm test
cd packages/frontend && npm run test:e2e
```

### Continuous Integration
Tests run automatically in CI pipeline. Check GitHub Actions for results.

---

## Related Documentation

- [CURRENT_STATUS.md](../../CURRENT_STATUS.md) - Current test results and system status
- [NEXT_STEPS.md](../../NEXT_STEPS.md) - Testing-related tasks
- [OPERATIONS.md](OPERATIONS.md) - Operational procedures for live system
- [CONTRACTS.md](CONTRACTS.md) - Contract addresses and deployment info
- [GETTING_STARTED.md](../GETTING_STARTED.md) - Development setup guide

---

## 📞 Support

- **Test Failures**: Document in CURRENT_STATUS.md
- **New Tests**: Follow existing test patterns in test/ directories
- **Questions**: Review this guide or check project documentation

---

**Last Updated**: November 9, 2025
**Maintained By**: KEKTECH Development Team
**System**: LIVE on BasedAI Mainnet
