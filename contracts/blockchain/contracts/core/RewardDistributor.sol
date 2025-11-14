// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../interfaces/IRewardDistributor.sol";
import "../interfaces/IVersionedRegistry.sol";
import "../interfaces/IAccessControlManager.sol";
import "../interfaces/IParameterStorage.sol";

/**
 * @title RewardDistributor
 * @notice Manages reward distribution and fee collection for KEKTECH 3.0
 * @dev Handles fee splitting, winner payouts, and treasury management
 */
contract RewardDistributor is IRewardDistributor, ReentrancyGuard {
    // ============= State Variables =============

    IVersionedRegistry private immutable _registry;

    // Market => Fee Record
    mapping(address => FeeRecord) private _marketFees;

    // Market => Creator => Unclaimed Fees
    mapping(address => uint256) private _unclaimedCreatorFees;

    // Market => User => Claim Record
    mapping(address => mapping(address => ClaimRecord)) private _claimRecords;

    // Market => User => Has Claimed
    mapping(address => mapping(address => bool)) private _hasClaimed;

    // User => Total Rewards Claimed
    mapping(address => uint256) private _totalUserRewards;

    // Treasury balance
    uint256 private _treasuryBalance;

    // Staker rewards pool
    uint256 private _stakerRewardsPool;

    // Total fees collected across all markets
    uint256 private _totalFeesCollected;

    // ============= Constructor =============

    /**
     * @notice Initialize RewardDistributor
     * @param registry MasterRegistry address
     */
    constructor(address registry) {
        if (registry == address(0)) revert ZeroAddress();
        _registry = IVersionedRegistry(registry);
    }

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
    ) external override nonReentrant {
        if (market == address(0)) revert ZeroAddress();
        if (claimer == address(0)) revert ZeroAddress();
        if (amount == 0) revert NoRewardsToClaim();
        if (_hasClaimed[market][claimer]) revert AlreadyClaimed();

        // Record claim
        _claimRecords[market][claimer] = ClaimRecord({
            market: market,
            claimer: claimer,
            amount: amount,
            timestamp: block.timestamp,
            outcome: outcome
        });

        _hasClaimed[market][claimer] = true;
        _totalUserRewards[claimer] += amount;

        emit RewardClaimed(market, claimer, amount, outcome, block.timestamp);
    }

    /**
     * @notice Collect fees from resolved market
     * @param market Market address
     * @param totalFees Total fees collected (100% of bet pool)
     */
    function collectFees(
        address market,
        uint256 totalFees
    ) external payable override nonReentrant {
        if (market == address(0)) revert ZeroAddress();

        // Get fee distribution from ParameterStorage
        FeeDistribution memory feeDist = getFeeDistribution();

        // Calculate individual fees (in basis points, 10000 = 100%)
        uint256 protocolFees = (totalFees * feeDist.protocolFeeBps) / 10000;
        uint256 creatorFees = (totalFees * feeDist.creatorFeeBps) / 10000;
        uint256 stakerFees = (totalFees * feeDist.stakerIncentiveBps) / 10000;
        uint256 treasuryFees = (totalFees * feeDist.treasuryFeeBps) / 10000;

        uint256 totalFeesCollected = protocolFees + creatorFees + stakerFees + treasuryFees;

        // Require sufficient value sent
        require(msg.value >= totalFeesCollected, "Insufficient value sent");

        // Store fee record
        _marketFees[market] = FeeRecord({
            market: market,
            totalFees: totalFeesCollected,
            protocolFees: protocolFees,
            creatorFees: creatorFees,
            stakerFees: stakerFees,
            treasuryFees: treasuryFees,
            timestamp: block.timestamp
        });

        // Update balances
        _unclaimedCreatorFees[market] += creatorFees;
        _treasuryBalance += treasuryFees;
        _stakerRewardsPool += stakerFees;
        _totalFeesCollected += totalFeesCollected;

        emit FeesCollected(
            market,
            totalFeesCollected,
            protocolFees,
            creatorFees,
            stakerFees,
            treasuryFees
        );
    }

    /**
     * @notice Claim creator fees for a market
     * @param market Market address
     */
    function claimCreatorFees(address market) external override nonReentrant {
        uint256 amount = _unclaimedCreatorFees[market];
        if (amount == 0) revert NoFeesToCollect();

        _unclaimedCreatorFees[market] = 0;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        emit CreatorFeesClaimed(market, msg.sender, amount, block.timestamp);
    }

    /**
     * @notice Distribute staker rewards
     * @param staker Staker address
     * @param amount Reward amount
     */
    function distributeStakerRewards(
        address staker,
        uint256 amount
    ) external override nonReentrant {
        _requireAdmin();

        if (staker == address(0)) revert ZeroAddress();
        if (amount > _stakerRewardsPool) revert InsufficientTreasuryBalance();

        _stakerRewardsPool -= amount;

        (bool success, ) = staker.call{value: amount}("");
        require(success, "Transfer failed");

        emit StakerRewardsDistributed(staker, amount, block.timestamp);
    }

    /**
     * @notice Withdraw from treasury
     * @param recipient Recipient address
     * @param amount Withdrawal amount
     */
    function withdrawTreasury(
        address recipient,
        uint256 amount
    ) external override nonReentrant {
        _requireAdmin();

        if (recipient == address(0)) revert ZeroAddress();
        if (amount > _treasuryBalance) revert InsufficientTreasuryBalance();

        _treasuryBalance -= amount;

        (bool success, ) = recipient.call{value: amount}("");
        require(success, "Transfer failed");

        emit TreasuryWithdrawal(recipient, amount, block.timestamp);
    }

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
    ) external override {
        if (
            markets.length != claimers.length ||
            markets.length != amounts.length ||
            markets.length != outcomes.length
        ) {
            revert InvalidMarket();
        }

        for (uint256 i = 0; i < markets.length; i++) {
            try this.processRewardClaim(markets[i], claimers[i], amounts[i], outcomes[i]) {
                // Success
            } catch {
                // Continue on error
            }
        }
    }

    /**
     * @notice Collect fees from multiple markets
     * @param markets Array of market addresses
     * @param fees Array of fee amounts
     */
    function batchCollectFees(
        address[] calldata markets,
        uint256[] calldata fees
    ) external payable override {
        if (markets.length != fees.length) revert InvalidMarket();

        for (uint256 i = 0; i < markets.length; i++) {
            try this.collectFees{value: fees[i]}(markets[i], fees[i]) {
                // Success
            } catch {
                // Continue on error
            }
        }
    }

    // ============= View Functions =============

    /**
     * @notice Get fee distribution configuration
     */
    function getFeeDistribution() public view override returns (FeeDistribution memory) {
        IParameterStorage params = _getParameterStorage();

        return FeeDistribution({
            protocolFeeBps: params.getParameter(keccak256("protocolFeeBps")),
            creatorFeeBps: params.getParameter(keccak256("creatorFeeBps")),
            stakerIncentiveBps: params.getParameter(keccak256("stakerIncentiveBps")),
            treasuryFeeBps: params.getParameter(keccak256("treasuryFeeBps"))
        });
    }

    /**
     * @notice Get total fees collected for a market
     * @param market Market address
     */
    function getMarketFees(address market) external view override returns (FeeRecord memory) {
        return _marketFees[market];
    }

    /**
     * @notice Get claim record for user in market
     * @param market Market address
     * @param claimer Claimer address
     */
    function getClaimRecord(
        address market,
        address claimer
    ) external view override returns (ClaimRecord memory) {
        return _claimRecords[market][claimer];
    }

    /**
     * @notice Get unclaimed creator fees
     * @param market Market address
     */
    function getUnclaimedCreatorFees(address market) external view override returns (uint256) {
        return _unclaimedCreatorFees[market];
    }

    /**
     * @notice Get treasury balance
     */
    function getTreasuryBalance() external view override returns (uint256) {
        return _treasuryBalance;
    }

    /**
     * @notice Get total staker rewards pool
     */
    function getStakerRewardsPool() external view override returns (uint256) {
        return _stakerRewardsPool;
    }

    /**
     * @notice Get total rewards claimed by user
     * @param user User address
     */
    function getTotalRewardsClaimed(address user) external view override returns (uint256) {
        return _totalUserRewards[user];
    }

    /**
     * @notice Check if user has claimed from market
     * @param market Market address
     * @param user User address
     */
    function hasClaimed(address market, address user) external view override returns (bool) {
        return _hasClaimed[market][user];
    }

    /**
     * @notice Get total fees collected across all markets
     */
    function getTotalFeesCollected() external view override returns (uint256) {
        return _totalFeesCollected;
    }

    // ============= Configuration =============

    /**
     * @notice Update fee distribution
     * @dev This function exists for interface compatibility but fees are managed via ParameterStorage
     */
    function updateFeeDistribution(
        uint256 protocolFeeBps,
        uint256 creatorFeeBps,
        uint256 stakerIncentiveBps,
        uint256 treasuryFeeBps
    ) external override {
        _requireAdmin();

        // Total should be reasonable (max 10% total fees = 1000 bps)
        uint256 total = protocolFeeBps + creatorFeeBps + stakerIncentiveBps + treasuryFeeBps;
        if (total > 1000) revert InvalidBasisPoints();

        IParameterStorage params = _getParameterStorage();
        params.setParameter(keccak256("protocolFeeBps"), protocolFeeBps);
        params.setParameter(keccak256("creatorFeeBps"), creatorFeeBps);
        params.setParameter(keccak256("stakerIncentiveBps"), stakerIncentiveBps);
        params.setParameter(keccak256("treasuryFeeBps"), treasuryFeeBps);

        emit FeeDistributionUpdated(
            protocolFeeBps,
            creatorFeeBps,
            stakerIncentiveBps,
            treasuryFeeBps
        );
    }

    // ============= Internal Helper Functions =============

    /**
     * @notice Get ParameterStorage contract
     */
    function _getParameterStorage() private view returns (IParameterStorage) {
        address paramStorage = _registry.getContract(keccak256("ParameterStorage"));
        return IParameterStorage(paramStorage);
    }

    /**
     * @notice Get AccessControlManager contract
     */
    function _getAccessControlManager() private view returns (IAccessControlManager) {
        address accessControl = _registry.getContract(keccak256("AccessControlManager"));
        return IAccessControlManager(accessControl);
    }

    /**
     * @notice Require ADMIN_ROLE
     */
    function _requireAdmin() private view {
        IAccessControlManager accessControl = _getAccessControlManager();
        if (!accessControl.hasRole(keccak256("ADMIN_ROLE"), msg.sender)) {
            revert Unauthorized();
        }
    }

    /**
     * @notice Receive function to accept ETH
     */
    receive() external payable {
        // Accept ETH for fee collection
    }
}
