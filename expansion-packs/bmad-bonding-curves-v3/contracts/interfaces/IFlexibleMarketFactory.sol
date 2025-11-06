// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IFlexibleMarketFactory
 * @notice Interface for creating and managing prediction markets in KEKTECH 3.0
 * @dev Factory pattern for deploying PredictionMarket contracts
 */
interface IFlexibleMarketFactory {
    // ============= Structs =============

    struct MarketConfig {
        string question;           // Market question
        string description;        // Detailed description
        uint256 resolutionTime;    // When market can be resolved
        uint256 creatorBond;       // Bond amount from creator
        bytes32 category;          // Market category
        string outcome1;           // First outcome option
        string outcome2;           // Second outcome option
    }

    struct MarketInfo {
        address marketAddress;
        address creator;
        uint256 createdAt;
        uint256 resolutionTime;
        bytes32 category;
        bool isActive;
        uint256 totalVolume;
    }

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
        uint256 timestamp
    );

    event TemplateCreated(
        bytes32 indexed templateId,
        string name,
        uint256 timestamp
    );

    event FactoryPaused(bool isPaused);

    // ============= Errors =============

    error UnauthorizedAccess(address caller);
    error InvalidMarketConfig();
    error InvalidResolutionTime();
    error InvalidBondAmount();
    error InvalidQuestion();
    error InvalidCategory();
    error MarketAlreadyExists();
    error MarketNotFound(address marketAddress);
    error InsufficientBond();
    error ContractPaused();
    error TemplateNotFound(bytes32 templateId);
    error InvalidTemplate();

    // ============= Core Functions =============

    function createMarket(MarketConfig calldata config) external payable returns (address);

    function createMarketFromTemplate(
        bytes32 templateId,
        string calldata question,
        uint256 resolutionTime
    ) external payable returns (address);

    // ============= Market Management =============

    function activateMarket(address marketAddress) external;
    function deactivateMarket(address marketAddress, string calldata reason) external;
    function refundCreatorBond(address marketAddress) external;

    // ============= Template Management =============

    function createTemplate(
        bytes32 templateId,
        string calldata name,
        bytes32 category,
        string calldata outcome1,
        string calldata outcome2
    ) external;

    function getTemplate(bytes32 templateId) external view returns (
        string memory name,
        bytes32 category,
        string memory outcome1,
        string memory outcome2
    );

    // ============= Enumeration =============

    function getMarketCount() external view returns (uint256);
    function getMarketAt(uint256 index) external view returns (address);
    function getAllMarkets() external view returns (address[] memory);

    function getActiveMarkets() external view returns (address[] memory);
    function getMarketsByCreator(address creator) external view returns (address[] memory);
    function getMarketsByCategory(bytes32 category) external view returns (address[] memory);

    // ============= Market Info =============

    function getMarketInfo(address marketAddress) external view returns (MarketInfo memory);
    function isMarketActive(address marketAddress) external view returns (bool);
    function getMarketCreator(address marketAddress) external view returns (address);

    // ============= Admin Functions =============

    function pause() external;
    function unpause() external;
    function updateMinBond(uint256 newMinBond) external;

    // ============= View Functions =============

    function registry() external view returns (address);
    function paused() external view returns (bool);
    function minCreatorBond() external view returns (uint256);
}
