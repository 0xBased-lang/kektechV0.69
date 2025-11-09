# Smart Contract Test Reference

## Overview

**Framework**: Hardhat + Mocha + Chai
**Location**: `packages/blockchain/test/hardhat/`
**Total Tests**: 347
**Passing**: 320 (92%)
**Pending**: 27 (obsolete tests)

---

## Quick Reference

```bash
# Run all tests
npm test

# Run specific file
npm test -- test/hardhat/PredictionMarket.test.js

# With gas reporting
npm run test:gas

# With coverage
npm run coverage

# Specific test pattern
npm test -- --grep "Market Creation"
```

---

## Test Files Summary

| File | Tests | Passing | Focus |
|------|-------|---------|-------|
| PredictionMarket.test.js | 53 | 53 | Market logic |
| FlexibleMarketFactoryUnified.test.js | 45 | 41 | Market creation |
| ResolutionManager.test.js | 48 | 48 | Outcomes |
| AccessControlManager.test.js | 18 | 18 | Permissions |
| ParameterStorage.test.js | 25 | 25 | Config |
| RewardDistributor.test.js | 32 | 32 | Fees |
| LMSRCurve.test.js | 28 | 28 | Pricing |
| PredictionMarketLifecycle.test.js | 14 | 14 | Full flow |
| GasOptimizationProfile.test.js | 5 | 5 | Gas costs |
| Phase7Integration.test.js | 52 | 52 | Integration |
| Phase5And6Integration.test.js | 27 | 0 | Obsolete (skipped) |

---

## Critical Test Suites

### 1. PredictionMarket.test.js (53 tests)
**Purpose**: Core market contract logic

**Key Tests**:
- Market creation and initialization
- Betting functionality
- State transitions (PROPOSED → FINALIZED)
- Share calculations
- Balance tracking
- Event emissions

**Run**: `npm test -- test/hardhat/PredictionMarket.test.js`

### 2. FlexibleMarketFactoryUnified.test.js (45 tests)
**Purpose**: Market deployment and registry

**Key Tests**:
- Market creation via factory
- Clone pattern (EIP-1167)
- Registry integration
- Bond management
- Access control

**Known Issues**: 4 tests pending (lines 404, 441, 663, 692)

### 3. ResolutionManager.test.js (48 tests)
**Purpose**: Outcome resolution and disputes

**Key Tests**:
- Market resolution
- Dispute mechanism
- Finalization logic
- Timelock enforcement

**Status**: ✅ 100% passing

### 4. LMSRCurve.test.js (28 tests)
**Purpose**: LMSR bonding curve pricing

**Key Tests**:
- Price calculations
- Share distributions
- Liquidity management
- Edge cases

**Status**: ✅ 100% passing

### 5. Phase7Integration.test.js (52 tests)
**Purpose**: End-to-end system integration

**Key Tests**:
- Complete market lifecycle
- Multi-user scenarios
- Gas cost validation
- Cross-contract interactions

**Known Issues**: 1 test pending (line 505 - complete lifecycle with bet)

---

## Gas Cost Benchmarks

| Operation | Target | Actual | Status |
|-----------|--------|--------|--------|
| createMarket | <700k | 687k | ✅ |
| placeBet (first) | <110k | 100k | ✅ |
| placeBet (subsequent) | <100k | 95k | ✅ |
| resolveMarket | <150k | 135k | ✅ |
| claimWinnings | <80k | 72k | ✅ |
| approveMarket | <50k | 45k | ✅ |

**Run gas report**: `npm run test:gas`

---

## Pending Tests (27 total)

### Phase5And6Integration.test.js (27 tests - ALL SKIPPED)
**Reason**: Tests obsolete architecture (pre-Phase 7)
**Action**: Marked with `.skip()`, can be deleted
**File**: Line 8: `describe.skip("Phase 5 + 6 Integration...`

### Other Pending Tests
- FlexibleMarketFactoryUnified.test.js: 4 tests (lines 404, 441, 663, 692)
  - Issue: Market activation flow setup
  - Action: Review and fix or remove

- Phase7Integration.test.js: 1 test (line 505)
  - Issue: Complete lifecycle - bet fails
  - Action: Debug betting state issue

---

## Running Specific Tests

### By File
```bash
npm test -- test/hardhat/PredictionMarket.test.js
```

### By Pattern
```bash
# All resolution tests
npm test -- --grep "resolution"

# All access control tests
npm test -- --grep "access control"

# All gas tests
npm test -- --grep "gas"
```

### With Options
```bash
# Verbose output
npm test -- --verbose

# Bail on first failure
npm test -- --bail

# Specific timeout
npm test -- --timeout 60000
```

---

## Test Coverage

**Current Coverage**: ~95%

**Run coverage report**:
```bash
npm run coverage
```

**Coverage by contract**:
- PredictionMarket.sol: 98%
- FlexibleMarketFactoryUnified.sol: 95%
- ResolutionManager.sol: 97%
- AccessControlManager.sol: 100%
- ParameterStorage.sol: 100%
- RewardDistributor.sol: 96%
- LMSRCurve.sol: 99%

---

## Security Tests

### Access Control Tests
**File**: AccessControlManager.test.js
**Coverage**: Role-based permissions, unauthorized access

### Reentrancy Tests
**Coverage**: All functions with external calls
**Guards**: ReentrancyGuard on all payable functions

### Overflow Tests
**Coverage**: Using Solidity 0.8+ built-in checks
**Additional**: SafeMath patterns where needed

---

## Troubleshooting

### Issue: Tests fail with "out of gas"
**Solution**: Increase gas limit in hardhat.config.js

### Issue: Tests timeout
**Solution**: Increase mocha timeout:
```javascript
// In test file
this.timeout(60000); // 60 seconds
```

### Issue: Tests pass locally but fail in CI
**Solution**:
1. Check Node version matches
2. Verify paths are correct
3. Clear cache: `npx hardhat clean`

---

**Last Updated**: November 8, 2025
**Next Review**: After any contract changes
