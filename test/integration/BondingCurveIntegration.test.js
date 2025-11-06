const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("BondingCurveMarket Integration with KEKTECH 3.0", function () {
  // Contract instances
  let registry, accessControl, resolutionManager, rewardDistributor;
  let bondingCurveMarket;

  // Actors
  let admin, creator, resolver, trader1, trader2, disputor;

  // Constants
  const ONE_DAY = 24 * 60 * 60;
  const ONE_WEEK = 7 * ONE_DAY;
  const BOND_AMOUNT = ethers.parseEther("0.01");
  const TRADING_FEE_BPS = 200; // 2%
  const PRECISION = 10000n;

  // Roles (from AccessControlManager)
  const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
  const RESOLVER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("RESOLVER_ROLE"));

  before(async function () {
    // Get signers
    [admin, creator, resolver, trader1, trader2, disputor] = await ethers.getSigners();
  });

  beforeEach(async function () {
    // ═══════════════════════════════════════════════════════════
    // Deploy Core KEKTECH 3.0 System
    // ═══════════════════════════════════════════════════════════

    // 1. Deploy MasterRegistry
    const MasterRegistry = await ethers.getContractFactory("MasterRegistry");
    registry = await MasterRegistry.deploy();
    await registry.waitForDeployment();

    // 2. Deploy AccessControlManager
    const AccessControlManager = await ethers.getContractFactory("AccessControlManager");
    accessControl = await AccessControlManager.deploy(registry.target);
    await accessControl.waitForDeployment();

    // Register in registry
    await registry.setContract(
      ethers.keccak256(ethers.toUtf8Bytes("AccessControlManager")),
      accessControl.target
    );

    // 3. Deploy ResolutionManager
    const ResolutionManager = await ethers.getContractFactory("ResolutionManager");
    resolutionManager = await ResolutionManager.deploy(
      registry.target,
      ONE_WEEK, // dispute window
      ethers.parseEther("0.1") // min dispute bond
    );
    await resolutionManager.waitForDeployment();

    await registry.setContract(
      ethers.keccak256(ethers.toUtf8Bytes("ResolutionManager")),
      resolutionManager.target
    );

    // 4. Deploy RewardDistributor
    const RewardDistributor = await ethers.getContractFactory("RewardDistributor");
    rewardDistributor = await RewardDistributor.deploy(registry.target);
    await rewardDistributor.waitForDeployment();

    await registry.setContract(
      ethers.keccak256(ethers.toUtf8Bytes("RewardDistributor")),
      rewardDistributor.target
    );

    // ═══════════════════════════════════════════════════════════
    // Setup Roles
    // ═══════════════════════════════════════════════════════════

    // Grant admin role
    await accessControl.grantRole(ADMIN_ROLE, admin.address);

    // Grant resolver role to resolver and creator
    await accessControl.grantRole(RESOLVER_ROLE, resolver.address);
    await accessControl.grantRole(RESOLVER_ROLE, creator.address);

    // ═══════════════════════════════════════════════════════════
    // Deploy BondingCurveMarket
    // ═══════════════════════════════════════════════════════════

    // Deploy libraries first
    const DualCurveMath = await ethers.getContractFactory("DualCurveMath");
    const dualCurveMath = await DualCurveMath.deploy();
    await dualCurveMath.waitForDeployment();

    const FeeCalculator = await ethers.getContractFactory("FeeCalculator");
    const feeCalculator = await FeeCalculator.deploy();
    await feeCalculator.waitForDeployment();

    // Deploy BondingCurveMarket with library linking
    const BondingCurveMarket = await ethers.getContractFactory(
      "BondingCurveMarketIntegrated",
      {
        libraries: {
          DualCurveMath: dualCurveMath.target,
          FeeCalculator: feeCalculator.target
        }
      }
    );

    bondingCurveMarket = await BondingCurveMarket.deploy();
    await bondingCurveMarket.waitForDeployment();

    // Initialize market
    const question = "Will ETH price be above $4000 by end of week?";
    const deadline = (await time.latest()) + ONE_WEEK;

    const initData = ethers.AbiCoder.defaultAbiCoder().encode(
      ["string", "address", "uint256", "uint256", "uint256"],
      [question, creator.address, deadline, BOND_AMOUNT, TRADING_FEE_BPS]
    );

    await bondingCurveMarket.initialize(registry.target, initData);
  });

  describe("Integration Test Suite", function () {

    // ═══════════════════════════════════════════════════════════
    // TEST 1: Registry Integration
    // ═══════════════════════════════════════════════════════════

    it("Should properly integrate with MasterRegistry", async function () {
      // Verify market can read from registry
      const acmAddress = await registry.getContract(
        ethers.keccak256(ethers.toUtf8Bytes("AccessControlManager"))
      );
      expect(acmAddress).to.equal(accessControl.target);

      const rmAddress = await registry.getContract(
        ethers.keccak256(ethers.toUtf8Bytes("ResolutionManager"))
      );
      expect(rmAddress).to.equal(resolutionManager.target);

      // Verify market has correct references
      expect(await bondingCurveMarket.registry()).to.equal(registry.target);
      expect(await bondingCurveMarket.accessControl()).to.equal(accessControl.target);
      expect(await bondingCurveMarket.resolutionManager()).to.equal(resolutionManager.target);
      expect(await bondingCurveMarket.rewardDistributor()).to.equal(rewardDistributor.target);
    });

    // ═══════════════════════════════════════════════════════════
    // TEST 2: Resolution Authorization Flow
    // ═══════════════════════════════════════════════════════════

    describe("Resolution Authorization", function () {

      it("Should allow creator to resolve through ResolutionManager", async function () {
        // Wait for deadline to pass
        await time.increase(ONE_WEEK + 1);

        // Creator resolves through ResolutionManager
        await resolutionManager.connect(creator).resolveMarket(
          bondingCurveMarket.target,
          1, // OUTCOME1 (YES wins)
          "0x" // no additional data
        );

        // Verify market is resolved
        const result = await bondingCurveMarket.result();
        expect(result).to.equal(1); // OUTCOME1
      });

      it("Should allow authorized resolver to resolve", async function () {
        await time.increase(ONE_WEEK + 1);

        // Resolver resolves through ResolutionManager
        await resolutionManager.connect(resolver).resolveMarket(
          bondingCurveMarket.target,
          2, // OUTCOME2 (NO wins)
          "0x"
        );

        const result = await bondingCurveMarket.result();
        expect(result).to.equal(2); // OUTCOME2
      });

      it("Should prevent unauthorized resolution", async function () {
        await time.increase(ONE_WEEK + 1);

        // Unauthorized user cannot resolve
        await expect(
          resolutionManager.connect(trader1).resolveMarket(
            bondingCurveMarket.target,
            1,
            "0x"
          )
        ).to.be.reverted;

        // Direct resolution should also fail
        await expect(
          bondingCurveMarket.connect(trader1).resolveMarket(1)
        ).to.be.revertedWithCustomError(bondingCurveMarket, "Unauthorized");
      });

      it("Should allow admin to override resolution", async function () {
        await time.increase(ONE_WEEK + 1);

        // Initial resolution by creator
        await resolutionManager.connect(creator).resolveMarket(
          bondingCurveMarket.target,
          1, // OUTCOME1
          "0x"
        );

        expect(await bondingCurveMarket.result()).to.equal(1);

        // Admin overrides to CANCELLED
        await resolutionManager.connect(admin).overrideResolution(
          bondingCurveMarket.target,
          3, // CANCELLED
          "Incorrect initial resolution"
        );

        expect(await bondingCurveMarket.result()).to.equal(3); // CANCELLED
      });
    });

    // ═══════════════════════════════════════════════════════════
    // TEST 3: Dispute Flow
    // ═══════════════════════════════════════════════════════════

    describe("Dispute Resolution", function () {

      beforeEach(async function () {
        // Create some trading activity
        await bondingCurveMarket.connect(trader1).placeBet(
          1, // YES
          "0x",
          0,
          0,
          { value: ethers.parseEther("1") }
        );

        await bondingCurveMarket.connect(trader2).placeBet(
          2, // NO
          "0x",
          0,
          0,
          { value: ethers.parseEther("0.5") }
        );

        // Wait for deadline and resolve
        await time.increase(ONE_WEEK + 1);
        await resolutionManager.connect(creator).resolveMarket(
          bondingCurveMarket.target,
          1, // OUTCOME1
          "0x"
        );
      });

      it("Should allow dispute submission", async function () {
        const disputeBond = ethers.parseEther("0.1");

        // Disputor submits dispute
        await resolutionManager.connect(disputor).disputeResolution(
          bondingCurveMarket.target,
          "Market was manipulated",
          { value: disputeBond }
        );

        // Check dispute exists
        const dispute = await resolutionManager.getDispute(bondingCurveMarket.target);
        expect(dispute.disputor).to.equal(disputor.address);
        expect(dispute.active).to.be.true;
      });

      it("Should handle dispute resolution by admin", async function () {
        const disputeBond = ethers.parseEther("0.1");

        // Submit dispute
        await resolutionManager.connect(disputor).disputeResolution(
          bondingCurveMarket.target,
          "Incorrect outcome",
          { value: disputeBond }
        );

        // Admin resolves dispute by changing outcome
        await resolutionManager.connect(admin).resolveDispute(
          bondingCurveMarket.target,
          2, // Change to OUTCOME2
          true // Disputor wins, gets bond back
        );

        // Verify outcome changed
        expect(await bondingCurveMarket.result()).to.equal(2);
      });
    });

    // ═══════════════════════════════════════════════════════════
    // TEST 4: Fee Distribution to RewardDistributor
    // ═══════════════════════════════════════════════════════════

    describe("Fee Distribution Integration", function () {

      it("Should distribute fees to RewardDistributor", async function () {
        const betAmount = ethers.parseEther("10");

        // Record initial balance
        const initialBalance = await ethers.provider.getBalance(rewardDistributor.target);

        // Place bets to generate fees
        await bondingCurveMarket.connect(trader1).placeBet(
          1, // YES
          "0x",
          0,
          0,
          { value: betAmount }
        );

        // Some fees should go to RewardDistributor
        const newBalance = await ethers.provider.getBalance(rewardDistributor.target);
        expect(newBalance).to.be.gt(initialBalance);

        // Calculate expected fees (2% trading fee)
        const expectedFee = (betAmount * TRADING_FEE_BPS) / PRECISION;

        // Platform (30%) + Staking (50%) = 80% of fees go to RewardDistributor
        const expectedDistribution = (expectedFee * 8000n) / PRECISION;

        expect(newBalance - initialBalance).to.be.closeTo(
          expectedDistribution,
          ethers.parseEther("0.001") // Allow small variance
        );
      });
    });

    // ═══════════════════════════════════════════════════════════
    // TEST 5: Complete Market Lifecycle with KEKTECH System
    // ═══════════════════════════════════════════════════════════

    describe("Complete Lifecycle", function () {

      it("Should handle full market lifecycle through KEKTECH system", async function () {
        // Phase 1: Market Creation & Trading
        const question = await bondingCurveMarket.question();
        expect(question).to.equal("Will ETH price be above $4000 by end of week?");

        // Trading activity
        await bondingCurveMarket.connect(trader1).placeBet(
          1, // YES
          "0x",
          0,
          0,
          { value: ethers.parseEther("5") }
        );

        await bondingCurveMarket.connect(trader2).placeBet(
          2, // NO
          "0x",
          0,
          0,
          { value: ethers.parseEther("3") }
        );

        // Check prices updated
        const [yesPrice, noPrice] = await bondingCurveMarket.getPrices();
        expect(yesPrice + noPrice).to.equal(PRECISION);

        // Phase 2: Resolution through ResolutionManager
        await time.increase(ONE_WEEK + 1);

        await resolutionManager.connect(creator).resolveMarket(
          bondingCurveMarket.target,
          1, // YES wins
          "0x"
        );

        expect(await bondingCurveMarket.isResolved()).to.be.true;
        expect(await bondingCurveMarket.result()).to.equal(1);

        // Phase 3: Winners claim
        const hasWinnings = await bondingCurveMarket.hasWinnings(trader1.address);
        expect(hasWinnings).to.be.true;

        const payout = await bondingCurveMarket.calculatePayout(trader1.address);
        expect(payout).to.be.gt(0);

        await bondingCurveMarket.connect(trader1).claimWinnings();

        // Phase 4: Creator claims fees
        await bondingCurveMarket.connect(creator).claimCreatorFees();

        // Verify final state
        expect(await bondingCurveMarket.hasWinnings(trader1.address)).to.be.false;
        expect(await bondingCurveMarket.creatorFeesClaimed()).to.be.true;
      });

      it("Should handle market cancellation and refunds", async function () {
        // Place bets
        await bondingCurveMarket.connect(trader1).placeBet(
          1, "0x", 0, 0,
          { value: ethers.parseEther("2") }
        );

        await bondingCurveMarket.connect(trader2).placeBet(
          2, "0x", 0, 0,
          { value: ethers.parseEther("1.5") }
        );

        // Admin cancels market
        await time.increase(ONE_WEEK + 1);
        await resolutionManager.connect(admin).overrideResolution(
          bondingCurveMarket.target,
          3, // CANCELLED
          "Market manipulation detected"
        );

        expect(await bondingCurveMarket.result()).to.equal(3);

        // Both traders can claim refunds
        expect(await bondingCurveMarket.hasWinnings(trader1.address)).to.be.true;
        expect(await bondingCurveMarket.hasWinnings(trader2.address)).to.be.true;

        await bondingCurveMarket.connect(trader1).claimWinnings();
        await bondingCurveMarket.connect(trader2).claimWinnings();
      });
    });

    // ═══════════════════════════════════════════════════════════
    // TEST 6: Access Control Integration
    // ═══════════════════════════════════════════════════════════

    describe("Access Control", function () {

      it("Should respect AccessControlManager roles", async function () {
        // Verify resolver role check
        const hasRole = await accessControl.hasRole(RESOLVER_ROLE, resolver.address);
        expect(hasRole).to.be.true;

        const noRole = await accessControl.hasRole(RESOLVER_ROLE, trader1.address);
        expect(noRole).to.be.false;
      });

      it("Should allow role management through AccessControlManager", async function () {
        // Grant resolver role to new address
        await accessControl.connect(admin).grantRole(RESOLVER_ROLE, trader1.address);

        // Now trader1 can resolve
        await time.increase(ONE_WEEK + 1);
        await resolutionManager.connect(trader1).resolveMarket(
          bondingCurveMarket.target,
          1,
          "0x"
        );

        expect(await bondingCurveMarket.result()).to.equal(1);
      });
    });

    // ═══════════════════════════════════════════════════════════
    // TEST 7: IMarket Interface Compliance
    // ═══════════════════════════════════════════════════════════

    describe("IMarket Interface Compliance", function () {

      it("Should implement all IMarket view functions", async function () {
        // Test all required view functions
        expect(await bondingCurveMarket.isResolved()).to.equal(false);
        expect(await bondingCurveMarket.canResolve()).to.equal(false);
        expect(await bondingCurveMarket.question()).to.be.a("string");
        expect(await bondingCurveMarket.deadline()).to.be.gt(0);
        expect(await bondingCurveMarket.result()).to.equal(0); // UNRESOLVED
        expect(await bondingCurveMarket.feePercent()).to.equal(TRADING_FEE_BPS);

        // User functions
        expect(await bondingCurveMarket.hasWinnings(trader1.address)).to.equal(false);
        expect(await bondingCurveMarket.calculatePayout(trader1.address)).to.equal(0);
        expect(await bondingCurveMarket.getUserBet(trader1.address, 1)).to.equal(0);
      });

      it("Should emit all required IMarket events", async function () {
        // BetPlaced event
        await expect(
          bondingCurveMarket.connect(trader1).placeBet(
            1, "0x", 0, 0,
            { value: ethers.parseEther("1") }
          )
        ).to.emit(bondingCurveMarket, "BetPlaced")
          .withArgs(trader1.address, 1, ethers.parseEther("1"));

        // MarketResolved event
        await time.increase(ONE_WEEK + 1);
        await expect(
          resolutionManager.connect(creator).resolveMarket(
            bondingCurveMarket.target,
            1,
            "0x"
          )
        ).to.emit(bondingCurveMarket, "MarketResolved");

        // WinningsClaimed event
        await expect(
          bondingCurveMarket.connect(trader1).claimWinnings()
        ).to.emit(bondingCurveMarket, "WinningsClaimed");
      });
    });
  });
});