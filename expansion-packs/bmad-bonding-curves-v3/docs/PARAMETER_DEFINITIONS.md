# KEKTECH 3.0 - Complete Parameter Definitions

## Overview

All parameters stored in ParameterStorage contract and adjustable by admin for platform optimization.

---

## 📋 Proposal Parameters

```solidity
// === BOND PARAMETERS ===
bytes32 constant MIN_INITIAL_BOND = keccak256("MIN_INITIAL_BOND");
// Value: 10 * 10^18 (10 BASED)
// Range: 1-100 BASED
// Purpose: Minimum bond to prevent spam

bytes32 constant MAX_INITIAL_BOND = keccak256("MAX_INITIAL_BOND");
// Value: 1000 * 10^18 (1000 BASED)
// Range: 100-10000 BASED
// Purpose: Maximum bond to limit risk

bytes32 constant DEFAULT_INITIAL_BOND = keccak256("DEFAULT_INITIAL_BOND");
// Value: 100 * 10^18 (100 BASED)
// Range: 10-1000 BASED
// Purpose: Suggested bond amount in UI

// === PROPOSAL TAX ===
bytes32 constant PROPOSAL_TAX = keccak256("PROPOSAL_TAX");
// Value: 0.1 * 10^18 (0.1 BASED)
// Range: 0.01-1 BASED
// Purpose: Non-refundable platform fee per proposal

// === CREATOR BOOST ===
bytes32 constant MIN_CREATOR_BOOST = keccak256("MIN_CREATOR_BOOST");
// Value: 0
// Range: 0-10 BASED
// Purpose: Minimum boost amount

bytes32 constant MAX_CREATOR_BOOST = keccak256("MAX_CREATOR_BOOST");
// Value: 100 * 10^18 (100 BASED)
// Range: 10-1000 BASED
// Purpose: Maximum boost to prevent manipulation

bytes32 constant BOOST_TO_FEE_MULTIPLIER = keccak256("BOOST_TO_FEE_MULTIPLIER");
// Value: 10
// Range: 1-100
// Purpose: Conversion rate (10 BASED boost = 0.1% extra fee with multiplier 10)

// === VOTING PARAMETERS ===
bytes32 constant VOTING_PERIOD = keccak256("VOTING_PERIOD");
// Value: 259200 (3 days in seconds)
// Range: 86400-604800 (1-7 days)
// Purpose: Duration for community voting

bytes32 constant APPROVAL_THRESHOLD_BPS = keccak256("APPROVAL_THRESHOLD_BPS");
// Value: 5100 (51%)
// Range: 5000-7500 (50%-75%)
// Purpose: Minimum % of votes needed for approval

bytes32 constant MIN_VOTES_REQUIRED = keccak256("MIN_VOTES_REQUIRED");
// Value: 100
// Range: 10-10000
// Purpose: Minimum vote count to prevent manipulation
```

---

## 💰 Trading Parameters

```solidity
// === FEE PERCENTAGES ===
bytes32 constant MIN_TRADING_FEE_BPS = keccak256("MIN_TRADING_FEE_BPS");
// Value: 10 (0.1%)
// Range: 0-100
// Purpose: Minimum allowed trading fee

bytes32 constant MAX_TRADING_FEE_BPS = keccak256("MAX_TRADING_FEE_BPS");
// Value: 1000 (10%)
// Range: 100-2000
// Purpose: Maximum allowed trading fee

bytes32 constant DEFAULT_TRADING_FEE_BPS = keccak256("DEFAULT_TRADING_FEE_BPS");
// Value: 250 (2.5%)
// Range: 50-500
// Purpose: Default fee for new markets

// === BET LIMITS ===
bytes32 constant MIN_BET_AMOUNT = keccak256("MIN_BET_AMOUNT");
// Value: 0.01 * 10^18 (0.01 BASED)
// Range: 0.001-1 BASED
// Purpose: Minimum bet to prevent dust

bytes32 constant MAX_BET_PERCENTAGE_BPS = keccak256("MAX_BET_PERCENTAGE_BPS");
// Value: 2000 (20% of pool)
// Range: 500-5000 (5%-50%)
// Purpose: Prevent single trader domination

// === SLIPPAGE PROTECTION ===
bytes32 constant DEFAULT_SLIPPAGE_BPS = keccak256("DEFAULT_SLIPPAGE_BPS");
// Value: 100 (1%)
// Range: 10-500
// Purpose: Default slippage tolerance

bytes32 constant MAX_SLIPPAGE_BPS = keccak256("MAX_SLIPPAGE_BPS");
// Value: 500 (5%)
// Range: 100-1000
// Purpose: Maximum allowed slippage
```

---

## 📊 Fee Distribution Parameters

