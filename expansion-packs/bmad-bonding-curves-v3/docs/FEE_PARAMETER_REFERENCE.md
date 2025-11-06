# 📊 Fee Parameter Reference - Complete Specification

*Created: November 3, 2025*
*Status: Comprehensive parameter definitions for 0-100% flexibility*

## Overview

Complete reference for all adjustable parameters in the two-tier fee system. **ALL parameters adjustable 0-100%** via ParameterStorage for maximum optimization flexibility.

---

## 🎛️ Parameter Categories

```
Total Parameters: 20
├── Tier 1 (Bond Scaling): 4 parameters
├── Tier 2 (Voluntary Fees): 5 parameters
├── Distribution (3-Way Split): 6 parameters
├── Market Creation: 2 parameters
└── Trading Limits: 3 parameters
```

---

## 💰 Tier 1: Bond Scaling Parameters

### MIN_BOND
**Type**: `uint256` (wei)
**Range**: `0` to `1000000 ether`
**Default**: `10 ether` (10 BASED)
**Purpose**: Minimum bond required to create market
**Effect**: Determines floor for bond fee scaling

**Example**:
```solidity
MIN_BOND = 10 ether
// Market creator must bond at least 10 BASED
```

### MAX_BOND
**Type**: `uint256` (wei)
**Range**: `0` to `1000000 ether`
**Default**: `1000 ether` (1000 BASED)
**Purpose**: Maximum bond that affects fee scaling
**Effect**: Determines ceiling for bond fee scaling
**Note**: Creators can bond more, but fees cap at MAX_BOND

**Example**:
```solidity
MAX_BOND = 1000 ether
// Bonding 2000 BASED gives same fee as 1000 BASED
```

### MIN_BOND_FEE_BPS
**Type**: `uint256` (basis points)
**Range**: `0` (0%) to `10000` (100%)
**Default**: `50` (0.5%)
**Purpose**: Trading fee for minimum bond amount
**Effect**: Floor for Tier 1 trading fees

**Example**:
```solidity
MIN_BOND_FEE_BPS = 50  // 0.5%
// Market with MIN_BOND gets 0.5% trading fee
```

### MAX_BOND_FEE_BPS
**Type**: `uint256` (basis points)
**Range**: `0` (0%) to `10000` (100%)
**Default**: `200` (2%)
**Purpose**: Trading fee for maximum bond amount
**Effect**: Ceiling for Tier 1 trading fees

**Example**:
```solidity
MAX_BOND_FEE_BPS = 200  // 2%
// Market with MAX_BOND gets 2% trading fee (before voluntary bonus)
```

**Formula**:
```solidity
bondFee = MIN_BOND_FEE_BPS +
          (bondAmount - MIN_BOND) *
          (MAX_BOND_FEE_BPS - MIN_BOND_FEE_BPS) /
          (MAX_BOND - MIN_BOND)
```

---

## 🎁 Tier 2: Voluntary Fee Parameters

### MIN_VOLUNTARY_FEE
**Type**: `uint256` (wei)
**Range**: `0` to `1000000 ether`
**Default**: `0 ether`
**Purpose**: Minimum optional fee to unlock bonuses
**Effect**: `0` = feature optional, `>0` = minimum required to get any bonus

**Example**:
```solidity
MIN_VOLUNTARY_FEE = 0
// Creators can skip voluntary fee entirely (gets 0% bonus)
```

### MAX_VOLUNTARY_FEE
**Type**: `uint256` (wei)
**Range**: `0` to `1000000 ether`
**Default**: `1000 ether` (1000 BASED)
**Purpose**: Maximum voluntary fee that affects bonus scaling
**Effect**: Caps the bonus calculation (can pay more but bonus maxes out)

**Example**:
```solidity
MAX_VOLUNTARY_FEE = 1000 ether
// Paying 2000 BASED gives same bonus as 1000 BASED
```

### MIN_VOLUNTARY_BONUS_BPS
**Type**: `uint256` (basis points)
**Range**: `0` (0%) to `10000` (100%)
**Default**: `0` (0%)
**Purpose**: Bonus fee for minimum voluntary amount
**Effect**: Usually 0 (no bonus at minimum)

**Example**:
```solidity
MIN_VOLUNTARY_BONUS_BPS = 0
// MIN_VOLUNTARY_FEE gives 0% additional trading fee
```

