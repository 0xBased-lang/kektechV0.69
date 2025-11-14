// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../interfaces/IBondingCurve.sol";

/**
 * @title ExponentialCurve
 * @notice Exponential bonding curve with rapid price growth
 * @dev Price increases exponentially with supply - suitable for high-confidence markets
 *
 * Pricing Formula:
 * - Price at quantity q = basePrice * (1 + growthRate)^(q / scale)
 * - growthRate determines how fast price increases
 * - scale controls the granularity of price changes
 *
 * Parameters (packed in curveParams):
 * - basePrice (80 bits): Starting price per share (in wei)
 * - growthRate (80 bits): Growth rate in basis points (e.g., 1000 = 10% growth)
 * - scale (96 bits): Number of shares per growth period (in wei)
 *
 * Example:
 * - basePrice = 0.001 ETH
 * - growthRate = 1000 (10%)
 * - scale = 10 shares
 * - Share 0-9: ~0.001 ETH each
 * - Share 10-19: ~0.0011 ETH each (10% more)
 * - Share 20-29: ~0.00121 ETH each (21% more than base)
 *
 * Safety:
 * - Max growthRate: 50000 (500%) to prevent extreme overflow
 * - Scale must be > 0 to prevent division by zero
 * - Uses incremental calculation to prevent overflow
 *
 * @custom:security-contact security@kektech.com
 */
