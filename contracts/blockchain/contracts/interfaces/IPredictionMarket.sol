// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IPredictionMarket
 * @notice Interface for binary outcome prediction markets in KEKTECH 3.0
 * @dev Bonding curve-based market with flexible pricing mechanisms
 */
interface IPredictionMarket {
    // ============= Enums =============

    enum Outcome { UNRESOLVED, OUTCOME1, OUTCOME2, CANCELLED }

    /**
     * @notice Market lifecycle states (PHASE 5)
     * @dev State machine: PROPOSED → APPROVED → ACTIVE → RESOLVING → DISPUTED/FINALIZED
     */
    enum MarketState {
        PROPOSED,      // Created, awaiting approval
        APPROVED,      // Approved, ready to activate
        ACTIVE,        // Trading active
        RESOLVING,     // Trading ended, awaiting confirmation
        DISPUTED,      // Outcome disputed
        FINALIZED      // Outcome final
    }

    // ============= Structs =============

    struct MarketInfo {
        string question;
        string outcome1Name;
        string outcome2Name;
        address creator;
        uint256 createdAt;
        uint256 resolutionTime;
        Outcome result;
        uint256 totalBets;
        uint256 totalVolume;
        bool isResolved;
    }

    struct BetInfo {
        Outcome outcome;        // Outcome bettor chose (OUTCOME1 or OUTCOME2)
        uint256 amount;         // ETH paid by bettor
        uint256 shares;         // Shares received from bonding curve
        uint256 timestamp;      // When bet was placed
        bool claimed;           // Whether winnings have been claimed
        uint256 payout;         // Amount paid out (set after claiming)
    }

    // ============= Events =============

    event BetPlaced(
        address indexed bettor,
        Outcome indexed outcome,
        uint256 amount,
        uint256 shares,
        uint256 timestamp
    );

    event MarketResolved(
        Outcome indexed result,
        address indexed resolver,
        uint256 timestamp
    );

    event WinningsClaimed(
        address indexed bettor,
        uint256 amount,
        uint256 timestamp
    );

    event LiquidityUpdated(
        uint256 pool1,
        uint256 pool2,
        uint256 timestamp
    );

    event SharesUpdated(
        uint256 yesShares,
        uint256 noShares,
        uint256 timestamp
    );

    /**
     * @notice Emitted when market state changes (PHASE 5)
     * @param newState The new lifecycle state
     * @param timestamp When the state change occurred
     */
    event MarketStateChanged(
        MarketState indexed newState,
        uint256 timestamp
    );

    /**
     * @notice Emitted when market is approved (PHASE 5)
     * @param timestamp When approval occurred
     */
    event MarketApproved(uint256 timestamp);

    /**
     * @notice Emitted when market is activated (PHASE 5)
     * @param timestamp When activation occurred
     */
    event MarketActivated(uint256 timestamp);

    /**
     * @notice Emitted when market is rejected (PHASE 5)
     * @param reason Rejection reason
     */
    event MarketRejected(string reason);

    /**
     * @notice Emitted when outcome is proposed for resolution (PHASE 5)
     * @param outcome Proposed outcome (Outcome enum value)
     * @param proposer Address who proposed the outcome
     */
    event ResolutionProposed(Outcome indexed outcome, address indexed proposer);

    /**
     * @notice Emitted when market is disputed (PHASE 5)
     * @param disputer Address who disputed
     * @param reason Dispute reason
     */
    event MarketDisputed(address indexed disputer, string reason);

    /**
     * @notice Emitted when market is finalized (PHASE 5)
     * @param finalOutcome Final outcome (Outcome enum value)
     * @param timestamp When finalization occurred
     */
    event MarketFinalized(Outcome indexed finalOutcome, uint256 timestamp);

    // ============= Errors =============

    error UnauthorizedResolver();
    error MarketNotResolved();
    error MarketAlreadyResolved();
    error InvalidOutcome();
    error InvalidBetAmount();
    error BetTooSmall();
    error BetTooLarge();
    error ResolutionTimeNotReached();
    error BettingClosed();
    error NoBetFound();
    error AlreadyClaimed();
    error NotAWinner();
    error TransferFailed();
    error InsufficientLiquidity();
    error InvalidCurve();
    error InvalidCurveParams(string reason);
    error InsufficientShares();
    error InvalidRegistry();

