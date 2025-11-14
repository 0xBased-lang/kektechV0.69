// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IFlexibleMarketFactory.sol";

/**
 * @title MarketValidation
 * @notice Library for validating market configuration and parameters
 * @dev Extracted from FlexibleMarketFactory to reduce contract size
 *
 * DAY 8 REFACTORING:
 * - Extracted validation logic from FlexibleMarketFactory
 * - Reduces main contract size by ~2.5 KB
 * - Contains all validation functions
 *
 * Gas Impact: +700 gas per call (negligible for validation)
 */
library MarketValidation {
    // ============= Custom Errors =============

    error InvalidQuestion();
    error InvalidResolutionTime();
    error InvalidCategory();
    error InvalidBondAmount();
    error InsufficientBond();

    // ============= Constants =============

    /// @notice Maximum resolution period: 1 year in seconds
    uint256 private constant MAX_RESOLUTION_PERIOD = 31536000;

    /// @notice Minimum question length
    uint256 private constant MIN_QUESTION_LENGTH = 10;

    /// @notice Maximum question length
    uint256 private constant MAX_QUESTION_LENGTH = 500;

    // ============= Core Validation Functions =============

    /**
     * @notice Validate complete market configuration
     * @param config Market configuration to validate
     * @param minCreatorBond Minimum required bond amount
     * @dev Extracted from FlexibleMarketFactory lines 752-765
     * @dev Performs all necessary validation checks in one call
     */
    function validateMarketConfig(
        IFlexibleMarketFactory.MarketConfig memory config,
        uint256 minCreatorBond
    )
        public
        view
    {
        validateQuestion(config.question);
        validateResolutionTime(config.resolutionTime);
        validateCategory(config.category);
        validateBondAmount(config.creatorBond, minCreatorBond);
    }

    /**
     * @notice Validate market question
     * @param question Question string to validate
     * @dev Checks for non-empty string with reasonable length
     */
    function validateQuestion(string memory question)
        public
        pure
    {
        bytes memory questionBytes = bytes(question);

        if (questionBytes.length == 0) {
            revert InvalidQuestion();
        }

        if (questionBytes.length < MIN_QUESTION_LENGTH) {
            revert InvalidQuestion();
        }

        if (questionBytes.length > MAX_QUESTION_LENGTH) {
            revert InvalidQuestion();
        }
    }

    /**
     * @notice Validate resolution timestamp
     * @param resolutionTime Future timestamp for market resolution
     * @dev MEDIUM FIX: Prevents markets with extremely far future resolution times
     * @dev Maximum 1 year in the future to prevent locked capital
     */
    function validateResolutionTime(uint256 resolutionTime)
        public
        view
    {
        // Must be in the future
        if (resolutionTime <= block.timestamp) {
            revert InvalidResolutionTime();
        }

        // Maximum 1 year in the future (security fix)
        if (resolutionTime > block.timestamp + MAX_RESOLUTION_PERIOD) {
            revert InvalidResolutionTime();
        }
    }

    /**
     * @notice Validate market category
     * @param category Category identifier
     * @dev Ensures category is not empty
     */
    function validateCategory(bytes32 category)
        public
        pure
    {
        if (category == bytes32(0)) {
            revert InvalidCategory();
        }
    }

    /**
     * @notice Validate bond amount meets minimum requirement
     * @param bondAmount Provided bond amount
     * @param minBond Minimum required bond
     * @dev Validates bond is sufficient for market creation
     */
    function validateBondAmount(uint256 bondAmount, uint256 minBond)
        public
        pure
    {
        if (bondAmount < minBond) {
            revert InvalidBondAmount();
        }
    }

    /**
     * @notice Validate provided ETH value meets bond requirement
     * @param providedValue msg.value from transaction
     * @param requiredBond Required bond amount
     * @param minBond Minimum bond threshold
     * @dev Used in payable functions to validate ETH sent
     */
    function validateProvidedBond(
        uint256 providedValue,
        uint256 requiredBond,
        uint256 minBond
    )
        public
        pure
    {
        if (providedValue < requiredBond || providedValue < minBond) {
            revert InsufficientBond();
        }
    }

    /**
     * @notice Validate template-based market creation parameters
     * @param question Market question
     * @param resolutionTime Resolution timestamp
     * @param providedValue ETH value sent
     * @param minBond Minimum bond requirement
     * @dev Streamlined validation for template creation
     */
    function validateTemplateCreation(
        string calldata question,
        uint256 resolutionTime,
        uint256 providedValue,
        uint256 minBond
    )
        public
        view
    {
        validateQuestion(question);
        validateResolutionTime(resolutionTime);
        validateProvidedBond(providedValue, minBond, minBond);
    }

    // ============= Helper Functions =============

    /**
     * @notice Check if resolution time is within valid range
     * @param resolutionTime Time to check
     * @return isValid True if within range
     * @dev View function for external validation checks
     */
    function isValidResolutionTime(uint256 resolutionTime)
        public
        view
        returns (bool isValid)
    {
        return resolutionTime > block.timestamp &&
               resolutionTime <= block.timestamp + MAX_RESOLUTION_PERIOD;
    }

    /**
     * @notice Get maximum allowed resolution time
     * @return maxTime Latest possible resolution time
     * @dev Helper for UI/frontend validation
     */
    function getMaxResolutionTime()
        public
        view
        returns (uint256 maxTime)
    {
        return block.timestamp + MAX_RESOLUTION_PERIOD;
    }

    /**
     * @notice Get validation constants
     * @return minQuestionLen Minimum question length
     * @return maxQuestionLen Maximum question length
     * @return maxPeriod Maximum resolution period
     * @dev Helper for frontend/UI parameter display
     */
    function getValidationConstants()
        public
        pure
        returns (
            uint256 minQuestionLen,
            uint256 maxQuestionLen,
            uint256 maxPeriod
        )
    {
        return (MIN_QUESTION_LENGTH, MAX_QUESTION_LENGTH, MAX_RESOLUTION_PERIOD);
    }
}
