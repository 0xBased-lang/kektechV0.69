// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ICurveRegistry
 * @notice Interface for bonding curve registry
 * @dev Manages curve type registration, validation, and lookup
 */
interface ICurveRegistry {
    /**
     * @notice Get curve address by name
     * @param name Curve name (e.g., "LMSR")
     * @return curveAddress Address of curve contract
     */
    function getCurveByName(string memory name) external view returns (address);

    /**
     * @notice Check if curve is registered and active
     * @param curveAddress Address to check
     * @return isRegistered True if curve is registered
     * @return isActive True if curve is active
     */
    function isCurveActive(address curveAddress)
        external
        view
        returns (bool isRegistered, bool isActive);

    /**
     * @notice Get all registered curve addresses
     * @return curves Array of curve addresses
     */
    function getAllCurves() external view returns (address[] memory);

    /**
     * @notice Get all active curve addresses
     * @return activeCurves Array of active curve addresses
     */
    function getActiveCurves() external view returns (address[] memory);
}
