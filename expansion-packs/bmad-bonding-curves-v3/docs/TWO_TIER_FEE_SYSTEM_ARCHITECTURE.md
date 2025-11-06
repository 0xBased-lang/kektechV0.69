# 🎯 Two-Tier Fee System Architecture

*Created: November 3, 2025*
*Status: Architectural Design - Ready for Implementation*

## Executive Summary

Complete fee system architecture with **two-tier trading fee scaling** (bond + voluntary), **per-market fee flexibility**, and **3-way distribution validation** (Platform/Creator/Staking). All parameters 0-100% adjustable.

---

## 🏗️ System Architecture

### Three-Layer Design

```
┌─────────────────────────────────────────────────────────┐
│ Layer 1: DualCurveMath.sol ✅ COMPLETE                  │
│ - Pure bonding curve mathematics                        │
│ - Price calculations, buy/sell logic                    │
│ - NO fee logic (stays pristine)                         │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 2: FeeCalculator.sol 🔨 NEW (Day 2)              │
│ - Tier 1: Bond-to-fee scaling (0.5-2%+)                │
│ - Tier 2: Voluntary fee-to-fee scaling (0-X%)          │
│ - Additive: total = bondFee + voluntaryFee             │
│ - 3-way distribution validation (must sum to 100%)     │
│ - Per-market fee range enforcement                      │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 3: BondingCurveMarket.sol (Week 2)               │
│ - Orchestrates both libraries                           │
│ - Collects voluntary fee → tax → staking pool          │
│ - Applies trading fees with 3-way distribution         │
│ - Enforces per-market fee ranges                        │
└─────────────────────────────────────────────────────────┘
```

---

## 💰 Two-Tier Fee Scaling System

### Tier 1: Bond-Based Scaling (Small Spectrum)

**Purpose**: Base trading fee determined by required bond amount

**Formula**:
```solidity
bondFee = minBondFee + (bondAmount - minBond) * (maxBondFee - minBondFee) / (maxBond - minBond)

Example with default params:
- minBond = 10 BASED → minBondFee = 0.5%
- maxBond = 1000 BASED → maxBondFee = 2%
- Bond 500 BASED → ~1.25% trading fee
```

**Characteristics**:
- ✅ Required for all markets
- ✅ Small range (e.g., 0.5-2%)
- ✅ Bond returned after resolution
- ✅ Becomes initial liquidity

### Tier 2: Voluntary Fee-Based Scaling (Large Spectrum)

**Purpose**: Optional additional fee for higher trading fees → staking pool

**Formula**:
```solidity
voluntaryFee = (voluntaryAmount - minVoluntary) * (maxVoluntaryBonus) / (maxVoluntary - minVoluntary)

Example with default params:
- minVoluntary = 0 BASED → 0% bonus
- maxVoluntary = 1000 BASED → 8% bonus
- Voluntary 500 BASED → ~4% bonus
```

**Flow**:
```
Creator pays voluntary fee (e.g., 500 BASED)
├── Apply proposal tax (e.g., 10%) → 50 BASED to Platform
└── Net 450 BASED → Staking Pool (NOT RETURNED)
    └── Unlocks higher trading fees for this market
```

**Characteristics**:
- ✅ Optional (can be 0)
- ✅ Large range (0-8%+)
- ✅ NOT returned (goes to staking pool after tax)
- ✅ Proportional slider in UI

### Combined Trading Fee Calculation

