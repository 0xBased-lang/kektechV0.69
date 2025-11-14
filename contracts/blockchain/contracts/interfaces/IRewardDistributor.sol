// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IRewardDistributor
 * @notice Interface for managing reward distribution in KEKTECH 3.0
 * @dev Handles fee splitting, winner payouts, and treasury management
 */
interface IRewardDistributor {
    // ============= Structs =============

    /**
     * @notice Fee distribution configuration
     */
    struct FeeDistribution {
        uint256 protocolFeeBps;      // Platform fee (default 250 = 2.5%)
        uint256 creatorFeeBps;        // Creator fee (default 150 = 1.5%)
        uint256 stakerIncentiveBps;   // Staker incentive (default 50 = 0.5%)
        uint256 treasuryFeeBps;       // Treasury fee (default 50 = 0.5%)
    }

    /**
     * @notice Reward claim record
     */
    struct ClaimRecord {
        address market;
        address claimer;
        uint256 amount;
        uint256 timestamp;
        uint8 outcome;
    }

    /**
     * @notice Fee collection record
     */
    struct FeeRecord {
        address market;
        uint256 totalFees;
        uint256 protocolFees;
        uint256 creatorFees;
        uint256 stakerFees;
        uint256 treasuryFees;
        uint256 timestamp;
    }

    // ============= Events =============

    event RewardClaimed(
        address indexed market,
        address indexed claimer,
        uint256 amount,
        uint8 outcome,
        uint256 timestamp
    );

    event FeesCollected(
        address indexed market,
        uint256 totalFees,
        uint256 protocolFees,
        uint256 creatorFees,
        uint256 stakerFees,
        uint256 treasuryFees
    );

    event FeeDistributionUpdated(
        uint256 protocolFeeBps,
        uint256 creatorFeeBps,
        uint256 stakerIncentiveBps,
        uint256 treasuryFeeBps
    );

    event TreasuryWithdrawal(
        address indexed recipient,
        uint256 amount,
        uint256 timestamp
    );

    event CreatorFeesClaimed(
        address indexed market,
        address indexed creator,
        uint256 amount,
        uint256 timestamp
    );

    event StakerRewardsDistributed(
        address indexed staker,
        uint256 amount,
        uint256 timestamp
    );

    // ============= Errors =============

    error InvalidFeeDistribution();
    error NoFeesToCollect();
    error NoRewardsToClaim();
    error InsufficientTreasuryBalance();
    error MarketNotResolved();
    error AlreadyClaimed();
    error InvalidMarket();
    error ZeroAddress();
    error InvalidBasisPoints();
    error Unauthorized();

    // ============= Core Functions =============

    /**
     * @notice Process reward claim for winner
     * @param market Market address
     * @param claimer Winner address
     * @param amount Reward amount
     * @param outcome Winning outcome
     */
    function processRewardClaim(
        address market,
        address claimer,
        uint256 amount,
        uint8 outcome
    ) external;

    /**
     * @notice Collect fees from resolved market
     * @param market Market address
     * @param totalFees Total fees collected
     */
    function collectFees(
        address market,
        uint256 totalFees
    ) external payable;

    /**
     * @notice Claim creator fees for a market
     * @param market Market address
     */
    function claimCreatorFees(address market) external;

    /**
     * @notice Distribute staker rewards
     * @param staker Staker address
     * @param amount Reward amount
     */
    function distributeStakerRewards(
        address staker,
        uint256 amount
    ) external;

    /**
     * @notice Withdraw from treasury
     * @param recipient Recipient address
     * @param amount Withdrawal amount
     */
    function withdrawTreasury(
        address recipient,
        uint256 amount
    ) external;

    // ============= Batch Operations =============

    /**
     * @notice Process multiple reward claims
     * @param markets Array of market addresses
     * @param claimers Array of claimer addresses
     * @param amounts Array of amounts
     * @param outcomes Array of outcomes
     */
    function batchProcessRewards(
        address[] calldata markets,
        address[] calldata claimers,
        uint256[] calldata amounts,
        uint8[] calldata outcomes
    ) external;

    /**
     * @notice Collect fees from multiple markets
     * @param markets Array of market addresses
     * @param fees Array of fee amounts
     */
    function batchCollectFees(
        address[] calldata markets,
        uint256[] calldata fees
    ) external payable;

    // ============= Configuration =============

    /**
     * @notice Update fee distribution
     * @param protocolFeeBps Protocol fee in basis points
     * @param creatorFeeBps Creator fee in basis points
     * @param stakerIncentiveBps Staker incentive in basis points
     * @param treasuryFeeBps Treasury fee in basis points
     */
    function updateFeeDistribution(
        uint256 protocolFeeBps,
        uint256 creatorFeeBps,
        uint256 stakerIncentiveBps,
        uint256 treasuryFeeBps
    ) external;

    // ============= View Functions =============

    /**
     * @notice Get fee distribution configuration
     */
    function getFeeDistribution() external view returns (FeeDistribution memory);

    /**
     * @notice Get total fees collected for a market
     * @param market Market address
     */
    function getMarketFees(address market) external view returns (FeeRecord memory);

    /**
     * @notice Get claim record for user in market
     * @param market Market address
     * @param claimer Claimer address
     */
    function getClaimRecord(
        address market,
        address claimer
    ) external view returns (ClaimRecord memory);

    /**
     * @notice Get unclaimed creator fees
     * @param market Market address
     */
    function getUnclaimedCreatorFees(address market) external view returns (uint256);

    /**
     * @notice Get treasury balance
     */
    function getTreasuryBalance() external view returns (uint256);

    /**
     * @notice Get total staker rewards pool
     */
    function getStakerRewardsPool() external view returns (uint256);

    /**
     * @notice Get total rewards claimed by user
     * @param user User address
     */
    function getTotalRewardsClaimed(address user) external view returns (uint256);

    /**
     * @notice Check if user has claimed from market
     * @param market Market address
     * @param user User address
     */
    function hasClaimed(address market, address user) external view returns (bool);

    /**
     * @notice Get total fees collected across all markets
     */
    function getTotalFeesCollected() external view returns (uint256);
}
