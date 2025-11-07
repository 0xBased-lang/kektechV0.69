# 🏗️ PHASE 3 - KEKTECH BONDING CURVE INTEGRATION ARCHITECTURE

**Date**: November 4, 2025
**Mode**: --ultrathink
**Purpose**: Comprehensive architectural design for PredictionMarket bonding curve integration
**Status**: DESIGN PHASE

---

## 🎯 Executive Summary

**Objective**: Replace AMM pricing in PredictionMarket with flexible bonding curve system
**Scope**: Update PredictionMarket.sol + 66 unit tests + 15 integration tests
**Compatibility**: 100% backward compatible with existing deployments
**Timeline**: Days 7-8 of LMSR Master Plan

---

## 📊 Current State Analysis

### Current AMM Implementation

**PredictionMarket.sol - Lines to Replace:**
1. **Line 91**: `VIRTUAL_LIQUIDITY` constant (AMM-specific)
2. **Lines 162-233**: `placeBet()` - Simple pool accumulation
3. **Lines 398-415**: `getOdds()` - Virtual liquidity AMM formula
4. **Lines 426-459**: `calculatePayout()` - Pool proportion payouts

**Current Flow:**
```
placeBet(outcome, amount)
  → Add ETH to pool (_pool1 or _pool2)
  → Update bet.amount
  → getOdds() uses virtual liquidity AMM formula
  → calculatePayout() uses pool proportions
```

**Problems with Current System:**
- ❌ Fixed AMM formula (no curve flexibility)
- ❌ Virtual liquidity hack for cold start
- ❌ No share tracking (uses ETH amounts directly)
- ❌ Cannot switch pricing models per market

---

## 🎨 Target Architecture Design

### Bonding Curve System Overview

**New Flow:**
```
placeBet(outcome, shares)
  → Calculate ETH cost via IBondingCurve.calculateCost()
  → Update share balances (_yesShares, _noShares)
  → Track ETH pools for transparency (_pool1, _pool2)
  → getPrices() calls IBondingCurve.getPrices()
  → calculatePayout() calls IBondingCurve.calculateRefund()
```

### Key Design Decisions

#### ✅ Decision 1: Share-Based Accounting
**Rationale**: Bonding curves price shares, not ETH amounts
**Implementation**:
```solidity
// New state variables
uint256 private _yesShares;  // Total YES shares issued
uint256 private _noShares;   // Total NO shares issued

// Updated BetInfo struct
struct BetInfo {
    Outcome outcome;
    uint256 amount;      // ETH paid (unchanged)
    uint256 shares;      // NEW: shares received
    uint256 timestamp;
    bool claimed;
    uint256 payout;
}
```

#### ✅ Decision 2: Curve Selection at Initialization
**Rationale**: Each market has ONE bonding curve (set at creation)
**Implementation**:
```solidity
// New state variables
address private _bondingCurve;   // IBondingCurve implementation
uint256 private _curveParams;    // Curve-specific parameters

// Updated initialize function
function initialize(
    address _registry,
    string calldata _questionText,
    string calldata _outcome1,
    string calldata _outcome2,
    address _creator,
    uint256 _resolutionTime,
    address bondingCurve,        // NEW
    uint256 curveParams          // NEW
) external initializer {
    // ... existing validation ...

    // NEW: Validate bonding curve
    if (bondingCurve == address(0)) revert InvalidCurve();
    _bondingCurve = bondingCurve;
    _curveParams = curveParams;

    // Validate curve parameters
    (bool valid, string memory reason) = IBondingCurve(bondingCurve).validateParams(curveParams);
    if (!valid) revert InvalidCurveParams(reason);
}
```

#### ✅ Decision 3: Backward Compatible Pools
**Rationale**: Keep ETH pool tracking for UI/analytics
**Implementation**:
```solidity
// Pools represent total ETH IN (for display/analytics)
_pool1 += msg.value;  // Still track ETH paid
_yesShares += shares;  // Also track shares issued

// getPrices() uses bonding curve
function getPrices() external view returns (uint256, uint256) {
    return IBondingCurve(_bondingCurve).getPrices(
        _curveParams,
        _yesShares,
        _noShares
    );
}
```

