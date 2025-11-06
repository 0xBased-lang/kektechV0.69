// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IRewardDistributor
 * @notice Interface for fee distribution in KEKTECH 3.0
 */
interface IRewardDistributor {
    /**
     * @notice Distribute fees to platform, staking, and other recipients
     * @dev Called by markets to distribute trading fees
     */
    function distributeFees() external payable;

    /**
     * @notice Set fee distribution percentages
     * @param platformBps Platform fee in basis points
     * @param stakingBps Staking pool fee in basis points
     * @param burnBps Burn percentage in basis points
     */
    function setFeeDistribution(
        uint256 platformBps,
        uint256 stakingBps,
        uint256 burnBps
    ) external;

    /**
     * @notice Get current fee distribution settings
     */
    function getFeeDistribution() external view returns (
        uint256 platformBps,
        uint256 stakingBps,
        uint256 burnBps
    );

    /**
     * @notice Claim accumulated platform fees (admin only)
     */
    function claimPlatformFees() external;

    /**
     * @notice Get accumulated fees for an address
     */
    function getAccumulatedFees(address recipient) external view returns (uint256);
}