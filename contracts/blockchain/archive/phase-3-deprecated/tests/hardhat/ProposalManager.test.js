const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

describe("ProposalManager", function () {
  // ============= Test Fixtures =============

  async function deployFixture() {
    const [owner, admin, proposer1, proposer2, voter1, voter2, voter3] = await ethers.getSigners();

    // Deploy VersionedRegistry
    const VersionedRegistry = await ethers.getContractFactory("VersionedRegistry");
    const registry = await VersionedRegistry.deploy();

    // Deploy ParameterStorage
    const ParameterStorage = await ethers.getContractFactory("ParameterStorage");
    const paramStorage = await ParameterStorage.deploy(registry.target);

    // Deploy AccessControlManager
    const AccessControlManager = await ethers.getContractFactory("AccessControlManager");
    const accessControl = await AccessControlManager.deploy(registry.target);

    // Register contracts
    await registry.setContract(ethers.id("ParameterStorage"), paramStorage.target, 1);
    await registry.setContract(ethers.id("AccessControlManager"), accessControl.target, 1);

    // Deploy ProposalManager
    const ProposalManager = await ethers.getContractFactory("ProposalManager");
    const proposalManager = await ProposalManager.deploy(registry.target);

    // Register ProposalManager
    await registry.setContract(ethers.id("ProposalManager"), proposalManager.target, 1);

    // Setup roles
    await accessControl.grantRole(ethers.id("ADMIN_ROLE"), admin.address);

    // Authorize ProposalManager to update parameters
    await accessControl.grantRole(ethers.id("ADMIN_ROLE"), proposalManager.target);

    // SECURITY FIX (M-2): Grant ADMIN_ROLE to owner for ParameterStorage access
    await accessControl.grantRole(ethers.id("ADMIN_ROLE"), owner.address);

    // Setup default governance parameters in ParameterStorage
    await paramStorage.setParameter(ethers.id("quorumBps"), 1000); // 10%
    await paramStorage.setParameter(ethers.id("votingPeriod"), 3 * 24 * 60 * 60); // 3 days
    await paramStorage.setParameter(ethers.id("proposalExecutionDelay"), 24 * 60 * 60); // 1 day

    return {
      registry,
      paramStorage,
      accessControl,
      proposalManager,
      owner,
      admin,
      proposer1,
      proposer2,
      voter1,
      voter2,
      voter3,
    };
  }

  // ============= Deployment Tests =============

  describe("Deployment", function () {
    it("Should deploy with correct registry", async function () {
      const { proposalManager } = await loadFixture(deployFixture);
      expect(proposalManager.target).to.properAddress;
    });

    it("Should initialize with zero proposals", async function () {
      const { proposalManager } = await loadFixture(deployFixture);
      expect(await proposalManager.proposalCount()).to.equal(0);
    });

    it("Should have correct governance parameters", async function () {
      const { proposalManager } = await loadFixture(deployFixture);
      expect(await proposalManager.quorum()).to.equal(1000); // 10%
      expect(await proposalManager.votingPeriod()).to.equal(3 * 24 * 60 * 60); // 3 days
      expect(await proposalManager.executionDelay()).to.equal(24 * 60 * 60); // 1 day
    });
  });

  // ============= Proposal Creation Tests =============

  describe("Proposal Creation", function () {
    it("Should create a proposal", async function () {
      const { proposalManager, proposer1 } = await loadFixture(deployFixture);

      await expect(
        proposalManager.connect(proposer1).propose("Test proposal")
      ).to.emit(proposalManager, "ProposalCreated");
    });

    it("Should increment proposal count", async function () {
      const { proposalManager, proposer1 } = await loadFixture(deployFixture);

      await proposalManager.connect(proposer1).propose("Test proposal");
      expect(await proposalManager.proposalCount()).to.equal(1);

      await proposalManager.connect(proposer1).propose("Another proposal");
      expect(await proposalManager.proposalCount()).to.equal(2);
    });

    it("Should store proposal data correctly", async function () {
      const { proposalManager, proposer1 } = await loadFixture(deployFixture);

      const tx = await proposalManager.connect(proposer1).propose("Test proposal");
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      const proposal = await proposalManager.getProposal(1);
      expect(proposal.id).to.equal(1);
      expect(proposal.proposer).to.equal(proposer1.address);
      expect(proposal.description).to.equal("Test proposal");
      expect(proposal.votingStart).to.equal(block.timestamp);
      expect(proposal.votingEnd).to.equal(BigInt(block.timestamp) + BigInt(3 * 24 * 60 * 60));
    });

    it("Should set initial state to Active", async function () {
      const { proposalManager, proposer1 } = await loadFixture(deployFixture);

      await proposalManager.connect(proposer1).propose("Test proposal");
      expect(await proposalManager.state(1)).to.equal(1); // Active
    });

    it("Should initialize vote counts to zero", async function () {
      const { proposalManager, proposer1 } = await loadFixture(deployFixture);

      await proposalManager.connect(proposer1).propose("Test proposal");
      const proposal = await proposalManager.getProposal(1);

      expect(proposal.forVotes).to.equal(0);
      expect(proposal.againstVotes).to.equal(0);
      expect(proposal.abstainVotes).to.equal(0);
    });

    it("Should emit ProposalCreated event", async function () {
      const { proposalManager, proposer1 } = await loadFixture(deployFixture);

      const tx = await proposalManager.connect(proposer1).propose("Test proposal");
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      await expect(tx)
        .to.emit(proposalManager, "ProposalCreated")
        .withArgs(
          1,
          proposer1.address,
          "Test proposal",
          block.timestamp,
          BigInt(block.timestamp) + BigInt(3 * 24 * 60 * 60)
        );
    });

    it("Should revert on empty description", async function () {
      const { proposalManager, proposer1 } = await loadFixture(deployFixture);
      await expect(
        proposalManager.connect(proposer1).propose("")
      ).to.be.revertedWithCustomError(proposalManager, "InvalidDescription");
    });
  });

  // ============= Voting Tests =============

  describe("Voting", function () {
    it("Should allow voting on active proposal", async function () {
      const { proposalManager, proposer1, voter1 } = await loadFixture(deployFixture);

      await proposalManager.connect(proposer1).propose("Test proposal");

      await expect(
        proposalManager.connect(voter1).castVote(1, 1, 100) // For, 100 votes
      ).to.emit(proposalManager, "VoteCast");
    });

    it("Should record For votes correctly", async function () {
      const { proposalManager, proposer1, voter1 } = await loadFixture(deployFixture);

      await proposalManager.connect(proposer1).propose("Test proposal");
      await proposalManager.connect(voter1).castVote(1, 1, 100); // For

      const proposal = await proposalManager.getProposal(1);
      expect(proposal.forVotes).to.equal(100);
    });

    it("Should record Against votes correctly", async function () {
      const { proposalManager, proposer1, voter1 } = await loadFixture(deployFixture);

      await proposalManager.connect(proposer1).propose("Test proposal");
      await proposalManager.connect(voter1).castVote(1, 0, 50); // Against

      const proposal = await proposalManager.getProposal(1);
      expect(proposal.againstVotes).to.equal(50);
    });

    it("Should record Abstain votes correctly", async function () {
      const { proposalManager, proposer1, voter1 } = await loadFixture(deployFixture);

      await proposalManager.connect(proposer1).propose("Test proposal");
      await proposalManager.connect(voter1).castVote(1, 2, 30); // Abstain

      const proposal = await proposalManager.getProposal(1);
      expect(proposal.abstainVotes).to.equal(30);
    });

    it("Should mark voter as having voted", async function () {
      const { proposalManager, proposer1, voter1 } = await loadFixture(deployFixture);

      await proposalManager.connect(proposer1).propose("Test proposal");
      expect(await proposalManager.hasVoted(1, voter1.address)).to.be.false;

      await proposalManager.connect(voter1).castVote(1, 1, 100);
      expect(await proposalManager.hasVoted(1, voter1.address)).to.be.true;
    });

    it("Should store vote receipt", async function () {
      const { proposalManager, proposer1, voter1 } = await loadFixture(deployFixture);

      await proposalManager.connect(proposer1).propose("Test proposal");
      await proposalManager.connect(voter1).castVote(1, 1, 100);

      const receipt = await proposalManager.getReceipt(1, voter1.address);
      expect(receipt.hasVoted).to.be.true;
      expect(receipt.support).to.equal(1); // For
      expect(receipt.votes).to.equal(100);
    });

    it("Should prevent double voting", async function () {
      const { proposalManager, proposer1, voter1 } = await loadFixture(deployFixture);

      await proposalManager.connect(proposer1).propose("Test proposal");
      await proposalManager.connect(voter1).castVote(1, 1, 100);

      await expect(
        proposalManager.connect(voter1).castVote(1, 1, 50)
      ).to.be.revertedWithCustomError(proposalManager, "AlreadyVoted");
    });

    it("Should allow multiple voters", async function () {
      const { proposalManager, proposer1, voter1, voter2, voter3 } = await loadFixture(deployFixture);

      await proposalManager.connect(proposer1).propose("Test proposal");
      await proposalManager.connect(voter1).castVote(1, 1, 100); // For
      await proposalManager.connect(voter2).castVote(1, 0, 50);  // Against
      await proposalManager.connect(voter3).castVote(1, 2, 30);  // Abstain

      const proposal = await proposalManager.getProposal(1);
      expect(proposal.forVotes).to.equal(100);
      expect(proposal.againstVotes).to.equal(50);
      expect(proposal.abstainVotes).to.equal(30);
    });

    it("Should emit VoteCast event", async function () {
      const { proposalManager, proposer1, voter1 } = await loadFixture(deployFixture);

      await proposalManager.connect(proposer1).propose("Test proposal");
      const tx = await proposalManager.connect(voter1).castVote(1, 1, 100);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      await expect(tx)
        .to.emit(proposalManager, "VoteCast")
        .withArgs(voter1.address, 1, 1, 100, block.timestamp);
    });

    it("Should revert on voting after period ends", async function () {
      const { proposalManager, proposer1, voter1 } = await loadFixture(deployFixture);

      await proposalManager.connect(proposer1).propose("Test proposal");

      // Fast forward past voting period
      await time.increase(4 * 24 * 60 * 60); // 4 days

      await expect(
        proposalManager.connect(voter1).castVote(1, 1, 100)
      ).to.be.revertedWithCustomError(proposalManager, "ProposalNotActive");
    });

    it("Should revert on invalid proposal ID", async function () {
      const { proposalManager, voter1 } = await loadFixture(deployFixture);
      await expect(
        proposalManager.connect(voter1).castVote(999, 1, 100)
      ).to.be.revertedWithCustomError(proposalManager, "InvalidProposalId");
    });
  });

  // ============= Proposal State Tests =============

  describe("Proposal State", function () {
    it("Should be Active during voting period", async function () {
      const { proposalManager, proposer1 } = await loadFixture(deployFixture);

      await proposalManager.connect(proposer1).propose("Test proposal");
      expect(await proposalManager.state(1)).to.equal(1); // Active
    });

    it("Should be Succeeded if passed after voting ends", async function () {
      const { proposalManager, proposer1, voter1 } = await loadFixture(deployFixture);

      await proposalManager.connect(proposer1).propose("Test proposal");
      await proposalManager.connect(voter1).castVote(1, 1, 2000); // 20% for (quorum is 10%)

      // Fast forward past voting period
      await time.increase(4 * 24 * 60 * 60);

      expect(await proposalManager.state(1)).to.equal(2); // Succeeded
    });

    it("Should be Defeated if not passed after voting ends", async function () {
      const { proposalManager, proposer1, voter1 } = await loadFixture(deployFixture);

      await proposalManager.connect(proposer1).propose("Test proposal");
      await proposalManager.connect(voter1).castVote(1, 0, 1000); // 10% against

      // Fast forward past voting period
      await time.increase(4 * 24 * 60 * 60);

      expect(await proposalManager.state(1)).to.equal(3); // Defeated
    });

    it("Should be Defeated if quorum not reached", async function () {
      const { proposalManager, proposer1, voter1 } = await loadFixture(deployFixture);

      await proposalManager.connect(proposer1).propose("Test proposal");
      await proposalManager.connect(voter1).castVote(1, 1, 500); // 5% for (below 10% quorum)

      // Fast forward past voting period
      await time.increase(4 * 24 * 60 * 60);

      expect(await proposalManager.state(1)).to.equal(3); // Defeated
    });

    it("Should be Executed after execution", async function () {
      const { proposalManager, proposer1, voter1, admin } = await loadFixture(deployFixture);

      await proposalManager.connect(proposer1).propose("Test proposal");
      await proposalManager.connect(voter1).castVote(1, 1, 2000); // Pass

      // Fast forward past voting period
      await time.increase(4 * 24 * 60 * 60);

      // Fast forward past execution delay
      await time.increase(24 * 60 * 60 + 1);

      await proposalManager.connect(admin).execute(1);
      expect(await proposalManager.state(1)).to.equal(4); // Executed
    });

    it("Should be Canceled after cancellation", async function () {
      const { proposalManager, proposer1, admin } = await loadFixture(deployFixture);

      await proposalManager.connect(proposer1).propose("Test proposal");
      await proposalManager.connect(admin).cancel(1);

      expect(await proposalManager.state(1)).to.equal(5); // Canceled
    });
  });

  // ============= Proposal Execution Tests =============

  describe("Proposal Execution", function () {
    it("Should execute succeeded proposal", async function () {
      const { proposalManager, proposer1, voter1, admin } = await loadFixture(deployFixture);

      await proposalManager.connect(proposer1).propose("Test proposal");
      await proposalManager.connect(voter1).castVote(1, 1, 2000);

      await time.increase(4 * 24 * 60 * 60); // Past voting
      await time.increase(24 * 60 * 60 + 1); // Past execution delay

      await expect(
        proposalManager.connect(admin).execute(1)
      ).to.emit(proposalManager, "ProposalExecuted");
    });

    it("Should mark proposal as executed", async function () {
      const { proposalManager, proposer1, voter1, admin } = await loadFixture(deployFixture);

      await proposalManager.connect(proposer1).propose("Test proposal");
      await proposalManager.connect(voter1).castVote(1, 1, 2000);

      await time.increase(4 * 24 * 60 * 60);
      await time.increase(24 * 60 * 60 + 1);

      await proposalManager.connect(admin).execute(1);

      const proposal = await proposalManager.getProposal(1);
      expect(proposal.executed).to.be.true;
    });

    it("Should require admin role for execution", async function () {
      const { proposalManager, proposer1, voter1 } = await loadFixture(deployFixture);

      await proposalManager.connect(proposer1).propose("Test proposal");
      await proposalManager.connect(voter1).castVote(1, 1, 2000);

      await time.increase(4 * 24 * 60 * 60);
      await time.increase(24 * 60 * 60 + 1);

      await expect(
        proposalManager.connect(voter1).execute(1)
      ).to.be.revertedWithCustomError(proposalManager, "Unauthorized");
    });

    it("Should revert if proposal not succeeded", async function () {
      const { proposalManager, proposer1, voter1, admin } = await loadFixture(deployFixture);

      await proposalManager.connect(proposer1).propose("Test proposal");
      await proposalManager.connect(voter1).castVote(1, 0, 2000); // Against

      await time.increase(4 * 24 * 60 * 60);
      await time.increase(24 * 60 * 60 + 1);

      await expect(
        proposalManager.connect(admin).execute(1)
      ).to.be.revertedWithCustomError(proposalManager, "ProposalNotSucceeded");
    });

    it("Should revert if execution delay not met", async function () {
      const { proposalManager, proposer1, voter1, admin } = await loadFixture(deployFixture);

      await proposalManager.connect(proposer1).propose("Test proposal");
      await proposalManager.connect(voter1).castVote(1, 1, 2000);

      // Advance past voting period (3 days) but not past execution delay (1 day after voting)
      await time.increase(3 * 24 * 60 * 60 + 1); // Just past voting, not past delay

      await expect(
        proposalManager.connect(admin).execute(1)
      ).to.be.revertedWithCustomError(proposalManager, "ExecutionDelayNotMet");
    });

    it("Should revert if already executed", async function () {
      const { proposalManager, proposer1, voter1, admin } = await loadFixture(deployFixture);

      await proposalManager.connect(proposer1).propose("Test proposal");
      await proposalManager.connect(voter1).castVote(1, 1, 2000);

      await time.increase(4 * 24 * 60 * 60);
      await time.increase(24 * 60 * 60 + 1);

      await proposalManager.connect(admin).execute(1);

      await expect(
        proposalManager.connect(admin).execute(1)
      ).to.be.revertedWithCustomError(proposalManager, "ProposalAlreadyExecuted");
    });
  });

  // ============= Proposal Cancellation Tests =============

  describe("Proposal Cancellation", function () {
    it("Should allow admin to cancel proposal", async function () {
      const { proposalManager, proposer1, admin } = await loadFixture(deployFixture);

      await proposalManager.connect(proposer1).propose("Test proposal");

      await expect(
        proposalManager.connect(admin).cancel(1)
      ).to.emit(proposalManager, "ProposalCanceled");
    });

    it("Should update proposal state to Canceled", async function () {
      const { proposalManager, proposer1, admin } = await loadFixture(deployFixture);

      await proposalManager.connect(proposer1).propose("Test proposal");
      await proposalManager.connect(admin).cancel(1);

      expect(await proposalManager.state(1)).to.equal(5); // Canceled
    });

    it("Should require admin role", async function () {
      const { proposalManager, proposer1, voter1 } = await loadFixture(deployFixture);

      await proposalManager.connect(proposer1).propose("Test proposal");

      await expect(
        proposalManager.connect(voter1).cancel(1)
      ).to.be.revertedWithCustomError(proposalManager, "Unauthorized");
    });
  });

  // ============= Configuration Tests =============

  describe("Configuration", function () {
    it("Should allow admin to update quorum", async function () {
      const { proposalManager, owner, paramStorage } = await loadFixture(deployFixture);

      // Owner updates parameter via ProposalManager
      await paramStorage.setParameter(ethers.id("quorumBps"), 1500);
      expect(await proposalManager.quorum()).to.equal(1500);
    });

    it("Should allow admin to update voting period", async function () {
      const { proposalManager, owner, paramStorage } = await loadFixture(deployFixture);

      await paramStorage.setParameter(ethers.id("votingPeriod"), 7 * 24 * 60 * 60);
      expect(await proposalManager.votingPeriod()).to.equal(7 * 24 * 60 * 60);
    });

    it("Should allow admin to update execution delay", async function () {
      const { proposalManager, owner, paramStorage } = await loadFixture(deployFixture);

      await paramStorage.setParameter(ethers.id("proposalExecutionDelay"), 2 * 24 * 60 * 60);
      expect(await proposalManager.executionDelay()).to.equal(2 * 24 * 60 * 60);
    });
  });

  // ============= Query Functions Tests =============

  describe("Query Functions", function () {
    it("Should return active proposals", async function () {
      const { proposalManager, proposer1, proposer2 } = await loadFixture(deployFixture);

      await proposalManager.connect(proposer1).propose("Proposal 1");
      await proposalManager.connect(proposer2).propose("Proposal 2");

      const active = await proposalManager.getActiveProposals();
      expect(active.length).to.equal(2);
      expect(active[0]).to.equal(1);
      expect(active[1]).to.equal(2);
    });

    it("Should return proposals by state", async function () {
      const { proposalManager, proposer1, voter1, admin } = await loadFixture(deployFixture);

      await proposalManager.connect(proposer1).propose("Proposal 1");
      await proposalManager.connect(proposer1).propose("Proposal 2");

      // Cancel one
      await proposalManager.connect(admin).cancel(1);

      // Pass the other
      await proposalManager.connect(voter1).castVote(2, 1, 2000);
      await time.increase(4 * 24 * 60 * 60);

      const canceled = await proposalManager.getProposalsByState(5); // Canceled
      expect(canceled.length).to.equal(1);
      expect(canceled[0]).to.equal(1);

      const succeeded = await proposalManager.getProposalsByState(2); // Succeeded
      expect(succeeded.length).to.equal(1);
      expect(succeeded[0]).to.equal(2);
    });

    it("Should check if quorum reached", async function () {
      const { proposalManager, proposer1, voter1 } = await loadFixture(deployFixture);

      await proposalManager.connect(proposer1).propose("Test proposal");

      expect(await proposalManager.hasReachedQuorum(1)).to.be.false;

      await proposalManager.connect(voter1).castVote(1, 1, 1000); // 10% (meets quorum)

      expect(await proposalManager.hasReachedQuorum(1)).to.be.true;
    });
  });

  // ============= Gas Target Tests =============

  describe("Gas Targets", function () {
    it("Should meet propose gas target (<260k)", async function () {
      const { proposalManager, proposer1 } = await loadFixture(deployFixture);

      const tx = await proposalManager.connect(proposer1).propose("Test proposal");
      const receipt = await tx.wait();

      // Target: <260k for proposal creation with storage
      expect(receipt.gasUsed).to.be.lessThan(260000);
    });

    it("Should meet castVote gas target (<130k)", async function () {
      const { proposalManager, proposer1, voter1 } = await loadFixture(deployFixture);

      await proposalManager.connect(proposer1).propose("Test proposal");

      const tx = await proposalManager.connect(voter1).castVote(1, 1, 100);
      const receipt = await tx.wait();

      // Target: <130k for vote casting with storage
      expect(receipt.gasUsed).to.be.lessThan(130000);
    });
  });
});
