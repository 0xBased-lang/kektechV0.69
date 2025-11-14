// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "../interfaces/IBondingCurve.sol";
import "abdk-libraries-solidity/ABDKMath64x64.sol";

/**
 * @title LMSRBondingCurve
 * @notice Logarithmic Market Scoring Rule (LMSR) bonding curve implementation
 * @dev Production-grade LMSR for prediction markets
 *
 * Mathematical Foundation:
 * Cost Function: C(q) = b × ln(e^(q₁/b) + e^(q₂/b))
 * where:
 * - b = liquidity parameter (subsidy from market maker)
 * - q₁ = total YES shares outstanding
 * - q₂ = total NO shares outstanding
 * - e = Euler's number (2.71828...)
 * - ln = natural logarithm
 *
 * Properties:
 * 1. Bounded Loss: Market maker loses at most b × ln(2) ≈ 0.693 × b
 * 2. Proper Scoring: Prices reflect actual probabilities
 * 3. Always Liquid: Can always buy/sell at some price
 * 4. Arbitrage-Free: No riskless profit opportunities
 *
 * Key Constraints:
 * - b must be positive (enforced in validateParams)
 * - q₁, q₂ must fit in int128 for ABDK (max ~9.2×10^18)
 * - Final cost must fit in uint256
 *
 * Gas Optimization:
 * - Uses binary64x64 fixed-point arithmetic (faster than floating point)
 * - Caches intermediate calculations
 * - Minimizes logarithm/exponential calls (expensive)
 *
 * Security:
 * - All inputs validated
 * - Overflow protection via ABDK library
 * - No external calls (pure functions)
 * - Extensive fuzz testing required
 *
 * References:
 * - Hanson (2003): "Combinatorial Information Market Design"
 * - Chen & Pennock (2007): "A Utility Framework for Bounded-Loss Market Makers"
 * - Othman et al. (2013): "A Practical Liquidity-Sensitive Automated Market Maker"
 *
 * @custom:security-contact security@kektech.com
 */
