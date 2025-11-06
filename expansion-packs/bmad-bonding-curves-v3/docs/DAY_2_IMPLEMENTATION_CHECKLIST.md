# 📋 Day 2 Implementation Checklist - FeeCalculator Library

*Created: November 3, 2025 - 22:00 UTC*
*Status: Detailed step-by-step implementation guide*

## Overview

Complete checklist for implementing the two-tier FeeCalculator library with 3-way fee distribution. Follow Test-Driven Development (TDD) approach.

**Estimated Time**: 3-5 hours total
**Target**: 42/42 tests passing, 100% coverage, <50k gas

---

## Phase 1: Library Implementation (60-90 minutes)

### Step 1.1: Create FeeCalculator.sol ⏳

**File**: `contracts/libraries/FeeCalculator.sol`

**Tasks**:
- [ ] Create library boilerplate with SPDX and pragma
- [ ] Add comprehensive NatSpec documentation
- [ ] Define all custom errors (4 errors minimum)
- [ ] Define PRECISION constant (10000)
- [ ] Implement calculateBondFee() function
- [ ] Implement calculateVoluntaryBonus() function
- [ ] Implement calculateTradingFee() function (additive)
- [ ] Implement validateDistribution() function
- [ ] Implement splitFee() function
- [ ] Implement calculateAllFees() helper
- [ ] Add inline comments for complex logic
- [ ] Verify compilation: `npx hardhat compile`

**Custom Errors Required**:
```solidity
error InvalidBondAmount(uint256 provided, uint256 min, uint256 max);
error InvalidVoluntaryAmount(uint256 provided, uint256 max);
error InvalidFeeDistribution(uint256 sum, uint256 expected);
error ShareOutOfRange(string shareType, uint256 value, uint256 min, uint256 max);
```

**Success Criteria**:
- ✅ Compiles without errors
- ✅ All 6 functions implemented
- ✅ Full NatSpec documentation
- ✅ Gas-optimized (no unnecessary storage)

---

### Step 1.2: Create FeeCalculatorTester.sol ⏳

**File**: `contracts/test/FeeCalculatorTester.sol`

**Tasks**:
- [ ] Create test wrapper contract
- [ ] Expose calculateBondFee()
- [ ] Expose calculateVoluntaryBonus()
- [ ] Expose calculateTradingFee()
- [ ] Expose validateDistribution()
- [ ] Expose splitFee()
- [ ] Expose calculateAllFees()
- [ ] Verify compilation
- [ ] Deploy test to check gas costs

**Template**:
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../libraries/FeeCalculator.sol";

