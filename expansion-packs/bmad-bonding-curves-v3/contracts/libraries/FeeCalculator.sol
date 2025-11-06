// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title FeeCalculator
 * @author KEKTECH Team
 * @notice Two-tier fee calculation library for bonding curve prediction markets
 * @dev Implements:
 *      - Tier 1: Bond-based fee scaling (0.5-2% range)
 *      - Tier 2: Voluntary fee-based bonus scaling (0-8% range)
 *      - Additive model: totalFee = bondFee + voluntaryBonus
 *      - 3-way fee distribution: Platform + Creator + Staking = 100%
 *
 * Gas Targets:
 *      - calculateBondFee: <10k gas
 *      - calculateVoluntaryBonus: <10k gas
 *      - calculateTradingFee: <15k gas
 *      - validateDistribution: <5k gas
 *      - splitFee: <8k gas
 *      - Total per market creation: <50k gas
 *
 * Architecture:
 *      Layer 1: DualCurveMath (bonding curve math)
 *      Layer 2: FeeCalculator (economic parameters) ← THIS FILE
 *      Layer 3: BondingCurveMarket (orchestration)
 *
 * @custom:security-contact security@kektech.com
 */
library FeeCalculator {
    // =============================================================================
    // CONSTANTS
    // =============================================================================

    /// @notice Basis points precision (10000 = 100%)
    uint256 public constant PRECISION = 10000;

    /// @notice Minimum bond amount (10 BASED)
    uint256 public constant MIN_BOND = 10 ether;

    /// @notice Maximum bond amount (1000 BASED)
    uint256 public constant MAX_BOND = 1000 ether;

    /// @notice Minimum bond-based fee (50 bps = 0.5%)
    uint256 public constant MIN_BOND_FEE_BPS = 50;

    /// @notice Maximum bond-based fee (200 bps = 2%)
    uint256 public constant MAX_BOND_FEE_BPS = 200;

    /// @notice Minimum voluntary fee amount (0 BASED - optional)
    uint256 public constant MIN_VOLUNTARY_FEE = 0 ether;

    /// @notice Maximum voluntary fee amount (1000 BASED)
    uint256 public constant MAX_VOLUNTARY_FEE = 1000 ether;

    /// @notice Minimum voluntary bonus (0 bps = 0%)
    uint256 public constant MIN_VOLUNTARY_BONUS_BPS = 0;

    /// @notice Maximum voluntary bonus (800 bps = 8%)
    uint256 public constant MAX_VOLUNTARY_BONUS_BPS = 800;

    /// @notice Tax on voluntary fees (1000 bps = 10%)
    uint256 public constant VOLUNTARY_FEE_TAX_BPS = 1000;

    /// @notice Minimum platform share (0% - fully flexible)
    uint256 public constant MIN_PLATFORM_SHARE_BPS = 0;

    /// @notice Maximum platform share (10000 bps = 100%)
    uint256 public constant MAX_PLATFORM_SHARE_BPS = 10000;

    /// @notice Minimum creator share (0% - fully flexible)
    uint256 public constant MIN_CREATOR_SHARE_BPS = 0;

    /// @notice Maximum creator share (10000 bps = 100%)
    uint256 public constant MAX_CREATOR_SHARE_BPS = 10000;

    /// @notice Minimum staking share (0% - fully flexible)
    uint256 public constant MIN_STAKING_SHARE_BPS = 0;

    /// @notice Maximum staking share (10000 bps = 100%)
    uint256 public constant MAX_STAKING_SHARE_BPS = 10000;

    /// @notice Global minimum trading fee (0 bps = 0%)
    uint256 public constant MIN_TRADING_FEE_BPS = 0;

    /// @notice Global maximum trading fee (1000 bps = 10%)
    uint256 public constant MAX_TRADING_FEE_BPS = 1000;

    // =============================================================================
    // CUSTOM ERRORS
    // =============================================================================

    /// @notice Thrown when bond amount is below minimum
    error BondTooLow(uint256 provided, uint256 minimum);

    /// @notice Thrown when bond amount is above maximum
    error BondTooHigh(uint256 provided, uint256 maximum);

    /// @notice Thrown when voluntary fee is above maximum
    error VoluntaryFeeTooHigh(uint256 provided, uint256 maximum);

    /// @notice Thrown when trading fee exceeds global maximum
    error TradingFeeExceedsMax(uint256 calculated, uint256 maximum);

    /// @notice Thrown when platform share is below minimum
    error PlatformShareTooLow(uint256 provided, uint256 minimum);

    /// @notice Thrown when platform share is above maximum
    error PlatformShareTooHigh(uint256 provided, uint256 maximum);

    /// @notice Thrown when creator share is below minimum
    error CreatorShareTooLow(uint256 provided, uint256 minimum);

    /// @notice Thrown when creator share is above maximum
    error CreatorShareTooHigh(uint256 provided, uint256 maximum);

    /// @notice Thrown when staking share is below minimum
    error StakingShareTooLow(uint256 provided, uint256 minimum);

    /// @notice Thrown when staking share is above maximum
    error StakingShareTooHigh(uint256 provided, uint256 maximum);

    /// @notice Thrown when distribution shares don't sum to 100%
    error DistributionMustSumTo100(uint256 total);

    /// @notice Thrown when fee amount is zero
    error ZeroFeeAmount();

    // =============================================================================
    // TIER 1: BOND-BASED FEE SCALING
    // =============================================================================

    /**
     * @notice Calculate trading fee based on bond amount (Tier 1)
     * @dev Linear interpolation between MIN_BOND_FEE_BPS and MAX_BOND_FEE_BPS
     *
     * Formula:
     *      if bondAmount <= MIN_BOND: return MIN_BOND_FEE_BPS
     *      if bondAmount >= MAX_BOND: return MAX_BOND_FEE_BPS
     *      else: linear interpolation
     *
     * Example:
     *      bondAmount = 500 BASED
     *      → (500 - 10) / (1000 - 10) = 0.494949...
     *      → 50 + (0.494949 * (200 - 50)) = 124.24 bps ≈ 1.24%
     *
     * @param bondAmount Amount of bond in wei (10-1000 BASED)
     * @return feeBps Trading fee in basis points (50-200 = 0.5-2%)
     *
     * Gas: ~3,000
     */
    function calculateBondFee(uint256 bondAmount) internal pure returns (uint256 feeBps) {
        // Validate bond amount
        if (bondAmount < MIN_BOND) revert BondTooLow(bondAmount, MIN_BOND);
        if (bondAmount > MAX_BOND) revert BondTooHigh(bondAmount, MAX_BOND);

        // Handle edge cases
        if (bondAmount <= MIN_BOND) return MIN_BOND_FEE_BPS;
        if (bondAmount >= MAX_BOND) return MAX_BOND_FEE_BPS;

        // Linear interpolation
        uint256 feeRange = MAX_BOND_FEE_BPS - MIN_BOND_FEE_BPS; // 200 - 50 = 150
        uint256 bondRange = MAX_BOND - MIN_BOND;                // 1000 - 10 = 990 ether
        uint256 bondDelta = bondAmount - MIN_BOND;              // How far above minimum

        // Calculate proportional fee
        feeBps = MIN_BOND_FEE_BPS + (bondDelta * feeRange) / bondRange;

        return feeBps;
    }

    // =============================================================================
    // TIER 2: VOLUNTARY FEE-BASED BONUS SCALING
    // =============================================================================

    /**
     * @notice Calculate bonus trading fee based on voluntary fee amount (Tier 2)
     * @dev Linear interpolation between MIN_VOLUNTARY_BONUS_BPS and MAX_VOLUNTARY_BONUS_BPS
     *
     * Formula:
     *      if voluntaryAmount == 0: return 0
     *      if voluntaryAmount <= MIN_VOLUNTARY_FEE: return MIN_VOLUNTARY_BONUS_BPS
     *      if voluntaryAmount >= MAX_VOLUNTARY_FEE: return MAX_VOLUNTARY_BONUS_BPS
     *      else: linear interpolation
     *
     * Example:
     *      voluntaryAmount = 500 BASED
     *      → (500 - 0) / (1000 - 0) = 0.5
     *      → 0 + (0.5 * (800 - 0)) = 400 bps = 4%
     *
     * Note: Voluntary fee gets taxed at VOLUNTARY_FEE_TAX_BPS (10%)
     *       before going to staking pool.
     *
     * @param voluntaryAmount Amount of voluntary fee in wei (0-1000 BASED)
     * @return bonusBps Bonus trading fee in basis points (0-800 = 0-8%)
     *
     * Gas: ~2,500
     */
    function calculateVoluntaryBonus(uint256 voluntaryAmount) internal pure returns (uint256 bonusBps) {
        // Validate voluntary fee amount
        if (voluntaryAmount > MAX_VOLUNTARY_FEE) {
            revert VoluntaryFeeTooHigh(voluntaryAmount, MAX_VOLUNTARY_FEE);
        }

        // Handle zero case (no voluntary fee)
        if (voluntaryAmount == 0) return 0;

        // Handle edge cases
        if (voluntaryAmount <= MIN_VOLUNTARY_FEE) return MIN_VOLUNTARY_BONUS_BPS;
        if (voluntaryAmount >= MAX_VOLUNTARY_FEE) return MAX_VOLUNTARY_BONUS_BPS;

        // Linear interpolation
        uint256 bonusRange = MAX_VOLUNTARY_BONUS_BPS - MIN_VOLUNTARY_BONUS_BPS; // 800 - 0 = 800
        uint256 voluntaryRange = MAX_VOLUNTARY_FEE - MIN_VOLUNTARY_FEE;         // 1000 - 0 = 1000 ether
        uint256 voluntaryDelta = voluntaryAmount - MIN_VOLUNTARY_FEE;           // How far above minimum

        // Calculate proportional bonus
        bonusBps = MIN_VOLUNTARY_BONUS_BPS + (voluntaryDelta * bonusRange) / voluntaryRange;

        return bonusBps;
    }

    // =============================================================================
    // COMBINED FEE CALCULATION (ADDITIVE MODEL)
    // =============================================================================

    /**
     * @notice Calculate total trading fee (Tier 1 + Tier 2 additive model)
     * @dev totalFee = bondFee + voluntaryBonus
     *
     * Formula:
     *      bondFeeBps = calculateBondFee(bondAmount)
     *      voluntaryBonusBps = calculateVoluntaryBonus(voluntaryAmount)
     *      totalFeeBps = bondFeeBps + voluntaryBonusBps
     *
     * Example:
     *      bondAmount = 500 BASED → bondFee = 124 bps (1.24%)
     *      voluntaryAmount = 500 BASED → bonus = 400 bps (4%)
     *      totalFee = 124 + 400 = 524 bps (5.24%)
     *
     * Validation:
     *      - totalFeeBps must not exceed MAX_TRADING_FEE_BPS (1000 = 10%)
     *
     * @param bondAmount Required bond amount in wei (10-1000 BASED)
     * @param voluntaryAmount Optional voluntary fee in wei (0-1000 BASED)
     * @return totalFeeBps Total trading fee in basis points (50-1000 = 0.5-10%)
     *
     * Gas: ~6,000
     */
    function calculateTradingFee(
        uint256 bondAmount,
        uint256 voluntaryAmount
    ) internal pure returns (uint256 totalFeeBps) {
        // Calculate tier 1 fee (bond-based)
        uint256 bondFeeBps = calculateBondFee(bondAmount);

        // Calculate tier 2 bonus (voluntary fee-based)
        uint256 voluntaryBonusBps = calculateVoluntaryBonus(voluntaryAmount);

        // Combine using additive model
        totalFeeBps = bondFeeBps + voluntaryBonusBps;

        // Enforce global trading fee cap
        if (totalFeeBps > MAX_TRADING_FEE_BPS) {
            revert TradingFeeExceedsMax(totalFeeBps, MAX_TRADING_FEE_BPS);
        }

        return totalFeeBps;
    }

    // =============================================================================
    // 3-WAY FEE DISTRIBUTION VALIDATION
    // =============================================================================

    /**
     * @notice Validate 3-way fee distribution (Platform + Creator + Staking = 100%)
     * @dev Ensures distribution shares sum exactly to PRECISION (10000 = 100%)
     *
     * Validation Rules:
     *      1. Platform: MIN_PLATFORM_SHARE_BPS <= platformShareBps <= MAX_PLATFORM_SHARE_BPS
     *      2. Creator: MIN_CREATOR_SHARE_BPS <= creatorShareBps <= MAX_CREATOR_SHARE_BPS
     *      3. Staking: MIN_STAKING_SHARE_BPS <= stakingShareBps <= MAX_STAKING_SHARE_BPS
     *      4. Sum: platformShareBps + creatorShareBps + stakingShareBps == PRECISION
     *
     * Example (Valid):
     *      platformShareBps = 3000 (30%)
     *      creatorShareBps = 4000 (40%)
     *      stakingShareBps = 3000 (30%)
     *      → 3000 + 4000 + 3000 = 10000 ✅
     *
     * Example (Invalid - doesn't sum to 100%):
     *      platformShareBps = 5000 (50%)
     *      creatorShareBps = 6000 (60%)
     *      stakingShareBps = 4000 (40%)
     *      → 5000 + 6000 + 4000 = 15000 ❌ (150%)
     *
     * @param platformShareBps Platform's share in basis points (0-10000)
     * @param creatorShareBps Creator's share in basis points (0-10000)
     * @param stakingShareBps Staking pool's share in basis points (0-10000)
     *
     * Gas: ~2,000
     */
    function validateDistribution(
        uint256 platformShareBps,
        uint256 creatorShareBps,
        uint256 stakingShareBps
    ) internal pure {
        // Validate individual ranges
        if (platformShareBps < MIN_PLATFORM_SHARE_BPS) {
            revert PlatformShareTooLow(platformShareBps, MIN_PLATFORM_SHARE_BPS);
        }
        if (platformShareBps > MAX_PLATFORM_SHARE_BPS) {
            revert PlatformShareTooHigh(platformShareBps, MAX_PLATFORM_SHARE_BPS);
        }

        if (creatorShareBps < MIN_CREATOR_SHARE_BPS) {
            revert CreatorShareTooLow(creatorShareBps, MIN_CREATOR_SHARE_BPS);
        }
        if (creatorShareBps > MAX_CREATOR_SHARE_BPS) {
            revert CreatorShareTooHigh(creatorShareBps, MAX_CREATOR_SHARE_BPS);
        }

        if (stakingShareBps < MIN_STAKING_SHARE_BPS) {
            revert StakingShareTooLow(stakingShareBps, MIN_STAKING_SHARE_BPS);
        }
        if (stakingShareBps > MAX_STAKING_SHARE_BPS) {
            revert StakingShareTooHigh(stakingShareBps, MAX_STAKING_SHARE_BPS);
        }

        // Validate sum to 100%
        uint256 total = platformShareBps + creatorShareBps + stakingShareBps;
        if (total != PRECISION) {
            revert DistributionMustSumTo100(total);
        }
    }

    // =============================================================================
    // FEE SPLITTING (3-WAY DISTRIBUTION)
    // =============================================================================

    /**
     * @notice Split fee amount according to 3-way distribution ratios
     * @dev Calculates exact amounts for platform, creator, and staking pool
     *
     * Formula:
     *      platformAmount = (totalFee * platformShareBps) / PRECISION
     *      creatorAmount = (totalFee * creatorShareBps) / PRECISION
     *      stakingAmount = (totalFee * stakingShareBps) / PRECISION
     *
     * Example:
     *      totalFee = 1000 BASED
     *      platformShareBps = 3000 (30%)
     *      creatorShareBps = 4000 (40%)
     *      stakingShareBps = 3000 (30%)
     *      → platformAmount = 300 BASED
     *      → creatorAmount = 400 BASED
     *      → stakingAmount = 300 BASED
     *      Total = 1000 BASED ✅
     *
     * Note: Distribution must be validated before calling this function
     *
     * @param totalFee Total fee amount to split in wei
     * @param platformShareBps Platform's share in basis points (0-10000)
     * @param creatorShareBps Creator's share in basis points (0-10000)
     * @param stakingShareBps Staking pool's share in basis points (0-10000)
     * @return platformAmount Amount for platform in wei
     * @return creatorAmount Amount for creator in wei
     * @return stakingAmount Amount for staking pool in wei
     *
     * Gas: ~3,000
     */
    function splitFee(
        uint256 totalFee,
        uint256 platformShareBps,
        uint256 creatorShareBps,
        uint256 stakingShareBps
    ) internal pure returns (
        uint256 platformAmount,
        uint256 creatorAmount,
        uint256 stakingAmount
    ) {
        // Validate total fee is non-zero
        if (totalFee == 0) revert ZeroFeeAmount();

        // Calculate each share
        platformAmount = (totalFee * platformShareBps) / PRECISION;
        creatorAmount = (totalFee * creatorShareBps) / PRECISION;
        stakingAmount = (totalFee * stakingShareBps) / PRECISION;

        return (platformAmount, creatorAmount, stakingAmount);
    }

    // =============================================================================
    // HELPER FUNCTIONS
    // =============================================================================

    /**
     * @notice Calculate net voluntary fee after tax
     * @dev Applies VOLUNTARY_FEE_TAX_BPS (10%) tax on voluntary fees
     *
     * Formula:
     *      tax = (voluntaryFee * VOLUNTARY_FEE_TAX_BPS) / PRECISION
     *      netAmount = voluntaryFee - tax
     *
     * Example:
     *      voluntaryFee = 500 BASED
     *      tax = (500 * 1000) / 10000 = 50 BASED (10%)
     *      netAmount = 500 - 50 = 450 BASED (goes to staking)
     *
     * @param voluntaryFee Gross voluntary fee amount in wei
     * @return tax Amount taxed (goes to platform) in wei
     * @return netAmount Net amount (goes to staking pool) in wei
     *
     * Gas: ~1,500
     */
    function calculateVoluntaryFeeTax(
        uint256 voluntaryFee
    ) internal pure returns (uint256 tax, uint256 netAmount) {
        if (voluntaryFee == 0) return (0, 0);

        // Calculate tax
        tax = (voluntaryFee * VOLUNTARY_FEE_TAX_BPS) / PRECISION;

        // Calculate net amount
        netAmount = voluntaryFee - tax;

        return (tax, netAmount);
    }

    /**
     * @notice Get complete fee breakdown for a market configuration
     * @dev Convenience function that returns all fee-related calculations
     *
     * @param bondAmount Required bond amount in wei (10-1000 BASED)
     * @param voluntaryAmount Optional voluntary fee in wei (0-1000 BASED)
     * @param platformShareBps Platform's share in basis points (0-10000)
     * @param creatorShareBps Creator's share in basis points (0-10000)
     * @param stakingShareBps Staking pool's share in basis points (0-10000)
     * @return bondFeeBps Bond-based fee in basis points
     * @return voluntaryBonusBps Voluntary bonus in basis points
     * @return totalTradingFeeBps Total trading fee in basis points
     * @return voluntaryTax Tax on voluntary fee in wei
     * @return voluntaryNet Net voluntary fee to staking in wei
     *
     * Gas: ~12,000
     */
    function getFeeBreakdown(
        uint256 bondAmount,
        uint256 voluntaryAmount,
        uint256 platformShareBps,
        uint256 creatorShareBps,
        uint256 stakingShareBps
    ) internal pure returns (
        uint256 bondFeeBps,
        uint256 voluntaryBonusBps,
        uint256 totalTradingFeeBps,
        uint256 voluntaryTax,
        uint256 voluntaryNet
    ) {
        // Validate distribution
        validateDistribution(platformShareBps, creatorShareBps, stakingShareBps);

        // Calculate fee components
        bondFeeBps = calculateBondFee(bondAmount);
        voluntaryBonusBps = calculateVoluntaryBonus(voluntaryAmount);
        totalTradingFeeBps = bondFeeBps + voluntaryBonusBps;

        // Enforce global fee cap
        if (totalTradingFeeBps > MAX_TRADING_FEE_BPS) {
            revert TradingFeeExceedsMax(totalTradingFeeBps, MAX_TRADING_FEE_BPS);
        }

        // Calculate voluntary fee tax
        (voluntaryTax, voluntaryNet) = calculateVoluntaryFeeTax(voluntaryAmount);

        return (bondFeeBps, voluntaryBonusBps, totalTradingFeeBps, voluntaryTax, voluntaryNet);
    }
}