### MAX_VOLUNTARY_BONUS_BPS
**Type**: `uint256` (basis points)
**Range**: `0` (0%) to `10000` (100%)
**Default**: `800` (8%)
**Purpose**: Maximum bonus fee from voluntary fee
**Effect**: Ceiling for Tier 2 bonus

**Example**:
```solidity
MAX_VOLUNTARY_BONUS_BPS = 800  // 8%
// MAX_VOLUNTARY_FEE gives +8% trading fee bonus
// Combined with MAX_BOND_FEE (2%) = 10% total
```

### VOLUNTARY_FEE_TAX_BPS
**Type**: `uint256` (basis points)
**Range**: `0` (0%) to `10000` (100%)
**Default**: `1000` (10%)
**Purpose**: Tax on voluntary fee before staking pool
**Effect**: Platform revenue from voluntary fees

**Example**:
```solidity
VOLUNTARY_FEE_TAX_BPS = 1000  // 10%
// Creator pays 500 BASED voluntary
// → 50 BASED to platform (tax)
// → 450 BASED to staking pool
```

**Formula**:
```solidity
voluntaryBonus = MIN_VOLUNTARY_BONUS_BPS +
                 (voluntaryAmount - MIN_VOLUNTARY_FEE) *
                 (MAX_VOLUNTARY_BONUS_BPS - MIN_VOLUNTARY_BONUS_BPS) /
                 (MAX_VOLUNTARY_FEE - MIN_VOLUNTARY_FEE)

totalTradingFee = bondFee + voluntaryBonus
```

---

## 🎯 3-Way Distribution Parameters

**Core Rule**: `platformShare + creatorShare + stakingShare = 10000` (100%)

### MIN_PLATFORM_SHARE_BPS
**Type**: `uint256` (basis points)
**Range**: `0` (0%) to `10000` (100%)
**Default**: `0` (0%)
**Purpose**: Minimum platform share allowed
**Effect**: Floor for platform's cut

**Example**:
```solidity
MIN_PLATFORM_SHARE_BPS = 2000  // 20%
// Platform must get at least 20% of trading fees
```

### MAX_PLATFORM_SHARE_BPS
**Type**: `uint256` (basis points)
**Range**: `0` (0%) to `10000` (100%)
**Default**: `10000` (100%)
**Purpose**: Maximum platform share allowed
**Effect**: Ceiling for platform's cut

**Example**:
```solidity
MAX_PLATFORM_SHARE_BPS = 5000  // 50%
// Platform can get at most 50% of trading fees
```

### MIN_CREATOR_SHARE_BPS
**Type**: `uint256` (basis points)
**Range**: `0` (0%) to `10000` (100%)
**Default**: `0` (0%)
**Purpose**: Minimum creator share allowed
**Effect**: Floor for creator's cut

**Example**:
```solidity
MIN_CREATOR_SHARE_BPS = 1000  // 10%
// Creator must get at least 10% of trading fees
```

### MAX_CREATOR_SHARE_BPS
**Type**: `uint256` (basis points)
**Range**: `0` (0%) to `10000` (100%)
**Default**: `10000` (100%)
**Purpose**: Maximum creator share allowed
**Effect**: Ceiling for creator's cut

**Example**:
```solidity
MAX_CREATOR_SHARE_BPS = 6000  // 60%
// Creator can get at most 60% of trading fees
```

### MIN_STAKING_SHARE_BPS
**Type**: `uint256` (basis points)
**Range**: `0` (0%) to `10000` (100%)
**Default**: `0` (0%)
**Purpose**: Minimum staking pool share allowed
**Effect**: Floor for staking pool's cut

**Example**:
```solidity
MIN_STAKING_SHARE_BPS = 2000  // 20%
// Staking pool must get at least 20% of trading fees
```

### MAX_STAKING_SHARE_BPS
**Type**: `uint256` (basis points)
**Range**: `0` (0%) to `10000` (100%)
**Default**: `10000` (100%)
**Purpose**: Maximum staking pool share allowed
**Effect**: Ceiling for staking pool's cut

**Example**:
```solidity
MAX_STAKING_SHARE_BPS = 5000  // 50%
// Staking pool can get at most 50% of trading fees
```

