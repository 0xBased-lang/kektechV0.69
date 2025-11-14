// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../interfaces/IFlexibleMarketFactory.sol";
import "../interfaces/IVersionedRegistry.sol";
import "../interfaces/IAccessControlManager.sol";
import "../interfaces/IPredictionMarket.sol";
import "./PredictionMarket.sol";

/**
 * @title FlexibleMarketFactoryCore
 * @notice Core factory for creating and managing prediction markets (Size-optimized)
 * @dev Day 9 Split: Core functionality under 24KB limit
 *
 * This contract contains:
 * - Essential market creation (createMarket)
 * - State storage (all markets data)
 * - Market management functions
 * - Basic enumeration
 * - Admin controls
 *
 * The Extensions contract handles:
 * - Template-based creation
 * - Bonding curve integration
 * - Advanced features
 */
contract FlexibleMarketFactoryCore is ReentrancyGuard {
    // ============= State Variables (ALL STATE) =============

    /// @notice Reference to MasterRegistry
    address public immutable registry;

    /// @notice Reference to Extensions contract (set after deployment)
    address public extensionsContract;

    /// @notice Minimum creator bond required
    uint256 public minCreatorBond;

    /// @notice Whether factory is paused
    bool public paused;

    /// @notice Array of all created markets
    address[] private _markets;

    /// @notice Mapping of market address to market data
    mapping(address => MarketData) private _marketData;

    /// @notice Mapping of creator to their markets
    mapping(address => address[]) private _marketsByCreator;

    /// @notice Mapping of category to markets
    mapping(bytes32 => address[]) private _marketsByCategory;

    /// @notice Mapping of market to creator bond held
    mapping(address => uint256) private heldBonds;

    /// @notice Cache active market count
    uint256 private _activeMarketCount;

    /// @notice Cache total held bonds
    uint256 private _totalHeldBonds;

    // ============= Structs =============

    struct MarketData {
        address creator;
        uint256 createdAt;
        uint256 resolutionTime;
        bytes32 category;
        bool isActive;
        bool exists;
        uint256 creatorBond;
    }

    // Note: Using MarketConfig from IFlexibleMarketFactory interface

    // ============= Events =============

    event MarketCreated(
        address indexed marketAddress,
        address indexed creator,
        string question,
        uint256 resolutionTime,
        uint256 creatorBond,
        bytes32 indexed category,
        uint256 timestamp
    );

    event MarketCreatedWithCurve(
        address indexed marketAddress,
        address indexed creator,
        string question,
        uint256 resolutionTime,
        IFlexibleMarketFactory.CurveType curveType,
        uint256 curveParams,
        bytes32 indexed category,
        uint256 timestamp
    );

    event MarketActivated(address indexed marketAddress, uint256 timestamp);
    event MarketDeactivated(address indexed marketAddress, string reason, uint256 timestamp);
    event CreatorBondRefunded(address indexed marketAddress, address indexed creator, uint256 amount, string reason, uint256 timestamp);
    event FactoryPaused(bool isPaused);
    event ExtensionsContractSet(address indexed extensions);

    // ============= Errors (Using IFlexibleMarketFactory errors) =============

    error UnauthorizedAccess(address caller);
    error InvalidMarketConfig();
    error InvalidResolutionTime();
    error InvalidBondAmount();
    error InvalidQuestion();
    error InvalidCategory();
    error MarketNotFound(address marketAddress);
    error InsufficientBond();
    error ContractPaused();

    // ============= Constructor =============

    constructor(address _registry, uint256 _minCreatorBond) {
        if (_registry == address(0)) revert InvalidMarketConfig();
        registry = _registry;
        minCreatorBond = _minCreatorBond;
        paused = false;
    }

    // ============= Modifiers =============

    modifier whenNotPaused() {
        if (paused) revert ContractPaused();
        _;
    }

    modifier onlyAdmin() {
        IAccessControlManager accessControl = _getAccessControlManager();
        if (!accessControl.hasRole(keccak256("ADMIN_ROLE"), msg.sender)) {
            revert UnauthorizedAccess(msg.sender);
        }
        _;
    }

    modifier onlyExtensions() {
        if (msg.sender != extensionsContract) revert UnauthorizedAccess(msg.sender);
        _;
    }

    // ============= Core Market Creation =============

    /**
     * @notice Create a new prediction market
     * @param config Market configuration
     * @return marketAddress Address of created market
     */
    function createMarket(IFlexibleMarketFactory.MarketConfig calldata config)
        external
        payable
        nonReentrant
        whenNotPaused
        returns (address marketAddress)
    {
        // Validate
        _validateMarketConfig(config);
        if (msg.value < config.creatorBond || msg.value < minCreatorBond) {
            revert InsufficientBond();
        }

        // Deploy and initialize
        marketAddress = _deployAndInitializeMarket(
            config.question,
            config.outcome1,
            config.outcome2,
            msg.sender,
            config.resolutionTime
        );

        // Store data
        _storeMarketData(
            marketAddress,
            msg.sender,
            config.resolutionTime,
            config.category,
            msg.value
        );

        emit MarketCreated(
            marketAddress,
            msg.sender,
            config.question,
            config.resolutionTime,
            msg.value,
            config.category,
            block.timestamp
        );

        return marketAddress;
    }

    /**
     * @notice Create market with specific bonding curve configuration
     * @param config Market configuration
     * @param curveType Type of bonding curve to use
     * @param curveParams Packed curve parameters
     * @return marketAddress Address of created market
     */
    function createMarketWithCurve(
        IFlexibleMarketFactory.MarketConfig calldata config,
        IFlexibleMarketFactory.CurveType curveType,
        uint256 curveParams
    )
        external
        payable
        nonReentrant
        whenNotPaused
        returns (address marketAddress)
    {
        // Validate market config
        _validateMarketConfig(config);
        if (msg.value < config.creatorBond || msg.value < minCreatorBond) {
            revert InsufficientBond();
        }

        // TODO: Validate curve parameters when curve system is fully implemented

        // Deploy and initialize market (same as basic creation for now)
        marketAddress = _deployAndInitializeMarket(
            config.question,
            config.outcome1,
            config.outcome2,
            msg.sender,
            config.resolutionTime
        );

        // Store market data
        _storeMarketData(
            marketAddress,
            msg.sender,
            config.resolutionTime,
            config.category,
            msg.value
        );

        // Emit standard event
        emit MarketCreated(
            marketAddress,
            msg.sender,
            config.question,
            config.resolutionTime,
            msg.value,
            config.category,
            block.timestamp
        );

        // Emit curve-specific event
        emit MarketCreatedWithCurve(
            marketAddress,
            msg.sender,
            config.question,
            config.resolutionTime,
            curveType,
            curveParams,
            config.category,
            block.timestamp
        );

        return marketAddress;
    }

    // ============= Market Management =============

    function activateMarket(address marketAddress) external onlyAdmin {
        MarketData storage data = _marketData[marketAddress];
        if (!data.exists) revert MarketNotFound(marketAddress);

        if (!data.isActive) {
            _activeMarketCount++;
        }

        data.isActive = true;
        emit MarketActivated(marketAddress, block.timestamp);
    }

    function deactivateMarket(address marketAddress, string calldata reason)
        external
        onlyAdmin
    {
        MarketData storage data = _marketData[marketAddress];
        if (!data.exists) revert MarketNotFound(marketAddress);

        if (data.isActive) {
            _activeMarketCount--;
        }

        data.isActive = false;
        emit MarketDeactivated(marketAddress, reason, block.timestamp);
    }

    function refundCreatorBond(address marketAddress, string calldata reason) external onlyAdmin nonReentrant {
        MarketData storage data = _marketData[marketAddress];
        if (!data.exists) revert MarketNotFound(marketAddress);

        uint256 bondAmount = heldBonds[marketAddress];
        if (bondAmount == 0) revert InvalidBondAmount();

        address creator = data.creator;

        // Zero out state BEFORE transfer
        heldBonds[marketAddress] = 0;
        data.creatorBond = 0;
        _totalHeldBonds -= bondAmount;

        // Transfer bond
        (bool success, ) = creator.call{value: bondAmount}("");
        if (!success) revert InvalidMarketConfig();

        emit CreatorBondRefunded(marketAddress, creator, bondAmount, reason, block.timestamp);
    }

    // ============= Basic Enumeration =============

    function getMarketCount() external view returns (uint256) {
        return _markets.length;
    }

    function getMarketAt(uint256 index) external view returns (address) {
        if (index >= _markets.length) revert MarketNotFound(address(0));
        return _markets[index];
    }

    function getAllMarkets() external view returns (address[] memory) {
        return _markets;
    }

    function getActiveMarkets(uint256 offset, uint256 limit)
        external
        view
        returns (address[] memory markets, uint256 total)
    {
        total = _activeMarketCount;

        if (offset >= total) {
            return (new address[](0), total);
        }

        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }
        uint256 returnSize = end - offset;

        markets = new address[](returnSize);
        uint256 currentIndex = 0;
        uint256 foundCount = 0;
        uint256 marketsLength = _markets.length;

        for (uint256 i = 0; i < marketsLength && foundCount < end; i++) {
            if (_marketData[_markets[i]].isActive) {
                if (foundCount >= offset) {
                    markets[currentIndex] = _markets[i];
                    currentIndex++;
                }
                foundCount++;
            }
        }

        return (markets, total);
    }

    /**
     * @notice Get ALL active markets (use pagination for production)
     */
    function getActiveMarkets() external view returns (address[] memory) {
        address[] memory activeMarkets = new address[](_activeMarketCount);
        uint256 currentIndex = 0;
        uint256 marketsLength = _markets.length;

        for (uint256 i = 0; i < marketsLength; i++) {
            if (_marketData[_markets[i]].isActive) {
                activeMarkets[currentIndex] = _markets[i];
                currentIndex++;
            }
        }

        return activeMarkets;
    }

    // ============= Market Info Getters =============

    function getMarketInfo(address marketAddress)
        external
        view
        returns (
            address creator,
            uint256 createdAt,
            uint256 resolutionTime,
            bytes32 category,
            bool isActive,
            uint256 creatorBond
        )
    {
        MarketData memory data = _marketData[marketAddress];
        if (!data.exists) revert MarketNotFound(marketAddress);

        return (
            data.creator,
            data.createdAt,
            data.resolutionTime,
            data.category,
            data.isActive,
            data.creatorBond
        );
    }

    function isMarketActive(address marketAddress) external view returns (bool) {
        return _marketData[marketAddress].isActive;
    }

    function getMarketCreator(address marketAddress) external view returns (address) {
        return _marketData[marketAddress].creator;
    }

    function getHeldBond(address marketAddress) external view returns (uint256) {
        return heldBonds[marketAddress];
    }

    function getTotalHeldBonds() external view returns (uint256) {
        return _totalHeldBonds;
    }

    function getActiveMarketCount() external view returns (uint256) {
        return _activeMarketCount;
    }

    /**
     * @notice Get markets by creator (public for Extensions)
     */
    function getMarketsByCreator(address creator) external view returns (address[] memory) {
        return _marketsByCreator[creator];
    }

    /**
     * @notice Get markets by category (public for Extensions)
     */
    function getMarketsByCategory(bytes32 category) external view returns (address[] memory) {
        return _marketsByCategory[category];
    }

    // ============= Admin Functions =============

    function pause() external onlyAdmin {
        paused = true;
        emit FactoryPaused(true);
    }

    function unpause() external onlyAdmin {
        paused = false;
        emit FactoryPaused(false);
    }

    function updateMinBond(uint256 newMinBond) external onlyAdmin {
        minCreatorBond = newMinBond;
    }

    function setExtensionsContract(address _extensions) external onlyAdmin {
        extensionsContract = _extensions;
        emit ExtensionsContractSet(_extensions);
    }

    // ============= Internal Helpers =============

    function _validateMarketConfig(IFlexibleMarketFactory.MarketConfig memory config) private view {
        if (bytes(config.question).length == 0) revert InvalidQuestion();
        if (config.resolutionTime <= block.timestamp) revert InvalidResolutionTime();

        uint256 MAX_RESOLUTION_PERIOD = 31536000; // 1 year
        if (config.resolutionTime > block.timestamp + MAX_RESOLUTION_PERIOD) {
            revert InvalidResolutionTime();
        }

        if (config.category == bytes32(0)) revert InvalidCategory();
        if (config.creatorBond < minCreatorBond) revert InvalidBondAmount();
    }

    function _deployAndInitializeMarket(
        string memory question,
        string memory outcome1,
        string memory outcome2,
        address creator,
        uint256 resolutionTime
    ) private returns (address) {
        // Deploy new PredictionMarket
        PredictionMarket market = new PredictionMarket();

        // Get default bonding curve from registry
        address bondingCurve = IVersionedRegistry(registry).getContract(
            keccak256("BondingCurve")
        );

        // Initialize with default curve and params
        market.initialize(
            registry,
            question,
            outcome1,
            outcome2,
            creator,
            resolutionTime,
            bondingCurve,
            1 ether  // Default curve params (1 ETH base price for mock curve)
        );

        return address(market);
    }

    function _storeMarketData(
        address marketAddress,
        address creator,
        uint256 resolutionTime,
        bytes32 category,
        uint256 bondAmount
    ) private {
        // Track bond
        heldBonds[marketAddress] = bondAmount;
        _totalHeldBonds += bondAmount;

        // Store market data
        _marketData[marketAddress] = MarketData({
            creator: creator,
            createdAt: block.timestamp,
            resolutionTime: resolutionTime,
            category: category,
            isActive: true,
            exists: true,
            creatorBond: bondAmount
        });

        // Add to arrays
        _markets.push(marketAddress);
        _marketsByCreator[creator].push(marketAddress);
        _marketsByCategory[category].push(marketAddress);
        _activeMarketCount++;
    }

    function _getAccessControlManager() private view returns (IAccessControlManager) {
        IVersionedRegistry reg = IVersionedRegistry(registry);
        address accessControl = reg.getContract(keccak256("AccessControlManager"));
        return IAccessControlManager(accessControl);
    }
}