const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("ExponentialCurve", function () {
  // Fixture for deploying ExponentialCurve
  async function deployExponentialCurveFixture() {
    const ExponentialCurve = await ethers.getContractFactory("ExponentialCurve");
    const exponentialCurve = await ExponentialCurve.deploy();
    await exponentialCurve.waitForDeployment();

    // Common test parameters
    const basePrice = ethers.parseEther("0.001"); // 0.001 ETH per share
    const lowGrowthRate = 1000n; // 10% growth per period
    const mediumGrowthRate = 5000n; // 50% growth per period
    const highGrowthRate = 10000n; // 100% growth per period
    const scale = ethers.parseEther("10"); // 10 shares per period

    // Encode params for testing
    const lowGrowthParams = await exponentialCurve.encodeParams(basePrice, lowGrowthRate, scale);
    const mediumGrowthParams = await exponentialCurve.encodeParams(basePrice, mediumGrowthRate, scale);
    const highGrowthParams = await exponentialCurve.encodeParams(basePrice, highGrowthRate, scale);

    return {
      exponentialCurve,
      basePrice,
      lowGrowthRate,
      mediumGrowthRate,
      highGrowthRate,
      scale,
      lowGrowthParams,
      mediumGrowthParams,
      highGrowthParams,
    };
  }

  describe("Metadata", function () {
    it("Should return correct curve name", async function () {
      const { exponentialCurve } = await loadFixture(deployExponentialCurveFixture);

      expect(await exponentialCurve.curveName()).to.equal("Exponential");
    });

    it("Should validate correct parameters", async function () {
      const { exponentialCurve, lowGrowthParams } = await loadFixture(deployExponentialCurveFixture);

      const [valid, reason] = await exponentialCurve.validateParams(lowGrowthParams);
      expect(valid).to.be.true;
      expect(reason).to.equal("");
    });

    it("Should reject zero base price", async function () {
      const { exponentialCurve, lowGrowthRate, scale } = await loadFixture(
        deployExponentialCurveFixture
      );

      const invalidParams = await exponentialCurve.encodeParams(0, lowGrowthRate, scale);
      const [valid, reason] = await exponentialCurve.validateParams(invalidParams);

      expect(valid).to.be.false;
      expect(reason).to.equal("Base price must be > 0");
    });

    it("Should reject zero growth rate", async function () {
      const { exponentialCurve, basePrice, scale } = await loadFixture(
        deployExponentialCurveFixture
      );

      const invalidParams = await exponentialCurve.encodeParams(basePrice, 0, scale);
      const [valid, reason] = await exponentialCurve.validateParams(invalidParams);

      expect(valid).to.be.false;
      expect(reason).to.equal("Growth rate must be > 0 (use LinearCurve for constant price)");
    });

    it("Should reject growth rate too high", async function () {
      const { exponentialCurve, basePrice, scale } = await loadFixture(
        deployExponentialCurveFixture
      );

      await expect(
        exponentialCurve.encodeParams(basePrice, 50001, scale)
      ).to.be.revertedWith("Growth rate exceeds maximum");
    });

    it("Should reject zero scale", async function () {
      const { exponentialCurve, basePrice, lowGrowthRate } = await loadFixture(
        deployExponentialCurveFixture
      );

      const invalidParams = await exponentialCurve.encodeParams(basePrice, lowGrowthRate, 0);
      const [valid, reason] = await exponentialCurve.validateParams(invalidParams);

      expect(valid).to.be.false;
      expect(reason).to.equal("Scale must be > 0");
    });
  });

  describe("Parameter Encoding/Decoding", function () {
    it("Should encode and decode parameters correctly", async function () {
      const { exponentialCurve, basePrice, lowGrowthRate, scale } = await loadFixture(
        deployExponentialCurveFixture
      );

      const encoded = await exponentialCurve.encodeParams(basePrice, lowGrowthRate, scale);

      // Decode manually to verify
      const decodedScale = encoded & ((1n << 96n) - 1n);
      const temp1 = encoded >> 96n;
      const decodedGrowthRate = temp1 & ((1n << 80n) - 1n);
      const temp2 = temp1 >> 80n;
      const decodedBasePrice = temp2 & ((1n << 80n) - 1n);

      expect(decodedBasePrice).to.equal(basePrice);
      expect(decodedGrowthRate).to.equal(lowGrowthRate);
      expect(decodedScale).to.equal(scale);
    });

    it("Should handle maximum valid values", async function () {
      const { exponentialCurve } = await loadFixture(deployExponentialCurveFixture);

      const maxBasePrice = (1n << 80n) - 1n;
      const maxGrowthRate = 50000n; // Max allowed
      const maxScale = (1n << 96n) - 1n;

      const encoded = await exponentialCurve.encodeParams(maxBasePrice, maxGrowthRate, maxScale);
      expect(encoded).to.be.gt(0);
    });

    it("Should revert on values too large", async function () {
      const { exponentialCurve, lowGrowthRate, scale } = await loadFixture(
        deployExponentialCurveFixture
      );

      const tooLargeBasePrice = 1n << 80n;
      const tooLargeGrowthRate = 1n << 80n;
      const tooLargeScale = 1n << 96n;

      await expect(
        exponentialCurve.encodeParams(tooLargeBasePrice, lowGrowthRate, scale)
      ).to.be.revertedWith("Base price too large");

      await expect(
        exponentialCurve.encodeParams(1n, tooLargeGrowthRate, scale)
      ).to.be.revertedWith("Growth rate too large");

      await expect(
        exponentialCurve.encodeParams(1n, lowGrowthRate, tooLargeScale)
      ).to.be.revertedWith("Scale too large");
    });
  });

  describe("Price Calculations", function () {
    it("Should return 50/50 prices at equilibrium", async function () {
      const { exponentialCurve, lowGrowthParams } = await loadFixture(
        deployExponentialCurveFixture
      );

      const [yesPrice, noPrice] = await exponentialCurve.getPrices(lowGrowthParams, 0, 0);

      expect(yesPrice).to.equal(5000n);
      expect(noPrice).to.equal(5000n);
      expect(yesPrice + noPrice).to.equal(10000n);
    });

    it("Should calculate prices based on supply ratio", async function () {
      const { exponentialCurve, lowGrowthParams } = await loadFixture(
        deployExponentialCurveFixture
      );

      const yesSupply = ethers.parseEther("75"); // 75 YES shares
      const noSupply = ethers.parseEther("25"); // 25 NO shares

      const [yesPrice, noPrice] = await exponentialCurve.getPrices(
        lowGrowthParams,
        yesSupply,
        noSupply
      );

      // 75/100 = 7500 basis points, 25/100 = 2500 basis points
      expect(yesPrice).to.equal(7500n);
      expect(noPrice).to.equal(2500n);
      expect(yesPrice + noPrice).to.equal(10000n);
    });

    it("Should handle one-sided market (YES only)", async function () {
      const { exponentialCurve, lowGrowthParams } = await loadFixture(
        deployExponentialCurveFixture
      );

      const yesSupply = ethers.parseEther("100");

      const [yesPrice, noPrice] = await exponentialCurve.getPrices(
        lowGrowthParams,
        yesSupply,
        0
      );

      expect(yesPrice).to.equal(10000n); // 100%
      expect(noPrice).to.equal(0n); // 0%
      expect(yesPrice + noPrice).to.equal(10000n);
    });

    it("Should handle one-sided market (NO only)", async function () {
      const { exponentialCurve, lowGrowthParams } = await loadFixture(
        deployExponentialCurveFixture
      );

      const noSupply = ethers.parseEther("100");

      const [yesPrice, noPrice] = await exponentialCurve.getPrices(lowGrowthParams, 0, noSupply);

      expect(yesPrice).to.equal(0n); // 0%
      expect(noPrice).to.equal(10000n); // 100%
      expect(yesPrice + noPrice).to.equal(10000n);
    });

    it("Should maintain price invariant (sum = 10000)", async function () {
      const { exponentialCurve, lowGrowthParams } = await loadFixture(
        deployExponentialCurveFixture
      );

      // Test various supply ratios
      const testCases = [
        [ethers.parseEther("1"), ethers.parseEther("1")], // 50/50
        [ethers.parseEther("10"), ethers.parseEther("90")], // 10/90
        [ethers.parseEther("33"), ethers.parseEther("67")], // 33/67
        [ethers.parseEther("99"), ethers.parseEther("1")], // 99/1
      ];

      for (const [yesSupply, noSupply] of testCases) {
        const [yesPrice, noPrice] = await exponentialCurve.getPrices(
          lowGrowthParams,
          yesSupply,
          noSupply
        );

        expect(yesPrice + noPrice).to.be.closeTo(10000n, 1n);
      }
    });
  });

  describe("Cost Calculations (Low Growth)", function () {
    it("Should calculate cost with exponential growth", async function () {
      const { exponentialCurve, lowGrowthParams } = await loadFixture(
        deployExponentialCurveFixture
      );

      const shares = ethers.parseEther("10");

      const cost = await exponentialCurve.calculateCost(lowGrowthParams, 0, 0, true, shares);

      // Cost should be positive
      expect(cost).to.be.gt(0);
    });

    it("Should return zero cost for zero shares", async function () {
      const { exponentialCurve, lowGrowthParams } = await loadFixture(
        deployExponentialCurveFixture
      );

      const cost = await exponentialCurve.calculateCost(lowGrowthParams, 0, 0, true, 0);

      expect(cost).to.equal(0);
    });

    it("Should cost more for second batch than first (exponential growth)", async function () {
      const { exponentialCurve, lowGrowthParams, scale } = await loadFixture(
        deployExponentialCurveFixture
      );

      const shares = scale; // Buy exactly one growth period

      // Cost for first batch (shares 0-10)
      const cost1 = await exponentialCurve.calculateCost(lowGrowthParams, 0, 0, true, shares);

      // Cost for second batch (shares 10-20) - should be higher due to growth
      const cost2 = await exponentialCurve.calculateCost(lowGrowthParams, shares, 0, true, shares);

      expect(cost2).to.be.gt(cost1);
    });

    it("Should account for existing supply in pricing", async function () {
      const { exponentialCurve, lowGrowthParams } = await loadFixture(
        deployExponentialCurveFixture
      );

      const existingSupply = ethers.parseEther("50");
      const shares = ethers.parseEther("10");

      const costFromZero = await exponentialCurve.calculateCost(
        lowGrowthParams,
        0,
        0,
        true,
        shares
      );
      const costFromFifty = await exponentialCurve.calculateCost(
        lowGrowthParams,
        existingSupply,
        0,
        true,
        shares
      );

      // Cost from higher supply should be greater (exponential growth)
      expect(costFromFifty).to.be.gt(costFromZero);
    });
  });

  describe("Cost Calculations (Growth Rate Comparison)", function () {
    it("Should cost more with higher growth rate", async function () {
      const { exponentialCurve, lowGrowthParams, mediumGrowthParams, highGrowthParams, scale } =
        await loadFixture(deployExponentialCurveFixture);

      const shares = scale * 2n; // 2 periods worth

      const costLow = await exponentialCurve.calculateCost(lowGrowthParams, 0, 0, true, shares);
      const costMedium = await exponentialCurve.calculateCost(
        mediumGrowthParams,
        0,
        0,
        true,
        shares
      );
      const costHigh = await exponentialCurve.calculateCost(highGrowthParams, 0, 0, true, shares);

      // Higher growth rate = higher cost
      expect(costMedium).to.be.gt(costLow);
      expect(costHigh).to.be.gt(costMedium);
    });

    it("Should show exponential effect over multiple periods", async function () {
      const { exponentialCurve, highGrowthParams, scale } = await loadFixture(
        deployExponentialCurveFixture
      );

      // Buy shares across multiple periods
      const period0Cost = await exponentialCurve.calculateCost(
        highGrowthParams,
        0,
        0,
        true,
        scale
      );
      const period1Cost = await exponentialCurve.calculateCost(
        highGrowthParams,
        scale,
        0,
        true,
        scale
      );
      const period2Cost = await exponentialCurve.calculateCost(
        highGrowthParams,
        scale * 2n,
        0,
        true,
        scale
      );

      // With 100% growth, each period should roughly double
      // period1 should be ~2x period0, period2 should be ~2x period1
      expect(period1Cost).to.be.gt(period0Cost);
      expect(period2Cost).to.be.gt(period1Cost);
    });
  });

  describe("Refund Calculations", function () {
    it("Should calculate refund as ~98% of cost (2% spread)", async function () {
      const { exponentialCurve, lowGrowthParams } = await loadFixture(
        deployExponentialCurveFixture
      );

      const shares = ethers.parseEther("10");

      // Buy shares first (to establish supply)
      const cost = await exponentialCurve.calculateCost(lowGrowthParams, 0, 0, true, shares);

      // Calculate refund for selling
      const refund = await exponentialCurve.calculateRefund(
        lowGrowthParams,
        shares,
        0,
        true,
        shares
      );

      // Refund should be ~98% of cost (2% spread)
      const expectedRefund = (cost * 98n) / 100n;
      expect(refund).to.be.closeTo(expectedRefund, ethers.parseEther("0.0001"));
    });

    it("Should return zero refund for zero shares", async function () {
      const { exponentialCurve, lowGrowthParams } = await loadFixture(
        deployExponentialCurveFixture
      );

      const refund = await exponentialCurve.calculateRefund(
        lowGrowthParams,
        ethers.parseEther("10"),
        0,
        true,
        0
      );

      expect(refund).to.equal(0);
    });

    it("Should revert if selling more than owned", async function () {
      const { exponentialCurve, lowGrowthParams } = await loadFixture(
        deployExponentialCurveFixture
      );

      const ownedShares = ethers.parseEther("10");
      const sellShares = ethers.parseEther("20");

      await expect(
        exponentialCurve.calculateRefund(lowGrowthParams, ownedShares, 0, true, sellShares)
      ).to.be.revertedWithCustomError(exponentialCurve, "InvalidShares");
    });

    it("Should ensure refund < cost (prevent arbitrage)", async function () {
      const { exponentialCurve, lowGrowthParams } = await loadFixture(
        deployExponentialCurveFixture
      );

      const shares = ethers.parseEther("10");

      const cost = await exponentialCurve.calculateCost(lowGrowthParams, 0, 0, true, shares);
      const refund = await exponentialCurve.calculateRefund(
        lowGrowthParams,
        shares,
        0,
        true,
        shares
      );

      expect(refund).to.be.lt(cost);
    });
  });

  describe("Outcome-Specific Calculations", function () {
    it("Should calculate cost based on YES supply for YES outcome", async function () {
      const { exponentialCurve, lowGrowthParams } = await loadFixture(
        deployExponentialCurveFixture
      );

      const yesSupply = ethers.parseEther("50");
      const noSupply = ethers.parseEther("10");
      const shares = ethers.parseEther("5");

      const costYes = await exponentialCurve.calculateCost(
        lowGrowthParams,
        yesSupply,
        noSupply,
        true,
        shares
      );

      // Should be more expensive (YES supply is higher = higher starting price)
      const costFromZero = await exponentialCurve.calculateCost(
        lowGrowthParams,
        0,
        0,
        true,
        shares
      );

      expect(costYes).to.be.gt(costFromZero);
    });

    it("Should calculate cost based on NO supply for NO outcome", async function () {
      const { exponentialCurve, lowGrowthParams } = await loadFixture(
        deployExponentialCurveFixture
      );

      const yesSupply = ethers.parseEther("10");
      const noSupply = ethers.parseEther("50");
      const shares = ethers.parseEther("5");

      const costNo = await exponentialCurve.calculateCost(
        lowGrowthParams,
        yesSupply,
        noSupply,
        false,
        shares
      );

      // Should be more expensive (NO supply is higher = higher starting price)
      const costFromZero = await exponentialCurve.calculateCost(
        lowGrowthParams,
        0,
        0,
        false,
        shares
      );

      expect(costNo).to.be.gt(costFromZero);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle very small shares", async function () {
      const { exponentialCurve, lowGrowthParams } = await loadFixture(
        deployExponentialCurveFixture
      );

      const tinyShares = 1n; // 1 wei

      const cost = await exponentialCurve.calculateCost(lowGrowthParams, 0, 0, true, tinyShares);

      expect(cost).to.be.gte(0);
    });

    it("Should handle large supplies without overflow", async function () {
      const { exponentialCurve, lowGrowthParams } = await loadFixture(
        deployExponentialCurveFixture
      );

      const largeSupply = ethers.parseEther("1000");

      // Should not revert
      const [yesPrice, noPrice] = await exponentialCurve.getPrices(
        lowGrowthParams,
        largeSupply,
        largeSupply
      );

      expect(yesPrice).to.equal(5000n);
      expect(noPrice).to.equal(5000n);
    });

    it("Should prevent overflow with growth cap", async function () {
      const { exponentialCurve, highGrowthParams, scale } = await loadFixture(
        deployExponentialCurveFixture
      );

      // Try to buy many periods (would overflow without cap)
      const manyShares = scale * 20n; // 20 periods

      // Should not revert (capped at 1000x)
      const cost = await exponentialCurve.calculateCost(highGrowthParams, 0, 0, true, manyShares);

      expect(cost).to.be.gt(0);
    });

    it("Should revert on invalid parameters (zero base price)", async function () {
      const { exponentialCurve, lowGrowthRate, scale } = await loadFixture(
        deployExponentialCurveFixture
      );

      const invalidParams = await exponentialCurve.encodeParams(0, lowGrowthRate, scale);

      await expect(
        exponentialCurve.calculateCost(invalidParams, 0, 0, true, ethers.parseEther("10"))
      ).to.be.revertedWithCustomError(exponentialCurve, "InvalidParameters");
    });

    it("Should revert on zero scale", async function () {
      const { exponentialCurve, basePrice, lowGrowthRate } = await loadFixture(
        deployExponentialCurveFixture
      );

      const invalidParams = await exponentialCurve.encodeParams(basePrice, lowGrowthRate, 0);

      await expect(
        exponentialCurve.calculateCost(invalidParams, 0, 0, true, ethers.parseEther("10"))
      ).to.be.revertedWithCustomError(exponentialCurve, "InvalidParameters");
    });
  });

  describe("IBondingCurve Compliance", function () {
    it("Should implement all required functions", async function () {
      const { exponentialCurve, lowGrowthParams } = await loadFixture(
        deployExponentialCurveFixture
      );

      // All these should not revert
      await exponentialCurve.calculateCost(lowGrowthParams, 0, 0, true, ethers.parseEther("1"));
      await exponentialCurve.calculateRefund(
        lowGrowthParams,
        ethers.parseEther("1"),
        0,
        true,
        ethers.parseEther("1")
      );
      await exponentialCurve.getPrices(lowGrowthParams, 0, 0);
      await exponentialCurve.curveName();
      await exponentialCurve.validateParams(lowGrowthParams);
    });

    it("Should satisfy price invariant across all states", async function () {
      const { exponentialCurve, lowGrowthParams } = await loadFixture(
        deployExponentialCurveFixture
      );

      const states = [
        [0, 0],
        [ethers.parseEther("1"), ethers.parseEther("1")],
        [ethers.parseEther("100"), 0],
        [0, ethers.parseEther("100")],
        [ethers.parseEther("37"), ethers.parseEther("63")],
      ];

      for (const [yesSupply, noSupply] of states) {
        const [yesPrice, noPrice] = await exponentialCurve.getPrices(
          lowGrowthParams,
          yesSupply,
          noSupply
        );

        expect(yesPrice + noPrice).to.be.closeTo(10000n, 1n);
        expect(yesPrice).to.be.lte(10000n);
        expect(noPrice).to.be.lte(10000n);
      }
    });
  });
});
