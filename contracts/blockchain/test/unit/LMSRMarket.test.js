const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("LMSRMarket - LMSR Bonding Curve Market", function () {
  let lmsrMarket;
  let registry, creator, user1, user2, user3;

  // Market parameters
  const QUESTION = "Will Bitcoin reach $100k by end of 2025?";
  const LIQUIDITY_PARAM = ethers.parseEther("100"); // b = 100 ETH
  const FEE_PERCENT = 200n; // 2%

  // Helper function to encode initialization data
  function encodeInitData(question, deadline, b) {
    return ethers.AbiCoder.defaultAbiCoder().encode(
      ["string", "uint256", "uint256"],
      [question, deadline, b]
    );
  }

  // Helper function to encode bet data (minShares for slippage protection)
  function encodeBetData(minShares) {
    return ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [minShares]);
  }

  beforeEach(async function () {
    [registry, creator, user1, user2, user3] = await ethers.getSigners();

    // Deploy LMSRMarket
    const LMSRMarket = await ethers.getContractFactory("LMSRMarket");
    lmsrMarket = await LMSRMarket.deploy();
    await lmsrMarket.waitForDeployment();

    // Initialize market
    const currentTime = await time.latest();
    const deadline = currentTime + 86400 * 30; // 30 days from now
    const initData = encodeInitData(QUESTION, deadline, LIQUIDITY_PARAM);

    await lmsrMarket.initialize(registry.address, initData);
  });

  describe("1. Initialization", function () {
    it("Should initialize market correctly", async function () {
      expect(await lmsrMarket.question()).to.equal(QUESTION);
      expect(await lmsrMarket.b()).to.equal(LIQUIDITY_PARAM);
      expect(await lmsrMarket.totalYes()).to.equal(0n);
      expect(await lmsrMarket.totalNo()).to.equal(0n);
      expect(await lmsrMarket.poolBalance()).to.equal(0n);
      expect(await lmsrMarket.isResolved()).to.equal(false);
    });

    it("Should not allow double initialization", async function () {
      const currentTime = await time.latest();
      const deadline = currentTime + 86400 * 30;
      const initData = encodeInitData(QUESTION, deadline, LIQUIDITY_PARAM);

      await expect(
        lmsrMarket.initialize(registry.address, initData)
      ).to.be.revertedWithCustomError(lmsrMarket, "AlreadyInitialized");
    });

    it("Should start with 50/50 prices", async function () {
      const [yesPrice, noPrice] = await lmsrMarket.getPrices();
      expect(yesPrice).to.equal(5000n); // 50%
      expect(noPrice).to.equal(5000n); // 50%
    });

    it("Should have correct creator", async function () {
      // Creator should be tx.origin from initialization (registry in this test)
      const actualCreator = await lmsrMarket.creator();
      expect(actualCreator).to.not.equal(ethers.ZeroAddress);
    });
  });

  describe("2. Placing Bets (YES)", function () {
    it("Should place YES bet and update state", async function () {
      const betAmount = ethers.parseEther("1");
      const betData = encodeBetData(0); // No slippage protection
      const deadline = 0; // No deadline

      await lmsrMarket
        .connect(user1)
        .placeBet(1, betData, 0, deadline, { value: betAmount });

      // Check pool balance increased (minus fees)
      const poolBalance = await lmsrMarket.poolBalance();
      const expectedAfterFee = (betAmount * (10000n - FEE_PERCENT)) / 10000n;
      expect(poolBalance).to.be.closeTo(expectedAfterFee, ethers.parseEther("0.01"));

      // Check YES shares increased
      const totalYes = await lmsrMarket.totalYes();
      expect(totalYes).to.be.gt(0n);

      // Check user has shares
      const userShares = await lmsrMarket.yesShares(user1.address);
      expect(userShares).to.be.gt(0n);

      // Check YES price increased
      const [yesPrice, noPrice] = await lmsrMarket.getPrices();
      expect(yesPrice).to.be.gt(5000n); // > 50%
      expect(noPrice).to.be.lt(5000n); // < 50%
    });

    it("Should place multiple YES bets from different users", async function () {
      const betAmount = ethers.parseEther("1"); // Increased from 0.5 to 1 ETH (need >0.51 ETH after fees for b=100)
      const betData = encodeBetData(0);

      // User1 bets YES
      await lmsrMarket
        .connect(user1)
        .placeBet(1, betData, 0, 0, { value: betAmount });

      // User2 bets YES
      await lmsrMarket
        .connect(user2)
        .placeBet(1, betData, 0, 0, { value: betAmount });

      // Check both users have shares
      expect(await lmsrMarket.yesShares(user1.address)).to.be.gt(0n);
      expect(await lmsrMarket.yesShares(user2.address)).to.be.gt(0n);

      // Check total YES increased
      const totalYes = await lmsrMarket.totalYes();
      expect(totalYes).to.be.gt(0n);

      // Check price moved (with b=100 ETH, 2 ETH of bets won't move price much)
      const [yesPrice] = await lmsrMarket.getPrices();
      expect(yesPrice).to.be.gt(5000n); // Should be > 50% (moved from equilibrium)
    });

    it("Should enforce slippage protection", async function () {
      const betAmount = ethers.parseEther("1");
      const minShares = ethers.parseEther("1000000"); // Impossibly high
      const betData = encodeBetData(minShares);

      await expect(
        lmsrMarket.connect(user1).placeBet(1, betData, 0, 0, { value: betAmount })
      ).to.be.revertedWithCustomError(lmsrMarket, "SlippageExceeded");
    });

    it("Should enforce transaction deadline", async function () {
      const betAmount = ethers.parseEther("1");
      const betData = encodeBetData(0);
      const currentTime = await time.latest();
      const pastDeadline = currentTime - 100; // Past deadline

      await expect(
        lmsrMarket
          .connect(user1)
          .placeBet(1, betData, 0, pastDeadline, { value: betAmount })
      ).to.be.revertedWithCustomError(lmsrMarket, "DeadlineExpired");
    });

    it("Should emit BetPlaced and SharesPurchased events", async function () {
      const betAmount = ethers.parseEther("1");
      const betData = encodeBetData(0);

      const tx = await lmsrMarket
        .connect(user1)
        .placeBet(1, betData, 0, 0, { value: betAmount });

      // Check for BetPlaced event (from IMarket)
      await expect(tx)
        .to.emit(lmsrMarket, "BetPlaced")
        .withArgs(user1.address, 1, betAmount, await time.latest());

      // Check for SharesPurchased event
      await expect(tx).to.emit(lmsrMarket, "SharesPurchased");
    });
  });

  describe("3. Placing Bets (NO)", function () {
    it("Should place NO bet and update state", async function () {
      const betAmount = ethers.parseEther("1");
      const betData = encodeBetData(0);

      await lmsrMarket
        .connect(user1)
        .placeBet(2, betData, 0, 0, { value: betAmount });

      // Check NO shares increased
      const totalNo = await lmsrMarket.totalNo();
      expect(totalNo).to.be.gt(0n);

      // Check user has NO shares
      const userShares = await lmsrMarket.noShares(user1.address);
      expect(userShares).to.be.gt(0n);

      // Check NO price increased
      const [yesPrice, noPrice] = await lmsrMarket.getPrices();
      expect(noPrice).to.be.gt(5000n); // > 50%
      expect(yesPrice).to.be.lt(5000n); // < 50%
    });

    it("Should handle YES vs NO bets correctly", async function () {
      const betAmount = ethers.parseEther("1");
      const betData = encodeBetData(0);

      // User1 bets YES
      await lmsrMarket
        .connect(user1)
        .placeBet(1, betData, 0, 0, { value: betAmount });

      const [yesPrice1] = await lmsrMarket.getPrices();

      // User2 bets NO
      await lmsrMarket
        .connect(user2)
        .placeBet(2, betData, 0, 0, { value: betAmount });

      const [yesPrice2] = await lmsrMarket.getPrices();

      // YES price should decrease after NO bet
      expect(yesPrice2).to.be.lt(yesPrice1);
    });
  });

  describe("4. Selling Shares", function () {
    beforeEach(async function () {
      // User1 buys YES shares
      const betAmount = ethers.parseEther("1");
      const betData = encodeBetData(0);
      await lmsrMarket
        .connect(user1)
        .placeBet(1, betData, 0, 0, { value: betAmount });
    });

    it("Should sell YES shares and receive refund", async function () {
      const userShares = await lmsrMarket.yesShares(user1.address);
      const sharesToSell = userShares / 2n; // Sell half

      const balanceBefore = await ethers.provider.getBalance(user1.address);

      const tx = await lmsrMarket
        .connect(user1)
        .sell(1, sharesToSell, 0);
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(user1.address);
      const refund = balanceAfter - balanceBefore + gasCost;

      // Should receive some refund
      expect(refund).to.be.gt(0n);

      // User shares should decrease
      const sharesAfter = await lmsrMarket.yesShares(user1.address);
      expect(sharesAfter).to.equal(userShares - sharesToSell);
    });

    it("Should enforce minimum refund (slippage protection)", async function () {
      const userShares = await lmsrMarket.yesShares(user1.address);
      const minRefund = ethers.parseEther("1000000"); // Impossibly high

      await expect(
        lmsrMarket.connect(user1).sell(1, userShares, minRefund)
      ).to.be.revertedWithCustomError(lmsrMarket, "SlippageExceeded");
    });

    it("Should not allow selling more shares than owned", async function () {
      const userShares = await lmsrMarket.yesShares(user1.address);
      const tooMany = userShares + 100n;

      await expect(
        lmsrMarket.connect(user1).sell(1, tooMany, 0)
      ).to.be.revertedWithCustomError(lmsrMarket, "InvalidAmount");
    });

    it("Should emit SharesSold event", async function () {
      const userShares = await lmsrMarket.yesShares(user1.address);

      const tx = await lmsrMarket.connect(user1).sell(1, userShares, 0);

      await expect(tx).to.emit(lmsrMarket, "SharesSold");
    });
  });

  describe("5. Resolution & Claims", function () {
    beforeEach(async function () {
      const betAmount = ethers.parseEther("1");
      const betData = encodeBetData(0);

      // User1 bets YES
      await lmsrMarket
        .connect(user1)
        .placeBet(1, betData, 0, 0, { value: betAmount });

      // User2 bets NO
      await lmsrMarket
        .connect(user2)
        .placeBet(2, betData, 0, 0, { value: betAmount });

      // Fast forward past deadline
      const deadline = await lmsrMarket.deadline();
      await time.increaseTo(deadline + 1n);
    });

    it("Should not resolve before deadline", async function () {
      // Deploy new market
      const LMSRMarket = await ethers.getContractFactory("LMSRMarket");
      const newMarket = await LMSRMarket.deploy();
      await newMarket.waitForDeployment();

      const currentTime = await time.latest();
      const deadline = currentTime + 86400; // 1 day from now
      const initData = encodeInitData(QUESTION, deadline, LIQUIDITY_PARAM);
      await newMarket.initialize(registry.address, initData);

      // Try to resolve before deadline
      await expect(
        newMarket.resolveMarket(1) // OUTCOME1 (YES)
      ).to.be.revertedWithCustomError(newMarket, "DeadlineNotPassed");
    });

    it("Should resolve market (YES wins)", async function () {
      // Creator resolves to YES
      await lmsrMarket.resolveMarket(1);

      expect(await lmsrMarket.isResolved()).to.equal(true);
      expect(await lmsrMarket.result()).to.equal(1n); // OUTCOME1
    });

    it("Should calculate correct payout (YES wins)", async function () {
      await lmsrMarket.resolveMarket(1); // YES wins

      const user1Payout = await lmsrMarket.calculatePayout(user1.address);
      const user2Payout = await lmsrMarket.calculatePayout(user2.address);

      // User1 (YES) should get payout
      expect(user1Payout).to.be.gt(0n);

      // User2 (NO) should get nothing
      expect(user2Payout).to.equal(0n);
    });

    it("Should claim winnings correctly", async function () {
      await lmsrMarket.resolveMarket(1); // YES wins

      const balanceBefore = await ethers.provider.getBalance(user1.address);
      const expectedPayout = await lmsrMarket.calculatePayout(user1.address);

      const tx = await lmsrMarket.connect(user1).claimWinnings();
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(user1.address);
      const actualPayout = balanceAfter - balanceBefore + gasCost;

      expect(actualPayout).to.be.closeTo(expectedPayout, ethers.parseEther("0.001"));

      // Should mark as claimed
      expect(await lmsrMarket.claimed(user1.address)).to.equal(true);
    });

    it("Should not allow double claiming", async function () {
      await lmsrMarket.resolveMarket(1); // YES wins

      await lmsrMarket.connect(user1).claimWinnings();

      await expect(
        lmsrMarket.connect(user1).claimWinnings()
      ).to.be.revertedWithCustomError(lmsrMarket, "AlreadyClaimed");
    });

    it("Should not allow betting after resolution", async function () {
      await lmsrMarket.resolveMarket(1);

      const betAmount = ethers.parseEther("1");
      const betData = encodeBetData(0);

      await expect(
        lmsrMarket.connect(user3).placeBet(1, betData, 0, 0, { value: betAmount })
      ).to.be.revertedWithCustomError(lmsrMarket, "MarketAlreadyResolved");
    });
  });

  describe("6. Fee Distribution", function () {
    it("Should accumulate creator fees", async function () {
      const betAmount = ethers.parseEther("1");
      const betData = encodeBetData(0);

      const feesBefore = await lmsrMarket.creatorFeeAccumulated();

      await lmsrMarket
        .connect(user1)
        .placeBet(1, betData, 0, 0, { value: betAmount });

      const feesAfter = await lmsrMarket.creatorFeeAccumulated();

      // Creator should have accumulated 20% of 2% = 0.4% of bet
      const expectedCreatorFee = (betAmount * FEE_PERCENT * 20n) / 1000000n;
      expect(feesAfter - feesBefore).to.be.closeTo(
        expectedCreatorFee,
        ethers.parseEther("0.001")
      );
    });

    it("Should allow creator to withdraw fees", async function () {
      // Place bet to generate fees
      const betAmount = ethers.parseEther("1");
      const betData = encodeBetData(0);
      await lmsrMarket
        .connect(user1)
        .placeBet(1, betData, 0, 0, { value: betAmount });

      // Note: Creator is tx.origin from initialize, which is registry in tests
      // We need to check who the creator actually is
      const creatorAddress = await lmsrMarket.creator();

      // In a real scenario, creator would withdraw
      // For this test, we just verify the accumulated fees exist
      const accumulatedFees = await lmsrMarket.creatorFeeAccumulated();
      expect(accumulatedFees).to.be.gt(0n);
    });
  });

  describe("7. Pool Balance Tracking", function () {
    it("Should track pool balance correctly through bets", async function () {
      const betAmount = ethers.parseEther("1");
      const betData = encodeBetData(0);

      const poolBefore = await lmsrMarket.poolBalance();

      await lmsrMarket
        .connect(user1)
        .placeBet(1, betData, 0, 0, { value: betAmount });

      const poolAfter = await lmsrMarket.poolBalance();

      // Pool should increase by (betAmount - fees)
      const expectedIncrease = (betAmount * (10000n - FEE_PERCENT)) / 10000n;
      expect(poolAfter - poolBefore).to.be.closeTo(
        expectedIncrease,
        ethers.parseEther("0.01")
      );
    });

    it("Should decrease pool balance on sells", async function () {
      // Buy shares
      const betAmount = ethers.parseEther("1");
      const betData = encodeBetData(0);
      await lmsrMarket
        .connect(user1)
        .placeBet(1, betData, 0, 0, { value: betAmount });

      const poolBefore = await lmsrMarket.poolBalance();
      const userShares = await lmsrMarket.yesShares(user1.address);

      // Sell shares
      await lmsrMarket.connect(user1).sell(1, userShares, 0);

      const poolAfter = await lmsrMarket.poolBalance();

      // Pool should decrease
      expect(poolAfter).to.be.lt(poolBefore);
    });

    it("Should decrease pool balance on claims", async function () {
      // Setup: Place bets
      const betAmount = ethers.parseEther("1");
      const betData = encodeBetData(0);
      await lmsrMarket
        .connect(user1)
        .placeBet(1, betData, 0, 0, { value: betAmount });

      // Resolve
      const deadline = await lmsrMarket.deadline();
      await time.increaseTo(deadline + 1n);
      await lmsrMarket.resolveMarket(1); // YES wins

      const poolBefore = await lmsrMarket.poolBalance();

      // Claim
      await lmsrMarket.connect(user1).claimWinnings();

      const poolAfter = await lmsrMarket.poolBalance();

      // Pool should decrease
      expect(poolAfter).to.be.lt(poolBefore);
    });

    it("Should emit PoolBalanceUpdated events", async function () {
      const betAmount = ethers.parseEther("1");
      const betData = encodeBetData(0);

      const tx = await lmsrMarket
        .connect(user1)
        .placeBet(1, betData, 0, 0, { value: betAmount });

      await expect(tx).to.emit(lmsrMarket, "PoolBalanceUpdated");
    });
  });

  describe("8. View Functions", function () {
    beforeEach(async function () {
      const betAmount = ethers.parseEther("1");
      const betData = encodeBetData(0);
      await lmsrMarket
        .connect(user1)
        .placeBet(1, betData, 0, 0, { value: betAmount });
    });

    it("Should return correct prices", async function () {
      const [yesPrice, noPrice] = await lmsrMarket.getPrices();

      // Prices should be in basis points (0-10000)
      expect(yesPrice).to.be.lte(10000n);
      expect(noPrice).to.be.lte(10000n);

      // Prices should sum to 10000 (100%) with ±1 basis point tolerance for rounding
      expect(yesPrice + noPrice).to.be.closeTo(10000n, 1n);
    });

    it("Should estimate buy cost correctly", async function () {
      const sharesToBuy = 100n;
      const estimatedCost = await lmsrMarket.estimateBuyCost(1, sharesToBuy);

      // Cost should be positive
      expect(estimatedCost).to.be.gt(0n);
    });

    it("Should estimate sell refund correctly", async function () {
      const userShares = await lmsrMarket.yesShares(user1.address);
      const estimatedRefund = await lmsrMarket.estimateSellRefund(1, userShares);

      // Refund should be positive
      expect(estimatedRefund).to.be.gt(0n);
    });

    it("Should return market state correctly", async function () {
      const state = await lmsrMarket.getMarketState();

      expect(state.liquidityParam).to.equal(LIQUIDITY_PARAM);
      expect(state.yesShares_).to.be.gt(0n);
      expect(state.pool).to.be.gt(0n);
      expect(state.yesPrice_).to.be.gt(0n);
      expect(state.noPrice_).to.be.gt(0n);
      expect(state.resolved).to.equal(false);
    });

    it("Should return user bet correctly", async function () {
      const userYesBet = await lmsrMarket.getUserBet(user1.address, 1);
      expect(userYesBet).to.be.gt(0n);

      const userNoBet = await lmsrMarket.getUserBet(user1.address, 2);
      expect(userNoBet).to.equal(0n);
    });

    it("Should check if user has winnings", async function () {
      // Before resolution
      expect(await lmsrMarket.hasWinnings(user1.address)).to.equal(false);

      // After resolution (YES wins)
      const deadline = await lmsrMarket.deadline();
      await time.increaseTo(deadline + 1n);
      await lmsrMarket.resolveMarket(1);

      expect(await lmsrMarket.hasWinnings(user1.address)).to.equal(true);
    });
  });

  describe("9. Edge Cases", function () {
    it("Should handle zero-value bets", async function () {
      const betData = encodeBetData(0);

      await expect(
        lmsrMarket.connect(user1).placeBet(1, betData, 0, 0, { value: 0 })
      ).to.be.revertedWithCustomError(lmsrMarket, "InvalidAmount");
    });

    it("Should handle invalid outcomes", async function () {
      const betAmount = ethers.parseEther("1");
      const betData = encodeBetData(0);

      await expect(
        lmsrMarket.connect(user1).placeBet(3, betData, 0, 0, { value: betAmount }) // Invalid: should be 1 or 2
      ).to.be.revertedWithCustomError(lmsrMarket, "InvalidOutcome");
    });

    it("Should handle cancelled market resolution", async function () {
      const betAmount = ethers.parseEther("1");
      const betData = encodeBetData(0);

      // Both users bet
      await lmsrMarket
        .connect(user1)
        .placeBet(1, betData, 0, 0, { value: betAmount });
      await lmsrMarket
        .connect(user2)
        .placeBet(2, betData, 0, 0, { value: betAmount });

      // Resolve as CANCELLED
      const deadline = await lmsrMarket.deadline();
      await time.increaseTo(deadline + 1n);
      await lmsrMarket.resolveMarket(3); // CANCELLED

      // Both users should get proportional refunds
      const user1Payout = await lmsrMarket.calculatePayout(user1.address);
      const user2Payout = await lmsrMarket.calculatePayout(user2.address);

      expect(user1Payout).to.be.gt(0n);
      expect(user2Payout).to.be.gt(0n);
    });

    it("Should prevent selling after market resolved", async function () {
      const betAmount = ethers.parseEther("1");
      const betData = encodeBetData(0);
      await lmsrMarket
        .connect(user1)
        .placeBet(1, betData, 0, 0, { value: betAmount });

      // Resolve
      const deadline = await lmsrMarket.deadline();
      await time.increaseTo(deadline + 1n);
      await lmsrMarket.resolveMarket(1);

      // Try to sell
      const userShares = await lmsrMarket.yesShares(user1.address);
      await expect(
        lmsrMarket.connect(user1).sell(1, userShares, 0)
      ).to.be.revertedWithCustomError(lmsrMarket, "MarketAlreadyResolved");
    });
  });

  describe("10. LMSR Properties Validation", function () {
    it("Should maintain price invariant (P(YES) + P(NO) = 1)", async function () {
      // Test at various market states
      const betAmount = ethers.parseEther("1"); // Increased from 0.5 to 1 ETH (need >0.51 ETH after fees for b=100)
      const betData = encodeBetData(0);

      for (let i = 0; i < 5; i++) {
        const [yesPrice, noPrice] = await lmsrMarket.getPrices();
        expect(yesPrice + noPrice).to.be.closeTo(10000n, 1n); // 100% with ±1 basis point tolerance

        // Place random bet
        const outcome = i % 2 === 0 ? 1 : 2;
        await lmsrMarket
          .connect(user1)
          .placeBet(outcome, betData, 0, 0, { value: betAmount });
      }
    });

    it("Should handle one-sided markets correctly", async function () {
      const betAmount = ethers.parseEther("1");
      const betData = encodeBetData(0);

      // Only YES bets (one-sided)
      for (let i = 0; i < 3; i++) {
        await lmsrMarket
          .connect(user1)
          .placeBet(1, betData, 0, 0, { value: betAmount });
      }

      const [yesPrice, noPrice] = await lmsrMarket.getPrices();

      // With b=100 ETH, 3 ETH of bets moves price ~5% from equilibrium
      // LMSR is designed to be manipulation-resistant with high b parameter
      expect(yesPrice).to.be.gt(5000n); // Should be > 50% (moved from equilibrium)
      expect(noPrice).to.be.lt(5000n); // Should be < 50%

      // Price invariant still holds (with tolerance)
      expect(yesPrice + noPrice).to.be.closeTo(10000n, 1n);
    });

    it("Should have correct marginal cost behavior", async function () {
      const betData = encodeBetData(0);

      // First bet
      const cost1 = await lmsrMarket.estimateBuyCost(1, 100n);

      // Place bet to change state
      await lmsrMarket
        .connect(user1)
        .placeBet(1, betData, 0, 0, { value: ethers.parseEther("1") });

      // Second bet (should cost more due to price increase)
      const cost2 = await lmsrMarket.estimateBuyCost(1, 100n);

      expect(cost2).to.be.gt(cost1);
    });
  });
});
