// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title RefundModule
 * @notice Refund functionality for timed-out markets
 * @dev Can be inherited by market contracts to add refund capability
 *
 * SECURITY: Critical protection against fund locking
 * - Enables refunds when market times out
 * - Users can claim back their bets
 * - Prevents permanent fund loss
 *
 * Usage: Market contracts inherit this module
 */
abstract contract RefundModule is ReentrancyGuard {
    // ============= State Variables =============

    /// @notice Whether refunds are enabled for this market
    bool public refundsEnabled;

    /// @notice Track user's refundable amount
    mapping(address => uint256) public refundableAmounts;

    /// @notice Track if user has claimed refund
    mapping(address => bool) public hasClaimedRefund;

    /// @notice Total amount available for refunds
    uint256 public totalRefundPool;

    /// @notice Address authorized to enable refunds (ResolutionManager)
    address public resolutionManager;

    // ============= Events =============

    event RefundsEnabled(uint256 timestamp);
    event RefundClaimed(address indexed user, uint256 amount, uint256 timestamp);
    event RefundAmountUpdated(address indexed user, uint256 amount);

    // ============= Errors =============

    error RefundsNotEnabled();
    error AlreadyClaimed();
    error NoRefundAvailable();
    error RefundTransferFailed();
    error Unauthorized();

    // ============= Modifiers =============

    modifier onlyResolutionManager() {
        if (msg.sender != resolutionManager) revert Unauthorized();
        _;
    }

    // ============= Functions =============

    /**
     * @notice Set resolution manager address
     * @param _resolutionManager Address of resolution manager
     * @dev Must be called during market initialization
     */
    function _setResolutionManager(address _resolutionManager) internal {
        require(resolutionManager == address(0), "Already set");
        resolutionManager = _resolutionManager;
    }

    /**
     * @notice Enable refunds for this market
     * @dev Only callable by ResolutionManager when timeout occurs
     *
     * SECURITY: This is called when market times out
     * - Allows users to reclaim their bets
     * - Prevents permanent fund locking
     */
    function enableRefunds() external virtual onlyResolutionManager {
        require(!refundsEnabled, "Already enabled");
        refundsEnabled = true;
        emit RefundsEnabled(block.timestamp);
    }

    /**
     * @notice Record a bet for potential refund
     * @param user User who placed bet
     * @param amount Amount to make refundable
     * @dev Called internally when user places bet
     */
    function _recordRefundableAmount(address user, uint256 amount) internal {
        refundableAmounts[user] += amount;
        totalRefundPool += amount;
        emit RefundAmountUpdated(user, refundableAmounts[user]);
    }

    /**
     * @notice Claim refund if market timed out
     * @dev Users can reclaim their bets if market never resolved
     *
     * SECURITY: Critical user protection function
     * - Returns full bet amount (minus fees already paid)
     * - Prevents loss from resolver inaction
     * - Can be called by anyone who has refundable amount
     */
    function claimRefund() external nonReentrant {
        if (!refundsEnabled) revert RefundsNotEnabled();
        if (hasClaimedRefund[msg.sender]) revert AlreadyClaimed();

        uint256 refundAmount = refundableAmounts[msg.sender];
        if (refundAmount == 0) revert NoRefundAvailable();

        // Mark as claimed
        hasClaimedRefund[msg.sender] = true;
        totalRefundPool -= refundAmount;

        // Transfer refund
        (bool success, ) = payable(msg.sender).call{value: refundAmount}("");
        if (!success) revert RefundTransferFailed();

        emit RefundClaimed(msg.sender, refundAmount, block.timestamp);
    }

    /**
     * @notice Check if user has refund available
     * @param user User to check
     * @return amount Refundable amount
     * @return canClaim Whether user can claim now
     */
    function getRefundInfo(address user) external view returns (
        uint256 amount,
        bool canClaim
    ) {
        amount = refundableAmounts[user];
        canClaim = refundsEnabled && !hasClaimedRefund[user] && amount > 0;
    }

    /**
     * @notice Get total refund statistics
     * @return totalPool Total amount in refund pool
     * @return enabled Whether refunds are enabled
     */
    function getRefundStats() external view returns (
        uint256 totalPool,
        bool enabled
    ) {
        totalPool = totalRefundPool;
        enabled = refundsEnabled;
    }
}
