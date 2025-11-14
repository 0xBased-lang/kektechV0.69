// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IProposalManager
 * @notice Interface for governance proposal management in KEKTECH 3.0
 * @dev Handles proposal creation, voting, and execution
 */
interface IProposalManager {
    // ============= Enums =============

    /**
     * @notice Proposal state
     */
    enum ProposalState {
        Pending,    // Proposal created but voting not started
        Active,     // Voting in progress
        Succeeded,  // Voting ended, proposal passed
        Defeated,   // Voting ended, proposal failed
        Executed,   // Proposal executed
        Canceled    // Proposal canceled
    }

    /**
     * @notice Vote type
     */
    enum VoteType {
        Against,
        For,
        Abstain
    }

    // ============= Structs =============

    /**
     * @notice Proposal data
     */
    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        uint256 votingStart;
        uint256 votingEnd;
        uint256 executionDelay;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        ProposalState state;
        bool executed;
        uint256 createdAt;
    }

    /**
     * @notice Vote record
     */
    struct VoteReceipt {
        bool hasVoted;
        VoteType support;
        uint256 votes;
        uint256 timestamp;
    }

    // ============= Events =============

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string description,
        uint256 votingStart,
        uint256 votingEnd
    );

    event VoteCast(
        address indexed voter,
        uint256 indexed proposalId,
        VoteType support,
        uint256 votes,
        uint256 timestamp
    );

    event ProposalExecuted(
        uint256 indexed proposalId,
        uint256 timestamp
    );

    event ProposalCanceled(
        uint256 indexed proposalId,
        uint256 timestamp
    );

    event QuorumUpdated(
        uint256 oldQuorum,
        uint256 newQuorum
    );

    event VotingPeriodUpdated(
        uint256 oldPeriod,
        uint256 newPeriod
    );

    // ============= Errors =============

    error InvalidDescription();
    error ProposalNotActive();
    error AlreadyVoted();
    error ProposalNotSucceeded();
    error ProposalAlreadyExecuted();
    error ExecutionDelayNotMet();
    error QuorumNotReached();
    error Unauthorized();
    error InvalidProposalId();
    error InvalidVotingPeriod();
    error InvalidQuorum();
    error ProposalNotPending();

    // ============= Core Functions =============

    /**
     * @notice Create a new proposal
     * @param description Proposal description
     * @return proposalId The ID of the created proposal
     */
    function propose(
        string calldata description
    ) external returns (uint256 proposalId);

    /**
     * @notice Cast a vote on a proposal
     * @param proposalId Proposal ID
     * @param support Vote type (Against, For, Abstain)
     * @param votes Number of votes to cast
     */
    function castVote(
        uint256 proposalId,
        VoteType support,
        uint256 votes
    ) external;

    /**
     * @notice Execute a succeeded proposal
     * @param proposalId Proposal ID
     */
    function execute(uint256 proposalId) external;

    /**
     * @notice Cancel a proposal
     * @param proposalId Proposal ID
     */
    function cancel(uint256 proposalId) external;

    // ============= Configuration =============

    /**
     * @notice Update quorum requirement
     * @param newQuorum New quorum in basis points
     */
    function updateQuorum(uint256 newQuorum) external;

    /**
     * @notice Update voting period
     * @param newPeriod New voting period in seconds
     */
    function updateVotingPeriod(uint256 newPeriod) external;

    /**
     * @notice Update execution delay
     * @param newDelay New execution delay in seconds
     */
    function updateExecutionDelay(uint256 newDelay) external;

    // ============= View Functions =============

    /**
     * @notice Get proposal details
     * @param proposalId Proposal ID
     */
    function getProposal(uint256 proposalId) external view returns (Proposal memory);

    /**
     * @notice Get current proposal state
     * @param proposalId Proposal ID
     */
    function state(uint256 proposalId) external view returns (ProposalState);

    /**
     * @notice Get vote receipt for voter
     * @param proposalId Proposal ID
     * @param voter Voter address
     */
    function getReceipt(
        uint256 proposalId,
        address voter
    ) external view returns (VoteReceipt memory);

    /**
     * @notice Check if voter has voted
     * @param proposalId Proposal ID
     * @param voter Voter address
     */
    function hasVoted(uint256 proposalId, address voter) external view returns (bool);

    /**
     * @notice Get total number of proposals
     */
    function proposalCount() external view returns (uint256);

    /**
     * @notice Get quorum requirement
     */
    function quorum() external view returns (uint256);

    /**
     * @notice Get voting period
     */
    function votingPeriod() external view returns (uint256);

    /**
     * @notice Get execution delay
     */
    function executionDelay() external view returns (uint256);

    /**
     * @notice Get all active proposals
     */
    function getActiveProposals() external view returns (uint256[] memory);

    /**
     * @notice Get proposals by state
     * @param _state Proposal state to filter by
     */
    function getProposalsByState(ProposalState _state) external view returns (uint256[] memory);

    /**
     * @notice Check if proposal has reached quorum
     * @param proposalId Proposal ID
     */
    function hasReachedQuorum(uint256 proposalId) external view returns (bool);
}
