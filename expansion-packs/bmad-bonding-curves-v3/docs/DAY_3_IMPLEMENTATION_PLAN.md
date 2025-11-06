# 📋 Day 3 Implementation Plan - BondingCurveMarket Integration

**Date**: November 4, 2025
**Goal**: Create the orchestration layer that integrates DualCurveMath + FeeCalculator
**Estimated Time**: 4-6 hours
**Status**: Ready to implement

---

## 🎯 Objectives

Create a complete prediction market contract that:
1. ✅ Uses DualCurveMath for price calculations and share management
2. ✅ Uses FeeCalculator for two-tier fee system
3. ✅ Implements 3-way fee distribution (Platform/Creator/Staking)
4. ✅ Provides slippage protection for traders
5. ✅ Handles market lifecycle (creation → trading → resolution → claims)
6. ✅ Emits comprehensive events for indexing

---

## 🏗️ Architecture Overview

### Layer Integration
```
┌─────────────────────────────────────────────────────┐
│          BondingCurveMarket.sol                     │
│         (Orchestration Layer)                       │
│                                                     │
│  ┌──────────────────┐    ┌──────────────────┐     │
│  │  DualCurveMath   │    │  FeeCalculator   │     │
│  │   (Layer 1)      │    │    (Layer 2)     │     │
│  │                  │    │                  │     │
│  │ - getPrices()    │    │ - calculateFee() │     │
│  │ - buyShares()    │    │ - splitFee()     │     │
│  │ - sellPayout()   │    │ - validate()     │     │
│  └──────────────────┘    └──────────────────┘     │
│                                                     │
│  Market Lifecycle:                                 │
│  Creation → Trading → Resolution → Claims          │
└─────────────────────────────────────────────────────┘
```

### Contract Responsibilities

**BondingCurveMarket.sol**:
- Market state management
- User position tracking
- Fee collection and distribution
- Slippage protection
- Resolution logic
- Event emission

**DualCurveMath.sol** (existing):
- Price calculations
- Share calculations
- Payout calculations
- Price impact calculations

**FeeCalculator.sol** (existing):
- Fee calculation (bond + voluntary)
- Distribution validation
- Fee splitting

---

## 📊 Contract Specification

### State Variables

```solidity
// ═══════════════════════════════════════════════════════════
// MARKET METADATA
// ═══════════════════════════════════════════════════════════

/// @notice Market question
string public question;

/// @notice Market creator (receives creator fees)
address public creator;

/// @notice Market creation timestamp
uint256 public createdAt;

/// @notice Market resolution deadline
uint256 public resolutionDeadline;

// ═══════════════════════════════════════════════════════════
// ECONOMIC PARAMETERS (Set at creation, immutable)
// ═══════════════════════════════════════════════════════════

/// @notice Bond amount (returned to creator after resolution)
uint256 public bondAmount;

/// @notice Voluntary fee paid at creation (NOT returned)
uint256 public voluntaryFee;

/// @notice Trading fee in basis points (calculated at creation)
uint256 public tradingFeeBps;

/// @notice Platform's share of trading fees (basis points)
uint256 public platformShareBps;

/// @notice Creator's share of trading fees (basis points)
uint256 public creatorShareBps;

/// @notice Staking pool's share of trading fees (basis points)
uint256 public stakingShareBps;

// ═══════════════════════════════════════════════════════════
// BONDING CURVE STATE (DualCurveMath integration)
// ═══════════════════════════════════════════════════════════

/// @notice YES position supply (shares outstanding)
uint256 public yesSupply;

/// @notice NO position supply (shares outstanding)
uint256 public noSupply;

/// @notice Liquidity depth parameter (from bond split 50/50)
uint256 public liquidityDepth;

// ═══════════════════════════════════════════════════════════
// USER POSITIONS
// ═══════════════════════════════════════════════════════════

/// @notice User YES position balances
mapping(address => uint256) public yesBalances;

/// @notice User NO position balances
mapping(address => uint256) public noBalances;

// ═══════════════════════════════════════════════════════════
// FEE ACCUMULATION
// ═══════════════════════════════════════════════════════════

/// @notice Accumulated creator fees (claimable)
uint256 public accumulatedCreatorFees;

/// @notice Whether creator has claimed their fees
bool public creatorFeesClaimed;

// ═══════════════════════════════════════════════════════════
// MARKET STATUS
// ═══════════════════════════════════════════════════════════

enum MarketStatus { Active, Resolved, Disputed }

/// @notice Current market status
MarketStatus public status;

/// @notice Resolution outcome (true = YES, false = NO)
bool public outcome;

/// @notice Resolution timestamp
uint256 public resolvedAt;

// ═══════════════════════════════════════════════════════════
// EXTERNAL ADDRESSES
// ═══════════════════════════════════════════════════════════

/// @notice Platform address (receives platform fees)
address public platformAddress;

/// @notice Staking pool address (receives staking fees)
address public stakingPoolAddress;
```

