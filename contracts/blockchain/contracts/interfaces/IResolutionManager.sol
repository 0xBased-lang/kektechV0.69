// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IResolutionManager
 * @notice Interface for managing prediction market resolutions in KEKTECH 3.0
 * @dev Handles market resolution, disputes, and resolution tracking
 */
interface IResolutionManager {
    // ============= Enums =============

    enum ResolutionStatus {
        PENDING,
        RESOLVED,
        DISPUTED,
        FINALIZED
    }

    enum DisputeStatus {
        NONE,
        OPEN,
        INVESTIGATING,
        RESOLVED
    }

    // ============= Structs =============

    struct ResolutionData {
        address marketAddress;
        uint8 outcome;
        address resolver;
        uint256 resolvedAt;
        ResolutionStatus status;
        string evidence;
    }

    struct DisputeData {
        address disputer;
        string reason;
        uint256 disputedAt;
        DisputeStatus status;
        uint256 bondAmount;
    }

    // ============= Events =============

    event MarketResolved(
        address indexed marketAddress,
        uint8 indexed outcome,
        address indexed resolver,
        uint256 timestamp
    );

    event ResolutionDisputed(
        address indexed marketAddress,
        address indexed disputer,
        string reason,
        uint256 bondAmount,
        uint256 timestamp
    );

    event DisputeInvestigated(
        address indexed marketAddress,
        address indexed investigator,
        string findings,
        uint256 timestamp
    );

    event DisputeResolved(
        address indexed marketAddress,
        bool upheld,
        uint8 newOutcome,
        uint256 timestamp
    );

    event ResolutionFinalized(
        address indexed marketAddress,
        uint8 finalOutcome,
        uint256 timestamp
    );

    event ResolverRewardPaid(
        address indexed resolver,
        address indexed marketAddress,
        uint256 amount,
        uint256 timestamp
    );

    // CRITICAL FIX: Security events for bond handling
    event DisputeBondCollected(
        address indexed market,
        uint256 amount,
        uint256 timestamp
    );

    event DisputeBondTransferFailed(
        address indexed market,
        uint256 amount
    );

    // Phase 6: Community Voting Events
    event CommunityDisputeWindowOpened(
        address indexed market,
        uint8 outcome,
        uint256 endTime
    );

    event DisputeSignalsSubmitted(
        address indexed market,
        uint256 agreeCount,
        uint256 disagreeCount
    );

    event MarketAutoFinalized(
        address indexed market,
        uint8 outcome
    );

    event CommunityDisputeFlagged(
        address indexed market,
        uint256 disagreementPercent
    );

    event AdminResolution(
        address indexed market,
        uint8 outcome,
        string reason
    );

    event AgreementThresholdUpdated(
        uint256 newThreshold
    );

    event DisagreementThresholdUpdated(
        uint256 newThreshold
    );

    // ============= Errors =============

    error UnauthorizedResolver();
    error MarketNotFound(address marketAddress);
    error MarketAlreadyResolved(address marketAddress);
    error MarketNotResolvable(address marketAddress);
    error InvalidOutcome(uint8 outcome);
    error DisputeWindowClosed();
    error DisputeAlreadyExists();
    error InsufficientDisputeBond();
    error NoDisputeFound();
    error DisputeNotOpen();
    error InvalidEvidence();
    error AlreadyFinalized();

    // ============= Core Functions =============

    function resolveMarket(
        address marketAddress,
        uint8 outcome,
        string calldata evidence
    ) external;

    function batchResolveMarkets(
        address[] calldata marketAddresses,
        uint8[] calldata outcomes,
        string[] calldata evidences
    ) external;

    // ============= Dispute Functions =============

    function disputeResolution(
        address marketAddress,
        string calldata reason
    ) external payable;

    function investigateDispute(
        address marketAddress,
        string calldata findings
    ) external;

    function resolveDispute(
        address marketAddress,
        bool upheld,
        uint8 newOutcome
    ) external;

    // ============= Finalization =============

    function finalizeResolution(address marketAddress) external;

    function batchFinalizeResolutions(address[] calldata marketAddresses) external;

    // ============= View Functions =============

    function getResolutionData(address marketAddress)
        external
        view
        returns (ResolutionData memory);

    function getDisputeData(address marketAddress)
        external
        view
        returns (DisputeData memory);

    function isResolved(address marketAddress) external view returns (bool);

    function canDispute(address marketAddress) external view returns (bool);

    function getDisputeWindow() external view returns (uint256);

    function getMinDisputeBond() external view returns (uint256);

    // ============= Enumeration =============

    function getPendingResolutions() external view returns (address[] memory);

    function getDisputedResolutions() external view returns (address[] memory);

    function getResolverHistory(address resolver)
        external
        view
        returns (address[] memory);

    // ============= Admin Functions =============

    function setDisputeWindow(uint256 window) external;

    function setMinDisputeBond(uint256 amount) external;

    function pause() external;

    function unpause() external;

    // ============= State Variables =============

    function registry() external view returns (address);

    function paused() external view returns (bool);
}
