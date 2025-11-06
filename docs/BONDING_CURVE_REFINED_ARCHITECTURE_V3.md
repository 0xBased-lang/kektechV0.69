# 🎯 KEKTECH 3.0 - Bonding Curve Refined Architecture v3.0

*Last Updated: November 3, 2025*
*Status: Final refinement with dual-sided curves*

## Executive Summary

Enhanced prediction market architecture with **dual-sided bonding curves** for arbitrage-free pricing, **linear bond-to-fee scaling** for creator incentives, and fully flexible parameter system for optimization.

---

## 🔄 Dual-Sided Bonding Curve Model

### Why Dual-Sided?

**Single-Sided Issues:**
- Price inconsistencies between YES/NO
- Arbitrage opportunities
- Unbounded losses possible
- Complex liquidity reasoning

**Dual-Sided Benefits:**
- ✅ Arbitrage-free prices (YES + NO = 1)
- ✅ Bounded loss for all traders
- ✅ Natural probability representation
- ✅ Credible market behavior
- ✅ Easier liquidity management

### Mathematical Foundation

```solidity
// INVARIANT: Price_YES + Price_NO = 1 always

// Dual-Sided Bonding Curve
contract DualBondingCurve {
    // Core state
    uint256 public yesSupply;
    uint256 public noSupply;
    uint256 public liquidityParameter; // 'b' - controls price sensitivity

    // Price function (Logarithmic Market Scoring Rule variant)
    function getPrice(bool isYes) public view returns (uint256) {
        uint256 yesExp = exp(yesSupply / liquidityParameter);
        uint256 noExp = exp(noSupply / liquidityParameter);
        uint256 total = yesExp + noExp;

        if (isYes) {
            return (yesExp * PRECISION) / total;  // Price in [0,1]
        } else {
            return (noExp * PRECISION) / total;
        }
    }

    // Cost function (integral of price)
    function getCost(bool isYes, uint256 shares) public view returns (uint256) {
        uint256 currentCost = liquidityParameter * ln(
            exp(yesSupply / liquidityParameter) +
            exp(noSupply / liquidityParameter)
        );

        uint256 newYes = isYes ? yesSupply + shares : yesSupply;
        uint256 newNo = !isYes ? noSupply + shares : noSupply;

        uint256 newCost = liquidityParameter * ln(
            exp(newYes / liquidityParameter) +
            exp(newNo / liquidityParameter)
        );

        return newCost - currentCost;
    }
}
```

### Simplified Implementation (Linear Approximation)

For gas efficiency, we can use a simplified dual-sided model:

```solidity
// Simplified: Constant sum with liquidity depth
function getSimplifiedPrice(bool isYes) public view returns (uint256) {
    uint256 totalSupply = yesSupply + noSupply + liquidityDepth;

    if (isYes) {
        // Price increases as YES supply increases
        return ((noSupply + liquidityDepth/2) * PRECISION) / totalSupply;
    } else {
        // Price increases as NO supply increases
        return ((yesSupply + liquidityDepth/2) * PRECISION) / totalSupply;
    }
}

// ALWAYS: getPrice(true) + getPrice(false) = PRECISION (1.0)
```

---

## 💰 Linear Bond-to-Fee Scaling

### Concept: Bond Size Determines Trading Fees

**Instead of separate bond + fee boost, combine them:**

```
Bond Amount → Trading Fee Percentage → Creator Revenue Share
```

### Implementation