**Additive Model** (User's Choice):
```solidity
totalTradingFee = bondFee + voluntaryFee

Examples:
├── Min (10 BASED bond, 0 voluntary) → 0.5% trading fee
├── Mid (500 BASED bond, 500 voluntary) → 1.25% + 4% = 5.25%
└── Max (1000 bond, 1000 voluntary) → 2% + 8% = 10%
```

---

## 📊 3-Way Fee Distribution System

### Per-Market Flexibility with Validation

**Core Requirement**: Platform + Creator + Staking = 100% (ALWAYS)

**Market-Specific Ranges**:
```solidity
Market A (Conservative):
├── Trading Fee: 3%
└── Distribution:
    ├── Platform: 40%
    ├── Creator: 30%
    └── Staking: 30%
    Total: 100% ✅

Market B (Creator-Focused):
├── Trading Fee: 8%
└── Distribution:
    ├── Platform: 25%
    ├── Creator: 50%
    └── Staking: 25%
    Total: 100% ✅

Market C (Staking-Heavy):
├── Trading Fee: 5%
└── Distribution:
    ├── Platform: 30%
    ├── Creator: 20%
    └── Staking: 50%
    Total: 100% ✅
```

**Range Enforcement**:
```solidity
// Global limits set in ParameterStorage (adjustable by governance)
MIN_PLATFORM_SHARE: 0 (0%)     → MAX_PLATFORM_SHARE: 10000 (100%)
MIN_CREATOR_SHARE: 0 (0%)      → MAX_CREATOR_SHARE: 10000 (100%)
MIN_STAKING_SHARE: 0 (0%)      → MAX_STAKING_SHARE: 10000 (100%)

// Per-market validation
function validateDistribution(uint256 platform, uint256 creator, uint256 staking) {
    require(platform >= MIN_PLATFORM_SHARE && platform <= MAX_PLATFORM_SHARE);
    require(creator >= MIN_CREATOR_SHARE && creator <= MAX_CREATOR_SHARE);
    require(staking >= MIN_STAKING_SHARE && staking <= MAX_STAKING_SHARE);
    require(platform + creator + staking == PRECISION, "Must sum to 100%");
}
```

---

## 🎛️ Complete Parameter System (0-100% Flexibility)

### Tier 1: Bond Scaling Parameters

```solidity
// Bond amount limits
MIN_BOND: 0-1000000 ether          // e.g., 10 BASED
MAX_BOND: 0-1000000 ether          // e.g., 1000 BASED

// Bond-to-fee scaling
MIN_BOND_FEE_BPS: 0-10000          // e.g., 50 (0.5%)
MAX_BOND_FEE_BPS: 0-10000          // e.g., 200 (2%)
```

### Tier 2: Voluntary Fee Parameters

```solidity
// Voluntary fee limits
MIN_VOLUNTARY_FEE: 0 ether         // Optional: 0 = disabled
MAX_VOLUNTARY_FEE: 0-1000000 ether // e.g., 1000 BASED

// Voluntary-to-fee scaling
MIN_VOLUNTARY_BONUS_BPS: 0         // No bonus at minimum
MAX_VOLUNTARY_BONUS_BPS: 0-10000   // e.g., 800 (8% max bonus)

// Voluntary fee taxation
VOLUNTARY_FEE_TAX_BPS: 0-10000     // e.g., 1000 (10% tax)
```

### 3-Way Distribution Parameters

```solidity
// Platform share limits
MIN_PLATFORM_SHARE_BPS: 0-10000    // e.g., 0 (0%)
MAX_PLATFORM_SHARE_BPS: 0-10000    // e.g., 10000 (100%)

// Creator share limits
MIN_CREATOR_SHARE_BPS: 0-10000     // e.g., 0 (0%)
MAX_CREATOR_SHARE_BPS: 0-10000     // e.g., 10000 (100%)

// Staking share limits
MIN_STAKING_SHARE_BPS: 0-10000     // e.g., 0 (0%)
MAX_STAKING_SHARE_BPS: 0-10000     // e.g., 10000 (100%)

// Validation: platform + creator + staking = 10000 (100%)
```

### Other Market Parameters

```solidity
// Proposal tax (existing)
PROPOSAL_TAX_MIN: 0-1000 ether     // e.g., 0.1 BASED
PROPOSAL_TAX_MAX: 0-1000 ether     // e.g., 1 BASED

// Trading fee caps per market
MIN_TRADING_FEE_BPS: 0-10000       // e.g., 0 (0%)
MAX_TRADING_FEE_BPS: 0-10000       // e.g., 1000 (10%)
```

**Total Parameters**: ~20 fully adjustable values in ParameterStorage

---

## 🔄 Market Creation Flow

### Step-by-Step Process

```solidity
function createMarket(
    string memory question,
    uint256 bondAmount,          // Required: 10-1000 BASED
    uint256 voluntaryFee,        // Optional: 0-1000 BASED
    uint256 platformShare,       // Must sum to 100%
    uint256 creatorShare,
    uint256 stakingShare
) external payable {
    // Step 1: Validate bond amount
    require(bondAmount >= MIN_BOND && bondAmount <= MAX_BOND);

    // Step 2: Collect proposal tax
    uint256 proposalTax = calculateProposalTax();
    require(msg.value >= bondAmount + voluntaryFee + proposalTax);
    platform.transfer(proposalTax);

    // Step 3: Handle voluntary fee (if any)
    uint256 netVoluntary = 0;
    if (voluntaryFee > 0) {
        // Tax the voluntary fee
        uint256 voluntaryTax = (voluntaryFee * VOLUNTARY_FEE_TAX_BPS) / PRECISION;
        platform.transfer(voluntaryTax);

        // Send net to staking pool (NOT RETURNED)
        netVoluntary = voluntaryFee - voluntaryTax;
        stakingPool.deposit(netVoluntary);
    }

    // Step 4: Calculate trading fee for this market
    uint256 tradingFeeBps = FeeCalculator.calculateTradingFee(
        bondAmount,
        voluntaryFee
    );

    // Step 5: Validate 3-way distribution
    FeeCalculator.validateDistribution(
        platformShare,
        creatorShare,
        stakingShare
    );

    // Step 6: Store bond as initial liquidity
    uint256 yesLiquidity = bondAmount / 2;
    uint256 noLiquidity = bondAmount / 2;

    // Step 7: Create market
    market = new BondingCurveMarket({
        bondAmount: bondAmount,
        yesLiquidity: yesLiquidity,
        noLiquidity: noLiquidity,
        tradingFeeBps: tradingFeeBps,
        platformShare: platformShare,
        creatorShare: creatorShare,
        stakingShare: stakingShare
    });
}
```

---

## 💡 FeeCalculator.sol API Design

### Core Functions

```solidity
library FeeCalculator {
    // === TIER 1: BOND SCALING ===

    /**
     * @notice Calculate trading fee from bond amount
     * @param bondAmount Creator's bond in wei
     * @return feeBps Trading fee in basis points
     */
    function calculateBondFee(uint256 bondAmount)
        internal pure returns (uint256 feeBps);

    // === TIER 2: VOLUNTARY SCALING ===

    /**
     * @notice Calculate bonus fee from voluntary amount
     * @param voluntaryAmount Optional fee paid to staking pool
     * @return bonusBps Additional fee bonus in basis points
     */
    function calculateVoluntaryBonus(uint256 voluntaryAmount)
        internal pure returns (uint256 bonusBps);

    // === COMBINED CALCULATION ===

    /**
     * @notice Calculate total trading fee (additive model)
     * @param bondAmount Required bond
     * @param voluntaryAmount Optional voluntary fee
     * @return totalFeeBps Total trading fee in basis points
     */
    function calculateTradingFee(
        uint256 bondAmount,
        uint256 voluntaryAmount
    ) internal pure returns (uint256 totalFeeBps);

    // === 3-WAY DISTRIBUTION ===

    /**
     * @notice Validate fee distribution sums to 100%
     * @param platformShare Platform's share in bps
     * @param creatorShare Creator's share in bps
     * @param stakingShare Staking pool's share in bps
     */
    function validateDistribution(
        uint256 platformShare,
        uint256 creatorShare,
        uint256 stakingShare
    ) internal pure;

    /**
     * @notice Split fee amount into 3 recipients
     * @param totalFee Total fee collected in wei
     * @param platformShare Platform's share in bps
     * @param creatorShare Creator's share in bps
     * @param stakingShare Staking pool's share in bps
     * @return platformAmount Amount for platform
     * @return creatorAmount Amount for creator
     * @return stakingAmount Amount for staking pool
     */
    function splitFee(
        uint256 totalFee,
        uint256 platformShare,
        uint256 creatorShare,
        uint256 stakingShare
    ) internal pure returns (
        uint256 platformAmount,
        uint256 creatorAmount,
        uint256 stakingAmount
    );

    // === HELPER FUNCTIONS ===

    /**
     * @notice Calculate all fees in one call (convenience)
     * @return bondFee Fee from bond scaling
     * @return voluntaryBonus Bonus from voluntary fee
     * @return totalFee Combined trading fee
     */
    function calculateAllFees(
        uint256 bondAmount,
        uint256 voluntaryAmount
    ) internal pure returns (
        uint256 bondFee,
        uint256 voluntaryBonus,
        uint256 totalFee
    );
}
```

### Custom Errors

```solidity
error InvalidBondAmount(uint256 provided, uint256 min, uint256 max);
error InvalidVoluntaryAmount(uint256 provided, uint256 max);
error InvalidFeeDistribution(uint256 sum, uint256 expected);
error ShareOutOfRange(string shareType, uint256 value, uint256 min, uint256 max);
error InvalidFeeAmount(uint256 amount);
```

---

## 🧪 Testing Strategy

### Unit Tests for FeeCalculator

```javascript
describe("FeeCalculator Library", () => {
    // Tier 1: Bond Scaling (8 tests)
    describe("Bond Fee Calculation", () => {
        it("Returns min fee for min bond");
        it("Returns max fee for max bond");
        it("Linear scaling between min and max");
        it("Handles bond below minimum");
        it("Handles bond above maximum");
        it("Handles zero bond");
        it("Handles very large bonds");
        it("Reverts with invalid parameters");
    });

    // Tier 2: Voluntary Scaling (8 tests)
    describe("Voluntary Bonus Calculation", () => {
        it("Returns 0% bonus for 0 voluntary fee");
        it("Returns max bonus for max voluntary fee");
        it("Linear scaling for voluntary amounts");
        it("Handles voluntary below minimum");
        it("Handles voluntary above maximum");
        it("Handles very large voluntary amounts");
        it("Works when voluntary disabled (max=0)");
        it("Reverts with invalid parameters");
    });

    // Combined Calculation (5 tests)
    describe("Total Trading Fee", () => {
        it("Additive: bond + voluntary");
        it("Bond only (voluntary = 0)");
        it("Voluntary only (min bond)");
        it("Maximum fees (max bond + max voluntary)");
        it("Minimum fees (min bond + 0 voluntary)");
    });

    // 3-Way Distribution (10 tests)
    describe("Fee Distribution Validation", () => {
        it("Accepts valid 33/33/34 split");
        it("Accepts valid 40/30/30 split");
        it("Accepts valid 25/50/25 split");
        it("Rejects sum < 100%");
        it("Rejects sum > 100%");
        it("Rejects platform share out of range");
        it("Rejects creator share out of range");
        it("Rejects staking share out of range");
        it("Handles edge case 100/0/0");
        it("Handles edge case 0/0/100");
    });

    // Fee Splitting (6 tests)
    describe("Fee Amount Splitting", () => {
        it("Splits 1 ETH correctly into 3 parts");
        it("Handles rounding properly");
        it("Splits very small amounts");
        it("Splits very large amounts");
        it("Sum of splits equals input (no dust)");
        it("Reverts with invalid total amount");
    });

    // Integration (5 tests)
    describe("Complete Fee Calculation Flow", () => {
        it("Calculates all fees for typical market");
        it("Calculates all fees for max-fee market");
        it("Calculates all fees for min-fee market");
        it("Validates distribution in same call");
        it("Splits fees correctly end-to-end");
    });
});

// Target: 42 comprehensive tests
// Coverage: 100% statements, functions
// Gas: <50k per function
```

---

## 📈 Gas Optimization Targets

```
Function                    Target Gas    Rationale
─────────────────────────────────────────────────────
calculateBondFee            <10k          Simple linear interpolation
calculateVoluntaryBonus     <10k          Simple linear interpolation
calculateTradingFee         <15k          Two calculations + add
validateDistribution        <5k           Three comparisons + one add
splitFee                    <20k          Three multiplications + divisions
calculateAllFees            <25k          Combined calculations
─────────────────────────────────────────────────────
TOTAL per market creation   <50k          All fee calculations
```

---

## 🔐 Security Considerations

### Input Validation
- ✅ Validate bond amount within min/max bounds
- ✅ Validate voluntary amount within max bound
- ✅ Validate all shares within allowed ranges
- ✅ Validate distribution sums to exactly 100%

### Arithmetic Safety
- ✅ Use Solidity 0.8.20+ (built-in overflow protection)
- ✅ Check for division by zero in linear interpolation
- ✅ Handle rounding in fee splitting (no dust loss)

### Access Control
- ✅ Library functions are `internal pure` (no state)
- ✅ Parameter updates controlled by governance
- ✅ Per-market ranges enforced at creation time

---

## 🚀 Implementation Timeline

### Day 2 (Current): FeeCalculator Library
- ✅ Design complete (this document)
- 🔨 Implement FeeCalculator.sol
- 🔨 Write 42 comprehensive tests
- 🔨 Achieve 100% coverage
- 🔨 Gas benchmark (<50k target)

### Week 2: Market Integration
- Implement BondingCurveMarket.sol
- Integrate DualCurveMath + FeeCalculator
- Handle voluntary fee collection & taxation
- Apply 3-way fee distribution on trades
- Full integration testing

### Week 3: Testing & Optimization
- Security audit
- Gas optimization
- Edge case testing
- Testnet deployment

### Week 4: Production Deployment
- Mainnet deployment
- Parameter initialization
- Monitoring setup

---

## 📝 Documentation Updates Required

1. ✅ **TWO_TIER_FEE_SYSTEM_ARCHITECTURE.md** (this file)
2. 🔨 Update BONDING_CURVE_REFINED_ARCHITECTURE_V3.md
3. 🔨 Update BONDING_CURVE_COMPLETE_INTEGRATION_PLAN.md
4. 🔨 Update IMPLEMENTATION_PROGRESS.md with Day 2 plan
5. 🔨 Create FEE_PARAMETER_REFERENCE.md

---

*Last Updated: November 3, 2025 - 21:30 UTC*
*Status: Architecture finalized, ready for implementation*
