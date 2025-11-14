// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "../interfaces/IFlexibleMarketFactory.sol";
import "../interfaces/IVersionedRegistry.sol";
import "../interfaces/IAccessControlManager.sol";
import "../interfaces/IPredictionMarket.sol";
import "../interfaces/IMarket.sol";
import "../interfaces/IBondingCurve.sol";
import "../core/PredictionMarket.sol";
import "../core/MarketTemplateRegistry.sol";
import "../core/CurveRegistry.sol";

/**
 * @title FlexibleMarketFactory
 * @notice Factory for creating and managing prediction markets in KEKTECH 3.0
 * @dev Deploys PredictionMarket contracts with configurable parameters
 *
 * Core Features:
 * - Market creation with validation
 * - Template system for common market types
 * - Market enumeration and filtering
 * - Creator bond management
 * - Admin controls (pause/unpause)
 *
 * Gas Targets:
 * - createMarket: <2M gas (includes PredictionMarket deployment)
 * - enumeration functions: <50k gas
 *
 * Security:
 * - Role-based access control
 * - Reentrancy protection
 * - Input validation
 * - Emergency pause mechanism
 */
contract FlexibleMarketFactory is IFlexibleMarketFactory, ReentrancyGuard {
    // ============= State Variables =============

    /// @notice Reference to MasterRegistry
    address public immutable registry;

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

    /// @notice Mapping of template ID to template data
    mapping(bytes32 => Template) private _templates;

    /// @notice SECURITY FIX (M-3): Mapping of market to creator bond held in factory
    /// @dev Tracks actual ETH held for each market's creator bond
    mapping(address => uint256) private heldBonds;

    /// @notice CRITICAL FIX: Cache active market count to avoid unbounded loops
    /// @dev Updated on creation, activation, and deactivation
    uint256 private _activeMarketCount;

    /// @notice CRITICAL FIX: Cache total held bonds to avoid unbounded loops
    /// @dev Updated when bonds are received and refunded
    uint256 private _totalHeldBonds;

    // ============= Structs =============

    /// @notice Internal struct for market data
    struct MarketData {
        address creator;
        uint256 createdAt;
        uint256 resolutionTime;
        bytes32 category;
        bool isActive;
        bool exists;
        uint256 creatorBond;
        IFlexibleMarketFactory.CurveType curveType;      // DAY 6: Curve type for future use (Phase 3)
        uint256 curveParams;       // DAY 6: Packed curve parameters for future use
    }

    /// @notice Internal struct for templates
    struct Template {
        string name;
        bytes32 category;
        string outcome1;
        string outcome2;
        bool exists;
    }

    // ============= Constructor =============

    /**
     * @notice Constructor sets immutable registry and initial parameters
     * @param _registry MasterRegistry address
     * @param _minCreatorBond Minimum bond required for market creation
     */
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

    // ============= Core Functions =============

    /**
     * @notice Create a new prediction market
     * @param config Market configuration
     * @return marketAddress Address of created market
     */
    function createMarket(MarketConfig calldata config)
        external
        payable
        nonReentrant
        whenNotPaused
        returns (address marketAddress)
    {
        // Validate config
        _validateMarketConfig(config);

        // Check bond
        if (msg.value < config.creatorBond || msg.value < minCreatorBond) {
            revert InsufficientBond();
        }

        // Deploy new PredictionMarket
        PredictionMarket market = new PredictionMarket();

        // PHASE 3: Get default LMSR curve from registry
        CurveRegistry curveRegistry = _getCurveRegistry();
        address lmsrCurve = curveRegistry.getCurveByName("LMSRCurve");
        uint256 defaultParams = 100 * 1e18;  // Default b = 100 BASED for LMSR

        // Initialize market with bonding curve (PHASE 3: Added curve parameters)
        market.initialize(
            registry,
            config.question,
            config.outcome1,
            config.outcome2,
            msg.sender,
            config.resolutionTime,
            lmsrCurve,         // PHASE 3: Default to LMSR curve
            defaultParams      // PHASE 3: Default b = 100 BASED
        );

        marketAddress = address(market);

        // SECURITY FIX (M-3): Track actual ETH received as bond
        heldBonds[marketAddress] = msg.value;
        _totalHeldBonds += msg.value; // CRITICAL FIX: Track total

        // Store market data
        _marketData[marketAddress] = MarketData({
            creator: msg.sender,
            createdAt: block.timestamp,
            resolutionTime: config.resolutionTime,
            category: config.category,
            isActive: true,
            exists: true,
            creatorBond: msg.value,  // SECURITY FIX: Use actual amount received, not config value
            curveType: CurveType.LMSR,  // DAY 6: Default to LMSR
            curveParams: 100 * 1e18      // DAY 6: Default b = 100 BASED
        });

        // Add to arrays
        _markets.push(marketAddress);
        _marketsByCreator[msg.sender].push(marketAddress);
        _marketsByCategory[config.category].push(marketAddress);
        _activeMarketCount++; // CRITICAL FIX: Track active count

        emit MarketCreated(
            marketAddress,
            msg.sender,
            config.question,
            config.resolutionTime,
            config.creatorBond,
            config.category,
            block.timestamp
        );

        return marketAddress;
    }

    /**
     * @notice Create market from template
     * @param templateId Template to use
     * @param question Market question
     * @param resolutionTime Resolution timestamp
     * @return marketAddress Address of created market
     */
    function createMarketFromTemplate(
        bytes32 templateId,
        string calldata question,
        uint256 resolutionTime
    )
        external
        payable
        nonReentrant
        whenNotPaused
        returns (address marketAddress)
    {
        Template memory template = _templates[templateId];
        if (!template.exists) revert TemplateNotFound(templateId);

        // Create config from template
        MarketConfig memory config = MarketConfig({
            question: question,
            description: template.name,
            resolutionTime: resolutionTime,
            creatorBond: minCreatorBond,
            category: template.category,
            outcome1: template.outcome1,
            outcome2: template.outcome2
        });

        // Validate and create
        _validateMarketConfig(config);

        if (msg.value < minCreatorBond) {
            revert InsufficientBond();
        }

        // Deploy new PredictionMarket
        PredictionMarket market = new PredictionMarket();

        // PHASE 3: Get default LMSR curve from registry
        CurveRegistry curveRegistry = _getCurveRegistry();
        address lmsrCurve = curveRegistry.getCurveByName("LMSRCurve");
        uint256 defaultParams = 100 * 1e18;  // Default b = 100 BASED for LMSR

        // Initialize market with bonding curve (PHASE 3: Added curve parameters)
        market.initialize(
            registry,
            config.question,
            config.outcome1,
            config.outcome2,
            msg.sender,
            config.resolutionTime,
            lmsrCurve,         // PHASE 3: Default to LMSR curve
            defaultParams      // PHASE 3: Default b = 100 BASED
        );

        marketAddress = address(market);

        // SECURITY FIX (M-3): Track actual ETH received as bond
        heldBonds[marketAddress] = msg.value;
        _totalHeldBonds += msg.value; // CRITICAL FIX: Track total

        // Store market data
        _marketData[marketAddress] = MarketData({
            creator: msg.sender,
            createdAt: block.timestamp,
            resolutionTime: resolutionTime,
            category: template.category,
            isActive: true,
            exists: true,
            creatorBond: msg.value,  // SECURITY FIX: Use actual amount received
            curveType: CurveType.LMSR,  // DAY 6: Default to LMSR
            curveParams: 100 * 1e18      // DAY 6: Default b = 100 BASED
        });

        // Add to arrays
        _markets.push(marketAddress);
        _marketsByCreator[msg.sender].push(marketAddress);
        _marketsByCategory[template.category].push(marketAddress);
        _activeMarketCount++; // CRITICAL FIX: Track active count

        emit MarketCreated(
            marketAddress,
            msg.sender,
            question,
            resolutionTime,
            minCreatorBond,
            template.category,
            block.timestamp
        );

        return marketAddress;
    }

    /**
     * @notice Create market using template from MarketTemplateRegistry (NEW - Cloning)
     * @param templateId Template identifier from registry
     * @param question Market question
     * @param outcome1 First outcome name
     * @param outcome2 Second outcome name
     * @param resolutionTime Resolution timestamp
     * @param feePercent Fee percentage in basis points (e.g., 1000 = 10%)
     * @return marketAddress Address of cloned market
     * @dev Uses EIP-1167 minimal proxy cloning for 96% gas savings
     */
    function createMarketFromTemplateRegistry(
        bytes32 templateId,
        string calldata question,
        string calldata outcome1,
        string calldata outcome2,
        uint256 resolutionTime,
        uint256 feePercent
    )
        external
        payable
        nonReentrant
        whenNotPaused
        returns (address marketAddress)
    {
        // Validate inputs
        if (resolutionTime <= block.timestamp) {
            revert InvalidMarketConfig();
        }
        if (msg.value < minCreatorBond) {
            revert InsufficientBond();
        }

        // Get template from registry
        MarketTemplateRegistry templateRegistry = MarketTemplateRegistry(
            IVersionedRegistry(registry).getContract(keccak256("MarketTemplateRegistry"))
        );
        address implementation = templateRegistry.getTemplate(templateId);

        // Clone the implementation using EIP-1167 (cheap!)
        marketAddress = Clones.clone(implementation);

        // Encode initialization data
        bytes memory initData = abi.encode(
            question,
            outcome1,
            outcome2,
            msg.sender,
            resolutionTime,
            feePercent
        );

        // Initialize the cloned market
        IMarket(marketAddress).initialize(registry, initData);

        // Track creator bond
        heldBonds[marketAddress] = msg.value;
        _totalHeldBonds += msg.value; // CRITICAL FIX: Track total

        // Store market data (use empty category for template-based markets)
        _marketData[marketAddress] = MarketData({
            creator: msg.sender,
            createdAt: block.timestamp,
            resolutionTime: resolutionTime,
            category: templateId, // Use templateId as category
            isActive: true,
            exists: true,
            creatorBond: msg.value,
            curveType: CurveType.LMSR,  // DAY 6: Default to LMSR
            curveParams: 100 * 1e18      // DAY 6: Default b = 100 BASED
        });

        // Add to arrays
        _markets.push(marketAddress);
        _marketsByCreator[msg.sender].push(marketAddress);
        _marketsByCategory[templateId].push(marketAddress);
        _activeMarketCount++; // CRITICAL FIX: Track active count

        emit MarketCreated(
            marketAddress,
            msg.sender,
            question,
            resolutionTime,
            msg.value,
            templateId,
            block.timestamp
        );

        return marketAddress;
    }

    // ============= Market Management =============

    /**
     * @notice Activate a market
     * @param marketAddress Market to activate
     */
    function activateMarket(address marketAddress) external onlyAdmin {
        MarketData storage data = _marketData[marketAddress];
        if (!data.exists) revert MarketNotFound(marketAddress);

        // CRITICAL FIX: Increment count only if currently inactive
        if (!data.isActive) {
            _activeMarketCount++;
        }

        data.isActive = true;
        emit MarketActivated(marketAddress, block.timestamp);
    }

    /**
     * @notice Deactivate a market
     * @param marketAddress Market to deactivate
     * @param reason Reason for deactivation
     */
    function deactivateMarket(address marketAddress, string calldata reason)
        external
        onlyAdmin
    {
        MarketData storage data = _marketData[marketAddress];
        if (!data.exists) revert MarketNotFound(marketAddress);

        // CRITICAL FIX: Decrement count only if currently active
        if (data.isActive) {
            _activeMarketCount--;
        }

        data.isActive = false;
        emit MarketDeactivated(marketAddress, reason, block.timestamp);
    }

    /**
     * @notice Refund creator bond
     * @param marketAddress Market to refund bond for
     * @dev SECURITY FIX (H-2): Prevents double-spend by zeroing state before transfer
     * Uses heldBonds mapping as source of truth for actual ETH held
     */
    function refundCreatorBond(address marketAddress) external onlyAdmin nonReentrant {
        MarketData storage data = _marketData[marketAddress];
        if (!data.exists) revert MarketNotFound(marketAddress);

        // SECURITY FIX: Use tracked bond amount (more accurate than stored value)
        uint256 bondAmount = heldBonds[marketAddress];
        if (bondAmount == 0) revert InvalidBondAmount(); // Already refunded or never had bond

        address creator = data.creator;

        // CRITICAL SECURITY FIX (H-2): Zero out state BEFORE transfer
        // This prevents double-spend AND reentrancy attacks
        heldBonds[marketAddress] = 0;
        data.creatorBond = 0;
        _totalHeldBonds -= bondAmount; // CRITICAL FIX: Update total

        // Transfer bond back to creator
        (bool success, ) = creator.call{value: bondAmount}("");
        if (!success) revert InvalidMarketConfig(); // Transfer failed

        emit CreatorBondRefunded(marketAddress, creator, bondAmount, block.timestamp);
    }

    // ============= Template Management =============

    /**
     * @notice Create a market template
     * @param templateId Unique template identifier
     * @param name Template name
     * @param category Market category
     * @param outcome1 First outcome option
     * @param outcome2 Second outcome option
     */
    function createTemplate(
        bytes32 templateId,
        string calldata name,
        bytes32 category,
        string calldata outcome1,
        string calldata outcome2
    ) external onlyAdmin {
        if (_templates[templateId].exists) revert InvalidTemplate();
        if (category == bytes32(0)) revert InvalidCategory();

        _templates[templateId] = Template({
            name: name,
            category: category,
            outcome1: outcome1,
            outcome2: outcome2,
            exists: true
        });

        emit TemplateCreated(templateId, name, block.timestamp);
    }

    /**
     * @notice Get template data
     * @param templateId Template identifier
     * @return name Template name
     * @return category Market category
     * @return outcome1 First outcome
     * @return outcome2 Second outcome
     */
    function getTemplate(bytes32 templateId)
        external
        view
        returns (
            string memory name,
            bytes32 category,
            string memory outcome1,
            string memory outcome2
        )
    {
        Template memory template = _templates[templateId];
        if (!template.exists) revert TemplateNotFound(templateId);

        return (template.name, template.category, template.outcome1, template.outcome2);
    }

    // ============= Enumeration =============

    /**
     * @notice Get total number of markets
     * @return Total market count
     */
    function getMarketCount() external view returns (uint256) {
        return _markets.length;
    }

    /**
     * @notice Get market at specific index
     * @param index Index to query
     * @return Market address
     */
    function getMarketAt(uint256 index) external view returns (address) {
        if (index >= _markets.length) revert MarketNotFound(address(0));
        return _markets[index];
    }

    /**
     * @notice Get all markets
     * @return Array of all market addresses
     */
    function getAllMarkets() external view returns (address[] memory) {
        return _markets;
    }

    /**
     * @notice CRITICAL FIX: Get active markets with pagination
     * @param offset Starting index for pagination
     * @param limit Maximum number of markets to return
     * @return markets Array of active market addresses
     * @return total Total number of active markets
     * @dev Gas-efficient pagination prevents DoS from unbounded loops
     * @dev Use offset=0, limit=100 for first page, offset=100, limit=100 for second page, etc.
     */
    function getActiveMarkets(
        uint256 offset,
        uint256 limit
    ) external view returns (
        address[] memory markets,
        uint256 total
    ) {
        // Return cached total count (O(1) instead of O(n))
        total = _activeMarketCount;

        // Handle edge cases
        if (offset >= total) {
            return (new address[](0), total);
        }

        // Calculate actual return size
        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }
        uint256 returnSize = end - offset;

        // Allocate return array
        markets = new address[](returnSize);
        uint256 currentIndex = 0;
        uint256 foundCount = 0;

        // GAS OPTIMIZATION: Cache array length
        uint256 marketsLength = _markets.length;

        // Iterate with bounds
        for (uint256 i = 0; i < marketsLength && foundCount < end; i++) {
            if (_marketData[_markets[i]].isActive) {
                // Skip markets before offset
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
     * @notice Get ALL active markets (DEPRECATED - use pagination instead)
     * @return Array of active market addresses
     * @dev WARNING: This function can run out of gas with many markets
     * @dev Use getActiveMarkets(offset, limit) instead for production
     * @dev Kept for interface compatibility
     */
    function getActiveMarkets() external view returns (address[] memory) {
        // Build array using cached count
        address[] memory activeMarkets = new address[](_activeMarketCount);
        uint256 currentIndex = 0;

        // GAS OPTIMIZATION: Cache array length
        uint256 marketsLength = _markets.length;

        for (uint256 i = 0; i < marketsLength; i++) {
            if (_marketData[_markets[i]].isActive) {
                activeMarkets[currentIndex] = _markets[i];
                currentIndex++;
            }
        }

        return activeMarkets;
    }

    /**
     * @notice Get markets by creator
     * @param creator Creator address
     * @return Array of market addresses
     */
    function getMarketsByCreator(address creator) external view returns (address[] memory) {
        return _marketsByCreator[creator];
    }

    /**
     * @notice Get markets by category
     * @param category Category identifier
     * @return Array of market addresses
     */
    function getMarketsByCategory(bytes32 category) external view returns (address[] memory) {
        return _marketsByCategory[category];
    }

    // ============= Market Info =============

    /**
     * @notice Get market information
     * @param marketAddress Market to query
     * @return info Market information struct
     */
    function getMarketInfo(address marketAddress)
        external
        view
        returns (MarketInfo memory info)
    {
        MarketData memory data = _marketData[marketAddress];
        if (!data.exists) revert MarketNotFound(marketAddress);

        return MarketInfo({
            marketAddress: marketAddress,
            creator: data.creator,
            createdAt: data.createdAt,
            resolutionTime: data.resolutionTime,
            category: data.category,
            isActive: data.isActive,
            totalVolume: IPredictionMarket(marketAddress).totalVolume()
        });
    }

    /**
     * @notice Check if market is active
     * @param marketAddress Market to check
     * @return True if active
     */
    function isMarketActive(address marketAddress) external view returns (bool) {
        return _marketData[marketAddress].isActive;
    }

    /**
     * @notice Get market creator
     * @param marketAddress Market to query
     * @return Creator address
     */
    function getMarketCreator(address marketAddress) external view returns (address) {
        return _marketData[marketAddress].creator;
    }

    /**
     * @notice SECURITY FIX (M-3): Get held bond for a specific market
     * @param marketAddress Market to query
     * @return Bond amount currently held in factory for this market
     * @dev Returns 0 if bond was refunded or market doesn't exist
     */
    function getHeldBond(address marketAddress) external view returns (uint256) {
        return heldBonds[marketAddress];
    }

    /**
     * @notice CRITICAL FIX: Get total bonds held by factory (O(1) cached value)
     * @return Total ETH held as creator bonds across all markets
     * @dev Gas-efficient O(1) lookup instead of O(n) loop
     * @dev Use this to verify factory balance matches accounting
     */
    function getTotalHeldBonds() external view returns (uint256) {
        return _totalHeldBonds;
    }

    /**
     * @notice Get active market count (O(1) cached value)
     * @return Number of currently active markets
     * @dev Gas-efficient alternative to counting in loops
     */
    function getActiveMarketCount() external view returns (uint256) {
        return _activeMarketCount;
    }

    // ============= Admin Functions =============

    /**
     * @notice Pause factory
     */
    function pause() external onlyAdmin {
        paused = true;
        emit FactoryPaused(true);
    }

    /**
     * @notice Unpause factory
     */
    function unpause() external onlyAdmin {
        paused = false;
        emit FactoryPaused(false);
    }

    /**
     * @notice Update minimum creator bond
     * @param newMinBond New minimum bond amount
     */
    function updateMinBond(uint256 newMinBond) external onlyAdmin {
        minCreatorBond = newMinBond;
    }

    // ============= Internal Helpers =============

    /**
     * @notice Validate market configuration
     * @param config Configuration to validate
     */
    function _validateMarketConfig(MarketConfig memory config) private view {
        // HIGH FIX (H-1): Validate string lengths to prevent contract size exceeded errors
        // EVM enforces 24KB contract size limit (EIP-170)
        if (bytes(config.question).length == 0) revert InvalidQuestion();
        if (bytes(config.question).length > 500) revert InvalidQuestion(); // Max 500 chars
        if (bytes(config.description).length > 2000) revert InvalidQuestion(); // Max 2000 chars
        if (bytes(config.outcome1).length == 0 || bytes(config.outcome1).length > 100) revert InvalidQuestion();
        if (bytes(config.outcome2).length == 0 || bytes(config.outcome2).length > 100) revert InvalidQuestion();

        if (config.resolutionTime <= block.timestamp) revert InvalidResolutionTime();

        // MEDIUM FIX: Prevent markets with extremely far future resolution times
        // Maximum 1 year in the future (31536000 seconds) - reduced from 2 years
        uint256 MAX_RESOLUTION_PERIOD = 31536000; // 1 year
        if (config.resolutionTime > block.timestamp + MAX_RESOLUTION_PERIOD) {
            revert InvalidResolutionTime();
        }

        if (config.category == bytes32(0)) revert InvalidCategory();
        if (config.creatorBond < minCreatorBond) revert InvalidBondAmount();
    }

    /**
     * @notice Get AccessControlManager from registry
     * @return AccessControlManager interface
     */
    function _getAccessControlManager() private view returns (IAccessControlManager) {
        IVersionedRegistry reg = IVersionedRegistry(registry);
        address accessControl = reg.getContract(keccak256("AccessControlManager"));
        return IAccessControlManager(accessControl);
    }

    // ============= DAY 6: Bonding Curve Infrastructure =============

    /**
     * @notice Get CurveRegistry from MasterRegistry
     * @return CurveRegistry interface
     * @dev Phase 2 (Day 6): Infrastructure for curve validation
     */
    function _getCurveRegistry() private view returns (CurveRegistry) {
        IVersionedRegistry reg = IVersionedRegistry(registry);
        address curveRegistry = reg.getContract(keccak256("CurveRegistry"));
        return CurveRegistry(curveRegistry);
    }

    /**
     * @notice Validate curve configuration
     * @param curveType Type of bonding curve
     * @param curveParams Packed curve parameters
     * @return curveAddress Address of the curve contract
     * @dev Phase 2 (Day 6): Validates curve exists in registry
     * @dev Phase 3: Will add parameter validation via curve interface
     */
    function _validateCurveConfig(
        IFlexibleMarketFactory.CurveType curveType,
        uint256 curveParams
    ) private view returns (address curveAddress) {
        // Get CurveRegistry
        CurveRegistry curveRegistry = _getCurveRegistry();

        // Map enum to curve name string (must match curveName() from curve contracts)
        string memory curveName;
        if (curveType == IFlexibleMarketFactory.CurveType.LMSR) {
            curveName = "LMSR (Logarithmic Market Scoring Rule)";
        } else if (curveType == IFlexibleMarketFactory.CurveType.LINEAR) {
            curveName = "LinearCurve";
        } else if (curveType == IFlexibleMarketFactory.CurveType.EXPONENTIAL) {
            curveName = "ExponentialCurve";
        } else if (curveType == IFlexibleMarketFactory.CurveType.SIGMOID) {
            curveName = "SigmoidCurve";
        } else {
            revert IFlexibleMarketFactory.InvalidCurveType();
        }

        // Get curve address by name
        curveAddress = curveRegistry.getCurveByName(curveName);

        // Verify curve exists and is active
        if (curveAddress == address(0)) {
            revert IFlexibleMarketFactory.InvalidCurveType();
        }

        (bool isRegistered, bool isActive) = curveRegistry.isCurveActive(curveAddress);
        if (!isRegistered || !isActive) {
            revert IFlexibleMarketFactory.InvalidCurveType();
        }

        // Validate parameters
        if (curveParams == 0) {
            revert IFlexibleMarketFactory.InvalidCurveParams();
        }

        return curveAddress;
    }

    /**
     * @notice Create market with specific bonding curve configuration
     * @param config Market configuration
     * @param curveType Type of bonding curve to use
     * @param curveParams Packed curve parameters (format depends on curve type)
     * @return marketAddress Address of created market
     * @dev Phase 2 (Day 6): Stores curve config for future use in Phase 3
     * @dev Does NOT use curves for pricing yet - that's Phase 3 integration
     */
    function createMarketWithCurve(
        MarketConfig calldata config,
        IFlexibleMarketFactory.CurveType curveType,
        uint256 curveParams
    )
        external
        payable
        nonReentrant
        whenNotPaused
        returns (address marketAddress)
    {
        // Validate market config (existing)
        _validateMarketConfig(config);

        // Validate curve config (new)
        address curveAddress = _validateCurveConfig(curveType, curveParams);

        // Check bond (existing)
        if (msg.value < config.creatorBond || msg.value < minCreatorBond) {
            revert InsufficientBond();
        }

        // Deploy new PredictionMarket (existing - no changes yet)
        PredictionMarket market = new PredictionMarket();

        // Initialize market with bonding curve (PHASE 3: Added curve parameters)
        market.initialize(
            registry,
            config.question,
            config.outcome1,
            config.outcome2,
            msg.sender,
            config.resolutionTime,
            curveAddress,    // PHASE 3: Bonding curve address
            curveParams      // PHASE 3: Curve-specific parameters
        );

        marketAddress = address(market);

        // HIGH FIX (H-1): Validate deployed contract size
        // EVM enforces 24KB (24576 bytes) contract size limit
        uint256 contractSize;
        assembly {
            contractSize := extcodesize(marketAddress)
        }
        if (contractSize == 0 || contractSize >= 24576) {
            revert InvalidMarketConfig(); // Contract too large or deployment failed
        }

        // SECURITY FIX (M-3): Track actual ETH received as bond
        heldBonds[marketAddress] = msg.value;
        _totalHeldBonds += msg.value; // CRITICAL FIX: Track total

        // Store market data WITH curve configuration
        _marketData[marketAddress] = MarketData({
            creator: msg.sender,
            createdAt: block.timestamp,
            resolutionTime: config.resolutionTime,
            category: config.category,
            isActive: true,
            exists: true,
            creatorBond: msg.value,
            curveType: curveType,      // DAY 6: Store curve type
            curveParams: curveParams    // DAY 6: Store curve params
        });

        // Add to arrays (existing)
        _markets.push(marketAddress);
        _marketsByCreator[msg.sender].push(marketAddress);
        _marketsByCategory[config.category].push(marketAddress);
        _activeMarketCount++; // CRITICAL FIX: Track active count

        // Emit specialized event with curve info
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

    // ============= DAY 6: Curve Info Getters =============

    /**
     * @notice Get curve configuration for a market
     * @param marketAddress Market to query
     * @return curveType Type of bonding curve
     * @return curveParams Packed curve parameters
     * @dev Phase 2 (Day 6): Returns stored curve config
     */
    function getMarketCurveConfig(address marketAddress)
        external
        view
        returns (IFlexibleMarketFactory.CurveType curveType, uint256 curveParams)
    {
        MarketData memory data = _marketData[marketAddress];
        if (!data.exists) revert MarketNotFound(marketAddress);

        return (data.curveType, data.curveParams);
    }
}
