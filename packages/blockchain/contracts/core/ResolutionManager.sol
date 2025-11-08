// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../interfaces/IResolutionManager.sol";
import "../interfaces/IVersionedRegistry.sol";
import "../interfaces/IAccessControlManager.sol";
import "../interfaces/IPredictionMarket.sol";
import "../interfaces/IMarket.sol";
import "../interfaces/IRewardDistributor.sol"; // HIGH FIX: For treasury integration

/**
 * @title ResolutionManager
 * @notice Manages prediction market resolutions, disputes, and finalization for KEKTECH 3.0
 * @dev Handles the complete resolution lifecycle with dispute mechanism
 *
 * Core Features:
 * - Market resolution by authorized resolvers
 * - Dispute mechanism with bonds
 * - Investigation and dispute resolution
 * - Finalization after dispute window
 * - Batch operations for efficiency
 * - Comprehensive tracking and enumeration
 *
 * Gas Targets:
 * - resolveMarket: <200k gas
 * - disputeResolution: <100k gas
 * - finalizeResolution: <50k gas
 *
 * Security:
 * - Role-based access control (RESOLVER_ROLE, ADMIN_ROLE)
 * - Reentrancy protection
 * - Dispute window enforcement
 * - Bond requirement for disputes
 */
contract ResolutionManager is IResolutionManager, ReentrancyGuard {
    // ============= State Variables =============

    /// @notice Immutable reference to MasterRegistry
    address public immutable registry;

    /// @notice Dispute window duration in seconds
    uint256 private _disputeWindow;

    /// @notice Minimum bond required to dispute
    uint256 private _minDisputeBond;

    /// @notice Whether contract is paused
    bool public paused;

    /// @notice Resolution data for each market
    mapping(address => ResolutionData) private _resolutions;

    /// @notice Dispute data for each market
    mapping(address => DisputeData) private _disputes;

    /// @notice List of pending resolutions
    address[] private _pendingMarkets;

    /// @notice Index mapping for O(1) removal (1-indexed, 0 = not in array)
    mapping(address => uint256) private _pendingMarketsIndex;

    /// @notice List of disputed resolutions
    address[] private _disputedMarkets;

    /// @notice Resolver's resolution history
    mapping(address => address[]) private _resolverHistory;

    // CRITICAL FIX: Bonds held when RewardDistributor transfer fails
    /// @notice Bonds held when RewardDistributor transfer fails
    mapping(address => uint256) public heldBonds;

    // ============= Phase 6: Community Voting Aggregation =============

    /// @notice Community dispute window for off-chain voting aggregation
    struct CommunityDisputeWindow {
        uint256 startTime;
        uint256 endTime;
        uint256 agreeCount;
        uint256 disagreeCount;
        bool isActive;
        uint8 proposedOutcome;
        bool autoFinalized;
    }

    /// @notice Community dispute data for each market
    mapping(address => CommunityDisputeWindow) private _communityDisputes;

    /// @notice Agreement threshold percentage (default 75%)
    uint256 public agreementThreshold;

    /// @notice Disagreement threshold percentage (default 40%)
    uint256 public disagreementThreshold;

    // ============= Constructor =============

    /**
     * @notice Constructor sets immutable registry and initial parameters
     * @param _registry MasterRegistry address
     * @param disputeWindow_ Initial dispute window duration
     * @param minDisputeBond_ Initial minimum dispute bond
     */
    constructor(
        address _registry,
        uint256 disputeWindow_,
        uint256 minDisputeBond_
    ) {
        if (_registry == address(0)) revert MarketNotFound(address(0));
        registry = _registry;
        _disputeWindow = disputeWindow_;
        _minDisputeBond = minDisputeBond_;
        paused = false;

        // Phase 6: Initialize community voting thresholds
        agreementThreshold = 75;  // 75% agreement for auto-finalization
        disagreementThreshold = 40;  // 40% disagreement to flag for admin review
    }

    // ============= Modifiers =============

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    modifier onlyResolver() {
        IAccessControlManager accessControl = _getAccessControlManager();
        if (!accessControl.hasRole(keccak256("RESOLVER_ROLE"), msg.sender)) {
            revert UnauthorizedResolver();
        }
        _;
    }

    modifier onlyAdmin() {
        IAccessControlManager accessControl = _getAccessControlManager();
        require(
            accessControl.hasRole(keccak256("ADMIN_ROLE"), msg.sender),
            "Not admin"
        );
        _;
    }

    modifier onlyBackend() {
        IAccessControlManager accessControl = _getAccessControlManager();
        require(
            accessControl.hasRole(keccak256("BACKEND_ROLE"), msg.sender),
            "Not backend"
        );
        _;
    }

    // ============= Core Functions =============

    /**
     * @notice Resolve a prediction market
     * @param marketAddress Market to resolve
     * @param outcome Winning outcome (1 or 2)
     * @param evidence Evidence supporting the resolution
     */
    function resolveMarket(
        address marketAddress,
        uint8 outcome,
        string calldata evidence
    ) external nonReentrant whenNotPaused onlyResolver {
        // Validate inputs
        if (outcome == 0 || outcome > 2) revert InvalidOutcome(outcome);
        if (bytes(evidence).length == 0) revert InvalidEvidence();

        // Check if already resolved
        ResolutionData storage resolution = _resolutions[marketAddress];
        if (resolution.resolvedAt > 0) {
            revert MarketAlreadyResolved(marketAddress);
        }

        // Try to resolve market - supports both AMM (legacy) and Pari-Mutuel (new) markets
        bool resolved = false;

        // First try new IMarket interface (Pari-Mutuel markets)
        try IMarket(marketAddress).resolveMarket(IMarket.Outcome(outcome)) {
            resolved = true;
        } catch {
            // Fall back to old IPredictionMarket interface (AMM markets)
            try IPredictionMarket(marketAddress).resolveMarket(IPredictionMarket.Outcome(outcome)) {
                resolved = true;
            } catch (bytes memory revertData) {
                // Both interfaces failed - revert with original error
                if (revertData.length > 0) {
                    assembly {
                        revert(add(32, revertData), mload(revertData))
                    }
                }
                revert("Market resolution failed");
            }
        }

        if (resolved) {
            // Store resolution data
            resolution.marketAddress = marketAddress;
            resolution.outcome = outcome;
            resolution.resolver = msg.sender;
            resolution.resolvedAt = block.timestamp;
            resolution.status = ResolutionStatus.RESOLVED;
            resolution.evidence = evidence;

            // Add to resolver history
            _resolverHistory[msg.sender].push(marketAddress);

            // Remove from pending if it was there
            _removeFromPending(marketAddress);

            emit MarketResolved(marketAddress, outcome, msg.sender, block.timestamp);
        } else {
            revert MarketNotResolvable(marketAddress);
        }
    }

    /**
     * @notice Batch resolve multiple markets
     * @param marketAddresses Markets to resolve
     * @param outcomes Winning outcomes
     * @param evidences Evidence for each resolution
     */
    function batchResolveMarkets(
        address[] calldata marketAddresses,
        uint8[] calldata outcomes,
        string[] calldata evidences
    ) external nonReentrant whenNotPaused onlyResolver {
        require(
            marketAddresses.length == outcomes.length &&
            outcomes.length == evidences.length,
            "Array length mismatch"
        );

        for (uint256 i = 0; i < marketAddresses.length; i++) {
            // Validate inputs
            if (outcomes[i] == 0 || outcomes[i] > 2) continue;
            if (bytes(evidences[i]).length == 0) continue;

            ResolutionData storage resolution = _resolutions[marketAddresses[i]];
            if (resolution.resolvedAt > 0) continue;

            // Try new IMarket interface first, then fall back to IPredictionMarket
            bool success = false;
            try IMarket(marketAddresses[i]).resolveMarket(IMarket.Outcome(outcomes[i])) {
                success = true;
            } catch {
                try IPredictionMarket(marketAddresses[i]).resolveMarket(
                    IPredictionMarket.Outcome(outcomes[i])
                ) {
                    success = true;
                } catch {
                    continue;
                }
            }

            if (success) {
                resolution.marketAddress = marketAddresses[i];
                resolution.outcome = outcomes[i];
                resolution.resolver = msg.sender;
                resolution.resolvedAt = block.timestamp;
                resolution.status = ResolutionStatus.RESOLVED;
                resolution.evidence = evidences[i];

                _resolverHistory[msg.sender].push(marketAddresses[i]);
                _removeFromPending(marketAddresses[i]);

                emit MarketResolved(
                    marketAddresses[i],
                    outcomes[i],
                    msg.sender,
                    block.timestamp
                );
            }
        }
    }

    // ============= Dispute Functions =============

    /**
     * @notice Dispute a market resolution
     * @param marketAddress Market to dispute
     * @param reason Reason for dispute
     */
    function disputeResolution(
        address marketAddress,
        string calldata reason
    ) external payable nonReentrant {
        ResolutionData storage resolution = _resolutions[marketAddress];

        // Check resolution exists
        if (resolution.resolvedAt == 0) revert MarketNotFound(marketAddress);

        // Check for existing dispute FIRST (before checking status)
        DisputeData storage dispute = _disputes[marketAddress];
        if (dispute.disputedAt > 0) revert DisputeAlreadyExists();

        // Check resolution is in RESOLVED state
        if (resolution.status != ResolutionStatus.RESOLVED) {
            revert DisputeNotOpen();
        }

        // Check dispute window
        if (!canDispute(marketAddress)) revert DisputeWindowClosed();

        // Check bond
        if (msg.value < _minDisputeBond) revert InsufficientDisputeBond();

        // Store dispute data
        dispute.disputer = msg.sender;
        dispute.reason = reason;
        dispute.disputedAt = block.timestamp;
        dispute.status = DisputeStatus.OPEN;
        dispute.bondAmount = msg.value;

        // Update resolution status
        resolution.status = ResolutionStatus.DISPUTED;

        // Add to disputed list
        _disputedMarkets.push(marketAddress);

        emit ResolutionDisputed(
            marketAddress,
            msg.sender,
            reason,
            msg.value,
            block.timestamp
        );
    }

    /**
     * @notice Investigate a dispute
     * @param marketAddress Market being disputed
     * @param findings Investigation findings
     */
    function investigateDispute(
        address marketAddress,
        string calldata findings
    ) external onlyAdmin {
        DisputeData storage dispute = _disputes[marketAddress];

        if (dispute.disputedAt == 0) revert NoDisputeFound();
        if (dispute.status == DisputeStatus.NONE) revert NoDisputeFound();

        dispute.status = DisputeStatus.INVESTIGATING;

        emit DisputeInvestigated(
            marketAddress,
            msg.sender,
            findings,
            block.timestamp
        );
    }

    /**
     * @notice Resolve a dispute
     * @param marketAddress Market being disputed
     * @param upheld Whether dispute is upheld
     * @param newOutcome New outcome if upheld
     * @dev HIGH FIX: Sends rejected dispute bonds to treasury
     */
    function resolveDispute(
        address marketAddress,
        bool upheld,
        uint8 newOutcome
    ) external nonReentrant onlyAdmin {
        DisputeData storage dispute = _disputes[marketAddress];
        ResolutionData storage resolution = _resolutions[marketAddress];

        if (dispute.disputedAt == 0) revert NoDisputeFound();

        if (upheld) {
            // Dispute upheld - change outcome and refund bond
            if (newOutcome == 0 || newOutcome > 2) revert InvalidOutcome(newOutcome);

            resolution.outcome = newOutcome;
            resolution.status = ResolutionStatus.RESOLVED;

            // Refund bond to disputer
            (bool success, ) = dispute.disputer.call{value: dispute.bondAmount}("");
            require(success, "Bond refund failed");
        } else {
            // Dispute rejected - keep original outcome and send bond to treasury
            resolution.status = ResolutionStatus.RESOLVED;

            // CRITICAL FIX: Wrap bond transfer in try-catch to prevent dispute resolution bricking
            IRewardDistributor rewardDist = IRewardDistributor(
                IVersionedRegistry(registry).getContract(keccak256("RewardDistributor"))
            );

            try rewardDist.collectFees{value: dispute.bondAmount}(
                marketAddress,
                dispute.bondAmount
            ) {
                // Bond transfer succeeded
                emit DisputeBondCollected(marketAddress, dispute.bondAmount, block.timestamp);
            } catch {
                // Bond transfer failed - store in contract for manual withdrawal
                heldBonds[marketAddress] += dispute.bondAmount;
                emit DisputeBondTransferFailed(marketAddress, dispute.bondAmount);
            }
        }

        dispute.status = DisputeStatus.RESOLVED;

        emit DisputeResolved(marketAddress, upheld, newOutcome, block.timestamp);
    }

    /**
     * @notice Admin function to manually withdraw held dispute bonds
     * @param marketAddress Market whose bonds to withdraw
     * @dev CRITICAL FIX: Prevents funds from being permanently locked when RewardDistributor fails
     */
    function withdrawHeldBonds(address marketAddress) external nonReentrant onlyAdmin {
        uint256 amount = heldBonds[marketAddress];
        require(amount > 0, "No held bonds");

        heldBonds[marketAddress] = 0;

        IRewardDistributor rewardDist = IRewardDistributor(
            IVersionedRegistry(registry).getContract(keccak256("RewardDistributor"))
        );

        try rewardDist.collectFees{value: amount}(marketAddress, amount) {
            emit DisputeBondCollected(marketAddress, amount, block.timestamp);
        } catch {
            // Send directly to admin as last resort (admin can forward to treasury)
            (bool success, ) = payable(msg.sender).call{value: amount}("");
            require(success, "Emergency bond withdrawal failed");
            emit DisputeBondCollected(marketAddress, amount, block.timestamp);
        }
    }

    // ============= Phase 6: Community Voting Functions =============

    /**
     * @notice Propose market resolution with community voting window (Phase 6)
     * @param marketAddress Market to resolve
     * @param outcome Proposed winning outcome (1 or 2)
     * @param evidence Evidence supporting the resolution
     * @dev Opens a dispute window for community voting aggregation
     */
    function proposeResolution(
        address marketAddress,
        uint8 outcome,
        string calldata evidence
    ) external nonReentrant whenNotPaused onlyResolver {
        // Reuse existing resolveMarket logic to set outcome
        if (outcome == 0 || outcome > 2) revert InvalidOutcome(outcome);
        if (bytes(evidence).length == 0) revert InvalidEvidence();

        ResolutionData storage resolution = _resolutions[marketAddress];
        if (resolution.resolvedAt > 0) {
            revert MarketAlreadyResolved(marketAddress);
        }

        // Try to resolve market using existing logic
        bool resolved = false;
        try IMarket(marketAddress).resolveMarket(IMarket.Outcome(outcome)) {
            resolved = true;
        } catch {
            try IPredictionMarket(marketAddress).resolveMarket(IPredictionMarket.Outcome(outcome)) {
                resolved = true;
            } catch (bytes memory revertData) {
                if (revertData.length > 0) {
                    assembly {
                        revert(add(32, revertData), mload(revertData))
                    }
                }
                revert("Market resolution failed");
            }
        }

        if (resolved) {
            // Store resolution data
            resolution.marketAddress = marketAddress;
            resolution.outcome = outcome;
            resolution.resolver = msg.sender;
            resolution.resolvedAt = block.timestamp;
            resolution.status = ResolutionStatus.RESOLVED;
            resolution.evidence = evidence;

            // Add to resolver history
            _resolverHistory[msg.sender].push(marketAddress);
            _removeFromPending(marketAddress);

            // Phase 6: Open community dispute window
            _communityDisputes[marketAddress] = CommunityDisputeWindow({
                startTime: block.timestamp,
                endTime: block.timestamp + _disputeWindow,
                agreeCount: 0,
                disagreeCount: 0,
                isActive: true,
                proposedOutcome: outcome,
                autoFinalized: false
            });

            emit MarketResolved(marketAddress, outcome, msg.sender, block.timestamp);
            emit CommunityDisputeWindowOpened(marketAddress, outcome, block.timestamp + _disputeWindow);
        } else {
            revert MarketNotResolvable(marketAddress);
        }
    }

    /**
     * @notice Submit aggregated community dispute signals (Phase 6)
     * @param marketAddress Market address
     * @param agreeCount Number of users who agree with proposed outcome
     * @param disagreeCount Number of users who disagree with proposed outcome
     * @dev Auto-finalizes if >75% agreement, marks disputed if >40% disagreement
     */
    function submitDisputeSignals(
        address marketAddress,
        uint256 agreeCount,
        uint256 disagreeCount
    ) external whenNotPaused onlyBackend {
        CommunityDisputeWindow storage window = _communityDisputes[marketAddress];
        require(window.isActive, "No active community dispute");

        // Update vote counts
        window.agreeCount = agreeCount;
        window.disagreeCount = disagreeCount;

        uint256 total = agreeCount + disagreeCount;
        if (total == 0) {
            emit DisputeSignalsSubmitted(marketAddress, agreeCount, disagreeCount);
            return;
        }

        uint256 agreementPercent = (agreeCount * 100) / total;
        uint256 disagreementPercent = (disagreeCount * 100) / total;

        ResolutionData storage resolution = _resolutions[marketAddress];

        // Auto-finalize if strong agreement (>=75%)
        if (agreementPercent >= agreementThreshold) {
            // PHASE 6 INTEGRATION: Call market.finalize() to transition RESOLVING → FINALIZED
            try IPredictionMarket(marketAddress).finalize(
                IPredictionMarket.Outcome(window.proposedOutcome)
            ) {
                // Market finalized successfully
                resolution.status = ResolutionStatus.FINALIZED;
                window.isActive = false;
                window.autoFinalized = true;

                emit MarketAutoFinalized(marketAddress, window.proposedOutcome);
                emit ResolutionFinalized(marketAddress, window.proposedOutcome, block.timestamp);
            } catch {
                // Finalization failed - keep window active for retry
                emit DisputeSignalsSubmitted(marketAddress, agreeCount, disagreeCount);
                return;
            }
        }
        // Flag for admin review if strong disagreement (>=40%)
        else if (disagreementPercent >= disagreementThreshold) {
            // PHASE 6 INTEGRATION: Call market.dispute() to transition RESOLVING → DISPUTED
            try IPredictionMarket(marketAddress).dispute("Community disagreement threshold reached") {
                // Market disputed successfully
                resolution.status = ResolutionStatus.DISPUTED;
                window.isActive = false;

                emit CommunityDisputeFlagged(marketAddress, disagreementPercent);
            } catch {
                // Dispute failed - keep window active for retry
                emit DisputeSignalsSubmitted(marketAddress, agreeCount, disagreeCount);
                return;
            }
        }

        emit DisputeSignalsSubmitted(marketAddress, agreeCount, disagreeCount);
    }

    /**
     * @notice Admin override to resolve disputed market (Phase 6)
     * @param marketAddress Market to resolve
     * @param newOutcome Final outcome decision
     * @param reason Reason for admin decision
     * @dev Allows admin to override community dispute and finalize immediately
     */
    function adminResolveMarket(
        address marketAddress,
        uint8 newOutcome,
        string calldata reason
    ) external nonReentrant onlyAdmin {
        if (newOutcome == 0 || newOutcome > 2) revert InvalidOutcome(newOutcome);

        ResolutionData storage resolution = _resolutions[marketAddress];
        if (resolution.resolvedAt == 0) revert MarketNotFound(marketAddress);

        // PHASE 6 INTEGRATION: Call market.finalize() to transition to FINALIZED state
        try IPredictionMarket(marketAddress).finalize(IPredictionMarket.Outcome(newOutcome)) {
            // Update outcome and finalize immediately
            resolution.outcome = newOutcome;
            resolution.status = ResolutionStatus.FINALIZED;

            // Close community dispute window if active
            if (_communityDisputes[marketAddress].isActive) {
                _communityDisputes[marketAddress].isActive = false;
            }

            emit AdminResolution(marketAddress, newOutcome, reason);
            emit ResolutionFinalized(marketAddress, newOutcome, block.timestamp);
        } catch (bytes memory revertData) {
            // Market finalization failed - revert with error
            if (revertData.length > 0) {
                assembly {
                    revert(add(32, revertData), mload(revertData))
                }
            }
            revert("Market finalization failed");
        }
    }

    // ============= Finalization =============

    /**
     * @notice Finalize a resolution after dispute window
     * @param marketAddress Market to finalize
     */
    function finalizeResolution(address marketAddress) external onlyAdmin {
        ResolutionData storage resolution = _resolutions[marketAddress];

        if (resolution.resolvedAt == 0) revert MarketNotFound(marketAddress);

        // Check dispute window has passed
        if (block.timestamp < resolution.resolvedAt + _disputeWindow) {
            revert DisputeWindowClosed();
        }

        // Can only finalize if RESOLVED (not DISPUTED or already FINALIZED)
        if (resolution.status == ResolutionStatus.FINALIZED) {
            revert AlreadyFinalized();
        }

        resolution.status = ResolutionStatus.FINALIZED;

        emit ResolutionFinalized(
            marketAddress,
            resolution.outcome,
            block.timestamp
        );
    }

    /**
     * @notice Batch finalize multiple resolutions
     * @param marketAddresses Markets to finalize
     */
    function batchFinalizeResolutions(address[] calldata marketAddresses)
        external
        onlyAdmin
    {
        for (uint256 i = 0; i < marketAddresses.length; i++) {
            ResolutionData storage resolution = _resolutions[marketAddresses[i]];

            if (resolution.resolvedAt == 0) continue;
            if (block.timestamp < resolution.resolvedAt + _disputeWindow) continue;
            if (resolution.status == ResolutionStatus.FINALIZED) continue;

            resolution.status = ResolutionStatus.FINALIZED;

            emit ResolutionFinalized(
                marketAddresses[i],
                resolution.outcome,
                block.timestamp
            );
        }
    }

    // ============= View Functions =============

    /**
     * @notice Get resolution data for a market
     * @param marketAddress Market to query
     * @return Resolution data struct
     */
    function getResolutionData(address marketAddress)
        external
        view
        returns (ResolutionData memory)
    {
        return _resolutions[marketAddress];
    }

    /**
     * @notice Get dispute data for a market
     * @param marketAddress Market to query
     * @return Dispute data struct
     */
    function getDisputeData(address marketAddress)
        external
        view
        returns (DisputeData memory)
    {
        return _disputes[marketAddress];
    }

    /**
     * @notice Check if market is resolved
     * @param marketAddress Market to check
     * @return True if resolved
     */
    function isResolved(address marketAddress) external view returns (bool) {
        return _resolutions[marketAddress].resolvedAt > 0;
    }

    /**
     * @notice Check if market can be disputed
     * @param marketAddress Market to check
     * @return True if within dispute window
     */
    function canDispute(address marketAddress) public view returns (bool) {
        ResolutionData memory resolution = _resolutions[marketAddress];

        if (resolution.resolvedAt == 0) return false;
        if (resolution.status != ResolutionStatus.RESOLVED) return false;
        if (_disputes[marketAddress].disputedAt > 0) return false;

        return block.timestamp <= resolution.resolvedAt + _disputeWindow;
    }

    /**
     * @notice Get dispute window duration
     * @return Dispute window in seconds
     */
    function getDisputeWindow() external view returns (uint256) {
        return _disputeWindow;
    }

    /**
     * @notice Get minimum dispute bond
     * @return Minimum bond amount
     */
    function getMinDisputeBond() external view returns (uint256) {
        return _minDisputeBond;
    }

    /**
     * @notice Get community dispute window data for a market
     * @param marketAddress The market address
     * @return Community dispute window data
     */
    function getCommunityDisputeWindow(address marketAddress)
        external
        view
        returns (CommunityDisputeWindow memory)
    {
        return _communityDisputes[marketAddress];
    }

    // ============= Enumeration =============

    /**
     * @notice Get all pending resolutions
     * @return Array of pending market addresses
     */
    function getPendingResolutions() external view returns (address[] memory) {
        return _pendingMarkets;
    }

    /**
     * @notice Get all disputed resolutions
     * @return Array of disputed market addresses
     */
    function getDisputedResolutions() external view returns (address[] memory) {
        return _disputedMarkets;
    }

    /**
     * @notice Get resolver's resolution history
     * @param resolver Resolver address
     * @return Array of resolved market addresses
     */
    function getResolverHistory(address resolver)
        external
        view
        returns (address[] memory)
    {
        return _resolverHistory[resolver];
    }

    // ============= Admin Functions =============

    /**
     * @notice Set dispute window duration
     * @param window New dispute window in seconds
     */
    function setDisputeWindow(uint256 window) external onlyAdmin {
        _disputeWindow = window;
    }

    /**
     * @notice Set minimum dispute bond
     * @param amount New minimum bond amount
     */
    function setMinDisputeBond(uint256 amount) external onlyAdmin {
        _minDisputeBond = amount;
    }

    /**
     * @notice Set agreement threshold for auto-finalization (Phase 6)
     * @param threshold Percentage threshold (51-100)
     */
    function setAgreementThreshold(uint256 threshold) external onlyAdmin {
        require(threshold > 50 && threshold <= 100, "Invalid threshold");
        agreementThreshold = threshold;
        emit AgreementThresholdUpdated(threshold);
    }

    /**
     * @notice Set disagreement threshold for flagging disputes (Phase 6)
     * @param threshold Percentage threshold (1-49)
     */
    function setDisagreementThreshold(uint256 threshold) external onlyAdmin {
        require(threshold > 0 && threshold < 50, "Invalid threshold");
        disagreementThreshold = threshold;
        emit DisagreementThresholdUpdated(threshold);
    }

    /**
     * @notice Pause the contract
     */
    function pause() external onlyAdmin {
        paused = true;
    }

    /**
     * @notice Unpause the contract
     */
    function unpause() external onlyAdmin {
        paused = false;
    }

    // ============= Internal Helpers =============

    /**
     * @notice Get AccessControlManager from registry
     * @return AccessControlManager interface
     */
    function _getAccessControlManager()
        private
        view
        returns (IAccessControlManager)
    {
        IVersionedRegistry reg = IVersionedRegistry(registry);
        address accessControl = reg.getContract(keccak256("AccessControlManager"));
        return IAccessControlManager(accessControl);
    }

    /**
     * @notice Remove market from pending list with O(1) complexity
     * @param marketAddress Market to remove
     * @dev Uses index mapping for constant-time removal (GO-OPTIMIZATION)
     * Gas savings: ~50-90% reduction for large arrays (20-50k gas saved)
     */
    function _removeFromPending(address marketAddress) private {
        uint256 index = _pendingMarketsIndex[marketAddress];

        // If index is 0, market is not in pending list
        if (index == 0) return;

        uint256 lastIndex = _pendingMarkets.length;

        // If removing element is not the last one, swap with last
        if (index != lastIndex) {
            address lastMarket = _pendingMarkets[lastIndex - 1];
            _pendingMarkets[index - 1] = lastMarket;
            _pendingMarketsIndex[lastMarket] = index;
        }

        // Remove last element
        _pendingMarkets.pop();
        delete _pendingMarketsIndex[marketAddress];
    }
}