**Validation**:
```solidity
require(platformShare >= MIN_PLATFORM_SHARE_BPS && platformShare <= MAX_PLATFORM_SHARE_BPS);
require(creatorShare >= MIN_CREATOR_SHARE_BPS && creatorShare <= MAX_CREATOR_SHARE_BPS);
require(stakingShare >= MIN_STAKING_SHARE_BPS && stakingShare <= MAX_STAKING_SHARE_BPS);
require(platformShare + creatorShare + stakingShare == 10000, "Must sum to 100%");
```

---

## 🏗️ Market Creation Parameters

### PROPOSAL_TAX_MIN
**Type**: `uint256` (wei)
**Range**: `0` to `1000 ether`
**Default**: `0.1 ether` (0.1 BASED)
**Purpose**: Minimum proposal tax to create market
**Effect**: Anti-spam + platform revenue

**Example**:
```solidity
PROPOSAL_TAX_MIN = 0.1 ether
// Must pay at least 0.1 BASED to propose market
```

### PROPOSAL_TAX_MAX
**Type**: `uint256` (wei)
**Range**: `0` to `1000 ether`
**Default**: `1 ether` (1 BASED)
**Purpose**: Maximum proposal tax
**Effect**: Caps spam protection cost

**Example**:
```solidity
PROPOSAL_TAX_MAX = 1 ether
// Proposal tax cannot exceed 1 BASED
```

**Note**: Proposal tax is NON-REFUNDABLE and goes directly to platform.

---

## 📈 Trading Limit Parameters

### MIN_TRADING_FEE_BPS
**Type**: `uint256` (basis points)
**Range**: `0` (0%) to `10000` (100%)
**Default**: `0` (0%)
**Purpose**: Absolute minimum trading fee across all markets
**Effect**: Global floor (usually 0 to allow full flexibility)

**Example**:
```solidity
MIN_TRADING_FEE_BPS = 0
// Markets can theoretically have 0% trading fee
// (though Tier 1 MIN_BOND_FEE_BPS provides practical floor)
```

### MAX_TRADING_FEE_BPS
**Type**: `uint256` (basis points)
**Range**: `0` (0%) to `10000` (100%)
**Default**: `1000` (10%)
**Purpose**: Absolute maximum trading fee across all markets
**Effect**: Global ceiling to prevent abuse

**Example**:
```solidity
MAX_TRADING_FEE_BPS = 1000  // 10%
// No market can charge more than 10% trading fee
// Even with MAX_BOND + MAX_VOLUNTARY
```

### MAX_PRICE_IMPACT_BPS
**Type**: `uint256` (basis points)
**Range**: `0` (0%) to `10000` (100%)
**Default**: `500` (5%)
**Purpose**: Maximum price impact per trade (from DualCurveMath)
**Effect**: Protects against single-trade market manipulation

**Example**:
```solidity
MAX_PRICE_IMPACT_BPS = 500  // 5%
// Large trades get capped at 5% price slippage
```

---

## 🎨 Example Parameter Configurations

### Configuration A: Conservative (Balanced)
```solidity
// Tier 1: Bond Scaling
MIN_BOND = 10 ether
MAX_BOND = 1000 ether
MIN_BOND_FEE_BPS = 50    // 0.5%
MAX_BOND_FEE_BPS = 200   // 2%

// Tier 2: Voluntary (Optional)
MIN_VOLUNTARY_FEE = 0 ether
MAX_VOLUNTARY_FEE = 1000 ether
MAX_VOLUNTARY_BONUS_BPS = 800  // 8%
VOLUNTARY_FEE_TAX_BPS = 1000   // 10%

// Distribution Ranges
Platform: 20-50%
Creator:  10-60%
Staking:  20-50%

// Result: 0.5-10% total trading fees
```

### Configuration B: High-Fee (Revenue Focus)
```solidity
// Tier 1: Higher base fees
MIN_BOND_FEE_BPS = 200   // 2%
MAX_BOND_FEE_BPS = 500   // 5%

// Tier 2: Higher bonuses
MAX_VOLUNTARY_BONUS_BPS = 1500  // 15%

// Distribution: Platform-heavy
Platform: 40-60%
Creator:  10-40%
Staking:  10-40%

// Result: 2-20% total trading fees
```