#### ✅ Decision 4: Share-Based Payouts
**Rationale**: Payouts calculated from share refunds, not pool proportions
**Implementation**:
```solidity
function calculatePayout(address bettor) public view returns (uint256) {
    if (!isResolved) return 0;

    BetInfo memory bet = _bets[bettor];
    if (bet.shares == 0) return 0;
    if (bet.outcome != result) return 0;  // Losers get nothing

    // Calculate refund for selling shares at winning outcome
    uint256 refund = IBondingCurve(_bondingCurve).calculateRefund(
        _curveParams,
        _yesShares,  // Current total shares
        _noShares,
        bet.outcome == Outcome.OUTCOME1,  // true for YES
        bet.shares   // Shares to sell
    );

    // Deduct platform fees proportionally
    uint256 netRefund = refund - ((refund * _platformFees) / (_pool1 + _pool2));

    return netRefund;
}
```

---

## 🔧 Implementation Strategy

### Phase 3A: State Variable Updates (Day 7 Morning)

**Task**: Add new state variables and update structs
**Estimated Time**: 1-2 hours
**Files**: `PredictionMarket.sol`

```solidity
// Add after line 92 (after VIRTUAL_LIQUIDITY)
/// @notice Bonding curve contract for pricing
address private _bondingCurve;

/// @notice Curve-specific parameters
uint256 private _curveParams;

/// @notice Total YES shares issued
uint256 private _yesShares;

/// @notice Total NO shares issued
uint256 private _noShares;
```

**Update BetInfo struct** (in IPredictionMarket.sol):
```solidity
struct BetInfo {
    Outcome outcome;
    uint256 amount;      // ETH paid
    uint256 shares;      // NEW: shares received
    uint256 timestamp;
    bool claimed;
    uint256 payout;
}
```

### Phase 3B: Initialize Function (Day 7 Morning)

**Task**: Update `initialize()` to accept bonding curve parameters
**Estimated Time**: 1 hour
**Files**: `PredictionMarket.sol`, `FlexibleMarketFactory.sol`

```solidity
function initialize(
    address _registry,
    string calldata _questionText,
    string calldata _outcome1,
    string calldata _outcome2,
    address _creator,
    uint256 _resolutionTime,
    address bondingCurve,        // NEW
    uint256 curveParams          // NEW
) external initializer {
    // ... existing validation (lines 124-138) ...

    // NEW: Validate bonding curve
    if (bondingCurve == address(0)) revert InvalidCurve();
    _bondingCurve = bondingCurve;
    _curveParams = curveParams;

    // Validate curve parameters
    (bool valid, string memory reason) = IBondingCurve(bondingCurve).validateParams(curveParams);
    if (!valid) revert InvalidCurveParams(reason);

    // ... rest of initialization ...
}
```

### Phase 3C: placeBet() Refactor (Day 7 Afternoon)

**Task**: Replace pool-only logic with share calculation
**Estimated Time**: 2-3 hours
**Complexity**: HIGH - Core betting logic
**Files**: `PredictionMarket.sol`

**Current Logic (lines 162-233):**
```solidity
function placeBet(uint8 _outcome, uint256 _minExpectedOdds) external payable {
    // ... validation (lines 163-203) ...

    bet.amount += msg.value;        // Track ETH
    totalVolume += msg.value;

    if (outcome == Outcome.OUTCOME1) {
        _pool1 += msg.value;        // Update pool only
    } else {
        _pool2 += msg.value;
    }

    // ...
}
```

**New Logic:**
```solidity
function placeBet(uint8 _outcome, uint256 _minExpectedOdds) external payable nonReentrant {
    // ... existing validation (lines 163-193) ...

    // CRITICAL CHANGE: Calculate shares to receive
    bool isYes = (outcome == Outcome.OUTCOME1);
    uint256 sharesToBuy;

    // Option A: User specifies shares, we calculate cost
    // Option B: User sends ETH, we calculate shares (CHOSEN)

    // Calculate shares user will receive for msg.value
    // Binary search or use curve's inverse function
    sharesToBuy = _calculateSharesForCost(msg.value, isYes);

    // Verify shares meet expectations (slippage protection)
    if (_minExpectedShares > 0 && sharesToBuy < _minExpectedShares) {
        revert SlippageTooHigh();
    }

    // Update bet
    if (bet.amount == 0) {
        bet.outcome = outcome;
        bet.timestamp = block.timestamp;
        totalBets++;
    }

    bet.amount += msg.value;         // Track ETH paid
    bet.shares += sharesToBuy;       // Track shares received
    totalVolume += msg.value;

    // Update pools (for display) and shares (for pricing)
    if (isYes) {
        _pool1 += msg.value;
        _yesShares += sharesToBuy;
    } else {
        _pool2 += msg.value;
        _noShares += sharesToBuy;
    }

    emit BetPlaced(msg.sender, outcome, msg.value, sharesToBuy, block.timestamp);
    emit LiquidityUpdated(_pool1, _pool2, block.timestamp);
    emit SharesUpdated(_yesShares, _noShares, block.timestamp);  // NEW EVENT
}
```

