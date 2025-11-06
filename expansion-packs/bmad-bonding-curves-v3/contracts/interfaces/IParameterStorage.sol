// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IParameterStorage
 * @notice Interface for centralized parameter storage
 * @dev All KEKTECH configurable values stored here in BPS (basis points)
 */
interface IParameterStorage {
    // ============= Events =============

    event ParameterUpdated(
        bytes32 indexed key,
        uint256 newValue,
        uint256 oldValue,
        uint256 timestamp
    );

    event BoolParameterUpdated(
        bytes32 indexed key,
        bool newValue,
        bool oldValue,
        uint256 timestamp
    );

    event AddressParameterUpdated(
        bytes32 indexed key,
        address indexed newAddress,
        address indexed oldAddress,
        uint256 timestamp
    );

    event GuardrailUpdated(
        bytes32 indexed key,
        uint256 newMin,
        uint256 newMax
    );

    event ExperimentalModeToggled(bool enabled);

    // ============= Errors =============

    error NotAuthorized();
    error InvalidValue();
    error ValueBelowMinimum(uint256 value, uint256 minimum);
    error ValueAboveMaximum(uint256 value, uint256 maximum);
    error ParameterNotFound(bytes32 key);

    // ============= Core Parameter Functions =============

    function setParameter(bytes32 key, uint256 value) external;
    function getParameter(bytes32 key) external view returns (uint256);
    function parameterExists(bytes32 key) external view returns (bool);

    // ============= Boolean Parameters =============

    function setBoolParameter(bytes32 key, bool value) external;
    function getBoolParameter(bytes32 key) external view returns (bool);

    // ============= Address Parameters =============

    function setAddressParameter(bytes32 key, address value) external;
    function getAddressParameter(bytes32 key) external view returns (address);

    // ============= Guardrails =============

    function setGuardrails(bytes32 key, uint256 min, uint256 max) external;
    function getGuardrails(bytes32 key) external view returns (uint256 min, uint256 max);
    function setExperimentalMode(bool enabled) external;
    function experimentalMode() external view returns (bool);

    // ============= Batch Operations =============

    function batchSetParameters(
        bytes32[] calldata keys,
        uint256[] calldata values
    ) external;

    // ============= View Functions =============

    function getAllParameters() external view returns (
        bytes32[] memory keys,
        uint256[] memory values
    );

    function getParameterCount() external view returns (uint256);
}