```solidity
struct MarketFeeStructure {
    uint256 bondAmount;           // How much creator bonded
    uint256 baseTradingFeeBps;    // Platform minimum fee
    uint256 bonusFeeBps;          // Additional fee from bond size
    uint256 creatorShareBps;      // Creator's share of fees
}

// Linear scaling formula
function calculateTradingFee(uint256 bondAmount) public view returns (uint256) {
    // Get parameters
    uint256 minBond = params.get("MIN_BOND");           // e.g., 10 BASED
    uint256 maxBond = params.get("MAX_BOND");           // e.g., 1000 BASED
    uint256 minFeeBps = params.get("MIN_TRADING_FEE");  // e.g., 100 (1%)
    uint256 maxFeeBps = params.get("MAX_TRADING_FEE");  // e.g., 500 (5%)

    // Linear interpolation
    if (bondAmount <= minBond) return minFeeBps;
    if (bondAmount >= maxBond) return maxFeeBps;

    uint256 feeRange = maxFeeBps - minFeeBps;
    uint256 bondRange = maxBond - minBond;
    uint256 bondDelta = bondAmount - minBond;

    return minFeeBps + (bondDelta * feeRange) / bondRange;
}

// Creator share also scales with bond
function calculateCreatorShare(uint256 bondAmount) public view returns (uint256) {
    uint256 minBond = params.get("MIN_BOND");
    uint256 maxBond = params.get("MAX_BOND");
    uint256 minShareBps = params.get("MIN_CREATOR_SHARE");  // e.g., 2000 (20%)
    uint256 maxShareBps = params.get("MAX_CREATOR_SHARE");  // e.g., 5000 (50%)

    // Linear scaling
    if (bondAmount <= minBond) return minShareBps;
    if (bondAmount >= maxBond) return maxShareBps;

    uint256 shareRange = maxShareBps - minShareBps;
    uint256 bondRange = maxBond - minBond;
    uint256 bondDelta = bondAmount - minBond;

    return minShareBps + (bondDelta * shareRange) / bondRange;
}
```

### Examples

```
Bond: 10 BASED (minimum)
→ Trading Fee: 1%
→ Creator gets: 20% of fees (0.2%)

Bond: 100 BASED
→ Trading Fee: 2%
→ Creator gets: 30% of fees (0.6%)

Bond: 500 BASED
→ Trading Fee: 3.5%
→ Creator gets: 40% of fees (1.4%)

Bond: 1000 BASED (maximum)
→ Trading Fee: 5%
→ Creator gets: 50% of fees (2.5%)
```

---

## 📋 Enhanced Proposal System V3

### ProposalManagerV3 Structure

```solidity
struct EnhancedProposalV3 {
    // === Core Fields ===
    uint256 id;
    address creator;
    string marketQuestion;
    bytes32 category;
    ProposalState state;

    // === Market Settings ===
    string outcome1;
    string outcome2;
    uint256 resolutionTime;
    uint256 minBetAmount;
    uint256 maxBetAmount;
    bool allowEarlyResolution;

    // === Economic Fields (NEW SCALING) ===
    uint256 bondAmount;           // Determines initial liquidity AND fee structure
    uint256 proposalTax;          // Platform fee (non-refundable)

    // === Calculated from Bond (NEW) ===
    uint256 tradingFeeBps;        // Auto-calculated from bond
    uint256 creatorShareBps;      // Auto-calculated from bond

    // === Voting ===
    uint256 forVotes;
    uint256 againstVotes;
    uint256 votingEnd;

    // === Market Reference ===
    address marketAddress;
}
```

---

## 💵 Complete Fee Structure (Clarified)

### Fee Timeline

```
PROPOSAL PHASE
├── Proposal Tax: 0.1-1 BASED → Platform (non-refundable) ✅
└── Bond: 10-1000 BASED → Becomes initial liquidity ✅
    ├── Determines trading fee % (linear scaling)
    └── Determines creator share % (linear scaling)

MARKET CREATION
├── No additional fee (bond covers it) ✅
└── Bond → 50/50 into dual-sided curve reserves

TRADING PHASE (Per-Trade Collection) ✅
├── Trading Fee: 1-5% (based on bond size)
└── Distribution (all flexible):
    ├── Platform: 30-50% (adjustable)
    ├── Creator: 20-50% (based on bond)
    └── Staking: 20-40% (adjustable)

RESOLUTION PHASE
├── No resolution fee ✅
├── No claim fee ✅
└── Bond returned to creator (if not disputed)
```

