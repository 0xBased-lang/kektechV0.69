const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

describe("ResolutionManager - Phase 6: Community Voting", function () {
  async function deployFixture() {
    const [admin, backend, resolver, user1, user2, user3] = await ethers.getSigners();

    // Deploy VersionedRegistry
    const VersionedRegistry = await ethers.getContractFactory("VersionedRegistry");
    const registry = await VersionedRegistry.deploy();

    // Deploy AccessControlManager
    const AccessControlManager = await ethers.getContractFactory("AccessControlManager");
    const accessControl = await AccessControlManager.deploy(registry.target);

    // Deploy ParameterStorage
    const ParameterStorage = await ethers.getContractFactory("ParameterStorage");
    const params = await ParameterStorage.deploy(registry.target);

    // Deploy PredictionMarket Template
    const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
    const marketTemplate = await PredictionMarket.deploy();

    // Deploy LMSR Curve
    const LMSRCurve = await ethers.getContractFactory("LMSRCurve");
    const lmsrCurve = await LMSRCurve.deploy();

    // Deploy RewardDistributor
    const RewardDistributor = await ethers.getContractFactory("RewardDistributor");
    const rewardDistributor = await RewardDistributor.deploy(registry.target);

    // Deploy ResolutionManager
    const ResolutionManager = await ethers.getContractFactory("ResolutionManager");
    const resolutionManager = await ResolutionManager.deploy(
      registry.target,
      48 * 3600, // 48 hour dispute window
      ethers.parseEther("0.1") // min dispute bond
    );

    // Deploy Factory
    const factory = await (await ethers.getContractFactory("FlexibleMarketFactoryUnified")).deploy(
      registry.target,
      ethers.parseEther("0.1")
    );

    // Register contracts
    await registry.setContract(ethers.id("AccessControlManager"), accessControl.target, 1);
    await registry.setContract(ethers.id("ParameterStorage"), params.target, 1);
    await registry.setContract(ethers.id("PredictionMarketTemplate"), marketTemplate.target, 1);
    await registry.setContract(ethers.id("LMSRCurve"), lmsrCurve.target, 1);
    await registry.setContract(ethers.id("RewardDistributor"), rewardDistributor.target, 1);
    await registry.setContract(ethers.id("ResolutionManager"), resolutionManager.target, 1);
    await registry.setContract(ethers.id("FlexibleMarketFactoryUnified"), factory.target, 1);

    // Grant roles
    const ADMIN_ROLE = ethers.id("ADMIN_ROLE");
    const BACKEND_ROLE = ethers.id("BACKEND_ROLE");
    const RESOLVER_ROLE = ethers.id("RESOLVER_ROLE");

    await accessControl.grantRole(ADMIN_ROLE, admin.address);
    await accessControl.grantRole(BACKEND_ROLE, backend.address);
    await accessControl.grantRole(RESOLVER_ROLE, resolver.address);
    await accessControl.grantRole(ethers.id("FACTORY_ROLE"), factory.target);

    // Set platform fee
    await params.setParameter(ethers.id("platformFeePercent"), 500); // 5%

    // Set default curve on factory
    await factory.setDefaultCurve(lmsrCurve.target);

    return {
      resolutionManager,
      registry,
      accessControl,
      factory,
      admin,
      backend,
      resolver,
      user1,
      user2,
      user3,
      ADMIN_ROLE,
      BACKEND_ROLE,
      RESOLVER_ROLE
    };
  }

  async function createMockMarket(factory, creator) {
    const LMSRBondingCurve = await ethers.getContractFactory("LMSRBondingCurve");
    const bondingCurve = await LMSRBondingCurve.deploy();

    const resolutionTime = (await time.latest()) + 86400; // 24 hours from now
    const config = {
      question: "Test market for Phase 6?",
      description: "Testing community voting",
      resolutionTime: resolutionTime,
      creatorBond: ethers.parseEther("0.1"),
      category: ethers.id("test"),
      outcome1: "Yes",
      outcome2: "No",
      tradingCloseBuffer: 3600
    };

    const tx = await factory.connect(creator).createMarket(config, {
      value: ethers.parseEther("0.1")
    });
    const receipt = await tx.wait();

    const event = receipt.logs.find(
      log => log.fragment && log.fragment.name === "MarketCreated"
    );
    return event.args.marketAddress;
  }

  describe("Community Dispute Window", function () {
    it("should open community dispute window when resolution proposed", async function () {
      const { resolutionManager, factory, resolver, admin } = await loadFixture(deployFixture);

      const marketAddr = await createMockMarket(factory, admin);

      // Fast forward past resolution time
      await time.increase(86400);

      // Propose resolution
      await expect(
        resolutionManager.connect(resolver).proposeResolution(marketAddr, 1, "Outcome 1 won")
      ).to.emit(resolutionManager, "CommunityDisputeWindowOpened");

      // Check window is active
      const window = await resolutionManager._communityDisputes(marketAddr);
      expect(window.isActive).to.be.true;
    });

    it("should set correct end time (48 hours default)", async function () {
      const { resolutionManager, factory, resolver, admin } = await loadFixture(deployFixture);

      const marketAddr = await createMockMarket(factory, admin);
      await time.increase(86400);

      const tx = await resolutionManager.connect(resolver).proposeResolution(marketAddr, 1, "Evidence");
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      const window = await resolutionManager._communityDisputes(marketAddr);
      expect(window.endTime).to.equal(BigInt(block.timestamp) + BigInt(48 * 3600));
    });

    it("should prevent duplicate windows for same market", async function () {
      const { resolutionManager, factory, resolver, admin } = await loadFixture(deployFixture);

      const marketAddr = await createMockMarket(factory, admin);
      await time.increase(86400);

      await resolutionManager.connect(resolver).proposeResolution(marketAddr, 1, "Evidence");

      // Try to propose again
      await expect(
        resolutionManager.connect(resolver).proposeResolution(marketAddr, 2, "Different outcome")
      ).to.be.reverted; // Should revert with "Market already resolved"
    });

    it("should store proposed outcome correctly", async function () {
      const { resolutionManager, factory, resolver, admin } = await loadFixture(deployFixture);

      const marketAddr = await createMockMarket(factory, admin);
      await time.increase(86400);

      await resolutionManager.connect(resolver).proposeResolution(marketAddr, 2, "Outcome 2 won");

      const window = await resolutionManager._communityDisputes(marketAddr);
      expect(window.proposedOutcome).to.equal(2);
    });

    it("should initialize vote counts to zero", async function () {
      const { resolutionManager, factory, resolver, admin } = await loadFixture(deployFixture);

      const marketAddr = await createMockMarket(factory, admin);
      await time.increase(86400);

      await resolutionManager.connect(resolver).proposeResolution(marketAddr, 1, "Evidence");

      const window = await resolutionManager._communityDisputes(marketAddr);
      expect(window.agreeCount).to.equal(0);
      expect(window.disagreeCount).to.equal(0);
    });

    it("should only allow resolver to propose resolution", async function () {
      const { resolutionManager, factory, admin, user1 } = await loadFixture(deployFixture);

      const marketAddr = await createMockMarket(factory, admin);
      await time.increase(86400);

      await expect(
        resolutionManager.connect(user1).proposeResolution(marketAddr, 1, "Evidence")
      ).to.be.reverted;
    });
  });

  describe("Signal Aggregation Logic", function () {
    async function setupProposedResolution() {
      const fixture = await loadFixture(deployFixture);
      const marketAddr = await createMockMarket(fixture.factory, fixture.admin);
      await time.increase(86400);
      await fixture.resolutionManager.connect(fixture.resolver).proposeResolution(marketAddr, 1, "Evidence");
      return { ...fixture, marketAddr };
    }

    it("should auto-finalize with >75% agreement", async function () {
      const { resolutionManager, marketAddr, backend } = await setupProposedResolution();

      await expect(
        resolutionManager.connect(backend).submitDisputeSignals(marketAddr, 80, 20)
      ).to.emit(resolutionManager, "MarketAutoFinalized");

      const resolution = await resolutionManager.getResolutionData(marketAddr);
      expect(resolution.status).to.equal(2); // FINALIZED
    });

    it("should mark disputed with >40% disagreement", async function () {
      const { resolutionManager, marketAddr, backend } = await setupProposedResolution();

      await expect(
        resolutionManager.connect(backend).submitDisputeSignals(marketAddr, 40, 60)
      ).to.emit(resolutionManager, "CommunityDisputeFlagged");

      const resolution = await resolutionManager.getResolutionData(marketAddr);
      expect(resolution.status).to.equal(1); // DISPUTED
    });

    it("should wait if signals are mixed (50-50)", async function () {
      const { resolutionManager, marketAddr, backend } = await setupProposedResolution();

      await resolutionManager.connect(backend).submitDisputeSignals(marketAddr, 60, 40);

      const window = await resolutionManager._communityDisputes(marketAddr);
      expect(window.isActive).to.be.true; // Still active, waiting
    });

    it("should handle zero votes gracefully", async function () {
      const { resolutionManager, marketAddr, backend } = await setupProposedResolution();

      await expect(
        resolutionManager.connect(backend).submitDisputeSignals(marketAddr, 0, 0)
      ).to.emit(resolutionManager, "DisputeSignalsSubmitted");

      const window = await resolutionManager._communityDisputes(marketAddr);
      expect(window.isActive).to.be.true; // Still active
    });

    it("should calculate percentages correctly", async function () {
      const { resolutionManager, marketAddr, backend } = await setupProposedResolution();

      // 75 agree, 25 disagree = exactly 75% agreement (should auto-finalize)
      await resolutionManager.connect(backend).submitDisputeSignals(marketAddr, 75, 25);

      const resolution = await resolutionManager.getResolutionData(marketAddr);
      expect(resolution.status).to.equal(2); // FINALIZED
    });

    it("should allow multiple signal submissions (updates)", async function () {
      const { resolutionManager, marketAddr, backend } = await setupProposedResolution();

      // First submission: 50-50 (no action)
      await resolutionManager.connect(backend).submitDisputeSignals(marketAddr, 50, 50);
      let window = await resolutionManager._communityDisputes(marketAddr);
      expect(window.isActive).to.be.true;

      // Second submission: 80-20 (auto-finalize)
      await resolutionManager.connect(backend).submitDisputeSignals(marketAddr, 80, 20);
      window = await resolutionManager._communityDisputes(marketAddr);
      expect(window.isActive).to.be.false;
      expect(window.autoFinalized).to.be.true;
    });

    it("should handle edge case: 100% agreement", async function () {
      const { resolutionManager, marketAddr, backend } = await setupProposedResolution();

      await resolutionManager.connect(backend).submitDisputeSignals(marketAddr, 100, 0);

      const resolution = await resolutionManager.getResolutionData(marketAddr);
      expect(resolution.status).to.equal(2); // FINALIZED
    });

    it("should handle edge case: 100% disagreement", async function () {
      const { resolutionManager, marketAddr, backend } = await setupProposedResolution();

      await resolutionManager.connect(backend).submitDisputeSignals(marketAddr, 0, 100);

      const resolution = await resolutionManager.getResolutionData(marketAddr);
      expect(resolution.status).to.equal(1); // DISPUTED
    });

    it("should only allow backend to submit signals", async function () {
      const { resolutionManager, marketAddr, user1 } = await setupProposedResolution();

      await expect(
        resolutionManager.connect(user1).submitDisputeSignals(marketAddr, 80, 20)
      ).to.be.reverted;
    });

    it("should revert if no active community dispute", async function () {
      const { resolutionManager, backend } = await loadFixture(deployFixture);

      await expect(
        resolutionManager.connect(backend).submitDisputeSignals(ethers.ZeroAddress, 80, 20)
      ).to.be.revertedWith("No active community dispute");
    });
  });

  describe("Auto-Finalization", function () {
    async function setupProposedResolution() {
      const fixture = await loadFixture(deployFixture);
      const marketAddr = await createMockMarket(fixture.factory, fixture.admin);
      await time.increase(86400);
      await fixture.resolutionManager.connect(fixture.resolver).proposeResolution(marketAddr, 1, "Evidence");
      return { ...fixture, marketAddr };
    }

    it("should close window after auto-finalization", async function () {
      const { resolutionManager, marketAddr, backend } = await setupProposedResolution();

      await resolutionManager.connect(backend).submitDisputeSignals(marketAddr, 80, 20);

      const window = await resolutionManager._communityDisputes(marketAddr);
      expect(window.isActive).to.be.false;
      expect(window.autoFinalized).to.be.true;
    });

    it("should emit MarketAutoFinalized event", async function () {
      const { resolutionManager, marketAddr, backend } = await setupProposedResolution();

      await expect(
        resolutionManager.connect(backend).submitDisputeSignals(marketAddr, 80, 20)
      ).to.emit(resolutionManager, "MarketAutoFinalized")
        .withArgs(marketAddr, 1);
    });

    it("should emit ResolutionFinalized event", async function () {
      const { resolutionManager, marketAddr, backend } = await setupProposedResolution();

      await expect(
        resolutionManager.connect(backend).submitDisputeSignals(marketAddr, 80, 20)
      ).to.emit(resolutionManager, "ResolutionFinalized");
    });

    it("should prevent further signal submissions after finalization", async function () {
      const { resolutionManager, marketAddr, backend } = await setupProposedResolution();

      await resolutionManager.connect(backend).submitDisputeSignals(marketAddr, 80, 20);

      await expect(
        resolutionManager.connect(backend).submitDisputeSignals(marketAddr, 90, 10)
      ).to.be.revertedWith("No active community dispute");
    });

    it("should set resolution status to FINALIZED", async function () {
      const { resolutionManager, marketAddr, backend } = await setupProposedResolution();

      await resolutionManager.connect(backend).submitDisputeSignals(marketAddr, 80, 20);

      const resolution = await resolutionManager.getResolutionData(marketAddr);
      expect(resolution.status).to.equal(2); // FINALIZED
    });
  });

  describe("Admin Override", function () {
    async function setupDisputedMarket() {
      const fixture = await loadFixture(deployFixture);
      const marketAddr = await createMockMarket(fixture.factory, fixture.admin);
      await time.increase(86400);
      await fixture.resolutionManager.connect(fixture.resolver).proposeResolution(marketAddr, 1, "Evidence");
      await fixture.resolutionManager.connect(fixture.backend).submitDisputeSignals(marketAddr, 40, 60);
      return { ...fixture, marketAddr };
    }

    it("should allow admin to override disputed market", async function () {
      const { resolutionManager, marketAddr, admin } = await setupDisputedMarket();

      await expect(
        resolutionManager.connect(admin).adminResolveMarket(marketAddr, 2, "Admin decision")
      ).to.emit(resolutionManager, "AdminResolution");

      const resolution = await resolutionManager.getResolutionData(marketAddr);
      expect(resolution.outcome).to.equal(2);
      expect(resolution.status).to.equal(2); // FINALIZED
    });

    it("should close community dispute window on override", async function () {
      const { resolutionManager, marketAddr, admin } = await setupDisputedMarket();

      await resolutionManager.connect(admin).adminResolveMarket(marketAddr, 2, "Override");

      const window = await resolutionManager._communityDisputes(marketAddr);
      expect(window.isActive).to.be.false;
    });

    it("should emit AdminResolution event with reason", async function () {
      const { resolutionManager, marketAddr, admin } = await setupDisputedMarket();

      await expect(
        resolutionManager.connect(admin).adminResolveMarket(marketAddr, 2, "Community vote inconclusive")
      ).to.emit(resolutionManager, "AdminResolution")
        .withArgs(marketAddr, 2, "Community vote inconclusive");
    });

    it("should only allow admin to override", async function () {
      const { resolutionManager, marketAddr, user1 } = await setupDisputedMarket();

      await expect(
        resolutionManager.connect(user1).adminResolveMarket(marketAddr, 2, "Not allowed")
      ).to.be.reverted;
    });

    it("should finalize immediately after override", async function () {
      const { resolutionManager, marketAddr, admin } = await setupDisputedMarket();

      await resolutionManager.connect(admin).adminResolveMarket(marketAddr, 2, "Override");

      const resolution = await resolutionManager.getResolutionData(marketAddr);
      expect(resolution.status).to.equal(2); // FINALIZED
    });

    it("should revert with invalid outcome", async function () {
      const { resolutionManager, marketAddr, admin } = await setupDisputedMarket();

      await expect(
        resolutionManager.connect(admin).adminResolveMarket(marketAddr, 0, "Invalid")
      ).to.be.reverted;

      await expect(
        resolutionManager.connect(admin).adminResolveMarket(marketAddr, 3, "Invalid")
      ).to.be.reverted;
    });
  });

  describe("Threshold Configuration", function () {
    it("should set agreement threshold", async function () {
      const { resolutionManager, admin } = await loadFixture(deployFixture);

      await expect(
        resolutionManager.connect(admin).setAgreementThreshold(80)
      ).to.emit(resolutionManager, "AgreementThresholdUpdated")
        .withArgs(80);

      expect(await resolutionManager.agreementThreshold()).to.equal(80);
    });

    it("should set disagreement threshold", async function () {
      const { resolutionManager, admin } = await loadFixture(deployFixture);

      await expect(
        resolutionManager.connect(admin).setDisagreementThreshold(35)
      ).to.emit(resolutionManager, "DisagreementThresholdUpdated")
        .withArgs(35);

      expect(await resolutionManager.disagreementThreshold()).to.equal(35);
    });

    it("should reject invalid agreement threshold (<= 50)", async function () {
      const { resolutionManager, admin } = await loadFixture(deployFixture);

      await expect(
        resolutionManager.connect(admin).setAgreementThreshold(50)
      ).to.be.revertedWith("Invalid threshold");

      await expect(
        resolutionManager.connect(admin).setAgreementThreshold(30)
      ).to.be.revertedWith("Invalid threshold");
    });

    it("should reject invalid agreement threshold (> 100)", async function () {
      const { resolutionManager, admin } = await loadFixture(deployFixture);

      await expect(
        resolutionManager.connect(admin).setAgreementThreshold(101)
      ).to.be.revertedWith("Invalid threshold");
    });

    it("should reject invalid disagreement threshold (>= 50)", async function () {
      const { resolutionManager, admin } = await loadFixture(deployFixture);

      await expect(
        resolutionManager.connect(admin).setDisagreementThreshold(50)
      ).to.be.revertedWith("Invalid threshold");

      await expect(
        resolutionManager.connect(admin).setDisagreementThreshold(60)
      ).to.be.revertedWith("Invalid threshold");
    });

    it("should reject invalid disagreement threshold (<= 0)", async function () {
      const { resolutionManager, admin } = await loadFixture(deployFixture);

      await expect(
        resolutionManager.connect(admin).setDisagreementThreshold(0)
      ).to.be.revertedWith("Invalid threshold");
    });

    it("should only allow admin to set thresholds", async function () {
      const { resolutionManager, user1 } = await loadFixture(deployFixture);

      await expect(
        resolutionManager.connect(user1).setAgreementThreshold(80)
      ).to.be.reverted;

      await expect(
        resolutionManager.connect(user1).setDisagreementThreshold(35)
      ).to.be.reverted;
    });
  });

  describe("Integration with Existing System", function () {
    it("should still allow bond-based disputes", async function () {
      const { resolutionManager, factory, resolver, admin, user1 } = await loadFixture(deployFixture);

      const marketAddr = await createMockMarket(factory, admin);
      await time.increase(86400);

      // Use old resolveMarket (bond-based)
      await resolutionManager.connect(resolver).resolveMarket(marketAddr, 1, "Evidence");

      // User disputes with bond
      await expect(
        resolutionManager.connect(user1).disputeResolution(marketAddr, "I disagree", {
          value: ethers.parseEther("0.1")
        })
      ).to.emit(resolutionManager, "ResolutionDisputed");

      const dispute = await resolutionManager.getDisputeData(marketAddr);
      expect(dispute.disputer).to.equal(user1.address);
    });

    it("should not interfere with bond-based workflow", async function () {
      const { resolutionManager, factory, resolver, admin, user1 } = await loadFixture(deployFixture);

      const marketAddr = await createMockMarket(factory, admin);
      await time.increase(86400);

      await resolutionManager.connect(resolver).resolveMarket(marketAddr, 1, "Evidence");
      await resolutionManager.connect(user1).disputeResolution(marketAddr, "Disagree", {
        value: ethers.parseEther("0.1")
      });

      // Admin resolves bond-based dispute
      await expect(
        resolutionManager.connect(admin).resolveDispute(marketAddr, false, 1)
      ).to.emit(resolutionManager, "DisputeResolved");
    });

    it("should allow choosing between systems", async function () {
      const { resolutionManager, factory, resolver, admin } = await loadFixture(deployFixture);

      const market1 = await createMockMarket(factory, admin);
      const market2 = await createMockMarket(factory, admin);

      await time.increase(86400);

      // Market 1: Community voting
      await resolutionManager.connect(resolver).proposeResolution(market1, 1, "Evidence");

      // Market 2: Bond-based
      await resolutionManager.connect(resolver).resolveMarket(market2, 1, "Evidence");

      // Both should work independently
      const window1 = await resolutionManager._communityDisputes(market1);
      expect(window1.isActive).to.be.true;

      const resolution2 = await resolutionManager.getResolutionData(market2);
      expect(resolution2.status).to.equal(0); // RESOLVED
    });
  });

  describe("Gas Benchmarking", function () {
    async function setupProposedResolution() {
      const fixture = await loadFixture(deployFixture);
      const marketAddr = await createMockMarket(fixture.factory, fixture.admin);
      await time.increase(86400);
      await fixture.resolutionManager.connect(fixture.resolver).proposeResolution(marketAddr, 1, "Evidence");
      return { ...fixture, marketAddr };
    }

    it("should measure gas for proposeResolution()", async function () {
      const { resolutionManager, factory, resolver, admin } = await loadFixture(deployFixture);

      const marketAddr = await createMockMarket(factory, admin);
      await time.increase(86400);

      const tx = await resolutionManager.connect(resolver).proposeResolution(marketAddr, 1, "Evidence");
      const receipt = await tx.wait();
      console.log(`proposeResolution() gas: ${receipt.gasUsed}`);

      expect(receipt.gasUsed).to.be.lt(250000); // Should be < 250k gas
    });

    it("should measure gas for submitDisputeSignals()", async function () {
      const { resolutionManager, marketAddr, backend } = await setupProposedResolution();

      const tx = await resolutionManager.connect(backend).submitDisputeSignals(marketAddr, 80, 20);
      const receipt = await tx.wait();
      console.log(`submitDisputeSignals() gas: ${receipt.gasUsed}`);

      expect(receipt.gasUsed).to.be.lt(150000); // Should be < 150k gas
    });

    it("should measure gas for adminResolveMarket()", async function () {
      const { resolutionManager, marketAddr, admin, backend } = await setupProposedResolution();

      // Make it disputed first
      await resolutionManager.connect(backend).submitDisputeSignals(marketAddr, 40, 60);

      const tx = await resolutionManager.connect(admin).adminResolveMarket(marketAddr, 2, "Override");
      const receipt = await tx.wait();
      console.log(`adminResolveMarket() gas: ${receipt.gasUsed}`);

      expect(receipt.gasUsed).to.be.lt(100000); // Should be < 100k gas
    });
  });
});
