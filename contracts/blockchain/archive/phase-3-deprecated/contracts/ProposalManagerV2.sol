// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../interfaces/IProposalManagerV2.sol";
import "../interfaces/IVersionedRegistry.sol";
import "../interfaces/IAccessControlManager.sol";
import "../interfaces/IParameterStorage.sol";

/**
 * @title ProposalManagerV2
 * @notice Market proposal approval system for KEKTECH 3.0
 * @dev Implements spam prevention through bonds, fees, and community voting
 * @custom:security-contact security@kektech.io
 */
contract ProposalManagerV2 is IProposalManagerV2, ReentrancyGuard {
    // ============= State Variables =============

    IVersionedRegistry private immutable _registry;

    // Proposal storage
    mapping(uint256 => MarketProposal) private _proposals;
    uint256 private _proposalCount;

    // Quick lookups
    mapping(address => uint256[]) private _creatorProposals;
    mapping(bytes32 => uint256[]) private _categoryProposals;

    // Voting tracking
    mapping(uint256 => bool) private _hasVoted;

    // ============= Constants =============

    // Parameter keys
    bytes32 private constant CREATOR_BOND_AMOUNT = keccak256("CREATOR_BOND_AMOUNT");
    bytes32 private constant CREATION_FEE_BPS = keccak256("CREATION_FEE_BPS");
    bytes32 private constant PROPOSAL_TAX_AMOUNT = keccak256("PROPOSAL_TAX_AMOUNT");
    bytes32 private constant VOTING_PERIOD = keccak256("VOTING_PERIOD");
    bytes32 private constant APPROVAL_THRESHOLD_BPS = keccak256("APPROVAL_THRESHOLD_BPS");
    bytes32 private constant MIN_VOTES_REQUIRED = keccak256("MIN_VOTES_REQUIRED");

    // Registry keys
    bytes32 private constant ACCESS_CONTROL = keccak256("AccessControlManager");
    bytes32 private constant PARAMETER_STORAGE = keccak256("ParameterStorage");
    bytes32 private constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // ============= Constructor =============

    /**
     * @notice Initialize ProposalManagerV2
     * @param registry MasterRegistry address
     */
    constructor(address registry) {
        if (registry == address(0)) revert ZeroAddress();
        _registry = IVersionedRegistry(registry);
    }

    // ============= Modifiers =============

    /**
     * @notice Restrict function to admins only
     */
    modifier onlyAdmin() {
        IAccessControlManager accessControl = IAccessControlManager(
            _registry.getContract(ACCESS_CONTROL)
        );
        if (!accessControl.hasRole(ADMIN_ROLE, msg.sender)) {
            revert Unauthorized();
        }
        _;
    }

    // ============= Core Functions =============

    /**
     * @notice Create a new market proposal with bond and fees
     * @param marketQuestion The market question
     * @param category Market category
     * @return proposalId The created proposal ID
     */
    function createMarketProposal(
        string calldata marketQuestion,
        bytes32 category
    ) external payable nonReentrant returns (uint256 proposalId) {
        // Validate inputs
        if (bytes(marketQuestion).length == 0) revert InvalidQuestion();
        if (category == bytes32(0)) revert InvalidCategory();

        // Get required amounts
        uint256 requiredBond = getRequiredBond();
        uint256 requiredFee = getRequiredCreationFee(requiredBond);
        uint256 requiredTax = getRequiredProposalTax();
        uint256 totalRequired = requiredBond + requiredFee + requiredTax;

        // Validate payment
        if (msg.value < totalRequired) revert InsufficientBond();

        // Create proposal
        _proposalCount++;
        proposalId = _proposalCount;

        uint256 votingStart = block.timestamp;
        uint256 votingEnd = votingStart + getVotingPeriod();

        _proposals[proposalId] = MarketProposal({
            id: proposalId,
            creator: msg.sender,
            marketQuestion: marketQuestion,
            category: category,
            creatorBond: requiredBond,
            creationFee: requiredFee,
            proposalTax: requiredTax,
            votingStart: votingStart,
            votingEnd: votingEnd,
            forVotes: 0,
            againstVotes: 0,
            state: ProposalState.Pending,
            marketAddress: address(0),
            createdAt: block.timestamp
        });

        // Track by creator and category
        _creatorProposals[msg.sender].push(proposalId);
        _categoryProposals[category].push(proposalId);

        emit ProposalCreated(
            proposalId,
            msg.sender,
            marketQuestion,
            category,
            requiredBond,
            requiredFee,
            requiredTax,
            block.timestamp
        );

        return proposalId;
    }

    /**
     * @notice Submit off-chain voting results (admin only)
     * @param proposalId Proposal to update
     * @param forVotes Number of support votes
     * @param againstVotes Number of opposition votes
     */
    function submitVotingResults(
        uint256 proposalId,
        uint256 forVotes,
        uint256 againstVotes
    ) external onlyAdmin {
        // Validate proposal
        if (proposalId == 0 || proposalId > _proposalCount) {
            revert InvalidProposalId();
        }

        MarketProposal storage proposal = _proposals[proposalId];

        // Check if already voted (do this first for correct error message)
        if (_hasVoted[proposalId]) {
            revert ProposalAlreadyVoted();
        }

        // Check state
        if (proposal.state != ProposalState.Pending) {
            revert ProposalNotPending();
        }

        // Check not expired
        if (block.timestamp > proposal.votingEnd) {
            revert ProposalHasExpired();
        }

        // Update votes
        proposal.forVotes = forVotes;
        proposal.againstVotes = againstVotes;
        proposal.state = ProposalState.Active;

        _hasVoted[proposalId] = true;

        emit VotingResultsSubmitted(proposalId, forVotes, againstVotes, block.timestamp);
    }

    /**
     * @notice Approve proposal if threshold met (admin only)
     * @param proposalId Proposal to approve
     */
    function approveProposal(uint256 proposalId) external onlyAdmin {
        // Validate proposal
        if (proposalId == 0 || proposalId > _proposalCount) {
            revert InvalidProposalId();
        }

        MarketProposal storage proposal = _proposals[proposalId];

        // Check state
        if (proposal.state != ProposalState.Active) {
            revert ProposalNotActive();
        }

        // Check threshold
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes;
        uint256 threshold = calculateApprovalThreshold(totalVotes);

        IParameterStorage params = IParameterStorage(
            _registry.getContract(PARAMETER_STORAGE)
        );
        uint256 minVotes = params.getParameter(MIN_VOTES_REQUIRED);

        if (totalVotes < minVotes || proposal.forVotes < threshold) {
            revert ThresholdNotMet();
        }

        // Approve
        proposal.state = ProposalState.Approved;

        emit ProposalApproved(
            proposalId,
            proposal.forVotes,
            proposal.againstVotes,
            block.timestamp
        );
    }

    /**
     * @notice Reject proposal (admin only)
     * @param proposalId Proposal to reject
     * @param reason Rejection reason
     */
    function rejectProposal(
        uint256 proposalId,
        string calldata reason
    ) external onlyAdmin {
        // Validate proposal
        if (proposalId == 0 || proposalId > _proposalCount) {
            revert InvalidProposalId();
        }

        MarketProposal storage proposal = _proposals[proposalId];

        // Check state (can reject Pending or Active)
        if (proposal.state != ProposalState.Pending &&
            proposal.state != ProposalState.Active) {
            revert ProposalNotActive();
        }

        // Reject
        proposal.state = ProposalState.Rejected;

        emit ProposalRejected(
            proposalId,
            proposal.forVotes,
            proposal.againstVotes,
            reason,
            block.timestamp
        );
    }

    /**
     * @notice Create market from approved proposal
     * @param proposalId Approved proposal
     * @return marketAddress Created market address
     */
    function createMarketFromProposal(uint256 proposalId)
        external
        nonReentrant
        returns (address marketAddress)
    {
        // Validate proposal
        if (proposalId == 0 || proposalId > _proposalCount) {
            revert InvalidProposalId();
        }

        MarketProposal storage proposal = _proposals[proposalId];

        // Check approved
        if (proposal.state != ProposalState.Approved) {
            revert ProposalNotApproved();
        }

        // Check not already created
        if (proposal.marketAddress != address(0)) {
            revert MarketAlreadyCreated();
        }

        // NOTE: In full implementation, this would call FlexibleMarketFactory
        // For now, we'll just mark as created with a placeholder address
        // This will be fully integrated in the Factory update phase
        marketAddress = address(uint160(uint256(keccak256(abi.encodePacked(
            proposalId,
            block.timestamp,
            msg.sender
        )))));

        proposal.marketAddress = marketAddress;
        proposal.state = ProposalState.MarketCreated;

        emit MarketCreatedFromProposal(
            proposalId,
            marketAddress,
            proposal.creator,
            block.timestamp
        );

        return marketAddress;
    }

    /**
     * @notice Refund bond for rejected/expired proposals
     * @param proposalId Proposal ID
     */
    function refundBond(uint256 proposalId) external nonReentrant {
        // Validate proposal
        if (proposalId == 0 || proposalId > _proposalCount) {
            revert InvalidProposalId();
        }

        MarketProposal storage proposal = _proposals[proposalId];

        // Check caller is creator
        if (msg.sender != proposal.creator) {
            revert NotProposalCreator();
        }

        // Check state (must be Rejected or Expired)
        if (proposal.state != ProposalState.Rejected &&
            proposal.state != ProposalState.Expired) {
            revert CannotRefundBond();
        }

        // Check not already refunded
        if (proposal.state == ProposalState.BondRefunded) {
            revert BondAlreadyRefunded();
        }

        uint256 refundAmount = proposal.creatorBond;

        // Update state
        proposal.state = ProposalState.BondRefunded;

        // Refund bond
        (bool success, ) = payable(proposal.creator).call{value: refundAmount}("");
        require(success, "Refund failed");

        emit BondRefunded(proposalId, proposal.creator, refundAmount, block.timestamp);
    }

    /**
     * @notice Mark proposal as expired (admin only)
     * @param proposalId Proposal ID
     */
    function expireProposal(uint256 proposalId) external onlyAdmin {
        // Validate proposal
        if (proposalId == 0 || proposalId > _proposalCount) {
            revert InvalidProposalId();
        }

        MarketProposal storage proposal = _proposals[proposalId];

        // Check expired
        if (block.timestamp <= proposal.votingEnd) {
            revert ProposalNotActive();
        }

        // Check state
        if (proposal.state != ProposalState.Pending &&
            proposal.state != ProposalState.Active) {
            revert ProposalNotActive();
        }

        // Expire
        proposal.state = ProposalState.Expired;

        emit ProposalExpired(proposalId, block.timestamp);
    }

    // ============= View Functions =============

    /**
     * @notice Get proposal details
     * @param proposalId Proposal ID
     * @return proposal Proposal data
     */
    function getProposal(uint256 proposalId)
        external
        view
        returns (MarketProposal memory proposal)
    {
        if (proposalId == 0 || proposalId > _proposalCount) {
            revert InvalidProposalId();
        }
        return _proposals[proposalId];
    }

    /**
     * @notice Get total proposal count
     * @return count Total proposals
     */
    function getProposalCount() external view returns (uint256 count) {
        return _proposalCount;
    }

    /**
     * @notice Check if proposal is approved
     * @param proposalId Proposal ID
     * @return approved True if approved
     */
    function isProposalApproved(uint256 proposalId)
        external
        view
        returns (bool approved)
    {
        if (proposalId == 0 || proposalId > _proposalCount) {
            return false;
        }
        return _proposals[proposalId].state == ProposalState.Approved ||
               _proposals[proposalId].state == ProposalState.MarketCreated;
    }

    /**
     * @notice Get proposals by creator
     * @param creator Creator address
     * @return proposalIds Array of proposal IDs
     */
    function getCreatorProposals(address creator)
        external
        view
        returns (uint256[] memory proposalIds)
    {
        return _creatorProposals[creator];
    }

    /**
     * @notice Get proposals by category
     * @param category Category identifier
     * @return proposalIds Array of proposal IDs
     */
    function getCategoryProposals(bytes32 category)
        external
        view
        returns (uint256[] memory proposalIds)
    {
        return _categoryProposals[category];
    }

    /**
     * @notice Check if proposal is expired
     * @param proposalId Proposal ID
     * @return expired True if expired
     */
    function isProposalExpired(uint256 proposalId)
        external
        view
        returns (bool expired)
    {
        if (proposalId == 0 || proposalId > _proposalCount) {
            return false;
        }
        MarketProposal storage proposal = _proposals[proposalId];
        return block.timestamp > proposal.votingEnd;
    }

    /**
     * @notice Calculate required bond amount
     * @return bond Required bond in wei
     */
    function getRequiredBond() public view returns (uint256 bond) {
        IParameterStorage params = IParameterStorage(
            _registry.getContract(PARAMETER_STORAGE)
        );
        return params.getParameter(CREATOR_BOND_AMOUNT);
    }

    /**
     * @notice Calculate required creation fee
     * @param bondAmount Bond amount
     * @return fee Required fee in wei
     */
    function getRequiredCreationFee(uint256 bondAmount)
        public
        view
        returns (uint256 fee)
    {
        IParameterStorage params = IParameterStorage(
            _registry.getContract(PARAMETER_STORAGE)
        );
        uint256 feeBps = params.getParameter(CREATION_FEE_BPS);
        return (bondAmount * feeBps) / 10000;
    }

    /**
     * @notice Calculate required proposal tax
     * @return tax Required tax in wei
     */
    function getRequiredProposalTax() public view returns (uint256 tax) {
        IParameterStorage params = IParameterStorage(
            _registry.getContract(PARAMETER_STORAGE)
        );
        return params.getParameter(PROPOSAL_TAX_AMOUNT);
    }

    /**
     * @notice Calculate approval threshold
     * @param totalVotes Total votes cast
     * @return threshold Votes needed for approval
     */
    function calculateApprovalThreshold(uint256 totalVotes)
        public
        view
        returns (uint256 threshold)
    {
        IParameterStorage params = IParameterStorage(
            _registry.getContract(PARAMETER_STORAGE)
        );
        uint256 thresholdBps = params.getParameter(APPROVAL_THRESHOLD_BPS);
        return (totalVotes * thresholdBps) / 10000;
    }

    /**
     * @notice Get voting period duration
     * @return period Duration in seconds
     */
    function getVotingPeriod() public view returns (uint256 period) {
        IParameterStorage params = IParameterStorage(
            _registry.getContract(PARAMETER_STORAGE)
        );
        return params.getParameter(VOTING_PERIOD);
    }
}
