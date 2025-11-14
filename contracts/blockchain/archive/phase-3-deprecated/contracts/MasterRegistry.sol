// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MasterRegistry
 * @notice Central registry for all KEKTECH 3.0 module addresses
 * @dev Enables upgradeable architecture without proxy patterns
 * @custom:security-contact security@kektech.io
 */
contract MasterRegistry {
    // ============= State Variables (Gas Optimized) =============

    // Slot 0: Core admin data (32 bytes total)
    address public owner;                  // 20 bytes
    bool public paused;                    // 1 byte
    uint88 public version;                 // 11 bytes

    // Slot 1: Counters (32 bytes total)
    uint128 public totalContracts;         // 16 bytes
    uint128 public lastUpdateTimestamp;    // 16 bytes

    // Slot 2: Pending ownership transfer
    address public pendingOwner;           // 20 bytes (2-step ownership pattern)

    // Main registry storage
    mapping(bytes32 => address) private contracts;

    // Enumeration support
    bytes32[] private contractKeys;
    mapping(bytes32 => uint256) private keyIndex; // 1-indexed

    // ============= Constants =============

    // Core module keys
    bytes32 public constant PARAMETER_STORAGE = keccak256("PARAMETER_STORAGE");
    bytes32 public constant ACCESS_CONTROL = keccak256("ACCESS_CONTROL");
    bytes32 public constant MARKET_FACTORY = keccak256("MARKET_FACTORY");
    bytes32 public constant PROPOSAL_MANAGER = keccak256("PROPOSAL_MANAGER");
    bytes32 public constant RESOLUTION_MANAGER = keccak256("RESOLUTION_MANAGER");
    bytes32 public constant REWARD_DISTRIBUTOR = keccak256("REWARD_DISTRIBUTOR");
    bytes32 public constant TREASURY = keccak256("TREASURY");

    // ============= Events =============

    event ContractUpdated(
        bytes32 indexed key,
        address indexed newAddress,
        address indexed oldAddress,
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

    // ============= Errors =============

    error NotOwner();
    error NotPendingOwner();
    error NoPendingOwnershipTransfer();
    error ContractPaused();
    error ZeroAddress();
    error InvalidKey();
    error ContractNotFound(bytes32 key);
    error LengthMismatch();
    error EmptyArray();

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
     * @dev Only owner can call when not paused
     */
    function setContract(bytes32 key, address contractAddress)
        external
        onlyOwner
        whenNotPaused
    {
        if (contractAddress == address(0)) revert ZeroAddress();
        if (key == bytes32(0)) revert InvalidKey();

        address oldAddress = contracts[key];

        // If new contract, add to enumeration
        if (oldAddress == address(0)) {
            contractKeys.push(key);
            keyIndex[key] = contractKeys.length; // 1-indexed
            totalContracts++;
        }

        contracts[key] = contractAddress;
        lastUpdateTimestamp = uint128(block.timestamp);

        emit ContractUpdated(key, contractAddress, oldAddress, block.timestamp);
    }

    /**
     * @notice Get contract address by key
     * @param key Contract identifier
     * @return Contract address
     */
    function getContract(bytes32 key) external view returns (address) {
        address contractAddress = contracts[key];
        if (contractAddress == address(0)) revert ContractNotFound(key);
        return contractAddress;
    }

    /**
     * @notice Remove a contract from the registry
     * @param key Contract identifier to remove
     */
    function removeContract(bytes32 key) external onlyOwner whenNotPaused {
        address contractAddress = contracts[key];
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
        delete contracts[key];
        totalContracts--;

        lastUpdateTimestamp = uint128(block.timestamp);

        emit ContractUpdated(key, address(0), contractAddress, block.timestamp);
    }

    /**
     * @notice Batch register/update contracts
     * @param keys Array of contract identifiers
     * @param addresses Array of contract addresses
     * @dev Arrays must be same length and non-empty
     */
    function batchSetContracts(
        bytes32[] calldata keys,
        address[] calldata addresses
    ) external onlyOwner whenNotPaused {
        if (keys.length != addresses.length) revert LengthMismatch();
        if (keys.length == 0) revert EmptyArray();

        // GAS OPTIMIZATION (GO-2): Cache array length (GO-4 uses unchecked for loop counter)
        uint256 keysLength = keys.length;
        for (uint256 i = 0; i < keysLength;) {
            if (addresses[i] == address(0)) revert ZeroAddress();
            if (keys[i] == bytes32(0)) revert InvalidKey();

            address oldAddress = contracts[keys[i]];

            // If new contract, add to enumeration
            if (oldAddress == address(0)) {
                contractKeys.push(keys[i]);
                keyIndex[keys[i]] = contractKeys.length;
                totalContracts++;
            }

            contracts[keys[i]] = addresses[i];
            emit ContractUpdated(keys[i], addresses[i], oldAddress, block.timestamp);

            // GAS OPTIMIZATION (GO-4): Unchecked increment saves ~50 gas per iteration
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
     * @dev SECURITY FIX (M-1): Implements 2-step ownership transfer
     *      Step 1: Current owner calls this to initiate transfer
     *      Step 2: New owner must call acceptOwnership() to complete
     *      This prevents accidental transfers to wrong addresses
     */
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();

        pendingOwner = newOwner;
        emit OwnershipTransferStarted(owner, newOwner);
    }

    /**
     * @notice Accept ownership transfer
     * @dev SECURITY FIX (M-1): Only pending owner can accept
     *      Completes the 2-step ownership transfer process
     */
    function acceptOwnership() external {
        if (msg.sender != pendingOwner) revert NotPendingOwner();

        address oldOwner = owner;
        owner = pendingOwner;
        pendingOwner = address(0);

        emit OwnershipTransferred(oldOwner, owner);
    }

    /**
     * @notice Cancel pending ownership transfer
     * @dev Only current owner can cancel pending transfer
     */
    function cancelOwnershipTransfer() external onlyOwner {
        if (pendingOwner == address(0)) revert NoPendingOwnershipTransfer();

        address cancelled = pendingOwner;
        pendingOwner = address(0);

        emit OwnershipTransferCancelled(cancelled);
    }

    /**
     * @notice Pause the registry (emergency use only)
     */
    function pause() external onlyOwner {
        paused = true;
        emit RegistryPaused(true);
        emit EmergencyAction("Registry Paused", msg.sender, block.timestamp);
    }

    /**
     * @notice Unpause the registry
     */
    function unpause() external onlyOwner {
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
    function contractExists(bytes32 key) external view returns (bool) {
        return contracts[key] != address(0);
    }

    /**
     * @notice Get all registered contracts
     * @return keys Array of contract identifiers
     * @return addresses Array of contract addresses
     */
    function getAllContracts() external view returns (
        bytes32[] memory keys,
        address[] memory addresses
    ) {
        keys = contractKeys;
        addresses = new address[](keys.length);

        // GAS OPTIMIZATION (GO-2 + GO-4): Cache length + unchecked increment
        uint256 keysLength = keys.length;
        for (uint256 i = 0; i < keysLength;) {
            addresses[i] = contracts[keys[i]];
            unchecked { ++i; }
        }

        return (keys, addresses);
    }

    /**
     * @notice Get total number of registered contracts
     * @return Number of contracts
     */
    function getContractCount() external view returns (uint256) {
        return contractKeys.length;
    }

    /**
     * @notice Get contract at specific index
     * @param index Position in enumeration (0-indexed)
     * @return key Contract identifier
     * @return contractAddress Contract address
     */
    function getContractAt(uint256 index) external view returns (
        bytes32 key,
        address contractAddress
    ) {
        require(index < contractKeys.length, "Index out of bounds");
        key = contractKeys[index];
        contractAddress = contracts[key];
        return (key, contractAddress);
    }
}