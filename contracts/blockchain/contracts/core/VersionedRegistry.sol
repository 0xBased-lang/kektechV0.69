// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IVersionedRegistry.sol";

/**
 * @title VersionedRegistry
 * @notice Central registry with version tracking for all KEKTECH 3.0 module addresses
 * @dev Phase 3: Replaces MasterRegistry with version history support
 * @custom:security-contact security@kektech.io
 */
contract VersionedRegistry is IVersionedRegistry {
    // ============= State Variables (Gas Optimized) =============

    // Slot 0: Core admin data (32 bytes total)
    address public override owner;         // 20 bytes
    bool public override paused;           // 1 byte
    uint88 public override version;        // 11 bytes (registry contract version)

    // Slot 1: Counters (32 bytes total)
    uint128 public override totalContracts;        // 16 bytes
    uint128 public override lastUpdateTimestamp;   // 16 bytes

    // Slot 2: Pending ownership transfer
    address public override pendingOwner;  // 20 bytes (2-step ownership pattern)

    // Main registry storage with version tracking
    mapping(bytes32 => Entry) private entries;

    // Version history: moduleId => version => address
    mapping(bytes32 => mapping(uint256 => address)) private versionHistory;

    // Track which versions exist for enumeration
    mapping(bytes32 => uint256[]) private versionNumbers;

    // Enumeration support
    bytes32[] private contractKeys;
    mapping(bytes32 => uint256) private keyIndex; // 1-indexed

    // ============= Constants =============

    // Core module keys (for convenience)
    bytes32 public constant PARAMETER_STORAGE = keccak256("PARAMETER_STORAGE");
    bytes32 public constant ACCESS_CONTROL = keccak256("ACCESS_CONTROL");
    bytes32 public constant MARKET_FACTORY = keccak256("MARKET_FACTORY");
    bytes32 public constant PROPOSAL_MANAGER = keccak256("PROPOSAL_MANAGER");
    bytes32 public constant RESOLUTION_MANAGER = keccak256("RESOLUTION_MANAGER");
    bytes32 public constant REWARD_DISTRIBUTOR = keccak256("REWARD_DISTRIBUTOR");
    bytes32 public constant TREASURY = keccak256("TREASURY");

    // ============= Modifiers =============

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert ContractPaused();
        _;
    }

    // ============= Constructor =============

    constructor() {
        owner = msg.sender;
        version = 1;
        lastUpdateTimestamp = uint128(block.timestamp);
    }

    // ============= Core Functions =============

    /**
     * @notice Register or update a contract in the registry
     * @param key Unique identifier for the contract
     * @param contractAddress Address of the contract
     * @param contractVersion Version number (must be > 0)
     * @dev Only owner can call when not paused
     */
    function setContract(bytes32 key, address contractAddress, uint256 contractVersion)
        external
        override
        onlyOwner
        whenNotPaused
    {
        if (contractAddress == address(0)) revert ZeroAddress();
        if (key == bytes32(0)) revert InvalidKey();
        if (contractVersion == 0) revert InvalidVersion();

        address oldAddress = entries[key].contractAddress;
        uint256 oldVersion = entries[key].version;

        // If new contract, add to enumeration
        if (oldAddress == address(0)) {
            contractKeys.push(key);
            keyIndex[key] = contractKeys.length; // 1-indexed
            totalContracts++;

            emit ContractRegistered(key, contractAddress, contractVersion, block.timestamp);
        } else {
            emit ContractUpdated(key, oldAddress, contractAddress, contractVersion, block.timestamp);
        }

        // Store in main registry
        entries[key] = Entry({
            contractAddress: contractAddress,
            version: contractVersion,
            active: true
        });

        // Store in version history
        versionHistory[key][contractVersion] = contractAddress;

        // Track version number for enumeration (if new version)
        if (contractVersion != oldVersion) {
            versionNumbers[key].push(contractVersion);
        }

        lastUpdateTimestamp = uint128(block.timestamp);
    }

    /**
     * @notice Get current contract address by key
     * @param key Contract identifier
     * @return Contract address (current version)
     */
    function getContract(bytes32 key) external view override returns (address) {
        Entry memory entry = entries[key];
        if (entry.contractAddress == address(0)) revert ContractNotFound(key);
        if (!entry.active) revert ContractInactive(key);
        return entry.contractAddress;
    }

    /**
     * @notice Get contract address for specific version
     * @param key Contract identifier
     * @param contractVersion Version number to query
     * @return Contract address for that version
     */
    function getContractVersion(bytes32 key, uint256 contractVersion)
        external
        view
        override
        returns (address)
    {
        address addr = versionHistory[key][contractVersion];
        if (addr == address(0)) revert VersionNotFound(key, contractVersion);
        return addr;
    }

    /**
     * @notice Get latest version number for a contract
     * @param key Contract identifier
     * @return Current version number
     */
    function getLatestVersion(bytes32 key) external view override returns (uint256) {
        if (entries[key].contractAddress == address(0)) revert ContractNotFound(key);
        return entries[key].version;
    }

    /**
     * @notice Update existing contract to new version
     * @param key Contract identifier
     * @param newAddress New contract address
     * @param newVersion New version number (must be > current version)
     */
    function updateContract(bytes32 key, address newAddress, uint256 newVersion)
        external
        override
        onlyOwner
        whenNotPaused
    {
        if (entries[key].contractAddress == address(0)) revert ContractNotFound(key);
        if (newVersion <= entries[key].version) revert VersionMustIncrease();

        this.setContract(key, newAddress, newVersion);
    }

    /**
     * @notice Deactivate a contract (prevents getContract calls)
     * @param key Contract identifier
     */
    function deactivateContract(bytes32 key) external override onlyOwner {
        if (entries[key].contractAddress == address(0)) revert ContractNotFound(key);
        entries[key].active = false;
        emit ContractDeactivated(key, block.timestamp);
    }

    /**
     * @notice Reactivate a previously deactivated contract
     * @param key Contract identifier
     */
    function reactivateContract(bytes32 key) external override onlyOwner {
        if (entries[key].contractAddress == address(0)) revert ContractNotFound(key);
        entries[key].active = true;
        emit ContractReactivated(key, block.timestamp);
    }

    /**
     * @notice Check if a contract is active
     * @param key Contract identifier
     * @return True if contract exists and is active
     */
    function isActive(bytes32 key) external view override returns (bool) {
        return entries[key].contractAddress != address(0) && entries[key].active;
    }

    /**
     * @notice Remove a contract from the registry
     * @param key Contract identifier to remove
     */
    function removeContract(bytes32 key) external override onlyOwner whenNotPaused {
        address contractAddress = entries[key].contractAddress;
        if (contractAddress == address(0)) revert ContractNotFound(key);

        // Remove from enumeration
        uint256 index = keyIndex[key];
        uint256 lastIndex = contractKeys.length;

        if (index != lastIndex) {
            // Move last element to deleted position
            bytes32 lastKey = contractKeys[lastIndex - 1];
            contractKeys[index - 1] = lastKey;
            keyIndex[lastKey] = index;
        }

        contractKeys.pop();
        delete keyIndex[key];
        delete entries[key];
        // Note: Keep version history for audit trail
        totalContracts--;

        lastUpdateTimestamp = uint128(block.timestamp);

        emit ContractUpdated(key, contractAddress, address(0), 0, block.timestamp);
    }

    /**
     * @notice Batch register/update contracts
     * @param keys Array of contract identifiers
     * @param addresses Array of contract addresses
     * @param versions Array of version numbers
     */
    function batchSetContracts(
        bytes32[] calldata keys,
        address[] calldata addresses,
        uint256[] calldata versions
    ) external override onlyOwner whenNotPaused {
        if (keys.length != addresses.length || keys.length != versions.length) {
            revert LengthMismatch();
        }
        if (keys.length == 0) revert EmptyArray();

        uint256 keysLength = keys.length;
        for (uint256 i = 0; i < keysLength;) {
            if (addresses[i] == address(0)) revert ZeroAddress();
            if (keys[i] == bytes32(0)) revert InvalidKey();
            if (versions[i] == 0) revert InvalidVersion();

            address oldAddress = entries[keys[i]].contractAddress;
            uint256 oldVersion = entries[keys[i]].version;

            // If new contract, add to enumeration
            if (oldAddress == address(0)) {
                contractKeys.push(keys[i]);
                keyIndex[keys[i]] = contractKeys.length;
                totalContracts++;
                emit ContractRegistered(keys[i], addresses[i], versions[i], block.timestamp);
            } else {
                emit ContractUpdated(keys[i], oldAddress, addresses[i], versions[i], block.timestamp);
            }

            // Store in main registry
            entries[keys[i]] = Entry({
                contractAddress: addresses[i],
                version: versions[i],
                active: true
            });

            // Store in version history
            versionHistory[keys[i]][versions[i]] = addresses[i];

            // Track version number (if new version)
            if (versions[i] != oldVersion) {
                versionNumbers[keys[i]].push(versions[i]);
            }

            unchecked {
                ++i;
            }
        }

        lastUpdateTimestamp = uint128(block.timestamp);
    }

    // ============= Admin Functions =============

    /**
     * @notice Initiate ownership transfer to a new address
     * @param newOwner Address of new owner
     * @dev 2-step ownership transfer for safety
     */
    function transferOwnership(address newOwner) external override onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        pendingOwner = newOwner;
        emit OwnershipTransferStarted(owner, newOwner);
    }

    /**
     * @notice Accept ownership transfer
     * @dev Only pending owner can accept
     */
    function acceptOwnership() external override {
        if (msg.sender != pendingOwner) revert NotPendingOwner();

        address oldOwner = owner;
        owner = pendingOwner;
        pendingOwner = address(0);

        emit OwnershipTransferred(oldOwner, owner);
    }

    /**
     * @notice Cancel pending ownership transfer
     * @dev Only current owner can cancel
     */
    function cancelOwnershipTransfer() external override onlyOwner {
        if (pendingOwner == address(0)) revert NoPendingOwnershipTransfer();

        address cancelled = pendingOwner;
        pendingOwner = address(0);

        emit OwnershipTransferCancelled(cancelled);
    }

    /**
     * @notice Pause the registry (emergency use only)
     */
    function pause() external override onlyOwner {
        paused = true;
        emit RegistryPaused(true);
        emit EmergencyAction("Registry Paused", msg.sender, block.timestamp);
    }

    /**
     * @notice Unpause the registry
     */
    function unpause() external override onlyOwner {
        paused = false;
        emit RegistryPaused(false);
        emit EmergencyAction("Registry Unpaused", msg.sender, block.timestamp);
    }

    // ============= View Functions =============

    /**
     * @notice Check if a contract exists in registry
     * @param key Contract identifier
     * @return True if contract is registered
     */
    function contractExists(bytes32 key) external view override returns (bool) {
        return entries[key].contractAddress != address(0);
    }

    /**
     * @notice Get complete entry for a contract
     * @param key Contract identifier
     * @return entry Complete Entry struct
     */
    function getEntry(bytes32 key) external view override returns (Entry memory entry) {
        return entries[key];
    }

    /**
     * @notice Get all registered contracts
     * @return keys Array of contract identifiers
     * @return addresses Array of contract addresses
     */
    function getAllContracts() external view override returns (
        bytes32[] memory keys,
        address[] memory addresses
    ) {
        keys = contractKeys;
        addresses = new address[](keys.length);

        uint256 keysLength = keys.length;
        for (uint256 i = 0; i < keysLength;) {
            addresses[i] = entries[keys[i]].contractAddress;
            unchecked { ++i; }
        }

        return (keys, addresses);
    }

    /**
     * @notice Get total number of registered contracts
     * @return Number of contracts
     */
    function getContractCount() external view override returns (uint256) {
        return contractKeys.length;
    }

    /**
     * @notice Get contract at specific index
     * @param index Position in enumeration (0-indexed)
     * @return key Contract identifier
     * @return contractAddress Contract address
     */
    function getContractAt(uint256 index) external view override returns (
        bytes32 key,
        address contractAddress
    ) {
        require(index < contractKeys.length, "Index out of bounds");
        key = contractKeys[index];
        contractAddress = entries[key].contractAddress;
        return (key, contractAddress);
    }

    /**
     * @notice Get version history for a contract
     * @param key Contract identifier
     * @return versions Array of all version numbers for this contract
     */
    function getVersionHistory(bytes32 key) external view override returns (uint256[] memory versions) {
        return versionNumbers[key];
    }
}