### Functions to Implement

#### 1. Constructor / Initialization
```solidity
constructor(
    string memory _question,
    address _creator,
    uint256 _bondAmount,
    uint256 _voluntaryFee,
    uint256 _tradingFeeBps,
    uint256 _platformShareBps,
    uint256 _creatorShareBps,
    uint256 _stakingShareBps,
    address _platformAddress,
    address _stakingPoolAddress,
    uint256 _resolutionDeadline
) payable
```

**Responsibilities**:
- Validate all parameters
- Store market metadata
- Initialize bonding curve with bond as initial liquidity (50/50 YES/NO)
- Set fee parameters
- Validate 3-way distribution
- Emit MarketCreated event

**Validation**:
- msg.value >= bondAmount + voluntaryFee
- tradingFeeBps <= MAX_TRADING_FEE_BPS
- platformShareBps + creatorShareBps + stakingShareBps == PRECISION
- resolutionDeadline > block.timestamp

#### 2. Buy Function
```solidity
function buy(
    bool isYes,
    uint256 minShares
) external payable returns (uint256 shares)
```

**Flow**:
1. Calculate trading fee from msg.value
2. Deduct fee, use remainder for share purchase
3. Calculate shares using DualCurveMath.calculateBuyShares()
4. Verify shares >= minShares (slippage protection)
5. Update supply (yesSupply or noSupply)
6. Split fee 3-way using FeeCalculator.splitFee()
7. Transfer platform fee immediately
8. Accumulate creator fee for later claim
9. Transfer staking fee to staking pool
10. Update user balance
11. Emit Trade event

**Gas Target**: <200k

#### 3. Sell Function
```solidity
function sell(
    bool isYes,
    uint256 shares,
    uint256 minPayout
) external returns (uint256 payout)
```

**Flow**:
1. Verify user has sufficient balance
2. Calculate gross payout using DualCurveMath.calculateSellPayout()
3. Calculate trading fee from gross payout
4. Deduct fee for net payout
5. Verify netPayout >= minPayout (slippage protection)
6. Update supply (reduce yesSupply or noSupply)
7. Split fee 3-way using FeeCalculator.splitFee()
8. Transfer platform fee immediately
9. Accumulate creator fee for later claim
10. Transfer staking fee to staking pool
11. Update user balance
12. Transfer net payout to user
13. Emit Trade event

**Gas Target**: <200k

#### 4. View Functions
```solidity
function getPrices() external view returns (uint256 yesPrice, uint256 noPrice)
function getMarketInfo() external view returns (MarketInfo memory)
function getUserPosition(address user) external view returns (uint256 yesBalance, uint256 noBalance)
function estimateBuy(bool isYes, uint256 ethAmount) external view returns (uint256 shares, uint256 fee)
function estimateSell(bool isYes, uint256 shares) external view returns (uint256 payout, uint256 fee)
```

#### 5. Creator Fee Management
```solidity
function claimCreatorFees() external
```

**Requirements**:
- Only creator can call
- Market must be resolved
- Fees not already claimed
- Transfer accumulated creator fees + bond

#### 6. Resolution
```solidity
function resolve(bool _outcome) external
```

**Requirements**:
- Only authorized resolver (TBD: could be creator, oracle, DAO)
- Market must be Active
- Resolution deadline must be passed
- Set outcome
- Update status to Resolved
- Emit MarketResolved event

#### 7. Claim Winnings
```solidity
function claim() external returns (uint256 payout)
```

