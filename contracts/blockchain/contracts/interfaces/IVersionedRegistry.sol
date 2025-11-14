// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IVersionedRegistry
 * @notice Interface for the Versioned Registry contract
 * @dev Central registry with version tracking for all KEKTECH module addresses
 * @custom:phase Phase 3 - Replaces IVersionedRegistry with version history support
 */
interface IVersionedRegistry {
    // ============= STRUCTS =============

    /**
     * @notice Entry for a registered contract
     * @param contractAddress Current contract address
     * @param version Current version number
     * @param active Whether contract is active (can be deactivated)
     */
    struct Entry {
        address contractAddress;
        uint256 version;
        bool active;
    }

    // ============= EVENTS =============

    event ContractRegistered(
        bytes32 indexed id,
        address indexed contractAddress,
        uint256 version,
        uint256 timestamp
    );

    event ContractUpdated(
        bytes32 indexed id,
        address indexed oldAddress,
        address indexed newAddress,
        uint256 newVersion,
        uint256 timestamp
    );

    event ContractDeactivated(
        bytes32 indexed id,
        uint256 timestamp
    );

    event ContractReactivated(
        bytes32 indexed id,
        uint256 timestamp
    );

    event OwnershipTransferStarted(
        address indexed previousOwner,
        address indexed newOwner
    );

    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    event OwnershipTransferCancelled(
        address indexed cancelledOwner
    );

    event RegistryPaused(bool isPaused);

    event EmergencyAction(
        string action,
        address indexed executor,
        uint256 timestamp
    );

    // ============= ERRORS =============

    error NotOwner();
    error NotPendingOwner();
    error NoPendingOwnershipTransfer();
    error ContractPaused();
    error ZeroAddress();
    error InvalidKey();
    error InvalidVersion();
    error ContractNotFound(bytes32 key);
    error ContractInactive(bytes32 key);
    error VersionNotFound(bytes32 key, uint256 version);
    error VersionMustIncrease();
    error LengthMismatch();
    error EmptyArray();

    // ============= CORE FUNCTIONS (Updated for Versioning) =============

    /**
     * @notice Register or update a contract in the registry
     * @param key Unique identifier for the contract
     * @param contractAddress Address of the contract
     * @param version Version number (must be > 0 and increase on updates)
     * @dev Only owner can call when not paused
     */
    function setContract(bytes32 key, address contractAddress, uint256 version) external;

    /**
     * @notice Get current contract address by key
     * @param key Contract identifier
     * @return Contract address (current version)
     * @dev Reverts if contract not found or inactive
     */
    function getContract(bytes32 key) external view returns (address);

    /**
     * @notice Get contract address for specific version
     * @param key Contract identifier
     * @param version Version number to query
     * @return Contract address for that version
     * @dev Reverts if version not found
     */
    function getContractVersion(bytes32 key, uint256 version) external view returns (address);

    /**
     * @notice Get latest version number for a contract
     * @param key Contract identifier
     * @return Current version number
     * @dev Reverts if contract not found
     */
    function getLatestVersion(bytes32 key) external view returns (uint256);

    /**
     * @notice Update existing contract to new version
     * @param key Contract identifier
     * @param newAddress New contract address
     * @param newVersion New version number (must be > current version)
     * @dev Convenience function that enforces version must increase
     */
    function updateContract(bytes32 key, address newAddress, uint256 newVersion) external;

    /**
     * @notice Deactivate a contract (prevents getContract calls)
     * @param key Contract identifier
     * @dev Contract remains in registry but becomes inactive
     */
    function deactivateContract(bytes32 key) external;

    /**
     * @notice Reactivate a previously deactivated contract
     * @param key Contract identifier
     */
    function reactivateContract(bytes32 key) external;

    /**
     * @notice Check if a contract is active
     * @param key Contract identifier
     * @return True if contract exists and is active
     */
    function isActive(bytes32 key) external view returns (bool);

    /**
     * @notice Remove a contract from the registry
     * @param key Contract identifier to remove
     * @dev Removes all version history
     */
    function removeContract(bytes32 key) external;

    /**
     * @notice Check if a contract exists in registry
     * @param key Contract identifier
     * @return True if contract is registered (even if inactive)
     */
    function contractExists(bytes32 key) external view returns (bool);

    // ============= BATCH OPERATIONS =============

    /**
     * @notice Batch register/update contracts
     * @param keys Array of contract identifiers
     * @param addresses Array of contract addresses
     * @param versions Array of version numbers
     * @dev Arrays must be same length and non-empty
     */
    function batchSetContracts(
        bytes32[] calldata keys,
        address[] calldata addresses,
        uint256[] calldata versions
    ) external;

    // ============= ADMIN FUNCTIONS =============

    /**
     * @notice Initiate ownership transfer to a new address
     * @param newOwner Address of new owner
     * @dev 2-step ownership transfer for safety
     */
    function transferOwnership(address newOwner) external;

    /**
     * @notice Accept ownership transfer
     * @dev Only pending owner can accept
     */
    function acceptOwnership() external;

    /**
     * @notice Cancel pending ownership transfer
     * @dev Only current owner can cancel
     */
    function cancelOwnershipTransfer() external;

    /**
     * @notice Pause the registry (emergency use only)
     */
    function pause() external;

    /**
     * @notice Unpause the registry
     */
    function unpause() external;

    // ============= VIEW FUNCTIONS =============

    function owner() external view returns (address);
    function pendingOwner() external view returns (address);
    function paused() external view returns (bool);
    function version() external view returns (uint88);
    function totalContracts() external view returns (uint128);
    function lastUpdateTimestamp() external view returns (uint128);

    /**
     * @notice Get complete entry for a contract
     * @param key Contract identifier
     * @return entry Complete Entry struct with address, version, and active status
     */
    function getEntry(bytes32 key) external view returns (Entry memory entry);

    /**
     * @notice Get all registered contracts
     * @return keys Array of contract identifiers
     * @return addresses Array of contract addresses (current versions)
     */
    function getAllContracts() external view returns (
        bytes32[] memory keys,
        address[] memory addresses
    );

    /**
     * @notice Get total number of registered contracts
     * @return Number of contracts
     */
    function getContractCount() external view returns (uint256);

    /**
     * @notice Get contract at specific index
     * @param index Position in enumeration (0-indexed)
     * @return key Contract identifier
     * @return contractAddress Contract address
     */
    function getContractAt(uint256 index) external view returns (
        bytes32 key,
        address contractAddress
    );

    /**
     * @notice Get version history for a contract
     * @param key Contract identifier
     * @return versions Array of all version numbers for this contract
     * @dev Returns empty array if contract not found
     */
    function getVersionHistory(bytes32 key) external view returns (uint256[] memory versions);
}
