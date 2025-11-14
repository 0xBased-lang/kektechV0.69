// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "../interfaces/IFlexibleMarketFactory.sol";
import "../interfaces/IVersionedRegistry.sol";
import "../interfaces/IAccessControlManager.sol";
import "../interfaces/IPredictionMarket.sol";
import "../interfaces/ICurveRegistry.sol";
import "../libraries/CurveMarketLogic.sol";
import "../libraries/TemplateMarketLogic.sol";

/**
 * @title FlexibleMarketFactoryUnified
 * @notice Unified factory for creating and managing prediction markets with approval system
 * @dev Phase 1: Combines Core + Extensions + NEW Approval System with internal libraries
 *
 * Architecture:
 * - Uses CurveMarketLogic for bonding curve markets (reduces bytecode)
 * - Uses TemplateMarketLogic for template-based markets (reduces bytecode)
 * - Implements 6-state lifecycle: PROPOSED → APPROVED → ACTIVE → RESOLVING → DISPUTED → FINALIZED
 * - Approval system: Off-chain likes → on-chain approval (backend) + admin override
 *
 * Key Features:
 * - Basic market creation (createMarket)
 * - Template-based creation (createMarketWithTemplate)
 * - Curve-based creation (createMarketWithCurve)
 * - Approval workflow (approveMarket, adminApproveMarket, adminRejectMarket)
 * - Market activation (activateMarket)
 * - Admin controls (pause/unpause, bond refunds)
 *
 * Gas Targets:
 * - createMarket: <2M gas
 * - Bytecode size: <24KB (TARGET: ~22KB with libraries)
 *
 * @custom:security-contact security@kektech.com
 */