**Requirements**:
- Market must be Resolved
- User must have winning position
- Calculate payout based on position and outcome
- Clear user position
- Transfer payout
- Emit Claimed event

### Events

```solidity
event MarketCreated(
    address indexed creator,
    string question,
    uint256 bondAmount,
    uint256 voluntaryFee,
    uint256 tradingFeeBps,
    uint256 platformShareBps,
    uint256 creatorShareBps,
    uint256 stakingShareBps,
    uint256 resolutionDeadline
);

event Trade(
    address indexed trader,
    bool indexed isYes,
    bool indexed isBuy,
    uint256 shares,
    uint256 amount,
    uint256 fee,
    uint256 yesPrice,
    uint256 noPrice
);

event FeeDistributed(
    uint256 platformAmount,
    uint256 creatorAmount,
    uint256 stakingAmount
);

event CreatorFeesClaimed(
    address indexed creator,
    uint256 amount,
    uint256 bondReturned
);

event MarketResolved(
    bool outcome,
    uint256 timestamp
);

event Claimed(
    address indexed user,
    uint256 payout,
    bool wasYes
);
```

---

## 🧪 Testing Strategy

### Test Categories (Estimated 60+ tests)

#### 1. Market Creation (8 tests)
- ✅ Valid market creation
- ✅ Invalid parameters (bond too low, distribution invalid, etc.)
- ✅ Initial liquidity setup (50/50 split)
- ✅ Fee parameter validation
- ✅ Event emission
- ✅ Initial prices (should be 50/50)

#### 2. Buy Operations (12 tests)
- ✅ Basic buy (YES and NO)
- ✅ Fee calculation and deduction
- ✅ Share calculation accuracy
- ✅ Slippage protection (minShares)
- ✅ Fee distribution (3-way)
- ✅ Balance updates
- ✅ Price impact
- ✅ Event emission
- ✅ Edge cases (minimum buy, maximum buy)
- ✅ Revert cases (zero amount, slippage exceeded)

#### 3. Sell Operations (12 tests)
- ✅ Basic sell (YES and NO)
- ✅ Fee calculation and deduction
- ✅ Payout calculation accuracy
- ✅ Slippage protection (minPayout)
- ✅ Fee distribution (3-way)
- ✅ Balance updates
- ✅ Price impact
- ✅ Event emission
- ✅ Edge cases (sell all, partial sell)
- ✅ Revert cases (insufficient balance, slippage exceeded)

#### 4. Fee Distribution (8 tests)
- ✅ Platform fee transfer
- ✅ Creator fee accumulation
- ✅ Staking fee transfer
- ✅ Fee splitting accuracy
- ✅ Multiple trades accumulation
- ✅ Creator fee claiming
- ✅ Bond return to creator
- ✅ Double claim prevention

#### 5. Price Calculations (6 tests)
- ✅ Initial prices (50/50)
- ✅ Price updates after buy
- ✅ Price updates after sell
- ✅ Price invariant (YES + NO = 1)
- ✅ Extreme market conditions
- ✅ getPrices() accuracy

#### 6. Resolution & Claims (10 tests)
- ✅ Resolve YES outcome
- ✅ Resolve NO outcome
- ✅ Authorization checks
- ✅ Claim winnings (YES winners)
- ✅ Claim winnings (NO winners)
- ✅ Losers cannot claim
- ✅ Double claim prevention
- ✅ Payout accuracy
- ✅ Bond return to creator
- ✅ Market status transitions

#### 7. Integration Scenarios (6 tests)
- ✅ Complete lifecycle (create → trade → resolve → claim)
- ✅ Multiple traders
- ✅ Complex trading patterns
- ✅ Fee accumulation over time
- ✅ Invariant maintenance
- ✅ Edge case combinations

#### 8. View Functions (4 tests)
- ✅ getPrices() accuracy
- ✅ getMarketInfo() completeness
- ✅ getUserPosition() accuracy
- ✅ estimateBuy/estimateSell() accuracy

**Total Estimated Tests**: 66 tests

---

## 🎯 Implementation Phases

### Phase 1: Core Structure (1 hour)
1. ✅ Define all state variables
2. ✅ Define all events
3. ✅ Define custom errors
4. ✅ Create constructor
5. ✅ Compile successfully

