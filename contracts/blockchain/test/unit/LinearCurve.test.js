const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("LinearCurve", function () {
  // Fixture for deploying LinearCurve
  async function deployLinearCurveFixture() {
    const LinearCurve = await ethers.getContractFactory("LinearCurve");
    const linearCurve = await LinearCurve.deploy();
    await linearCurve.waitForDeployment();

    // Common test parameters
    const basePrice = ethers.parseEther("0.001"); // 0.001 ETH per share
    const slope = ethers.parseEther("0.0001"); // 0.0001 ETH price increase per share
    const zeroSlope = 0n; // Constant price

    // Encode params for testing
    const constantPriceParams = await linearCurve.encodeParams(basePrice, zeroSlope);
    const increasingPriceParams = await linearCurve.encodeParams(basePrice, slope);

    return {
      linearCurve,
      basePrice,
      slope,
      constantPriceParams,
      increasingPriceParams,
    };
  }

  describe("Metadata", function () {
    it("Should return correct curve name", async function () {
      const { linearCurve } = await loadFixture(deployLinearCurveFixture);

      expect(await linearCurve.curveName()).to.equal("Linear");
    });

    it("Should validate correct parameters", async function () {
      const { linearCurve, constantPriceParams } = await loadFixture(deployLinearCurveFixture);

      const [valid, reason] = await linearCurve.validateParams(constantPriceParams);
      expect(valid).to.be.true;
      expect(reason).to.equal("");
    });

    it("Should reject zero base price", async function () {
      const { linearCurve } = await loadFixture(deployLinearCurveFixture);

      const invalidParams = await linearCurve.encodeParams(0, 0);
      const [valid, reason] = await linearCurve.validateParams(invalidParams);

      expect(valid).to.be.false;
      expect(reason).to.equal("Base price must be > 0");
    });
  });

  describe("Parameter Encoding/Decoding", function () {
    it("Should encode and decode parameters correctly", async function () {
      const { linearCurve, basePrice, slope } = await loadFixture(deployLinearCurveFixture);

      const encoded = await linearCurve.encodeParams(basePrice, slope);

      // Decode manually to verify
      const decodedBasePrice = encoded >> 128n;
      const decodedSlope = encoded & ((1n << 128n) - 1n);

      expect(decodedBasePrice).to.equal(basePrice);
      expect(decodedSlope).to.equal(slope);
    });

    it("Should handle maximum values", async function () {
      const { linearCurve } = await loadFixture(deployLinearCurveFixture);

      const maxValue = (1n << 128n) - 1n;
      const encoded = await linearCurve.encodeParams(maxValue, maxValue);

      expect(encoded).to.be.gt(0);
    });

    it("Should revert on values too large", async function () {
      const { linearCurve } = await loadFixture(deployLinearCurveFixture);

      const tooLarge = 1n << 128n;

      await expect(linearCurve.encodeParams(tooLarge, 0)).to.be.revertedWith("Base price too large");
      await expect(linearCurve.encodeParams(0, tooLarge)).to.be.revertedWith("Slope too large");
    });
  });

  describe("Price Calculations", function () {
    it("Should return 50/50 prices at equilibrium", async function () {
      const { linearCurve, constantPriceParams } = await loadFixture(deployLinearCurveFixture);

      const [yesPrice, noPrice] = await linearCurve.getPrices(constantPriceParams, 0, 0);

      expect(yesPrice).to.equal(5000n);
      expect(noPrice).to.equal(5000n);
      expect(yesPrice + noPrice).to.equal(10000n);
    });

    it("Should calculate prices based on supply ratio", async function () {
      const { linearCurve, constantPriceParams } = await loadFixture(deployLinearCurveFixture);

      const yesSupply = ethers.parseEther("75"); // 75 YES shares
      const noSupply = ethers.parseEther("25"); // 25 NO shares

      const [yesPrice, noPrice] = await linearCurve.getPrices(
        constantPriceParams,
        yesSupply,
        noSupply
      );

      // 75/100 = 7500 basis points, 25/100 = 2500 basis points
      expect(yesPrice).to.equal(7500n);
      expect(noPrice).to.equal(2500n);
      expect(yesPrice + noPrice).to.equal(10000n);
    });

    it("Should handle one-sided market (YES only)", async function () {
      const { linearCurve, constantPriceParams } = await loadFixture(deployLinearCurveFixture);

      const yesSupply = ethers.parseEther("100");

      const [yesPrice, noPrice] = await linearCurve.getPrices(constantPriceParams, yesSupply, 0);

      expect(yesPrice).to.equal(10000n); // 100%
      expect(noPrice).to.equal(0n); // 0%
      expect(yesPrice + noPrice).to.equal(10000n);
    });

    it("Should handle one-sided market (NO only)", async function () {
      const { linearCurve, constantPriceParams } = await loadFixture(deployLinearCurveFixture);

      const noSupply = ethers.parseEther("100");

      const [yesPrice, noPrice] = await linearCurve.getPrices(constantPriceParams, 0, noSupply);

      expect(yesPrice).to.equal(0n); // 0%
      expect(noPrice).to.equal(10000n); // 100%
      expect(yesPrice + noPrice).to.equal(10000n);
    });

    it("Should maintain price invariant (sum = 10000)", async function () {
      const { linearCurve, constantPriceParams } = await loadFixture(deployLinearCurveFixture);

      // Test various supply ratios
      const testCases = [
        [ethers.parseEther("1"), ethers.parseEther("1")], // 50/50
        [ethers.parseEther("10"), ethers.parseEther("90")], // 10/90
        [ethers.parseEther("33"), ethers.parseEther("67")], // 33/67
        [ethers.parseEther("99"), ethers.parseEther("1")], // 99/1
      ];

      for (const [yesSupply, noSupply] of testCases) {
        const [yesPrice, noPrice] = await linearCurve.getPrices(
          constantPriceParams,
          yesSupply,
          noSupply
        );

        expect(yesPrice + noPrice).to.be.closeTo(10000n, 1n);
      }
    });
  });

  describe("Cost Calculations (Constant Price)", function () {
    it("Should calculate cost for constant price curve", async function () {
      const { linearCurve, constantPriceParams, basePrice } = await loadFixture(
        deployLinearCurveFixture
      );

      const shares = ethers.parseEther("10");

      const cost = await linearCurve.calculateCost(constantPriceParams, 0, 0, true, shares);

      // With zero slope: cost = shares * basePrice
      const expectedCost = (shares * basePrice) / ethers.parseEther("1");
      expect(cost).to.equal(expectedCost);
    });

    it("Should return zero cost for zero shares", async function () {
      const { linearCurve, constantPriceParams } = await loadFixture(deployLinearCurveFixture);

      const cost = await linearCurve.calculateCost(constantPriceParams, 0, 0, true, 0);

      expect(cost).to.equal(0);
    });

    it("Should scale cost linearly with shares (constant price)", async function () {
      const { linearCurve, constantPriceParams } = await loadFixture(deployLinearCurveFixture);

      const cost1 = await linearCurve.calculateCost(
        constantPriceParams,
        0,
        0,
        true,
        ethers.parseEther("10")
      );
      const cost2 = await linearCurve.calculateCost(
        constantPriceParams,
        0,
        0,
        true,
        ethers.parseEther("20")
      );

      // cost2 should be exactly 2x cost1
      expect(cost2).to.equal(cost1 * 2n);
    });
  });

  describe("Cost Calculations (Increasing Price)", function () {
    it("Should calculate higher cost with slope", async function () {
      const { linearCurve, increasingPriceParams, constantPriceParams } = await loadFixture(
        deployLinearCurveFixture
      );

      const shares = ethers.parseEther("10");

      const costConstant = await linearCurve.calculateCost(constantPriceParams, 0, 0, true, shares);
      const costIncreasing = await linearCurve.calculateCost(
        increasingPriceParams,
        0,
        0,
        true,
        shares
      );

      // Cost with slope should be higher
      expect(costIncreasing).to.be.gt(costConstant);
    });

    it("Should use trapezoidal rule for increasing price", async function () {
      const { linearCurve, increasingPriceParams, basePrice, slope } = await loadFixture(
        deployLinearCurveFixture
      );

      const shares = ethers.parseEther("10");

      const cost = await linearCurve.calculateCost(increasingPriceParams, 0, 0, true, shares);

      // Manual calculation using trapezoidal rule
      // startPrice = basePrice + (0 * slope) = basePrice
      // endPrice = basePrice + (10 * slope)
      const startPrice = basePrice;
      const endPrice = basePrice + (shares * slope) / ethers.parseEther("1");
      const expectedCost = (shares * (startPrice + endPrice)) / (2n * ethers.parseEther("1"));

      expect(cost).to.be.closeTo(expectedCost, ethers.parseEther("0.00001"));
    });

    it("Should account for existing supply in pricing", async function () {
      const { linearCurve, increasingPriceParams } = await loadFixture(deployLinearCurveFixture);

      const existingSupply = ethers.parseEther("50");
      const shares = ethers.parseEther("10");

      const costFromZero = await linearCurve.calculateCost(
        increasingPriceParams,
        0,
        0,
        true,
        shares
      );
      const costFromFifty = await linearCurve.calculateCost(
        increasingPriceParams,
        existingSupply,
        0,
        true,
        shares
      );

      // Cost from higher supply should be greater (price has increased)
      expect(costFromFifty).to.be.gt(costFromZero);
    });
  });

  describe("Refund Calculations", function () {
    it("Should calculate refund as ~99% of cost", async function () {
      const { linearCurve, constantPriceParams } = await loadFixture(deployLinearCurveFixture);

      const shares = ethers.parseEther("10");

      // Buy shares first (to establish supply)
      const cost = await linearCurve.calculateCost(constantPriceParams, 0, 0, true, shares);

      // Calculate refund for selling
      const refund = await linearCurve.calculateRefund(constantPriceParams, shares, 0, true, shares);

      // Refund should be 99% of cost (1% spread)
      const expectedRefund = (cost * 99n) / 100n;
      expect(refund).to.be.closeTo(expectedRefund, ethers.parseEther("0.00001"));
    });

    it("Should return zero refund for zero shares", async function () {
      const { linearCurve, constantPriceParams } = await loadFixture(deployLinearCurveFixture);

      const refund = await linearCurve.calculateRefund(
        constantPriceParams,
        ethers.parseEther("10"),
        0,
        true,
        0
      );

      expect(refund).to.equal(0);
    });

    it("Should revert if selling more than owned", async function () {
      const { linearCurve, constantPriceParams } = await loadFixture(deployLinearCurveFixture);

      const ownedShares = ethers.parseEther("10");
      const sellShares = ethers.parseEther("20");

      await expect(
        linearCurve.calculateRefund(constantPriceParams, ownedShares, 0, true, sellShares)
      ).to.be.revertedWithCustomError(linearCurve, "InvalidShares");
    });

    it("Should ensure refund < cost (prevent arbitrage)", async function () {
      const { linearCurve, constantPriceParams } = await loadFixture(deployLinearCurveFixture);

      const shares = ethers.parseEther("10");

      const cost = await linearCurve.calculateCost(constantPriceParams, 0, 0, true, shares);
      const refund = await linearCurve.calculateRefund(constantPriceParams, shares, 0, true, shares);

      expect(refund).to.be.lt(cost);
    });
  });

  describe("Outcome-Specific Calculations", function () {
    it("Should calculate cost based on YES supply for YES outcome", async function () {
      const { linearCurve, increasingPriceParams } = await loadFixture(deployLinearCurveFixture);

      const yesSupply = ethers.parseEther("50");
      const noSupply = ethers.parseEther("10");
      const shares = ethers.parseEther("5");

      const costYes = await linearCurve.calculateCost(
        increasingPriceParams,
        yesSupply,
        noSupply,
        true,
        shares
      );

      // Should be more expensive (YES supply is higher = higher starting price)
      const costFromZero = await linearCurve.calculateCost(
        increasingPriceParams,
        0,
        0,
        true,
        shares
      );

      expect(costYes).to.be.gt(costFromZero);
    });

    it("Should calculate cost based on NO supply for NO outcome", async function () {
      const { linearCurve, increasingPriceParams } = await loadFixture(deployLinearCurveFixture);

      const yesSupply = ethers.parseEther("10");
      const noSupply = ethers.parseEther("50");
      const shares = ethers.parseEther("5");

      const costNo = await linearCurve.calculateCost(
        increasingPriceParams,
        yesSupply,
        noSupply,
        false,
        shares
      );

      // Should be more expensive (NO supply is higher = higher starting price)
      const costFromZero = await linearCurve.calculateCost(
        increasingPriceParams,
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
      const { linearCurve, constantPriceParams } = await loadFixture(deployLinearCurveFixture);

      const tinyShares = 1n; // 1 wei

      const cost = await linearCurve.calculateCost(constantPriceParams, 0, 0, true, tinyShares);

      expect(cost).to.be.gte(0);
    });

    it("Should handle large supplies", async function () {
      const { linearCurve, constantPriceParams } = await loadFixture(deployLinearCurveFixture);

      const largeSupply = ethers.parseEther("1000000");

      const [yesPrice, noPrice] = await linearCurve.getPrices(
        constantPriceParams,
        largeSupply,
        largeSupply
      );

      expect(yesPrice).to.equal(5000n);
      expect(noPrice).to.equal(5000n);
    });

    it("Should revert on invalid parameters (zero base price)", async function () {
      const { linearCurve } = await loadFixture(deployLinearCurveFixture);

      const invalidParams = await linearCurve.encodeParams(0, ethers.parseEther("0.001"));

      await expect(
        linearCurve.calculateCost(invalidParams, 0, 0, true, ethers.parseEther("10"))
      ).to.be.revertedWithCustomError(linearCurve, "InvalidParameters");
    });
  });

  describe("IBondingCurve Compliance", function () {
    it("Should implement all required functions", async function () {
      const { linearCurve, constantPriceParams } = await loadFixture(deployLinearCurveFixture);

      // All these should not revert
      await linearCurve.calculateCost(constantPriceParams, 0, 0, true, ethers.parseEther("1"));
      await linearCurve.calculateRefund(
        constantPriceParams,
        ethers.parseEther("1"),
        0,
        true,
        ethers.parseEther("1")
      );
      await linearCurve.getPrices(constantPriceParams, 0, 0);
      await linearCurve.curveName();
      await linearCurve.validateParams(constantPriceParams);
    });

    it("Should satisfy price invariant across all states", async function () {
      const { linearCurve, constantPriceParams } = await loadFixture(deployLinearCurveFixture);

      const states = [
        [0, 0],
        [ethers.parseEther("1"), ethers.parseEther("1")],
        [ethers.parseEther("100"), 0],
        [0, ethers.parseEther("100")],
        [ethers.parseEther("37"), ethers.parseEther("63")],
      ];

      for (const [yesSupply, noSupply] of states) {
        const [yesPrice, noPrice] = await linearCurve.getPrices(
          constantPriceParams,
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