**Helper Function:**
```solidity
/**
 * @notice Calculate shares user receives for given ETH amount
 * @dev Uses bonding curve's calculateCost() with binary search
 * @param ethAmount ETH being paid
 * @param isYes True for YES, false for NO
 * @return shares Number of shares user receives
 */
function _calculateSharesForCost(uint256 ethAmount, bool isYes)
    private
    view
    returns (uint256 shares)
{
    // Binary search to find shares amount that costs approximately ethAmount
    uint256 low = 0;
    uint256 high = ethAmount * 10;  // Reasonable upper bound
    uint256 tolerance = ethAmount / 1000;  // 0.1% tolerance

    while (low < high) {
        uint256 mid = (low + high) / 2;
        uint256 cost = IBondingCurve(_bondingCurve).calculateCost(
            _curveParams,
            _yesShares,
            _noShares,
            isYes,
            mid
        );

        if (cost < ethAmount - tolerance) {
            low = mid + 1;
        } else if (cost > ethAmount + tolerance) {
            high = mid - 1;
        } else {
            return mid;  // Found acceptable shares amount
        }
    }

    return low;
}
```

### Phase 3D: getOdds() Refactor (Day 7 Afternoon)

**Task**: Replace AMM formula with bonding curve getPrices()
**Estimated Time**: 30 minutes
**Complexity**: LOW - Simple replacement
**Files**: `PredictionMarket.sol`

**Current Logic (lines 398-415):**
```solidity
function getOdds() external view returns (uint256 odds1, uint256 odds2) {
    uint256 virtualPool1 = _pool1 + VIRTUAL_LIQUIDITY;
    uint256 virtualPool2 = _pool2 + VIRTUAL_LIQUIDITY;
    uint256 virtualTotal = virtualPool1 + virtualPool2;

    odds1 = (virtualTotal * 10000) / virtualPool1;
    odds2 = (virtualTotal * 10000) / virtualPool2;
}
```

**New Logic:**
```solidity
function getOdds() external view returns (uint256 odds1, uint256 odds2) {
    // Get prices from bonding curve (returns basis points)
    (uint256 price1, uint256 price2) = IBondingCurve(_bondingCurve).getPrices(
        _curveParams,
        _yesShares,
        _noShares
    );

    // Convert prices to odds
    // Price = probability, Odds = 1/probability
    // Example: price1=7500 (75%) → odds1=13333 (1.33x)
    odds1 = (10000 * 10000) / price1;  // Basis points conversion
    odds2 = (10000 * 10000) / price2;

    return (odds1, odds2);
}
```

### Phase 3E: calculatePayout() Refactor (Day 7 Evening)

**Task**: Replace pool proportions with share-based refunds
**Estimated Time**: 2 hours
**Complexity**: HIGH - Critical payout logic
**Files**: `PredictionMarket.sol`

**Current Logic (lines 426-459):**
```solidity
function calculatePayout(address bettor) public view returns (uint256) {
    // ... validation ...

    uint256 totalPool = _pool1 + _pool2;
    uint256 winningPool = (result == Outcome.OUTCOME1) ? _pool1 : _pool2;

    // Winner's share = (their bet / winning pool) * net pool
    uint256 payout = (bet.amount * netPool) / winningPool;

    return payout;
}
```

