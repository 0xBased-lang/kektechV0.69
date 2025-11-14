// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../interfaces/IProposalManager.sol";
import "../interfaces/IMasterRegistry.sol";
import "../interfaces/IAccessControlManager.sol";
import "../interfaces/IParameterStorage.sol";

/**
 * @title ProposalManager
 * @notice Manages governance proposals for KEKTECH 3.0
 * @dev Handles proposal creation, voting, and execution
 */
contract ProposalManager is IProposalManager, ReentrancyGuard {
    // ============= State Variables =============

    IMasterRegistry private immutable _registry;

    // Proposal ID => Proposal
    mapping(uint256 => Proposal) private _proposals;

    // Proposal ID => Voter => Vote Receipt
    mapping(uint256 => mapping(address => VoteReceipt)) private _receipts;

    // Total number of proposals
    uint256 private _proposalCount;

    // Total voting power (for quorum calculation, simplified to 10000 = 100%)
    uint256 private constant TOTAL_VOTING_POWER = 10000;

    // ============= Constructor =============

    /**
     * @notice Initialize ProposalManager
     * @param registry MasterRegistry address
     */
    constructor(address registry) {
        if (registry == address(0)) revert Unauthorized();
        _registry = IMasterRegistry(registry);
    }

    // ============= Core Functions =============

    /**
     * @notice Create a new proposal
     * @param description Proposal description
     * @return proposalId The ID of the created proposal
     */
    function propose(
        string calldata description
    ) external override nonReentrant returns (uint256 proposalId) {
        if (bytes(description).length == 0) revert InvalidDescription();

        _proposalCount++;
        proposalId = _proposalCount;

        uint256 votingStart = block.timestamp;
        uint256 votingEnd = votingStart + votingPeriod();

        _proposals[proposalId] = Proposal({
            id: proposalId,
            proposer: msg.sender,
            description: description,
            votingStart: votingStart,
            votingEnd: votingEnd,
            executionDelay: executionDelay(),
            forVotes: 0,
            againstVotes: 0,
            abstainVotes: 0,
            state: ProposalState.Active,
            executed: false,
            createdAt: block.timestamp
        });

        emit ProposalCreated(
            proposalId,
            msg.sender,
            description,
            votingStart,
            votingEnd
        );
    }

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
    ) external override nonReentrant {
        if (proposalId == 0 || proposalId > _proposalCount) revert InvalidProposalId();
        if (state(proposalId) != ProposalState.Active) revert ProposalNotActive();
        if (_receipts[proposalId][msg.sender].hasVoted) revert AlreadyVoted();

        // Record vote
        _receipts[proposalId][msg.sender] = VoteReceipt({
            hasVoted: true,
            support: support,
            votes: votes,
            timestamp: block.timestamp
        });

        // Update proposal vote counts
        if (support == VoteType.For) {
            _proposals[proposalId].forVotes += votes;
        } else if (support == VoteType.Against) {
            _proposals[proposalId].againstVotes += votes;
        } else {
            _proposals[proposalId].abstainVotes += votes;
        }

        emit VoteCast(msg.sender, proposalId, support, votes, block.timestamp);
    }

    /**
     * @notice Execute a succeeded proposal
     * @param proposalId Proposal ID
     */
    function execute(uint256 proposalId) external override nonReentrant {
        _requireAdmin();

        if (proposalId == 0 || proposalId > _proposalCount) revert InvalidProposalId();

        Proposal storage proposal = _proposals[proposalId];

        // Check if already executed first
        if (proposal.executed) revert ProposalAlreadyExecuted();

        // Then check if succeeded
        if (state(proposalId) != ProposalState.Succeeded) revert ProposalNotSucceeded();

        // Check execution delay
        if (block.timestamp < proposal.votingEnd + proposal.executionDelay) {
            revert ExecutionDelayNotMet();
        }

        proposal.executed = true;
        proposal.state = ProposalState.Executed;

        emit ProposalExecuted(proposalId, block.timestamp);
    }

    /**
     * @notice Cancel a proposal
     * @param proposalId Proposal ID
     */
    function cancel(uint256 proposalId) external override nonReentrant {
        _requireAdmin();

        if (proposalId == 0 || proposalId > _proposalCount) revert InvalidProposalId();

        Proposal storage proposal = _proposals[proposalId];
        proposal.state = ProposalState.Canceled;

        emit ProposalCanceled(proposalId, block.timestamp);
    }

    // ============= Configuration =============

    /**
     * @notice Update quorum requirement
     * @param newQuorum New quorum in basis points
     */
    function updateQuorum(uint256 newQuorum) external override {
        _requireAdmin();
        if (newQuorum == 0 || newQuorum > 10000) revert InvalidQuorum();

        IParameterStorage params = _getParameterStorage();
        uint256 oldQuorum = params.getParameter(keccak256("quorumBps"));

        params.setParameter(keccak256("quorumBps"), newQuorum);

        emit QuorumUpdated(oldQuorum, newQuorum);
    }

    /**
     * @notice Update voting period
     * @param newPeriod New voting period in seconds
     */
    function updateVotingPeriod(uint256 newPeriod) external override {
        _requireAdmin();
        if (newPeriod == 0) revert InvalidVotingPeriod();

        IParameterStorage params = _getParameterStorage();
        uint256 oldPeriod = params.getParameter(keccak256("votingPeriod"));

        params.setParameter(keccak256("votingPeriod"), newPeriod);

        emit VotingPeriodUpdated(oldPeriod, newPeriod);
    }

    /**
     * @notice Update execution delay
     * @param newDelay New execution delay in seconds
     */
    function updateExecutionDelay(uint256 newDelay) external override {
        _requireAdmin();

        IParameterStorage params = _getParameterStorage();
        params.setParameter(keccak256("proposalExecutionDelay"), newDelay);
    }

    // ============= View Functions =============

    /**
     * @notice Get proposal details
     * @param proposalId Proposal ID
     */
    function getProposal(uint256 proposalId) external view override returns (Proposal memory) {
        if (proposalId == 0 || proposalId > _proposalCount) revert InvalidProposalId();
        return _proposals[proposalId];
    }

    /**
     * @notice Get current proposal state
     * @param proposalId Proposal ID
     */
    function state(uint256 proposalId) public view override returns (ProposalState) {
        if (proposalId == 0 || proposalId > _proposalCount) revert InvalidProposalId();

        Proposal storage proposal = _proposals[proposalId];

        // If executed or canceled, return that (these are final states)
        if (proposal.executed) return ProposalState.Executed;
        if (proposal.state == ProposalState.Canceled) return ProposalState.Canceled;

        // Check if voting is still active
        if (block.timestamp <= proposal.votingEnd) {
            return ProposalState.Active;
        }

        // Voting ended, determine result
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;

        // Check quorum (total votes must be >= quorum % of total voting power)
        uint256 quorumVotes = (TOTAL_VOTING_POWER * quorum()) / 10000;
        if (totalVotes < quorumVotes) {
            return ProposalState.Defeated;
        }

        // Check if more For than Against
        if (proposal.forVotes > proposal.againstVotes) {
            return ProposalState.Succeeded;
        }

        return ProposalState.Defeated;
    }

    /**
     * @notice Get vote receipt for voter
     * @param proposalId Proposal ID
     * @param voter Voter address
     */
    function getReceipt(
        uint256 proposalId,
        address voter
    ) external view override returns (VoteReceipt memory) {
        return _receipts[proposalId][voter];
    }

    /**
     * @notice Check if voter has voted
     * @param proposalId Proposal ID
     * @param voter Voter address
     */
    function hasVoted(uint256 proposalId, address voter) external view override returns (bool) {
        return _receipts[proposalId][voter].hasVoted;
    }

    /**
     * @notice Get total number of proposals
     */
    function proposalCount() external view override returns (uint256) {
        return _proposalCount;
    }

    /**
     * @notice Get quorum requirement
     */
    function quorum() public view override returns (uint256) {
        IParameterStorage params = _getParameterStorage();
        return params.getParameter(keccak256("quorumBps"));
    }

    /**
     * @notice Get voting period
     */
    function votingPeriod() public view override returns (uint256) {
        IParameterStorage params = _getParameterStorage();
        return params.getParameter(keccak256("votingPeriod"));
    }

    /**
     * @notice Get execution delay
     */
    function executionDelay() public view override returns (uint256) {
        IParameterStorage params = _getParameterStorage();
        return params.getParameter(keccak256("proposalExecutionDelay"));
    }

    /**
     * @notice Get all active proposals
     */
    function getActiveProposals() external view override returns (uint256[] memory) {
        // Count active proposals
        uint256 activeCount = 0;
        for (uint256 i = 1; i <= _proposalCount; i++) {
            if (state(i) == ProposalState.Active) {
                activeCount++;
            }
        }

        // Populate array
        uint256[] memory active = new uint256[](activeCount);
        uint256 index = 0;
        for (uint256 i = 1; i <= _proposalCount; i++) {
            if (state(i) == ProposalState.Active) {
                active[index] = i;
                index++;
            }
        }

        return active;
    }

    /**
     * @notice Get proposals by state
     * @param _state Proposal state to filter by
     */
    function getProposalsByState(ProposalState _state) external view override returns (uint256[] memory) {
        // Count proposals with given state
        uint256 count = 0;
        for (uint256 i = 1; i <= _proposalCount; i++) {
            if (state(i) == _state) {
                count++;
            }
        }

        // Populate array
        uint256[] memory filtered = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 1; i <= _proposalCount; i++) {
            if (state(i) == _state) {
                filtered[index] = i;
                index++;
            }
        }

        return filtered;
    }

    /**
     * @notice Check if proposal has reached quorum
     * @param proposalId Proposal ID
     */
    function hasReachedQuorum(uint256 proposalId) external view override returns (bool) {
        if (proposalId == 0 || proposalId > _proposalCount) revert InvalidProposalId();

        Proposal storage proposal = _proposals[proposalId];
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
        uint256 quorumVotes = (TOTAL_VOTING_POWER * quorum()) / 10000;

        return totalVotes >= quorumVotes;
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
}
