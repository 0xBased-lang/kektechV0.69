// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "../interfaces/IPredictionMarket.sol";

/**
 * @title TemplateMarketLogic
 * @notice Internal library for template-based market creation logic
 * @dev Reduces FlexibleMarketFactory bytecode size by extracting template logic
 *
 * Phase 1: Internal Libraries
 * - Validates template parameters
 * - Creates markets from templates
 * - Applies template configurations
 *
 * @custom:security-contact security@kektech.com
 */
library TemplateMarketLogic {

    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/

    error InvalidTemplateAddress();
    error InvalidTemplateId(bytes32 templateId);
    error TemplateNotActive(bytes32 templateId);
    error InvalidTemplateParameters();
    error CloneFailed();

    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/

    // Note: Events should be emitted by calling contract, not library
    // event TemplateMarketValidated(bytes32 indexed templateId);
    // event TemplateMarketCreated(address indexed market, bytes32 indexed templateId);

    /*//////////////////////////////////////////////////////////////
                               STRUCTS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Template configuration data
     * @param templateAddress Address of template implementation
     * @param category Market category
     * @param outcome1 Predefined first outcome
     * @param outcome2 Predefined second outcome
     * @param defaultDuration Default market duration
     */
    struct TemplateConfig {
        address templateAddress;
        bytes32 category;
        string outcome1;
        string outcome2;
        uint256 defaultDuration;
    }

    /*//////////////////////////////////////////////////////////////
                            VALIDATION LOGIC
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Validate template parameters
     * @param templateAddress Address of template implementation
     * @param templateId Template identifier
     * @return isValid True if validation passes
     */
    function validateTemplateParams(
        address templateAddress,
        bytes32 templateId
    ) internal view returns (bool isValid) {

        // Validate template address
        if (templateAddress == address(0)) {
            revert InvalidTemplateAddress();
        }

        // Validate template ID
        if (templateId == bytes32(0)) {
            revert InvalidTemplateId(templateId);
        }

        // Check template contract exists
        uint256 size;
        assembly {
            size := extcodesize(templateAddress)
        }

        if (size == 0) {
            revert InvalidTemplateAddress();
        }

        // emit TemplateMarketValidated(templateId);

        return true;
    }

    /**
     * @notice Validate template configuration
     * @param config Template configuration struct
     * @return isValid True if configuration is valid
     */
    function validateTemplateConfig(
        TemplateConfig memory config
    ) internal pure returns (bool isValid) {

        // Validate template address
        if (config.templateAddress == address(0)) {
            revert InvalidTemplateAddress();
        }

        // Validate category
        if (config.category == bytes32(0)) {
            revert InvalidTemplateParameters();
        }

        // Validate outcomes are not empty
        if (bytes(config.outcome1).length == 0 || bytes(config.outcome2).length == 0) {
            revert InvalidTemplateParameters();
        }

        // Validate duration is reasonable (not zero)
        if (config.defaultDuration == 0) {
            revert InvalidTemplateParameters();
        }

        return true;
    }

    /*//////////////////////////////////////////////////////////////
                          MARKET CREATION LOGIC
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Create market from template
     * @param templateAddress Address of template to clone
     * @param templateId Template identifier
     * @param question Market question
     * @param creator Market creator address
     * @param endTime Market resolution time
     * @param outcome1 First outcome (from template or custom)
     * @param outcome2 Second outcome (from template or custom)
     * @return market Address of created market clone
     */
    function createTemplateMarket(
        address templateAddress,
        address registry,
        bytes32 templateId,
        string memory question,
        address creator,
        uint256 endTime,
        string memory outcome1,
        string memory outcome2
    ) internal returns (address market) {

        // Clone template using minimal proxy (EIP-1167)
        market = Clones.clone(templateAddress);

        if (market == address(0)) {
            revert CloneFailed();
        }

        // Initialize market with template configuration
        IPredictionMarket(market).initialize(
            registry,
            question,
            outcome1,
            outcome2,
            creator,
            endTime,
            address(0), // No bonding curve for template markets
            0 // No curve params
        );

        // emit TemplateMarketCreated(market, templateId);

        return market;
    }

    /**
     * @notice Create market from template with full configuration
     * @param config Template configuration
     * @param question Market question
     * @param creator Market creator address
     * @return market Address of created market
     */
    function createMarketWithConfig(
        TemplateConfig memory config,
        string memory question,
        address creator
    ) internal returns (address market) {

        // Validate configuration
        validateTemplateConfig(config);

        // Calculate end time from default duration
        uint256 endTime = block.timestamp + config.defaultDuration;

        // Clone and initialize
        market = Clones.clone(config.templateAddress);

        if (market == address(0)) {
            revert CloneFailed();
        }

        // Note: registry parameter needed - would be passed from factory
        // For now, using address(0) as placeholder
        IPredictionMarket(market).initialize(
            address(0), // registry (TODO: pass from factory)
            question,
            config.outcome1,
            config.outcome2,
            creator,
            endTime,
            address(0), // No bonding curve
            0 // No curve params
        );

        return market;
    }

    /*//////////////////////////////////////////////////////////////
                             HELPER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Get template details for display
     * @param templateAddress Address of template
     * @return name Template name
     * @return description Template description
     */
    function getTemplateDetails(
        address templateAddress
    ) internal view returns (
        string memory name,
        string memory description
    ) {

        // In production, this would query template registry
        // For now, return placeholder values

        name = "Standard Binary Market";
        description = "Yes/No prediction market template";

        return (name, description);
    }

    /**
     * @notice Check if template supports specific features
     * @param templateAddress Address of template to check
     * @return supportsCustomOutcomes Whether custom outcomes are supported
     * @return supportsBondingCurve Whether bonding curves are supported
     */
    function checkTemplateFeatures(
        address templateAddress
    ) internal view returns (
        bool supportsCustomOutcomes,
        bool supportsBondingCurve
    ) {

        // Check contract exists
        uint256 size;
        assembly {
            size := extcodesize(templateAddress)
        }

        if (size == 0) {
            return (false, false);
        }

        // In production, use ERC165 to check for specific interfaces
        // For now, assume all templates support basic features

        supportsCustomOutcomes = true;
        supportsBondingCurve = false; // Most templates won't support curves

        return (supportsCustomOutcomes, supportsBondingCurve);
    }

    /**
     * @notice Apply template defaults to market parameters
     * @param config Template configuration
     * @param customDuration Custom duration (0 to use template default)
     * @return finalDuration Final duration to use
     * @return category Market category
     */
    function applyTemplateDefaults(
        TemplateConfig memory config,
        uint256 customDuration
    ) internal pure returns (
        uint256 finalDuration,
        bytes32 category
    ) {

        // Use custom duration if provided, otherwise template default
        finalDuration = customDuration > 0 ? customDuration : config.defaultDuration;

        // Always use template category
        category = config.category;

        return (finalDuration, category);
    }
}