### Configuration C: Creator-Friendly (Low Fees)
```solidity
// Tier 1: Lower base fees
MIN_BOND_FEE_BPS = 25    // 0.25%
MAX_BOND_FEE_BPS = 100   // 1%

// Tier 2: Moderate bonuses
MAX_VOLUNTARY_BONUS_BPS = 400  // 4%

// Distribution: Creator-heavy
Platform: 10-30%
Creator:  40-70%
Staking:  10-30%

// Result: 0.25-5% total trading fees
```

---

## 🔄 Parameter Update Process

### Governance Flow

```solidity
// Step 1: Propose parameter change
governance.proposeUpdate(
    "MAX_BOND_FEE_BPS",
    300  // Increase from 200 to 300 (2% → 3%)
);

// Step 2: Voting period (e.g., 7 days)

// Step 3: If passed, execute after timelock
parameterStorage.set("MAX_BOND_FEE_BPS", 300);

// Step 4: New markets use new value
// Existing markets unchanged (immutable at creation)
```

### Emergency Updates

```solidity
// Only for critical issues (e.g., exploit discovered)
// Requires multi-sig or emergency council

emergencyUpdate.executeImmediately(
    "MAX_TRADING_FEE_BPS",
    500  // Cap at 5% immediately
);
```

---

## 📊 Parameter Impact Analysis

### Trading Fee Examples

| Bond | Voluntary | Platform | Creator | Staking | Total Fee | Platform $ | Creator $ | Staking $ |
|------|-----------|----------|---------|---------|-----------|------------|-----------|-----------|
| 10   | 0         | 40%      | 30%     | 30%     | 0.5%      | 0.20%      | 0.15%     | 0.15%     |
| 500  | 500       | 35%      | 40%     | 25%     | 5.25%     | 1.84%      | 2.10%     | 1.31%     |
| 1000 | 1000      | 30%      | 50%     | 20%     | 10%       | 3.00%      | 5.00%     | 2.00%     |

### Revenue Projections

```
Assumptions:
- 1000 markets created/month
- Average 100 ETH volume per market
- Average 5% trading fee

Monthly Trading Volume: 100,000 ETH
Monthly Trading Fees: 5,000 ETH

Distribution (40/35/25):
├── Platform: 2,000 ETH/month
├── Creators: 1,750 ETH/month
└── Staking:  1,250 ETH/month

Plus Voluntary Fees:
- 500 markets use voluntary (50%)
- Average 500 BASED per market
- 250,000 BASED/month
- Tax (10%): 25,000 BASED → Platform
- Net: 225,000 BASED → Staking Pool
```

---

## 🛡️ Safety Constraints

### Validation Rules

```solidity
// 1. Bond bounds must make sense
require(MIN_BOND < MAX_BOND, "Invalid bond range");

// 2. Fee progression must make sense
require(MIN_BOND_FEE_BPS <= MAX_BOND_FEE_BPS, "Invalid fee range");
require(MIN_VOLUNTARY_BONUS_BPS <= MAX_VOLUNTARY_BONUS_BPS, "Invalid bonus range");

// 3. Total fee must not exceed global max
require(MAX_BOND_FEE_BPS + MAX_VOLUNTARY_BONUS_BPS <= MAX_TRADING_FEE_BPS, "Fee exceeds max");

// 4. Distribution ranges must allow valid combinations
// Example: If MIN_PLATFORM=40%, MAX_CREATOR=40%, MIN_STAKING=40%
// Then impossible to satisfy (40+40+40 > 100%)
// Must ensure: MIN_PLATFORM + MIN_CREATOR + MIN_STAKING <= 10000
require(
    MIN_PLATFORM_SHARE_BPS + MIN_CREATOR_SHARE_BPS + MIN_STAKING_SHARE_BPS <= 10000,
    "Minimums too high"
);

// 5. Ranges must overlap to allow 100% split
// Must ensure at least one valid combination exists
```

---

## 📝 Implementation Checklist

- [ ] All 20 parameters in ParameterStorage
- [ ] Getter functions for each parameter
- [ ] Setter functions with access control
- [ ] Validation logic for parameter updates
- [ ] Events for parameter changes
- [ ] Unit tests for each parameter
- [ ] Integration tests for parameter combinations
- [ ] Documentation for governance
- [ ] UI/UX for parameter display
- [ ] Monitoring for parameter changes

---

*Last Updated: November 3, 2025 - 21:45 UTC*
*Status: Complete specification, ready for implementation*
