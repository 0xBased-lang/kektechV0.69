// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../interfaces/IBondingCurve.sol";

/**
 * @title SigmoidCurve
 * @notice S-curve bonding curve with smooth price transitions
 * @dev Sigmoid (logistic) function for natural-looking adoption curves
 *
 * Pricing Formula (Simplified Sigmoid):
 * - price(q) = minPrice + (maxPrice - minPrice) * sigmoid(q)
 * - sigmoid(q) = 1 / (1 + e^(-steepness * (q - inflection)))
 *
 * Approximation (for gas efficiency):
 * - We use piecewise linear approximation of sigmoid
 * - Divides S-curve into early, mid, and late stages
 * - Smooth transitions without expensive exponentials
 *
 * Parameters (packed in curveParams):
 * - minPrice (64 bits): Starting price per share (in wei)
 * - maxPrice (64 bits): Maximum price per share (in wei)
 * - steepness (32 bits): How quickly price changes (higher = steeper S-curve)
 * - inflection (96 bits): Midpoint of S-curve in shares (in wei)
 *
 * Example:
 * - minPrice = 0.0001 ETH
 * - maxPrice = 0.01 ETH
 * - steepness = 5 (moderate S-curve)
 * - inflection = 50 shares
 * - Result: Price starts low, grows rapidly around 50 shares, plateaus near 0.01 ETH
 *
 * Use Cases:
 * - Adoption curves (technology, social trends)
 * - Growth markets (user base, market share)
 * - Natural phenomena (population growth, disease spread)
 *
 * @custom:security-contact security@kektech.com
 */