```solidity
// === PRIMARY DISTRIBUTION ===
bytes32 constant PLATFORM_FEE_SHARE_BPS = keccak256("PLATFORM_FEE_SHARE_BPS");
// Value: 4000 (40%)
// Range: 1000-6000
// Purpose: Platform/team revenue share

bytes32 constant CREATOR_FEE_SHARE_BPS = keccak256("CREATOR_FEE_SHARE_BPS");
// Value: 3000 (30%)
// Range: 1000-5000
// Purpose: Market creator base share

bytes32 constant STAKING_FEE_SHARE_BPS = keccak256("STAKING_FEE_SHARE_BPS");
// Value: 3000 (30%)
// Range: 1000-5000
// Purpose: Staking rewards share

// === SPECIAL FEES ===
bytes32 constant PORTRAIT_FEE = keccak256("PORTRAIT_FEE");
// Value: 1 * 10^18 (1 BASED)
// Range: 0.1-10 BASED
// Purpose: Custom market imagery fee

bytes32 constant MARKET_CREATION_FEE = keccak256("MARKET_CREATION_FEE");
// Value: 0.5 * 10^18 (0.5 BASED)
// Range: 0-5 BASED
// Purpose: Additional fee when launching market

bytes32 constant RESOLUTION_FEE_BPS = keccak256("RESOLUTION_FEE_BPS");
// Value: 10 (0.1% of pool)
// Range: 0-100
// Purpose: Resolver compensation

bytes32 constant CLAIM_FEE_BPS = keccak256("CLAIM_FEE_BPS");
// Value: 5 (0.05% of winnings)
// Range: 0-50
// Purpose: Fee for claiming winnings
```

---

## 📈 Bonding Curve Parameters

```solidity
// === CURVE SELECTION ===
bytes32 constant ACTIVE_CURVE_TYPE = keccak256("ACTIVE_CURVE_TYPE");
// Value: 0 (LINEAR), 1 (SIGMOID), 2 (QUADRATIC)
// Range: 0-2
// Purpose: Which curve formula to use globally

bytes32 constant ALLOW_CUSTOM_CURVES = keccak256("ALLOW_CUSTOM_CURVES");
// Value: 0 (false)
// Range: 0-1 (boolean)
// Purpose: Whether markets can use different curves

// === LINEAR CURVE: P = a*S + b ===
bytes32 constant LINEAR_CURVE_SLOPE = keccak256("LINEAR_CURVE_SLOPE");
// Value: 100
// Range: 1-10000
// Purpose: Rate of price increase (a parameter)

bytes32 constant LINEAR_CURVE_INTERCEPT = keccak256("LINEAR_CURVE_INTERCEPT");
// Value: 5000 (0.5 in basis points)
// Range: 0-10000
// Purpose: Starting price (b parameter)

// === SIGMOID CURVE: P = 1/(1+e^(-k*(S1-S2))) ===
bytes32 constant SIGMOID_CURVE_STEEPNESS = keccak256("SIGMOID_CURVE_STEEPNESS");
// Value: 5
// Range: 1-20
// Purpose: How sharp the S-curve is (k parameter)

bytes32 constant SIGMOID_CURVE_MIDPOINT = keccak256("SIGMOID_CURVE_MIDPOINT");
// Value: 0
// Range: -1000 to 1000
// Purpose: Supply difference at 50% price

// === QUADRATIC CURVE: P = a*S² + b*S + c ===
bytes32 constant QUADRATIC_CURVE_A = keccak256("QUADRATIC_CURVE_A");
// Value: 1
// Range: 1-100
// Purpose: Acceleration of price increase

bytes32 constant QUADRATIC_CURVE_B = keccak256("QUADRATIC_CURVE_B");
// Value: 100
// Range: 0-1000
// Purpose: Linear component

bytes32 constant QUADRATIC_CURVE_C = keccak256("QUADRATIC_CURVE_C");
// Value: 5000 (0.5 in basis points)
// Range: 0-10000
// Purpose: Base price
```

---

## ⚡ Market Operation Parameters

