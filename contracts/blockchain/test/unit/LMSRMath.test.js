const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LMSRMath Library - LMSR Bonding Curve", function () {
  let mathTester;

  // Constants from LMSRMath
  const PRICE_PRECISION = 10000n; // 100% = 10000 basis points
  const MIN_B = ethers.parseEther("0.001");
  const MAX_B = ethers.parseEther("1000000");

  before(async function () {
    // Deploy test helper contract that uses the library
    // LMSRMath functions are internal so they get inlined (no separate deployment needed)
    const MathTester = await ethers.getContractFactory("LMSRMathTester");
    mathTester = await MathTester.deploy();
    await mathTester.waitForDeployment();
  });

  describe("1. Cost Function C(q_yes, q_no)", function () {
    const b = ethers.parseEther("10"); // 10 ETH liquidity parameter

    it("Should calculate cost for equal shares", async function () {
      const qYes = 100n;
      const qNo = 100n;
      const costValue = await mathTester.cost(b, qYes, qNo);
      expect(costValue).to.be.gt(0);
    });

    it("Should calculate cost for zero shares", async function () {
      const qYes = 0n;
      const qNo = 0n;
      const costValue = await mathTester.cost(b, qYes, qNo);
      expect(costValue).to.be.gte(0);
    });

    it("Should increase cost when YES shares increase", async function () {
      const qYes1 = 100n;
      const qYes2 = 200n;
      const qNo = 100n;

      const cost1 = await mathTester.cost(b, qYes1, qNo);
      const cost2 = await mathTester.cost(b, qYes2, qNo);

      expect(cost2).to.be.gt(cost1);
    });

    it("Should increase cost when NO shares increase", async function () {
      const qYes = 100n;
      const qNo1 = 100n;
      const qNo2 = 200n;

      const cost1 = await mathTester.cost(b, qYes, qNo1);
      const cost2 = await mathTester.cost(b, qYes, qNo2);

      expect(cost2).to.be.gt(cost1);
    });

    it("Should be symmetric (same cost for swapped YES/NO)", async function () {
      const q1 = 300n;
      const q2 = 500n;

      const cost1 = await mathTester.cost(b, q1, q2);
      const cost2 = await mathTester.cost(b, q2, q1);

      // Should be very close (allowing for small rounding differences)
      const diff = cost1 > cost2 ? cost1 - cost2 : cost2 - cost1;
      expect(diff).to.be.lt(ethers.parseEther("0.001")); // Within 0.001 ETH
    });

    it("Should handle one-sided market (only YES)", async function () {
      const qYes = 1000n;
      const qNo = 0n;

      const costValue = await mathTester.cost(b, qYes, qNo);
      expect(costValue).to.be.gt(0);
    });

    it("Should handle one-sided market (only NO)", async function () {
      const qYes = 0n;
      const qNo = 1000n;

      const costValue = await mathTester.cost(b, qYes, qNo);
      expect(costValue).to.be.gt(0);
    });

    it("Should revert for invalid b parameter (too low)", async function () {
      const invalidB = ethers.parseEther("0.0001"); // Below MIN_B
      await expect(
        mathTester.cost(invalidB, 100n, 100n)
      ).to.be.revertedWithCustomError(mathTester, "InvalidLiquidityParameter");
    });

    it("Should revert for invalid b parameter (too high)", async function () {
      const invalidB = ethers.parseEther("2000000"); // Above MAX_B
      await expect(
        mathTester.cost(invalidB, 100n, 100n)
      ).to.be.revertedWithCustomError(mathTester, "InvalidLiquidityParameter");
    });
  });

  describe("2. Price Functions P(YES) and P(NO)", function () {
    const b = ethers.parseEther("100"); // Increased b to keep q/b ratios reasonable

    it("Should calculate 50/50 prices for equal shares", async function () {
      const qYes = 1000n;
      const qNo = 1000n;

      const yesPrice = await mathTester.priceYes(b, qYes, qNo);
      const noPrice = await mathTester.priceNo(b, qYes, qNo);

      // Should be approximately 5000 (50%)
      expect(yesPrice).to.be.closeTo(5000n, 50n);
      expect(noPrice).to.be.closeTo(5000n, 50n);
    });

    it("Should calculate higher YES price when more YES shares", async function () {
      const qYes = 2000n;
      const qNo = 1000n;

      const yesPrice = await mathTester.priceYes(b, qYes, qNo);
      const noPrice = await mathTester.priceNo(b, qYes, qNo);

      expect(yesPrice).to.be.gt(5000n); // > 50%
      expect(noPrice).to.be.lt(5000n); // < 50%
    });

    it("Should calculate higher NO price when more NO shares", async function () {
      const qYes = 1000n;
      const qNo = 2000n;

      const yesPrice = await mathTester.priceYes(b, qYes, qNo);
      const noPrice = await mathTester.priceNo(b, qYes, qNo);

      expect(yesPrice).to.be.lt(5000n); // < 50%
      expect(noPrice).to.be.gt(5000n); // > 50%
    });

    it("CRITICAL: Prices should always sum to PRICE_PRECISION (10000)", async function () {
      const qYes = 1500n;
      const qNo = 800n;

      const yesPrice = await mathTester.priceYes(b, qYes, qNo);
      const noPrice = await mathTester.priceNo(b, qYes, qNo);

      const sum = yesPrice + noPrice;

      // Should sum to exactly 10000 (or very close due to rounding)
      expect(sum).to.be.closeTo(PRICE_PRECISION, 10n);
    });

    it("Should handle one-sided market (only YES) - price near 100%", async function () {
      const qYes = 5000n;
      const qNo = 0n;

      const yesPrice = await mathTester.priceYes(b, qYes, qNo);
      const noPrice = await mathTester.priceNo(b, qYes, qNo);

      expect(yesPrice).to.be.gt(9900n); // > 99%
      expect(noPrice).to.be.lt(100n);   // < 1%
    });

    it("Should handle one-sided market (only NO) - price near 100%", async function () {
      const qYes = 0n;
      const qNo = 5000n;

      const yesPrice = await mathTester.priceYes(b, qYes, qNo);
      const noPrice = await mathTester.priceNo(b, qYes, qNo);

      expect(yesPrice).to.be.lt(100n);   // < 1%
      expect(noPrice).to.be.gt(9900n); // > 99%
    });

    it("Should handle zero shares (undefined market state)", async function () {
      const qYes = 0n;
      const qNo = 0n;

      const yesPrice = await mathTester.priceYes(b, qYes, qNo);
      const noPrice = await mathTester.priceNo(b, qYes, qNo);

      // Should be 50/50 when no shares exist
      expect(yesPrice).to.be.closeTo(5000n, 50n);
      expect(noPrice).to.be.closeTo(5000n, 50n);
    });

    it("Should be bounded [0, PRICE_PRECISION] for all inputs", async function () {
      const testCases = [
        [0n, 0n],
        [0n, 1000n],
        [1000n, 0n],
        [100n, 100n],
        [5000n, 1000n],
        [1000n, 5000n],
      ];

      for (const [qYes, qNo] of testCases) {
        const yesPrice = await mathTester.priceYes(b, qYes, qNo);
        const noPrice = await mathTester.priceNo(b, qYes, qNo);

        expect(yesPrice).to.be.gte(0);
        expect(yesPrice).to.be.lte(PRICE_PRECISION);
        expect(noPrice).to.be.gte(0);
        expect(noPrice).to.be.lte(PRICE_PRECISION);
      }
    });
  });

  describe("3. getPrices() - Gas Optimized", function () {
    const b = ethers.parseEther("100");

    it("Should return same prices as individual functions", async function () {
      const qYes = 1500n;
      const qNo = 800n;

      const yesPrice = await mathTester.priceYes(b, qYes, qNo);
      const noPrice = await mathTester.priceNo(b, qYes, qNo);

      const [yesPriceBatch, noPriceBatch] = await mathTester.getPrices(b, qYes, qNo);

      expect(yesPriceBatch).to.equal(yesPrice);
      expect(noPriceBatch).to.equal(noPrice);
    });

    it("CRITICAL: Combined prices should sum to PRICE_PRECISION", async function () {
      const qYes = 2500n;
      const qNo = 1200n;

      const [yesPrice, noPrice] = await mathTester.getPrices(b, qYes, qNo);
      const sum = yesPrice + noPrice;

      expect(sum).to.be.closeTo(PRICE_PRECISION, 10n);
    });

    it("Should handle various market states", async function () {
      const testCases = [
        [0n, 0n],
        [100n, 100n],
        [1000n, 0n],
        [0n, 1000n],
        [3000n, 1500n],
      ];

      for (const [qYes, qNo] of testCases) {
        const [yesPrice, noPrice] = await mathTester.getPrices(b, qYes, qNo);
        const sum = yesPrice + noPrice;

        expect(sum).to.be.closeTo(PRICE_PRECISION, 10n);
      }
    });
  });

  describe("4. calculateBuyCost() - Purchase Cost", function () {
    const b = ethers.parseEther("100");

    it("Should calculate cost to buy YES shares", async function () {
      const qYes = 1000n;
      const qNo = 1000n;
      const shares = 100n;

      const buyCost = await mathTester.calculateBuyCost(b, qYes, qNo, true, shares);
      expect(buyCost).to.be.gt(0);
    });

    it("Should calculate cost to buy NO shares", async function () {
      const qYes = 1000n;
      const qNo = 1000n;
      const shares = 100n;

      const buyCost = await mathTester.calculateBuyCost(b, qYes, qNo, false, shares);
      expect(buyCost).to.be.gt(0);
    });

    it("Should cost more to buy as supply increases (diminishing returns)", async function () {
      const qYes = 1000n;
      const qNo = 1000n;
      const shares = 100n;

      const cost1 = await mathTester.calculateBuyCost(b, qYes, qNo, true, shares);
      const cost2 = await mathTester.calculateBuyCost(b, qYes + shares, qNo, true, shares);

      expect(cost2).to.be.gt(cost1);
    });

    it("Should cost less to buy underdog shares", async function () {
      const qYes = 2000n; // YES is winning
      const qNo = 1000n;
      const shares = 100n;

      const costYes = await mathTester.calculateBuyCost(b, qYes, qNo, true, shares);
      const costNo = await mathTester.calculateBuyCost(b, qYes, qNo, false, shares);

      expect(costNo).to.be.lt(costYes); // Buying underdog (NO) should be cheaper
    });

    it("Should work in one-sided market (only YES exists)", async function () {
      const qYes = 5000n;
      const qNo = 0n;
      const shares = 100n;

      const buyCost = await mathTester.calculateBuyCost(b, qYes, qNo, false, shares);
      expect(buyCost).to.be.gt(0); // Should still be able to buy NO
    });

    it("Should work in one-sided market (only NO exists)", async function () {
      const qYes = 0n;
      const qNo = 5000n;
      const shares = 100n;

      const buyCost = await mathTester.calculateBuyCost(b, qYes, qNo, true, shares);
      expect(buyCost).to.be.gt(0); // Should still be able to buy YES
    });

    it("Should revert for zero shares", async function () {
      await expect(
        mathTester.calculateBuyCost(b, 1000n, 1000n, true, 0n)
      ).to.be.revertedWithCustomError(mathTester, "InvalidShareAmount");
    });
  });

  describe("5. calculateSellRefund() - Sale Refund", function () {
    const b = ethers.parseEther("100");

    it("Should calculate refund for selling YES shares", async function () {
      const qYes = 1000n;
      const qNo = 1000n;
      const shares = 100n;

      const refund = await mathTester.calculateSellRefund(b, qYes, qNo, true, shares);
      expect(refund).to.be.gt(0);
    });

    it("Should calculate refund for selling NO shares", async function () {
      const qYes = 1000n;
      const qNo = 1000n;
      const shares = 100n;

      const refund = await mathTester.calculateSellRefund(b, qYes, qNo, false, shares);
      expect(refund).to.be.gt(0);
    });

    it("Should refund less as supply decreases (price impact)", async function () {
      const qYes = 2000n;
      const qNo = 1000n;
      const shares = 100n;

      const refund1 = await mathTester.calculateSellRefund(b, qYes, qNo, true, shares);
      const refund2 = await mathTester.calculateSellRefund(b, qYes - shares, qNo, true, shares);

      expect(refund2).to.be.lt(refund1);
    });

    it("Buy cost and sell refund should be similar (minus spread)", async function () {
      const qYes = 1000n;
      const qNo = 1000n;
      const shares = 100n;

      const buyCost = await mathTester.calculateBuyCost(b, qYes, qNo, true, shares);
      const sellRefund = await mathTester.calculateSellRefund(b, qYes + shares, qNo, true, shares);

      // Refund should be slightly less than cost (price moved)
      expect(sellRefund).to.be.closeTo(buyCost, ethers.parseEther("0.1"));
    });

    it("Should revert when trying to sell more shares than exist", async function () {
      const qYes = 100n;
      const qNo = 100n;
      const shares = 200n; // More than available

      await expect(
        mathTester.calculateSellRefund(b, qYes, qNo, true, shares)
      ).to.be.revertedWithCustomError(mathTester, "InvalidShareAmount");
    });

    it("Should revert for zero shares", async function () {
      await expect(
        mathTester.calculateSellRefund(b, 1000n, 1000n, true, 0n)
      ).to.be.revertedWithCustomError(mathTester, "InvalidShareAmount");
    });
  });

  describe("6. Edge Cases & Stress Tests", function () {
    const b = ethers.parseEther("1000"); // Very large b for stress testing

    it("Should handle very large share amounts", async function () {
      const qYes = 1000000n;
      const qNo = 1000000n;

      const yesPrice = await mathTester.priceYes(b, qYes, qNo);
      const noPrice = await mathTester.priceNo(b, qYes, qNo);

      expect(yesPrice).to.be.closeTo(5000n, 50n);
      expect(noPrice).to.be.closeTo(5000n, 50n);
    });

    it("Should handle very small b parameter (high price sensitivity)", async function () {
      const smallB = ethers.parseEther("0.01"); // Just above MIN_B
      const qYes = 100n;
      const qNo = 100n;

      const [yesPrice, noPrice] = await mathTester.getPrices(smallB, qYes, qNo);
      expect(yesPrice + noPrice).to.be.closeTo(PRICE_PRECISION, 10n);
    });

    it("Should handle very large b parameter (low price sensitivity)", async function () {
      const largeB = ethers.parseEther("100000"); // High but within limits
      const qYes = 100n;
      const qNo = 100n;

      const [yesPrice, noPrice] = await mathTester.getPrices(largeB, qYes, qNo);
      expect(yesPrice + noPrice).to.be.closeTo(PRICE_PRECISION, 10n);
    });

    it("Should maintain price invariant across different b values", async function () {
      const bValues = [
        ethers.parseEther("1"),
        ethers.parseEther("10"),
        ethers.parseEther("100"),
        ethers.parseEther("1000"),
      ];

      const qYes = 1000n;
      const qNo = 1500n;

      for (const bValue of bValues) {
        const [yesPrice, noPrice] = await mathTester.getPrices(bValue, qYes, qNo);
        const sum = yesPrice + noPrice;
        expect(sum).to.be.closeTo(PRICE_PRECISION, 10n);
      }
    });
  });

  describe("7. Price Invariant Validation (CRITICAL)", function () {
    it("MUST maintain P(YES) + P(NO) = 1 for random states", async function () {
      const b = ethers.parseEther("100");

      // Generate random market states
      const randomStates = [
        [0n, 0n],
        [1n, 1n],
        [0n, 100n],
        [100n, 0n],
        [123n, 456n],
        [789n, 234n],
        [1000n, 1000n],
        [5000n, 2000n],
        [2000n, 5000n],
        [10000n, 10000n],
      ];

      for (const [qYes, qNo] of randomStates) {
        const [yesPrice, noPrice] = await mathTester.getPrices(b, qYes, qNo);
        const sum = yesPrice + noPrice;

        // CRITICAL: Must sum to PRICE_PRECISION
        expect(sum).to.be.closeTo(PRICE_PRECISION, 10n,
          `Failed for qYes=${qYes}, qNo=${qNo}: sum=${sum}`
        );
      }
    });
  });

  describe("8. Cost Consistency", function () {
    const b = ethers.parseEther("100");

    it("Multiple small buys should equal one large buy (approximately)", async function () {
      const qYes = 1000n;
      const qNo = 1000n;
      const shares = 100n;

      // Buy 100 shares in 4 steps of 25
      let totalCostSmall = 0n;
      let currentYes = qYes;

      for (let i = 0; i < 4; i++) {
        const cost = await mathTester.calculateBuyCost(b, currentYes, qNo, true, 25n);
        totalCostSmall += cost;
        currentYes += 25n;
      }

      // Buy 100 shares at once
      const costLarge = await mathTester.calculateBuyCost(b, qYes, qNo, true, shares);

      // Should be very close (small difference due to path dependency)
      expect(totalCostSmall).to.be.closeTo(costLarge, ethers.parseEther("0.01"));
    });
  });
});
