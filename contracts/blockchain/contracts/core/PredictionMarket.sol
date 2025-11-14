// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "../interfaces/IPredictionMarket.sol";
import "../interfaces/IVersionedRegistry.sol";
import "../interfaces/IParameterStorage.sol";
import "../interfaces/IAccessControlManager.sol";
import "../interfaces/IBondingCurve.sol";

/**
 * @title PredictionMarket
 * @notice Binary outcome prediction market with bonding curve pricing for KEKTECH 3.0
 * @dev Implements flexible bonding curves (LMSR, Linear, Exponential, Sigmoid) for dynamic odds
 *
 * Core Features:
 * - Binary betting (two outcomes)
 * - Flexible Bonding Curves via IBondingCurve interface
 * - Share-based accounting with ETH pool tracking
 * - Registry-based parameter management
 * - Role-based resolution control
 * - Fee distribution mechanism
 * - Non-custodial winner claims
 *
 * Gas Targets:
 * - placeBet: <100k gas (with binary search)
 * - resolveMarket: <150k gas
 * - claimWinnings: <80k gas
 * - deployment: <200k gas
 *
 * Security:
 * - Reentrancy protection
 * - Role-based access control
 * - Immutable registry reference
 * - Safe ETH transfers
 * - Bonding curve parameter validation
 */
