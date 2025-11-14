// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../interfaces/IBondingCurve.sol";

/**
 * @title LinearCurve
 * @notice Simple linear bonding curve implementation
 * @dev Price increases linearly with supply - easiest to understand and predict
 *
 * Pricing Formula:
 * - Price = basePrice + (supply * slope)
 * - Cost = integral of price function over share range
 * - For constant basePrice with 0 slope: cost = shares * basePrice
 *
 * Parameters:
 * - curveParams encodes: basePrice (first 128 bits) + slope (last 128 bits)
 * - basePrice: Starting price per share (in wei)
 * - slope: Price increase per share (in wei)
 *
 * Example:
 * - basePrice = 0.001 ETH, slope = 0
 * - Buying 10 shares costs: 10 * 0.001 = 0.01 ETH
 * - Price stays constant at 0.001 ETH per share
 *
 * Example with slope:
 * - basePrice = 0.001 ETH, slope = 0.0001 ETH
 * - Share 1 costs: 0.001 ETH
 * - Share 10 costs: 0.001 + (10 * 0.0001) = 0.002 ETH
 * - Total for 10 shares: 0.015 ETH (average price)
 *
 * @custom:security-contact security@kektech.com
 */
contract LinearCurve is IBondingCurve {
    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/

    error InvalidParameters();
    error InvalidShares();

    /*//////////////////////////////////////////////////////////////
                          CORE CURVE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @inheritdoc IBondingCurve
     * @dev Calculates cost using trapezoidal rule for linear curve
     *
     * Formula: cost = shares * (startPrice + endPrice) / 2
     * Where:
     * - startPrice = basePrice + currentSupply * slope
     * - endPrice = basePrice + (currentSupply + shares) * slope
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
        (uint256 basePrice, uint256 slope) = _decodeParams(curveParams);
        if (basePrice == 0) revert InvalidParameters();

        // Get current supply for the outcome being purchased
        uint256 currentSupply = outcome ? currentYes : currentNo;

        // Calculate prices at start and end of purchase
        uint256 startPrice = basePrice + (currentSupply * slope) / 1 ether;
        uint256 endPrice = basePrice + ((currentSupply + shares) * slope) / 1 ether;

        // Trapezoidal rule: average price * shares
        cost = (shares * (startPrice + endPrice)) / (2 ether);

        return cost;
    }

    /**
     * @inheritdoc IBondingCurve
     * @dev Calculates refund using same trapezoidal rule but in reverse
     *
     * Refund is typically slightly less than cost to prevent arbitrage
     * Here we use 99% of cost calculation to account for market spread
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
        (uint256 basePrice, uint256 slope) = _decodeParams(curveParams);
        if (basePrice == 0) revert InvalidParameters();

        // Get current supply for the outcome being sold
        uint256 currentSupply = outcome ? currentYes : currentNo;

        // Ensure we're not selling more than exists
        if (shares > currentSupply) revert InvalidShares();

        // Calculate prices at start and end of sale (reverse order)
        uint256 startPrice = basePrice + (currentSupply * slope) / 1 ether;
        uint256 endPrice = basePrice + ((currentSupply - shares) * slope) / 1 ether;

        // Trapezoidal rule: average price * shares
        refund = (shares * (startPrice + endPrice)) / (2 ether);

        // Apply 1% spread to prevent arbitrage (99% refund)
        refund = (refund * 99) / 100;

        return refund;
    }

    /**
     * @inheritdoc IBondingCurve
     * @dev Calculates instantaneous prices based on current supply
     *
     * Price(YES) = totalYes / (totalYes + totalNo)
     * Price(NO) = totalNo / (totalYes + totalNo)
     *
     * For linear curve, we use simple supply ratio in basis points
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
        return "Linear";
    }

    /**
     * @inheritdoc IBondingCurve
     * @dev Linear curve requires basePrice > 0, slope >= 0
     */
    function validateParams(uint256 curveParams)
        external
        pure
        override
        returns (bool valid, string memory reason)
    {
        (uint256 basePrice, uint256 slope) = _decodeParams(curveParams);

        if (basePrice == 0) {
            return (false, "Base price must be > 0");
        }

        // Slope can be 0 (constant price) or positive (increasing price)
        // We don't restrict maximum slope to allow flexibility

        return (true, "");
    }

    /*//////////////////////////////////////////////////////////////
                        INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Decode curve parameters into basePrice and slope
     * @dev Uses bit packing: first 128 bits = basePrice, last 128 bits = slope
     * @param curveParams Packed parameters
     * @return basePrice Starting price per share (in wei)
     * @return slope Price increase per share (in wei)
     */
    function _decodeParams(uint256 curveParams)
        internal
        pure
        returns (uint256 basePrice, uint256 slope)
    {
        // Extract first 128 bits for basePrice
        basePrice = curveParams >> 128;

        // Extract last 128 bits for slope
        slope = curveParams & ((1 << 128) - 1);

        return (basePrice, slope);
    }

    /**
     * @notice Encode basePrice and slope into curve parameters
     * @dev Helper function for market creators
     * @param basePrice Starting price per share (in wei)
     * @param slope Price increase per share (in wei)
     * @return curveParams Packed parameters
     */
    function encodeParams(uint256 basePrice, uint256 slope)
        external
        pure
        returns (uint256 curveParams)
    {
        // Ensure values fit in 128 bits
        require(basePrice < (1 << 128), "Base price too large");
        require(slope < (1 << 128), "Slope too large");

        // Pack: basePrice in first 128 bits, slope in last 128 bits
        curveParams = (basePrice << 128) | slope;

        return curveParams;
    }
}