```solidity
// === TIMING ===
bytes32 constant MIN_MARKET_DURATION = keccak256("MIN_MARKET_DURATION");
// Value: 3600 (1 hour)
// Range: 1800-86400 (30 min - 1 day)
// Purpose: Minimum time before resolution

bytes32 constant MAX_MARKET_DURATION = keccak256("MAX_MARKET_DURATION");
// Value: 31536000 (365 days)
// Range: 2592000-63072000 (30 days - 2 years)
// Purpose: Maximum market duration

bytes32 constant DISPUTE_PERIOD = keccak256("DISPUTE_PERIOD");
// Value: 86400 (24 hours)
// Range: 3600-604800 (1 hour - 7 days)
// Purpose: Time to dispute resolution

bytes32 constant CLAIM_EXPIRY = keccak256("CLAIM_EXPIRY");
// Value: 7776000 (90 days)
// Range: 2592000-31536000 (30 days - 1 year)
// Purpose: Time limit to claim winnings

// === EMERGENCY ===
bytes32 constant EMERGENCY_PAUSE_ENABLED = keccak256("EMERGENCY_PAUSE_ENABLED");
// Value: 1 (true)
// Range: 0-1 (boolean)
// Purpose: Allow emergency pause

bytes32 constant MAX_GAS_PRICE = keccak256("MAX_GAS_PRICE");
// Value: 500 * 10^9 (500 gwei)
// Range: 50-1000 gwei
// Purpose: Maximum gas price for operations
```

---

## 🎮 Platform Control Parameters

```solidity
// === PLATFORM ADDRESSES ===
bytes32 constant PLATFORM_TREASURY = keccak256("PLATFORM_TREASURY");
// Value: 0x... (platform multisig)
// Purpose: Where platform fees go

bytes32 constant STAKING_REWARDS_POOL = keccak256("STAKING_REWARDS_POOL");
// Value: 0x... (staking contract)
// Purpose: Where staking rewards accumulate

bytes32 constant EMERGENCY_ADMIN = keccak256("EMERGENCY_ADMIN");
// Value: 0x... (emergency multisig)
// Purpose: Can pause in emergencies

// === FEATURE FLAGS ===
bytes32 constant BONDING_CURVES_ENABLED = keccak256("BONDING_CURVES_ENABLED");
// Value: 1 (true)
// Range: 0-1
// Purpose: Enable/disable bonding curve markets

bytes32 constant PORTRAIT_FEES_ENABLED = keccak256("PORTRAIT_FEES_ENABLED");
// Value: 1 (true)
// Range: 0-1
// Purpose: Enable custom imagery fees

bytes32 constant EARLY_RESOLUTION_ENABLED = keccak256("EARLY_RESOLUTION_ENABLED");
// Value: 0 (false)
// Range: 0-1
// Purpose: Allow resolution before deadline
```

---

## 📝 Parameter Update Process

### Setting Parameters

```solidity
// Admin function to update any parameter
function setParameter(bytes32 key, uint256 value) external onlyAdmin {
    // Validate within guardrails
    require(value >= guardrails[key].min, "Below minimum");
    require(value <= guardrails[key].max, "Above maximum");

    uint256 oldValue = parameters[key];
    parameters[key] = value;

    emit ParameterUpdated(key, oldValue, value, block.timestamp);
}
```

### Batch Updates

```solidity
// Update multiple parameters atomically
function batchSetParameters(
    bytes32[] calldata keys,
    uint256[] calldata values
) external onlyAdmin {
    require(keys.length == values.length, "Length mismatch");

    for (uint i = 0; i < keys.length; i++) {
        setParameter(keys[i], values[i]);
    }
}
```

---

## 🔒 Security Considerations

1. **Guardrails**: Each parameter has min/max bounds
2. **Time Delays**: Critical changes have timelock
3. **Multi-sig**: Admin functions require multi-sig
4. **Emergency Pause**: Can freeze parameters
5. **Audit Trail**: All changes logged on-chain

---

## 📊 Default Configuration Set

```javascript
// Initial deployment configuration
const DEFAULT_PARAMS = {
    // Proposals
    MIN_INITIAL_BOND: ethers.parseEther("10"),
    MAX_INITIAL_BOND: ethers.parseEther("1000"),
    PROPOSAL_TAX: ethers.parseEther("0.1"),

    // Trading
    DEFAULT_TRADING_FEE_BPS: 250,  // 2.5%
    MIN_BET_AMOUNT: ethers.parseEther("0.01"),

    // Distribution
    PLATFORM_FEE_SHARE_BPS: 4000,  // 40%
    CREATOR_FEE_SHARE_BPS: 3000,   // 30%
    STAKING_FEE_SHARE_BPS: 3000,   // 30%

    // Curve (Linear default)
    ACTIVE_CURVE_TYPE: 0,
    LINEAR_CURVE_SLOPE: 100,
    LINEAR_CURVE_INTERCEPT: 5000,
};
```

---

## 🚀 Future Parameters (V4)

Reserved keys for future upgrades:

- `ORACLE_TIMEOUT`: Max wait for oracle response
- `LIQUIDITY_MINING_RATE`: Rewards for liquidity
- `GOVERNANCE_TOKEN_WEIGHT`: Voting power multiplier
- `CROSS_CHAIN_FEE`: Fee for multi-chain markets
- `AI_RESOLUTION_ENABLED`: Allow AI-based resolution

---

*Last Updated: November 3, 2025*