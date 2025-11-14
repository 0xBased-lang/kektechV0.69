// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IParameterStorage.sol";
import "../interfaces/IVersionedRegistry.sol";
import "../interfaces/IAccessControlManager.sol";

/**
 * @title ParameterStorage
 * @notice Centralized storage for all KEKTECH configurable parameters
 * @dev All values stored in BPS (basis points: 1 BPS = 0.01%)
 * @custom:security-contact security@kektech.io
 */
contract ParameterStorage is IParameterStorage {
    // ============= State Variables (Gas Optimized) =============

    // Registry reference
    IVersionedRegistry public immutable registry;

    // Experimental mode bypasses guardrails
    bool public experimentalMode;

    // Parameter storage
    mapping(bytes32 => uint256) private parameters;
    mapping(bytes32 => bool) private boolParameters;
    mapping(bytes32 => address) private addressParameters;

    // Guardrails (min/max bounds)
    struct Guardrail {
        uint256 min;
        uint256 max;
        bool exists;
    }
    mapping(bytes32 => Guardrail) private guardrails;

    // Enumeration
    bytes32[] private parameterKeys;
    mapping(bytes32 => uint256) private keyIndex; // 1-indexed

    // ============= Constructor =============

    constructor(address _registry) {
        require(_registry != address(0), "Invalid registry");
        registry = IVersionedRegistry(_registry);
    }

    // ============= Modifiers =============

    modifier onlyAuthorized() {
        // SECURITY FIX (M-2): Use AccessControlManager for role-based access control
        // This replaces the temporary registry.owner() check with proper role verification
        address acmAddress = registry.getContract(keccak256("AccessControlManager"));
        IAccessControlManager acm = IAccessControlManager(acmAddress);

        // Check if caller has ADMIN_ROLE
        if (!acm.hasRole(keccak256("ADMIN_ROLE"), msg.sender)) {
            revert NotAuthorized();
        }
        _;
    }

    modifier validateValue(bytes32 key, uint256 value) {
        if (!experimentalMode && guardrails[key].exists) {
            if (value < guardrails[key].min) {
                revert ValueBelowMinimum(value, guardrails[key].min);
            }
            if (value > guardrails[key].max) {
                revert ValueAboveMaximum(value, guardrails[key].max);
            }
        }
        _;
    }

    // ============= Core Parameter Functions =============

    /**
     * @notice Set a numeric parameter value
     * @param key Parameter identifier
     * @param value New value in BPS
     */
    function setParameter(bytes32 key, uint256 value)
        external
        onlyAuthorized
        validateValue(key, value)
    {
        uint256 oldValue = parameters[key];

        // Add to enumeration if new
        if (!parameterExists(key)) {
            parameterKeys.push(key);
            keyIndex[key] = parameterKeys.length;
        }

        parameters[key] = value;

        emit ParameterUpdated(key, value, oldValue, block.timestamp);
    }

    /**
     * @notice Get a numeric parameter value
     * @param key Parameter identifier
     * @return Parameter value
     */
    function getParameter(bytes32 key) external view returns (uint256) {
        if (!parameterExists(key)) revert ParameterNotFound(key);
        return parameters[key];
    }

    /**
     * @notice Check if parameter exists
     * @param key Parameter identifier
     * @return True if parameter is set
     */
    function parameterExists(bytes32 key) public view returns (bool) {
        return keyIndex[key] != 0;
    }

    // ============= Boolean Parameters =============

    /**
     * @notice Set a boolean parameter
     * @param key Parameter identifier
     * @param value New boolean value
     */
    function setBoolParameter(bytes32 key, bool value) external onlyAuthorized {
        bool oldValue = boolParameters[key];
        boolParameters[key] = value;

        emit BoolParameterUpdated(key, value, oldValue, block.timestamp);
    }

    /**
     * @notice Get a boolean parameter
     * @param key Parameter identifier
     * @return Boolean value
     */
    function getBoolParameter(bytes32 key) external view returns (bool) {
        return boolParameters[key];
    }

    // ============= Address Parameters =============

    /**
     * @notice Set an address parameter
     * @param key Parameter identifier
     * @param value New address value
     */
    function setAddressParameter(bytes32 key, address value) external onlyAuthorized {
        if (value == address(0)) revert InvalidValue();

        address oldValue = addressParameters[key];
        addressParameters[key] = value;

        emit AddressParameterUpdated(key, value, oldValue, block.timestamp);
    }

    /**
     * @notice Get an address parameter
     * @param key Parameter identifier
     * @return Address value
     */
    function getAddressParameter(bytes32 key) external view returns (address) {
        return addressParameters[key];
    }

    // ============= Guardrails =============

    /**
     * @notice Set guardrails (min/max bounds) for a parameter
     * @param key Parameter identifier
     * @param min Minimum allowed value
     * @param max Maximum allowed value
     */
    function setGuardrails(bytes32 key, uint256 min, uint256 max)
        external
        onlyAuthorized
    {
        require(min <= max, "Invalid guardrails");

        guardrails[key] = Guardrail({
            min: min,
            max: max,
            exists: true
        });

        emit GuardrailUpdated(key, min, max);
    }

    /**
     * @notice Get guardrails for a parameter
     * @param key Parameter identifier
     * @return min Minimum value
     * @return max Maximum value
     */
    function getGuardrails(bytes32 key) external view returns (uint256 min, uint256 max) {
        Guardrail memory g = guardrails[key];
        return (g.min, g.max);
    }

    /**
     * @notice Toggle experimental mode (bypasses guardrails)
     * @param enabled True to enable experimental mode
     */
    function setExperimentalMode(bool enabled) external onlyAuthorized {
        experimentalMode = enabled;
        emit ExperimentalModeToggled(enabled);
    }

    // ============= Batch Operations =============

    /**
     * @notice Set multiple parameters in one transaction
     * @param keys Array of parameter identifiers
     * @param values Array of parameter values
     */
    function batchSetParameters(
        bytes32[] calldata keys,
        uint256[] calldata values
    ) external onlyAuthorized {
        require(keys.length == values.length, "Length mismatch");
        require(keys.length > 0, "Empty arrays");

        // GAS OPTIMIZATION (GO-2 + GO-4): Cache length + unchecked increment
        uint256 keysLength = keys.length;
        for (uint256 i = 0; i < keysLength;) {
            // Validate if guardrails exist and not in experimental mode
            if (!experimentalMode && guardrails[keys[i]].exists) {
                if (values[i] < guardrails[keys[i]].min) {
                    revert ValueBelowMinimum(values[i], guardrails[keys[i]].min);
                }
                if (values[i] > guardrails[keys[i]].max) {
                    revert ValueAboveMaximum(values[i], guardrails[keys[i]].max);
                }
            }

            uint256 oldValue = parameters[keys[i]];

            // Add to enumeration if new
            if (!parameterExists(keys[i])) {
                parameterKeys.push(keys[i]);
                keyIndex[keys[i]] = parameterKeys.length;
            }

            parameters[keys[i]] = values[i];

            emit ParameterUpdated(keys[i], values[i], oldValue, block.timestamp);

            unchecked { ++i; }
        }
    }

    // ============= View Functions =============

    /**
     * @notice Get all parameters
     * @return keys Array of parameter identifiers
     * @return values Array of parameter values
     */
    function getAllParameters() external view returns (
        bytes32[] memory keys,
        uint256[] memory values
    ) {
        keys = parameterKeys;
        values = new uint256[](keys.length);

        // GAS OPTIMIZATION (GO-2 + GO-4): Cache length + unchecked increment
        uint256 keysLength = keys.length;
        for (uint256 i = 0; i < keysLength;) {
            values[i] = parameters[keys[i]];
            unchecked { ++i; }
        }

        return (keys, values);
    }

    /**
     * @notice Get total number of parameters
     * @return Number of parameters
     */
    function getParameterCount() external view returns (uint256) {
        return parameterKeys.length;
    }
}