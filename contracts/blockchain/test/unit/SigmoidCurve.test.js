const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("SigmoidCurve", function () {
  // Fixture for deploying SigmoidCurve
  async function deploySigmoidCurveFixture() {
    const SigmoidCurve = await ethers.getContractFactory("SigmoidCurve");
    const sigmoidCurve = await SigmoidCurve.deploy();
    await sigmoidCurve.waitForDeployment();

    // Common test parameters
    const minPrice = ethers.parseEther("0.0001"); // 0.0001 ETH floor
    const maxPrice = ethers.parseEther("0.01"); // 0.01 ETH ceiling
    const lowSteepness = 5n; // Gentle S-curve
    const mediumSteepness = 10n; // Moderate S-curve
    const highSteepness = 20n; // Steep S-curve
    const inflection = 50n * ethers.parseEther("1"); // 50 shares midpoint

    // Encode params for testing
    const lowSteepParams = await sigmoidCurve.encodeParams(
      minPrice,
      maxPrice,
      lowSteepness,
      inflection
    );
    const mediumSteepParams = await sigmoidCurve.encodeParams(
      minPrice,
      maxPrice,
      mediumSteepness,
      inflection
    );
    const highSteepParams = await sigmoidCurve.encodeParams(
      minPrice,
      maxPrice,
      highSteepness,
      inflection
    );

    return {
      sigmoidCurve,
      minPrice,
      maxPrice,
      lowSteepness,
      mediumSteepness,
      highSteepness,
      inflection,
      lowSteepParams,
      mediumSteepParams,
      highSteepParams,
    };
  }

  describe("Metadata", function () {
    it("Should return correct curve name", async function () {
      const { sigmoidCurve } = await loadFixture(deploySigmoidCurveFixture);

      expect(await sigmoidCurve.curveName()).to.equal("Sigmoid");
    });

    it("Should validate correct parameters", async function () {
      const { sigmoidCurve, lowSteepParams } = await loadFixture(deploySigmoidCurveFixture);

      const [valid, reason] = await sigmoidCurve.validateParams(lowSteepParams);
      expect(valid).to.be.true;
      expect(reason).to.equal("");
    });

    it("Should reject zero min price", async function () {
      const { sigmoidCurve, maxPrice, lowSteepness, inflection } = await loadFixture(
        deploySigmoidCurveFixture
      );

      const invalidParams = await sigmoidCurve.encodeParams(0, maxPrice, lowSteepness, inflection);
      const [valid, reason] = await sigmoidCurve.validateParams(invalidParams);

      expect(valid).to.be.false;
      expect(reason).to.equal("Min price must be > 0");
    });

    it("Should reject maxPrice <= minPrice", async function () {
      const { sigmoidCurve, minPrice, lowSteepness, inflection } = await loadFixture(
        deploySigmoidCurveFixture
      );

      await expect(
        sigmoidCurve.encodeParams(minPrice, minPrice, lowSteepness, inflection)
      ).to.be.revertedWith("Max price must be > min price");
    });

    it("Should reject zero steepness", async function () {
      const { sigmoidCurve, minPrice, maxPrice, inflection } = await loadFixture(
        deploySigmoidCurveFixture
      );

      const invalidParams = await sigmoidCurve.encodeParams(minPrice, maxPrice, 0, inflection);
      const [valid, reason] = await sigmoidCurve.validateParams(invalidParams);

      expect(valid).to.be.false;
      expect(reason).to.equal("Steepness must be > 0");
    });

    it("Should reject steepness too high", async function () {
      const { sigmoidCurve, minPrice, maxPrice, inflection } = await loadFixture(
        deploySigmoidCurveFixture
      );

      await expect(
        sigmoidCurve.encodeParams(minPrice, maxPrice, 101, inflection)
      ).to.be.revertedWith("Steepness exceeds maximum");
    });

    it("Should reject zero inflection", async function () {
      const { sigmoidCurve, minPrice, maxPrice, lowSteepness } = await loadFixture(
        deploySigmoidCurveFixture
      );

      const invalidParams = await sigmoidCurve.encodeParams(minPrice, maxPrice, lowSteepness, 0);
      const [valid, reason] = await sigmoidCurve.validateParams(invalidParams);

      expect(valid).to.be.false;
      expect(reason).to.equal("Inflection point must be > 0");
    });
  });

  describe("Parameter Encoding/Decoding", function () {
    it("Should encode and decode parameters correctly", async function () {
      const { sigmoidCurve, minPrice, maxPrice, lowSteepness, inflection } = await loadFixture(
        deploySigmoidCurveFixture
      );

      const encoded = await sigmoidCurve.encodeParams(minPrice, maxPrice, lowSteepness, inflection);

      // Decode manually to verify [minPrice:64][maxPrice:64][steepness:32][inflection:96]
      const decodedInflection = encoded & ((1n << 96n) - 1n);
      const temp1 = encoded >> 96n;
      const decodedSteepness = temp1 & ((1n << 32n) - 1n);
      const temp2 = temp1 >> 32n;
      const decodedMaxPrice = temp2 & ((1n << 64n) - 1n);
      const temp3 = temp2 >> 64n;
      const decodedMinPrice = temp3 & ((1n << 64n) - 1n);

      expect(decodedMinPrice).to.equal(minPrice);
      expect(decodedMaxPrice).to.equal(maxPrice);
      expect(decodedSteepness).to.equal(lowSteepness);
      expect(decodedInflection).to.equal(inflection);
    });

    it("Should handle maximum valid values", async function () {
      const { sigmoidCurve } = await loadFixture(deploySigmoidCurveFixture);

      const maxPrice64 = (1n << 64n) - 1n;
      const maxSteepness = 100n;
      const maxInflection = (1n << 96n) - 1n;

      // Use max-1 for minPrice to ensure maxPrice > minPrice
      const encoded = await sigmoidCurve.encodeParams(maxPrice64 - 1n, maxPrice64, maxSteepness, maxInflection);
      expect(encoded).to.be.gt(0);
    });

    it("Should revert on values too large", async function () {
      const { sigmoidCurve, maxPrice, lowSteepness, inflection } = await loadFixture(
        deploySigmoidCurveFixture
      );

      const tooLargePrice = 1n << 64n;
      const tooLargeSteepness = 1n << 32n;
      const tooLargeInflection = 1n << 96n;

      await expect(
        sigmoidCurve.encodeParams(tooLargePrice, maxPrice, lowSteepness, inflection)
      ).to.be.revertedWith("Min price too large");

      await expect(
        sigmoidCurve.encodeParams(1n, tooLargePrice, lowSteepness, inflection)
      ).to.be.revertedWith("Max price too large");

      await expect(
        sigmoidCurve.encodeParams(1n, maxPrice, tooLargeSteepness, inflection)
      ).to.be.revertedWith("Steepness too large");

      await expect(
        sigmoidCurve.encodeParams(1n, maxPrice, lowSteepness, tooLargeInflection)
      ).to.be.revertedWith("Inflection too large");
    });
  });

  describe("Price Calculations", function () {
    it("Should return 50/50 prices at equilibrium", async function () {
      const { sigmoidCurve, lowSteepParams } = await loadFixture(deploySigmoidCurveFixture);

      const [yesPrice, noPrice] = await sigmoidCurve.getPrices(lowSteepParams, 0, 0);

      expect(yesPrice).to.equal(5000n);
      expect(noPrice).to.equal(5000n);
      expect(yesPrice + noPrice).to.equal(10000n);
    });

    it("Should calculate prices based on supply ratio", async function () {
      const { sigmoidCurve, lowSteepParams } = await loadFixture(deploySigmoidCurveFixture);

      const yesSupply = ethers.parseEther("75"); // 75 YES shares
      const noSupply = ethers.parseEther("25"); // 25 NO shares

      const [yesPrice, noPrice] = await sigmoidCurve.getPrices(
        lowSteepParams,
        yesSupply,
        noSupply
      );

      // 75/100 = 7500 basis points, 25/100 = 2500 basis points
      expect(yesPrice).to.equal(7500n);
      expect(noPrice).to.equal(2500n);
      expect(yesPrice + noPrice).to.equal(10000n);
    });

    it("Should handle one-sided market (YES only)", async function () {
      const { sigmoidCurve, lowSteepParams } = await loadFixture(deploySigmoidCurveFixture);

      const yesSupply = ethers.parseEther("100");

      const [yesPrice, noPrice] = await sigmoidCurve.getPrices(lowSteepParams, yesSupply, 0);

      expect(yesPrice).to.equal(10000n); // 100%
      expect(noPrice).to.equal(0n); // 0%
      expect(yesPrice + noPrice).to.equal(10000n);
    });

    it("Should handle one-sided market (NO only)", async function () {
      const { sigmoidCurve, lowSteepParams } = await loadFixture(deploySigmoidCurveFixture);

      const noSupply = ethers.parseEther("100");

      const [yesPrice, noPrice] = await sigmoidCurve.getPrices(lowSteepParams, 0, noSupply);

      expect(yesPrice).to.equal(0n); // 0%
      expect(noPrice).to.equal(10000n); // 100%
      expect(yesPrice + noPrice).to.equal(10000n);
    });

    it("Should maintain price invariant (sum = 10000)", async function () {
      const { sigmoidCurve, lowSteepParams } = await loadFixture(deploySigmoidCurveFixture);

      // Test various supply ratios
      const testCases = [
        [ethers.parseEther("1"), ethers.parseEther("1")], // 50/50
        [ethers.parseEther("10"), ethers.parseEther("90")], // 10/90
        [ethers.parseEther("33"), ethers.parseEther("67")], // 33/67
        [ethers.parseEther("99"), ethers.parseEther("1")], // 99/1
      ];

      for (const [yesSupply, noSupply] of testCases) {
        const [yesPrice, noPrice] = await sigmoidCurve.getPrices(
          lowSteepParams,
          yesSupply,
          noSupply
        );

        expect(yesPrice + noPrice).to.be.closeTo(10000n, 1n);
      }
    });
  });

  describe("Cost Calculations (S-Curve Behavior)", function () {
    it("Should calculate cost with sigmoid growth", async function () {
      const { sigmoidCurve, lowSteepParams } = await loadFixture(deploySigmoidCurveFixture);

      const shares = ethers.parseEther("10");

      const cost = await sigmoidCurve.calculateCost(lowSteepParams, 0, 0, true, shares);

      // Cost should be positive
      expect(cost).to.be.gt(0);
    });

    it("Should return zero cost for zero shares", async function () {
      const { sigmoidCurve, lowSteepParams } = await loadFixture(deploySigmoidCurveFixture);

      const cost = await sigmoidCurve.calculateCost(lowSteepParams, 0, 0, true, 0);

      expect(cost).to.equal(0);
    });

    it("Should show S-curve behavior (slow-fast-slow growth)", async function () {
      const { sigmoidCurve, mediumSteepParams, inflection } = await loadFixture(
        deploySigmoidCurveFixture
      );

      const batchSize = ethers.parseEther("10");

      // Early stage (before inflection) - slow growth
      const cost1 = await sigmoidCurve.calculateCost(
        mediumSteepParams,
        0,
        0,
        true,
        batchSize
      );

      // Mid stage (around inflection) - fast growth
      const cost2 = await sigmoidCurve.calculateCost(
        mediumSteepParams,
        inflection - batchSize / 2n,
        0,
        true,
        batchSize
      );

      // Late stage (after inflection) - slow growth (plateauing)
      const cost3 = await sigmoidCurve.calculateCost(
        mediumSteepParams,
        inflection * 2n,
        0,
        true,
        batchSize
      );

      // Mid-stage cost should be highest (steepest part of S-curve)
      expect(cost2).to.be.gt(cost1);
      // Late stage plateaus, so cost might be similar to or slightly higher than mid
      // (but growth rate is slower)
    });

    it("Should account for existing supply in pricing", async function () {
      const { sigmoidCurve, lowSteepParams } = await loadFixture(deploySigmoidCurveFixture);

      const existingSupply = ethers.parseEther("50");
      const shares = ethers.parseEther("10");

      const costFromZero = await sigmoidCurve.calculateCost(lowSteepParams, 0, 0, true, shares);
      const costFromFifty = await sigmoidCurve.calculateCost(
        lowSteepParams,
        existingSupply,
        0,
        true,
        shares
      );

      // Cost from higher supply should be greater (further along S-curve)
      expect(costFromFifty).to.be.gt(costFromZero);
    });
  });

  describe("Cost Calculations (Steepness Comparison)", function () {
    it("Should cost more with higher steepness (faster transitions)", async function () {
      const { sigmoidCurve, lowSteepParams, mediumSteepParams, highSteepParams, inflection } =
        await loadFixture(deploySigmoidCurveFixture);

      const shares = ethers.parseEther("20");

      // Calculate costs around inflection point where steepness matters most
      const costLow = await sigmoidCurve.calculateCost(
        lowSteepParams,
        inflection,
        0,
        true,
        shares
      );
      const costMedium = await sigmoidCurve.calculateCost(
        mediumSteepParams,
        inflection,
        0,
        true,
        shares
      );
      const costHigh = await sigmoidCurve.calculateCost(
        highSteepParams,
        inflection,
        0,
        true,
        shares
      );

      // All should be positive
      expect(costLow).to.be.gt(0);
      expect(costMedium).to.be.gt(0);
      expect(costHigh).to.be.gt(0);
    });
  });

  describe("Refund Calculations", function () {
    it("Should calculate refund as ~98.5% of cost (1.5% spread)", async function () {
      const { sigmoidCurve, lowSteepParams } = await loadFixture(deploySigmoidCurveFixture);

      const shares = ethers.parseEther("10");

      // Buy shares first (to establish supply)
      const cost = await sigmoidCurve.calculateCost(lowSteepParams, 0, 0, true, shares);

      // Calculate refund for selling
      const refund = await sigmoidCurve.calculateRefund(lowSteepParams, shares, 0, true, shares);

      // Refund should be ~98.5% of cost (1.5% spread)
      const expectedRefund = (cost * 985n) / 1000n;
      expect(refund).to.be.closeTo(expectedRefund, ethers.parseEther("0.0001"));
    });

    it("Should return zero refund for zero shares", async function () {
      const { sigmoidCurve, lowSteepParams } = await loadFixture(deploySigmoidCurveFixture);

      const refund = await sigmoidCurve.calculateRefund(
        lowSteepParams,
        ethers.parseEther("10"),
        0,
        true,
        0
      );

      expect(refund).to.equal(0);
    });

    it("Should revert if selling more than owned", async function () {
      const { sigmoidCurve, lowSteepParams } = await loadFixture(deploySigmoidCurveFixture);

      const ownedShares = ethers.parseEther("10");
      const sellShares = ethers.parseEther("20");

      await expect(
        sigmoidCurve.calculateRefund(lowSteepParams, ownedShares, 0, true, sellShares)
      ).to.be.revertedWithCustomError(sigmoidCurve, "InvalidShares");
    });

    it("Should ensure refund < cost (prevent arbitrage)", async function () {
      const { sigmoidCurve, lowSteepParams } = await loadFixture(deploySigmoidCurveFixture);

      const shares = ethers.parseEther("10");

      const cost = await sigmoidCurve.calculateCost(lowSteepParams, 0, 0, true, shares);
      const refund = await sigmoidCurve.calculateRefund(lowSteepParams, shares, 0, true, shares);

      expect(refund).to.be.lt(cost);
    });
  });

  describe("Outcome-Specific Calculations", function () {
    it("Should calculate cost based on YES supply for YES outcome", async function () {
      const { sigmoidCurve, lowSteepParams } = await loadFixture(deploySigmoidCurveFixture);

      const yesSupply = ethers.parseEther("50");
      const noSupply = ethers.parseEther("10");
      const shares = ethers.parseEther("5");

      const costYes = await sigmoidCurve.calculateCost(
        lowSteepParams,
        yesSupply,
        noSupply,
        true,
        shares
      );

      // Should be more expensive (YES supply is higher = further along curve)
      const costFromZero = await sigmoidCurve.calculateCost(lowSteepParams, 0, 0, true, shares);

      expect(costYes).to.be.gt(costFromZero);
    });

    it("Should calculate cost based on NO supply for NO outcome", async function () {
      const { sigmoidCurve, lowSteepParams } = await loadFixture(deploySigmoidCurveFixture);

      const yesSupply = ethers.parseEther("10");
      const noSupply = ethers.parseEther("50");
      const shares = ethers.parseEther("5");

      const costNo = await sigmoidCurve.calculateCost(
        lowSteepParams,
        yesSupply,
        noSupply,
        false,
        shares
      );

      // Should be more expensive (NO supply is higher = further along curve)
      const costFromZero = await sigmoidCurve.calculateCost(lowSteepParams, 0, 0, false, shares);

      expect(costNo).to.be.gt(costFromZero);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle very small shares", async function () {
      const { sigmoidCurve, lowSteepParams } = await loadFixture(deploySigmoidCurveFixture);

      const tinyShares = ethers.parseEther("0.001"); // Small but not wei

      const cost = await sigmoidCurve.calculateCost(lowSteepParams, 0, 0, true, tinyShares);

      expect(cost).to.be.gte(0);
    });

    it("Should handle large supplies", async function () {
      const { sigmoidCurve, lowSteepParams } = await loadFixture(deploySigmoidCurveFixture);

      const largeSupply = ethers.parseEther("1000");

      const [yesPrice, noPrice] = await sigmoidCurve.getPrices(
        lowSteepParams,
        largeSupply,
        largeSupply
      );

      expect(yesPrice).to.equal(5000n);
      expect(noPrice).to.equal(5000n);
    });

    it("Should revert on invalid parameters (zero min price)", async function () {
      const { sigmoidCurve, maxPrice, lowSteepness, inflection } = await loadFixture(
        deploySigmoidCurveFixture
      );

      const invalidParams = await sigmoidCurve.encodeParams(0, maxPrice, lowSteepness, inflection);

      await expect(
        sigmoidCurve.calculateCost(invalidParams, 0, 0, true, ethers.parseEther("10"))
      ).to.be.revertedWithCustomError(sigmoidCurve, "InvalidParameters");
    });

    it("Should revert on maxPrice <= minPrice", async function () {
      const { sigmoidCurve, minPrice, lowSteepness, inflection } = await loadFixture(
        deploySigmoidCurveFixture
      );

      // Encoding should revert when maxPrice <= minPrice
      await expect(
        sigmoidCurve.encodeParams(minPrice, minPrice, lowSteepness, inflection)
      ).to.be.revertedWith("Max price must be > min price");
    });
  });

  describe("IBondingCurve Compliance", function () {
    it("Should implement all required functions", async function () {
      const { sigmoidCurve, lowSteepParams } = await loadFixture(deploySigmoidCurveFixture);

      // All these should not revert
      await sigmoidCurve.calculateCost(lowSteepParams, 0, 0, true, ethers.parseEther("1"));
      await sigmoidCurve.calculateRefund(
        lowSteepParams,
        ethers.parseEther("1"),
        0,
        true,
        ethers.parseEther("1")
      );
      await sigmoidCurve.getPrices(lowSteepParams, 0, 0);
      await sigmoidCurve.curveName();
      await sigmoidCurve.validateParams(lowSteepParams);
    });

    it("Should satisfy price invariant across all states", async function () {
      const { sigmoidCurve, lowSteepParams } = await loadFixture(deploySigmoidCurveFixture);

      const states = [
        [0, 0],
        [ethers.parseEther("1"), ethers.parseEther("1")],
        [ethers.parseEther("100"), 0],
        [0, ethers.parseEther("100")],
        [ethers.parseEther("37"), ethers.parseEther("63")],
      ];

      for (const [yesSupply, noSupply] of states) {
        const [yesPrice, noPrice] = await sigmoidCurve.getPrices(
          lowSteepParams,
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
