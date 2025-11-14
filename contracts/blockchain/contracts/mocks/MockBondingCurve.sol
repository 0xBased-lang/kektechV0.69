// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../interfaces/IBondingCurve.sol";

/**
 * @title MockBondingCurve
 * @notice Mock bonding curve for testing CurveRegistry and FlexibleMarketFactory
 * @dev Implements simple linear pricing for predictable test behavior
 *
 * Pricing Formula:
 * - Price = (shares / total) * 10000 (in basis points)
 * - Cost = shares * basePrice
 * - Refund = shares * basePrice * 0.9 (10% spread)
 *
 * @custom:security-contact security@kektech.com
 */
contract MockBondingCurve is IBondingCurve {
    string private _name;

    /**
     * @notice Initialize mock curve with name
     * @param name Curve type name
     */
    constructor(string memory name) {
        _name = name;
    }

    /**
     * @inheritdoc IBondingCurve
     */
    function calculateCost(
        uint256 curveParams,
        uint256 currentYes,
        uint256 currentNo,
        bool outcome,
        uint256 shares
    ) external pure override returns (uint256 cost) {
        // Simple linear cost: shares * basePrice
        // curveParams is interpreted as basePrice (e.g., 1 ether = 1 ETH per share)

        if (curveParams == 0) return 0;
        if (shares == 0) return 0;

        // Calculate cost with simple multiplication
        // In real curves, this would be more complex (LMSR, exponential, etc.)
        cost = (shares * curveParams) / 1 ether;

        // Ensure minimum cost of 1 wei to avoid zero cost for small shares
        if (cost == 0 && shares > 0) {
            cost = 1;
        }

        return cost;
    }

    /**
     * @inheritdoc IBondingCurve
     */
    function calculateRefund(
        uint256 curveParams,
        uint256 currentYes,
        uint256 currentNo,
        bool outcome,
        uint256 shares
    ) external pure override returns (uint256 refund) {
        // Simple refund: 90% of cost (10% spread)
        if (curveParams == 0) return 0;
        if (shares == 0) return 0;

        uint256 cost = (shares * curveParams) / 1 ether;
        refund = (cost * 90) / 100;

        return refund;
    }

    /**
     * @inheritdoc IBondingCurve
     */
    function getPrices(
        uint256 curveParams,
        uint256 currentYes,
        uint256 currentNo
    ) external pure override returns (uint256 yesPrice, uint256 noPrice) {
        // Handle equilibrium case (both zero)
        if (currentYes == 0 && currentNo == 0) {
            return (5000, 5000); // 50/50 split
        }

        // Calculate total shares
        uint256 total = currentYes + currentNo;

        // Calculate prices as percentage of total supply
        yesPrice = (currentYes * 10000) / total;
        noPrice = (currentNo * 10000) / total;

        // Ensure prices sum to 10000 (handle rounding)
        if (yesPrice + noPrice != 10000) {
            // Adjust NO price to ensure exact sum
            noPrice = 10000 - yesPrice;
        }

        return (yesPrice, noPrice);
    }

    /**
     * @inheritdoc IBondingCurve
     */
    function curveName() external view override returns (string memory) {
        return _name;
    }

    /**
     * @inheritdoc IBondingCurve
     */
    function validateParams(uint256 curveParams)
        external
        pure
        override
        returns (bool valid, string memory reason)
    {
        // For mock curve, any non-zero params are valid
        if (curveParams == 0) {
            return (false, "Curve params must be > 0");
        }

        return (true, "");
    }
}
