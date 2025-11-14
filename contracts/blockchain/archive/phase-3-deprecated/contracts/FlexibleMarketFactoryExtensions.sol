// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "../interfaces/IFlexibleMarketFactory.sol";
import "../interfaces/IVersionedRegistry.sol";
import "../interfaces/IAccessControlManager.sol";
import "../interfaces/IMarket.sol";
import "./MarketTemplateRegistry.sol";
import "./CurveRegistry.sol";
import "./FlexibleMarketFactoryCore.sol";

/**
 * @title FlexibleMarketFactoryExtensions
 * @notice Extensions for advanced market creation features
 * @dev Day 9 Split: Template and curve features under 24KB limit
 *
 * This contract contains:
 * - Template-based market creation
 * - Bonding curve integration
 * - Advanced market creation methods
 *
 * Works with FlexibleMarketFactoryCore for state storage
 */
contract FlexibleMarketFactoryExtensions is ReentrancyGuard {
    // ============= State Variables (Minimal) =============

    /// @notice Reference to Core factory contract
    address public immutable factoryCore;

    /// @notice Reference to MasterRegistry
    address public immutable registry;

    /// @notice Template storage (only state in Extensions)
    mapping(bytes32 => Template) private _templates;

    // ============= Structs =============

    struct Template {
        string name;
        bytes32 category;
        string outcome1;
        string outcome2;
        bool exists;
    }

    // No need to redefine - will convert when calling Core

    // ============= Events =============

    event TemplateCreated(bytes32 indexed templateId, string name, uint256 timestamp);

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

    // ============= Errors =============

    error UnauthorizedAccess(address caller);
    error InvalidMarketConfig();
    error InvalidResolutionTime();
    error InvalidBondAmount();
    error InvalidCategory();
    error InsufficientBond();
    error ContractPaused();
    error TemplateNotFound(bytes32 templateId);
    error InvalidTemplate();
    error InvalidCurveType();
    error InvalidCurveParams();

    // ============= Constructor =============

    constructor(address _factoryCore, address _registry) {
        if (_factoryCore == address(0) || _registry == address(0)) {
            revert InvalidMarketConfig();
        }
        factoryCore = _factoryCore;
        registry = _registry;
    }

    // ============= Modifiers =============

    modifier onlyAdmin() {
        IAccessControlManager accessControl = _getAccessControlManager();
        if (!accessControl.hasRole(keccak256("ADMIN_ROLE"), msg.sender)) {
            revert UnauthorizedAccess(msg.sender);
        }
        _;
    }

    modifier whenNotPaused() {
        // Check if Core factory is paused
        if (FlexibleMarketFactoryCore(factoryCore).paused()) {
            revert ContractPaused();
        }
        _;
    }

    // ============= Template Management =============

    /**
     * @notice Create a market template
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

    // ============= Template-Based Market Creation =============

    /**
     * @notice Create market from template
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

        uint256 minBond = FlexibleMarketFactoryCore(factoryCore).minCreatorBond();
        if (msg.value < minBond) {
            revert InsufficientBond();
        }

        // Create config from template (using Interface struct)
        IFlexibleMarketFactory.MarketConfig memory config = IFlexibleMarketFactory.MarketConfig({
            question: question,
            description: template.name,
            resolutionTime: resolutionTime,
            creatorBond: minBond,
            category: template.category,
            outcome1: template.outcome1,
            outcome2: template.outcome2
        });

        // Call Core to create market
        marketAddress = IFlexibleMarketFactory(factoryCore).createMarket{
            value: msg.value
        }(config);

        return marketAddress;
    }

    /**
     * @notice Create market using template from MarketTemplateRegistry
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
            revert InvalidResolutionTime();
        }

        uint256 minBond = FlexibleMarketFactoryCore(factoryCore).minCreatorBond();
        if (msg.value < minBond) {
            revert InsufficientBond();
        }

        // Get template from registry
        MarketTemplateRegistry templateRegistry = MarketTemplateRegistry(
            IVersionedRegistry(registry).getContract(keccak256("MarketTemplateRegistry"))
        );
        address implementation = templateRegistry.getTemplate(templateId);

        // Clone the implementation using EIP-1167
        address clonedMarket = Clones.clone(implementation);

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
        IMarket(clonedMarket).initialize(registry, initData);

        // Note: For cloned markets, we track them differently
        // The Core factory won't know about these, but they still work
        // This is a trade-off for the split architecture

        return clonedMarket;
    }

    // ============= Bonding Curve Market Creation =============

    /**
     * @notice Create market with specific bonding curve (delegated to Core)
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
        // Simply delegate to Core's implementation
        marketAddress = IFlexibleMarketFactory(factoryCore).createMarketWithCurve{
            value: msg.value
        }(config, curveType, curveParams);

        // Emit specialized event
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

    // ============= Curve Helpers =============

    function _getCurveRegistry() private view returns (CurveRegistry) {
        IVersionedRegistry reg = IVersionedRegistry(registry);
        address curveRegistry = reg.getContract(keccak256("CurveRegistry"));
        return CurveRegistry(curveRegistry);
    }

    function _validateCurveConfig(
        IFlexibleMarketFactory.CurveType curveType,
        uint256 curveParams
    ) private view returns (address curveAddress) {
        // Get CurveRegistry
        CurveRegistry curveRegistry = _getCurveRegistry();

        // Map enum to curve name
        string memory curveName;
        if (curveType == IFlexibleMarketFactory.CurveType.LMSR) {
            curveName = "LMSRCurve";
        } else if (curveType == IFlexibleMarketFactory.CurveType.LINEAR) {
            curveName = "LinearCurve";
        } else if (curveType == IFlexibleMarketFactory.CurveType.EXPONENTIAL) {
            curveName = "ExponentialCurve";
        } else if (curveType == IFlexibleMarketFactory.CurveType.SIGMOID) {
            curveName = "SigmoidCurve";
        } else {
            revert InvalidCurveType();
        }

        // Get curve address
        curveAddress = curveRegistry.getCurveByName(curveName);
        if (curveAddress == address(0)) {
            revert InvalidCurveType();
        }

        // Verify curve is active
        (bool isRegistered, bool isActive) = curveRegistry.isCurveActive(curveAddress);
        if (!isRegistered || !isActive) {
            revert InvalidCurveType();
        }

        // Validate parameters
        if (curveParams == 0) {
            revert InvalidCurveParams();
        }

        return curveAddress;
    }

    function _getAccessControlManager() private view returns (IAccessControlManager) {
        IVersionedRegistry reg = IVersionedRegistry(registry);
        address accessControl = reg.getContract(keccak256("AccessControlManager"));
        return IAccessControlManager(accessControl);
    }

    // ============= Advanced Getters (Delegated to Core) =============

    /**
     * @notice Get curve configuration for a market
     * @dev In this architecture, curves aren't fully integrated
     * This is a placeholder for future implementation
     */
    function getMarketCurveConfig(address)
        external
        pure
        returns (IFlexibleMarketFactory.CurveType curveType, uint256 curveParams)
    {
        // Default return for now
        return (IFlexibleMarketFactory.CurveType.LMSR, 100 * 1e18);
    }
}