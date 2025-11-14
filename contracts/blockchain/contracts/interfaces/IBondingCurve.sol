// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IBondingCurve
 * @notice Standard interface for bonding curve implementations
 * @dev All bonding curves must implement this interface for FlexibleMarketFactory compatibility
 *
 * Curve implementations must satisfy these invariants:
 * 1. Prices must sum to 10000 (100% with 2 decimals) ± 1 basis point for rounding
 * 2. Prices must be bounded: 0 <= price <= 10000
 * 3. Cost/refund calculations must be deterministic and monotonic
 * 4. Must support one-sided markets (qYes=0 OR qNo=0)
 *
 * @custom:security-contact security@kektech.com
 */
interface IBondingCurve {
    /**
     * @notice Calculate the cost to buy shares
     * @dev Must return cost in wei, including any curve-specific fees
     * @param curveParams Curve-specific parameters (e.g., b for LMSR, slope for Linear)
     * @param currentYes Current total YES shares outstanding
     * @param currentNo Current total NO shares outstanding
     * @param outcome True for YES, False for NO
     * @param shares Number of shares to buy (in wei units)
     * @return cost Amount of ETH required (in wei)
     *
     * Requirements:
     * - Must be pure function (no state changes)
     * - Must not revert on valid inputs
     * - Must handle one-sided markets (currentYes=0 OR currentNo=0)
     * - Cost must increase monotonically with shares
     */
    function calculateCost(
        uint256 curveParams,
        uint256 currentYes,
        uint256 currentNo,
        bool outcome,
        uint256 shares
    ) external pure returns (uint256 cost);

    /**
     * @notice Calculate the refund for selling shares
     * @dev Must return refund in wei, net of any curve-specific fees
     * @param curveParams Curve-specific parameters
     * @param currentYes Current total YES shares outstanding (before sell)
     * @param currentNo Current total NO shares outstanding (before sell)
     * @param outcome True for YES, False for NO
     * @param shares Number of shares to sell (in wei units)
     * @return refund Amount of ETH to refund (in wei)
     *
     * Requirements:
     * - Must be pure function (no state changes)
     * - Must not revert on valid inputs
     * - Refund must be <= cost for buying same shares at same state
     * - Must handle one-sided markets
     * - Refund must decrease monotonically as shares sold increase
     */
    function calculateRefund(
        uint256 curveParams,
        uint256 currentYes,
        uint256 currentNo,
        bool outcome,
        uint256 shares
    ) external pure returns (uint256 refund);

    /**
     * @notice Get current market prices for both outcomes
     * @dev Prices are in basis points (1 = 0.01%, 10000 = 100%)
     * @param curveParams Curve-specific parameters
     * @param currentYes Current total YES shares outstanding
     * @param currentNo Current total NO shares outstanding
     * @return yesPrice Price of YES in basis points (0-10000)
     * @return noPrice Price of NO in basis points (0-10000)
     *
     * Requirements:
     * - Must be pure function (no state changes)
     * - yesPrice + noPrice should equal 10000 ± 1 (for rounding)
     * - Both prices must be in range [0, 10000]
     * - Must handle one-sided markets gracefully
     * - Prices must reflect current market state accurately
     *
     * Example:
     * - Equilibrium: (5000, 5000) = 50/50
     * - YES favored: (7500, 2500) = 75/25
     * - One-sided YES: (9999, 1) ≈ 100/0
     */
    function getPrices(
        uint256 curveParams,
        uint256 currentYes,
        uint256 currentNo
    ) external pure returns (uint256 yesPrice, uint256 noPrice);

    /**
     * @notice Get human-readable name of the curve type
     * @return Curve type name (e.g., "LMSR", "Linear", "Exponential")
     */
    function curveName() external view returns (string memory);

    /**
     * @notice Validate curve parameters
     * @dev Allows each curve to define valid parameter ranges
     * @param curveParams Parameters to validate
     * @return valid True if parameters are valid for this curve type
     * @return reason Human-readable error message if invalid
     *
     * Examples:
     * - LMSR: b must be > 0
     * - Linear: slope must be > 0
     * - Exponential: base must be > 1
     */
    function validateParams(uint256 curveParams)
        external
        pure
        returns (bool valid, string memory reason);
}
