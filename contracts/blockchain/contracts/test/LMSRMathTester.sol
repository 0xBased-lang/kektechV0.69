// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../libraries/LMSRMath.sol";

/**
 * @title LMSRMathTester
 * @notice Test helper contract to expose LMSRMath library functions for testing
 * @dev This contract is only used for testing and should not be deployed to production
 */
contract LMSRMathTester {
    using LMSRMath for uint256;

    // Expose custom errors for testing
    error InvalidLiquidityParameter();
    error InvalidShareAmount();
    error MathOverflow();
    error MathUnderflow();

    /**
     * @notice Test wrapper for cost function
     */
    function cost(
        uint256 b,
        uint256 qYes,
        uint256 qNo
    ) external pure returns (uint256) {
        return LMSRMath.cost(b, qYes, qNo);
    }

    /**
     * @notice Test wrapper for priceYes function
     */
    function priceYes(
        uint256 b,
        uint256 qYes,
        uint256 qNo
    ) external pure returns (uint256) {
        return LMSRMath.priceYes(b, qYes, qNo);
    }

    /**
     * @notice Test wrapper for priceNo function
     */
    function priceNo(
        uint256 b,
        uint256 qYes,
        uint256 qNo
    ) external pure returns (uint256) {
        return LMSRMath.priceNo(b, qYes, qNo);
    }

    /**
     * @notice Test wrapper for getPrices function
     */
    function getPrices(
        uint256 b,
        uint256 qYes,
        uint256 qNo
    ) external pure returns (uint256 yesPrice, uint256 noPrice) {
        return LMSRMath.getPrices(b, qYes, qNo);
    }

    /**
     * @notice Test wrapper for calculateBuyCost function
     */
    function calculateBuyCost(
        uint256 b,
        uint256 qYes,
        uint256 qNo,
        bool outcome,
        uint256 shares
    ) external pure returns (uint256) {
        return LMSRMath.calculateBuyCost(b, qYes, qNo, outcome, shares);
    }

    /**
     * @notice Test wrapper for calculateSellRefund function
     */
    function calculateSellRefund(
        uint256 b,
        uint256 qYes,
        uint256 qNo,
        bool outcome,
        uint256 shares
    ) external pure returns (uint256) {
        return LMSRMath.calculateSellRefund(b, qYes, qNo, outcome, shares);
    }

    /**
     * @notice Test wrapper for calculateSharesForCost function
     */
    function calculateSharesForCost(
        uint256 b,
        uint256 qYes,
        uint256 qNo,
        bool outcome,
        uint256 maxCost
    ) external pure returns (uint256) {
        return LMSRMath.calculateSharesForCost(b, qYes, qNo, outcome, maxCost);
    }
}
