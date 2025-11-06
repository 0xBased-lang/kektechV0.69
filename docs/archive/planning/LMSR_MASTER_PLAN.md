# 🎯 LMSR MASTER PLAN - Complete Implementation Guide
**Date**: November 3, 2025
**Mode**: --ultrathink (Maximum Precision & Detail)
**Purpose**: Replace AMM with True LMSR Bonding Curves

---

## 🔴 CRITICAL: What Went Wrong

### The Mistake We Made
We implemented an **AMM (Automated Market Maker)** instead of **LMSR (Logarithmic Market Scoring Rule)** bonding curves:

```solidity
// WRONG - What we built (AMM):
yesPrice = noSupply / (yesSupply + noSupply)
// This is NOT a bonding curve!
```

```solidity
// CORRECT - What we need (LMSR):
C(q_yes, q_no) = b * ln(e^(q_yes/b) + e^(q_no/b))
P(YES) = ∂C/∂q_yes = e^(q_yes/b) / (e^(q_yes/b) + e^(q_no/b))
```

### Why This Matters
1. **AMM requires both sides** - Markets fail with only YES or NO traders
2. **No pool tracking** - Current implementation can't pay winners properly
3. **Wrong mechanism** - Not the bonding curve system we designed
4. **Complexity** - AMM is harder to maintain than LMSR

---

## 📋 IMPLEMENTATION ROADMAP

### PHASE 1: Foundation (Days 1-3)

#### Day 1: LMSR Math Library
**File**: `contracts/libraries/LMSRMath.sol`
**Purpose**: Core mathematical functions for LMSR

**Requirements**:
1. Install ABDKMath64x64 library for fixed-point math
2. Implement cost function: `C = b * ln(e^(q_yes/b) + e^(q_no/b))`
3. Implement price functions (partial derivatives)
4. Gas optimization with approximations
5. Comprehensive unit tests (50+ tests)

**Key Functions**:
```solidity
function cost(uint256 b, uint256 qYes, uint256 qNo) returns (uint256);
function priceYes(uint256 b, uint256 qYes, uint256 qNo) returns (uint256);
function priceNo(uint256 b, uint256 qYes, uint256 qNo) returns (uint256);
function buyShares(uint256 b, uint256 qYes, uint256 qNo, bool outcome, uint256 shares) returns (uint256 cost);
function sellShares(uint256 b, uint256 qYes, uint256 qNo, bool outcome, uint256 shares) returns (uint256 refund);
```

#### Day 2: LMSRMarket Contract
**File**: `contracts/markets/LMSRMarket.sol`
**Purpose**: Market implementation using LMSR

**State Variables**:
```solidity
uint256 public b;              // Liquidity parameter
uint256 public totalYes;       // Total YES shares
uint256 public totalNo;        // Total NO shares
uint256 public poolBalance;    // ETH in pool (CRITICAL!)
mapping(address => uint256) public yesShares;
mapping(address => uint256) public noShares;
```

**Critical Functions**:
1. `buy(bool outcome, uint256 minShares)` - Buy with slippage protection
2. `sell(bool outcome, uint256 shares, uint256 minRefund)` - Sell with protection
3. `claim()` - Proportional payout from poolBalance
4. `resolveMarket()` - Integration with ResolutionManager

#### Day 3: Integration & Testing
**Tasks**:
1. Replace DualCurveMath with LMSRMath
2. Update all contract imports
3. Test one-sided markets
4. Verify pool balance consistency
5. Confirm prices sum to 1

---

### PHASE 2: Template System (Days 4-6)

#### Day 4: Curve Interface & Registry
**Files**:
- `contracts/interfaces/IBondingCurve.sol` - Standard interface
- `contracts/core/CurveRegistry.sol` - Registry for curve types

**Interface Definition**:
```solidity
interface IBondingCurve {
    function calculateCost(
        uint256 params,
        uint256 currentYes,
        uint256 currentNo,
        bool outcome,
        uint256 shares
    ) external pure returns (uint256);

    function getPrices(
        uint256 params,
        uint256 yesSupply,
        uint256 noSupply
    ) external pure returns (uint256 yesPrice, uint256 noPrice);
}
```

#### Day 5: Multiple Curve Implementations
**Files to Create**:
1. `contracts/curves/LMSRCurve.sol` - Primary implementation
2. `contracts/curves/LinearCurve.sol` - Simple linear bonding
3. `contracts/curves/ExponentialCurve.sol` - Exponential growth
4. `contracts/curves/SigmoidCurve.sol` - S-curve adoption

#### Day 6: Factory Integration
**Update**: `contracts/core/FlexibleMarketFactory.sol`