    /**
     * @notice Thrown when caller is not the factory (PHASE 5)
     */
    error OnlyFactory();

    /**
     * @notice Thrown when market is not in ACTIVE state (PHASE 5)
     */
    error MarketNotActive();

    /**
     * @notice Thrown when resolution attempted before endTime (PHASE 5)
     */
    error MarketNotEnded();

    /**
     * @notice Thrown when an invalid state transition is attempted (PHASE 5)
     * @param current Current market state
     * @param requested Requested target state
     */
    error InvalidStateTransition(MarketState current, MarketState requested);

    // ============= Core Functions =============

    function initialize(
        address _registry,
        string calldata _question,
        string calldata _outcome1,
        string calldata _outcome2,
        address _creator,
        uint256 _resolutionTime,
        address _bondingCurve,
        uint256 _curveParams
    ) external;

    function placeBet(uint8 outcome, uint256 minExpectedOdds) external payable;

    function resolveMarket(Outcome result) external;

    function claimWinnings() external;

    // ============= Lifecycle Transition Functions (PHASE 5) =============

    /**
     * @notice Approve market (factory only) - PROPOSED → APPROVED
     * @dev Called by FlexibleMarketFactoryUnified after admin/backend approval
     */
    function approve() external;

    /**
     * @notice Activate market (factory only) - APPROVED → ACTIVE
     * @dev Called by FlexibleMarketFactoryUnified to open trading
     */
    function activate() external;

    /**
     * @notice Reject market (factory only) - PROPOSED/APPROVED → FINALIZED
     * @param reason Rejection reason
     * @dev Called by FlexibleMarketFactoryUnified to reject market before activation
     */
    function reject(string calldata reason) external;

    /**
     * @notice Propose market outcome (resolver/ResolutionManager only) - ACTIVE → RESOLVING
     * @param outcome Proposed winning outcome
     * @dev PHASE 5: Called by ResolutionManager to propose resolution and open dispute window
     */
    function proposeOutcome(Outcome outcome) external;

    /**
     * @notice Dispute market outcome (ResolutionManager only) - RESOLVING → DISPUTED
     * @param reason Dispute reason
     * @dev PHASE 6: Called by ResolutionManager when community votes show disagreement ≥40%
     */
    function dispute(string calldata reason) external;

    /**
     * @notice Finalize market outcome (ResolutionManager only) - RESOLVING/DISPUTED → FINALIZED
     * @param outcome Final winning outcome
     * @dev PHASE 6: Called by ResolutionManager when community votes show agreement ≥75% or admin override
     */
    function finalize(Outcome outcome) external;

    // ============= View Functions =============

    function getMarketInfo() external view returns (MarketInfo memory);

    function getBetInfo(address bettor) external view returns (BetInfo memory);

    function getOdds() external view returns (uint256 odds1, uint256 odds2);

    function calculatePayout(address bettor) external view returns (uint256);

    function getLiquidity() external view returns (uint256 pool1, uint256 pool2);

    function canResolve() external view returns (bool);

    function hasWinnings(address bettor) external view returns (bool);

    function getShares() external view returns (uint256 yesShares, uint256 noShares);

    function getCurveInfo() external view returns (
        address curve,
        uint256 params,
        string memory name
    );

    function estimateShares(uint256 ethAmount, uint8 outcome) external view returns (uint256 shares);

    function estimateCost(uint256 shares, uint8 outcome) external view returns (uint256 cost);

    /**
     * @notice Get current market lifecycle state (PHASE 5)
     * @return The current MarketState
     */
    function getMarketState() external view returns (MarketState);

    // ============= State Variables =============

    function registry() external view returns (address);
    function creator() external view returns (address);
    function resolutionTime() external view returns (uint256);
    function result() external view returns (Outcome);
    function isResolved() external view returns (bool);
    function totalBets() external view returns (uint256);
    function totalVolume() external view returns (uint256);
}
