// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IVersionedRegistry
 * @notice Interface for the Master Registry contract
 * @dev Central registry for all KEKTECH module addresses
 */
interface IVersionedRegistry {
    // ============= Events =============

    event ContractUpdated(
        bytes32 indexed key,
        address indexed newAddress,
        address indexed oldAddress,
        uint256 timestamp
    );

    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    event RegistryPaused(bool isPaused);

    event EmergencyAction(
        string action,
        address indexed executor,
        uint256 timestamp
    );

    // ============= Errors =============

    error NotOwner();
    error ContractPaused();
    error ZeroAddress();
    error InvalidKey();
    error ContractNotFound(bytes32 key);
    error LengthMismatch();
    error EmptyArray();

    // ============= Core Functions =============

    function setContract(bytes32 key, address contractAddress) external;
    function getContract(bytes32 key) external view returns (address);
    function removeContract(bytes32 key) external;
    function contractExists(bytes32 key) external view returns (bool);

    // ============= Batch Operations =============

    function batchSetContracts(
        bytes32[] calldata keys,
        address[] calldata addresses
    ) external;

    // ============= Admin Functions =============

    function transferOwnership(address newOwner) external;
    function pause() external;
    function unpause() external;

    // ============= View Functions =============

    function owner() external view returns (address);
    function paused() external view returns (bool);
    function version() external view returns (uint88);
    function totalContracts() external view returns (uint128);
    function lastUpdateTimestamp() external view returns (uint128);

    function getAllContracts() external view returns (
        bytes32[] memory keys,
        address[] memory addresses
    );

    function getContractCount() external view returns (uint256);

    function getContractAt(uint256 index) external view returns (
        bytes32 key,
        address contractAddress
    );
}