**New Parameters**:
```solidity
enum CurveType { LMSR, LINEAR, EXPONENTIAL, SIGMOID }

function createMarket(
    string memory question,
    uint256 deadline,
    CurveType curveType,    // NEW
    uint256 curveParams,     // NEW (b for LMSR, slope for Linear, etc.)
    uint256 feePercent
) external returns (address);
```

---

### PHASE 3: KEKTECH Integration (Days 7-8)

#### Day 7: Maintain All Integrations
**Critical Integration Points** (DO NOT CHANGE):

1. **ResolutionManager Integration**
   - Keep resolution authorization flow
   - Maintain dispute mechanism
   - Preserve admin override capability

2. **RewardDistributor Integration**
   - Maintain 30% Platform, 20% Creator, 50% Staking split
   - Keep fee distribution mechanism
   - Preserve accumulation patterns

3. **AccessControlManager Integration**
   - Keep role-based access
   - Maintain admin/operator/resolver roles
   - Preserve security model

4. **MasterRegistry Pattern**
   - Keep registry lookups
   - Maintain contract discovery
   - Preserve upgrade patterns

#### Day 8: Update Tests
**Test Updates Required**:
- 66 unit tests → Update for LMSR
- 15 integration tests → Maintain KEKTECH integration
- NEW: 20+ one-sided market tests
- NEW: 10+ pool balance consistency tests
- Maintain gas optimization tests

---

### PHASE 4: Validation (Days 9-10)

#### Day 9: Comprehensive Testing
**Required Test Coverage**:

```yaml
Unit Tests (100+ tests):
  LMSR Math:
    - Cost function accuracy: 20 tests
    - Price calculations: 20 tests
    - Edge cases: 10 tests

  Market Operations:
    - Buy/sell mechanics: 20 tests
    - One-sided markets: 10 tests
    - Pool balance: 10 tests
    - Claims: 10 tests

Integration Tests (30+ tests):
  KEKTECH System:
    - Full lifecycle: 10 tests
    - Resolution flow: 5 tests
    - Fee distribution: 5 tests
    - Access control: 5 tests
    - Registry pattern: 5 tests
```

#### Day 10: Documentation & Deployment Prep
**Documentation Required**:
1. Technical specification update
2. Curve comparison guide
3. Parameter tuning guide
4. Deployment instructions
5. User guides

---

## 🔧 TECHNICAL SPECIFICATIONS

### 1. LMSR Mathematical Model

```
Cost Function:
C(q_yes, q_no) = b * ln(e^(q_yes/b) + e^(q_no/b))

Prices (from partial derivatives):
P(YES) = e^(q_yes/b) / (e^(q_yes/b) + e^(q_no/b))
P(NO) = e^(q_no/b) / (e^(q_yes/b) + e^(q_no/b))

Properties:
- Prices always sum to 1
- Works with one-sided markets
- Smooth price curves
- No discontinuities
```

### 2. Pool Balance Management

```solidity
// Critical: Track all ETH flows
uint256 public poolBalance;

// On buy:
uint256 cost = LMSRMath.buyShares(b, totalYes, totalNo, outcome, shares);
require(msg.value >= cost, "Insufficient payment");
poolBalance += cost;

// On sell:
uint256 refund = LMSRMath.sellShares(b, totalYes, totalNo, outcome, shares);
require(poolBalance >= refund, "Insufficient pool");
poolBalance -= refund;
payable(msg.sender).transfer(refund);

// On claim (proportional payout):
uint256 totalWinning = outcomeYes ? totalYes : totalNo;
uint256 payout = (userShares * poolBalance) / totalWinning;
poolBalance -= payout;
payable(msg.sender).transfer(payout);
```

### 3. One-Sided Market Support

```solidity
// LMSR naturally handles one-sided markets
// Example: Only YES traders
totalYes = 1000, totalNo = 0

// Price still computable:
P(YES) = e^(1000/b) / (e^(1000/b) + e^(0/b))
       = e^(1000/b) / (e^(1000/b) + 1)
       ≈ 0.99... (approaches 1)

P(NO) = 1 / (e^(1000/b) + 1)
      ≈ 0.00... (approaches 0)

// No liquidity issues! Market still functions.
```

### 4. Fixed-Point Math Implementation

```solidity
// Use ABDKMath64x64 for safe exp/log operations
import "@abdk-consulting/abdk-libraries-solidity/ABDKMath64x64.sol";

library LMSRMath {
    using ABDKMath64x64 for int128;

    function exp(uint256 x) internal pure returns (uint256) {
        int128 fp = ABDKMath64x64.fromUInt(x);
        int128 result = ABDKMath64x64.exp(fp);
        return ABDKMath64x64.toUInt(result);
    }

    function ln(uint256 x) internal pure returns (uint256) {
        int128 fp = ABDKMath64x64.fromUInt(x);
        int128 result = ABDKMath64x64.ln(fp);
        return ABDKMath64x64.toUInt(result);
    }
}
```

