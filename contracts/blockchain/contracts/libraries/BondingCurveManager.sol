// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../core/CurveRegistry.sol";
import "../interfaces/IVersionedRegistry.sol";
import "../interfaces/IFlexibleMarketFactory.sol";

/**
 * @title BondingCurveManager
 * @notice Library for managing bonding curve configuration and validation
 * @dev Extracted from FlexibleMarketFactory to reduce contract size
 *
 * DAY 8 REFACTORING:
 * - Extracted ~180 lines from FlexibleMarketFactory
 * - Reduces main contract size by ~4.5 KB
 * - Contains all curve-related logic
 *
 * Gas Impact: +700 gas per library call (negligible)
 */
library BondingCurveManager {
    // ============= Custom Errors =============

    error InvalidCurveType();
    error InvalidCurveParams();
    error CurveNotActive();

    // ============= Core Functions =============

    /**
     * @notice Get CurveRegistry from MasterRegistry
     * @param registry Master registry address
     * @return CurveRegistry instance
     * @dev Extracted from FlexibleMarketFactory lines 784-788
     */
    function getCurveRegistry(address registry)
        public
        view
        returns (CurveRegistry)
    {
        IVersionedRegistry reg = IVersionedRegistry(registry);
        address curveRegistry = reg.getContract(keccak256("CurveRegistry"));
        return CurveRegistry(curveRegistry);
    }

    /**
     * @notice Get default LMSR curve configuration
     * @param registry Master registry address
     * @return curveAddress Address of default LMSR curve
     * @return defaultParams Default b parameter (100 BASED)
     * @dev Used by market creation functions
     */
    function getDefaultLMSRCurve(address registry)
        public
        view
        returns (address curveAddress, uint256 defaultParams)
    {
        CurveRegistry curveRegistry = getCurveRegistry(registry);
        curveAddress = curveRegistry.getCurveByName("LMSRCurve");
        defaultParams = 100 * 1e18;  // Default b = 100 BASED for LMSR
        return (curveAddress, defaultParams);
    }

    /**
     * @notice Validate curve configuration
     * @param registry Master registry address
     * @param curveType Type of bonding curve
     * @param curveParams Packed curve parameters
     * @return curveAddress Address of the validated curve contract
     * @dev Extracted from FlexibleMarketFactory lines 798-839
     * @dev Validates curve exists in registry and is active
     */
    function validateCurveConfig(
        address registry,
        IFlexibleMarketFactory.CurveType curveType,
        uint256 curveParams
    )
        public
        view
        returns (address curveAddress)
    {
        // Get CurveRegistry
        CurveRegistry curveRegistry = getCurveRegistry(registry);

        // Map enum to curve name string
        string memory curveName = getCurveName(curveType);

        // Get curve address by name
        curveAddress = curveRegistry.getCurveByName(curveName);

        // Verify curve exists
        if (curveAddress == address(0)) {
            revert InvalidCurveType();
        }

        // Verify curve is active
        (bool isRegistered, bool isActive) = curveRegistry.isCurveActive(curveAddress);
        if (!isRegistered || !isActive) {
            revert CurveNotActive();
        }

        // Validate parameters are non-zero
        // Phase 3 TODO: Add curve-specific parameter validation via IBondingCurve
        if (curveParams == 0) {
            revert InvalidCurveParams();
        }

        return curveAddress;
    }

    /**
     * @notice Map curve type enum to curve name string
     * @param curveType Type of bonding curve
     * @return curveName String identifier for curve registry lookup
     * @dev Helper function for curve registry interaction
     */
    function getCurveName(IFlexibleMarketFactory.CurveType curveType)
        public
        pure
        returns (string memory curveName)
    {
        if (curveType == IFlexibleMarketFactory.CurveType.LMSR) {
            return "LMSRCurve";
        } else if (curveType == IFlexibleMarketFactory.CurveType.LINEAR) {
            return "LinearCurve";
        } else if (curveType == IFlexibleMarketFactory.CurveType.EXPONENTIAL) {
            return "ExponentialCurve";
        } else if (curveType == IFlexibleMarketFactory.CurveType.SIGMOID) {
            return "SigmoidCurve";
        } else {
            revert InvalidCurveType();
        }
    }

    /**
     * @notice Validate curve type is supported
     * @param curveType Type to validate
     * @return True if valid
     * @dev Simple validation for enum bounds
     */
    function isValidCurveType(IFlexibleMarketFactory.CurveType curveType)
        public
        pure
        returns (bool)
    {
        return uint8(curveType) <= 3;  // LMSR=0, LINEAR=1, EXPONENTIAL=2, SIGMOID=3
    }
}