### Phase 2: Trading Functions (2 hours)
1. ✅ Implement buy() function
2. ✅ Implement sell() function
3. ✅ Implement fee distribution logic
4. ✅ Implement view functions (getPrices, estimates)
5. ✅ Test trading flow

### Phase 3: Resolution & Claims (1 hour)
1. ✅ Implement resolve() function
2. ✅ Implement claim() function
3. ✅ Implement claimCreatorFees() function
4. ✅ Test resolution flow

### Phase 4: Testing (1.5 hours)
1. ✅ Create comprehensive test suite (66 tests)
2. ✅ Run all tests
3. ✅ Achieve 100% function coverage
4. ✅ Fix any issues

### Phase 5: Gas Optimization (0.5 hours)
1. ✅ Generate gas report
2. ✅ Optimize expensive operations
3. ✅ Verify gas targets
4. ✅ Document gas usage

---

## 🔑 Key Design Decisions

### 1. Bond as Initial Liquidity ✅
- Split bond 50/50 into YES/NO reserves
- Creates initial liquidity depth
- Returned to creator after resolution
- Ensures market is tradable from start

### 2. Fee Collection on Buy & Sell ✅
- Immediate platform fee transfer
- Creator fee accumulation (claimed later)
- Immediate staking pool transfer
- Prevents fee manipulation

### 3. Slippage Protection ✅
- minShares on buy (minimum shares received)
- minPayout on sell (minimum payout received)
- Protects against frontrunning and price impact
- User-controlled tolerance

### 4. Immutable Fee Parameters ✅
- Set at market creation
- Cannot be changed during trading
- Predictable economics
- No governance attacks during lifecycle

### 5. Creator Fee + Bond Claiming ✅
- Creator can only claim after resolution
- Single transaction (fees + bond)
- Incentivizes proper resolution
- Prevents premature withdrawal

---

## 📋 Implementation Checklist

**Before Starting**:
- [x] Day 1 complete (DualCurveMath)
- [x] Day 2 complete (FeeCalculator)
- [x] Documentation reviewed
- [x] Architecture understood

**Phase 1: Core Structure**:
- [ ] State variables defined
- [ ] Events defined
- [ ] Custom errors defined
- [ ] Constructor implemented
- [ ] Compiles successfully

**Phase 2: Trading**:
- [ ] buy() implemented
- [ ] sell() implemented
- [ ] Fee distribution working
- [ ] View functions implemented
- [ ] Trading tests passing

**Phase 3: Resolution**:
- [ ] resolve() implemented
- [ ] claim() implemented
- [ ] claimCreatorFees() implemented
- [ ] Resolution tests passing

**Phase 4: Testing**:
- [ ] 66 tests written
- [ ] All tests passing
- [ ] Coverage >95%
- [ ] Edge cases covered

**Phase 5: Optimization**:
- [ ] Gas report generated
- [ ] Optimizations applied
- [ ] Gas targets met
- [ ] Documentation updated

---

## 🚀 Success Criteria

**Functionality**:
- ✅ All core functions working
- ✅ DualCurveMath integration correct
- ✅ FeeCalculator integration correct
- ✅ 3-way fee distribution accurate
- ✅ Slippage protection working
- ✅ Market lifecycle complete

**Quality**:
- ✅ 66+ tests passing
- ✅ >95% coverage
- ✅ No critical bugs
- ✅ Gas optimized

**Documentation**:
- ✅ NatSpec complete
- ✅ Architecture documented
- ✅ Integration guide created
- ✅ Test documentation complete

---

## 💡 Notes

**Integration Points**:
- DualCurveMath: Pure view functions (no state changes)
- FeeCalculator: Pure view functions (no state changes)
- BondingCurveMarket: Manages all state, orchestrates libraries

**Security Considerations**:
- Reentrancy protection (CEI pattern + ReentrancyGuard)
- Integer overflow/underflow (Solidity 0.8+ built-in)
- Access control (creator-only functions)
- Fee manipulation prevention (immutable parameters)

**Gas Optimization Targets**:
- buy(): <200k gas
- sell(): <200k gas
- claim(): <100k gas
- View functions: <50k gas

---

*Ready to implement!* 🚀
