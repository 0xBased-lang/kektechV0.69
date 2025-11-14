const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Integration Tests - Complete Platform", function () {
  // ============= Test Fixtures =============

  async function deployCompleteSystemFixture() {
    const [owner, admin, resolver, creator, user1, user2, user3, user4, disputer] = await ethers.getSigners();

    // Deploy VersionedRegistry
    const VersionedRegistry = await ethers.getContractFactory("VersionedRegistry");
    const registry = await VersionedRegistry.deploy();

    // Deploy ParameterStorage
    const ParameterStorage = await ethers.getContractFactory("ParameterStorage");
    const paramStorage = await ParameterStorage.deploy(registry.target);

    // Deploy AccessControlManager
    const AccessControlManager = await ethers.getContractFactory("AccessControlManager");
    const accessControl = await AccessControlManager.deploy(registry.target);

    // Deploy FlexibleMarketFactory
    const FlexibleMarketFactory = await ethers.getContractFactory("FlexibleMarketFactory");
    const factory = await FlexibleMarketFactory.deploy(registry.target, ethers.parseEther("1"));

    // Deploy ResolutionManager
    const ResolutionManager = await ethers.getContractFactory("ResolutionManager");
    const resolutionManager = await ResolutionManager.deploy(registry.target);

    // Deploy RewardDistributor
    const RewardDistributor = await ethers.getContractFactory("RewardDistributor");
    const rewardDistributor = await RewardDistributor.deploy(registry.target);

    // Deploy ProposalManager
    const ProposalManager = await ethers.getContractFactory("ProposalManager");
    const proposalManager = await ProposalManager.deploy(registry.target);

    // Register all contracts
    await registry.setContract(ethers.id("ParameterStorage"), paramStorage.target, 1);
    await registry.setContract(ethers.id("AccessControlManager"), accessControl.target, 1);
    await registry.setContract(ethers.id("FlexibleMarketFactory"), factory.target, 1);
    await registry.setContract(ethers.id("ResolutionManager"), resolutionManager.target, 1);
    await registry.setContract(ethers.id("RewardDistributor"), rewardDistributor.target, 1);
    await registry.setContract(ethers.id("ProposalManager"), proposalManager.target, 1);

    // Setup roles
    await accessControl.grantRole(ethers.id("ADMIN_ROLE"), admin.address);
    await accessControl.grantRole(ethers.id("RESOLVER_ROLE"), resolver.address);
    await accessControl.grantRole(ethers.id("ADMIN_ROLE"), proposalManager.target);
    // SECURITY FIX (M-2): Grant ADMIN_ROLE to owner for ParameterStorage access
    await accessControl.grantRole(ethers.id("ADMIN_ROLE"), owner.address);

    // Setup parameters
    await paramStorage.setParameter(ethers.id("protocolFeeBps"), 250); // 2.5%
    await paramStorage.setParameter(ethers.id("creatorFeeBps"), 150);  // 1.5%
    await paramStorage.setParameter(ethers.id("stakerIncentiveBps"), 50); // 0.5%
    await paramStorage.setParameter(ethers.id("treasuryFeeBps"), 50);  // 0.5%
    await paramStorage.setParameter(ethers.id("minCreatorBond"), ethers.parseEther("1"));
    await paramStorage.setParameter(ethers.id("minDisputeBond"), ethers.parseEther("0.5"));
    await paramStorage.setParameter(ethers.id("disputeWindow"), 48 * 60 * 60); // 48 hours
    await paramStorage.setParameter(ethers.id("quorumBps"), 1000); // 10%
    await paramStorage.setParameter(ethers.id("votingPeriod"), 3 * 24 * 60 * 60); // 3 days
    await paramStorage.setParameter(ethers.id("proposalExecutionDelay"), 24 * 60 * 60); // 1 day

    return {
      registry,
      paramStorage,
      accessControl,
      factory,
      resolutionManager,
      rewardDistributor,
      proposalManager,
      owner,
      admin,
      resolver,
      creator,
      user1,
      user2,
      user3,
      user4,
      disputer,
    };
  }

  // ============= Complete Market Lifecycle Tests =============

  describe("Complete Market Lifecycle", function () {
    it("Should complete full cycle: Create → Bet → Resolve → Claim", async function () {
      const { factory, resolutionManager, rewardDistributor, creator, user1, user2, resolver } =
        await loadFixture(deployCompleteSystemFixture);

      // 1. CREATE MARKET
      const question = "Will it rain tomorrow?";
      const outcome1 = "Yes";
      const outcome2 = "No";
      const resolutionTime = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
      const bond = ethers.parseEther("1");

      const createTx = await factory.connect(creator).createMarket(
        question,
        outcome1,
        outcome2,
        resolutionTime,
        { value: bond }
      );

      const createReceipt = await createTx.wait();
      const marketCreatedEvent = createReceipt.logs.find(
        log => log.fragment && log.fragment.name === "MarketCreated"
      );
      const marketAddress = marketCreatedEvent.args[0];

      const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
      const market = PredictionMarket.attach(marketAddress);

      // 2. PLACE BETS
      await market.connect(user1).placeBet(1, 0, { value: ethers.parseEther("10") });
      await market.connect(user2).placeBet(2, 0, { value: ethers.parseEther("10") });

      // Verify bets
      expect(await market.totalPool1()).to.equal(ethers.parseEther("10"));
      expect(await market.totalPool2()).to.equal(ethers.parseEther("10"));

      // 3. RESOLVE MARKET
      await time.increaseTo(resolutionTime + 1);
      await resolutionManager.connect(resolver).resolveMarket(
        marketAddress,
        1, // Outcome 1 wins
        "It rained as predicted"
      );

      expect(await market.isResolved()).to.be.true;
      expect(await market.winningOutcome()).to.equal(1);

      // 4. COLLECT FEES
      const totalBets = ethers.parseEther("20");
      const totalFees = (totalBets * BigInt(500)) / BigInt(10000); // 5%

      await rewardDistributor.collectFees(marketAddress, totalBets, { value: totalFees });

      // Verify fee distribution
      const feeRecord = await rewardDistributor.getMarketFees(marketAddress);
      expect(feeRecord.totalFees).to.equal(totalFees);

      // 5. CLAIM WINNINGS
      const balanceBefore = await ethers.provider.getBalance(user1.address);
      const claimTx = await market.connect(user1).claimWinnings();
      const claimReceipt = await claimTx.wait();
      const gasCost = claimReceipt.gasUsed * claimReceipt.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(user1.address);

      // User1 should receive their bet back minus fees
      const expectedPayout = ethers.parseEther("10") * (BigInt(10000) - BigInt(500)) / BigInt(10000);
      expect(balanceAfter - balanceBefore + gasCost).to.be.closeTo(expectedPayout, ethers.parseEther("0.01"));

      // Verify reward tracking
      expect(await rewardDistributor.hasClaimed(marketAddress, user1.address)).to.be.true;
    });

    it("Should handle market with dispute and resolution", async function () {
      const { factory, resolutionManager, creator, user1, user2, resolver, disputer, admin } =
        await loadFixture(deployCompleteSystemFixture);

      // 1. Create and bet on market
      const resolutionTime = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
      const createTx = await factory.connect(creator).createMarket(
        "Test question",
        "Yes",
        "No",
        resolutionTime,
        { value: ethers.parseEther("1") }
      );

      const createReceipt = await createTx.wait();
      const marketAddress = createReceipt.logs.find(
        log => log.fragment && log.fragment.name === "MarketCreated"
      ).args[0];

      const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
      const market = PredictionMarket.attach(marketAddress);

      await market.connect(user1).placeBet(1, 0, { value: ethers.parseEther("10") });
      await market.connect(user2).placeBet(2, 0, { value: ethers.parseEther("10") });

      // 2. Resolve (incorrectly)
      await time.increaseTo(resolutionTime + 1);
      await resolutionManager.connect(resolver).resolveMarket(
        marketAddress,
        1, // Wrong outcome
        "Initial resolution"
      );

      // 3. Dispute
      await resolutionManager.connect(disputer).disputeResolution(
        marketAddress,
        "This outcome is incorrect",
        { value: ethers.parseEther("0.5") }
      );

      const disputeData = await resolutionManager.getDispute(marketAddress);
      expect(disputeData.disputedAt).to.be.gt(0);

      // 4. Admin resolves dispute (overturns)
      await resolutionManager.connect(admin).resolveDispute(
        marketAddress,
        false, // Overturn
        "Evidence shows outcome 2 is correct"
      );

      // Verify outcome changed
      expect(await market.winningOutcome()).to.equal(2);

      // 5. Finalize
      await time.increase(48 * 60 * 60 + 1); // Past dispute window
      await resolutionManager.connect(admin).finalizeResolution(marketAddress);

      const resolution = await resolutionManager.getResolution(marketAddress);
      expect(resolution.status).to.equal(2); // Finalized

      // 6. Winner (user2) claims
      const balanceBefore = await ethers.provider.getBalance(user2.address);
      const claimTx = await market.connect(user2).claimWinnings();
      const claimReceipt = await claimTx.wait();
      const gasCost = claimReceipt.gasUsed * claimReceipt.gasPrice;
      const balanceAfter = await ethers.provider.getBalance(user2.address);

      // Verify payout
      expect(balanceAfter - balanceBefore + gasCost).to.be.gt(ethers.parseEther("9"));
    });
  });

  // ============= Multi-User Scenarios =============

  describe("Multi-User Scenarios", function () {
    it("Should handle multiple users betting on same market", async function () {
      const { factory, creator, user1, user2, user3, user4 } =
        await loadFixture(deployCompleteSystemFixture);

      const resolutionTime = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
      const createTx = await factory.connect(creator).createMarket(
        "Multi-user test",
        "Yes",
        "No",
        resolutionTime,
        { value: ethers.parseEther("1") }
      );

      const createReceipt = await createTx.wait();
      const marketAddress = createReceipt.logs.find(
        log => log.fragment && log.fragment.name === "MarketCreated"
      ).args[0];

      const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
      const market = PredictionMarket.attach(marketAddress);

      // Multiple users bet
      await market.connect(user1).placeBet(1, 0, { value: ethers.parseEther("5") });
      await market.connect(user2).placeBet(1, 0, { value: ethers.parseEther("3") });
      await market.connect(user3).placeBet(2, 0, { value: ethers.parseEther("7") });
      await market.connect(user4).placeBet(2, 0, { value: ethers.parseEther("2") });

      // Verify totals
      expect(await market.totalPool1()).to.equal(ethers.parseEther("8"));
      expect(await market.totalPool2()).to.equal(ethers.parseEther("9"));

      // Verify individual bets
      expect(await market.bets(user1.address, 1)).to.equal(ethers.parseEther("5"));
      expect(await market.bets(user2.address, 1)).to.equal(ethers.parseEther("3"));
      expect(await market.bets(user3.address, 2)).to.equal(ethers.parseEther("7"));
      expect(await market.bets(user4.address, 2)).to.equal(ethers.parseEther("2"));
    });

    it("Should handle multiple creators creating markets", async function () {
      const { factory, creator, user1, user2 } =
        await loadFixture(deployCompleteSystemFixture);

      const resolutionTime = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
      const bond = ethers.parseEther("1");

      // Multiple creators
      await factory.connect(creator).createMarket("Market 1", "Yes", "No", resolutionTime, { value: bond });
      await factory.connect(user1).createMarket("Market 2", "A", "B", resolutionTime, { value: bond });
      await factory.connect(user2).createMarket("Market 3", "X", "Y", resolutionTime, { value: bond });

      expect(await factory.totalMarkets()).to.equal(3);

      // Verify each market has correct creator
      const market1 = await factory.markets(0);
      const market2 = await factory.markets(1);
      const market3 = await factory.markets(2);

      const PredictionMarket = await ethers.getContractFactory("PredictionMarket");

      const m1 = PredictionMarket.attach(market1);
      const m2 = PredictionMarket.attach(market2);
      const m3 = PredictionMarket.attach(market3);

      expect(await m1.creator()).to.equal(creator.address);
      expect(await m2.creator()).to.equal(user1.address);
      expect(await m3.creator()).to.equal(user2.address);
    });
  });

  // ============= Governance Integration =============

  describe("Governance Integration", function () {
    it("Should complete governance cycle: Propose → Vote → Execute", async function () {
      const { proposalManager, paramStorage, admin, user1, user2, user3 } =
        await loadFixture(deployCompleteSystemFixture);

      // 1. CREATE PROPOSAL
      await proposalManager.connect(user1).propose("Increase quorum to 15%");
      expect(await proposalManager.proposalCount()).to.equal(1);

      // 2. VOTE
      await proposalManager.connect(user1).castVote(1, 1, 1000); // For, 10%
      await proposalManager.connect(user2).castVote(1, 1, 500);  // For, 5%
      await proposalManager.connect(user3).castVote(1, 0, 200);  // Against, 2%

      const proposal = await proposalManager.getProposal(1);
      expect(proposal.forVotes).to.equal(1500);
      expect(proposal.againstVotes).to.equal(200);

      // 3. WAIT FOR VOTING TO END
      await time.increase(3 * 24 * 60 * 60 + 1); // 3 days + 1 second

      // Verify succeeded
      expect(await proposalManager.state(1)).to.equal(2); // Succeeded

      // 4. WAIT FOR EXECUTION DELAY
      await time.increase(24 * 60 * 60 + 1); // 1 day + 1 second

      // 5. EXECUTE
      await proposalManager.connect(admin).execute(1);

      // Verify executed
      expect(await proposalManager.state(1)).to.equal(4); // Executed
      const executedProposal = await proposalManager.getProposal(1);
      expect(executedProposal.executed).to.be.true;
    });

    it("Should handle defeated proposal", async function () {
      const { proposalManager, user1, user2 } =
        await loadFixture(deployCompleteSystemFixture);

      await proposalManager.connect(user1).propose("Test proposal");

      // Vote below quorum
      await proposalManager.connect(user1).castVote(1, 1, 500); // 5% (quorum is 10%)
      await proposalManager.connect(user2).castVote(1, 0, 300); // 3%

      await time.increase(3 * 24 * 60 * 60 + 1);

      // Should be defeated (below quorum)
      expect(await proposalManager.state(1)).to.equal(3); // Defeated
    });
  });

  // ============= Economic Model Integration =============

  describe("Economic Model Integration", function () {
    it("Should distribute fees correctly across all stakeholders", async function () {
      const { factory, resolutionManager, rewardDistributor, creator, user1, resolver, admin } =
        await loadFixture(deployCompleteSystemFixture);

      const resolutionTime = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
      const createTx = await factory.connect(creator).createMarket(
        "Fee test",
        "Yes",
        "No",
        resolutionTime,
        { value: ethers.parseEther("1") }
      );

      const createReceipt = await createTx.wait();
      const marketAddress = createReceipt.logs.find(
        log => log.fragment && log.fragment.name === "MarketCreated"
      ).args[0];

      const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
      const market = PredictionMarket.attach(marketAddress);

      // Bet 100 ETH total
      await market.connect(user1).placeBet(1, 0, { value: ethers.parseEther("100") });

      // Resolve
      await time.increaseTo(resolutionTime + 1);
      await resolutionManager.connect(resolver).resolveMarket(marketAddress, 1, "Evidence");

      // Collect fees: 5% of 100 ETH = 5 ETH
      const totalBets = ethers.parseEther("100");
      const totalFees = ethers.parseEther("5");

      await rewardDistributor.collectFees(marketAddress, totalBets, { value: totalFees });

      const feeRecord = await rewardDistributor.getMarketFees(marketAddress);

      // Verify fee distribution (in basis points):
      // Protocol: 2.5% = 2.5 ETH
      // Creator: 1.5% = 1.5 ETH
      // Staker: 0.5% = 0.5 ETH
      // Treasury: 0.5% = 0.5 ETH
      expect(feeRecord.protocolFees).to.equal(ethers.parseEther("2.5"));
      expect(feeRecord.creatorFees).to.equal(ethers.parseEther("1.5"));
      expect(feeRecord.stakerFees).to.equal(ethers.parseEther("0.5"));
      expect(feeRecord.treasuryFees).to.equal(ethers.parseEther("0.5"));

      // Verify balances
      expect(await rewardDistributor.getUnclaimedCreatorFees(marketAddress)).to.equal(ethers.parseEther("1.5"));
      expect(await rewardDistributor.getStakerRewardsPool()).to.equal(ethers.parseEther("0.5"));
      expect(await rewardDistributor.getTreasuryBalance()).to.equal(ethers.parseEther("0.5"));

      // Creator claims fees
      const creatorBalanceBefore = await ethers.provider.getBalance(creator.address);
      const claimTx = await rewardDistributor.connect(creator).claimCreatorFees(marketAddress);
      const claimReceipt = await claimTx.wait();
      const gasCost = claimReceipt.gasUsed * claimReceipt.gasPrice;
      const creatorBalanceAfter = await ethers.provider.getBalance(creator.address);

      expect(creatorBalanceAfter - creatorBalanceBefore + gasCost).to.equal(ethers.parseEther("1.5"));
    });
  });

  // ============= Performance Tests =============

  describe("Performance and Gas Efficiency", function () {
    it("Should handle batch operations efficiently", async function () {
      const { factory, creator } = await loadFixture(deployCompleteSystemFixture);

      const resolutionTime = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
      const bond = ethers.parseEther("1");

      // Create multiple markets
      const createPromises = [];
      for (let i = 0; i < 5; i++) {
        createPromises.push(
          factory.connect(creator).createMarket(
            `Market ${i}`,
            "Yes",
            "No",
            resolutionTime,
            { value: bond }
          )
        );
      }

      await Promise.all(createPromises);

      expect(await factory.totalMarkets()).to.equal(5);

      // Verify all markets created
      for (let i = 0; i < 5; i++) {
        const marketAddress = await factory.markets(i);
        expect(marketAddress).to.properAddress;
      }
    });
  });

  // ============= Edge Cases and Failure Scenarios =============

  describe("Edge Cases", function () {
    it("Should handle zero bet attempts gracefully", async function () {
      const { factory, creator, user1 } = await loadFixture(deployCompleteSystemFixture);

      const resolutionTime = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
      const createTx = await factory.connect(creator).createMarket(
        "Test",
        "Yes",
        "No",
        resolutionTime,
        { value: ethers.parseEther("1") }
      );

      const createReceipt = await createTx.wait();
      const marketAddress = createReceipt.logs.find(
        log => log.fragment && log.fragment.name === "MarketCreated"
      ).args[0];

      const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
      const market = PredictionMarket.attach(marketAddress);

      // Try to bet with 0 value
      await expect(
        market.connect(user1).placeBet(1, 0, { value: 0 })
      ).to.be.reverted;
    });

    it("Should prevent double claiming of winnings", async function () {
      const { factory, resolutionManager, creator, user1, resolver } =
        await loadFixture(deployCompleteSystemFixture);

      const resolutionTime = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
      const createTx = await factory.connect(creator).createMarket(
        "Test",
        "Yes",
        "No",
        resolutionTime,
        { value: ethers.parseEther("1") }
      );

      const createReceipt = await createTx.wait();
      const marketAddress = createReceipt.logs.find(
        log => log.fragment && log.fragment.name === "MarketCreated"
      ).args[0];

      const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
      const market = PredictionMarket.attach(marketAddress);

      await market.connect(user1).placeBet(1, 0, { value: ethers.parseEther("10") });

      await time.increaseTo(resolutionTime + 1);
      await resolutionManager.connect(resolver).resolveMarket(marketAddress, 1, "Evidence");

      // Claim once
      await market.connect(user1).claimWinnings();

      // Try to claim again
      await expect(
        market.connect(user1).claimWinnings()
      ).to.be.reverted;
    });
  });
});
