// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "../interfaces/IMarket.sol";
import "../interfaces/IVersionedRegistry.sol";
import "../interfaces/IParameterStorage.sol";
import "../interfaces/IAccessControlManager.sol";
import "../interfaces/IRewardDistributor.sol";

/**
 * @title ParimutuelMarket
 * @notice Simple Pari-Mutuel betting market for binary outcomes
 * @dev Clean, efficient implementation with fixed odds at resolution
 *
 * How It Works:
 * - Users bet on YES or NO
 * - All bets go into a common pool
 * - Odds are determined at resolution (not dynamic)
 * - Winners split the pool proportionally
 * - Losers get nothing
 *
 * Example:
 * - 100 $BASED bet on YES
 * - 200 $BASED bet on NO
 * - Total pool: 300 $BASED
 * - If YES wins: Each YES bettor gets (their bet / 100) * 270 (after 10% fee)
 * - If NO wins: Each NO bettor gets (their bet / 200) * 270
 *
 * Gas Targets:
 * - placeBet: <75k gas (30% cheaper than AMM)
 * - resolveMarket: <140k gas
 * - claimWinnings: <75k gas
 * - clone + initialize: <100k gas (96% cheaper than new deployment!)
 */
contract ParimutuelMarket is IMarket, Initializable, ReentrancyGuard {
    // ═══════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ═══════════════════════════════════════════════════════════

    /// @notice Reference to MasterRegistry
    IVersionedRegistry public registry;

    /// @notice Market creator address
    address public creator;

    /// @notice Market question
    string public question;

    /// @notice Unix timestamp when betting closes
    uint256 public deadline;

    /// @notice Fee percentage in basis points (e.g., 1000 = 10%)
    uint256 public feePercent;

    /// @notice Outcome name for outcome 1
    string public outcome1;

    /// @notice Outcome name for outcome 2
    string public outcome2;

    /// @notice Final market result
    Outcome public result;

    /// @notice Total pool size (sum of all bets)
    uint256 public totalPool;

    /// @notice Total bets for outcome 1
    uint256 public outcome1Total;

    /// @notice Total bets for outcome 2
    uint256 public outcome2Total;

    /// @notice User bet information: user => outcome => amount
    mapping(address => mapping(uint8 => uint256)) private _userBets;

    /// @notice Track if user has claimed: user => hasClaimed
    mapping(address => bool) private _hasClaimed;

    /// @notice Total number of unique bettors
    uint256 public totalBettors;

    /// @notice Track if address has bet (for bettor count)
    mapping(address => bool) private _hasUserBet;

    // HIGH FIX: Whale manipulation protection
    /// @notice Maximum bet as percentage of existing pool (1000 = 10%)
    uint256 public constant MAX_BET_PERCENT = 2000; // 20% max

    /// @notice Minimum bet amount to prevent dust spam
    uint256 public constant MIN_BET = 0.001 ether; // 0.001 ETH minimum

    // CRITICAL FIX: Gas limit for claim transfers to prevent griefing
    /// @notice Maximum gas forwarded in claim transfers
    uint256 public constant CLAIM_GAS_LIMIT = 50000; // Sufficient for EOAs and simple contracts

    // CRITICAL FIX: Accumulated fees when RewardDistributor is unavailable
    /// @notice Fees accumulated when collectFees() fails
    uint256 public accumulatedFees;

    // HIGH FIX: Unclaimed winnings for pull pattern
    /// @notice Winnings stored when direct transfer fails
    mapping(address => uint256) public unclaimedWinnings;

    // ═══════════════════════════════════════════════════════════
    // ERRORS
    // ═══════════════════════════════════════════════════════════

    error AlreadyInitialized();
    error BettingClosed();
    error InvalidBetAmount();
    error BetTooSmall(); // HIGH FIX: Minimum bet enforcement
    error BetTooLarge(); // HIGH FIX: Whale protection
    error MarketAlreadyResolved(); // Renamed to avoid conflict with MarketResolved event
    error MarketNotResolved();
    error InvalidOutcome();
    error Unauthorized();
    error CannotResolveYet();
    error NoWinnings();
    error AlreadyClaimed();
    error TransferFailed();
    error SlippageTooHigh(); // MEDIUM FIX: Front-running protection
    error DeadlineExpired(); // MEDIUM FIX: Transaction deadline
    error NoUnclaimedWinnings(); // HIGH FIX: Pull pattern

    // ═══════════════════════════════════════════════════════════
    // MODIFIERS
    // ═══════════════════════════════════════════════════════════

    /**
     * @notice Restrict to authorized resolvers only
     */
    modifier onlyResolver() {
        IAccessControlManager acm = IAccessControlManager(
            registry.getContract(keccak256("AccessControlManager"))
        );
        if (!acm.hasRole(keccak256("RESOLVER_ROLE"), msg.sender)) {
            revert Unauthorized();
        }
        _;
    }

    // ═══════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════

    /**
     * @notice Initialize the market (called once after cloning)
     * @param _registry Address of the MasterRegistry
     * @param initData ABI-encoded initialization data:
     *        (string question, string outcome1, string outcome2,
     *         address creator, uint256 deadline, uint256 feePercent)
     */
    function initialize(
        address _registry,
        bytes calldata initData
    ) external override initializer {
        // Decode initialization data
        (
            string memory _question,
            string memory _outcome1,
            string memory _outcome2,
            address _creator,
            uint256 _deadline,
            uint256 _feePercent
        ) = abi.decode(initData, (string, string, string, address, uint256, uint256));

        // Validate inputs
        require(_registry != address(0), "Invalid registry");
        require(_creator != address(0), "Invalid creator");
        require(_deadline > block.timestamp, "Invalid deadline");
        require(_feePercent <= 5000, "Fee too high"); // Max 50%
        require(bytes(_question).length > 0, "Empty question");

        // Set state
        registry = IVersionedRegistry(_registry);
        creator = _creator;
        question = _question;
        outcome1 = _outcome1;
        outcome2 = _outcome2;
        deadline = _deadline;
        feePercent = _feePercent;
        result = Outcome.UNRESOLVED;
    }

    // ═══════════════════════════════════════════════════════════
    // CORE BETTING LOGIC
    // ═══════════════════════════════════════════════════════════

    /**
     * @notice Place a bet on an outcome
     * @param outcome Outcome to bet on (1 or 2)
     * @param betData Not used in Pari-Mutuel (included for interface compatibility)
     * @param minAcceptableOdds Minimum odds in basis points (e.g., 4500 = 45%) - use 0 to disable
     * @param transactionDeadline Transaction must execute before this timestamp - use 0 to disable
     * @dev MEDIUM FIX: Added slippage protection and deadline to prevent front-running
     */
    function placeBet(
        uint8 outcome,
        bytes calldata betData,
        uint256 minAcceptableOdds,
        uint256 transactionDeadline
    ) external payable override nonReentrant {
        // MEDIUM FIX: Check transaction deadline if specified
        if (transactionDeadline > 0 && block.timestamp > transactionDeadline) {
            revert DeadlineExpired();
        }

        // Validate betting conditions
        if (block.timestamp >= deadline) revert BettingClosed();
        if (result != Outcome.UNRESOLVED) revert MarketAlreadyResolved();
        if (outcome != 1 && outcome != 2) revert InvalidOutcome();
        if (msg.value == 0) revert InvalidBetAmount();

        // HIGH FIX: Minimum bet enforcement (prevent dust spam)
        if (msg.value < MIN_BET) revert BetTooSmall();

        // HIGH FIX: Maximum bet enforcement (prevent whale manipulation)
        if (totalPool > 0) {
            uint256 maxBet = (totalPool * MAX_BET_PERCENT) / 10000;
            if (msg.value > maxBet) revert BetTooLarge();
        }

        // MEDIUM FIX: Calculate odds AFTER this bet and check slippage
        if (minAcceptableOdds > 0) {
            uint256 newTotalPool = totalPool + msg.value;
            uint256 newOutcomeTotal = outcome == 1
                ? outcome1Total + msg.value
                : outcome2Total + msg.value;
            uint256 otherTotal = newTotalPool - newOutcomeTotal;

            // Calculate implied odds for this outcome after bet
            // odds = (other side / total pool) * 10000
            uint256 impliedOdds = (otherTotal * 10000) / newTotalPool;

            if (impliedOdds < minAcceptableOdds) {
                revert SlippageTooHigh();
            }
        }

        // Track unique bettors
        if (!_hasUserBet[msg.sender]) {
            _hasUserBet[msg.sender] = true;
            totalBettors++;
        }

        // Update pools
        totalPool += msg.value;
        if (outcome == 1) {
            outcome1Total += msg.value;
        } else {
            outcome2Total += msg.value;
        }

        // Update user bet
        _userBets[msg.sender][outcome] += msg.value;

        emit BetPlaced(msg.sender, outcome, msg.value, block.timestamp);
    }

    // ═══════════════════════════════════════════════════════════
    // RESOLUTION
    // ═══════════════════════════════════════════════════════════

    /**
     * @notice Resolve the market with final outcome
     * @param _result Final outcome (OUTCOME1, OUTCOME2, or CANCELLED)
     * @dev CRITICAL FIX: Handles edge case where no one bet on winning side
     */
    function resolveMarket(
        Outcome _result
    ) external override onlyResolver nonReentrant {
        if (result != Outcome.UNRESOLVED) revert MarketAlreadyResolved();
        if (block.timestamp < deadline) revert CannotResolveYet();
        if (_result != Outcome.OUTCOME1 && _result != Outcome.OUTCOME2 && _result != Outcome.CANCELLED) {
            revert InvalidOutcome();
        }

        // CRITICAL FIX: Check for zero winning pool edge case
        if (_result != Outcome.CANCELLED) {
            uint256 winningTotal = _result == Outcome.OUTCOME1 ? outcome1Total : outcome2Total;

            if (winningTotal == 0) {
                // No one bet on winning side - cancel market and refund everyone
                result = Outcome.CANCELLED;
                emit MarketResolved(Outcome.CANCELLED, block.timestamp);
                return; // Skip fee collection since market is cancelled
            }
        }

        result = _result;

        // Calculate and collect fees
        // CRITICAL FIX: Wrap fee collection in try-catch to prevent market bricking
        if (totalPool > 0) {
            uint256 fees = (totalPool * feePercent) / 10000;

            if (fees > 0) {
                IRewardDistributor rewardDist = IRewardDistributor(
                    registry.getContract(keccak256("RewardDistributor"))
                );

                // Try to collect fees - if fails, store for later withdrawal
                try rewardDist.collectFees{value: fees}(address(this), fees) {
                    // Fee collection succeeded
                    emit FeesCollected(address(rewardDist), fees);
                } catch Error(string memory reason) {
                    // Fee collection failed with error message - store fees in contract
                    accumulatedFees += fees;
                    emit FeeCollectionFailed(fees, reason);
                } catch (bytes memory) {
                    // Low-level failure (no error message) - store fees
                    accumulatedFees += fees;
                    emit FeeCollectionFailed(fees, "Low-level failure");
                }
            }
        }

        emit MarketResolved(_result, block.timestamp);
    }

    /**
     * @notice Admin function to manually withdraw accumulated fees
     * @dev Only callable by admin when fees accumulate due to RewardDistributor issues
     *      CRITICAL FIX: Prevents funds from being permanently locked
     */
    function withdrawAccumulatedFees() external nonReentrant {
        // Check admin permission
        IAccessControlManager acm = IAccessControlManager(
            registry.getContract(keccak256("AccessControlManager"))
        );
        require(
            acm.hasRole(keccak256("ADMIN_ROLE"), msg.sender),
            "Only admin"
        );

        uint256 amount = accumulatedFees;
        require(amount > 0, "No accumulated fees");

        accumulatedFees = 0;

        // Try to send to RewardDistributor again
        IRewardDistributor rewardDist = IRewardDistributor(
            registry.getContract(keccak256("RewardDistributor"))
        );

        try rewardDist.collectFees{value: amount}(address(this), amount) {
            emit AccumulatedFeesWithdrawn(amount, msg.sender);
        } catch {
            // If still fails, send directly to admin as last resort (admin can forward to treasury)
            (bool success, ) = payable(msg.sender).call{value: amount}("");
            require(success, "Emergency withdrawal failed");
            emit AccumulatedFeesWithdrawn(amount, msg.sender);
        }
    }

    // ═══════════════════════════════════════════════════════════
    // CLAIMING WINNINGS
    // ═══════════════════════════════════════════════════════════

    /**
     * @notice Claim winnings after market resolution
     * @dev HIGH FIX: Gas-limited transfer with pull pattern fallback to prevent griefing
     */
    function claimWinnings() external override nonReentrant {
        if (result == Outcome.UNRESOLVED) revert MarketNotResolved();
        if (_hasClaimed[msg.sender]) revert AlreadyClaimed();

        uint256 payout = calculatePayout(msg.sender);
        if (payout == 0) revert NoWinnings();

        _hasClaimed[msg.sender] = true;

        // HIGH FIX: Limit gas to prevent griefing attacks
        (bool success, ) = payable(msg.sender).call{
            gas: CLAIM_GAS_LIMIT, // 50,000 gas limit
            value: payout
        }("");

        if (!success) {
            // Transfer failed - store for pull withdrawal
            unclaimedWinnings[msg.sender] = payout;
            emit ClaimFailed(msg.sender, payout);
            emit UnclaimedWinningsStored(msg.sender, payout);
            return; // Don't revert - user can withdraw later
        }

        emit WinningsClaimed(msg.sender, payout);
    }

    /**
     * @notice Withdraw unclaimed winnings (pull pattern)
     * @dev For users whose claimWinnings() failed due to contract issues
     *      HIGH FIX: Provides fallback withdrawal mechanism
     */
    function withdrawUnclaimed() external nonReentrant {
        uint256 amount = unclaimedWinnings[msg.sender];
        if (amount == 0) revert NoUnclaimedWinnings();

        unclaimedWinnings[msg.sender] = 0;

        // Try again with gas limit
        (bool success, ) = payable(msg.sender).call{
            gas: CLAIM_GAS_LIMIT,
            value: amount
        }("");

        if (!success) {
            // Still failed - restore amount
            unclaimedWinnings[msg.sender] = amount;
            revert TransferFailed();
        }

        emit WinningsWithdrawn(msg.sender, amount);
    }

    // ═══════════════════════════════════════════════════════════
    // VIEW FUNCTIONS - MARKET STATE
    // ═══════════════════════════════════════════════════════════

    /**
     * @notice Check if market is resolved
     */
    function isResolved() external view override returns (bool) {
        return result != Outcome.UNRESOLVED;
    }

    /**
     * @notice Check if market can be resolved
     */
    function canResolve() external view override returns (bool) {
        return block.timestamp >= deadline && result == Outcome.UNRESOLVED;
    }

    // ═══════════════════════════════════════════════════════════
    // VIEW FUNCTIONS - USER STATE
    // ═══════════════════════════════════════════════════════════

    /**
     * @notice Check if user has unclaimed winnings
     * @param user Address to check
     */
    function hasWinnings(address user) external view override returns (bool) {
        if (result == Outcome.UNRESOLVED) return false;
        if (_hasClaimed[user]) return false;
        return calculatePayout(user) > 0;
    }

    /**
     * @notice Calculate potential payout for a user
     * @param user Address to check
     * @return Payout amount in wei (0 if lost or already claimed)
     * @dev CRITICAL FIX: Handles CANCELLED markets with full refunds
     */
    function calculatePayout(address user) public view override returns (uint256) {
        if (result == Outcome.UNRESOLVED) return 0;
        if (_hasClaimed[user]) return 0;

        // CRITICAL FIX: Handle cancelled markets - refund all bets
        if (result == Outcome.CANCELLED) {
            return _userBets[user][1] + _userBets[user][2];
        }

        // Determine which outcome won
        uint8 winningOutcome = result == Outcome.OUTCOME1 ? 1 : 2;
        uint256 userBet = _userBets[user][winningOutcome];

        if (userBet == 0) return 0;

        // Get winning pool total
        uint256 winningTotal = winningOutcome == 1 ? outcome1Total : outcome2Total;

        // CRITICAL FIX: This should never happen due to resolveMarket() validation
        // But add safety check just in case
        require(winningTotal > 0, "Invalid market state");

        // Calculate payout: (user bet / winning total) * pool after fees
        uint256 poolAfterFees = totalPool - ((totalPool * feePercent) / 10000);
        return (userBet * poolAfterFees) / winningTotal;
    }

    /**
     * @notice Get user's bet amount for a specific outcome
     * @param user Address to check
     * @param outcome Outcome to check (1 or 2)
     */
    function getUserBet(
        address user,
        uint8 outcome
    ) external view override returns (uint256) {
        return _userBets[user][outcome];
    }

    /**
     * @notice Check if user has already claimed winnings
     * @param user Address to check
     */
    function hasClaimed(address user) external view override returns (bool) {
        return _hasClaimed[user];
    }

    // ═══════════════════════════════════════════════════════════
    // ADDITIONAL VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════

    /**
     * @notice Get current implied odds for each outcome
     * @return odds1 Implied odds for outcome 1 (basis points, e.g., 6000 = 60%)
     * @return odds2 Implied odds for outcome 2 (basis points)
     * @dev These are IMPLIED odds based on current pool distribution
     * @dev Actual odds are only fixed at resolution
     * @dev MEDIUM FIX: Gas optimized by caching totalPool
     */
    function getCurrentImpliedOdds() external view returns (uint256 odds1, uint256 odds2) {
        // MEDIUM FIX: Cache totalPool to save SLOAD gas
        uint256 pool = totalPool;

        if (pool == 0) {
            return (5000, 5000); // 50/50 if no bets
        }

        // Odds represent the probability implied by pool sizes
        // Higher pool = lower odds (more popular)
        odds1 = (outcome2Total * 10000) / pool;
        odds2 = (outcome1Total * 10000) / pool;
    }

    /**
     * @notice Get market statistics
     * @return _totalPool Total ETH in the pool
     * @return _outcome1Total Total ETH bet on outcome 1
     * @return _outcome2Total Total ETH bet on outcome 2
     * @return _totalBettors Number of unique bettors
     */
    function getMarketStats() external view returns (
        uint256 _totalPool,
        uint256 _outcome1Total,
        uint256 _outcome2Total,
        uint256 _totalBettors
    ) {
        return (totalPool, outcome1Total, outcome2Total, totalBettors);
    }

    // ═══════════════════════════════════════════════════════════
    // EMERGENCY FUNCTIONS
    // ═══════════════════════════════════════════════════════════

    /**
     * @notice Emergency withdrawal function (only after 90 days + resolved)
     * @dev Last resort if something goes wrong - requires admin + time delay
     *      SAFETY FIX: Prevents permanent fund locking in extreme scenarios
     */
    function emergencyWithdraw() external nonReentrant {
        // Check admin permission
        IAccessControlManager acm = IAccessControlManager(
            registry.getContract(keccak256("AccessControlManager"))
        );
        require(
            acm.hasRole(keccak256("ADMIN_ROLE"), msg.sender),
            "Only admin"
        );

        // Require market is resolved
        require(result != Outcome.UNRESOLVED, "Market not resolved");

        // Require 90 days have passed since deadline
        require(
            block.timestamp > deadline + 90 days,
            "Too early for emergency withdrawal"
        );

        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");

        (bool success, ) = msg.sender.call{value: balance}("");
        require(success, "Emergency withdrawal failed");

        emit EmergencyWithdrawal(balance, msg.sender, block.timestamp);
    }
}