contract SigmoidCurve is IBondingCurve {
    /*//////////////////////////////////////////////////////////////
                                CONSTANTS
    //////////////////////////////////////////////////////////////*/

    uint256 private constant PRECISION = 1e18;
    uint256 private constant MAX_STEEPNESS = 100; // Limit steepness to prevent extreme curves

    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/

    error InvalidParameters();
    error InvalidShares();
    error MaxPriceTooLow();

    /*//////////////////////////////////////////////////////////////
                          CORE CURVE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @inheritdoc IBondingCurve
     * @dev Calculates cost using piecewise sigmoid approximation
     *
     * Simplified approach:
     * - Divide supply range into segments
     * - Calculate sigmoid value for each segment
     * - Sum costs across segments
     */
    function calculateCost(
        uint256 curveParams,
        uint256 currentYes,
        uint256 currentNo,
        bool outcome,
        uint256 shares
    ) external pure override returns (uint256 cost) {
        if (shares == 0) return 0;

        // Decode parameters
        (uint256 minPrice, uint256 maxPrice, uint256 steepness, uint256 inflection) =
            _decodeParams(curveParams);

        if (minPrice == 0) revert InvalidParameters();
        if (maxPrice <= minPrice) revert MaxPriceTooLow();
        if (steepness == 0) revert InvalidParameters();
        if (steepness > MAX_STEEPNESS) revert InvalidParameters();
        if (inflection == 0) revert InvalidParameters();

        // Get current supply for the outcome being purchased
        uint256 currentSupply = outcome ? currentYes : currentNo;

        // Calculate cost using trapezoidal approximation
        // Divide into small segments for accuracy
        uint256 segments = shares / PRECISION + 1; // At least 1 segment
        if (segments > 100) segments = 100; // Cap at 100 for gas efficiency

        uint256 segmentSize = shares / segments;
        uint256 totalCost = 0;

        for (uint256 i = 0; i < segments; i++) {
            uint256 segmentStart = currentSupply + (i * segmentSize);
            uint256 segmentEnd = (i == segments - 1) ? currentSupply + shares : segmentStart + segmentSize;
            uint256 segmentShares = segmentEnd - segmentStart;

            // Calculate sigmoid prices at start and end of segment
            uint256 startPrice = _calculateSigmoidPrice(segmentStart, minPrice, maxPrice, steepness, inflection);
            uint256 endPrice = _calculateSigmoidPrice(segmentEnd, minPrice, maxPrice, steepness, inflection);

            // Trapezoidal rule: average price * segment shares
            uint256 avgPrice = (startPrice + endPrice) / 2;
            uint256 segmentCost = (avgPrice * segmentShares) / PRECISION;

            totalCost += segmentCost;
        }

        return totalCost;
    }

    /**
     * @inheritdoc IBondingCurve
     * @dev Calculates refund using same approach as cost but with spread
     */
    function calculateRefund(
        uint256 curveParams,
        uint256 currentYes,
        uint256 currentNo,
        bool outcome,
        uint256 shares
    ) external pure override returns (uint256 refund) {
        if (shares == 0) return 0;

        // Decode parameters
        (uint256 minPrice, uint256 maxPrice, uint256 steepness, uint256 inflection) =
            _decodeParams(curveParams);

        if (minPrice == 0) revert InvalidParameters();
        if (maxPrice <= minPrice) revert MaxPriceTooLow();
        if (steepness == 0) revert InvalidParameters();
        if (inflection == 0) revert InvalidParameters();

        // Get current supply for the outcome being sold
        uint256 currentSupply = outcome ? currentYes : currentNo;

        // Ensure we're not selling more than exists
        if (shares > currentSupply) revert InvalidShares();

        // Calculate refund using same trapezoidal method (reverse direction)
        uint256 segments = shares / PRECISION + 1;
        if (segments > 100) segments = 100;

        uint256 segmentSize = shares / segments;
        uint256 totalRefund = 0;

        for (uint256 i = 0; i < segments; i++) {
            uint256 segmentEnd = currentSupply - (i * segmentSize);
            uint256 segmentStart = (i == segments - 1) ? currentSupply - shares : segmentEnd - segmentSize;
            uint256 segmentShares = segmentEnd - segmentStart;

            // Calculate sigmoid prices at start and end of segment
            uint256 startPrice = _calculateSigmoidPrice(segmentStart, minPrice, maxPrice, steepness, inflection);
            uint256 endPrice = _calculateSigmoidPrice(segmentEnd, minPrice, maxPrice, steepness, inflection);

            // Trapezoidal rule: average price * segment shares
            uint256 avgPrice = (startPrice + endPrice) / 2;
            uint256 segmentRefund = (avgPrice * segmentShares) / PRECISION;

            totalRefund += segmentRefund;
        }

        // Apply 1.5% spread for sigmoid curve
        refund = (totalRefund * 985) / 1000;

        return refund;
    }

    /**
     * @inheritdoc IBondingCurve
     * @dev Calculates instantaneous prices based on current supply ratio
     */
    function getPrices(
        uint256 curveParams,
        uint256 currentYes,
        uint256 currentNo
    ) external pure override returns (uint256 yesPrice, uint256 noPrice) {
        // Handle equilibrium case (both zero or initial state)
        if (currentYes == 0 && currentNo == 0) {
            return (5000, 5000); // 50/50 split
        }

        // Calculate total supply
        uint256 totalSupply = currentYes + currentNo;

        // Calculate prices as percentage of total supply (in basis points)
        yesPrice = (currentYes * 10000) / totalSupply;
        noPrice = (currentNo * 10000) / totalSupply;

        // Ensure prices sum to exactly 10000 (handle rounding)
        if (yesPrice + noPrice != 10000) {
            noPrice = 10000 - yesPrice;
        }

        return (yesPrice, noPrice);
    }

    /*//////////////////////////////////////////////////////////////
                          METADATA FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @inheritdoc IBondingCurve
     */
    function curveName() external pure override returns (string memory) {
        return "Sigmoid";
    }

    /**
     * @inheritdoc IBondingCurve
     * @dev Sigmoid curve requires:
     * - minPrice > 0
     * - maxPrice > minPrice
     * - steepness > 0 and <= MAX_STEEPNESS
     * - inflection > 0
     */
    function validateParams(uint256 curveParams)
        external
        pure
        override
        returns (bool valid, string memory reason)
    {
        (uint256 minPrice, uint256 maxPrice, uint256 steepness, uint256 inflection) =
            _decodeParams(curveParams);

        if (minPrice == 0) {
            return (false, "Min price must be > 0");
        }

        if (maxPrice <= minPrice) {
            return (false, "Max price must be > min price");
        }

        if (steepness == 0) {
            return (false, "Steepness must be > 0");
        }

        if (steepness > MAX_STEEPNESS) {
            return (false, "Steepness too high (max 100)");
        }

        if (inflection == 0) {
            return (false, "Inflection point must be > 0");
        }

        return (true, "");
    }

    /*//////////////////////////////////////////////////////////////
                        INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Calculate price at specific supply using simplified sigmoid
     * @dev Uses piecewise approximation to avoid expensive exp() calculations
     * @param supply Current supply quantity (in wei)
     * @param minPrice Minimum price (floor)
     * @param maxPrice Maximum price (ceiling)
     * @param steepness How steep the S-curve is
     * @param inflection Midpoint of S-curve
     * @return price Calculated price at this supply level
     */
    function _calculateSigmoidPrice(
        uint256 supply,
        uint256 minPrice,
        uint256 maxPrice,
        uint256 steepness,
        uint256 inflection
    ) internal pure returns (uint256 price) {
        // Normalize supply to inflection point
        // x = (supply - inflection) / inflection
        int256 x = (int256(supply) - int256(inflection)) * 1000 / int256(inflection);

        // Apply steepness
        int256 sx = (x * int256(steepness)) / 10;

        // Piecewise sigmoid approximation
        // sigmoid(x) ≈ 0.5 + 0.5 * tanh(x/2)
        // We use a simplified version that's gas-efficient
        uint256 sigmoidValue;

        if (sx <= -5000) {
            // Far left: sigmoid ≈ 0
            sigmoidValue = 0;
        } else if (sx >= 5000) {
            // Far right: sigmoid ≈ 1
            sigmoidValue = PRECISION;
        } else {
            // Middle region: linear approximation
            // sigmoid ≈ 0.5 + x/10 for x in [-5, 5]
            sigmoidValue = uint256(int256(PRECISION / 2) + (sx * int256(PRECISION)) / 10000);
        }

        // Scale to price range: minPrice + (maxPrice - minPrice) * sigmoid
        uint256 priceRange = maxPrice - minPrice;
        price = minPrice + (priceRange * sigmoidValue) / PRECISION;

        return price;
    }

    /**
     * @notice Decode curve parameters
     * @dev Bit packing: [minPrice:64][maxPrice:64][steepness:32][inflection:96]
     * @param curveParams Packed parameters
     * @return minPrice Minimum price per share (in wei)
     * @return maxPrice Maximum price per share (in wei)
     * @return steepness Steepness factor (0-100)
     * @return inflection Inflection point in shares (in wei)
     */
    function _decodeParams(uint256 curveParams)
        internal
        pure
        returns (uint256 minPrice, uint256 maxPrice, uint256 steepness, uint256 inflection)
    {
        // Extract inflection (last 96 bits)
        inflection = curveParams & ((1 << 96) - 1);
        curveParams = curveParams >> 96;

        // Extract steepness (next 32 bits)
        steepness = curveParams & ((1 << 32) - 1);
        curveParams = curveParams >> 32;

        // Extract maxPrice (next 64 bits)
        maxPrice = curveParams & ((1 << 64) - 1);
        curveParams = curveParams >> 64;

        // Extract minPrice (first 64 bits)
        minPrice = curveParams & ((1 << 64) - 1);

        return (minPrice, maxPrice, steepness, inflection);
    }

    /**
     * @notice Encode curve parameters
     * @dev Helper function for market creators
     * @param minPrice Minimum price per share (in wei)
     * @param maxPrice Maximum price per share (in wei)
     * @param steepness Steepness factor (0-100)
     * @param inflection Inflection point in shares (in wei)
     * @return curveParams Packed parameters
     */
    function encodeParams(uint256 minPrice, uint256 maxPrice, uint256 steepness, uint256 inflection)
        external
        pure
        returns (uint256 curveParams)
    {
        // Ensure values fit in their bit ranges
        require(minPrice < (1 << 64), "Min price too large");
        require(maxPrice < (1 << 64), "Max price too large");
        require(steepness < (1 << 32), "Steepness too large");
        require(inflection < (1 << 96), "Inflection too large");
        require(maxPrice > minPrice, "Max price must be > min price");
        require(steepness <= MAX_STEEPNESS, "Steepness exceeds maximum");

        // Pack: [minPrice:64][maxPrice:64][steepness:32][inflection:96]
        curveParams = (minPrice << 192) | (maxPrice << 128) | (steepness << 96) | inflection;

        return curveParams;
    }
}
