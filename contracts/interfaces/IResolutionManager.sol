// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IResolutionManager
 * @notice Interface for the ResolutionManager contract
 */
interface IResolutionManager {
    /**
     * @notice Check if an address is an authorized resolver
     * @param resolver Address to check
     * @return True if authorized
     */
    function isResolver(address resolver) external view returns (bool);

    /**
     * @notice Resolve a market with an outcome
     * @param marketAddress Address of the market to resolve
     * @param outcome Outcome of the market (1, 2, or 3 for cancelled)
     * @param resolutionData Additional resolution data
     */
    function resolveMarket(
        address marketAddress,
        uint8 outcome,
        bytes calldata resolutionData
    ) external;

    /**
     * @notice Override a market resolution (admin only)
     * @param marketAddress Address of the market
     * @param newOutcome New outcome to set
     * @param reason Reason for override
     */
    function overrideResolution(
        address marketAddress,
        uint8 newOutcome,
        string calldata reason
    ) external;

    /**
     * @notice Create a dispute for a market resolution
     * @param marketAddress Address of the market
     * @param disputeReason Reason for the dispute
     */
    function disputeResolution(
        address marketAddress,
        string calldata disputeReason
    ) external payable;
}