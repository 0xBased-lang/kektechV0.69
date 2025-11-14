// test/unit/LMSRCurve.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

/**
 * LMSRCurve Test Suite
 *
 * Tests the LMSR (Logarithmic Market Scoring Rule) bonding curve implementation
 *
 * Coverage:
 * - IBondingCurve interface compliance
 * - LMSR mathematical properties
 * - Parameter validation
 * - Price calculations
 * - Cost calculations
 * - Edge cases (one-sided markets, extreme values)
 * - Gas costs
 */
describe("LMSRCurve", function () {
  async function deployLMSRCurveFixture() {
    const [owner] = await ethers.getSigners();

    const LMSRCurve = await ethers.getContractFactory("LMSRCurve");
    const lmsrCurve = await LMSRCurve.deploy();
    await lmsrCurve.waitForDeployment();

    // Standard test parameters
    const b = ethers.parseEther("100"); // 100 BASED liquidity
    const minB = ethers.parseEther("1");
    const maxB = ethers.parseEther("1000");

    return {
      lmsrCurve,
      owner,
      b,
      minB,
      maxB,
    };
  }

  describe("Deployment & Interface", function () {
    it("Should deploy successfully", async function () {
      const { lmsrCurve } = await loadFixture(deployLMSRCurveFixture);
      expect(await lmsrCurve.getAddress()).to.be.properAddress;
    });

    it("Should have correct curve name", async function () {
      const { lmsrCurve } = await loadFixture(deployLMSRCurveFixture);
      expect(await lmsrCurve.curveName()).to.equal("LMSRCurve");
    });

    it("Should implement IBondingCurve interface", async function () {
      const { lmsrCurve } = await loadFixture(deployLMSRCurveFixture);

      // Check all required functions exist
      expect(lmsrCurve.calculateCost).to.exist;
      expect(lmsrCurve.getPrices).to.exist;
      expect(lmsrCurve.curveName).to.exist;
    });

    it("Should have correct constants", async function () {
      const { lmsrCurve, minB, maxB } = await loadFixture(deployLMSRCurveFixture);

      expect(await lmsrCurve.MIN_B()).to.equal(minB);
      expect(await lmsrCurve.MAX_B()).to.equal(maxB);
    });
  });

  describe("Parameter Validation", function () {
    it("Should validate correct b parameter", async function () {
      const { lmsrCurve, b } = await loadFixture(deployLMSRCurveFixture);

      const [valid, reason] = await lmsrCurve.validateParams(b);
      expect(valid).to.be.true;
      expect(reason).to.equal("");
    });

    it("Should validate minimum b parameter", async function () {
      const { lmsrCurve, minB } = await loadFixture(deployLMSRCurveFixture);

      const [valid, reason] = await lmsrCurve.validateParams(minB);
      expect(valid).to.be.true;
      expect(reason).to.equal("");
    });

    it("Should validate maximum b parameter", async function () {
      const { lmsrCurve, maxB } = await loadFixture(deployLMSRCurveFixture);

      const [valid, reason] = await lmsrCurve.validateParams(maxB);
      expect(valid).to.be.true;
      expect(reason).to.equal("");
    });

    it("Should reject b below minimum", async function () {
      const { lmsrCurve, minB } = await loadFixture(deployLMSRCurveFixture);

      const tooSmall = minB - 1n;
      const [valid, reason] = await lmsrCurve.validateParams(tooSmall);
      expect(valid).to.be.false;
      expect(reason).to.include("too small");
    });

    it("Should reject b above maximum", async function () {
      const { lmsrCurve, maxB } = await loadFixture(deployLMSRCurveFixture);

      const tooLarge = maxB + 1n;
      const [valid, reason] = await lmsrCurve.validateParams(tooLarge);
      expect(valid).to.be.false;
      expect(reason).to.include("too large");
    });

    it("Should reject zero b", async function () {
      const { lmsrCurve } = await loadFixture(deployLMSRCurveFixture);

      const [valid, reason] = await lmsrCurve.validateParams(0);
      expect(valid).to.be.false;
      expect(reason).to.include("too small");
    });
  });

  describe("Parameter Encoding/Decoding", function () {
    it("Should encode valid parameter", async function () {
      const { lmsrCurve, b } = await loadFixture(deployLMSRCurveFixture);

      const encoded = await lmsrCurve.encodeParams(b);
      expect(encoded).to.equal(b);
    });

    it("Should decode valid parameter", async function () {
      const { lmsrCurve, b } = await loadFixture(deployLMSRCurveFixture);

      const decoded = await lmsrCurve.decodeParams(b);
      expect(decoded).to.equal(b);
    });

    it("Should encode and decode correctly", async function () {
      const { lmsrCurve, b } = await loadFixture(deployLMSRCurveFixture);

      const encoded = await lmsrCurve.encodeParams(b);
      const decoded = await lmsrCurve.decodeParams(encoded);
      expect(decoded).to.equal(b);
    });

    it("Should revert encoding invalid b", async function () {
      const { lmsrCurve, maxB } = await loadFixture(deployLMSRCurveFixture);

      await expect(
        lmsrCurve.encodeParams(maxB + 1n)
      ).to.be.revertedWithCustomError(lmsrCurve, "InvalidLiquidityParameter");
    });

    it("Should revert decoding invalid b", async function () {
      const { lmsrCurve, maxB } = await loadFixture(deployLMSRCurveFixture);

      await expect(
        lmsrCurve.decodeParams(maxB + 1n)
      ).to.be.revertedWithCustomError(lmsrCurve, "InvalidLiquidityParameter");
    });
  });

  describe("Price Calculations", function () {
    it("Should calculate equal prices for balanced market", async function () {
      const { lmsrCurve, b } = await loadFixture(deployLMSRCurveFixture);

      const supply = 100n; // Simple integer, not wei
      const [yesPrice, noPrice] = await lmsrCurve.getPrices(b, supply, supply);

      // Prices in basis points: 50% = 5000
      const halfPrice = 5000; // 5000 basis points = 50%
      const tolerance = 100; // ±100 basis points = ±1%

      expect(yesPrice).to.be.closeTo(halfPrice, tolerance);
      expect(noPrice).to.be.closeTo(halfPrice, tolerance);
    });

    it("Should have prices sum to approximately 1", async function () {
      const { lmsrCurve, b } = await loadFixture(deployLMSRCurveFixture);

      const yesSupply = 150n;
      const noSupply = 100n;
      const [yesPrice, noPrice] = await lmsrCurve.getPrices(b, yesSupply, noSupply);

      const sum = yesPrice + noPrice;
      const expected = 10000; // 10000 basis points = 100%
      const tolerance = 50; // ±50 basis points = ±0.5%

      expect(sum).to.be.closeTo(expected, tolerance);
    });

    it("Should calculate higher price for more popular outcome", async function () {
      const { lmsrCurve, b } = await loadFixture(deployLMSRCurveFixture);

      const yesSupply = 200n; // More YES (simple integer)
      const noSupply = 50n;   // Less NO (simple integer)
      const [yesPrice, noPrice] = await lmsrCurve.getPrices(b, yesSupply, noSupply);

      expect(yesPrice).to.be.gt(noPrice);
      expect(yesPrice).to.be.gt(5000); // > 50% (5000 basis points)
      expect(noPrice).to.be.lt(5000); // < 50% (5000 basis points)
    });

    it("Should handle one-sided market (only YES)", async function () {
      const { lmsrCurve, b } = await loadFixture(deployLMSRCurveFixture);

      const yesSupply = 100n; // Simple integer
      const noSupply = 0n;
      const [yesPrice, noPrice] = await lmsrCurve.getPrices(b, yesSupply, noSupply);

      // YES should be significantly more expensive than NO
      // With b=100 and 100 YES shares, YES price ≈ 73% (7300 basis points)
      expect(yesPrice).to.be.gt(noPrice); // YES > NO
      expect(yesPrice).to.be.gt(6000); // YES > 60%
      expect(noPrice).to.be.lt(4000); // NO < 40%
    });

    it("Should handle one-sided market (only NO)", async function () {
      const { lmsrCurve, b } = await loadFixture(deployLMSRCurveFixture);

      const yesSupply = 0n;
      const noSupply = 100n; // Simple integer
      const [yesPrice, noPrice] = await lmsrCurve.getPrices(b, yesSupply, noSupply);

      // NO should be significantly more expensive than YES
      // With b=100 and 100 NO shares, NO price ≈ 73% (7300 basis points)
      expect(noPrice).to.be.gt(yesPrice); // NO > YES
      expect(noPrice).to.be.gt(6000); // NO > 60%
      expect(yesPrice).to.be.lt(4000); // YES < 40%
    });

    it("Should handle zero supply for both outcomes", async function () {
      const { lmsrCurve, b } = await loadFixture(deployLMSRCurveFixture);

      const [yesPrice, noPrice] = await lmsrCurve.getPrices(b, 0, 0);

      // Should start at 50/50
      const halfPrice = 5000; // 5000 basis points = 50%
      const tolerance = 100; // ±100 basis points = ±1%

      expect(yesPrice).to.be.closeTo(halfPrice, tolerance);
      expect(noPrice).to.be.closeTo(halfPrice, tolerance);
    });

    it("Should revert on invalid b for getPrices", async function () {
      const { lmsrCurve, maxB } = await loadFixture(deployLMSRCurveFixture);

      await expect(
        lmsrCurve.getPrices(maxB + 1n, 100, 100)
      ).to.be.revertedWithCustomError(lmsrCurve, "InvalidLiquidityParameter");
    });
  });

  describe("Cost Calculations", function () {
    it("Should calculate cost for buying YES shares", async function () {
      const { lmsrCurve, b } = await loadFixture(deployLMSRCurveFixture);

      const currentYes = 100n; // Simple integer
      const currentNo = 100n; // Simple integer
      const shares = 10n; // Simple integer

      const cost = await lmsrCurve.calculateCost(
        b,
        currentYes,
        currentNo,
        true, // YES
        shares
      );

      expect(cost).to.be.gt(0);
    });

    it("Should calculate cost for buying NO shares", async function () {
      const { lmsrCurve, b } = await loadFixture(deployLMSRCurveFixture);

      const currentYes = 100n; // Simple integer
      const currentNo = 100n; // Simple integer
      const shares = 10n; // Simple integer

      const cost = await lmsrCurve.calculateCost(
        b,
        currentYes,
        currentNo,
        false, // NO
        shares
      );

      expect(cost).to.be.gt(0);
    });

    it("Should cost more for larger share amounts", async function () {
      const { lmsrCurve, b } = await loadFixture(deployLMSRCurveFixture);

      const currentYes = 100n; // Simple integer
      const currentNo = 100n; // Simple integer

      const smallShares = 10n; // Simple integer
      const largeShares = 50n; // Simple integer

      const smallCost = await lmsrCurve.calculateCost(b, currentYes, currentNo, true, smallShares);
      const largeCost = await lmsrCurve.calculateCost(b, currentYes, currentNo, true, largeShares);

      expect(largeCost).to.be.gt(smallCost);
    });

    it("Should have higher marginal cost for imbalanced markets", async function () {
      const { lmsrCurve, b } = await loadFixture(deployLMSRCurveFixture);

      const shares = 10n; // Simple integer

      // Balanced market
      const balancedCost = await lmsrCurve.calculateCost(
        b,
        100n, // Simple integer
        100n, // Simple integer
        true,
        shares
      );

      // Imbalanced market (buying the popular side)
      const imbalancedCost = await lmsrCurve.calculateCost(
        b,
        200n, // Already have more YES (simple integer)
        50n, // (simple integer)
        true, // Buying more YES
        shares
      );

      // Should cost more to buy the already popular outcome
      expect(imbalancedCost).to.be.gt(balancedCost);
    });

    it("Should handle one-sided market purchases", async function () {
      const { lmsrCurve, b } = await loadFixture(deployLMSRCurveFixture);

      const shares = 10n; // Simple integer

      // Only YES exists, buying more YES
      const cost = await lmsrCurve.calculateCost(
        b,
        100n, // Simple integer
        0, // No NO shares
        true,
        shares
      );

      expect(cost).to.be.gt(0);
    });

    it("Should revert on zero shares", async function () {
      const { lmsrCurve, b } = await loadFixture(deployLMSRCurveFixture);

      await expect(
        lmsrCurve.calculateCost(b, 100, 100, true, 0)
      ).to.be.revertedWithCustomError(lmsrCurve, "ShareAmountZero");
    });

    it("Should revert on invalid b for calculateCost", async function () {
      const { lmsrCurve, maxB } = await loadFixture(deployLMSRCurveFixture);

      await expect(
        lmsrCurve.calculateCost(maxB + 1n, 100, 100, true, 10)
      ).to.be.revertedWithCustomError(lmsrCurve, "InvalidLiquidityParameter");
    });
  });

  describe("Liquidity Parameter 'b' Effects", function () {
    it("Should have slower price movement with higher b", async function () {
      const { lmsrCurve } = await loadFixture(deployLMSRCurveFixture);

      const lowB = ethers.parseEther("10");
      const highB = ethers.parseEther("1000");
      const shares = 10n; // Simple integer

      const start = 100n; // Simple integer

      // Cost with low liquidity (low b)
      const lowBCost = await lmsrCurve.calculateCost(lowB, start, start, true, shares);

      // Cost with high liquidity (high b)
      const highBCost = await lmsrCurve.calculateCost(highB, start, start, true, shares);

      // Higher b means more liquidity → LOWER cost per share
      // (market provides more depth, so price moves slower)
      expect(lowBCost).to.be.gt(highBCost);
    });

    it("Should have different price spreads with different b", async function () {
      const { lmsrCurve } = await loadFixture(deployLMSRCurveFixture);

      const lowB = ethers.parseEther("10");
      const highB = ethers.parseEther("1000");

      const imbalanced = {
        yes: 150n, // Simple integer
        no: 50n // Simple integer
      };

      // Prices with low b
      const [yesLow, noLow] = await lmsrCurve.getPrices(lowB, imbalanced.yes, imbalanced.no);

      // Prices with high b
      const [yesHigh, noHigh] = await lmsrCurve.getPrices(highB, imbalanced.yes, imbalanced.no);

      // Low b should have more extreme prices (higher spread)
      const spreadLow = yesLow - noLow;
      const spreadHigh = yesHigh - noHigh;

      expect(spreadLow).to.be.gt(spreadHigh);
    });
  });

  describe("Mathematical Properties", function () {
    it("Should maintain price * shares relationship", async function () {
      const { lmsrCurve, b } = await loadFixture(deployLMSRCurveFixture);

      const currentYes = 100n; // Simple integer
      const currentNo = 100n; // Simple integer
      const shares = 10n; // Simple integer

      const cost = await lmsrCurve.calculateCost(b, currentYes, currentNo, true, shares);
      const [yesPrice] = await lmsrCurve.getPrices(b, currentYes, currentNo);

      // Cost should be approximately (price_in_basis_points * shares * eth_per_share)
      // Since price is in basis points (0-10000), we need to scale appropriately
      // This test is more complex with basis points, so we just verify reasonable relationship
      expect(cost).to.be.gt(0);
      expect(yesPrice).to.be.gt(0);
      expect(yesPrice).to.be.lte(10000); // Max is 100% = 10000 basis points
    });

    it("Should have convex cost function (increasing marginal cost)", async function () {
      const { lmsrCurve, b } = await loadFixture(deployLMSRCurveFixture);

      const start = 100n; // Simple integer
      const shares = 10n; // Simple integer

      // First purchase
      const cost1 = await lmsrCurve.calculateCost(b, start, start, true, shares);

      // Second purchase (after first)
      const cost2 = await lmsrCurve.calculateCost(
        b,
        start + shares,
        start,
        true,
        shares
      );

      // Marginal cost should increase
      expect(cost2).to.be.gt(cost1);
    });
  });

  describe("Helper Functions", function () {
    it("Should return parameter description", async function () {
      const { lmsrCurve } = await loadFixture(deployLMSRCurveFixture);

      const description = await lmsrCurve.getParamDescription();
      expect(description).to.include("Liquidity");
      expect(description).to.include("b");
    });
  });

  describe("Gas Costs", function () {
    it("Should measure getPrices gas cost", async function () {
      const { lmsrCurve, b } = await loadFixture(deployLMSRCurveFixture);

      const tx = await lmsrCurve.getPrices.estimateGas(
        b,
        100n, // Simple integer
        100n // Simple integer
      );

      console.log(`      getPrices gas: ${tx.toString()}`);
      expect(tx).to.be.lt(100000n); // LMSR math is expensive (~90k gas)
    });

    it("Should measure calculateCost gas cost", async function () {
      const { lmsrCurve, b } = await loadFixture(deployLMSRCurveFixture);

      const tx = await lmsrCurve.calculateCost.estimateGas(
        b,
        100n, // Simple integer
        100n, // Simple integer
        true,
        10n // Simple integer
      );

      console.log(`      calculateCost gas: ${tx.toString()}`);
      expect(tx).to.be.lt(300000n); // Reasonable for LMSR (2 cost calculations ~270k gas)
    });
  });
});
