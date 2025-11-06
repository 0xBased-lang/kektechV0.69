// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IProposalManagerV2
 * @notice Interface for market proposal approval system
 * @dev Handles proposal creation, voting, and market activation
 */
interface IProposalManagerV2 {
    // ============= Enums =============

    enum ProposalState {
        Pending,        // Waiting for votes
        Active,         // Voting in progress
        Approved,       // Threshold met, ready to create market
        Rejected,       // Voting failed
        Expired,        // Voting period ended without approval
        MarketCreated,  // Market successfully created
        BondRefunded    // Bond returned to creator
    }

    // ============= Structs =============

    struct MarketProposal {
        uint256 id;                    // Proposal ID
        address creator;               // Market creator
        string marketQuestion;         // Market question
        bytes32 category;              // Market category
        uint256 creatorBond;           // Bond amount paid
        uint256 creationFee;           // Fee amount paid
        uint256 proposalTax;           // Tax amount paid
        uint256 votingStart;           // Voting start timestamp
        uint256 votingEnd;             // Voting end timestamp
        uint256 forVotes;              // Likes/support votes
        uint256 againstVotes;          // Dislikes/opposition votes
        ProposalState state;           // Current state
        address marketAddress;         // Created market (if approved)
        uint256 createdAt;             // Creation timestamp
    }

    // ============= Events =============

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed creator,
        string question,
        bytes32 indexed category,
        uint256 bond,
        uint256 fee,
        uint256 tax,
        uint256 timestamp
    );

    event VotingResultsSubmitted(
        uint256 indexed proposalId,
        uint256 forVotes,
        uint256 againstVotes,
        uint256 timestamp
    );

    event ProposalApproved(
        uint256 indexed proposalId,
        uint256 forVotes,
        uint256 againstVotes,
        uint256 timestamp
    );

    event ProposalRejected(
        uint256 indexed proposalId,
        uint256 forVotes,
        uint256 againstVotes,
        string reason,
        uint256 timestamp
    );

    event ProposalExpired(
        uint256 indexed proposalId,
        uint256 timestamp
    );

    event MarketCreatedFromProposal(
        uint256 indexed proposalId,
        address indexed marketAddress,
        address indexed creator,
        uint256 timestamp
    );

    event BondRefunded(
        uint256 indexed proposalId,
        address indexed creator,
        uint256 amount,
        uint256 timestamp
    );

    // ============= Errors =============

    error InvalidQuestion();
    error InvalidCategory();
    error InsufficientBond();
    error InsufficientFee();
    error InsufficientTax();
    error InvalidProposalId();
    error ProposalNotPending();
    error ProposalNotActive();
    error ProposalNotApproved();
    error ProposalAlreadyVoted();
    error ProposalHasExpired();
    error ThresholdNotMet();
    error NotProposalCreator();
    error MarketAlreadyCreated();
    error BondAlreadyRefunded();
    error CannotRefundBond();
    error Unauthorized();
    error ZeroAddress();

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
    ) external payable returns (uint256 proposalId);

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
    ) external;

    /**
     * @notice Approve proposal if threshold met (admin only)
     * @param proposalId Proposal to approve
     */
    function approveProposal(uint256 proposalId) external;

    /**
     * @notice Reject proposal (admin only)
     * @param proposalId Proposal to reject
     * @param reason Rejection reason
     */
    function rejectProposal(uint256 proposalId, string calldata reason) external;

    /**
     * @notice Create market from approved proposal
     * @param proposalId Approved proposal
     * @return marketAddress Created market address
     */
    function createMarketFromProposal(uint256 proposalId)
        external
        returns (address marketAddress);

    /**
     * @notice Refund bond for rejected/expired proposals
     * @param proposalId Proposal ID
     */
    function refundBond(uint256 proposalId) external;

    /**
     * @notice Mark proposal as expired (admin only)
     * @param proposalId Proposal ID
     */
    function expireProposal(uint256 proposalId) external;

    // ============= View Functions =============

    /**
     * @notice Get proposal details
     * @param proposalId Proposal ID
     * @return proposal Proposal data
     */
    function getProposal(uint256 proposalId)
        external
        view
        returns (MarketProposal memory proposal);

    /**
     * @notice Get total proposal count
     * @return count Total proposals
     */
    function getProposalCount() external view returns (uint256 count);

    /**
     * @notice Check if proposal is approved
     * @param proposalId Proposal ID
     * @return approved True if approved
     */
    function isProposalApproved(uint256 proposalId)
        external
        view
        returns (bool approved);

    /**
     * @notice Get proposals by creator
     * @param creator Creator address
     * @return proposalIds Array of proposal IDs
     */
    function getCreatorProposals(address creator)
        external
        view
        returns (uint256[] memory proposalIds);

    /**
     * @notice Get proposals by category
     * @param category Category identifier
     * @return proposalIds Array of proposal IDs
     */
    function getCategoryProposals(bytes32 category)
        external
        view
        returns (uint256[] memory proposalIds);

    /**
     * @notice Check if proposal is expired
     * @param proposalId Proposal ID
     * @return expired True if expired
     */
    function isProposalExpired(uint256 proposalId)
        external
        view
        returns (bool expired);

    /**
     * @notice Calculate required bond amount
     * @return bond Required bond in wei
     */
    function getRequiredBond() external view returns (uint256 bond);

    /**
     * @notice Calculate required creation fee
     * @param bondAmount Bond amount
     * @return fee Required fee in wei
     */
    function getRequiredCreationFee(uint256 bondAmount)
        external
        view
        returns (uint256 fee);

    /**
     * @notice Calculate required proposal tax
     * @return tax Required tax in wei
     */
    function getRequiredProposalTax() external view returns (uint256 tax);

    /**
     * @notice Calculate approval threshold
     * @param totalVotes Total votes cast
     * @return threshold Votes needed for approval
     */
    function calculateApprovalThreshold(uint256 totalVotes)
        external
        view
        returns (uint256 threshold);

    /**
     * @notice Get voting period duration
     * @return period Duration in seconds
     */
    function getVotingPeriod() external view returns (uint256 period);
}