contract ExponentialCurve is IBondingCurve {
    /*//////////////////////////////////////////////////////////////
                                CONSTANTS
    //////////////////////////////////////////////////////////////*/

    uint256 private constant BASIS_POINTS = 10000;
    uint256 private constant MAX_GROWTH_RATE = 50000; // 500% max growth

    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/

    error InvalidParameters();
    error InvalidShares();
    error GrowthRateTooHigh();

    /*//////////////////////////////////////////////////////////////
                          CORE CURVE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @inheritdoc IBondingCurve
     * @dev Calculates cost using iterative approximation to avoid overflow
     *
     * Formula: Sum of prices from currentSupply to currentSupply+shares
     * Where price(q) = basePrice * (1 + growthRate/10000)^(q/scale)
     *
     * We calculate this incrementally in chunks to prevent overflow
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
        (uint256 basePrice, uint256 growthRate, uint256 scale) = _decodeParams(curveParams);

        if (basePrice == 0) revert InvalidParameters();
        if (scale == 0) revert InvalidParameters();
        if (growthRate > MAX_GROWTH_RATE) revert GrowthRateTooHigh();

        // Get current supply for the outcome being purchased
        uint256 currentSupply = outcome ? currentYes : currentNo;

        // Calculate cost incrementally to prevent overflow
        // We divide the purchase into segments and sum their costs
        uint256 segmentSize = scale; // Each segment is one growth period
        uint256 totalCost = 0;
        uint256 remainingShares = shares;
        uint256 currentPosition = currentSupply;

        while (remainingShares > 0) {
            // Calculate shares in this segment
            uint256 segmentShares = remainingShares > segmentSize ? segmentSize : remainingShares;

            // Calculate growth multiplier for current position
            // multiplier = (1 + growthRate/10000)^(position/scale)
            uint256 periods = currentPosition / scale;
            uint256 priceMultiplier = _calculateMultiplier(growthRate, periods);

            // Price for this segment
            uint256 segmentPrice = (basePrice * priceMultiplier) / BASIS_POINTS;
            uint256 segmentCost = (segmentPrice * segmentShares) / 1 ether;

            totalCost += segmentCost;
            remainingShares -= segmentShares;
            currentPosition += segmentShares;
        }

        return totalCost;
    }

    /**
     * @inheritdoc IBondingCurve
     * @dev Calculates refund using same approach as cost but in reverse with spread
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
        (uint256 basePrice, uint256 growthRate, uint256 scale) = _decodeParams(curveParams);

        if (basePrice == 0) revert InvalidParameters();
        if (scale == 0) revert InvalidParameters();
        if (growthRate > MAX_GROWTH_RATE) revert GrowthRateTooHigh();

        // Get current supply for the outcome being sold
        uint256 currentSupply = outcome ? currentYes : currentNo;

        // Ensure we're not selling more than exists
        if (shares > currentSupply) revert InvalidShares();

        // Calculate refund incrementally (reverse direction)
        uint256 segmentSize = scale;
        uint256 totalRefund = 0;
        uint256 remainingShares = shares;
        uint256 currentPosition = currentSupply;

        while (remainingShares > 0) {
            // Calculate shares in this segment
            uint256 segmentShares = remainingShares > segmentSize ? segmentSize : remainingShares;

            // Calculate growth multiplier for current position (before selling)
            uint256 periods = (currentPosition > 0) ? ((currentPosition - 1) / scale) : 0;
            uint256 priceMultiplier = _calculateMultiplier(growthRate, periods);

            // Price for this segment
            uint256 segmentPrice = (basePrice * priceMultiplier) / BASIS_POINTS;
            uint256 segmentRefund = (segmentPrice * segmentShares) / 1 ether;

            totalRefund += segmentRefund;
            remainingShares -= segmentShares;
            currentPosition -= segmentShares;
        }

        // Apply 2% spread for exponential curve (higher than linear due to volatility)
        refund = (totalRefund * 98) / 100;

        return refund;
    }

    /**
     * @inheritdoc IBondingCurve
     * @dev Calculates instantaneous prices based on current supply ratio
     *
     * Price reflects market sentiment, not exponential curve parameters
     * Exponential growth affects cost, but market price is still supply-driven
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
        return "Exponential";
    }

    /**
     * @inheritdoc IBondingCurve
     * @dev Exponential curve requires:
     * - basePrice > 0
     * - growthRate <= MAX_GROWTH_RATE (50000 = 500%)
     * - scale > 0
     */
    function validateParams(uint256 curveParams)
        external
        pure
        override
        returns (bool valid, string memory reason)
    {
        (uint256 basePrice, uint256 growthRate, uint256 scale) = _decodeParams(curveParams);

        if (basePrice == 0) {
            return (false, "Base price must be > 0");
        }

        if (growthRate == 0) {
            return (false, "Growth rate must be > 0 (use LinearCurve for constant price)");
        }

        if (growthRate > MAX_GROWTH_RATE) {
            return (false, "Growth rate too high (max 500%)");
        }

        if (scale == 0) {
            return (false, "Scale must be > 0");
        }

        return (true, "");
    }

    /*//////////////////////////////////////////////////////////////
                        INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Calculate (1 + growthRate/10000)^periods using iterative multiplication
     * @dev Uses safe incremental calculation to prevent overflow
     * @param growthRate Growth rate in basis points
     * @param periods Number of compounding periods
     * @return multiplier Result in basis points (10000 = 1.0x)
     */
    function _calculateMultiplier(uint256 growthRate, uint256 periods)
        internal
        pure
        returns (uint256 multiplier)
    {
        if (periods == 0) {
            return BASIS_POINTS; // 1.0x
        }

        // Start with 1.0x
        multiplier = BASIS_POINTS;

        // Calculate (1 + rate)^periods iteratively
        // multiplier *= (BASIS_POINTS + growthRate) / BASIS_POINTS
        for (uint256 i = 0; i < periods; i++) {
            multiplier = (multiplier * (BASIS_POINTS + growthRate)) / BASIS_POINTS;

            // Prevent extreme growth (safety check)
            if (multiplier > BASIS_POINTS * 1000) {
                return BASIS_POINTS * 1000; // Cap at 1000x
            }
        }

        return multiplier;
    }

    /**
     * @notice Decode curve parameters into basePrice, growthRate, and scale
     * @dev Bit packing: [basePrice:80][growthRate:80][scale:96]
     * @param curveParams Packed parameters
     * @return basePrice Starting price per share (in wei)
     * @return growthRate Growth rate in basis points (e.g., 1000 = 10%)
     * @return scale Shares per growth period (in wei)
     */
    function _decodeParams(uint256 curveParams)
        internal
        pure
        returns (uint256 basePrice, uint256 growthRate, uint256 scale)
    {
        // Extract scale (last 96 bits)
        scale = curveParams & ((1 << 96) - 1);
        curveParams = curveParams >> 96;

        // Extract growthRate (next 80 bits)
        growthRate = curveParams & ((1 << 80) - 1);
        curveParams = curveParams >> 80;

        // Extract basePrice (first 80 bits)
        basePrice = curveParams & ((1 << 80) - 1);

        return (basePrice, growthRate, scale);
    }

    /**
     * @notice Encode basePrice, growthRate, and scale into curve parameters
     * @dev Helper function for market creators
     * @param basePrice Starting price per share (in wei)
     * @param growthRate Growth rate in basis points (e.g., 1000 = 10%)
     * @param scale Shares per growth period (in wei)
     * @return curveParams Packed parameters
     */
    function encodeParams(uint256 basePrice, uint256 growthRate, uint256 scale)
        external
        pure
        returns (uint256 curveParams)
    {
        // Ensure values fit in their bit ranges
        require(basePrice < (1 << 80), "Base price too large");
        require(growthRate < (1 << 80), "Growth rate too large");
        require(scale < (1 << 96), "Scale too large");
        require(growthRate <= MAX_GROWTH_RATE, "Growth rate exceeds maximum");

        // Pack: [basePrice:80][growthRate:80][scale:96]
        curveParams = (basePrice << 176) | (growthRate << 96) | scale;

        return curveParams;
    }
}
