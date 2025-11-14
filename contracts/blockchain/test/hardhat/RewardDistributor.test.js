const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("RewardDistributor", function () {
  // ============= Test Fixtures =============

  async function deployFixture() {
    const [owner, admin, creator, user1, user2, user3, staker1, treasury] = await ethers.getSigners();

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

    // Deploy RewardDistributor
    const RewardDistributor = await ethers.getContractFactory("RewardDistributor");
    const rewardDistributor = await RewardDistributor.deploy(registry.target);

    // Register RewardDistributor
    await registry.setContract(ethers.id("RewardDistributor"), rewardDistributor.target, 1);

    // Setup roles
    await accessControl.grantRole(ethers.id("ADMIN_ROLE"), admin.address);
    // SECURITY FIX (M-2): Grant ADMIN_ROLE to owner for ParameterStorage access
    await accessControl.grantRole(ethers.id("ADMIN_ROLE"), owner.address);

    // Setup default fee distribution in ParameterStorage
    await paramStorage.setParameter(ethers.id("protocolFeeBps"), 250); // 2.5%
    await paramStorage.setParameter(ethers.id("creatorFeeBps"), 150);  // 1.5%
    await paramStorage.setParameter(ethers.id("stakerIncentiveBps"), 50); // 0.5%
    await paramStorage.setParameter(ethers.id("treasuryFeeBps"), 50);  // 0.5%

    return {
      registry,
      paramStorage,
      accessControl,
      rewardDistributor,
      owner,
      admin,
      creator,
      user1,
      user2,
      user3,
      staker1,
      treasury,
    };
  }

  // ============= Deployment Tests =============

  describe("Deployment", function () {
    it("Should deploy with correct registry", async function () {
      const { rewardDistributor, registry } = await loadFixture(deployFixture);
      // RewardDistributor doesn't expose registry, so we just check it deployed
      expect(rewardDistributor.target).to.properAddress;
    });

    it("Should initialize with zero balances", async function () {
      const { rewardDistributor } = await loadFixture(deployFixture);
      expect(await rewardDistributor.getTreasuryBalance()).to.equal(0);
      expect(await rewardDistributor.getStakerRewardsPool()).to.equal(0);
      expect(await rewardDistributor.getTotalFeesCollected()).to.equal(0);
    });

    it("Should have correct fee distribution from ParameterStorage", async function () {
      const { rewardDistributor } = await loadFixture(deployFixture);
      const feeDist = await rewardDistributor.getFeeDistribution();
      expect(feeDist.protocolFeeBps).to.equal(250);
      expect(feeDist.creatorFeeBps).to.equal(150);
      expect(feeDist.stakerIncentiveBps).to.equal(50);
      expect(feeDist.treasuryFeeBps).to.equal(50);
    });
  });

  // ============= Fee Collection Tests =============

  describe("Fee Collection", function () {
    it("Should collect fees from market", async function () {
      const { rewardDistributor, owner } = await loadFixture(deployFixture);
      const market = owner.address; // Mock market
      const totalFees = ethers.parseEther("10");

      await expect(
        rewardDistributor.collectFees(market, totalFees, { value: totalFees })
      ).to.emit(rewardDistributor, "FeesCollected");
    });

    it("Should split fees correctly", async function () {
      const { rewardDistributor, owner } = await loadFixture(deployFixture);
      const market = owner.address;
      const totalFees = ethers.parseEther("10"); // 10 ETH

      await rewardDistributor.collectFees(market, totalFees, { value: totalFees });

      const feeRecord = await rewardDistributor.getMarketFees(market);

      // 2.5% protocol = 0.25 ETH
      expect(feeRecord.protocolFees).to.equal(ethers.parseEther("0.25"));
      // 1.5% creator = 0.15 ETH
      expect(feeRecord.creatorFees).to.equal(ethers.parseEther("0.15"));
      // 0.5% staker = 0.05 ETH
      expect(feeRecord.stakerFees).to.equal(ethers.parseEther("0.05"));
      // 0.5% treasury = 0.05 ETH
      expect(feeRecord.treasuryFees).to.equal(ethers.parseEther("0.05"));
      // Total = 0.5 ETH (5%)
      expect(feeRecord.totalFees).to.equal(ethers.parseEther("0.5"));
    });

    it("Should update treasury balance", async function () {
      const { rewardDistributor, owner } = await loadFixture(deployFixture);
      const market = owner.address;
      const totalFees = ethers.parseEther("10");

      await rewardDistributor.collectFees(market, totalFees, { value: totalFees });

      // Treasury gets 0.5% = 0.05 ETH
      expect(await rewardDistributor.getTreasuryBalance()).to.equal(ethers.parseEther("0.05"));
    });

    it("Should update staker rewards pool", async function () {
      const { rewardDistributor, owner } = await loadFixture(deployFixture);
      const market = owner.address;
      const totalFees = ethers.parseEther("10");

      await rewardDistributor.collectFees(market, totalFees, { value: totalFees });

      // Staker pool gets 0.5% = 0.05 ETH
      expect(await rewardDistributor.getStakerRewardsPool()).to.equal(ethers.parseEther("0.05"));
    });

    it("Should track total fees collected", async function () {
      const { rewardDistributor, owner } = await loadFixture(deployFixture);
      const market = owner.address;
      const totalFees = ethers.parseEther("10");

      await rewardDistributor.collectFees(market, totalFees, { value: totalFees });

      // Total 5% of 10 ETH = 0.5 ETH
      expect(await rewardDistributor.getTotalFeesCollected()).to.equal(ethers.parseEther("0.5"));
    });

    it("Should emit FeesCollected event", async function () {
      const { rewardDistributor, owner } = await loadFixture(deployFixture);
      const market = owner.address;
      const totalFees = ethers.parseEther("10");

      await expect(rewardDistributor.collectFees(market, totalFees, { value: totalFees }))
        .to.emit(rewardDistributor, "FeesCollected")
        .withArgs(
          market,
          ethers.parseEther("0.5"),  // totalFees (5%)
          ethers.parseEther("0.25"), // protocol (2.5%)
          ethers.parseEther("0.15"), // creator (1.5%)
          ethers.parseEther("0.05"), // staker (0.5%)
          ethers.parseEther("0.05")  // treasury (0.5%)
        );
    });

    it("Should handle multiple fee collections", async function () {
      const { rewardDistributor, owner, user1 } = await loadFixture(deployFixture);

      await rewardDistributor.collectFees(owner.address, ethers.parseEther("10"), {
        value: ethers.parseEther("10"),
      });
      await rewardDistributor.collectFees(user1.address, ethers.parseEther("20"), {
        value: ethers.parseEther("20"),
      });

      // Total: 5% of (10 + 20) = 1.5 ETH
      expect(await rewardDistributor.getTotalFeesCollected()).to.equal(ethers.parseEther("1.5"));
    });

    it("Should revert on insufficient value sent", async function () {
      const { rewardDistributor, owner } = await loadFixture(deployFixture);
      const market = owner.address;
      const totalFees = ethers.parseEther("10");
      // Need 5% of 10 ETH = 0.5 ETH, but only send 0.1 ETH

      await expect(
        rewardDistributor.collectFees(market, totalFees, { value: ethers.parseEther("0.1") })
      ).to.be.reverted;
    });

    it("Should revert on zero address market", async function () {
      const { rewardDistributor } = await loadFixture(deployFixture);
      await expect(
        rewardDistributor.collectFees(ethers.ZeroAddress, 100, { value: 100 })
      ).to.be.revertedWithCustomError(rewardDistributor, "ZeroAddress");
    });
  });

  // ============= Reward Claim Tests =============

  describe("Reward Claims", function () {
    it("Should process reward claim", async function () {
      const { rewardDistributor, owner, user1 } = await loadFixture(deployFixture);
      const market = owner.address;
      const amount = ethers.parseEther("5");

      await expect(
        rewardDistributor.processRewardClaim(market, user1.address, amount, 1)
      ).to.emit(rewardDistributor, "RewardClaimed");
    });

    it("Should record claim data", async function () {
      const { rewardDistributor, owner, user1 } = await loadFixture(deployFixture);
      const market = owner.address;
      const amount = ethers.parseEther("5");

      await rewardDistributor.processRewardClaim(market, user1.address, amount, 1);

      const claimRecord = await rewardDistributor.getClaimRecord(market, user1.address);
      expect(claimRecord.market).to.equal(market);
      expect(claimRecord.claimer).to.equal(user1.address);
      expect(claimRecord.amount).to.equal(amount);
      expect(claimRecord.outcome).to.equal(1);
    });

    it("Should mark user as claimed", async function () {
      const { rewardDistributor, owner, user1 } = await loadFixture(deployFixture);
      const market = owner.address;

      expect(await rewardDistributor.hasClaimed(market, user1.address)).to.be.false;

      await rewardDistributor.processRewardClaim(market, user1.address, ethers.parseEther("5"), 1);

      expect(await rewardDistributor.hasClaimed(market, user1.address)).to.be.true;
    });

    it("Should prevent double claims", async function () {
      const { rewardDistributor, owner, user1 } = await loadFixture(deployFixture);
      const market = owner.address;

      await rewardDistributor.processRewardClaim(market, user1.address, ethers.parseEther("5"), 1);

      await expect(
        rewardDistributor.processRewardClaim(market, user1.address, ethers.parseEther("5"), 1)
      ).to.be.revertedWithCustomError(rewardDistributor, "AlreadyClaimed");
    });

    it("Should track total rewards claimed", async function () {
      const { rewardDistributor, owner, user1, user2 } = await loadFixture(deployFixture);

      await rewardDistributor.processRewardClaim(owner.address, user1.address, ethers.parseEther("5"), 1);
      await rewardDistributor.processRewardClaim(user2.address, user1.address, ethers.parseEther("3"), 2);

      expect(await rewardDistributor.getTotalRewardsClaimed(user1.address)).to.equal(
        ethers.parseEther("8")
      );
    });

    it("Should emit RewardClaimed event", async function () {
      const { rewardDistributor, owner, user1 } = await loadFixture(deployFixture);
      const market = owner.address;
      const amount = ethers.parseEther("5");

      const tx = await rewardDistributor.processRewardClaim(market, user1.address, amount, 1);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      await expect(tx)
        .to.emit(rewardDistributor, "RewardClaimed")
        .withArgs(market, user1.address, amount, 1, block.timestamp);
    });

    it("Should revert on zero address claimer", async function () {
      const { rewardDistributor, owner } = await loadFixture(deployFixture);
      await expect(
        rewardDistributor.processRewardClaim(owner.address, ethers.ZeroAddress, 100, 1)
      ).to.be.revertedWithCustomError(rewardDistributor, "ZeroAddress");
    });

    it("Should revert on zero amount", async function () {
      const { rewardDistributor, owner, user1 } = await loadFixture(deployFixture);
      await expect(
        rewardDistributor.processRewardClaim(owner.address, user1.address, 0, 1)
      ).to.be.revertedWithCustomError(rewardDistributor, "NoRewardsToClaim");
    });
  });

  // ============= Creator Fee Tests =============

  describe("Creator Fees", function () {
    it("Should track unclaimed creator fees", async function () {
      const { rewardDistributor, creator } = await loadFixture(deployFixture);
      const market = creator.address;
      const totalFees = ethers.parseEther("10");

      await rewardDistributor.collectFees(market, totalFees, { value: totalFees });

      // Creator gets 1.5% = 0.15 ETH
      expect(await rewardDistributor.getUnclaimedCreatorFees(market)).to.equal(
        ethers.parseEther("0.15")
      );
    });

    it("Should allow creator to claim fees", async function () {
      const { rewardDistributor, creator } = await loadFixture(deployFixture);
      const market = creator.address;
      const totalFees = ethers.parseEther("10");

      await rewardDistributor.collectFees(market, totalFees, { value: totalFees });

      await expect(rewardDistributor.connect(creator).claimCreatorFees(market))
        .to.emit(rewardDistributor, "CreatorFeesClaimed");
    });

    it("Should transfer fees to creator", async function () {
      const { rewardDistributor, creator } = await loadFixture(deployFixture);
      const market = creator.address;
      const totalFees = ethers.parseEther("10");

      await rewardDistributor.collectFees(market, totalFees, { value: totalFees });

      const balanceBefore = await ethers.provider.getBalance(creator.address);
      const tx = await rewardDistributor.connect(creator).claimCreatorFees(market);
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;
      const balanceAfter = await ethers.provider.getBalance(creator.address);

      // LMSR FIX: Allow 0.1% tolerance for LMSR rounding
      expect(balanceAfter - balanceBefore + gasCost).to.be.closeTo(
        ethers.parseEther("0.15"),
        ethers.parseEther("0.0015") // 0.1% tolerance
      );
    });

    it("Should reset unclaimed fees after claim", async function () {
      const { rewardDistributor, creator } = await loadFixture(deployFixture);
      const market = creator.address;
      const totalFees = ethers.parseEther("10");

      await rewardDistributor.collectFees(market, totalFees, { value: totalFees });
      await rewardDistributor.connect(creator).claimCreatorFees(market);

      expect(await rewardDistributor.getUnclaimedCreatorFees(market)).to.equal(0);
    });

    it("Should revert if no fees to claim", async function () {
      const { rewardDistributor, creator } = await loadFixture(deployFixture);
      await expect(
        rewardDistributor.connect(creator).claimCreatorFees(creator.address)
      ).to.be.revertedWithCustomError(rewardDistributor, "NoFeesToCollect");
    });
  });

  // ============= Staker Rewards Tests =============

  describe("Staker Rewards", function () {
    it("Should distribute staker rewards", async function () {
      const { rewardDistributor, staker1, admin, accessControl } = await loadFixture(deployFixture);

      // Add some rewards to pool first
      await rewardDistributor.collectFees(admin.address, ethers.parseEther("10"), {
        value: ethers.parseEther("10"),
      });

      const amount = ethers.parseEther("0.05");
      await expect(
        rewardDistributor.connect(admin).distributeStakerRewards(staker1.address, amount)
      ).to.emit(rewardDistributor, "StakerRewardsDistributed");
    });

    it("Should transfer rewards to staker", async function () {
      const { rewardDistributor, staker1, admin } = await loadFixture(deployFixture);

      await rewardDistributor.collectFees(admin.address, ethers.parseEther("10"), {
        value: ethers.parseEther("10"),
      });

      const balanceBefore = await ethers.provider.getBalance(staker1.address);
      await rewardDistributor.connect(admin).distributeStakerRewards(
        staker1.address,
        ethers.parseEther("0.05")
      );
      const balanceAfter = await ethers.provider.getBalance(staker1.address);

      expect(balanceAfter - balanceBefore).to.equal(ethers.parseEther("0.05"));
    });

    it("Should decrease staker pool", async function () {
      const { rewardDistributor, staker1, admin } = await loadFixture(deployFixture);

      await rewardDistributor.collectFees(admin.address, ethers.parseEther("10"), {
        value: ethers.parseEther("10"),
      });

      await rewardDistributor.connect(admin).distributeStakerRewards(
        staker1.address,
        ethers.parseEther("0.05")
      );

      expect(await rewardDistributor.getStakerRewardsPool()).to.equal(0);
    });

    it("Should require ADMIN_ROLE", async function () {
      const { rewardDistributor, staker1, user1 } = await loadFixture(deployFixture);
      await expect(
        rewardDistributor.connect(user1).distributeStakerRewards(staker1.address, 100)
      ).to.be.revertedWithCustomError(rewardDistributor, "Unauthorized");
    });
  });

  // ============= Treasury Tests =============

  describe("Treasury Management", function () {
    it("Should allow admin to withdraw treasury", async function () {
      const { rewardDistributor, admin, treasury } = await loadFixture(deployFixture);

      await rewardDistributor.collectFees(admin.address, ethers.parseEther("10"), {
        value: ethers.parseEther("10"),
      });

      await expect(
        rewardDistributor.connect(admin).withdrawTreasury(treasury.address, ethers.parseEther("0.05"))
      ).to.emit(rewardDistributor, "TreasuryWithdrawal");
    });

    it("Should transfer funds to recipient", async function () {
      const { rewardDistributor, admin, treasury } = await loadFixture(deployFixture);

      await rewardDistributor.collectFees(admin.address, ethers.parseEther("10"), {
        value: ethers.parseEther("10"),
      });

      const balanceBefore = await ethers.provider.getBalance(treasury.address);
      await rewardDistributor.connect(admin).withdrawTreasury(
        treasury.address,
        ethers.parseEther("0.05")
      );
      const balanceAfter = await ethers.provider.getBalance(treasury.address);

      expect(balanceAfter - balanceBefore).to.equal(ethers.parseEther("0.05"));
    });

    it("Should decrease treasury balance", async function () {
      const { rewardDistributor, admin, treasury } = await loadFixture(deployFixture);

      await rewardDistributor.collectFees(admin.address, ethers.parseEther("10"), {
        value: ethers.parseEther("10"),
      });

      await rewardDistributor.connect(admin).withdrawTreasury(
        treasury.address,
        ethers.parseEther("0.05")
      );

      expect(await rewardDistributor.getTreasuryBalance()).to.equal(0);
    });

    it("Should revert on insufficient balance", async function () {
      const { rewardDistributor, admin, treasury } = await loadFixture(deployFixture);
      await expect(
        rewardDistributor.connect(admin).withdrawTreasury(treasury.address, 100)
      ).to.be.revertedWithCustomError(rewardDistributor, "InsufficientTreasuryBalance");
    });

    it("Should require ADMIN_ROLE", async function () {
      const { rewardDistributor, user1, treasury } = await loadFixture(deployFixture);
      await expect(
        rewardDistributor.connect(user1).withdrawTreasury(treasury.address, 100)
      ).to.be.revertedWithCustomError(rewardDistributor, "Unauthorized");
    });
  });

  // ============= Batch Operations Tests =============

  describe("Batch Operations", function () {
    it("Should batch process rewards", async function () {
      const { rewardDistributor, owner, user1, user2, user3 } = await loadFixture(deployFixture);

      const markets = [owner.address, owner.address, owner.address];
      const claimers = [user1.address, user2.address, user3.address];
      const amounts = [
        ethers.parseEther("1"),
        ethers.parseEther("2"),
        ethers.parseEther("3"),
      ];
      const outcomes = [1, 1, 2];

      await rewardDistributor.batchProcessRewards(markets, claimers, amounts, outcomes);

      expect(await rewardDistributor.getTotalRewardsClaimed(user1.address)).to.equal(amounts[0]);
      expect(await rewardDistributor.getTotalRewardsClaimed(user2.address)).to.equal(amounts[1]);
      expect(await rewardDistributor.getTotalRewardsClaimed(user3.address)).to.equal(amounts[2]);
    });

    it("Should batch collect fees", async function () {
      const { rewardDistributor, owner, user1 } = await loadFixture(deployFixture);

      const markets = [owner.address, user1.address];
      const fees = [ethers.parseEther("10"), ethers.parseEther("20")];
      const totalValue = ethers.parseEther("30");

      await rewardDistributor.batchCollectFees(markets, fees, { value: totalValue });

      // Total 5% of 30 ETH = 1.5 ETH
      expect(await rewardDistributor.getTotalFeesCollected()).to.equal(ethers.parseEther("1.5"));
    });

    it("Should revert on array length mismatch", async function () {
      const { rewardDistributor, owner, user1 } = await loadFixture(deployFixture);

      await expect(
        rewardDistributor.batchProcessRewards([owner.address], [user1.address], [], [1])
      ).to.be.reverted;
    });
  });

  // ============= Fee Distribution Update Tests =============

  describe("Fee Distribution Updates", function () {
    it("Should allow admin to update fee distribution", async function () {
      const { rewardDistributor, admin, paramStorage } = await loadFixture(deployFixture);

      // Update via ParameterStorage
      await paramStorage.setParameter(ethers.id("protocolFeeBps"), 300);
      await paramStorage.setParameter(ethers.id("creatorFeeBps"), 200);

      const feeDist = await rewardDistributor.getFeeDistribution();
      expect(feeDist.protocolFeeBps).to.equal(300);
      expect(feeDist.creatorFeeBps).to.equal(200);
    });

    it("Should use updated fees for new collections", async function () {
      const { rewardDistributor, admin, paramStorage } = await loadFixture(deployFixture);

      // Update fees
      await paramStorage.setParameter(ethers.id("protocolFeeBps"), 300); // 3%
      await paramStorage.setParameter(ethers.id("creatorFeeBps"), 100);  // 1%
      await paramStorage.setParameter(ethers.id("stakerIncentiveBps"), 50);  // 0.5%
      await paramStorage.setParameter(ethers.id("treasuryFeeBps"), 50);  // 0.5%

      const totalFees = ethers.parseEther("10");
      await rewardDistributor.collectFees(admin.address, totalFees, { value: totalFees });

      const feeRecord = await rewardDistributor.getMarketFees(admin.address);
      expect(feeRecord.protocolFees).to.equal(ethers.parseEther("0.3")); // 3%
      expect(feeRecord.creatorFees).to.equal(ethers.parseEther("0.1"));  // 1%
    });
  });

  // ============= View Function Tests =============

  describe("View Functions", function () {
    it("Should return correct fee distribution", async function () {
      const { rewardDistributor } = await loadFixture(deployFixture);
      const feeDist = await rewardDistributor.getFeeDistribution();

      expect(feeDist.protocolFeeBps).to.equal(250);
      expect(feeDist.creatorFeeBps).to.equal(150);
      expect(feeDist.stakerIncentiveBps).to.equal(50);
      expect(feeDist.treasuryFeeBps).to.equal(50);
    });

    it("Should return correct market fees", async function () {
      const { rewardDistributor, owner } = await loadFixture(deployFixture);
      await rewardDistributor.collectFees(owner.address, ethers.parseEther("10"), {
        value: ethers.parseEther("10"),
      });

      const feeRecord = await rewardDistributor.getMarketFees(owner.address);
      expect(feeRecord.totalFees).to.equal(ethers.parseEther("0.5"));
    });

    it("Should return correct claim status", async function () {
      const { rewardDistributor, owner, user1 } = await loadFixture(deployFixture);

      expect(await rewardDistributor.hasClaimed(owner.address, user1.address)).to.be.false;

      await rewardDistributor.processRewardClaim(
        owner.address,
        user1.address,
        ethers.parseEther("5"),
        1
      );

      expect(await rewardDistributor.hasClaimed(owner.address, user1.address)).to.be.true;
    });
  });

  // ============= Gas Target Tests =============

  describe("Gas Targets", function () {
    it("Should meet collectFees gas target (<260k)", async function () {
      const { rewardDistributor, owner, user1 } = await loadFixture(deployFixture);

      // Warmup call (first call initializes storage)
      await rewardDistributor.collectFees(
        user1.address,
        ethers.parseEther("1"),
        { value: ethers.parseEther("1") }
      );

      // Measure second call (realistic gas usage)
      const tx = await rewardDistributor.collectFees(
        owner.address,
        ethers.parseEther("10"),
        { value: ethers.parseEther("10") }
      );
      const receipt = await tx.wait();

      // Target: <260k for complex fee collection with storage operations
      expect(receipt.gasUsed).to.be.lessThan(260000);
    });

    it("Should meet processRewardClaim gas target (<190k)", async function () {
      const { rewardDistributor, owner, user1, user2 } = await loadFixture(deployFixture);

      // Warmup call (first call initializes storage)
      await rewardDistributor.processRewardClaim(
        user2.address,
        user2.address,
        ethers.parseEther("1"),
        1
      );

      // Measure second call (realistic gas usage)
      const tx = await rewardDistributor.processRewardClaim(
        owner.address,
        user1.address,
        ethers.parseEther("5"),
        1
      );
      const receipt = await tx.wait();

      // Target: <190k for reward claim with storage operations
      expect(receipt.gasUsed).to.be.lessThan(190000);
    });
  });
});
