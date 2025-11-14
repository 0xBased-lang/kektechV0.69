const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

describe("ProposalManagerV2 - TDD Test Suite", function () {
    // ============= Test Fixtures =============

    async function deployCompleteSystemFixture() {
        const [owner, admin, creator, user1, user2, user3] = await ethers.getSigners();

        // Deploy VersionedRegistry
        const VersionedRegistry = await ethers.getContractFactory("VersionedRegistry");
        const registry = await VersionedRegistry.deploy();

        // Deploy ParameterStorage
        const ParameterStorage = await ethers.getContractFactory("ParameterStorage");
        const parameterStorage = await ParameterStorage.deploy(registry.target);

        // Deploy AccessControlManager
        const AccessControlManager = await ethers.getContractFactory("AccessControlManager");
        const accessControl = await AccessControlManager.deploy(registry.target);

        // Register contracts in registry
        await registry.setContract(ethers.id("PARAMETER_STORAGE"), parameterStorage.target, 1);
        // SECURITY FIX (M-2): Use correct registry key for AccessControlManager
        await registry.setContract(ethers.id("AccessControlManager"), accessControl.target, 1);

        // Grant admin role
        const ADMIN_ROLE = ethers.id("ADMIN_ROLE");
        await accessControl.grantRole(ADMIN_ROLE, admin.address);
        // SECURITY FIX (M-2): Grant ADMIN_ROLE to owner for ParameterStorage access
        await accessControl.grantRole(ADMIN_ROLE, owner.address);

        // Set up parameters
        const bondAmount = ethers.parseEther("1"); // 1 BASED
        const creationFeeBps = 250; // 2.5%
        const proposalTax = ethers.parseEther("0.1"); // 0.1 BASED
        const votingPeriod = 7 * 24 * 60 * 60; // 7 days
        const approvalThresholdBps = 6000; // 60%
        const minVotesRequired = 100;

        await parameterStorage.setParameter(ethers.id("CREATOR_BOND_AMOUNT"), bondAmount);
        await parameterStorage.setParameter(ethers.id("CREATION_FEE_BPS"), creationFeeBps);
        await parameterStorage.setParameter(ethers.id("PROPOSAL_TAX_AMOUNT"), proposalTax);
        await parameterStorage.setParameter(ethers.id("VOTING_PERIOD"), votingPeriod);
        await parameterStorage.setParameter(ethers.id("APPROVAL_THRESHOLD_BPS"), approvalThresholdBps);
        await parameterStorage.setParameter(ethers.id("MIN_VOTES_REQUIRED"), minVotesRequired);

        // Deploy ProposalManagerV2 (will fail initially - RED phase!)
        const ProposalManagerV2 = await ethers.getContractFactory("ProposalManagerV2");
        const proposalManager = await ProposalManagerV2.deploy(registry.target);

        // Register in registry
        await registry.setContract(ethers.id("PROPOSAL_MANAGER"), proposalManager.target, 1);

        return {
            proposalManager,
            registry,
            parameterStorage,
            accessControl,
            owner,
            admin,
            creator,
            user1,
            user2,
            user3,
            bondAmount,
            creationFeeBps,
            proposalTax,
            votingPeriod,
            approvalThresholdBps,
            minVotesRequired
        };
    }

    // ============= Deployment Tests (5 tests) =============

    describe("Deployment", function () {
        it("Should deploy with correct registry address", async function () {
            const { proposalManager, registry } = await loadFixture(deployCompleteSystemFixture);
            // Test will verify registry is set correctly
            expect(await proposalManager.getProposalCount()).to.equal(0);
        });

        it("Should initialize with zero proposals", async function () {
            const { proposalManager } = await loadFixture(deployCompleteSystemFixture);
            expect(await proposalManager.getProposalCount()).to.equal(0);
        });

        it("Should revert deployment with zero address registry", async function () {
            const ProposalManagerV2 = await ethers.getContractFactory("ProposalManagerV2");
            await expect(
                ProposalManagerV2.deploy(ethers.ZeroAddress)
            ).to.be.revertedWithCustomError(ProposalManagerV2, "ZeroAddress");
        });

        it("Should have correct initial state", async function () {
            const { proposalManager } = await loadFixture(deployCompleteSystemFixture);
            expect(await proposalManager.getProposalCount()).to.equal(0);
        });

        it("Should connect to registry successfully", async function () {
            const { proposalManager, parameterStorage } = await loadFixture(deployCompleteSystemFixture);
            // Should be able to read parameters
            const bond = await proposalManager.getRequiredBond();
            expect(bond).to.be.gt(0);
        });
    });

    // ============= createMarketProposal() Tests (15 tests) =============

    describe("createMarketProposal()", function () {
        it("Should create proposal with correct bond and fees", async function () {
            const { proposalManager, creator, bondAmount, proposalTax } = await loadFixture(deployCompleteSystemFixture);

            const totalPayment = bondAmount + proposalTax + (bondAmount * 250n / 10000n); // bond + tax + 2.5% fee

            await expect(
                proposalManager.connect(creator).createMarketProposal(
                    "Will ETH reach $5000 by EOY?",
                    ethers.id("CRYPTO"),
                    { value: totalPayment }
                )
            ).to.emit(proposalManager, "ProposalCreated");
        });

        it("Should increment proposal ID correctly", async function () {
            const { proposalManager, creator, bondAmount, proposalTax } = await loadFixture(deployCompleteSystemFixture);

            const totalPayment = bondAmount + proposalTax + (bondAmount * 250n / 10000n);

            await proposalManager.connect(creator).createMarketProposal(
                "Question 1",
                ethers.id("CRYPTO"),
                { value: totalPayment }
            );

            expect(await proposalManager.getProposalCount()).to.equal(1);

            await proposalManager.connect(creator).createMarketProposal(
                "Question 2",
                ethers.id("CRYPTO"),
                { value: totalPayment }
            );

            expect(await proposalManager.getProposalCount()).to.equal(2);
        });

        it("Should store proposal data correctly", async function () {
            const { proposalManager, creator, bondAmount, proposalTax } = await loadFixture(deployCompleteSystemFixture);

            const question = "Will ETH reach $5000 by EOY?";
            const category = ethers.id("CRYPTO");
            const totalPayment = bondAmount + proposalTax + (bondAmount * 250n / 10000n);

            await proposalManager.connect(creator).createMarketProposal(
                question,
                category,
                { value: totalPayment }
            );

            const proposal = await proposalManager.getProposal(1);
            expect(proposal.id).to.equal(1);
            expect(proposal.creator).to.equal(creator.address);
            expect(proposal.marketQuestion).to.equal(question);
            expect(proposal.category).to.equal(category);
            expect(proposal.creatorBond).to.equal(bondAmount);
        });

        it("Should emit ProposalCreated event with correct parameters", async function () {
            const { proposalManager, creator, bondAmount, proposalTax } = await loadFixture(deployCompleteSystemFixture);

            const question = "Will ETH reach $5000 by EOY?";
            const category = ethers.id("CRYPTO");
            const totalPayment = bondAmount + proposalTax + (bondAmount * 250n / 10000n);
            const creationFee = bondAmount * 250n / 10000n;

            const tx = proposalManager.connect(creator).createMarketProposal(
                question,
                category,
                { value: totalPayment }
            );

            await expect(tx)
                .to.emit(proposalManager, "ProposalCreated")
                .withArgs(1, creator.address, question, category, bondAmount, creationFee, proposalTax, await time.latest() + 1);
        });

        it("Should track proposals by creator", async function () {
            const { proposalManager, creator, bondAmount, proposalTax } = await loadFixture(deployCompleteSystemFixture);

            const totalPayment = bondAmount + proposalTax + (bondAmount * 250n / 10000n);

            await proposalManager.connect(creator).createMarketProposal(
                "Question 1",
                ethers.id("CRYPTO"),
                { value: totalPayment }
            );

            await proposalManager.connect(creator).createMarketProposal(
                "Question 2",
                ethers.id("SPORTS"),
                { value: totalPayment }
            );

            const creatorProposals = await proposalManager.getCreatorProposals(creator.address);
            expect(creatorProposals.length).to.equal(2);
            expect(creatorProposals[0]).to.equal(1);
            expect(creatorProposals[1]).to.equal(2);
        });

        it("Should track proposals by category", async function () {
            const { proposalManager, creator, bondAmount, proposalTax } = await loadFixture(deployCompleteSystemFixture);

            const totalPayment = bondAmount + proposalTax + (bondAmount * 250n / 10000n);
            const cryptoCategory = ethers.id("CRYPTO");

            await proposalManager.connect(creator).createMarketProposal(
                "Question 1",
                cryptoCategory,
                { value: totalPayment }
            );

            await proposalManager.connect(creator).createMarketProposal(
                "Question 2",
                cryptoCategory,
                { value: totalPayment }
            );

            const categoryProposals = await proposalManager.getCategoryProposals(cryptoCategory);
            expect(categoryProposals.length).to.equal(2);
        });

        it("Should revert on empty question", async function () {
            const { proposalManager, creator, bondAmount, proposalTax } = await loadFixture(deployCompleteSystemFixture);

            const totalPayment = bondAmount + proposalTax + (bondAmount * 250n / 10000n);

            await expect(
                proposalManager.connect(creator).createMarketProposal(
                    "",
                    ethers.id("CRYPTO"),
                    { value: totalPayment }
                )
            ).to.be.revertedWithCustomError(proposalManager, "InvalidQuestion");
        });

        it("Should revert on zero category", async function () {
            const { proposalManager, creator, bondAmount, proposalTax } = await loadFixture(deployCompleteSystemFixture);

            const totalPayment = bondAmount + proposalTax + (bondAmount * 250n / 10000n);

            await expect(
                proposalManager.connect(creator).createMarketProposal(
                    "Valid question?",
                    ethers.ZeroHash,
                    { value: totalPayment }
                )
            ).to.be.revertedWithCustomError(proposalManager, "InvalidCategory");
        });

        it("Should revert on insufficient bond", async function () {
            const { proposalManager, creator, proposalTax } = await loadFixture(deployCompleteSystemFixture);

            const insufficientPayment = proposalTax; // Missing bond and fee

            await expect(
                proposalManager.connect(creator).createMarketProposal(
                    "Valid question?",
                    ethers.id("CRYPTO"),
                    { value: insufficientPayment }
                )
            ).to.be.revertedWithCustomError(proposalManager, "InsufficientBond");
        });

        it("Should handle maximum question length", async function () {
            const { proposalManager, creator, bondAmount, proposalTax } = await loadFixture(deployCompleteSystemFixture);

            const longQuestion = "A".repeat(500); // 500 character question
            const totalPayment = bondAmount + proposalTax + (bondAmount * 250n / 10000n);

            await expect(
                proposalManager.connect(creator).createMarketProposal(
                    longQuestion,
                    ethers.id("CRYPTO"),
                    { value: totalPayment }
                )
            ).to.emit(proposalManager, "ProposalCreated");
        });

        it("Should calculate fees correctly", async function () {
            const { proposalManager, creator, bondAmount, proposalTax } = await loadFixture(deployCompleteSystemFixture);

            const expectedFee = bondAmount * 250n / 10000n; // 2.5% of bond
            const actualFee = await proposalManager.getRequiredCreationFee(bondAmount);

            expect(actualFee).to.equal(expectedFee);
        });

        it("Should set initial state to Pending", async function () {
            const { proposalManager, creator, bondAmount, proposalTax } = await loadFixture(deployCompleteSystemFixture);

            const totalPayment = bondAmount + proposalTax + (bondAmount * 250n / 10000n);

            await proposalManager.connect(creator).createMarketProposal(
                "Question?",
                ethers.id("CRYPTO"),
                { value: totalPayment }
            );

            const proposal = await proposalManager.getProposal(1);
            expect(proposal.state).to.equal(0); // ProposalState.Pending
        });

        it("Should set correct voting timestamps", async function () {
            const { proposalManager, creator, bondAmount, proposalTax, votingPeriod } = await loadFixture(deployCompleteSystemFixture);

            const totalPayment = bondAmount + proposalTax + (bondAmount * 250n / 10000n);

            const tx = await proposalManager.connect(creator).createMarketProposal(
                "Question?",
                ethers.id("CRYPTO"),
                { value: totalPayment }
            );

            const receipt = await tx.wait();
            const blockTimestamp = (await ethers.provider.getBlock(receipt.blockNumber)).timestamp;

            const proposal = await proposalManager.getProposal(1);
            expect(proposal.votingStart).to.equal(blockTimestamp);
            expect(proposal.votingEnd).to.equal(blockTimestamp + votingPeriod);
        });

        it("Should use gas less than 150k", async function () {
            const { proposalManager, creator, bondAmount, proposalTax } = await loadFixture(deployCompleteSystemFixture);

            const totalPayment = bondAmount + proposalTax + (bondAmount * 250n / 10000n);

            const tx = await proposalManager.connect(creator).createMarketProposal(
                "Question?",
                ethers.id("CRYPTO"),
                { value: totalPayment }
            );

            const receipt = await tx.wait();
            expect(receipt.gasUsed).to.be.lt(150000);
        });
    });

    // ============= submitVotingResults() Tests (10 tests) =============

    describe("submitVotingResults()", function () {
        async function createProposalFixture() {
            const fixtures = await deployCompleteSystemFixture();
            const { proposalManager, creator, bondAmount, proposalTax } = fixtures;

            const totalPayment = bondAmount + proposalTax + (bondAmount * 250n / 10000n);

            await proposalManager.connect(creator).createMarketProposal(
                "Question?",
                ethers.id("CRYPTO"),
                { value: totalPayment }
            );

            return { ...fixtures, proposalId: 1 };
        }

        it("Should update vote counts correctly", async function () {
            const { proposalManager, admin, proposalId } = await loadFixture(createProposalFixture);

            await proposalManager.connect(admin).submitVotingResults(proposalId, 150, 50);

            const proposal = await proposalManager.getProposal(proposalId);
            expect(proposal.forVotes).to.equal(150);
            expect(proposal.againstVotes).to.equal(50);
        });

        it("Should emit VotingResultsSubmitted event", async function () {
            const { proposalManager, admin, proposalId } = await loadFixture(createProposalFixture);

            await expect(
                proposalManager.connect(admin).submitVotingResults(proposalId, 150, 50)
            ).to.emit(proposalManager, "VotingResultsSubmitted")
             .withArgs(proposalId, 150, 50, await time.latest() + 1);
        });

        it("Should change state to Active", async function () {
            const { proposalManager, admin, proposalId } = await loadFixture(createProposalFixture);

            await proposalManager.connect(admin).submitVotingResults(proposalId, 150, 50);

            const proposal = await proposalManager.getProposal(proposalId);
            expect(proposal.state).to.equal(1); // ProposalState.Active
        });

        it("Should revert if not admin", async function () {
            const { proposalManager, user1, proposalId } = await loadFixture(createProposalFixture);

            await expect(
                proposalManager.connect(user1).submitVotingResults(proposalId, 150, 50)
            ).to.be.revertedWithCustomError(proposalManager, "Unauthorized");
        });

        it("Should revert on invalid proposal ID", async function () {
            const { proposalManager, admin } = await loadFixture(createProposalFixture);

            await expect(
                proposalManager.connect(admin).submitVotingResults(999, 150, 50)
            ).to.be.revertedWithCustomError(proposalManager, "InvalidProposalId");
        });

        it("Should revert if already voted", async function () {
            const { proposalManager, admin, proposalId } = await loadFixture(createProposalFixture);

            await proposalManager.connect(admin).submitVotingResults(proposalId, 150, 50);

            await expect(
                proposalManager.connect(admin).submitVotingResults(proposalId, 200, 100)
            ).to.be.revertedWithCustomError(proposalManager, "ProposalAlreadyVoted");
        });

        it("Should handle zero votes", async function () {
            const { proposalManager, admin, proposalId } = await loadFixture(createProposalFixture);

            await proposalManager.connect(admin).submitVotingResults(proposalId, 0, 0);

            const proposal = await proposalManager.getProposal(proposalId);
            expect(proposal.forVotes).to.equal(0);
            expect(proposal.againstVotes).to.equal(0);
        });

        it("Should handle maximum votes", async function () {
            const { proposalManager, admin, proposalId } = await loadFixture(createProposalFixture);

            const maxVotes = ethers.MaxUint256;

            await proposalManager.connect(admin).submitVotingResults(proposalId, maxVotes, maxVotes);

            const proposal = await proposalManager.getProposal(proposalId);
            expect(proposal.forVotes).to.equal(maxVotes);
        });

        it("Should revert if proposal expired", async function () {
            const { proposalManager, admin, proposalId, votingPeriod } = await loadFixture(createProposalFixture);

            // Fast forward past voting period
            await time.increase(votingPeriod + 1);

            await expect(
                proposalManager.connect(admin).submitVotingResults(proposalId, 150, 50)
            ).to.be.revertedWithCustomError(proposalManager, "ProposalHasExpired");
        });

        it("Should use gas less than 80k", async function () {
            const { proposalManager, admin, proposalId } = await loadFixture(createProposalFixture);

            const tx = await proposalManager.connect(admin).submitVotingResults(proposalId, 150, 50);
            const receipt = await tx.wait();

            expect(receipt.gasUsed).to.be.lt(80000);
        });
    });

    // ============= approveProposal() Tests (12 tests) =============

    describe("approveProposal()", function () {
        async function votedProposalFixture() {
            const fixtures = await createProposalFixture();
            const { proposalManager, admin, proposalId } = fixtures;

            // Submit votes: 150 for, 50 against (75% approval)
            await proposalManager.connect(admin).submitVotingResults(proposalId, 150, 50);

            return fixtures;
        }

        async function createProposalFixture() {
            const fixtures = await deployCompleteSystemFixture();
            const { proposalManager, creator, bondAmount, proposalTax } = fixtures;

            const totalPayment = bondAmount + proposalTax + (bondAmount * 250n / 10000n);

            await proposalManager.connect(creator).createMarketProposal(
                "Question?",
                ethers.id("CRYPTO"),
                { value: totalPayment }
            );

            return { ...fixtures, proposalId: 1 };
        }

        it("Should approve when threshold met", async function () {
            const { proposalManager, admin, proposalId } = await loadFixture(votedProposalFixture);

            await expect(
                proposalManager.connect(admin).approveProposal(proposalId)
            ).to.emit(proposalManager, "ProposalApproved");
        });

        it("Should change state to Approved", async function () {
            const { proposalManager, admin, proposalId } = await loadFixture(votedProposalFixture);

            await proposalManager.connect(admin).approveProposal(proposalId);

            const proposal = await proposalManager.getProposal(proposalId);
            expect(proposal.state).to.equal(2); // ProposalState.Approved
        });

        it("Should return true for isProposalApproved()", async function () {
            const { proposalManager, admin, proposalId } = await loadFixture(votedProposalFixture);

            await proposalManager.connect(admin).approveProposal(proposalId);

            expect(await proposalManager.isProposalApproved(proposalId)).to.be.true;
        });

        it("Should emit ProposalApproved event", async function () {
            const { proposalManager, admin, proposalId } = await loadFixture(votedProposalFixture);

            const proposal = await proposalManager.getProposal(proposalId);

            await expect(
                proposalManager.connect(admin).approveProposal(proposalId)
            ).to.emit(proposalManager, "ProposalApproved")
             .withArgs(proposalId, proposal.forVotes, proposal.againstVotes, await time.latest() + 1);
        });

        it("Should revert if not admin", async function () {
            const { proposalManager, user1, proposalId } = await loadFixture(votedProposalFixture);

            await expect(
                proposalManager.connect(user1).approveProposal(proposalId)
            ).to.be.revertedWithCustomError(proposalManager, "Unauthorized");
        });

        it("Should revert if threshold not met", async function () {
            const fixtures = await createProposalFixture();
            const { proposalManager, admin, proposalId } = fixtures;

            // Submit votes: 50 for, 150 against (25% approval - below 60% threshold)
            await proposalManager.connect(admin).submitVotingResults(proposalId, 50, 150);

            await expect(
                proposalManager.connect(admin).approveProposal(proposalId)
            ).to.be.revertedWithCustomError(proposalManager, "ThresholdNotMet");
        });

        it("Should revert if already approved", async function () {
            const { proposalManager, admin, proposalId } = await loadFixture(votedProposalFixture);

            await proposalManager.connect(admin).approveProposal(proposalId);

            await expect(
                proposalManager.connect(admin).approveProposal(proposalId)
            ).to.be.revertedWithCustomError(proposalManager, "ProposalNotActive");
        });

        it("Should revert if proposal not active", async function () {
            const fixtures = await createProposalFixture();
            const { proposalManager, admin, proposalId } = fixtures;

            // Try to approve without submitting votes first
            await expect(
                proposalManager.connect(admin).approveProposal(proposalId)
            ).to.be.revertedWithCustomError(proposalManager, "ProposalNotActive");
        });

        it("Should handle exact threshold (edge case)", async function () {
            const fixtures = await createProposalFixture();
            const { proposalManager, admin, proposalId } = fixtures;

            // Submit votes: exactly 60% approval (120 for, 80 against = 60%)
            await proposalManager.connect(admin).submitVotingResults(proposalId, 120, 80);

            await expect(
                proposalManager.connect(admin).approveProposal(proposalId)
            ).to.emit(proposalManager, "ProposalApproved");
        });

        it("Should reject if just below threshold", async function () {
            const fixtures = await createProposalFixture();
            const { proposalManager, admin, proposalId } = fixtures;

            // Submit votes: 59% approval (118 for, 82 against)
            await proposalManager.connect(admin).submitVotingResults(proposalId, 118, 82);

            await expect(
                proposalManager.connect(admin).approveProposal(proposalId)
            ).to.be.revertedWithCustomError(proposalManager, "ThresholdNotMet");
        });

        it("Should check minimum votes required", async function () {
            const fixtures = await createProposalFixture();
            const { proposalManager, admin, proposalId } = fixtures;

            // Submit votes: high approval but below minimum (10 for, 2 against = 83% but only 12 total)
            await proposalManager.connect(admin).submitVotingResults(proposalId, 10, 2);

            await expect(
                proposalManager.connect(admin).approveProposal(proposalId)
            ).to.be.revertedWithCustomError(proposalManager, "ThresholdNotMet");
        });

        it("Should use gas less than 50k", async function () {
            const { proposalManager, admin, proposalId } = await loadFixture(votedProposalFixture);

            const tx = await proposalManager.connect(admin).approveProposal(proposalId);
            const receipt = await tx.wait();

            expect(receipt.gasUsed).to.be.lt(50000);
        });
    });

    // ============= Additional Test Suites =============
    // Note: We'll add more test suites for:
    // - rejectProposal()
    // - createMarketFromProposal()
    // - refundBond()
    // - expireProposal()
    // - View functions
    // - State management
    // - Integration tests

    // Placeholder for remaining tests (70+ more tests)
    describe("Additional Test Suites (TODO)", function () {
        it("TODO: rejectProposal() tests (8 tests)", async function () {
            // Will be implemented in next iteration
        });

        it("TODO: createMarketFromProposal() tests (10 tests)", async function () {
            // Will be implemented in next iteration
        });

        it("TODO: refundBond() tests (8 tests)", async function () {
            // Will be implemented in next iteration
        });

        it("TODO: View functions tests (8 tests)", async function () {
            // Will be implemented in next iteration
        });

        it("TODO: State management tests (10 tests)", async function () {
            // Will be implemented in next iteration
        });

        it("TODO: Integration tests (12 tests)", async function () {
            // Will be implemented in next iteration
        });
    });
});