contract PredictionMarket is IPredictionMarket, Initializable, ReentrancyGuard {
    // ============= State Variables =============

    // NOTE: MarketState enum is defined in IPredictionMarket interface

    /// @notice Current lifecycle state of the market
    /// @dev PHASE 5: Tracks market progression through lifecycle states
    MarketState public currentState;

    /// @notice Timestamp when market was activated (ACTIVE state)
    /// @dev PHASE 5: Used for lifecycle tracking and frontend display
    uint256 public activatedAt;

    /// @notice Timestamp when market was finalized (FINALIZED state)
    /// @dev PHASE 5: Used for lifecycle tracking and payout calculations
    uint256 public finalizedAt;

    /// @notice Address of whoever proposed/resolved the market outcome
    /// @dev PHASE 5: Tracks resolver for accountability and rewards
    address public resolver;

    /// @notice Factory that deployed this contract (set in initialize for cloneability)
    /// @dev Changed from immutable to support EIP-1167 clone pattern
    address public factory;

    /// @notice Reference to MasterRegistry
    address public registry;

    /// @notice Market creator address
    address public creator;

    /// @notice Unix timestamp when market can be resolved
    uint256 public resolutionTime;

    /// @notice Current market result (0 = unresolved, 1/2 = outcomes)
    Outcome public result;

    /// @notice Whether market has been resolved
    bool public isResolved;

    /// @notice Total number of bets placed
    uint256 public totalBets;

    /// @notice Total ETH volume wagered
    uint256 public totalVolume;

    /// @notice Market question
    string private _question;

    /// @notice Outcome 1 name (e.g., "Yes")
    string private _outcome1Name;

    /// @notice Outcome 2 name (e.g., "No")
    string private _outcome2Name;

    /// @notice Creation timestamp
    uint256 private _createdAt;

    /// @notice Liquidity pool for outcome 1
    uint256 private _pool1;

    /// @notice Liquidity pool for outcome 2
    uint256 private _pool2;

    /// @notice Platform fees collected
    uint256 private _platformFees;

    /// @notice Bonding curve contract for pricing (IBondingCurve implementation)
    address private _bondingCurve;

    /// @notice Curve-specific parameters (e.g., 'b' for LMSR, slope for Linear)
    uint256 private _curveParams;

    /// @notice Total YES shares issued by bonding curve
    uint256 private _yesShares;

    /// @notice Total NO shares issued by bonding curve
    uint256 private _noShares;

    /// @notice Mapping of user address to their bet
    mapping(address => BetInfo) private _bets;

    // HIGH FIX (H-2): Payout snapshot mechanism
    /// @notice Snapshot of pool sizes at resolution time (prevents claim front-running)
    uint256 private _snapshotPool1;
    uint256 private _snapshotPool2;
    uint256 private _snapshotYesShares;
    uint256 private _snapshotNoShares;
    bool private _payoutsSnapshotted;

    // ============= Constants =============

    /// @notice Virtual liquidity added to each side for odds calculation (100 shares)
    /// @dev CRITICAL: Virtual liquidity affects ONLY getOdds(), NOT payouts!
    /// @dev Solves cold start problem by ensuring first bettor gets profitable odds (>1.0x)
    /// @dev Empty market: Both sides have 100 virtual shares → 2.0x odds each side
    /// @dev Real payouts still use actual pools (_pool1, _pool2) without virtual liquidity
    /// @dev IMPORTANT: Shares are INTEGER COUNTS (not Wei!), bonding curve expects 0-10M range
    uint256 private constant VIRTUAL_LIQUIDITY = 100; // 100 shares per side (NOT ether!)

    // ============= Constructor =============

    /**
     * @notice Constructor for PredictionMarket template
     * @dev Template deployment - actual initialization happens via initialize()
     * @dev Factory address is set in initialize() to support EIP-1167 clone pattern
     * @dev CRITICAL: Lock template from initialization per OpenZeppelin Initializable pattern
     * @dev This prevents accidental initialization of the template and allows clones to be initialized
     */
    constructor() {
        // CRITICAL: Disable initializers on the template contract to prevent double-initialization
        // This locks the template so only clones (via EIP-1167) can be initialized
        _disableInitializers();
    }

    // ============= Initialization =============

    /**
     * @notice Initialize market with parameters
     * @param _registry MasterRegistry address
     * @param _questionText Market question
     * @param _outcome1 Outcome 1 name
     * @param _outcome2 Outcome 2 name
     * @param _creator Market creator address
     * @param _resolutionTime Unix timestamp for resolution
     * @param bondingCurve IBondingCurve implementation address
     * @param curveParams Curve-specific parameters (e.g., 'b' for LMSR)
     * @dev CRITICAL FIX: Enhanced validation to prevent initialization attacks
     * @dev PHASE 3: Added bonding curve parameters for flexible pricing
     */
    function initialize(
        address _registry,
        string calldata _questionText,
        string calldata _outcome1,
        string calldata _outcome2,
        address _creator,
        uint256 _resolutionTime,
        address bondingCurve,
        uint256 curveParams
    ) external initializer {
        // CRITICAL FIX: Comprehensive validation to prevent initialization attacks
        if (_registry == address(0)) revert InvalidRegistry();
        if (_creator == address(0)) revert InvalidRegistry(); // Reuse existing error
        if (bytes(_questionText).length == 0) revert InvalidOutcome(); // Reuse existing error
        if (bytes(_outcome1).length == 0 || bytes(_outcome2).length == 0)
            revert InvalidOutcome();
        if (_resolutionTime <= block.timestamp) revert InvalidResolutionTime();

        // Prevent markets with extremely far future resolution (max 2 years)
        // This also prevents the MAX_UINT256 attack vector
        if (_resolutionTime > block.timestamp + 730 days)
            revert InvalidResolutionTime();

        // Double-check: Prevent re-initialization (OpenZeppelin initializer already does this,
        // but we add explicit check as defense-in-depth)
        if (registry != address(0)) revert MarketAlreadyResolved(); // Reuse existing error

        // PHASE 3: Validate bonding curve (if provided - address(0) allowed for basic markets)
        if (bondingCurve != address(0)) {
            // Validate curve parameters using curve's own validation
            (bool valid, string memory reason) = IBondingCurve(bondingCurve).validateParams(curveParams);
            if (!valid) revert InvalidCurveParams(reason);
        }

        // Store bonding curve configuration
        _bondingCurve = bondingCurve;
        _curveParams = curveParams;

        // CRITICAL FIX: Set factory to msg.sender for EIP-1167 clone pattern
        // When factory calls initialize(), msg.sender will be the factory contract
        factory = msg.sender;

        registry = _registry;
        _question = _questionText;
        _outcome1Name = _outcome1;
        _outcome2Name = _outcome2;
        creator = _creator;
        resolutionTime = _resolutionTime;
        _createdAt = block.timestamp;
        result = Outcome.UNRESOLVED;
        isResolved = false;

        // PHASE 5: Initialize market in PROPOSED state (awaiting approval)
        currentState = MarketState.PROPOSED;
        emit MarketStateChanged(MarketState.PROPOSED, block.timestamp);
    }

    // ============= Core Functions =============

    /**
     * @notice Place a bet on an outcome
     * @param _outcome Outcome to bet on (1 or 2)
     * @param _minExpectedOdds Minimum acceptable payout odds (basis points, 0 = no limit)
     * @dev SECURITY FIX (L-1): Added slippage protection to prevent front-running
     *      If current odds < minExpectedOdds, transaction reverts
     *      This protects users from MEV bots shifting odds unfavorably
     *      Set _minExpectedOdds = 0 to disable slippage protection
     * @dev PHASE 5: Only callable when market is ACTIVE (lifecycle gated)
     */
    function placeBet(uint8 _outcome, uint256 _minExpectedOdds) external payable nonReentrant onlyWhenActive {
        if (_outcome == 0 || _outcome > 2)
            revert InvalidOutcome();

        Outcome outcome = Outcome(_outcome);
        if (msg.value == 0)
            revert InvalidBetAmount();
        if (block.timestamp >= resolutionTime)
            revert BettingClosed();
        if (isResolved)
            revert BettingClosed();

        // Get parameter storage
        IParameterStorage params = _getParameterStorage();

        // Check minimum bet (0 means no limit)
        // SECURITY FIX (M-4): Removed minBet > 0 check to prevent bypass
        // If minimumBet parameter exists, always enforce it (even if 0)
        // If parameter doesn't exist, catch block handles (no enforcement)
        try params.getParameter(keccak256("minimumBet")) returns (uint256 minBet) {
            if (msg.value < minBet) revert BetTooSmall();
        } catch {
            // No minimum bet set, continue
        }

        // Check maximum bet (0 means no limit)
        try params.getParameter(keccak256("maximumBet")) returns (uint256 maxBet) {
            if (maxBet > 0 && msg.value > maxBet) revert BetTooLarge();
        } catch {
            // No maximum bet set, continue
        }

        // SECURITY FIX (L-1): Slippage protection against front-running
        // Check if current odds meet user's minimum expectation
        if (_minExpectedOdds > 0) {
            (uint256 odds1, uint256 odds2) = this.getOdds();
            uint256 currentOdds = (outcome == Outcome.OUTCOME1) ? odds1 : odds2;

            if (currentOdds < _minExpectedOdds) {
                revert SlippageTooHigh();
            }
        }

        // PHASE 3: Calculate shares from ETH using bonding curve
        bool isYes = (outcome == Outcome.OUTCOME1);
        (uint256 sharesToBuy, uint256 actualCost) = _calculateSharesFromEth(msg.value, isYes);

        // Validate shares calculation
        if (sharesToBuy == 0) revert InvalidBetAmount();
        if (actualCost == 0) revert InvalidBetAmount();
        if (actualCost > msg.value) revert InvalidBetAmount(); // Should never happen

        // Get existing bet
        BetInfo storage bet = _bets[msg.sender];

        // If user has existing bet, must be same outcome
        if (bet.amount > 0 && bet.outcome != outcome) {
            revert CannotChangeBet();
        }

        // Update or create bet
        if (bet.amount == 0) {
            // New bet
            bet.outcome = outcome;
            bet.timestamp = block.timestamp;
            totalBets++;
        }

        // PHASE 3: Update bet with shares and actual cost spent
        bet.amount += actualCost;  // Track actual ETH spent
        bet.shares += sharesToBuy;  // Track shares received
        totalVolume += actualCost;  // Track actual volume

        // PHASE 3: Update share tracking
        if (isYes) {
            _yesShares += sharesToBuy;
            _pool1 += actualCost;  // Pool tracks actual ETH paid
        } else {
            _noShares += sharesToBuy;
            _pool2 += actualCost;  // Pool tracks actual ETH paid
        }

        // PHASE 3: Refund excess ETH if any
        uint256 refundAmount = msg.value - actualCost;
        if (refundAmount > 0) {
            (bool success, ) = msg.sender.call{value: refundAmount}("");
            if (!success) revert TransferFailed();
        }

        // PHASE 3: Emit events with share information
        emit BetPlaced(msg.sender, outcome, actualCost, sharesToBuy, block.timestamp);
        emit SharesUpdated(_yesShares, _noShares, block.timestamp);
        emit LiquidityUpdated(_pool1, _pool2, block.timestamp);
    }

    /**
     * @notice Resolve market with outcome
     * @param _result Winning outcome (1 or 2)
     * @dev Only callable by RESOLVER_ROLE or ResolutionManager after resolution time
     * @dev PHASE 5: Integrates with lifecycle - transitions ACTIVE → RESOLVING → FINALIZED
     */
    function resolveMarket(Outcome _result) external nonReentrant {
        // PHASE 5: Check lifecycle state - must be ACTIVE to start resolution
        if (currentState != MarketState.ACTIVE) {
            revert MarketNotActive();
        }

        if (isResolved) revert MarketAlreadyResolved();
        if (block.timestamp < resolutionTime) revert ResolutionTimeNotReached();
        if (_result == Outcome.UNRESOLVED || uint8(_result) > 2)
            revert InvalidOutcome();

        // Check resolver permission (RESOLVER_ROLE or ResolutionManager contract)
        IVersionedRegistry reg = IVersionedRegistry(registry);
        address resolutionManager = reg.getContract(keccak256("ResolutionManager"));

        IAccessControlManager accessControl = _getAccessControlManager();
        bool hasResolverRole = accessControl.hasRole(keccak256("RESOLVER_ROLE"), msg.sender);
        bool isResolutionManager = (msg.sender == resolutionManager);

        if (!hasResolverRole && !isResolutionManager) {
            revert UnauthorizedResolver();
        }

        // Calculate platform fees
        uint256 totalPool = _pool1 + _pool2;
        IParameterStorage params = _getParameterStorage();

        try params.getParameter(keccak256("platformFeePercent")) returns (uint256 feePercent) {
            if (feePercent > 0 && totalPool > 0) {
                _platformFees = (totalPool * feePercent) / 10000; // Basis points
            }
        } catch {
            // No fee set, continue without fees
        }

        result = _result;
        isResolved = true;

        // HIGH FIX (H-2): Snapshot pool and share state at resolution time
        // This ensures all claimants get fair payouts based on the exact state
        // at resolution, preventing any claim front-running or timing advantages
        _snapshotPool1 = _pool1;
        _snapshotPool2 = _pool2;
        _snapshotYesShares = _yesShares;
        _snapshotNoShares = _noShares;
        _payoutsSnapshotted = true;

        // PHASE 5: Transition to RESOLVING state and track resolver
        // Note: Market will transition to FINALIZED after dispute window via finalize()
        resolver = msg.sender;
        currentState = MarketState.RESOLVING;

        emit MarketResolved(_result, msg.sender, block.timestamp);
        emit ResolutionProposed(_result, msg.sender);
        emit MarketStateChanged(MarketState.RESOLVING, block.timestamp);
    }

    /**
     * @notice Claim winnings after market resolution
     * @dev Transfers payout to winner, or refund to loser if no winners exist
     * @dev PHASE 5: Only callable when market is FINALIZED (lifecycle gated)
     */
    function claimWinnings() external nonReentrant onlyWhenFinalized {
        if (!isResolved) revert MarketNotResolved();

        BetInfo storage bet = _bets[msg.sender];
        if (bet.amount == 0) revert NoBetFound();
        if (bet.claimed) revert AlreadyClaimed();

        // Calculate payout (handles both winning and refund cases)
        uint256 payout = calculatePayout(msg.sender);
        if (payout == 0) revert NotAWinner();

        // PHASE 3: Check if this is a refund scenario (no winning shares exist)
        // With bonding curves, we check shares not pools
        uint256 totalWinningShares = (result == Outcome.OUTCOME1) ? _yesShares : _noShares;
        bool isRefundScenario = (totalWinningShares == 0 && bet.outcome != result);

        // Normal case: must be winner
        if (!isRefundScenario && bet.outcome != result) {
            revert NotAWinner();
        }

        bet.claimed = true;
        bet.payout = payout;

        // Transfer winnings or refund
        (bool success, ) = msg.sender.call{value: payout}("");
        if (!success) revert TransferFailed();

        emit WinningsClaimed(msg.sender, payout, block.timestamp);
    }

    /**
     * @notice Cancel market and allow refunds
     * @dev SECURITY FIX (L-3): Only admin/resolver can cancel before resolution
     *      Allows refunds for invalid or disputed markets
     */
    function cancelMarket() external nonReentrant {
        if (isResolved) revert MarketAlreadyResolved();

        // Check admin permission
        IAccessControlManager accessControl = _getAccessControlManager();
        bool hasAdminRole = accessControl.hasRole(keccak256("ADMIN_ROLE"), msg.sender);
        bool hasResolverRole = accessControl.hasRole(keccak256("RESOLVER_ROLE"), msg.sender);

        if (!hasAdminRole && !hasResolverRole) {
            revert UnauthorizedResolver();
        }

        result = Outcome.CANCELLED;
        isResolved = true;

        emit MarketResolved(result, msg.sender, block.timestamp);
    }

    /**
     * @notice Claim refund for cancelled market
     * @dev SECURITY FIX (L-3): Returns original bet amount
     */
    function claimRefund() external nonReentrant {
        if (!isResolved || result != Outcome.CANCELLED) revert MarketNotCancelled();

        BetInfo storage bet = _bets[msg.sender];
        if (bet.amount == 0) revert NoBetFound();
        if (bet.claimed) revert AlreadyClaimed();

        // Mark as claimed first (checks-effects-interactions)
        bet.claimed = true;

        // Refund original bet amount
        uint256 refundAmount = bet.amount;
        bet.payout = refundAmount;

        (bool success, ) = msg.sender.call{value: refundAmount}("");
        if (!success) revert TransferFailed();

        emit WinningsClaimed(msg.sender, refundAmount, block.timestamp);
    }

    // ============= View Functions =============

    /**
     * @notice Get complete market information
     * @return Market info struct
     */
    function getMarketInfo() external view returns (MarketInfo memory) {
        return MarketInfo({
            question: _question,
            outcome1Name: _outcome1Name,
            outcome2Name: _outcome2Name,
            creator: creator,
            createdAt: _createdAt,
            resolutionTime: resolutionTime,
            result: result,
            totalBets: totalBets,
            totalVolume: totalVolume,
            isResolved: isResolved
        });
    }

    /**
     * @notice Get bet information for an address
     * @param bettor Address to query
     * @return Bet info struct
     */
    function getBetInfo(address bettor) external view returns (BetInfo memory) {
        return _bets[bettor];
    }

    /**
     * @notice Get current market lifecycle state (PHASE 5)
     * @return Current MarketState (PROPOSED, APPROVED, ACTIVE, RESOLVING, DISPUTED, or FINALIZED)
     * @dev Frontend uses this to render appropriate UI for each state
     */
    function getMarketState() external view returns (MarketState) {
        return currentState;
    }

    // ============= Lifecycle State Transitions (PHASE 5) =============

    /**
     * @notice Approve market (factory only)
     * @dev Transitions PROPOSED → APPROVED
     * @dev PHASE 5: Called by FlexibleMarketFactoryUnified after admin approval
     */
    function approve() external onlyFactory {
        if (currentState != MarketState.PROPOSED) {
            revert InvalidStateTransition(currentState, MarketState.APPROVED);
        }

        currentState = MarketState.APPROVED;

        emit MarketApproved(block.timestamp);
        emit MarketStateChanged(MarketState.APPROVED, block.timestamp);
    }

    /**
     * @notice Activate market (factory only)
     * @dev Transitions APPROVED → ACTIVE
     * @dev PHASE 5: Called by FlexibleMarketFactoryUnified to open trading
     */
    function activate() external onlyFactory {
        if (currentState != MarketState.APPROVED) {
            revert InvalidStateTransition(currentState, MarketState.ACTIVE);
        }

        currentState = MarketState.ACTIVE;
        activatedAt = block.timestamp;

        emit MarketActivated(block.timestamp);
        emit MarketStateChanged(MarketState.ACTIVE, block.timestamp);
    }

    /**
     * @notice Reject market (factory admin only)
     * @dev Transitions PROPOSED or APPROVED → FINALIZED
     * @dev PHASE 5: Allows admin to reject markets before activation
     * @param reason Rejection reason for transparency
     */
    function reject(string calldata reason) external onlyFactory {
        if (currentState != MarketState.PROPOSED && currentState != MarketState.APPROVED) {
            revert InvalidStateTransition(currentState, MarketState.FINALIZED);
        }

        currentState = MarketState.FINALIZED;
        finalizedAt = block.timestamp;

        emit MarketRejected(reason);
        emit MarketStateChanged(MarketState.FINALIZED, block.timestamp);
    }

    /**
     * @notice Propose market outcome and open dispute window (PHASE 5)
     * @dev Transitions ACTIVE → RESOLVING
     * @dev Called by ResolutionManager after resolution time reached
     * @param outcome Proposed winning outcome (OUTCOME1 or OUTCOME2)
     */
    function proposeOutcome(Outcome outcome) external nonReentrant {
        // Check lifecycle state - must be ACTIVE
        if (currentState != MarketState.ACTIVE) {
            revert MarketNotActive();
        }

        // Check resolution time reached
        if (block.timestamp < resolutionTime) revert ResolutionTimeNotReached();

        // Validate outcome
        if (outcome == Outcome.UNRESOLVED || uint8(outcome) > 2) {
            revert InvalidOutcome();
        }

        // Check resolver permission (RESOLVER_ROLE or ResolutionManager contract)
        IVersionedRegistry reg = IVersionedRegistry(registry);
        address resolutionManager = reg.getContract(keccak256("ResolutionManager"));

        IAccessControlManager accessControl = _getAccessControlManager();
        bool hasResolverRole = accessControl.hasRole(keccak256("RESOLVER_ROLE"), msg.sender);
        bool isResolutionManager = (msg.sender == resolutionManager);

        if (!hasResolverRole && !isResolutionManager) {
            revert UnauthorizedResolver();
        }

        // Store proposed outcome
        result = outcome;
        resolver = msg.sender;

        // Transition to RESOLVING state (dispute window opens)
        currentState = MarketState.RESOLVING;

        emit ResolutionProposed(outcome, msg.sender);
        emit MarketStateChanged(MarketState.RESOLVING, block.timestamp);
    }

    /**
     * @notice Dispute proposed outcome (PHASE 6)
     * @dev Transitions RESOLVING → DISPUTED
     * @dev Called by ResolutionManager when community disagreement ≥40%
     * @param reason Dispute reason from community votes
     */
    function dispute(string calldata reason) external {
        // Check lifecycle state - must be RESOLVING
        if (currentState != MarketState.RESOLVING) {
            revert InvalidStateTransition(currentState, MarketState.DISPUTED);
        }

        // Check caller is ResolutionManager or Factory
        IVersionedRegistry reg = IVersionedRegistry(registry);
        address resolutionManager = reg.getContract(keccak256("ResolutionManager"));

        if (msg.sender != resolutionManager && msg.sender != factory) {
            revert UnauthorizedResolver();
        }

        // Transition to DISPUTED state
        currentState = MarketState.DISPUTED;

        emit MarketDisputed(msg.sender, reason);
        emit MarketStateChanged(MarketState.DISPUTED, block.timestamp);
    }

    /**
     * @notice Finalize market outcome (PHASE 6)
     * @dev Transitions RESOLVING/DISPUTED → FINALIZED
     * @dev Called by ResolutionManager when community agreement ≥75% or admin override
     * @param outcome Final winning outcome
     */
    function finalize(Outcome outcome) external nonReentrant {
        // Check lifecycle state - must be RESOLVING or DISPUTED
        if (currentState != MarketState.RESOLVING && currentState != MarketState.DISPUTED) {
            revert InvalidStateTransition(currentState, MarketState.FINALIZED);
        }

        // Validate outcome
        if (outcome == Outcome.UNRESOLVED || uint8(outcome) > 2) {
            revert InvalidOutcome();
        }

        // Check caller is ResolutionManager or Factory
        IVersionedRegistry reg = IVersionedRegistry(registry);
        address resolutionManager = reg.getContract(keccak256("ResolutionManager"));

        if (msg.sender != resolutionManager && msg.sender != factory) {
            revert UnauthorizedResolver();
        }

        // Calculate platform fees (if not already calculated)
        if (!_payoutsSnapshotted) {
            uint256 totalPool = _pool1 + _pool2;
            IParameterStorage params = _getParameterStorage();

            try params.getParameter(keccak256("platformFeePercent")) returns (uint256 feePercent) {
                if (feePercent > 0 && totalPool > 0) {
                    _platformFees = (totalPool * feePercent) / 10000; // Basis points
                }
            } catch {
                // No fee set, continue without fees
            }

            // Snapshot pool and share state at finalization time
            _snapshotPool1 = _pool1;
            _snapshotPool2 = _pool2;
            _snapshotYesShares = _yesShares;
            _snapshotNoShares = _noShares;
            _payoutsSnapshotted = true;
        }

        // Set final outcome and mark as resolved
        result = outcome;
        isResolved = true;
        currentState = MarketState.FINALIZED;
        finalizedAt = block.timestamp;

        emit MarketFinalized(outcome, block.timestamp);
        emit MarketStateChanged(MarketState.FINALIZED, block.timestamp);
    }

    /**
     * @notice Get current odds for both outcomes (payout multiplier)
     * @return odds1 Payout odds for outcome 1 (basis points, 10000 = 1.0x)
     * @return odds2 Payout odds for outcome 2 (basis points, 10000 = 1.0x)
     * @dev PHASE 3: Uses bonding curve to calculate odds from market prices
     *      Price = Probability, Odds = 1 / Probability
     *      Example: 75% price (7500 bp) → 1.33x odds (13333 bp)
     * @dev VIRTUAL LIQUIDITY: Adds 100 BASED to each side for odds calculation
     *      - Solves cold start problem (first bettor gets >1.0x odds)
     *      - Empty market: (0+100, 0+100) → 2.0x odds both sides
     *      - Only affects odds display, NOT payouts!
     */
    function getOdds() external view returns (uint256 odds1, uint256 odds2) {
        // PHASE 3: Get prices from bonding curve
        if (_bondingCurve == address(0)) {
            // Fallback: Equal odds if no curve configured
            return (20000, 20000); // 2.0x odds for both (50/50 split)
        }

        // Add virtual liquidity to both sides for odds calculation
        // CRITICAL: Virtual liquidity ONLY for display, NOT for payouts!
        uint256 virtualYesShares = _yesShares + VIRTUAL_LIQUIDITY;
        uint256 virtualNoShares = _noShares + VIRTUAL_LIQUIDITY;

        // Get market prices from bonding curve with virtual liquidity (in basis points, 10000 = 100%)
        (uint256 price1, uint256 price2) = IBondingCurve(_bondingCurve).getPrices(
            _curveParams,
            virtualYesShares,
            virtualNoShares
        );

        // Convert prices to odds (payout multiplier)
        // Odds = 1 / Price, in basis points: odds = 10000 / (price / 10000) = 100000000 / price
        // Handle edge case: if price is 0 (should never happen), return very high odds
        if (price1 == 0) {
            odds1 = 1000000; // 100x (maximum odds cap)
        } else {
            odds1 = (100000000) / price1; // Convert price to odds
            if (odds1 > 1000000) odds1 = 1000000; // Cap at 100x
        }

        if (price2 == 0) {
            odds2 = 1000000; // 100x (maximum odds cap)
        } else {
            odds2 = (100000000) / price2; // Convert price to odds
            if (odds2 > 1000000) odds2 = 1000000; // Cap at 100x
        }

        // Minimum odds of 1.01x (10100 bp) to ensure positive expected value
        if (odds1 < 10100) odds1 = 10100;
        if (odds2 < 10100) odds2 = 10100;
    }

    /**
     * @notice Calculate payout for a bettor
     * @param bettor Address to calculate payout for
     * @return Payout amount in wei
     * @dev PHASE 3: Share-based proportional payouts from bonding curve
     *      Payout = (userShares / totalWinningShares) * netPool
     *      Each share represents proportional claim on the total pool
     *      Handles edge case where no one holds winning shares (refunds losers)
     *
     * Mathematical Model:
     * - totalPool = _pool1 + _pool2 (total ETH paid into market)
     * - netPool = totalPool - platformFees (ETH available for distribution)
     * - totalWinningShares = shares issued to winning outcome
     * - userPayout = (userShares * netPool) / totalWinningShares
     *
     * Example:
     * - Market resolved to YES
     * - Total YES shares: 1000
     * - User holds: 100 YES shares (10% of total)
     * - Net pool: 10 ETH
     * - User payout: (100 * 10 ETH) / 1000 = 1 ETH (10% of pool)
     */
    function calculatePayout(address bettor) public view returns (uint256) {
        if (!isResolved) return 0;

        BetInfo memory bet = _bets[bettor];
        if (bet.amount == 0) return 0; // No bet placed
        if (bet.shares == 0) return 0; // PHASE 3: No shares held (should never happen if amount > 0)

        // HIGH FIX (H-2): Use snapshot values for fair payout calculations
        // This prevents claim front-running and ensures consistent payouts
        uint256 snapshotYesShares = _payoutsSnapshotted ? _snapshotYesShares : _yesShares;
        uint256 snapshotNoShares = _payoutsSnapshotted ? _snapshotNoShares : _noShares;
        uint256 snapshotPool1 = _payoutsSnapshotted ? _snapshotPool1 : _pool1;
        uint256 snapshotPool2 = _payoutsSnapshotted ? _snapshotPool2 : _pool2;

        // PHASE 3: Calculate total shares for winning and losing outcomes
        uint256 totalWinningShares = (result == Outcome.OUTCOME1) ? snapshotYesShares : snapshotNoShares;
        uint256 totalLosingShares = (result == Outcome.OUTCOME1) ? snapshotNoShares : snapshotYesShares;

        // Calculate total pool (all ETH paid into market)
        uint256 totalPool = snapshotPool1 + snapshotPool2;

        // CRITICAL EDGE CASE: Handle when no one holds winning shares
        // In this case, refund all losers proportionally based on their shares
        // This is extremely rare but mathematically possible in bonding curves
        if (totalWinningShares == 0) {
            // No winners exist - refund losers proportionally by shares
            if (bet.outcome != result && totalLosingShares > 0) {
                // This bettor is a "loser" but gets refund since no winners exist
                uint256 refundPool = totalPool - _platformFees;
                // Proportional refund based on user's share of losing shares
                return (bet.shares * refundPool) / totalLosingShares;
            }
            return 0; // Safety fallback (shouldn't reach here)
        }

        // NORMAL CASE: Bettor must have bet on winning outcome
        if (bet.outcome != result) return 0; // Losers get nothing

        // Calculate net pool available for winners (after platform fees)
        uint256 netPool = totalPool - _platformFees;

        // PHASE 3: Share-based proportional payout
        // Winner's payout = (their shares / total winning shares) * net pool
        // This ensures each share has equal claim on the pool
        uint256 payout = (bet.shares * netPool) / totalWinningShares;

        return payout;
    }

    /**
     * @notice Get liquidity pools
     * @return pool1 Liquidity for outcome 1
     * @return pool2 Liquidity for outcome 2
     */
    function getLiquidity() external view returns (uint256 pool1, uint256 pool2) {
        return (_pool1, _pool2);
    }

    /**
     * @notice Check if market can be resolved
     * @return True if resolution time passed and not yet resolved
     */
    function canResolve() public view returns (bool) {
        return block.timestamp >= resolutionTime && !isResolved;
    }

    /**
     * @notice Check if address has winnings to claim
     * @param bettor Address to check
     * @return True if bettor has unclaimed winnings
     */
    function hasWinnings(address bettor) external view returns (bool) {
        if (!isResolved) return false;

        BetInfo memory bet = _bets[bettor];
        return bet.amount > 0 && bet.outcome == result && !bet.claimed;
    }

    /**
     * @notice Get total shares issued for both outcomes
     * @return yesShares Total YES shares in circulation
     * @return noShares Total NO shares in circulation
     * @dev PHASE 3: New function for bonding curve integration
     */
    function getShares() external view returns (uint256 yesShares, uint256 noShares) {
        return (_yesShares, _noShares);
    }

    /**
     * @notice Get bonding curve configuration
     * @return curve Address of the bonding curve contract
     * @return params Curve-specific parameters (e.g., 'b' for LMSR)
     * @return name Human-readable curve name
     * @dev PHASE 3: New function for bonding curve integration
     */
    function getCurveInfo() external view returns (
        address curve,
        uint256 params,
        string memory name
    ) {
        curve = _bondingCurve;
        params = _curveParams;

        // Get curve name from the bonding curve contract
        if (_bondingCurve != address(0)) {
            name = IBondingCurve(_bondingCurve).curveName();
        } else {
            name = "None";
        }
    }

    /**
     * @notice Estimate shares receivable for given ETH amount
     * @param ethAmount Amount of ETH to spend (in wei)
     * @param outcome Outcome to bet on (1 or 2)
     * @return shares Estimated number of shares (approximate via binary search)
     * @dev PHASE 3: Uses binary search to find shares for given cost
     * @dev NOTE: Result is approximate due to discrete binary search steps
     */
    function estimateShares(uint256 ethAmount, uint8 outcome) external view returns (uint256 shares) {
        if (_bondingCurve == address(0)) return 0;
        if (ethAmount == 0) return 0;
        if (outcome != 1 && outcome != 2) return 0;

        // Convert outcome to boolean
        bool isYes = (outcome == 1);

        // Binary search for shares that cost approximately ethAmount
        uint256 low = 0;
        uint256 high = ethAmount * 10; // Start with generous upper bound
        uint256 tolerance = ethAmount / 100; // 1% tolerance

        // Binary search with max 20 iterations
        for (uint256 i = 0; i < 20; i++) {
            uint256 mid = (low + high) / 2;
            if (mid == 0) return 0;

            uint256 cost = IBondingCurve(_bondingCurve).calculateCost(
                _curveParams,
                _yesShares,
                _noShares,
                isYes,
                mid
            );

            if (cost > ethAmount + tolerance) {
                high = mid - 1;
            } else if (cost < ethAmount - tolerance) {
                low = mid + 1;
            } else {
                return mid; // Found acceptable share amount
            }

            // Prevent infinite loop
            if (low >= high) break;
        }

        // Return best approximation
        return (low + high) / 2;
    }

    /**
     * @notice Estimate cost for buying given number of shares
     * @param shares Number of shares to buy
     * @param outcome Outcome to bet on (1 or 2)
     * @return cost Estimated cost in wei
     * @dev PHASE 3: Delegates to bonding curve calculateCost()
     */
    function estimateCost(uint256 shares, uint8 outcome) external view returns (uint256 cost) {
        if (_bondingCurve == address(0)) return 0;
        if (shares == 0) return 0;
        if (outcome != 1 && outcome != 2) return 0;

        // Convert outcome to boolean
        bool isYes = (outcome == 1);

        // Delegate to bonding curve
        return IBondingCurve(_bondingCurve).calculateCost(
            _curveParams,
            _yesShares,
            _noShares,
            isYes,
            shares
        );
    }

    // ============= Internal Helpers =============

    /**
     * @notice Calculate shares receivable for given ETH amount using bonding curve
     * @param ethAmount Amount of ETH being spent (in wei)
     * @param isYes True for YES, false for NO
     * @return shares Number of shares (calculated via binary search)
     * @return actualCost Actual cost for those shares (may be <= ethAmount)
     * @dev PHASE 3: Binary search to find maximum shares affordable with ethAmount
     * @dev Uses binary search with max 25 iterations for convergence
     */
    function _calculateSharesFromEth(
        uint256 ethAmount,
        bool isYes
    ) private view returns (uint256 shares, uint256 actualCost) {
        if (_bondingCurve == address(0)) return (0, 0);
        if (ethAmount == 0) return (0, 0);

        // Binary search for maximum shares we can buy with ethAmount
        uint256 low = 0;
        // CRITICAL FIX: Use fixed upper bound to stay within ABDK Math64x64 limits
        // ABDK fromUInt() requires x <= 0x7FFFFFFFFFFFFFFF (≈9.2×10^18)
        // 10M shares is more than sufficient for any realistic market
        uint256 high = 10_000_000; // 10 million shares upper bound
        uint256 bestShares = 0;
        uint256 bestCost = 0;

        // Binary search with max 25 iterations (more than enough for 10M upper bound)
        for (uint256 i = 0; i < 25; i++) {
            uint256 mid = (low + high) / 2;
            if (mid == 0) break;

            uint256 cost = IBondingCurve(_bondingCurve).calculateCost(
                _curveParams,
                _yesShares,
                _noShares,
                isYes,
                mid
            );

            if (cost <= ethAmount) {
                // Can afford these shares, try more
                bestShares = mid;
                bestCost = cost;
                low = mid + 1;
            } else {
                // Too expensive, try fewer
                high = mid - 1;
            }

            // Early exit if we found exact match
            if (cost == ethAmount) break;

            // Early exit if range is exhausted
            if (low > high) break;
        }

        return (bestShares, bestCost);
    }

    /**
     * @notice Get ParameterStorage contract from registry
     * @return ParameterStorage interface
     */
    function _getParameterStorage() private view returns (IParameterStorage) {
        IVersionedRegistry reg = IVersionedRegistry(registry);
        address params = reg.getContract(keccak256("ParameterStorage"));
        return IParameterStorage(params);
    }

    /**
     * @notice Get AccessControlManager contract from registry
     * @return AccessControlManager interface
     */
    function _getAccessControlManager() private view returns (IAccessControlManager) {
        IVersionedRegistry reg = IVersionedRegistry(registry);
        address accessControl = reg.getContract(keccak256("AccessControlManager"));
        return IAccessControlManager(accessControl);
    }

    // ============= Modifiers (PHASE 5) =============

    /**
     * @notice Restrict function to factory only
     * @dev Used for lifecycle transitions (approve, activate, reject)
     */
    modifier onlyFactory() {
        if (msg.sender != factory) {
            revert OnlyFactory();
        }
        _;
    }

    /**
     * @notice Restrict function to ACTIVE state only
     * @dev Used for trading operations (placeBet, etc.)
     */
    modifier onlyWhenActive() {
        if (currentState != MarketState.ACTIVE) {
            revert MarketNotActive();
        }
        _;
    }

    /**
     * @notice Restrict function to FINALIZED state only
     * @dev Used for payout operations (claimWinnings)
     */
    modifier onlyWhenFinalized() {
        if (currentState != MarketState.FINALIZED) {
            revert("Market not finalized");
        }
        _;
    }

    // ============= Custom Errors =============

    error InvalidResolutionTime();
    error CannotChangeBet();
    error SlippageTooHigh();  // SECURITY FIX (L-1): Slippage protection error
    error MarketNotCancelled();  // SECURITY FIX (L-3): Market cancellation error
    // NOTE: InvalidCurve, InvalidCurveParams, InsufficientShares, InvalidRegistry,
    //       OnlyFactory, MarketNotActive, MarketNotEnded, InvalidStateTransition
    //       declared in IPredictionMarket (PHASE 5)
}