contract LMSRBondingCurve is IBondingCurve {
    using ABDKMath64x64 for int128;

    // ============= Constants =============

    /// @notice Maximum liquidity parameter (10M ETH) to prevent overflow
    uint256 public constant MAX_LIQUIDITY_PARAM = 10_000_000 ether;

    /// @notice Minimum liquidity parameter (0.001 ETH) to prevent rounding issues
    uint256 public constant MIN_LIQUIDITY_PARAM = 0.001 ether;

    /// @notice Maximum shares per outcome to fit in ABDK int128 (~9×10^18)
    uint256 public constant MAX_SHARES = 9_000_000_000 ether;

    // ============= Core Functions =============

    /**
     * @notice Calculate cost to buy shares using LMSR
     * @param b Liquidity parameter (subsidy amount)
     * @param currentYes Total YES shares outstanding
     * @param currentNo Total NO shares outstanding
     * @param isYes True if buying YES shares, false for NO
     * @param shares Number of shares to buy
     * @return cost Cost in wei to buy these shares
     *
     * Formula: cost = C(q + Δq) - C(q)
     * where C(q) = b × ln(e^(q₁/b) + e^(q₂/b))
     */
    function calculateCost(
        uint256 b,
        uint256 currentYes,
        uint256 currentNo,
        bool isYes,
        uint256 shares
    ) external pure override returns (uint256 cost) {
        // Input validation
        require(b >= MIN_LIQUIDITY_PARAM && b <= MAX_LIQUIDITY_PARAM, "Invalid liquidity param");
        require(currentYes <= MAX_SHARES && currentNo <= MAX_SHARES, "Shares exceed max");
        require(shares > 0, "Shares must be positive");

        // Edge case: zero shares requested
        if (shares == 0) return 0;

        // Prevent overflow when adding shares
        uint256 newShares = isYes ? currentYes : currentNo;
        require(newShares + shares <= MAX_SHARES, "Result exceeds max shares");

        // Convert to ABDK 64.64 fixed point format
        int128 b_fp = _toABDK(b);
        int128 q1_before = _toABDK(currentYes);
        int128 q2_before = _toABDK(currentNo);

        // Calculate C_before = C(q₁, q₂)
        int128 C_before = _costFunction(b_fp, q1_before, q2_before);

        // Update quantities after purchase
        int128 q1_after = isYes ? q1_before.add(_toABDK(shares)) : q1_before;
        int128 q2_after = isYes ? q2_before : q2_before.add(_toABDK(shares));

        // Calculate C_after = C(q₁ + Δq₁, q₂ + Δq₂)
        int128 C_after = _costFunction(b_fp, q1_after, q2_after);

        // Cost = C_after - C_before
        int128 cost_fp = C_after.sub(C_before);

        // Convert back to uint256 (wei)
        cost = _fromABDK(cost_fp);

        // Sanity check: cost should be positive
        require(cost > 0, "Cost must be positive");

        return cost;
    }

    /**
     * @notice Calculate refund for selling shares using LMSR
     * @param b Liquidity parameter
     * @param currentYes Total YES shares outstanding
     * @param currentNo Total NO shares outstanding
     * @param isYes True if selling YES shares, false for NO
     * @param shares Number of shares to sell
     * @return refund Refund amount in wei
     *
     * Formula: refund = C(q) - C(q - Δq)
     * Note: Refund is always less than original cost (bounded loss property)
     */
    function calculateRefund(
        uint256 b,
        uint256 currentYes,
        uint256 currentNo,
        bool isYes,
        uint256 shares
    ) external pure override returns (uint256 refund) {
        // Input validation
        require(b >= MIN_LIQUIDITY_PARAM && b <= MAX_LIQUIDITY_PARAM, "Invalid liquidity param");
        require(currentYes <= MAX_SHARES && currentNo <= MAX_SHARES, "Shares exceed max");
        require(shares > 0, "Shares must be positive");

        // Cannot sell more shares than exist
        if (isYes) {
            require(shares <= currentYes, "Insufficient YES shares");
        } else {
            require(shares <= currentNo, "Insufficient NO shares");
        }

        // Edge cases
        if (shares == 0) return 0;

        // Convert to ABDK 64.64 fixed point
        int128 b_fp = _toABDK(b);
        int128 q1_before = _toABDK(currentYes);
        int128 q2_before = _toABDK(currentNo);

        // Calculate C_before = C(q₁, q₂)
        int128 C_before = _costFunction(b_fp, q1_before, q2_before);

        // Update quantities after selling
        int128 q1_after = isYes ? q1_before.sub(_toABDK(shares)) : q1_before;
        int128 q2_after = isYes ? q2_before : q2_before.sub(_toABDK(shares));

        // Calculate C_after = C(q₁ - Δq₁, q₂ - Δq₂)
        int128 C_after = _costFunction(b_fp, q1_after, q2_after);

        // Refund = C_before - C_after (positive because C decreases)
        int128 refund_fp = C_before.sub(C_after);

        // Convert back to uint256
        refund = _fromABDK(refund_fp);

        // Sanity check: refund should be positive
        require(refund > 0, "Refund must be positive");

        return refund;
    }

    /**
     * @notice Get current prices (probabilities) for both outcomes
     * @param b Liquidity parameter
     * @param currentYes Total YES shares outstanding
     * @param currentNo Total NO shares outstanding
     * @return yesPrice YES price in basis points (0-10000)
     * @return noPrice NO price in basis points (0-10000)
     *
     * Formula: p₁ = e^(q₁/b) / (e^(q₁/b) + e^(q₂/b))
     * Prices always sum to 10000 (100%)
     */
    function getPrices(
        uint256 b,
        uint256 currentYes,
        uint256 currentNo
    ) external pure override returns (uint256 yesPrice, uint256 noPrice) {
        // Handle equilibrium case (both zero)
        if (currentYes == 0 && currentNo == 0) {
            return (5000, 5000); // 50/50 split
        }

        // Validate inputs
        require(b >= MIN_LIQUIDITY_PARAM, "Invalid liquidity param");
        require(currentYes <= MAX_SHARES && currentNo <= MAX_SHARES, "Shares exceed max");

        // Convert to ABDK
        int128 b_fp = _toABDK(b);
        int128 q1_fp = _toABDK(currentYes);
        int128 q2_fp = _toABDK(currentNo);

        // Calculate exp(q₁/b) and exp(q₂/b)
        int128 exp_q1_b = q1_fp.div(b_fp).exp();
        int128 exp_q2_b = q2_fp.div(b_fp).exp();

        // Calculate sum = exp(q₁/b) + exp(q₂/b)
        int128 sum = exp_q1_b.add(exp_q2_b);

        // Calculate p₁ = exp(q₁/b) / sum
        int128 p1_fp = exp_q1_b.div(sum);

        // Convert to basis points (10000 = 100%)
        // p1_fp is in [0,1], multiply by 10000
        int128 ten_thousand = ABDKMath64x64.fromUInt(10000);
        int128 yesPrice_fp = p1_fp.mul(ten_thousand);

        yesPrice = ABDKMath64x64.toUInt(yesPrice_fp);

        // Ensure sum = 10000 (handle rounding)
        noPrice = 10000 - yesPrice;

        // Sanity checks
        require(yesPrice <= 10000, "Invalid YES price");
        require(noPrice <= 10000, "Invalid NO price");
        require(yesPrice + noPrice == 10000, "Prices must sum to 10000");

        return (yesPrice, noPrice);
    }

    /**
     * @inheritdoc IBondingCurve
     */
    function curveName() external pure override returns (string memory) {
        return "LMSR (Logarithmic Market Scoring Rule)";
    }

    /**
     * @notice Validate liquidity parameter
     * @param b Liquidity parameter to validate
     * @return valid True if valid
     * @return reason Reason if invalid
     */
    function validateParams(uint256 b)
        external
        pure
        override
        returns (bool valid, string memory reason)
    {
        if (b < MIN_LIQUIDITY_PARAM) {
            return (false, "Liquidity param too low (min 0.001 ETH)");
        }

        if (b > MAX_LIQUIDITY_PARAM) {
            return (false, "Liquidity param too high (max 10M ETH)");
        }

        return (true, "");
    }

    // ============= Internal Functions =============

    /**
     * @notice LMSR cost function: C(q) = b × ln(e^(q₁/b) + e^(q₂/b))
     * @param b_fp Liquidity parameter (ABDK format)
     * @param q1_fp YES shares (ABDK format)
     * @param q2_fp NO shares (ABDK format)
     * @return C_fp Cost function value (ABDK format)
     */
    function _costFunction(
        int128 b_fp,
        int128 q1_fp,
        int128 q2_fp
    ) private pure returns (int128 C_fp) {
        // Calculate exp(q₁/b)
        int128 exp_q1_b = q1_fp.div(b_fp).exp();

        // Calculate exp(q₂/b)
        int128 exp_q2_b = q2_fp.div(b_fp).exp();

        // Calculate sum = exp(q₁/b) + exp(q₂/b)
        int128 sum = exp_q1_b.add(exp_q2_b);

        // Calculate ln(sum)
        int128 ln_sum = sum.ln();

        // Calculate C = b × ln(sum)
        C_fp = b_fp.mul(ln_sum);

        return C_fp;
    }

    /**
     * @notice Convert uint256 to ABDK 64.64 fixed point
     * @param x Value to convert (in wei)
     * @return ABDK 64.64 representation
     */
    function _toABDK(uint256 x) private pure returns (int128) {
        // Convert wei to ether (divide by 1e18)
        // Then convert to ABDK format
        return ABDKMath64x64.divu(x, 1 ether);
    }

    /**
     * @notice Convert ABDK 64.64 to uint256
     * @param x ABDK value
     * @return Value in wei
     */
    function _fromABDK(int128 x) private pure returns (uint256) {
        // Convert ABDK to ether, then multiply by 1e18 to get wei
        return ABDKMath64x64.mulu(x, 1 ether);
    }
}