### Portrait Fee Clarification

**"Portrait Fee" was for custom market imagery/branding**
- This can be removed if not needed
- Or implemented later as optional feature
- Not critical for MVP

---

## 📊 Flexible Parameter System

### All Parameters Adjustable

```solidity
// === BOND SCALING PARAMETERS ===
MIN_BOND_AMOUNT: 10 BASED
MAX_BOND_AMOUNT: 1000 BASED

// === FEE SCALING PARAMETERS ===
MIN_TRADING_FEE_BPS: 100 (1%)
MAX_TRADING_FEE_BPS: 500 (5%)

// === CREATOR SHARE SCALING ===
MIN_CREATOR_SHARE_BPS: 2000 (20% of fees)
MAX_CREATOR_SHARE_BPS: 5000 (50% of fees)

// === DISTRIBUTION (Flexible) ===
PLATFORM_BASE_SHARE_BPS: 3000 (30%)
STAKING_BASE_SHARE_BPS: 3000 (30%)
// Creator gets remainder based on scaling

// === DUAL CURVE PARAMETERS ===
LIQUIDITY_PARAMETER: 100  // 'b' - price sensitivity
INITIAL_LIQUIDITY_DEPTH: 1000  // Virtual liquidity
PRICE_IMPACT_LIMIT_BPS: 500  // Max 5% price impact per trade
```

### Dynamic Adjustment Strategy

```
Week 1-2: Start conservative
├── Min bond: 10 BASED
├── Trading fees: 2-3%
└── Monitor volume

Week 3-4: Optimize based on data
├── Adjust fee ranges
├── Tune creator shares
└── Modify curve parameters

Week 5+: Find equilibrium
├── Lock in successful parameters
├── Create parameter change proposals
└── Community governance takeover
```

---

## 🎮 Dual-Sided Curve Trading Flow

### Buy Flow

```solidity
function buy(bool isYes, uint256 minShares) external payable {
    // 1. Deduct trading fee
    uint256 fee = (msg.value * tradingFeeBps) / 10000;
    uint256 amountAfterFee = msg.value - fee;

    // 2. Calculate shares from dual curve
    uint256 shares = calculateSharesFromDualCurve(isYes, amountAfterFee);
    require(shares >= minShares, "Slippage");

    // 3. Update supplies (maintains price invariant)
    if (isYes) {
        yesSupply += shares;
    } else {
        noSupply += shares;
    }

    // 4. Distribute fees immediately
    distributeTradingFees(fee);

    // 5. Credit user
    balances[msg.sender][isYes] += shares;

    // 6. Emit events with new prices
    emit Trade(msg.sender, isYes, true, shares, getPrice(true), getPrice(false));
}
```

### Sell Flow

```solidity
function sell(bool isYes, uint256 shares, uint256 minPayout) external {
    require(balances[msg.sender][isYes] >= shares, "Insufficient");

    // 1. Calculate payout from dual curve
    uint256 grossPayout = calculatePayoutFromDualCurve(isYes, shares);

    // 2. Deduct trading fee
    uint256 fee = (grossPayout * tradingFeeBps) / 10000;
    uint256 netPayout = grossPayout - fee;
    require(netPayout >= minPayout, "Slippage");

    // 3. Update supplies (maintains price invariant)
    if (isYes) {
        yesSupply -= shares;
    } else {
        noSupply -= shares;
    }

    // 4. Update balances
    balances[msg.sender][isYes] -= shares;

    // 5. Distribute fees
    distributeTradingFees(fee);

    // 6. Send payout
    payable(msg.sender).transfer(netPayout);

    // 7. Emit events
    emit Trade(msg.sender, isYes, false, shares, getPrice(true), getPrice(false));
}
```

---

## 🔒 Security & Invariants

### Critical Invariants