contract FlexibleMarketFactoryUnified is ReentrancyGuard {

    // ============= TYPE DEFINITIONS =============

    using CurveMarketLogic for address;
    using TemplateMarketLogic for address;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant BACKEND_ROLE = keccak256("BACKEND_ROLE");

    // ============= ENUMS =============

    /// @notice Supported bonding curve types
    enum CurveType {
        LMSR,        // Logarithmic Market Scoring Rule
        LINEAR,      // Linear pricing curve
        EXPONENTIAL, // Exponential growth curve
        SIGMOID      // S-curve pricing
    }

    // ============= PUBLIC STRUCTS =============

    /// @notice Market configuration for creation
    struct MarketConfig {
        string question;           // Market question
        string description;        // Detailed description
        uint256 resolutionTime;    // When market can be resolved
        uint256 creatorBond;       // Bond amount from creator
        bytes32 category;          // Market category
        string outcome1;           // First outcome option
        string outcome2;           // Second outcome option
    }

    // ============= STATE VARIABLES =============

    /// @notice Reference to MasterRegistry
    address public immutable registry;

    /// @notice Minimum creator bond required
    uint256 public minCreatorBond;

    /// @notice Whether factory is paused
    bool public paused;

    /// @notice Default bonding curve for basic markets (CRITICAL FIX for betting)
    /// @dev Set via setDefaultCurve() - markets need curve to calculate share prices
    address public defaultCurve;

    /// @notice Array of all created markets
    address[] private _markets;

    /// @notice Mapping of market address to market data
    mapping(address => MarketData) private _marketData;

    /// @notice Mapping of market address to approval data (NEW)
    mapping(address => ApprovalData) private _approvalData;

    /// @notice Mapping of creator to their markets
    mapping(address => address[]) private _marketsByCreator;

    /// @notice Mapping of category to markets
    mapping(address => bool) public isMarket;

    /// @notice Mapping of market to creator bond held
    mapping(address => uint256) private heldBonds;

    /// @notice Cache active market count
    uint256 private _activeMarketCount;

    /// @notice Cache total held bonds
    uint256 private _totalHeldBonds;

    // ============= STRUCTS =============

    struct MarketData {
        address creator;
        uint256 createdAt;
        uint256 resolutionTime;
        bytes32 category;
        bool isActive;
        bool exists;
        uint256 creatorBond;
    }

    /// @notice NEW: Approval system data
    struct ApprovalData {
        uint256 proposedAt;           // When market was proposed
        uint256 likesRequired;         // Likes needed for approval (from ParameterStorage)
        uint256 approvalDeadline;      // Deadline for automatic approval
        bool approved;                 // Whether market is approved
        bool rejected;                 // Whether market was rejected
        address approver;              // Who approved (backend or admin)
        uint256 approvedAt;            // When approved
    }

    // ============= EVENTS =============

    // Core market events
    event MarketCreated(
        address indexed marketAddress,
        address indexed creator,
        string question,
        uint256 resolutionTime,
        uint256 creatorBond,
        bytes32 indexed category,
        uint256 timestamp
    );

    event MarketActivated(
        address indexed marketAddress,
        uint256 timestamp
    );

    event MarketDeactivated(
        address indexed marketAddress,
        string reason,
        uint256 timestamp
    );

    event CreatorBondRefunded(
        address indexed marketAddress,
        address indexed creator,
        uint256 amount,
        string reason
    );

    event FactoryPaused(bool isPaused);

    // Approval system events
    event MarketProposed(
        address indexed market,
        address indexed creator,
        uint256 timestamp,
        uint256 likesRequired,
        uint256 approvalDeadline
    );

    event MarketApproved(
        address indexed market,
        address indexed approver,
        uint256 timestamp,
        bool isAdminOverride
    );

    event MarketRejected(
        address indexed market,
        address indexed rejector,
        string reason,
        uint256 timestamp
    );

    // ============= ERRORS =============

    // Core errors
    error UnauthorizedAccess(address caller);
    error InvalidMarketConfig();
    error InvalidResolutionTime();
    error InvalidBondAmount();
    error InvalidQuestion();
    error InvalidCategory();
    error MarketNotFound(address marketAddress);
    error InsufficientBond();
    error ContractPaused();

    // Approval system errors
    error MarketAlreadyApproved(address market);
    error MarketAlreadyRejected(address market);
    error MarketNotApproved(address market);
    error ApprovalDeadlinePassed(address market);
    error ThresholdNotMet(address market);

    // ============= CONSTRUCTOR =============

    constructor(address _registry, uint256 _minCreatorBond) {
        if (_registry == address(0)) revert InvalidMarketConfig();
        registry = _registry;
        minCreatorBond = _minCreatorBond;
        paused = false;
    }

    // ============= MODIFIERS =============

    modifier whenNotPaused() {
        if (paused) revert ContractPaused();
        _;
    }

    modifier onlyAdmin() {
        IAccessControlManager accessControl = _getAccessControlManager();
        if (!accessControl.hasRole(ADMIN_ROLE, msg.sender)) {
            revert UnauthorizedAccess(msg.sender);
        }
        _;
    }

    modifier onlyBackend() {
        IAccessControlManager accessControl = _getAccessControlManager();
        if (!accessControl.hasRole(BACKEND_ROLE, msg.sender)) {
            revert UnauthorizedAccess(msg.sender);
        }
        _;
    }

    modifier validMarket(address market) {
        if (!isMarket[market]) revert MarketNotFound(market);
        _;
    }

    // ============= CORE CREATION FUNCTIONS =============

    /**
     * @notice Create a new prediction market (basic creation)
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

        // Initialize approval system (NEW)
        _initializeApproval(marketAddress);

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
     * @notice Create market with bonding curve (uses CurveMarketLogic library)
     * @param config Market configuration
     * @param curveType Type of bonding curve
     * @param curveParams Packed curve parameters
     * @return marketAddress Address of created market
     */
    function createMarketWithCurve(
        MarketConfig calldata config,
        CurveType curveType,
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

        // Get curve address from registry based on curve type
        address curveAddress = _getCurveAddressForType(curveType);

        // Validate curve parameters using library
        CurveMarketLogic.validateCurveParams(
            curveAddress,
            msg.value, // initial liquidity
            minCreatorBond // minimum liquidity
        );

        // Create market using library
        address template = _getMarketTemplate();
        marketAddress = CurveMarketLogic.createCurveMarket(
            template,
            registry,
            curveAddress,
            config.question,
            config.outcome1,
            config.outcome2,
            msg.sender,
            config.resolutionTime,
            curveParams
        );

        // Store market data
        _storeMarketData(
            marketAddress,
            msg.sender,
            config.resolutionTime,
            config.category,
            msg.value
        );

        // Initialize approval
        _initializeApproval(marketAddress);

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
     * @notice Create market from template (uses TemplateMarketLogic library)
     * @param templateId Template identifier
     * @param question Market question
     * @param config Market configuration
     * @return marketAddress Address of created market
     */
    function createMarketWithTemplate(
        bytes32 templateId,
        string calldata question,
        MarketConfig calldata config
    )
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

        // Get template address (simplified - would lookup from TemplateRegistry)
        address templateAddress = _getMarketTemplate();

        // Validate template using library
        TemplateMarketLogic.validateTemplateParams(templateAddress, templateId);

        // Create market using library
        marketAddress = TemplateMarketLogic.createTemplateMarket(
            templateAddress,
            registry,
            templateId,
            question,
            msg.sender,
            config.resolutionTime,
            config.outcome1,
            config.outcome2
        );

        // Store data
        _storeMarketData(
            marketAddress,
            msg.sender,
            config.resolutionTime,
            config.category,
            msg.value
        );

        // Initialize approval
        _initializeApproval(marketAddress);

        emit MarketCreated(
            marketAddress,
            msg.sender,
            question,
            config.resolutionTime,
            msg.value,
            config.category,
            block.timestamp
        );

        return marketAddress;
    }

    // ============= NEW: APPROVAL SYSTEM FUNCTIONS =============

    /**
     * @notice Approve market after reaching like threshold (backend call)
     * @param market Market address to approve
     */
    function approveMarket(address market)
        external
        onlyBackend
        validMarket(market)
        nonReentrant
    {
        ApprovalData storage approval = _approvalData[market];

        // Validation
        if (approval.approved) revert MarketAlreadyApproved(market);
        if (approval.rejected) revert MarketAlreadyRejected(market);
        if (block.timestamp > approval.approvalDeadline) {
            revert ApprovalDeadlinePassed(market);
        }

        // Backend has verified off-chain that likes threshold is met
        // In production, backend would provide proof/signature

        // Approve market
        approval.approved = true;
        approval.approver = msg.sender;
        approval.approvedAt = block.timestamp;

        // PHASE 5: Transition market to APPROVED state
        IPredictionMarket(market).approve();

        emit MarketApproved(market, msg.sender, block.timestamp, false);
    }

    /**
     * @notice Admin override to approve market (bypass likes requirement)
     * @param market Market address to approve
     */
    function adminApproveMarket(address market)
        external
        onlyAdmin
        validMarket(market)
        nonReentrant
    {
        ApprovalData storage approval = _approvalData[market];

        // Check not already processed
        if (approval.approved) revert MarketAlreadyApproved(market);
        if (approval.rejected) revert MarketAlreadyRejected(market);

        // Admin override approval
        approval.approved = true;
        approval.approver = msg.sender;
        approval.approvedAt = block.timestamp;

        // PHASE 5: Transition market to APPROVED state
        IPredictionMarket(market).approve();

        emit MarketApproved(market, msg.sender, block.timestamp, true);
    }

    /**
     * @notice Admin reject market
     * @param market Market address to reject
     * @param reason Rejection reason
     */
    function adminRejectMarket(address market, string calldata reason)
        external
        onlyAdmin
        validMarket(market)
        nonReentrant
    {
        ApprovalData storage approval = _approvalData[market];

        // Validation
        if (approval.approved) revert MarketAlreadyApproved(market);
        if (approval.rejected) revert MarketAlreadyRejected(market);

        // Reject market
        approval.rejected = true;

        // PHASE 5: Call market.reject() to transition state to FINALIZED
        IPredictionMarket(market).reject(reason);

        emit MarketRejected(market, msg.sender, reason, block.timestamp);
    }

    /**
     * @notice Activate approved market (backend call after approval)
     * @param market Market address to activate
     */
    function activateMarket(address market)
        external
        onlyBackend
        validMarket(market)
        nonReentrant
    {
        MarketData storage data = _marketData[market];
        ApprovalData storage approval = _approvalData[market];

        // Validation
        if (!approval.approved) revert MarketNotApproved(market);
        if (data.isActive) return; // Already active

        // Activate market
        data.isActive = true;
        _activeMarketCount++;

        // PHASE 5: Transition market to ACTIVE state
        IPredictionMarket(market).activate();

        emit MarketActivated(market, block.timestamp);
    }

    // ============= ADMIN FUNCTIONS =============

    function deactivateMarket(address market, string calldata reason)
        external
        onlyAdmin
        validMarket(market)
    {
        MarketData storage data = _marketData[market];

        if (data.isActive) {
            data.isActive = false;
            _activeMarketCount--;
        }

        emit MarketDeactivated(market, reason, block.timestamp);
    }

    function refundCreatorBond(address market, string calldata reason)
        external
        onlyAdmin
        validMarket(market)
        nonReentrant
    {
        MarketData storage data = _marketData[market];
        uint256 bondAmount = heldBonds[market];

        if (bondAmount == 0) revert InvalidBondAmount();

        address creator = data.creator;

        // Zero out state BEFORE transfer (reentrancy protection)
        heldBonds[market] = 0;
        data.creatorBond = 0;
        _totalHeldBonds -= bondAmount;

        // Transfer bond
        (bool success, ) = creator.call{value: bondAmount}("");
        if (!success) revert InvalidMarketConfig();

        emit CreatorBondRefunded(market, creator, bondAmount, reason);
    }

    function setPaused(bool _paused) external onlyAdmin {
        paused = _paused;
        emit FactoryPaused(_paused);
    }

    function setMinCreatorBond(uint256 _minCreatorBond) external onlyAdmin {
        minCreatorBond = _minCreatorBond;
    }

    /**
     * @notice Set default bonding curve for basic markets
     * @param _defaultCurve Address of bonding curve contract (e.g., LMSRCurve)
     * @dev CRITICAL: Markets need bonding curve to calculate share prices for betting
     * @dev Set to address(0) to disable curve (markets won't support betting)
     */
    function setDefaultCurve(address _defaultCurve) external onlyAdmin {
        // Note: No validation - admin can set to address(0) if needed
        // Curve validation happens in PredictionMarket.initialize()
        defaultCurve = _defaultCurve;
    }

    // ============= VIEW FUNCTIONS =============

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

    function getMarketData(address market)
        external
        view
        validMarket(market)
        returns (MarketData memory)
    {
        return _marketData[market];
    }

    function getApprovalData(address market)
        external
        view
        validMarket(market)
        returns (ApprovalData memory)
    {
        return _approvalData[market];
    }

    function getActiveMarketCount() external view returns (uint256) {
        return _activeMarketCount;
    }

    // ============= INTERNAL FUNCTIONS =============

    function _validateMarketConfig(MarketConfig calldata config) internal view {
        if (bytes(config.question).length == 0) revert InvalidQuestion();
        if (bytes(config.question).length > 500) revert InvalidQuestion();
        if (config.resolutionTime <= block.timestamp) revert InvalidResolutionTime();
        if (config.category == bytes32(0)) revert InvalidCategory();
    }

    /// @notice Get curve address from registry based on curve type
    /// @param curveType The curve type enum value
    /// @return curveAddress Address of the curve contract
    function _getCurveAddressForType(CurveType curveType) internal view returns (address curveAddress) {
        // Get CurveRegistry from VersionedRegistry
        address curveRegistry = IVersionedRegistry(registry).getContract(keccak256("CurveRegistry"));
        require(curveRegistry != address(0), "CurveRegistry not found");

        // Map curve type to curve name and get from registry
        string memory curveName;
        if (curveType == CurveType.LMSR) {
            curveName = "LMSRCurve";
        } else if (curveType == CurveType.LINEAR) {
            curveName = "LinearCurve";
        } else if (curveType == CurveType.EXPONENTIAL) {
            curveName = "ExponentialCurve";
        } else if (curveType == CurveType.SIGMOID) {
            curveName = "SigmoidCurve";
        } else {
            revert("Unknown curve type");
        }

        // Get curve address from registry
        curveAddress = ICurveRegistry(curveRegistry).getCurveByName(curveName);
        require(curveAddress != address(0), "Curve not registered");
    }

    function _deployAndInitializeMarket(
        string calldata question,
        string calldata outcome1,
        string calldata outcome2,
        address creator,
        uint256 resolutionTime
    ) internal returns (address market) {

        // Get market template
        address template = _getMarketTemplate();

        // Clone template
        market = Clones.clone(template);

        // CRITICAL FIX: Use defaultCurve if set, otherwise address(0)
        // Markets need bonding curve to calculate share prices for betting
        address curveToUse = defaultCurve != address(0) ? defaultCurve : address(0);

        // Default LMSR parameter 'b' = 100 (stored as 100 * 10^18 for precision)
        // This provides balanced price discovery - not too sensitive, not too flat
        uint256 curveParams = curveToUse != address(0) ? 100 * 10**18 : 0;

        // Initialize with all required parameters
        IPredictionMarket(market).initialize(
            registry,
            question,
            outcome1,
            outcome2,
            creator,
            resolutionTime,
            curveToUse,
            curveParams
        );

        return market;
    }

    function _storeMarketData(
        address market,
        address creator,
        uint256 resolutionTime,
        bytes32 category,
        uint256 bond
    ) internal {

        _marketData[market] = MarketData({
            creator: creator,
            createdAt: block.timestamp,
            resolutionTime: resolutionTime,
            category: category,
            isActive: false, // Will be activated after approval
            exists: true,
            creatorBond: bond
        });

        _markets.push(market);
        isMarket[market] = true;
        _marketsByCreator[creator].push(market);
        heldBonds[market] = bond;
        _totalHeldBonds += bond;
    }

    function _initializeApproval(address market) internal {

        // Get approval parameters from ParameterStorage (if available)
        uint256 likesRequired = 10; // Default, should query from ParameterStorage
        uint256 approvalWindow = 24 hours; // Default, should query from ParameterStorage

        _approvalData[market] = ApprovalData({
            proposedAt: block.timestamp,
            likesRequired: likesRequired,
            approvalDeadline: block.timestamp + approvalWindow,
            approved: false,
            rejected: false,
            approver: address(0),
            approvedAt: 0
        });

        emit MarketProposed(
            market,
            msg.sender,
            block.timestamp,
            likesRequired,
            block.timestamp + approvalWindow
        );
    }

    function _getAccessControlManager() internal view returns (IAccessControlManager) {
        return IAccessControlManager(IVersionedRegistry(registry).getContract(keccak256("AccessControlManager")));
    }

    function _getMarketTemplate() internal view returns (address) {
        // Get PredictionMarket template from registry
        return IVersionedRegistry(registry).getContract(keccak256("PredictionMarketTemplate"));
    }

    // ============= FALLBACK =============

    receive() external payable {
        revert("Direct ETH transfers not allowed");
    }
}