**New Logic:**
```solidity
function calculatePayout(address bettor) public view returns (uint256) {
    if (!isResolved) return 0;

    BetInfo memory bet = _bets[bettor];
    if (bet.shares == 0) return 0;
    if (bet.outcome != result) return 0;  // Losers get nothing

    // Calculate refund for selling shares back to curve
    bool isYes = (result == Outcome.OUTCOME1);
    uint256 grossRefund = IBondingCurve(_bondingCurve).calculateRefund(
        _curveParams,
        _yesShares,
        _noShares,
        isYes,
        bet.shares
    );

    // Deduct platform fees proportionally
    // Fee ratio = _platformFees / totalPool
    uint256 totalPool = _pool1 + _pool2;
    if (totalPool == 0) return 0;  // Safety check

    uint256 feeRatio = (_platformFees * 10000) / totalPool;  // Basis points
    uint256 netRefund = grossRefund - ((grossRefund * feeRatio) / 10000);

    return netRefund;
}
```

### Phase 3F: Add View Functions (Day 8 Morning)

**Task**: Add helper functions for UI/analytics
**Estimated Time**: 1 hour
**Files**: `PredictionMarket.sol`

```solidity
/**
 * @notice Get current share balances
 * @return yesShares Total YES shares issued
 * @return noShares Total NO shares issued
 */
function getShares() external view returns (uint256 yesShares, uint256 noShares) {
    return (_yesShares, _noShares);
}

/**
 * @notice Get bonding curve information
 * @return curve Bonding curve contract address
 * @return params Curve parameters
 * @return name Curve type name
 */
function getCurveInfo() external view returns (
    address curve,
    uint256 params,
    string memory name
) {
    return (
        _bondingCurve,
        _curveParams,
        IBondingCurve(_bondingCurve).curveName()
    );
}

/**
 * @notice Estimate shares for given ETH amount
 * @param ethAmount ETH to spend
 * @param outcome Outcome to bet on (1 or 2)
 * @return shares Estimated shares received
 */
function estimateShares(uint256 ethAmount, uint8 outcome)
    external
    view
    returns (uint256 shares)
{
    bool isYes = (Outcome(outcome) == Outcome.OUTCOME1);
    return _calculateSharesForCost(ethAmount, isYes);
}

/**
 * @notice Estimate cost for given shares
 * @param shares Shares to buy
 * @param outcome Outcome to bet on (1 or 2)
 * @return cost Estimated ETH cost
 */
function estimateCost(uint256 shares, uint8 outcome)
    external
    view
    returns (uint256 cost)
{
    bool isYes = (Outcome(outcome) == Outcome.OUTCOME1);
    return IBondingCurve(_bondingCurve).calculateCost(
        _curveParams,
        _yesShares,
        _noShares,
        isYes,
        shares
    );
}
```

---

## 🧪 Testing Strategy

### Phase 3G: Unit Test Updates (Day 8 Afternoon)

**Task**: Update 66 PredictionMarket unit tests
**Files**: `test/unit/PredictionMarket.test.js`
**Estimated Time**: 3-4 hours

**Test Categories to Update:**

1. **Initialization Tests** (5 tests)
   - Add curve parameter validation
   - Test invalid curve address
   - Test invalid curve params

2. **Betting Tests** (15 tests)
   - Update to verify shares issued
   - Test share calculation accuracy
   - Verify pools AND shares updated

3. **Odds/Pricing Tests** (8 tests)
   - Replace AMM assertions with curve-based
   - Test different curve types (LMSR, Linear, Exponential, Sigmoid)
   - Verify price dynamics

4. **Payout Tests** (20 tests)
   - Update to use share-based calculations
   - Test with different curve types
   - Verify fee deductions

5. **Edge Case Tests** (18 tests)
   - One-sided markets
   - Zero shares scenarios
   - Large bet slippage

### Phase 3H: Integration Test Updates (Day 8 Evening)

**Task**: Update 15 integration tests
**Files**: `test/integration/*.test.js`
**Estimated Time**: 2 hours

**Integration Test Suites:**

1. **FactoryCurveInfrastructure.test.js** (12 tests)
   - Update market creation with curve selection
   - Test all 4 curve types
   - Verify cross-contract interactions

2. **End-to-End Flow Tests** (3 tests)
   - Full betting lifecycle with curves
   - Multi-user scenarios
   - Resolution and payout validation

---

## ⚠️ Risk Analysis

### Critical Risks

