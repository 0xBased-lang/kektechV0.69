// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "abdk-libraries-solidity/ABDKMath64x64.sol";

/**
 * @title LMSRMath
 * @notice Logarithmic Market Scoring Rule (LMSR) mathematical functions
 * @dev Implements LMSR bonding curve: C(q_yes, q_no) = b * ln(e^(q_yes/b) + e^(q_no/b))
 *
 * Key Properties:
 * - Prices always sum to 1.0 (P(YES) + P(NO) = 1)
 * - Works with one-sided markets (only YES or only NO traders)
 * - Smooth price curves with no discontinuities
 * - No liquidity provider needed
 *
 * References:
 * - Hanson, R. (2003). "Combinatorial Information Market Design"
 * - Uses ABDKMath64x64 for safe fixed-point exp/log operations
 */
library LMSRMath {
    using ABDKMath64x64 for int128;

    /// @notice Precision for price calculations (basis points: 10000 = 100%)
    uint256 public constant PRICE_PRECISION = 10000;

    /// @notice Maximum value for b parameter to prevent overflow
    uint256 public constant MAX_B = 1e24; // 1 million ETH

    /// @notice Minimum value for b parameter to ensure meaningful price movement
    uint256 public constant MIN_B = 1e15; // 0.001 ETH

    // Custom errors
    error InvalidLiquidityParameter();
    error InvalidShareAmount();
    error MathOverflow();
    error MathUnderflow();

    /**
     * @notice Maximum safe input for exp function to prevent overflow
     * @dev ABDKMath64x64.exp() can handle up to ~133, but we use 40 for safety
     *      e^40 ≈ 2.35 × 10^17 (safely within bounds)
     *      This is large enough that exp(40) >> 1 for all practical purposes
     *      In 64.64 format: 40 << 64 = 737869762948382064640
     */
    int128 private constant MAX_EXP_INPUT = 737869762948382064640; // 40 in 64.64 format

    /**
     * @notice Safe exponential function with overflow protection
     * @dev Clamps input to MAX_EXP_INPUT to prevent overflow
     *      When input is clamped, the result is so large that it dominates
     *      any other terms in LMSR calculations, which is the correct behavior
     * @param x Input value in 64.64 fixed-point format
     * @return e^x (or e^MAX_EXP_INPUT if x > MAX_EXP_INPUT)
     */
    function safeExp(int128 x) private pure returns (int128) {
        // Clamp to safe range
        if (x > MAX_EXP_INPUT) {
            x = MAX_EXP_INPUT;
        }
        // Note: Negative values are always safe (exp approaches 0)
        return ABDKMath64x64.exp(x);
    }

    /**
     * @notice Calculate the cost function C(q_yes, q_no)
     * @dev C = b * ln(e^(q_yes/b) + e^(q_no/b))
     *
     * Note: We work in Wei for b but shares for q_yes/q_no to avoid overflow
     * The cost function operates on ratios (q/b) which are dimensionless
     *
     * @param b Liquidity parameter in Wei (higher = less price impact per share)
     * @param qYes Total YES shares outstanding (not Wei, just count)
     * @param qNo Total NO shares outstanding (not Wei, just count)
     * @return Cost in Wei
     */
    function cost(
        uint256 b,
        uint256 qYes,
        uint256 qNo
    ) internal pure returns (uint256) {
        if (b < MIN_B || b > MAX_B) revert InvalidLiquidityParameter();

        // Convert b from Wei to Ether for calculation (to keep numbers manageable)
        // b is in Wei, convert to fixed point as Ether value
        int128 fpB = ABDKMath64x64.divu(b, 1e18);

        // qYes and qNo are share counts (already reasonable numbers)
        int128 fpQYes = ABDKMath64x64.fromUInt(qYes);
        int128 fpQNo = ABDKMath64x64.fromUInt(qNo);

        // Calculate q_yes/b and q_no/b (both dimensionless)
        int128 qYesOverB = ABDKMath64x64.div(fpQYes, fpB);
        int128 qNoOverB = ABDKMath64x64.div(fpQNo, fpB);

        // Calculate e^(q_yes/b) and e^(q_no/b) with overflow protection
        int128 expYes = safeExp(qYesOverB);
        int128 expNo = safeExp(qNoOverB);

        // Calculate sum: e^(q_yes/b) + e^(q_no/b)
        int128 sum = ABDKMath64x64.add(expYes, expNo);

        // Calculate ln(sum)
        int128 lnSum = ABDKMath64x64.ln(sum);

        // Calculate b * ln(sum) - result in Ether units
        int128 resultEther = ABDKMath64x64.mul(fpB, lnSum);

        // Convert back to Wei
        return ABDKMath64x64.mulu(resultEther, 1e18);
    }

    /**
     * @notice Calculate the instantaneous price of YES
     * @dev P(YES) = e^(q_yes/b) / (e^(q_yes/b) + e^(q_no/b))
     * @param b Liquidity parameter in Wei
     * @param qYes Total YES shares outstanding (share count)
     * @param qNo Total NO shares outstanding (share count)
     * @return Price in basis points (0-10000, where 10000 = 100%)
     */
    function priceYes(
        uint256 b,
        uint256 qYes,
        uint256 qNo
    ) internal pure returns (uint256) {
        if (b < MIN_B || b > MAX_B) revert InvalidLiquidityParameter();

        // Convert b from Wei to Ether
        int128 fpB = ABDKMath64x64.divu(b, 1e18);

        // Share counts as integers
        int128 fpQYes = ABDKMath64x64.fromUInt(qYes);
        int128 fpQNo = ABDKMath64x64.fromUInt(qNo);

        // Calculate q_yes/b and q_no/b
        int128 qYesOverB = ABDKMath64x64.div(fpQYes, fpB);
        int128 qNoOverB = ABDKMath64x64.div(fpQNo, fpB);

        // Calculate e^(q_yes/b) and e^(q_no/b) with overflow protection
        int128 expYes = safeExp(qYesOverB);
        int128 expNo = safeExp(qNoOverB);

        // Calculate sum: e^(q_yes/b) + e^(q_no/b)
        int128 sum = ABDKMath64x64.add(expYes, expNo);

        // Calculate price: e^(q_yes/b) / sum
        int128 price = ABDKMath64x64.div(expYes, sum);

        // Convert to basis points (multiply by PRICE_PRECISION)
        int128 fpPrecision = ABDKMath64x64.fromUInt(PRICE_PRECISION);
        int128 priceBasisPoints = ABDKMath64x64.mul(price, fpPrecision);

        return ABDKMath64x64.toUInt(priceBasisPoints);
    }

    /**
     * @notice Calculate the instantaneous price of NO
     * @dev P(NO) = e^(q_no/b) / (e^(q_yes/b) + e^(q_no/b))
     * @param b Liquidity parameter in Wei
     * @param qYes Total YES shares outstanding (share count)
     * @param qNo Total NO shares outstanding (share count)
     * @return Price in basis points (0-10000, where 10000 = 100%)
     */
    function priceNo(
        uint256 b,
        uint256 qYes,
        uint256 qNo
    ) internal pure returns (uint256) {
        if (b < MIN_B || b > MAX_B) revert InvalidLiquidityParameter();

        // Convert b from Wei to Ether
        int128 fpB = ABDKMath64x64.divu(b, 1e18);

        // Share counts as integers
        int128 fpQYes = ABDKMath64x64.fromUInt(qYes);
        int128 fpQNo = ABDKMath64x64.fromUInt(qNo);

        // Calculate q_yes/b and q_no/b
        int128 qYesOverB = ABDKMath64x64.div(fpQYes, fpB);
        int128 qNoOverB = ABDKMath64x64.div(fpQNo, fpB);

        // Calculate e^(q_yes/b) and e^(q_no/b) with overflow protection
        int128 expYes = safeExp(qYesOverB);
        int128 expNo = safeExp(qNoOverB);

        // Calculate sum: e^(q_yes/b) + e^(q_no/b)
        int128 sum = ABDKMath64x64.add(expYes, expNo);

        // Calculate price: e^(q_no/b) / sum
        int128 price = ABDKMath64x64.div(expNo, sum);

        // Convert to basis points (multiply by PRICE_PRECISION)
        int128 fpPrecision = ABDKMath64x64.fromUInt(PRICE_PRECISION);
        int128 priceBasisPoints = ABDKMath64x64.mul(price, fpPrecision);

        return ABDKMath64x64.toUInt(priceBasisPoints);
    }

    /**
     * @notice Calculate both prices in a single call (gas optimization)
     * @param b Liquidity parameter in Wei
     * @param qYes Total YES shares outstanding (share count)
     * @param qNo Total NO shares outstanding (share count)
     * @return yesPrice Price of YES in basis points
     * @return noPrice Price of NO in basis points
     */
    function getPrices(
        uint256 b,
        uint256 qYes,
        uint256 qNo
    ) internal pure returns (uint256 yesPrice, uint256 noPrice) {
        if (b < MIN_B || b > MAX_B) revert InvalidLiquidityParameter();

        // Convert b from Wei to Ether
        int128 fpB = ABDKMath64x64.divu(b, 1e18);

        // Share counts as integers
        int128 fpQYes = ABDKMath64x64.fromUInt(qYes);
        int128 fpQNo = ABDKMath64x64.fromUInt(qNo);

        // Calculate q_yes/b and q_no/b
        int128 qYesOverB = ABDKMath64x64.div(fpQYes, fpB);
        int128 qNoOverB = ABDKMath64x64.div(fpQNo, fpB);

        // Calculate e^(q_yes/b) and e^(q_no/b) with overflow protection
        int128 expYes = safeExp(qYesOverB);
        int128 expNo = safeExp(qNoOverB);

        // Calculate sum: e^(q_yes/b) + e^(q_no/b)
        int128 sum = ABDKMath64x64.add(expYes, expNo);

        // Calculate prices
        int128 yesRatio = ABDKMath64x64.div(expYes, sum);
        int128 noRatio = ABDKMath64x64.div(expNo, sum);

        // Convert to basis points
        int128 fpPrecision = ABDKMath64x64.fromUInt(PRICE_PRECISION);
        int128 yesBasisPoints = ABDKMath64x64.mul(yesRatio, fpPrecision);
        int128 noBasisPoints = ABDKMath64x64.mul(noRatio, fpPrecision);

        yesPrice = ABDKMath64x64.toUInt(yesBasisPoints);
        noPrice = ABDKMath64x64.toUInt(noBasisPoints);
    }

    /**
     * @notice Calculate cost to buy shares
     * @dev Returns cost = C(q_yes + shares, q_no) - C(q_yes, q_no) for YES
     *      or cost = C(q_yes, q_no + shares) - C(q_yes, q_no) for NO
     * @param b Liquidity parameter
     * @param qYes Current total YES shares
     * @param qNo Current total NO shares
     * @param outcome true for YES, false for NO
     * @param shares Number of shares to buy
     * @return Cost in wei
     */
    function calculateBuyCost(
        uint256 b,
        uint256 qYes,
        uint256 qNo,
        bool outcome,
        uint256 shares
    ) internal pure returns (uint256) {
        if (shares == 0) revert InvalidShareAmount();

        uint256 costBefore = cost(b, qYes, qNo);
        uint256 costAfter;

        if (outcome) {
            // Buying YES shares
            costAfter = cost(b, qYes + shares, qNo);
        } else {
            // Buying NO shares
            costAfter = cost(b, qYes, qNo + shares);
        }

        // Handle edge case where cost doesn't change due to exp clamping
        // When market is heavily one-sided, additional shares cost almost nothing
        if (costAfter <= costBefore) {
            return 0; // Minimal cost when price is already at extreme
        }

        return costAfter - costBefore;
    }

    /**
     * @notice Calculate refund for selling shares
     * @dev Returns refund = C(q_yes, q_no) - C(q_yes - shares, q_no) for YES
     *      or refund = C(q_yes, q_no) - C(q_yes, q_no - shares) for NO
     * @param b Liquidity parameter
     * @param qYes Current total YES shares
     * @param qNo Current total NO shares
     * @param outcome true for YES, false for NO
     * @param shares Number of shares to sell
     * @return Refund in wei
     */
    function calculateSellRefund(
        uint256 b,
        uint256 qYes,
        uint256 qNo,
        bool outcome,
        uint256 shares
    ) internal pure returns (uint256) {
        if (shares == 0) revert InvalidShareAmount();

        // Ensure user has enough shares
        if (outcome && shares > qYes) revert InvalidShareAmount();
        if (!outcome && shares > qNo) revert InvalidShareAmount();

        uint256 costBefore = cost(b, qYes, qNo);
        uint256 costAfter;

        if (outcome) {
            // Selling YES shares
            costAfter = cost(b, qYes - shares, qNo);
        } else {
            // Selling NO shares
            costAfter = cost(b, qYes, qNo - shares);
        }

        // Handle edge case where cost doesn't change due to exp clamping
        // When market is heavily one-sided, selling underdog shares refunds almost nothing
        if (costBefore <= costAfter) {
            return 0; // Minimal refund when price is already at extreme
        }

        return costBefore - costAfter;
    }

    /**
     * @notice Calculate number of shares that can be bought for given cost
     * @dev Inverse of calculateBuyCost (binary search approximation)
     * @param b Liquidity parameter
     * @param qYes Current total YES shares
     * @param qNo Current total NO shares
     * @param outcome true for YES, false for NO
     * @param maxCost Maximum cost willing to pay in wei
     * @return shares Number of shares that can be bought
     */
    function calculateSharesForCost(
        uint256 b,
        uint256 qYes,
        uint256 qNo,
        bool outcome,
        uint256 maxCost
    ) internal pure returns (uint256 shares) {
        // Binary search to find shares amount
        // This is an approximation due to non-linear cost function
        uint256 low = 0;
        uint256 high = maxCost * 10; // Upper bound estimate
        uint256 mid;

        while (low < high) {
            mid = (low + high + 1) / 2;
            uint256 costForMid = calculateBuyCost(b, qYes, qNo, outcome, mid);

            if (costForMid <= maxCost) {
                low = mid;
            } else {
                high = mid - 1;
            }
        }

        return low;
    }
}