contract FeeCalculatorTester {
    using FeeCalculator for *;

    // Parameter storage (hardcoded for testing)
    uint256 public constant MIN_BOND = 10 ether;
    uint256 public constant MAX_BOND = 1000 ether;
    // ... etc

    function calculateBondFee(uint256 bondAmount) external pure returns (uint256) {
        return FeeCalculator.calculateBondFee(bondAmount, MIN_BOND, MAX_BOND, MIN_BOND_FEE_BPS, MAX_BOND_FEE_BPS);
    }

    // ... expose all other functions
}
```

**Success Criteria**:
- ✅ Compiles without errors
- ✅ All library functions exposed
- ✅ Deployment gas < 500k

---

## Phase 2: Test Suite Creation (60-90 minutes)

### Step 2.1: Setup Test File ⏳

**File**: `test/unit/FeeCalculator.test.js`

**Tasks**:
- [ ] Create test file boilerplate
- [ ] Import required dependencies (chai, ethers, hardhat)
- [ ] Define constants (PRECISION, test parameters)
- [ ] Add `before` hook to deploy tester contract
- [ ] Create main describe block
- [ ] Add clear section comments

**Template**:
```javascript
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FeeCalculator Library", function () {
  let feeTester;
  const PRECISION = 10000; // 100.00%

  // Test parameters (matching defaults)
  const MIN_BOND = ethers.parseEther("10");
  const MAX_BOND = ethers.parseEther("1000");
  const MIN_BOND_FEE_BPS = 50;    // 0.5%
  const MAX_BOND_FEE_BPS = 200;   // 2%
  // ... etc

  before(async function () {
    const FeeTester = await ethers.getContractFactory("FeeCalculatorTester");
    feeTester = await FeeTester.deploy();
    await feeTester.waitForDeployment();
  });

  // Test suites below...
});
```

---

### Step 2.2: Tier 1 Tests (Bond Fee Calculation) ⏳

**Target**: 8 tests

**Tasks**:
- [ ] Test 1: Returns min fee for min bond
- [ ] Test 2: Returns max fee for max bond
- [ ] Test 3: Linear scaling between min and max
- [ ] Test 4: Handles bond below minimum (returns min fee)
- [ ] Test 5: Handles bond above maximum (returns max fee)
- [ ] Test 6: Handles zero bond edge case
- [ ] Test 7: Handles very large bonds
- [ ] Test 8: Reverts with invalid parameters

**Sample Test**:
```javascript
describe("Tier 1: Bond Fee Calculation", function () {
  it("Should return min fee for min bond", async function () {
    const fee = await feeTester.calculateBondFee(MIN_BOND);
    expect(fee).to.equal(MIN_BOND_FEE_BPS); // 50 (0.5%)
  });

  it("Should scale linearly", async function () {
    const midBond = (MIN_BOND + MAX_BOND) / 2n;
    const fee = await feeTester.calculateBondFee(midBond);
    const expectedFee = (MIN_BOND_FEE_BPS + MAX_BOND_FEE_BPS) / 2;
    expect(fee).to.be.closeTo(expectedFee, 1);
  });

  // ... 6 more tests
});
```

---

### Step 2.3: Tier 2 Tests (Voluntary Bonus Calculation) ⏳

**Target**: 8 tests

**Tasks**:
- [ ] Test 9: Returns 0% bonus for 0 voluntary fee
- [ ] Test 10: Returns max bonus for max voluntary fee
- [ ] Test 11: Linear scaling for voluntary amounts
- [ ] Test 12: Handles voluntary below minimum
- [ ] Test 13: Handles voluntary above maximum
- [ ] Test 14: Handles very large voluntary amounts
- [ ] Test 15: Works when voluntary disabled (max=0)
- [ ] Test 16: Reverts with invalid parameters

---

### Step 2.4: Combined Calculation Tests ⏳

**Target**: 5 tests

**Tasks**:
- [ ] Test 17: Additive model (bond + voluntary)
- [ ] Test 18: Bond only (voluntary = 0)
- [ ] Test 19: Voluntary only (min bond)
- [ ] Test 20: Maximum fees (max bond + max voluntary)
- [ ] Test 21: Minimum fees (min bond + 0 voluntary)

**Sample Test**:
```javascript
describe("Combined Fee Calculation", function () {
  it("Should add bond fee and voluntary bonus", async function () {
    const midBond = ethers.parseEther("500");
    const midVoluntary = ethers.parseEther("500");

    const bondFee = await feeTester.calculateBondFee(midBond);
    const voluntaryBonus = await feeTester.calculateVoluntaryBonus(midVoluntary);
    const totalFee = await feeTester.calculateTradingFee(midBond, midVoluntary);

    expect(totalFee).to.equal(bondFee + voluntaryBonus);
  });
});
```

---

### Step 2.5: Distribution Validation Tests ⏳

**Target**: 10 tests

**Tasks**:
- [ ] Test 22: Accepts valid 33/33/34 split
- [ ] Test 23: Accepts valid 40/30/30 split
- [ ] Test 24: Accepts valid 25/50/25 split
- [ ] Test 25: Rejects sum < 100%
- [ ] Test 26: Rejects sum > 100%
- [ ] Test 27: Rejects platform share out of range
- [ ] Test 28: Rejects creator share out of range
- [ ] Test 29: Rejects staking share out of range
- [ ] Test 30: Handles edge case 100/0/0
- [ ] Test 31: Handles edge case 0/0/100

**Sample Test**:
```javascript
describe("3-Way Distribution Validation", function () {
  it("Should accept valid distribution (33/33/34)", async function () {
    await expect(
      feeTester.validateDistribution(3300, 3300, 3400)
    ).to.not.be.reverted;
  });

  it("Should reject sum != 100%", async function () {
    await expect(
      feeTester.validateDistribution(4000, 3000, 2000) // = 90%
    ).to.be.revertedWithCustomError(feeTester, "InvalidFeeDistribution");
  });
});
```

---

### Step 2.6: Fee Splitting Tests ⏳

**Target**: 6 tests

**Tasks**:
- [ ] Test 32: Splits 1 ETH correctly into 3 parts
- [ ] Test 33: Handles rounding properly (no dust loss)
- [ ] Test 34: Splits very small amounts
- [ ] Test 35: Splits very large amounts
- [ ] Test 36: Sum of splits equals input
- [ ] Test 37: Reverts with invalid total amount

**Sample Test**:
```javascript
describe("Fee Amount Splitting", function () {
  it("Should split 1 ETH according to shares", async function () {
    const totalFee = ethers.parseEther("1");
    const platformShare = 4000; // 40%
    const creatorShare = 3000;  // 30%
    const stakingShare = 3000;  // 30%

    const [platformAmt, creatorAmt, stakingAmt] = await feeTester.splitFee(
      totalFee, platformShare, creatorShare, stakingShare
    );

    expect(platformAmt).to.equal(ethers.parseEther("0.4"));
    expect(creatorAmt).to.equal(ethers.parseEther("0.3"));
    expect(stakingAmt).to.equal(ethers.parseEther("0.3"));

    // Verify no dust loss
    expect(platformAmt + creatorAmt + stakingAmt).to.equal(totalFee);
  });
});
```

---

### Step 2.7: Integration Tests ⏳

**Target**: 5 tests

**Tasks**:
- [ ] Test 38: Calculates all fees for typical market
- [ ] Test 39: Calculates all fees for max-fee market
- [ ] Test 40: Calculates all fees for min-fee market
- [ ] Test 41: Validates distribution in same call
- [ ] Test 42: Splits fees correctly end-to-end

**Sample Test**:
```javascript
describe("Integration Scenarios", function () {
  it("Should handle complete fee flow", async function () {
    const bondAmount = ethers.parseEther("500");
    const voluntaryAmount = ethers.parseEther("500");
    const totalFee = ethers.parseEther("1");

    // Calculate trading fee
    const tradingFeeBps = await feeTester.calculateTradingFee(bondAmount, voluntaryAmount);
    expect(tradingFeeBps).to.be.gt(0);

    // Validate distribution
    const platformShare = 3000;
    const creatorShare = 4000;
    const stakingShare = 3000;
    await expect(
      feeTester.validateDistribution(platformShare, creatorShare, stakingShare)
    ).to.not.be.reverted;

    // Split fee
    const [p, c, s] = await feeTester.splitFee(totalFee, platformShare, creatorShare, stakingShare);
    expect(p + c + s).to.equal(totalFee);
  });
});
```

---

## Phase 3: Test Execution & Coverage (30 minutes)

### Step 3.1: Run Tests ⏳

**Tasks**:
- [ ] Run test suite: `npx hardhat test test/unit/FeeCalculator.test.js`
- [ ] Verify all 42 tests pass
- [ ] Check execution time (target: <300ms)
- [ ] Review any warnings or failures
- [ ] Fix any failing tests
- [ ] Re-run until 42/42 passing

**Expected Output**:
```
FeeCalculator Library
  Tier 1: Bond Fee Calculation
    ✔ Should return min fee for min bond
    ✔ Should return max fee for max bond
    ... (6 more)
  Tier 2: Voluntary Bonus Calculation
    ✔ Should return 0% bonus for 0 voluntary
    ... (7 more)
  Combined Fee Calculation
    ✔ Should add bond and voluntary
    ... (4 more)
  3-Way Distribution Validation
    ✔ Should accept valid distribution
    ... (9 more)
  Fee Amount Splitting
    ✔ Should split 1 ETH correctly
    ... (5 more)
  Integration Scenarios
    ✔ Should handle complete fee flow
    ... (4 more)

  42 passing (298ms)
