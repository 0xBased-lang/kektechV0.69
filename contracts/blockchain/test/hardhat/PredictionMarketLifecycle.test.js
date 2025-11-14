const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

describe("PredictionMarket Lifecycle (Phase 5.2)", function () {
  // ============= Test Fixtures =============

  async function deployFixture() {
    const [owner, operator, resolver, creator, user1, user2, treasury] = await ethers.getSigners();

    // Deploy VersionedRegistry
    const VersionedRegistry = await ethers.getContractFactory("VersionedRegistry");
    const registry = await VersionedRegistry.deploy();

    // Deploy ParameterStorage
    const ParameterStorage = await ethers.getContractFactory("ParameterStorage");
    const params = await ParameterStorage.deploy(registry.target);

    // Deploy AccessControlManager
    const AccessControlManager = await ethers.getContractFactory("AccessControlManager");
    const accessControl = await AccessControlManager.deploy(registry.target);

    // Deploy ResolutionManager
    const ResolutionManager = await ethers.getContractFactory("ResolutionManager");
    const disputeWindow = 86400; // 1 day
    const minDisputeBond = ethers.parseEther("1");
    const resolutionManager = await ResolutionManager.deploy(registry.target, disputeWindow, minDisputeBond);

    // Deploy LMSR bonding curve
    const LMSRCurve = await ethers.getContractFactory("LMSRCurve");
    const lmsrCurve = await LMSRCurve.deploy();

    // FIX: Deploy PredictionMarket template (required by factory)
    const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
    const marketTemplate = await PredictionMarket.deploy();

    // FIX: Deploy RewardDistributor (required by factory)
    const RewardDistributor = await ethers.getContractFactory("RewardDistributor");
    const rewardDistributor = await RewardDistributor.deploy(registry.target);

    // Register contracts
    await registry.setContract(ethers.id("ParameterStorage"), params.target, 1);
    await registry.setContract(ethers.id("AccessControlManager"), accessControl.target, 1);
    await registry.setContract(ethers.id("ResolutionManager"), resolutionManager.target, 1);
    // FIX: Register PredictionMarket template with correct key "PredictionMarketTemplate"
    await registry.setContract(ethers.id("PredictionMarketTemplate"), marketTemplate.target, 1);
    // FIX: Register RewardDistributor in registry
    await registry.setContract(ethers.id("RewardDistributor"), rewardDistributor.target, 1);
    // FIX: Register LMSRCurve in registry
    await registry.setContract(ethers.id("LMSRCurve"), lmsrCurve.target, 1);

    // Setup roles
    await accessControl.grantRole(ethers.id("OPERATOR_ROLE"), operator.address);
    await accessControl.grantRole(ethers.id("RESOLVER_ROLE"), resolver.address);
    await accessControl.grantRole(ethers.id("TREASURY_ROLE"), treasury.address);
    await accessControl.grantRole(ethers.id("ADMIN_ROLE"), owner.address);

    // Set parameters
    await params.setParameter(ethers.id("platformFeePercent"), 250); // 2.5%
    await params.setParameter(ethers.id("creatorFeePercent"), 150); // 1.5%
    await params.setParameter(ethers.id("minCreatorBond"), ethers.parseEther("0.1"));

    // Deploy FlexibleMarketFactoryUnified
    const FlexibleMarketFactoryUnified = await ethers.getContractFactory("FlexibleMarketFactoryUnified");
    const minCreatorBond = ethers.parseEther("0.1");
    const factory = await FlexibleMarketFactoryUnified.deploy(registry.target, minCreatorBond);

    // FIX: Grant factory the FACTORY_ROLE and OPERATOR_ROLE
    await accessControl.grantRole(ethers.id("FACTORY_ROLE"), factory.target);
    await accessControl.grantRole(ethers.id("OPERATOR_ROLE"), factory.target);

    // FIX: Set default bonding curve so markets can calculate shares for betting
    await factory.connect(owner).setDefaultCurve(lmsrCurve.target);

    return {
      registry,
      params,
      accessControl,
      resolutionManager,
      lmsrCurve,
      factory,
      owner,
      operator,
      resolver,
      creator,
      user1,
      user2,
      treasury
    };
  }

  async function createMarketFixture() {
    const contracts = await deployFixture();
    const { factory, owner, creator, lmsrCurve, registry, accessControl } = contracts;

    // FIX: Use factory.createMarket() instead of direct deployment
    // This ensures proper factory integration and state management
    const question = "Will ETH reach $5000 by end of 2024?";
    const description = "Price prediction market";
    const outcome1 = "YES";
    const outcome2 = "NO";
    const resolutionTime = Math.floor(Date.now() / 1000) + 86400 * 30; // 30 days
    const minCreatorBond = ethers.parseEther("0.1");

    // Grant BACKEND_ROLE to owner so they can approve markets
    await accessControl.grantRole(ethers.id("BACKEND_ROLE"), owner.address);

    // FIX: Create MarketConfig struct as expected by createMarket()
    const marketConfig = {
      question,
      description,
      resolutionTime,
      creatorBond: minCreatorBond,
      category: ethers.id("PREDICTION"),
      outcome1,
      outcome2
    };

    // Create market through factory with struct parameter
    const tx = await factory.connect(creator).createMarket(marketConfig, { value: minCreatorBond });

    const receipt = await tx.wait();
    const event = receipt.logs.find(log => log.fragment && log.fragment.name === "MarketCreated");
    const marketAddress = event.args.marketAddress;

    const market = await ethers.getContractAt("PredictionMarket", marketAddress);

    return { ...contracts, market, marketAddress };
  }

  // ============= Valid Transition Tests =============

  describe("Valid State Transitions", function () {
    it("5.2.1: Should transition PROPOSED → APPROVED on approval", async function () {
      const { market, factory, marketAddress, owner } = await loadFixture(createMarketFixture);

      // Verify initial state is PROPOSED
      const initialState = await market.currentState();
      expect(initialState).to.equal(0); // 0 = PROPOSED

      // FIX: Use factory.adminApproveMarket() instead of market.approve()
      const tx = await factory.connect(owner).adminApproveMarket(marketAddress);
      await tx.wait();

      // Verify state transitioned to APPROVED
      const newState = await market.currentState();
      expect(newState).to.equal(1); // 1 = APPROVED

      // Verify event emission
      await expect(tx)
        .to.emit(market, "MarketStateChanged")
        .withArgs(1, await time.latest()); // newState=APPROVED, timestamp
    });

    it("5.2.2: Should transition APPROVED → ACTIVE on activation", async function () {
      const { market, factory, marketAddress, owner } = await loadFixture(createMarketFixture);

      // FIX: First approve the market through factory
      await factory.connect(owner).adminApproveMarket(marketAddress);
      await factory.refundCreatorBond(marketAddress, "Approved for testing");

      // Verify state is APPROVED
      let currentState = await market.currentState();
      expect(currentState).to.equal(1); // 1 = APPROVED

      // FIX: Activate market through factory
      const tx = await factory.connect(owner).activateMarket(marketAddress);
      await tx.wait();

      // Verify state transitioned to ACTIVE
      currentState = await market.currentState();
      expect(currentState).to.equal(2); // 2 = ACTIVE

      // Verify event emission
      await expect(tx)
        .to.emit(market, "MarketStateChanged")
        .withArgs(2, await time.latest()); // newState=ACTIVE, timestamp
    });

    it("5.2.3-5.2.6: RESOLVING/DISPUTED transitions (NOT YET IMPLEMENTED)", async function () {
      // These tests are blocked awaiting implementation of:
      // - proposeOutcome() - ACTIVE → RESOLVING
      // - dispute() - RESOLVING → DISPUTED
      // - finalize() - RESOLVING/DISPUTED → FINALIZED

      // Mark as pending
      this.skip();
    });
  });

  // ============= Invalid Transition Tests =============

  describe("Invalid State Transitions", function () {
    it("5.2.7: Should revert PROPOSED → ACTIVE (must be approved first)", async function () {
      const { market, factory, marketAddress, owner } = await loadFixture(createMarketFixture);

      // Verify state is PROPOSED
      const currentState = await market.currentState();
      expect(currentState).to.equal(0); // 0 = PROPOSED

      // FIX: Try to activate directly through factory (should fail with MarketNotApproved)
      // Factory checks approval.approved before calling market.activate()
      await expect(
        factory.connect(owner).activateMarket(marketAddress)
      ).to.be.revertedWithCustomError(factory, "MarketNotApproved");
    });

    it("5.2.8: Should revert APPROVED → FINALIZED (invalid transition)", async function () {
      const { market, factory, marketAddress, owner } = await loadFixture(createMarketFixture);

      // FIX: Approve market through factory
      await factory.connect(owner).adminApproveMarket(marketAddress);

      // Verify state is APPROVED
      const currentState = await market.currentState();
      expect(currentState).to.equal(1); // 1 = APPROVED

      // FIX: Try to reject through factory (should FAIL - cannot reject approved markets)
      // Factory prevents rejecting already approved markets
      await expect(
        factory.connect(owner).adminRejectMarket(marketAddress, "Testing rejection")
      ).to.be.revertedWithCustomError(factory, "MarketAlreadyApproved");
    });

    it("5.2.9: Should revert ACTIVE → FINALIZED (must resolve first) - NOT YET IMPLEMENTED", async function () {
      // This test requires resolveMarket() integration
      // Mark as pending
      this.skip();
    });

    it("5.2.10: Should revert FINALIZED → any state (terminal state)", async function () {
      const { market, factory, marketAddress, owner } = await loadFixture(createMarketFixture);

      // FIX: Reject market through factory to get to FINALIZED state
      await factory.connect(owner).adminRejectMarket(marketAddress, "Testing finality");

      // Verify state is FINALIZED
      const currentState = await market.currentState();
      expect(currentState).to.equal(5); // 5 = FINALIZED

      // FIX: Try to approve through factory (should fail with MarketAlreadyRejected)
      // Factory checks approval.rejected before calling market.approve()
      await expect(
        factory.connect(owner).adminApproveMarket(marketAddress)
      ).to.be.revertedWithCustomError(factory, "MarketAlreadyRejected");

      // FIX: Try to activate through factory (should fail with MarketNotApproved)
      // Factory checks approval.approved before calling market.activate()
      await expect(
        factory.connect(owner).activateMarket(marketAddress)
      ).to.be.revertedWithCustomError(factory, "MarketNotApproved");
    });

    it("5.2.11: Should revert backwards transitions", async function () {
      const { market, factory, marketAddress, owner } = await loadFixture(createMarketFixture);

      // FIX: Approve market through factory (PROPOSED → APPROVED)
      await factory.connect(owner).adminApproveMarket(marketAddress);
      await factory.refundCreatorBond(marketAddress, "Approved for testing");

      // FIX: Activate market through factory (APPROVED → ACTIVE)
      await factory.connect(owner).activateMarket(marketAddress);

      // Verify state is ACTIVE
      const currentState = await market.currentState();
      expect(currentState).to.equal(2); // 2 = ACTIVE

      // FIX: Try to approve again through factory (should fail - market already approved)
      // Factory checks approval.approved before calling market.approve()
      await expect(
        factory.connect(owner).adminApproveMarket(marketAddress)
      ).to.be.revertedWithCustomError(factory, "MarketAlreadyApproved");
    });

    it("5.2.12: Should revert unauthorized state changes", async function () {
      const { market, user1 } = await loadFixture(createMarketFixture);

      // Try to approve as non-factory (should fail)
      await expect(
        market.connect(user1).approve()
      ).to.be.revertedWithCustomError(market, "OnlyFactory");

      // Try to activate as non-factory (should fail)
      await expect(
        market.connect(user1).activate()
      ).to.be.revertedWithCustomError(market, "OnlyFactory");

      // Try to reject as non-factory (should fail)
      await expect(
        market.connect(user1).reject("Unauthorized")
      ).to.be.revertedWithCustomError(market, "OnlyFactory");
    });
  });

  // ============= Event Emission Tests =============

  describe("Event Emissions", function () {
    it("5.2.13: Should emit MarketStateChanged with correct data", async function () {
      const { market, factory, marketAddress, owner } = await loadFixture(createMarketFixture);

      // FIX: Approve market through factory
      const tx = await factory.connect(owner).adminApproveMarket(marketAddress);

      // Check event was emitted with correct data
      await expect(tx)
        .to.emit(market, "MarketStateChanged")
        .withArgs(1, await time.latest()); // newState=APPROVED(1), timestamp
    });

    it("5.2.14: Should emit events for all transitions", async function () {
      const { market, factory, marketAddress, owner } = await loadFixture(createMarketFixture);

      // FIX: Test PROPOSED → APPROVED through factory
      const approveTx = await factory.connect(owner).adminApproveMarket(marketAddress);
      await expect(approveTx)
        .to.emit(market, "MarketStateChanged")
        .withArgs(1, await time.latest()); // newState=APPROVED

      // FIX: Refund bond before activation
      await factory.refundCreatorBond(marketAddress, "Approved for testing");

      // FIX: Test APPROVED → ACTIVE through factory
      const activateTx = await factory.connect(owner).activateMarket(marketAddress);
      await expect(activateTx)
        .to.emit(market, "MarketStateChanged")
        .withArgs(2, await time.latest()); // newState=ACTIVE
    });

    it("5.2.15: Should return correct state from getMarketState()", async function () {
      const { market, factory, marketAddress, owner } = await loadFixture(createMarketFixture);

      // Check initial state
      let state = await market.getMarketState();
      expect(state).to.equal(0); // PROPOSED

      // FIX: Approve through factory and check
      await factory.connect(owner).adminApproveMarket(marketAddress);
      state = await market.getMarketState();
      expect(state).to.equal(1); // APPROVED

      // FIX: Refund bond before activation
      await factory.refundCreatorBond(marketAddress, "Approved for testing");

      // FIX: Activate through factory and check
      await factory.connect(owner).activateMarket(marketAddress);
      state = await market.getMarketState();
      expect(state).to.equal(2); // ACTIVE
    });
  });

  // ============= State-Gated Operations =============

  describe("State-Gated Operations", function () {
    it("Should only allow placeBet when ACTIVE", async function () {
      const { market, factory, marketAddress, owner, user1 } = await loadFixture(createMarketFixture);

      // Try to bet in PROPOSED state (should fail)
      await expect(
        market.connect(user1).placeBet(1, 0, { value: ethers.parseEther("1") }) // outcome=OUTCOME1(1), minOdds=0
      ).to.be.revertedWithCustomError(market, "MarketNotActive");

      // FIX: Approve market through factory
      await factory.connect(owner).adminApproveMarket(marketAddress);

      // Try to bet in APPROVED state (should fail)
      await expect(
        market.connect(user1).placeBet(1, 0, { value: ethers.parseEther("1") })
      ).to.be.revertedWithCustomError(market, "MarketNotActive");

      // FIX: Refund bond and activate market through factory
      await factory.refundCreatorBond(marketAddress, "Approved for testing");
      await factory.connect(owner).activateMarket(marketAddress);

      // Now betting should work in ACTIVE state
      const tx = await market.connect(user1).placeBet(1, 0, { value: ethers.parseEther("1") });
      await expect(tx).to.not.be.reverted;
    });

    it("Should only allow claimWinnings when FINALIZED - NOT YET IMPLEMENTED", async function () {
      // This test requires full resolution flow
      // Mark as pending
      this.skip();
    });
  });

  // ============= Direct Deployment Integration =============

  describe("Direct Deployment Integration", function () {
    it("Should set PROPOSED state on market initialization", async function () {
      const { market } = await loadFixture(createMarketFixture);

      // Verify state is PROPOSED after initialization
      const state = await market.currentState();
      expect(state).to.equal(0); // 0 = PROPOSED
    });

    it("Should allow factory (deployer) to call approve()", async function () {
      const { market, factory, marketAddress, owner } = await loadFixture(createMarketFixture);

      // FIX: Use factory.adminApproveMarket() instead of market.approve()
      const tx = await factory.connect(owner).adminApproveMarket(marketAddress);
      await tx.wait();

      // Verify market state changed
      const state = await market.currentState();
      expect(state).to.equal(1); // 1 = APPROVED
    });

    it("Should allow factory (deployer) to call activate()", async function () {
      const { market, factory, marketAddress, owner } = await loadFixture(createMarketFixture);

      // FIX: Approve first through factory
      await factory.connect(owner).adminApproveMarket(marketAddress);
      await factory.refundCreatorBond(marketAddress, "Approved for testing");

      // FIX: Activate through factory
      const tx = await factory.connect(owner).activateMarket(marketAddress);
      await tx.wait();

      // Verify market state changed
      const state = await market.currentState();
      expect(state).to.equal(2); // 2 = ACTIVE
    });
  });
});
