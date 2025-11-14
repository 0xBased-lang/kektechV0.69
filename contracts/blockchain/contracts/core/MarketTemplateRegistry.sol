// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../interfaces/IVersionedRegistry.sol";
import "../interfaces/IAccessControlManager.sol";
import "../interfaces/IMarket.sol"; // HIGH FIX: For interface validation

/**
 * @title MarketTemplateRegistry
 * @notice Central registry for market template implementations
 * @dev Stores implementation addresses for different market types (Pari-Mutuel, AMM, etc.)
 *
 * Key Features:
 * - Stores template implementations for cloning
 * - Allows admins to register new templates
 * - Supports template activation/deactivation
 * - Enables future market type additions without redeploying factory
 */
contract MarketTemplateRegistry {
    // ═══════════════════════════════════════════════════════════
    // STRUCTS
    // ═══════════════════════════════════════════════════════════

    /**
     * @notice Enhanced metadata for a registered template (Phase 2)
     * @param implementation Template contract address
     * @param isActive Whether template is currently active
     * @param name Template name
     * @param category Template category (e.g., "Binary", "Multi-Outcome", "Scalar")
     * @param iconUrl IPFS link or URL for template icon
     * @param creator Address of admin who registered this template
     * @param versionNumber Numeric version for programmatic comparison
     * @param createdAt Timestamp when template was registered
     * @param updatedAt Timestamp of last metadata update
     * @param marketCount Number of markets using this template
     * @param customConfig Template-specific configuration schema
     * @param features Array of feature flags (e.g., ["Pausable", "Upgradeable"])
     */
    struct TemplateMetadata {
        // Core fields
        address implementation;
        bool isActive;
        string name;

        // Enhanced fields (Phase 2)
        string category;
        string iconUrl;
        address creator;
        uint256 versionNumber;
        uint256 createdAt;
        uint256 updatedAt;
        uint256 marketCount;
        bytes customConfig;
        string[] features;
    }

    // ═══════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ═══════════════════════════════════════════════════════════

    /// @notice Reference to the MasterRegistry
    IVersionedRegistry public immutable registry;

    /// @notice Template metadata storage: templateId => TemplateMetadata
    mapping(bytes32 => TemplateMetadata) public templateInfo;

    /// @notice DEPRECATED: Kept for backward compatibility - use templateInfo[id].implementation
    mapping(bytes32 => address) public templates;

    /// @notice DEPRECATED: Kept for backward compatibility - use templateInfo[id].isActive
    mapping(bytes32 => bool) public isActive;

    /// @notice List of all template IDs (for enumeration)
    bytes32[] private _allTemplateIds;

    /// @notice Mapping to track if template ID exists
    mapping(bytes32 => bool) private _templateExists;

    /// @notice CRITICAL FIX: Cache active template count to avoid unbounded loops
    /// @dev Updated on registration, activation, and deactivation
    uint256 private _activeTemplateCount;

    // ═══════════════════════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════════════════════

    /**
     * @notice Emitted when a new template is registered
     * @param templateId Unique identifier for the template
     * @param implementation Address of the implementation contract
     */
    event TemplateRegistered(
        bytes32 indexed templateId,
        address implementation
    );

    /**
     * @notice Emitted when a template is updated
     * @param templateId Template identifier
     * @param oldImplementation Previous implementation address
     * @param newImplementation New implementation address
     */
    event TemplateUpdated(
        bytes32 indexed templateId,
        address oldImplementation,
        address newImplementation
    );

    /**
     * @notice Emitted when a template is deactivated
     * @param templateId Template identifier
     */
    event TemplateDeactivated(bytes32 indexed templateId);

    /**
     * @notice Emitted when a template is reactivated
     * @param templateId Template identifier
     */
    event TemplateReactivated(bytes32 indexed templateId);

    // Phase 2: Enhanced metadata events
    event TemplateMetadataUpdated(
        bytes32 indexed templateId,
        uint256 versionNumber,
        uint256 timestamp
    );

    event TemplateMarketCountIncremented(
        bytes32 indexed templateId,
        uint256 newCount
    );

    // ═══════════════════════════════════════════════════════════
    // ERRORS
    // ═══════════════════════════════════════════════════════════

    error TemplateAlreadyExists(bytes32 templateId);
    error TemplateNotFound(bytes32 templateId);
    error TemplateNotActive(bytes32 templateId);
    error InvalidImplementation();
    error Unauthorized();

    // ═══════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════

    /**
     * @notice Initialize the template registry
     * @param _registry Address of the MasterRegistry
     */
    constructor(address _registry) {
        require(_registry != address(0), "Invalid registry");
        registry = IVersionedRegistry(_registry);
    }

    // ═══════════════════════════════════════════════════════════
    // MODIFIERS
    // ═══════════════════════════════════════════════════════════

    /**
     * @notice Restricts function to admin role only
     */
    modifier onlyAdmin() {
        IAccessControlManager acm = IAccessControlManager(
            registry.getContract(keccak256("AccessControlManager"))
        );
        if (!acm.hasRole(keccak256("ADMIN_ROLE"), msg.sender)) {
            revert Unauthorized();
        }
        _;
    }

    // ═══════════════════════════════════════════════════════════
    // ADMIN FUNCTIONS
    // ═══════════════════════════════════════════════════════════

    /**
     * @notice Register a new market template with enhanced metadata (Phase 2)
     * @param templateId Unique identifier for the template (e.g., keccak256("PARIMUTUEL"))
     * @param implementation Address of the implementation contract
     * @param name Template name
     * @param category Template category (e.g., "Binary", "Multi-Outcome")
     * @param iconUrl IPFS/URL for template icon
     * @param customConfig Template-specific configuration
     * @param features Array of feature flags
     * @dev Only callable by admin
     * @dev HIGH FIX: Validates implementation is a contract with IMarket interface
     */
    function registerTemplate(
        bytes32 templateId,
        address implementation,
        string memory name,
        string memory category,
        string memory iconUrl,
        bytes memory customConfig,
        string[] memory features
    ) external onlyAdmin {
        if (_templateExists[templateId]) {
            revert TemplateAlreadyExists(templateId);
        }
        if (implementation == address(0)) {
            revert InvalidImplementation();
        }

        // HIGH FIX: Validate implementation is a contract
        uint256 codeSize;
        assembly {
            codeSize := extcodesize(implementation)
        }
        require(codeSize > 0, "Implementation must be a contract");

        // HIGH FIX: Validate implementation supports IMarket interface
        // Try calling a view function from IMarket to verify interface
        try IMarket(implementation).feePercent() returns (uint256) {
            // Interface check passed - implementation has feePercent()
        } catch {
            revert("Implementation must support IMarket interface");
        }

        // Store enhanced metadata
        templateInfo[templateId] = TemplateMetadata({
            // Core fields
            implementation: implementation,
            isActive: true,
            name: name,
            // Enhanced fields (Phase 2)
            category: category,
            iconUrl: iconUrl,
            creator: msg.sender,
            versionNumber: 1,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            marketCount: 0,
            customConfig: customConfig,
            features: features
        });

        // Maintain backward compatibility
        templates[templateId] = implementation;
        isActive[templateId] = true;
        _templateExists[templateId] = true;
        _allTemplateIds.push(templateId);
        _activeTemplateCount++; // CRITICAL FIX: Track active count

        emit TemplateRegistered(templateId, implementation);
    }

    /**
     * @notice Update an existing template's implementation
     * @param templateId Template identifier
     * @param newImplementation New implementation address
     * @dev Only callable by admin
     */
    function updateTemplate(
        bytes32 templateId,
        address newImplementation
    ) external onlyAdmin {
        if (!_templateExists[templateId]) {
            revert TemplateNotFound(templateId);
        }
        if (newImplementation == address(0)) {
            revert InvalidImplementation();
        }

        address oldImplementation = templates[templateId];
        templates[templateId] = newImplementation;

        emit TemplateUpdated(templateId, oldImplementation, newImplementation);
    }

    /**
     * @notice Deactivate a template (prevents new market creation)
     * @param templateId Template identifier
     * @dev Only callable by admin
     * @dev Existing markets using this template continue to function
     */
    function deactivateTemplate(bytes32 templateId) external onlyAdmin {
        if (!_templateExists[templateId]) {
            revert TemplateNotFound(templateId);
        }

        // CRITICAL FIX: Decrement count only if currently active
        if (isActive[templateId]) {
            _activeTemplateCount--;
        }

        // Update both new and legacy storage
        templateInfo[templateId].isActive = false;
        isActive[templateId] = false;
        emit TemplateDeactivated(templateId);
    }

    /**
     * @notice Reactivate a previously deactivated template
     * @param templateId Template identifier
     * @dev Only callable by admin
     */
    function reactivateTemplate(bytes32 templateId) external onlyAdmin {
        if (!_templateExists[templateId]) {
            revert TemplateNotFound(templateId);
        }

        // CRITICAL FIX: Increment count only if currently inactive
        if (!isActive[templateId]) {
            _activeTemplateCount++;
        }

        // Update both new and legacy storage
        templateInfo[templateId].isActive = true;
        isActive[templateId] = true;
        emit TemplateReactivated(templateId);
    }

    /**
     * @notice Update template metadata (Phase 2 feature)
     * @dev Updates name, category, iconUrl, features and increments version
     * @param templateId Template identifier
     * @param name New template name
     * @param category New category
     * @param iconUrl New icon URL
     * @param customConfig New custom configuration
     * @param features New features array
     *
     * Requirements:
     * - Caller must have ADMIN_ROLE
     * - Template must be registered
     */
    function updateTemplateMetadata(
        bytes32 templateId,
        string memory name,
        string memory category,
        string memory iconUrl,
        bytes memory customConfig,
        string[] memory features
    ) external onlyAdmin {
        if (!_templateExists[templateId]) {
            revert TemplateNotFound(templateId);
        }

        // Update metadata fields (keep implementation and core state)
        templateInfo[templateId].name = name;
        templateInfo[templateId].category = category;
        templateInfo[templateId].iconUrl = iconUrl;
        templateInfo[templateId].customConfig = customConfig;
        templateInfo[templateId].versionNumber++;
        templateInfo[templateId].updatedAt = block.timestamp;
        templateInfo[templateId].features = features;

        emit TemplateMetadataUpdated(
            templateId,
            templateInfo[templateId].versionNumber,
            block.timestamp
        );
    }

    /**
     * @notice Increment market count when template is used (Phase 2 feature)
     * @dev Called by FlexibleMarketFactory when creating market with this template
     * @param templateId Template identifier
     *
     * Requirements:
     * - Template must be registered
     * - Caller should be factory (access control via registry)
     */
    function incrementMarketCount(bytes32 templateId) external {
        // Note: Access control should verify caller is factory
        // This would be checked via registry or role system
        if (!_templateExists[templateId]) {
            revert TemplateNotFound(templateId);
        }

        templateInfo[templateId].marketCount++;

        emit TemplateMarketCountIncremented(
            templateId,
            templateInfo[templateId].marketCount
        );
    }

    // ═══════════════════════════════════════════════════════════
    // VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════

    /**
     * @notice Get template implementation address
     * @param templateId Template identifier
     * @return Implementation address
     * @dev Reverts if template doesn't exist or is not active
     */
    function getTemplate(bytes32 templateId) external view returns (address) {
        if (!_templateExists[templateId]) {
            revert TemplateNotFound(templateId);
        }
        if (!isActive[templateId]) {
            revert TemplateNotActive(templateId);
        }

        return templates[templateId];
    }

    /**
     * @notice Get all template IDs
     * @return Array of all template IDs (active and inactive)
     */
    function getAllTemplateIds() external view returns (bytes32[] memory) {
        return _allTemplateIds;
    }

    /**
     * @notice CRITICAL FIX: Get active template IDs with pagination
     * @param offset Starting index for pagination
     * @param limit Maximum number of templates to return
     * @return templateIds Array of active template IDs
     * @return total Total number of active templates
     * @dev Gas-efficient pagination prevents DoS from unbounded loops
     * @dev Use offset=0, limit=100 for first page, offset=100, limit=100 for second page, etc.
     */
    function getActiveTemplateIds(
        uint256 offset,
        uint256 limit
    ) external view returns (
        bytes32[] memory templateIds,
        uint256 total
    ) {
        // Return cached total count (O(1) instead of O(n))
        total = _activeTemplateCount;

        // Handle edge cases
        if (offset >= total) {
            return (new bytes32[](0), total);
        }

        // Calculate actual return size
        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }
        uint256 returnSize = end - offset;

        // Allocate return array
        templateIds = new bytes32[](returnSize);
        uint256 currentIndex = 0;
        uint256 foundCount = 0;

        // Iterate with bounds (worst case O(n), but typically much better)
        for (uint256 i = 0; i < _allTemplateIds.length && foundCount < end; i++) {
            if (isActive[_allTemplateIds[i]]) {
                // Skip templates before offset
                if (foundCount >= offset) {
                    templateIds[currentIndex] = _allTemplateIds[i];
                    currentIndex++;
                }
                foundCount++;
            }
        }

        return (templateIds, total);
    }

    /**
     * @notice Get ALL active template IDs (DEPRECATED - use pagination instead)
     * @return Array of active template IDs
     * @dev WARNING: This function can run out of gas with many templates
     * @dev Use getActiveTemplateIds(offset, limit) instead for production
     * @dev Kept for backward compatibility only
     */
    function getActiveTemplateIdsLegacy() external view returns (bytes32[] memory) {
        // Build array using cached count
        bytes32[] memory activeTemplates = new bytes32[](_activeTemplateCount);
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < _allTemplateIds.length; i++) {
            if (isActive[_allTemplateIds[i]]) {
                activeTemplates[currentIndex] = _allTemplateIds[i];
                currentIndex++;
            }
        }

        return activeTemplates;
    }

    /**
     * @notice Check if a template exists
     * @param templateId Template identifier
     * @return true if template exists, false otherwise
     */
    function templateExists(bytes32 templateId) external view returns (bool) {
        return _templateExists[templateId];
    }

    /**
     * @notice Check if a template is active
     * @param templateId Template identifier
     * @return true if template is active, false otherwise
     */
    function isTemplateActive(bytes32 templateId) external view returns (bool) {
        return _templateExists[templateId] && isActive[templateId];
    }

    /**
     * @notice Get total number of templates (active and inactive)
     * @return Total template count
     */
    function getTemplateCount() external view returns (uint256) {
        return _allTemplateIds.length;
    }

    /**
     * @notice CRITICAL FIX: Get active template count (O(1) lookup)
     * @return Number of currently active templates
     * @dev Gas-efficient alternative to counting in loops
     */
    function getActiveTemplateCount() external view returns (uint256) {
        return _activeTemplateCount;
    }
}