```

---

### Step 3.2: Coverage Analysis ⏳

**Tasks**:
- [ ] Run coverage: `npx hardhat coverage --testfiles "test/unit/FeeCalculator.test.js"`
- [ ] Review coverage report
- [ ] Target: 100% statements, 100% functions
- [ ] Identify any uncovered lines
- [ ] Add tests for uncovered code
- [ ] Re-run coverage until targets met

**Target Coverage**:
```
--------------------------|----------|----------|----------|----------|
File                      |  % Stmts | % Branch |  % Funcs |  % Lines |
--------------------------|----------|----------|----------|----------|
 libraries/               |      100 |      100 |      100 |      100 |
  FeeCalculator.sol       |      100 |      100 |      100 |      100 |
 test/                    |      100 |      100 |      100 |      100 |
  FeeCalculatorTester.sol |      100 |      100 |      100 |      100 |
--------------------------|----------|----------|----------|----------|
All files                 |      100 |      100 |      100 |      100 |
--------------------------|----------|----------|----------|----------|
```

---

## Phase 4: Gas Benchmarking (30 minutes)

### Step 4.1: Generate Gas Report ⏳

**Tasks**:
- [ ] Enable gas reporter in hardhat.config.js
- [ ] Run with gas reporting: `REPORT_GAS=true npx hardhat test test/unit/FeeCalculator.test.js`
- [ ] Review gas costs per function
- [ ] Verify all functions < 50k gas
- [ ] Document gas costs
- [ ] Identify optimization opportunities

**Expected Gas Costs**:
```
Function                    Gas Cost    Target
──────────────────────────────────────────────
calculateBondFee            ~8k         <10k
calculateVoluntaryBonus     ~8k         <10k
calculateTradingFee         ~12k        <15k
validateDistribution        ~4k         <5k
splitFee                    ~15k        <20k
calculateAllFees            ~20k        <25k
──────────────────────────────────────────────
TOTAL (all functions)       ~67k        <50k avg
```

---

### Step 4.2: Optimize if Needed ⏳

**Tasks**:
- [ ] Review expensive operations
- [ ] Consider caching frequently used values
- [ ] Optimize loops and conditionals
- [ ] Use unchecked{} for safe arithmetic
- [ ] Minimize storage access
- [ ] Re-run gas report after optimizations

---

## Phase 5: Documentation & Cleanup (30 minutes)

### Step 5.1: Update Documentation ⏳

**Tasks**:
- [ ] Update IMPLEMENTATION_PROGRESS.md with Day 2 status
- [ ] Document gas benchmarks
- [ ] Add code examples to documentation
- [ ] Update related architecture docs
- [ ] Create CHANGELOG entry for FeeCalculator

---

### Step 5.2: Code Review Checklist ⏳

**Tasks**:
- [ ] All functions have NatSpec documentation
- [ ] Custom errors used instead of require strings
- [ ] No magic numbers (all constants defined)
- [ ] Gas-optimized (no unnecessary operations)
- [ ] Follows Solidity style guide
- [ ] Consistent naming conventions
- [ ] No TODO or FIXME comments left
- [ ] All tests passing (42/42)
- [ ] 100% coverage achieved
- [ ] Gas targets met

---

## Final Verification ✅

### Pre-Commit Checklist

- [ ] All 42 tests passing
- [ ] 100% statement coverage
- [ ] 100% function coverage
- [ ] Gas benchmarks < 50k average
- [ ] No compilation warnings
- [ ] No linter errors
- [ ] Documentation complete
- [ ] Code reviewed and clean
- [ ] IMPLEMENTATION_PROGRESS.md updated
- [ ] Ready to commit

### Commit Message Template

```
feat(libraries): implement FeeCalculator with two-tier system