---

## 🎯 SUCCESS CRITERIA

### Functional Requirements
- [ ] LMSR cost function working correctly
- [ ] Prices always sum to 1.0 (±0.001)
- [ ] One-sided markets fully functional
- [ ] Pool balance always consistent
- [ ] All KEKTECH integrations preserved

### Performance Requirements
- [ ] Buy operation: <150k gas
- [ ] Sell operation: <100k gas
- [ ] Claim operation: <50k gas
- [ ] Deploy cost: <4M gas

### Security Requirements
- [ ] No integer overflow/underflow
- [ ] ReentrancyGuard on all state-changing functions
- [ ] Proper access control via AccessControlManager
- [ ] Slippage protection on trades
- [ ] Pool balance invariants maintained

### Integration Requirements
- [ ] IMarket interface fully implemented
- [ ] ResolutionManager integration working
- [ ] RewardDistributor receiving fees
- [ ] MasterRegistry pattern maintained
- [ ] All existing KEKTECH contracts compatible

---

## 📁 FILE STRUCTURE

```
expansion-packs/bmad-blockchain-dev/
├── contracts/
│   ├── interfaces/
│   │   ├── IBondingCurve.sol        [NEW]
│   │   └── IMarket.sol               [EXISTS]
│   ├── libraries/
│   │   ├── LMSRMath.sol             [NEW - replaces DualCurveMath]
│   │   └── FeeCalculator.sol        [KEEP]
│   ├── curves/                      [NEW FOLDER]
│   │   ├── LMSRCurve.sol
│   │   ├── LinearCurve.sol
│   │   ├── ExponentialCurve.sol
│   │   └── SigmoidCurve.sol
│   ├── markets/
│   │   ├── LMSRMarket.sol          [NEW - replaces BondingCurveMarket]
│   │   └── ParimutuelMarket.sol    [KEEP]
│   └── core/
│       ├── CurveRegistry.sol        [NEW]
│       └── FlexibleMarketFactory.sol [UPDATE]
├── test/
│   ├── unit/
│   │   ├── LMSRMath.test.js        [NEW]
│   │   └── LMSRMarket.test.js      [NEW]
│   └── integration/
│       └── LMSRIntegration.test.js  [NEW]
└── scripts/
    └── deploy/
        └── deploy-lmsr-market.js    [NEW]
```

---

## ⚠️ CRITICAL WARNINGS

### DO NOT:
1. Change IMarket interface - Must remain compatible
2. Modify fee distribution - Keep 30/20/50 split
3. Break ResolutionManager integration
4. Remove access control checks
5. Deploy without pool balance tracking

### MUST DO:
1. Track poolBalance for every ETH flow
2. Test one-sided markets thoroughly
3. Use fixed-point math for exp/log
4. Implement slippage protection
5. Maintain all KEKTECH integrations

---

## 📅 TIMELINE

```
Week 1 (Implementation):
  Mon-Wed: Core LMSR implementation (Days 1-3)
  Thu-Sat: Template system (Days 4-6)

Week 2 (Integration & Testing):
  Mon-Tue: KEKTECH integration (Days 7-8)
  Wed-Thu: Testing & validation (Days 9-10)
  Fri: Buffer for issues

Week 3 (Deployment):
  Mon-Tue: Sepolia deployment
  Wed-Thu: Community testing
  Fri: BasedAI fork testing

Week 4 (Production):
  Mon: Final preparations
  Tue: Multi-sig setup
  Wed: Mainnet deployment
```

---

## 🚀 DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] All tests passing (150+ tests)
- [ ] Gas costs within targets
- [ ] Security audit clean (Slither)
- [ ] Pool balance consistency verified
- [ ] One-sided markets tested
- [ ] Integration tests passing
- [ ] Documentation complete

### Deployment Steps
1. Deploy to Sepolia testnet
2. Create test markets (LMSR + Linear)
3. Run for 72+ hours
4. Fork BasedAI mainnet
5. Test with real state
6. Deploy via multi-sig

### Post-Deployment
- [ ] Verify contracts on explorer
- [ ] Register in MasterRegistry
- [ ] Create initial markets
- [ ] Monitor for 48 hours
- [ ] Enable additional curves

---

## 📚 REFERENCES

1. **LMSR Original Paper**: Hanson, R. (2003). "Combinatorial Information Market Design"
2. **Implementation Guide**: Your provided LMSR example code
3. **Fixed-Point Math**: ABDK Libraries Documentation
4. **KEKTECH Integration**: Existing IMarket interface and contracts

---

*This is the master plan. All implementation must follow this specification exactly.*
*Created with --ultrathink for zero ambiguity and maximum precision.*