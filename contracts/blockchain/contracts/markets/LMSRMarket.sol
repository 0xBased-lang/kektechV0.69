// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../interfaces/IMarket.sol";
import "../libraries/LMSRMath.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title LMSRMarket
 * @notice LMSR (Logarithmic Market Scoring Rule) prediction market implementation
 * @dev Uses bonding curves for price discovery with true LMSR mathematics
 *
 * Key Features:
 * - LMSR bonding curves (not AMM)
 * - Works with one-sided markets
 * - Pool balance tracking for payouts
 * - Fee distribution (30% Platform, 20% Creator, 50% Staking)
 * - Full KEKTECH 3.0 integration
 *
 * CRITICAL: This is NOT an AMM - it's a bonding curve market maker
 */
contract LMSRMarket is IMarket, ReentrancyGuard {
    using LMSRMath for uint256;

    // ═══════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ═══════════════════════════════════════════════════════════

    // LMSR Parameters
    uint256 public b;              // Liquidity parameter (higher = less price impact)
    uint256 public totalYes;       // Total YES shares outstanding
    uint256 public totalNo;        // Total NO shares outstanding
    uint256 public poolBalance;    // CRITICAL: Total ETH in pool for payouts

    // User Balances
    mapping(address => uint256) public yesShares;
    mapping(address => uint256) public noShares;
    mapping(address => bool) public claimed;

    // Market Metadata
    string private _question;
    uint256 private _deadline;
    address public creator;
    uint256 public createdAt;

    // Resolution State
    Outcome private _result;
    bool private _isResolved;

    // Fee Configuration
    uint256 public constant FEE_PERCENT = 200;        // 2% total fee (in basis points)
    uint256 public constant PLATFORM_FEE = 30;        // 30% of fee → Platform
    uint256 public constant CREATOR_FEE = 20;         // 20% of fee → Creator
    uint256 public constant STAKING_FEE = 50;         // 50% of fee → Staking
    uint256 public creatorFeeAccumulated;             // Accumulated creator fees

    // KEKTECH Integration
    address public registry;                          // MasterRegistry address
    bool private initialized;                         // Initialization guard

    // ═══════════════════════════════════════════════════════════
    // ERRORS
    // ═══════════════════════════════════════════════════════════

    error AlreadyInitialized();
    error NotInitialized();
    error MarketAlreadyResolved();
    error MarketNotResolved();
    error DeadlinePassed();
    error DeadlineNotPassed();
    error InvalidOutcome();
    error NoWinnings();
    error AlreadyClaimed();
    error Unauthorized();
    error SlippageExceeded();
    error DeadlineExpired();
    error InvalidAmount();
    error InsufficientPoolBalance();

    // ═══════════════════════════════════════════════════════════
    // EVENTS (Additional to IMarket)
    // ═══════════════════════════════════════════════════════════

    event SharesPurchased(
        address indexed user,
        bool outcome,
        uint256 shares,
        uint256 cost,
        uint256 newPrice
    );

    event SharesSold(
        address indexed user,
        bool outcome,
        uint256 shares,
        uint256 refund,
        uint256 newPrice
    );

    event PoolBalanceUpdated(
        uint256 newBalance,
        int256 change
    );

    // ═══════════════════════════════════════════════════════════
    // MODIFIERS
    // ═══════════════════════════════════════════════════════════

    modifier onlyInitialized() {
        if (!initialized) revert NotInitialized();
        _;
    }

    modifier notResolved() {
        if (_isResolved) revert MarketAlreadyResolved();
        _;
    }

    modifier onlyResolved() {
        if (!_isResolved) revert MarketNotResolved();
        _;
    }

    modifier beforeDeadline() {
        if (block.timestamp >= _deadline) revert DeadlinePassed();
        _;
    }

    modifier afterDeadline() {
        if (block.timestamp < _deadline) revert DeadlineNotPassed();
        _;
    }

    // ═══════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════

    /**
     * @notice Initialize the LMSR market
     * @param _registry Address of MasterRegistry
     * @param initData ABI-encoded: (string question, uint256 deadline, uint256 liquidityParam)
     */
    function initialize(
        address _registry,
        bytes calldata initData
    ) external override {
        if (initialized) revert AlreadyInitialized();

        // Decode initialization data
        (
            string memory marketQuestion,
            uint256 marketDeadline,
            uint256 liquidityParam
        ) = abi.decode(initData, (string, uint256, uint256));

        // Set market parameters
        registry = _registry;
        _question = marketQuestion;
        _deadline = marketDeadline;
        b = liquidityParam;
        creator = tx.origin; // Original transaction sender (market creator)
        createdAt = block.timestamp;
        _result = Outcome.UNRESOLVED;
        _isResolved = false;

        initialized = true;
    }

    // ═══════════════════════════════════════════════════════════
    // CORE TRADING FUNCTIONS
    // ═══════════════════════════════════════════════════════════

    /**
     * @notice Find maximum shares purchasable for given amount using binary search
     * @dev Uses binary search to invert the LMSR cost function
     * @param amountAfterFee ETH available after fees (in wei)
     * @param liquidityParam The b parameter (liquidity)
     * @param qYes Current YES shares outstanding
     * @param qNo Current NO shares outstanding
     * @param isYes Whether buying YES (true) or NO (false)
     * @return shares Exact number of shares to purchase
     */
    function _findSharesForAmount(
        uint256 amountAfterFee,
        uint256 liquidityParam,
        uint256 qYes,
        uint256 qNo,
        bool isYes
    ) private pure returns (uint256 shares) {
        if (amountAfterFee == 0) return 0;

        // Binary search bounds
        // Lower bound: 1 share (minimum to avoid revert in calculateBuyCost)
        // Upper bound: Estimate using current price (generous upper bound)
        (uint256 yesPrice, uint256 noPrice) = LMSRMath.getPrices(liquidityParam, qYes, qNo);
        uint256 currentPrice = isYes ? yesPrice : noPrice;

        // Check if we can afford even 1 share
        uint256 costOfOne = LMSRMath.calculateBuyCost(liquidityParam, qYes, qNo, isYes, 1);
        if (costOfOne > amountAfterFee) {
            // Cannot afford even 1 share
            return 0;
        }

        // Upper bound: amount * 10000 / price gives rough estimate, multiply by 2 for safety
        uint256 low = 1; // Start at 1, not 0
        uint256 high = currentPrice > 0
            ? (amountAfterFee * 10000 * 2) / currentPrice
            : amountAfterFee * 10; // Fallback if price is 0 (shouldn't happen)

        // Ensure high is at least 2 (greater than low)
        if (high <= low) {
            high = low + 100; // Reasonable upper bound
        }

        // Ensure high bound actually exceeds our budget (prevent infinite loop)
        uint256 highCost = LMSRMath.calculateBuyCost(liquidityParam, qYes, qNo, isYes, high);
        if (highCost <= amountAfterFee) {
            // Our upper bound is too low, increase exponentially
            while (highCost <= amountAfterFee && high < type(uint128).max) {
                high = high * 2;
                highCost = LMSRMath.calculateBuyCost(liquidityParam, qYes, qNo, isYes, high);
            }
        }

        // Binary search for optimal shares
        while (high - low > 1) {
            uint256 mid = (low + high) / 2;
            uint256 cost = LMSRMath.calculateBuyCost(liquidityParam, qYes, qNo, isYes, mid);

            if (cost <= amountAfterFee) {
                low = mid; // Can afford this many shares, try more
            } else {
                high = mid; // Too expensive, try fewer
            }
        }

        // Return the maximum affordable shares (low is guaranteed >= 1 here)
        return low;
    }

    /**
     * @notice Place a bet using LMSR bonding curve
     * @param outcome 1 for YES, 2 for NO
     * @param betData ABI-encoded: (uint256 minShares) for slippage protection
     * @param minAcceptableOdds Minimum acceptable price (not used in LMSR, for interface compatibility)
     * @param txDeadline Transaction deadline
     */
    function placeBet(
        uint8 outcome,
        bytes calldata betData,
        uint256 minAcceptableOdds, // Not used in LMSR (bonding curve handles pricing)
        uint256 txDeadline
    ) external payable override onlyInitialized notResolved beforeDeadline nonReentrant {
        if (outcome != 1 && outcome != 2) revert InvalidOutcome();
        if (msg.value == 0) revert InvalidAmount();
        if (txDeadline != 0 && block.timestamp > txDeadline) revert DeadlineExpired();

        // Decode slippage protection parameter
        uint256 minShares = 0;
        if (betData.length > 0) {
            minShares = abi.decode(betData, (uint256));
        }

        bool isYes = (outcome == 1);

        // Calculate exact shares using binary search
        uint256 amountAfterFee = msg.value - _calculateFee(msg.value);

        // Use binary search to find maximum affordable shares
        uint256 sharesToBuy = _findSharesForAmount(
            amountAfterFee,
            b,
            totalYes,
            totalNo,
            isYes
        );

        // Check if we got any shares (insufficient funds for any shares)
        if (sharesToBuy == 0) revert InvalidAmount();

        // Slippage protection
        if (sharesToBuy < minShares) revert SlippageExceeded();

        // Calculate actual cost for verification
        uint256 actualCost = LMSRMath.calculateBuyCost(b, totalYes, totalNo, isYes, sharesToBuy);

        // Update state
        if (isYes) {
            totalYes += sharesToBuy;
            yesShares[msg.sender] += sharesToBuy;
        } else {
            totalNo += sharesToBuy;
            noShares[msg.sender] += sharesToBuy;
        }

        // Handle fees
        uint256 feeAmount = _calculateFee(msg.value);
        _distributeFees(feeAmount);

        // Update pool balance (CRITICAL)
        uint256 toPool = msg.value - feeAmount;
        poolBalance += toPool;

        // Get new price after trade
        (uint256 newYesPrice, uint256 newNoPrice) = LMSRMath.getPrices(b, totalYes, totalNo);
        uint256 newPrice = isYes ? newYesPrice : newNoPrice;

        emit SharesPurchased(msg.sender, isYes, sharesToBuy, actualCost, newPrice);
        emit BetPlaced(msg.sender, outcome, msg.value, block.timestamp);
        emit PoolBalanceUpdated(poolBalance, int256(toPool));
    }

    /**
     * @notice Sell shares back to the market
     * @param outcome 1 for YES, 2 for NO
     * @param shares Number of shares to sell
     * @param minRefund Minimum acceptable refund (slippage protection)
     */
    function sell(
        uint8 outcome,
        uint256 shares,
        uint256 minRefund
    ) external onlyInitialized notResolved nonReentrant {
        if (outcome != 1 && outcome != 2) revert InvalidOutcome();
        if (shares == 0) revert InvalidAmount();

        bool isYes = (outcome == 1);

        // Check user has enough shares
        uint256 userShares = isYes ? yesShares[msg.sender] : noShares[msg.sender];
        if (shares > userShares) revert InvalidAmount();

        // Calculate refund
        uint256 refund = LMSRMath.calculateSellRefund(b, totalYes, totalNo, isYes, shares);

        // Slippage protection
        if (refund < minRefund) revert SlippageExceeded();

        // Check pool has enough balance
        if (refund > poolBalance) revert InsufficientPoolBalance();

        // Update state
        if (isYes) {
            totalYes -= shares;
            yesShares[msg.sender] -= shares;
        } else {
            totalNo -= shares;
            noShares[msg.sender] -= shares;
        }

        // Update pool balance
        poolBalance -= refund;

        // Transfer refund
        payable(msg.sender).transfer(refund);

        // Get new price
        (uint256 newYesPrice, uint256 newNoPrice) = LMSRMath.getPrices(b, totalYes, totalNo);
        uint256 newPrice = isYes ? newYesPrice : newNoPrice;

        emit SharesSold(msg.sender, isYes, shares, refund, newPrice);
        emit PoolBalanceUpdated(poolBalance, -int256(refund));
    }

    // ═══════════════════════════════════════════════════════════
    // RESOLUTION & CLAIMS
    // ═══════════════════════════════════════════════════════════

    /**
     * @notice Resolve the market
     * @param outcome Final outcome
     * @dev Only callable by ResolutionManager through KEKTECH system
     */
    function resolveMarket(Outcome outcome) external override onlyInitialized afterDeadline {
        // TODO: Add ResolutionManager authorization check
        // For now, allow creator to resolve (will be updated in KEKTECH integration)
        if (msg.sender != creator) revert Unauthorized();
        if (_isResolved) revert MarketAlreadyResolved();
        if (outcome == Outcome.UNRESOLVED) revert InvalidOutcome();

        _result = outcome;
        _isResolved = true;

        emit MarketResolved(outcome, block.timestamp);
    }

    /**
     * @notice Claim winnings after resolution
     * @dev Proportional payout from poolBalance
     */
    function claimWinnings() external override onlyInitialized onlyResolved nonReentrant {
        if (claimed[msg.sender]) revert AlreadyClaimed();

        uint256 payout = calculatePayout(msg.sender);
        if (payout == 0) revert NoWinnings();

        claimed[msg.sender] = true;

        // Update pool balance
        poolBalance -= payout;

        // Transfer payout
        payable(msg.sender).transfer(payout);

        emit WinningsClaimed(msg.sender, payout);
        emit PoolBalanceUpdated(poolBalance, -int256(payout));
    }

    // ═══════════════════════════════════════════════════════════
    // FEE MANAGEMENT
    // ═══════════════════════════════════════════════════════════

    /**
     * @notice Calculate fee amount
     * @param amount Amount to calculate fee on
     * @return Fee amount in wei
     */
    function _calculateFee(uint256 amount) private pure returns (uint256) {
        return (amount * FEE_PERCENT) / 10000;
    }

    /**
     * @notice Distribute fees (30% Platform, 20% Creator, 50% Staking)
     * @param feeAmount Total fee amount to distribute
     */
    function _distributeFees(uint256 feeAmount) private {
        // Creator fee (20%) - accumulated for later withdrawal
        uint256 creatorFee = (feeAmount * CREATOR_FEE) / 100;
        creatorFeeAccumulated += creatorFee;

        // TODO: Platform + Staking fees sent to RewardDistributor when KEKTECH integration complete
        // For now, fees remain in contract until RewardDistributor is connected
        // Platform fee (30%): (feeAmount * PLATFORM_FEE) / 100
        // Staking fee (50%): (feeAmount * STAKING_FEE) / 100
    }

    /**
     * @notice Allow creator to withdraw accumulated fees
     */
    function withdrawCreatorFees() external onlyInitialized nonReentrant {
        if (msg.sender != creator) revert Unauthorized();

        uint256 amount = creatorFeeAccumulated;
        if (amount == 0) revert InvalidAmount();

        creatorFeeAccumulated = 0;
        payable(creator).transfer(amount);
    }

    // ═══════════════════════════════════════════════════════════
    // VIEW FUNCTIONS - IMarket Interface
    // ═══════════════════════════════════════════════════════════

    function isResolved() external view override returns (bool) {
        return _isResolved;
    }

    function canResolve() external view override returns (bool) {
        return block.timestamp >= _deadline && !_isResolved;
    }

    function question() external view override returns (string memory) {
        return _question;
    }

    function deadline() external view override returns (uint256) {
        return _deadline;
    }

    function result() external view override returns (Outcome) {
        return _result;
    }

    function feePercent() external pure override returns (uint256) {
        return FEE_PERCENT;
    }

    function hasWinnings(address user) external view override returns (bool) {
        if (!_isResolved) return false;
        if (claimed[user]) return false;
        return calculatePayout(user) > 0;
    }

    /**
     * @notice Calculate proportional payout from pool
     * @param user Address to calculate payout for
     * @return Payout amount in wei
     */
    function calculatePayout(address user) public view override returns (uint256) {
        if (!_isResolved) return 0;
        if (claimed[user]) return 0;

        uint256 userWinningShares;
        uint256 totalWinningShares;

        if (_result == Outcome.OUTCOME1) {
            // YES won
            userWinningShares = yesShares[user];
            totalWinningShares = totalYes;
        } else if (_result == Outcome.OUTCOME2) {
            // NO won
            userWinningShares = noShares[user];
            totalWinningShares = totalNo;
        } else if (_result == Outcome.CANCELLED) {
            // Refund proportionally based on all shares
            userWinningShares = yesShares[user] + noShares[user];
            totalWinningShares = totalYes + totalNo;
        } else {
            return 0;
        }

        if (userWinningShares == 0 || totalWinningShares == 0) return 0;

        // Proportional payout from pool
        return (userWinningShares * poolBalance) / totalWinningShares;
    }

    function getUserBet(address user, uint8 outcome) external view override returns (uint256) {
        if (outcome == 1) {
            return yesShares[user];
        } else if (outcome == 2) {
            return noShares[user];
        }
        return 0;
    }

    function hasClaimed(address user) external view override returns (bool) {
        return claimed[user];
    }

    // ═══════════════════════════════════════════════════════════
    // ADDITIONAL VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════

    /**
     * @notice Get current market prices
     * @return yesPrice Price of YES in basis points (0-10000)
     * @return noPrice Price of NO in basis points (0-10000)
     */
    function getPrices() external view returns (uint256 yesPrice, uint256 noPrice) {
        return LMSRMath.getPrices(b, totalYes, totalNo);
    }

    /**
     * @notice Estimate cost to buy shares
     * @param outcome 1 for YES, 2 for NO
     * @param shares Number of shares to buy
     * @return Estimated cost in wei (before fees)
     */
    function estimateBuyCost(uint8 outcome, uint256 shares) external view returns (uint256) {
        bool isYes = (outcome == 1);
        return LMSRMath.calculateBuyCost(b, totalYes, totalNo, isYes, shares);
    }

    /**
     * @notice Estimate refund for selling shares
     * @param outcome 1 for YES, 2 for NO
     * @param shares Number of shares to sell
     * @return Estimated refund in wei
     */
    function estimateSellRefund(uint8 outcome, uint256 shares) external view returns (uint256) {
        bool isYes = (outcome == 1);
        return LMSRMath.calculateSellRefund(b, totalYes, totalNo, isYes, shares);
    }

    /**
     * @notice Get market state summary
     * @return liquidityParam The b parameter (liquidity)
     * @return yesShares_ Total YES shares outstanding
     * @return noShares_ Total NO shares outstanding
     * @return pool Total pool balance for payouts
     * @return yesPrice_ Current YES price in basis points
     * @return noPrice_ Current NO price in basis points
     * @return resolved Whether market is resolved
     */
    function getMarketState() external view returns (
        uint256 liquidityParam,
        uint256 yesShares_,
        uint256 noShares_,
        uint256 pool,
        uint256 yesPrice_,
        uint256 noPrice_,
        bool resolved
    ) {
        (uint256 yp, uint256 np) = LMSRMath.getPrices(b, totalYes, totalNo);
        return (b, totalYes, totalNo, poolBalance, yp, np, _isResolved);
    }
}