- Tier 1: Bond-based fee scaling (0.5-2%)
- Tier 2: Voluntary fee-based bonus (0-8%)
- Additive model: totalFee = bondFee + voluntaryBonus
- 3-way distribution validation (Platform/Creator/Staking)
- Fee splitting logic with no dust loss

Tests: 42/42 passing
Coverage: 100% statements, 100% functions
Gas: <50k per function

Related: #DAY-2, TWO_TIER_FEE_SYSTEM_ARCHITECTURE.md
```

---

## Troubleshooting Guide

### Common Issues

**Issue 1: Tests failing with "Cannot read properties of undefined"**
- **Solution**: Ensure tester contract deployed in `before` hook
- **Check**: `await tester.waitForDeployment()`

**Issue 2: BigInt division truncation errors**
- **Solution**: Use cross-multiplication for ratio comparisons
- **Example**: `a/b > c/d` becomes `a*d > c*b`

**Issue 3: Gas costs too high**
- **Solution**: Use `unchecked{}` for safe arithmetic
- **Solution**: Cache repeated calculations
- **Solution**: Minimize branching logic

**Issue 4: Coverage not 100%**
- **Solution**: Add tests for all edge cases
- **Solution**: Test all revert scenarios
- **Solution**: Test both min and max boundaries

---

## Success Metrics

**Day 2 Complete When**:
- ✅ FeeCalculator.sol implemented (6 functions)
- ✅ FeeCalculatorTester.sol created
- ✅ 42/42 tests passing
- ✅ 100% statement coverage
- ✅ 100% function coverage
- ✅ <50k gas per function average
- ✅ Documentation updated
- ✅ Code clean and reviewed
- ✅ Ready for Week 2 integration

---

*Last Updated: November 3, 2025 - 22:00 UTC*
*Status: Complete checklist ready for implementation*