```solidity
// 1. Price invariant
assert(getPrice(true) + getPrice(false) == PRECISION);

// 2. Supply consistency
assert(totalSupply == sum(all user balances));

// 3. Reserve backing
assert(address(this).balance >= calculateTotalPayout());

// 4. Bounded prices
assert(getPrice(true) >= 0 && getPrice(true) <= PRECISION);
assert(getPrice(false) >= 0 && getPrice(false) <= PRECISION);
```

### Protection Mechanisms

1. **Slippage Protection**: Min shares on buy, min payout on sell
2. **Price Impact Limits**: Max price change per trade
3. **Whale Protection**: Max bet percentage of pool
4. **Sandwich Attack Prevention**: Commit-reveal for large trades
5. **Flash Loan Protection**: No same-block buy/sell

---

## ❓ Final Clarifications Needed

### 1. Liquidity Parameter Strategy

**How sensitive should prices be to trades?**

- **Low b (50-100)**: High price sensitivity, good for small markets
- **Medium b (500-1000)**: Balanced sensitivity
- **High b (5000+)**: Low sensitivity, good for high-volume markets

**Should this be:**
- A) Fixed for all markets?
- B) Scale with bond size?
- C) Chosen by creator within bounds?

### 2. Initial Price Setting

**Should initial prices always be 50/50 or allow bias?**

- **Option A**: Always start at 0.5/0.5 (unbiased)
- **Option B**: Creator can set initial bias (e.g., 0.7/0.3)
- **Option C**: First trader sets the initial price

### 3. Virtual Liquidity

**Should we use virtual liquidity for cold start?**

```solidity
// Virtual liquidity prevents division by zero
// and provides initial price stability
uint256 constant VIRTUAL_LIQUIDITY = 100; // Virtual shares on each side
```

---

## 🚀 Implementation Priority

### Phase 1: Core Dual-Sided Curve (Week 1)
- [ ] DualBondingCurve math library
- [ ] Price/cost calculation functions
- [ ] Invariant maintenance
- [ ] Gas optimization

### Phase 2: Enhanced Proposals (Week 1-2)
- [ ] ProposalManagerV3 with bond scaling
- [ ] Fee calculation from bond size
- [ ] Creator share scaling
- [ ] Voting integration

### Phase 3: Market Implementation (Week 2)
- [ ] DualBondingCurveMarket contract
- [ ] Buy/sell with fee distribution
- [ ] Slippage protection
- [ ] Event emission

### Phase 4: Integration & Testing (Week 3)
- [ ] Factory integration
- [ ] Parameter storage setup
- [ ] Comprehensive testing
- [ ] Security audit prep

---

## 📈 Expected Outcomes

With dual-sided curves and bond scaling:

1. **Better Price Discovery**: Arbitrage-free, credible probabilities
2. **Creator Incentives**: Larger bonds = higher revenue potential
3. **Market Quality**: Higher bonds attract serious creators
4. **Platform Revenue**: Scales with market activity
5. **User Experience**: Clear fees, bounded losses

---

## 🎯 Summary of Refinements

### What's New in V3:

1. **Dual-Sided Bonding Curves** ✅
   - Arbitrage-free pricing
   - Price_YES + Price_NO = 1 always
   - Bounded losses for traders

2. **Linear Bond-to-Fee Scaling** ✅
   - Bond size determines trading fee %
   - Bond size determines creator share %
   - No separate "fee boost" needed

3. **Simplified Fee Structure** ✅
   - Proposal tax → Platform
   - Bond → Initial liquidity
   - Trading fees → Platform/Creator/Staking
   - No resolution fees

4. **Per-Trade Fee Collection** ✅
   - Immediate revenue
   - Clear for users
   - No resolution risk

5. **Fully Flexible Parameters** ✅
   - Everything adjustable by admin
   - Optimize based on real data
   - Future-proof design

---

*This is the final refined architecture. All components are designed for maximum flexibility and optimization potential.*