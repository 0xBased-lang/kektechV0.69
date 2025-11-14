// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "../interfaces/IPredictionMarket.sol";
import "../interfaces/IBondingCurve.sol";

/**
 * @title CurveMarketLogic
 * @notice Internal library for bonding curve market creation logic
 * @dev Reduces FlexibleMarketFactory bytecode size by extracting curve logic
 *
 * Phase 1: Internal Libraries
 * - Validates curve parameters
 * - Creates markets with bonding curves
 * - Minimal proxy (EIP-1167) cloning for gas efficiency
 *
 * @custom:security-contact security@kektech.com
 */
library CurveMarketLogic {

    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/

    error InvalidCurveAddress();
    error InvalidCurveParameters();
    error CurveValidationFailed(string reason);
    error InvalidLiquidity(uint256 provided, uint256 minimum);
    error CloneFailed();

    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/

    // Note: Events should be emitted by calling contract, not library
    // event CurveMarketValidated(address indexed curve, uint256 initialLiquidity);
    // event CurveMarketCreated(address indexed market, address indexed curve);

    /*//////////////////////////////////////////////////////////////
                            VALIDATION LOGIC
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Validate bonding curve parameters
     * @param curveAddress Address of bonding curve implementation
     * @param initialLiquidity Initial liquidity to provide
     * @param minLiquidity Minimum liquidity requirement (from ParameterStorage)
     * @return isValid True if validation passes
     */
    function validateCurveParams(
        address curveAddress,
        uint256 initialLiquidity,
        uint256 minLiquidity
    ) internal view returns (bool isValid) {

        // Validate curve address
        if (curveAddress == address(0)) {
            revert InvalidCurveAddress();
        }

        // Check curve implements required interface
        // Note: In production, verify IBondingCurve interface support

        // Validate liquidity
        if (initialLiquidity < minLiquidity) {
            revert InvalidLiquidity(initialLiquidity, minLiquidity);
        }

        // emit CurveMarketValidated(curveAddress, initialLiquidity);

        return true;
    }

    /*//////////////////////////////////////////////////////////////
                          MARKET CREATION LOGIC
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Create market with bonding curve
     * @param marketTemplate Address of PredictionMarket template to clone
     * @param registry Address of MasterRegistry contract
     * @param curveAddress Address of bonding curve implementation
     * @param question Market question string
     * @param outcome1 First outcome description
     * @param outcome2 Second outcome description
     * @param creator Market creator address
     * @param endTime Market resolution time
     * @param curveParams Packed curve parameters
     * @return market Address of created market clone
     */
    function createCurveMarket(
        address marketTemplate,
        address registry,
        address curveAddress,
        string memory question,
        string memory outcome1,
        string memory outcome2,
        address creator,
        uint256 endTime,
        uint256 curveParams
    ) internal returns (address market) {

        // Clone market template using minimal proxy (EIP-1167)
        market = Clones.clone(marketTemplate);

        if (market == address(0)) {
            revert CloneFailed();
        }

        // Initialize market with curve configuration
        IPredictionMarket(market).initialize(
            registry,
            question,
            outcome1,
            outcome2,
            creator,
            endTime,
            curveAddress,
            curveParams
        );

        // Set bonding curve (if market supports it)
        // This would be handled in market initialization or separate setter

        // emit CurveMarketCreated(market, curveAddress);

        return market;
    }

    /*//////////////////////////////////////////////////////////////
                             HELPER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Calculate expected initial shares for liquidity
     * @param curveAddress Address of bonding curve
     * @param initialLiquidity Initial liquidity amount
     * @return shares Expected shares for each outcome
     */
    function calculateInitialShares(
        address curveAddress,
        uint256 initialLiquidity
    ) internal view returns (uint256 shares) {

        // Query curve for initial share calculation
        // This is curve-specific logic that would call the bonding curve

        // For now, return a simple calculation
        // Real implementation would call IBondingCurve.calculateCost()

        shares = initialLiquidity / 2; // Simplified: split equally between outcomes

        return shares;
    }

    /**
     * @notice Validate curve supports required functions
     * @param curveAddress Address of bonding curve to validate
     * @return isValid True if curve is valid
     */
    function validateCurveInterface(
        address curveAddress
    ) internal view returns (bool isValid) {

        // Check if contract exists
        uint256 size;
        assembly {
            size := extcodesize(curveAddress)
        }

        if (size == 0) {
            revert InvalidCurveAddress();
        }

        // In production, use ERC165 to check for IBondingCurve interface
        // For now, basic size check

        return true;
    }

    /**
     * @notice Get curve metadata (version, type, etc.)
     * @param curveAddress Address of bonding curve
     * @return curveType Type identifier for the curve
     * @return version Curve version string
     */
    function getCurveMetadata(
        address curveAddress
    ) internal view returns (
        string memory curveType,
        string memory version
    ) {

        // Query curve for metadata
        // Real implementation would call specific curve functions

        curveType = "LMSR"; // Default for now
        version = "1.0.0";

        return (curveType, version);
    }
}