#### 🔴 Risk 1: Share Calculation Accuracy
**Impact**: HIGH - Incorrect shares = wrong payouts
**Likelihood**: MEDIUM
**Mitigation**:
- Use binary search with tight tolerance
- Extensive fuzzing tests
- Compare against known curve outputs

#### 🟡 Risk 2: Backward Compatibility
**Impact**: MEDIUM - Existing markets may break
**Likelihood**: LOW
**Mitigation**:
- Keep existing AMM as fallback curve
- Add migration path for old markets
- Comprehensive regression testing

#### 🟡 Risk 3: Gas Cost Increase
**Impact**: MEDIUM - Binary search adds gas
**Likelihood**: HIGH
**Mitigation**:
- Optimize binary search iterations (max 10)
- Cache curve calculations where possible
- Gas profiling before/after

#### 🟢 Risk 4: Edge Cases
**Impact**: LOW - Rare scenarios may fail
**Likelihood**: MEDIUM
**Mitigation**:
- Handle division by zero
- Test one-sided markets
- Validate all inputs

---

## 📐 Interface Changes

### IPredictionMarket.sol Updates

```solidity
// Add to events
event SharesUpdated(uint256 yesShares, uint256 noShares, uint256 timestamp);

// Add to errors
error InvalidCurve();
error InvalidCurveParams(string reason);
error InsufficientShares();

// Update BetPlaced event
event BetPlaced(
    address indexed bettor,
    Outcome outcome,
    uint256 amount,
    uint256 shares,      // NEW parameter
    uint256 timestamp
);

// Add new functions
function getShares() external view returns (uint256 yesShares, uint256 noShares);
function getCurveInfo() external view returns (address curve, uint256 params, string memory name);
function estimateShares(uint256 ethAmount, uint8 outcome) external view returns (uint256 shares);
function estimateCost(uint256 shares, uint8 outcome) external view returns (uint256 cost);
```

---

## 📦 Deployment Strategy

### Migration Path

**Option A: Hard Cutover (RECOMMENDED)**
- Deploy new PredictionMarket version
- Update FlexibleMarketFactory to use new version
- All new markets use bonding curves
- Old markets continue with AMM (no changes)

**Option B: Gradual Migration**
- Keep both versions deployed
- Add feature flag for curve selection
- Migrate markets one by one

**Decision**: Option A (simpler, cleaner separation)

---

## ✅ Success Criteria

### Phase 3 Complete When:

- [ ] All state variables added and documented
- [ ] `initialize()` accepts curve parameters
- [ ] `placeBet()` calculates and tracks shares
- [ ] `getOdds()` uses bonding curve pricing
- [ ] `calculatePayout()` uses share-based refunds
- [ ] All 66 unit tests passing (100%)
- [ ] All 15 integration tests passing (100%)
- [ ] Gas profiling shows <10% increase
- [ ] Zero compilation errors
- [ ] Documentation updated
- [ ] Code reviewed and approved

---

## 📊 Gas Profiling Targets

### Before (AMM):
- `placeBet()`: ~80k gas
- `getOdds()`: ~5k gas
- `calculatePayout()`: ~8k gas

### After (Curves):
- `placeBet()`: <100k gas (target: 90k)
- `getOdds()`: <10k gas (target: 8k)
- `calculatePayout()`: <15k gas (target: 12k)

**Acceptable Increase**: 10-20% for added flexibility

---

## 📅 Implementation Timeline

### Day 7 (November 5)
- **Morning** (9am-12pm): Phase 3A + 3B (state variables, initialize)
- **Afternoon** (1pm-5pm): Phase 3C + 3D (placeBet, getOdds)
- **Evening** (6pm-9pm): Phase 3E (calculatePayout)

### Day 8 (November 6)
- **Morning** (9am-12pm): Phase 3F (view functions)
- **Afternoon** (1pm-5pm): Phase 3G (unit tests)
- **Evening** (6pm-9pm): Phase 3H (integration tests)

**Total Estimated Time**: 16 hours over 2 days

---

## 🎯 Next Steps

1. **Review this architecture** with stakeholders
2. **Get approval** on design decisions
3. **Begin Phase 3A** implementation
4. **Track progress** with TodoWrite
5. **Document changes** in DAY_7_IMPLEMENTATION.md

---

**Architecture Status**: ✅ READY FOR IMPLEMENTATION
**Approval Required**: YES
**Blocking Issues**: NONE

