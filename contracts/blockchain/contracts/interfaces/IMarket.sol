// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IMarket
 * @notice Common interface for all prediction market types (Pari-Mutuel, AMM, etc.)
 * @dev All market implementations must conform to this interface for compatibility
 */
interface IMarket {
    // ═══════════════════════════════════════════════════════════
    // ENUMS
    // ═══════════════════════════════════════════════════════════

    /**
     * @notice Market outcome states
     * @dev UNRESOLVED: Market not yet resolved
     * @dev OUTCOME1: First outcome won
     * @dev OUTCOME2: Second outcome won
     * @dev CANCELLED: Market cancelled, refunds issued
     */
    enum Outcome {
        UNRESOLVED,
        OUTCOME1,
        OUTCOME2,
        CANCELLED
    }

    // ═══════════════════════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════════════════════

    /**
     * @notice Emitted when a bet is placed
     * @param user Address of the bettor
     * @param outcome Outcome the user bet on (1 or 2)
     * @param amount Amount bet in wei
     * @param timestamp Block timestamp of the bet
     */
    event BetPlaced(
        address indexed user,
        uint8 outcome,
        uint256 amount,
        uint256 timestamp
    );

    /**
     * @notice Emitted when a market is resolved
     * @param outcome Final outcome of the market
     * @param timestamp Block timestamp of resolution
     */
    event MarketResolved(
        Outcome outcome,
        uint256 timestamp
    );

    /**
     * @notice Emitted when winnings are claimed
     * @param user Address claiming winnings
     * @param amount Amount claimed in wei
     */
    event WinningsClaimed(
        address indexed user,
        uint256 amount
    );

    // SECURITY FIX EVENTS - Added 2025-10-29

    /**
     * @notice Emitted when fees are successfully collected by RewardDistributor
     * @param rewardDistributor Address of RewardDistributor
     * @param amount Amount of fees collected
     */
    event FeesCollected(
        address indexed rewardDistributor,
        uint256 amount
    );

    /**
     * @notice Emitted when fee collection fails (CRITICAL FIX)
     * @param amount Amount of fees that couldn't be collected
     * @param reason Reason for failure
     */
    event FeeCollectionFailed(
        uint256 amount,
        string reason
    );

    /**
     * @notice Emitted when accumulated fees are withdrawn by admin
     * @param amount Amount withdrawn
     * @param admin Address of admin who withdrew
     */
    event AccumulatedFeesWithdrawn(
        uint256 amount,
        address indexed admin
    );

    /**
     * @notice Emitted when direct claim transfer fails (HIGH FIX)
     * @param user Address whose claim failed
     * @param amount Amount that couldn't be transferred
     */
    event ClaimFailed(
        address indexed user,
        uint256 amount
    );

    /**
     * @notice Emitted when winnings are stored for pull withdrawal
     * @param user Address whose winnings are stored
     * @param amount Amount stored
     */
    event UnclaimedWinningsStored(
        address indexed user,
        uint256 amount
    );

    /**
     * @notice Emitted when user withdraws unclaimed winnings
     * @param user Address withdrawing
     * @param amount Amount withdrawn
     */
    event WinningsWithdrawn(
        address indexed user,
        uint256 amount
    );

    /**
     * @notice Emitted during emergency withdrawal (last resort)
     * @param amount Amount withdrawn
     * @param admin Address of admin
     * @param timestamp Block timestamp
     */
    event EmergencyWithdrawal(
        uint256 amount,
        address indexed admin,
        uint256 timestamp
    );

    // ═══════════════════════════════════════════════════════════
    // CORE LIFECYCLE FUNCTIONS
    // ═══════════════════════════════════════════════════════════

    /**
     * @notice Initialize the market (called once after cloning)
     * @param registry Address of the MasterRegistry
     * @param initData ABI-encoded initialization data (format depends on market type)
     */
    function initialize(
        address registry,
        bytes calldata initData
    ) external;

    /**
     * @notice Place a bet on an outcome
     * @param outcome Outcome to bet on (1 or 2)
     * @param betData Additional bet data (market-type specific, can be empty)
     * @param minAcceptableOdds Minimum acceptable odds in basis points (0 to disable)
     * @param deadline Transaction must execute before this timestamp (0 to disable)
     * @dev MEDIUM FIX: Added slippage protection and deadline parameters
     */
    function placeBet(
        uint8 outcome,
        bytes calldata betData,
        uint256 minAcceptableOdds,
        uint256 deadline
    ) external payable;

    /**
     * @notice Resolve the market with a final outcome
     * @param result Final outcome of the market
     * @dev Can only be called by authorized resolver
     */
    function resolveMarket(Outcome result) external;

    /**
     * @notice Claim winnings after market resolution
     * @dev Transfers winnings to msg.sender if they won
     */
    function claimWinnings() external;

    // ═══════════════════════════════════════════════════════════
    // VIEW FUNCTIONS - MARKET STATE
    // ═══════════════════════════════════════════════════════════

    /**
     * @notice Check if market is resolved
     * @return true if market has been resolved, false otherwise
     */
    function isResolved() external view returns (bool);

    /**
     * @notice Check if market can be resolved
     * @return true if market is ready for resolution (deadline passed, etc.)
     */
    function canResolve() external view returns (bool);

    /**
     * @notice Get the market question
     * @return Market question string
     */
    function question() external view returns (string memory);

    /**
     * @notice Get the market resolution deadline
     * @return Unix timestamp of deadline
     */
    function deadline() external view returns (uint256);

    /**
     * @notice Get the market outcome
     * @return Current outcome (UNRESOLVED if not yet resolved)
     */
    function result() external view returns (Outcome);

    /**
     * @notice Get the fee percentage
     * @return Fee percentage in basis points (e.g., 1000 = 10%)
     */
    function feePercent() external view returns (uint256);

    // ═══════════════════════════════════════════════════════════
    // VIEW FUNCTIONS - USER STATE
    // ═══════════════════════════════════════════════════════════

    /**
     * @notice Check if user has unclaimed winnings
     * @param user Address to check
     * @return true if user has winnings to claim, false otherwise
     */
    function hasWinnings(address user) external view returns (bool);

    /**
     * @notice Calculate potential payout for a user
     * @param user Address to check
     * @return Payout amount in wei (0 if lost or already claimed)
     */
    function calculatePayout(address user) external view returns (uint256);

    /**
     * @notice Get user's bet amount for a specific outcome
     * @param user Address to check
     * @param outcome Outcome to check (1 or 2)
     * @return Bet amount in wei
     */
    function getUserBet(address user, uint8 outcome) external view returns (uint256);

    /**
     * @notice Check if user has already claimed winnings
     * @param user Address to check
     * @return true if user has claimed, false otherwise
     */
    function hasClaimed(address user) external view returns (bool);
}
