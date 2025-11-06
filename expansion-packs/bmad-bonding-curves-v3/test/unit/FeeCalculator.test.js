const { expect } = require("chai");
const { ethers } = require("hardhat");

/**
 * @title FeeCalculator Test Suite
 * @notice Comprehensive tests for two-tier fee calculation system
 * @dev Tests:
 *      - Tier 1: Bond-based fee scaling (0.5-2%)
 *      - Tier 2: Voluntary fee-based bonus scaling (0-8%)
 *      - Additive model: totalFee = bondFee + voluntaryBonus
 *      - 3-way distribution: Platform + Creator + Staking = 100%
 *      - Fee splitting logic
 */
describe("FeeCalculator Library", function () {
  let feeTester;

  // Constants (from FeeCalculator.sol)
  const PRECISION = 10000; // 100% in basis points
  const MIN_BOND = ethers.parseEther("10");
  const MAX_BOND = ethers.parseEther("1000");
  const MIN_BOND_FEE_BPS = 50;  // 0.5%
  const MAX_BOND_FEE_BPS = 200; // 2%
  const MIN_VOLUNTARY_FEE = 0;
  const MAX_VOLUNTARY_FEE = ethers.parseEther("1000");
  const MIN_VOLUNTARY_BONUS_BPS = 0;  // 0%
  const MAX_VOLUNTARY_BONUS_BPS = 800; // 8%
  const VOLUNTARY_FEE_TAX_BPS = 1000; // 10%
  const MAX_TRADING_FEE_BPS = 1000;   // 10% global cap

  before(async function () {
    // Deploy test wrapper
    const FeeTester = await ethers.getContractFactory("FeeCalculatorTester");
    feeTester = await FeeTester.deploy();
    await feeTester.waitForDeployment();
  });

  // ═══════════════════════════════════════════════════════════
  // TIER 1: BOND-BASED FEE SCALING (10 TESTS)
  // ═══════════════════════════════════════════════════════════

  describe("Tier 1: Bond-Based Fee Scaling", function () {

    it("Should return minimum fee for minimum bond (10 BASED)", async function () {
      const feeBps = await feeTester.calculateBondFee(MIN_BOND);
      expect(feeBps).to.equal(MIN_BOND_FEE_BPS); // 50 bps = 0.5%
    });

    it("Should return maximum fee for maximum bond (1000 BASED)", async function () {
      const feeBps = await feeTester.calculateBondFee(MAX_BOND);
      expect(feeBps).to.equal(MAX_BOND_FEE_BPS); // 200 bps = 2%
    });

    it("Should linearly scale fee for mid-range bond (500 BASED)", async function () {
      const bondAmount = ethers.parseEther("500");
      const feeBps = await feeTester.calculateBondFee(bondAmount);

      // Expected: ~124-125 bps (1.24-1.25%)
      // Formula: 50 + ((500-10)/(1000-10)) * (200-50) = 50 + (490/990)*150 ≈ 124.24
      expect(feeBps).to.be.closeTo(124n, 1n);
    });

    it("Should linearly scale fee for lower mid-range bond (100 BASED)", async function () {
      const bondAmount = ethers.parseEther("100");
      const feeBps = await feeTester.calculateBondFee(bondAmount);

      // Expected: ~63-64 bps (0.63-0.64%)
      // Formula: 50 + ((100-10)/(1000-10)) * (200-50) = 50 + (90/990)*150 ≈ 63.64
      expect(feeBps).to.be.closeTo(63n, 1n);
    });

    it("Should linearly scale fee for upper mid-range bond (750 BASED)", async function () {
      const bondAmount = ethers.parseEther("750");
      const feeBps = await feeTester.calculateBondFee(bondAmount);

      // Expected: ~162 bps (1.62%)
      // Formula: 50 + ((750-10)/(1000-10)) * (200-50) = 50 + (740/990)*150 ≈ 162.12
      expect(feeBps).to.be.closeTo(162n, 1n);
    });

    it("Should revert if bond amount below minimum", async function () {
      const lowBond = ethers.parseEther("5");
      await expect(feeTester.calculateBondFee(lowBond))
        .to.be.revertedWithCustomError(feeTester, "BondTooLow")
        .withArgs(lowBond, MIN_BOND);
    });

    it("Should revert if bond amount above maximum", async function () {
      const highBond = ethers.parseEther("2000");
      await expect(feeTester.calculateBondFee(highBond))
        .to.be.revertedWithCustomError(feeTester, "BondTooHigh")
        .withArgs(highBond, MAX_BOND);
    });

    it("Should handle bond exactly at boundaries (MIN_BOND)", async function () {
      const feeBps = await feeTester.calculateBondFee(MIN_BOND);
      expect(feeBps).to.equal(MIN_BOND_FEE_BPS);
    });

    it("Should handle bond exactly at boundaries (MAX_BOND)", async function () {
      const feeBps = await feeTester.calculateBondFee(MAX_BOND);
      expect(feeBps).to.equal(MAX_BOND_FEE_BPS);
    });

    it("Should maintain monotonic increase (larger bond = higher fee)", async function () {
      const fee100 = await feeTester.calculateBondFee(ethers.parseEther("100"));
      const fee500 = await feeTester.calculateBondFee(ethers.parseEther("500"));
      const fee900 = await feeTester.calculateBondFee(ethers.parseEther("900"));

      expect(fee500).to.be.gt(fee100);
      expect(fee900).to.be.gt(fee500);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // TIER 2: VOLUNTARY FEE-BASED BONUS SCALING (8 TESTS)
  // ═══════════════════════════════════════════════════════════

  describe("Tier 2: Voluntary Fee-Based Bonus Scaling", function () {

    it("Should return zero bonus for zero voluntary fee", async function () {
      const bonusBps = await feeTester.calculateVoluntaryBonus(0);
      expect(bonusBps).to.equal(0);
    });

    it("Should return maximum bonus for maximum voluntary fee (1000 BASED)", async function () {
      const bonusBps = await feeTester.calculateVoluntaryBonus(MAX_VOLUNTARY_FEE);
      expect(bonusBps).to.equal(MAX_VOLUNTARY_BONUS_BPS); // 800 bps = 8%
    });

    it("Should linearly scale bonus for mid-range voluntary fee (500 BASED)", async function () {
      const voluntaryAmount = ethers.parseEther("500");
      const bonusBps = await feeTester.calculateVoluntaryBonus(voluntaryAmount);

      // Expected: 400 bps (4%)
      // Formula: 0 + ((500-0)/(1000-0)) * (800-0) = (500/1000)*800 = 400
      expect(bonusBps).to.equal(400n);
    });

    it("Should linearly scale bonus for lower range (250 BASED)", async function () {
      const voluntaryAmount = ethers.parseEther("250");
      const bonusBps = await feeTester.calculateVoluntaryBonus(voluntaryAmount);

      // Expected: 200 bps (2%)
      // Formula: 0 + ((250-0)/(1000-0)) * (800-0) = (250/1000)*800 = 200
      expect(bonusBps).to.equal(200n);
    });

    it("Should linearly scale bonus for upper range (750 BASED)", async function () {
      const voluntaryAmount = ethers.parseEther("750");
      const bonusBps = await feeTester.calculateVoluntaryBonus(voluntaryAmount);

      // Expected: 600 bps (6%)
      // Formula: 0 + ((750-0)/(1000-0)) * (800-0) = (750/1000)*800 = 600
      expect(bonusBps).to.equal(600n);
    });

    it("Should revert if voluntary fee above maximum", async function () {
      const highVoluntary = ethers.parseEther("1500");
      await expect(feeTester.calculateVoluntaryBonus(highVoluntary))
        .to.be.revertedWithCustomError(feeTester, "VoluntaryFeeTooHigh")
        .withArgs(highVoluntary, MAX_VOLUNTARY_FEE);
    });

    it("Should handle voluntary fee exactly at maximum", async function () {
      const bonusBps = await feeTester.calculateVoluntaryBonus(MAX_VOLUNTARY_FEE);
      expect(bonusBps).to.equal(MAX_VOLUNTARY_BONUS_BPS);
    });

    it("Should maintain monotonic increase (larger voluntary = higher bonus)", async function () {
      const bonus100 = await feeTester.calculateVoluntaryBonus(ethers.parseEther("100"));
      const bonus500 = await feeTester.calculateVoluntaryBonus(ethers.parseEther("500"));
      const bonus900 = await feeTester.calculateVoluntaryBonus(ethers.parseEther("900"));

      expect(bonus500).to.be.gt(bonus100);
      expect(bonus900).to.be.gt(bonus500);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // COMBINED FEE CALCULATION (ADDITIVE MODEL) (8 TESTS)
  // ═══════════════════════════════════════════════════════════

  describe("Combined Fee Calculation (Additive Model)", function () {

    it("Should add bond fee + voluntary bonus (minimum case)", async function () {
      const bondAmount = MIN_BOND; // 10 BASED
      const voluntaryAmount = 0;

      const totalFee = await feeTester.calculateTradingFee(bondAmount, voluntaryAmount);

      // Expected: 50 bps (0.5%) from bond + 0 from voluntary = 50 bps
      expect(totalFee).to.equal(50n);
    });

    it("Should add bond fee + voluntary bonus (mid-range case)", async function () {
      const bondAmount = ethers.parseEther("500"); // 500 BASED
      const voluntaryAmount = ethers.parseEther("500"); // 500 BASED

      const totalFee = await feeTester.calculateTradingFee(bondAmount, voluntaryAmount);

      // Expected: ~124 bps from bond + 400 bps from voluntary = ~524 bps (5.24%)
      expect(totalFee).to.be.closeTo(524n, 1n);
    });

    it("Should add bond fee + voluntary bonus (maximum case)", async function () {
      const bondAmount = MAX_BOND; // 1000 BASED
      const voluntaryAmount = MAX_VOLUNTARY_FEE; // 1000 BASED

      const totalFee = await feeTester.calculateTradingFee(bondAmount, voluntaryAmount);

      // Expected: 200 bps from bond + 800 bps from voluntary = 1000 bps (10%)
      expect(totalFee).to.equal(1000n);
    });

    it("Should work with bond only (no voluntary fee)", async function () {
      const bondAmount = ethers.parseEther("750");
      const voluntaryAmount = 0;

      const totalFee = await feeTester.calculateTradingFee(bondAmount, voluntaryAmount);

      // Expected: ~162 bps from bond + 0 from voluntary = ~162 bps
      expect(totalFee).to.be.closeTo(162n, 1n);
    });

    it("Should enforce global trading fee cap (MAX_TRADING_FEE_BPS)", async function () {
      // This should NOT revert since max bond (200) + max voluntary (800) = 1000 = cap
      const bondAmount = MAX_BOND;
      const voluntaryAmount = MAX_VOLUNTARY_FEE;

      const totalFee = await feeTester.calculateTradingFee(bondAmount, voluntaryAmount);
      expect(totalFee).to.equal(MAX_TRADING_FEE_BPS);
    });

    it("Should revert if bond amount invalid", async function () {
      const lowBond = ethers.parseEther("5");
      const voluntaryAmount = ethers.parseEther("100");

      await expect(feeTester.calculateTradingFee(lowBond, voluntaryAmount))
        .to.be.revertedWithCustomError(feeTester, "BondTooLow");
    });

    it("Should revert if voluntary amount invalid", async function () {
      const bondAmount = ethers.parseEther("500");
      const highVoluntary = ethers.parseEther("1500");

      await expect(feeTester.calculateTradingFee(bondAmount, highVoluntary))
        .to.be.revertedWithCustomError(feeTester, "VoluntaryFeeTooHigh");
    });

    it("Should maintain additive property (fee1 + fee2 = total)", async function () {
      const bondAmount = ethers.parseEther("500");
      const voluntaryAmount = ethers.parseEther("250");

      const bondFee = await feeTester.calculateBondFee(bondAmount);
      const voluntaryBonus = await feeTester.calculateVoluntaryBonus(voluntaryAmount);
      const totalFee = await feeTester.calculateTradingFee(bondAmount, voluntaryAmount);

      expect(totalFee).to.equal(bondFee + voluntaryBonus);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // 3-WAY DISTRIBUTION VALIDATION (10 TESTS)
  // ═══════════════════════════════════════════════════════════

  describe("3-Way Distribution Validation", function () {

    it("Should accept valid distribution (33/34/33)", async function () {
      await expect(feeTester.validateDistribution(3300, 3400, 3300))
        .to.not.be.reverted;
    });

    it("Should accept valid distribution (30/40/30)", async function () {
      await expect(feeTester.validateDistribution(3000, 4000, 3000))
        .to.not.be.reverted;
    });

    it("Should accept valid distribution (25/50/25)", async function () {
      await expect(feeTester.validateDistribution(2500, 5000, 2500))
        .to.not.be.reverted;
    });

    it("Should accept valid distribution (20/60/20)", async function () {
      await expect(feeTester.validateDistribution(2000, 6000, 2000))
        .to.not.be.reverted;
    });

    it("Should accept edge case (100/0/0)", async function () {
      await expect(feeTester.validateDistribution(10000, 0, 0))
        .to.not.be.reverted;
    });

    it("Should accept edge case (0/100/0)", async function () {
      await expect(feeTester.validateDistribution(0, 10000, 0))
        .to.not.be.reverted;
    });

    it("Should accept edge case (0/0/100)", async function () {
      await expect(feeTester.validateDistribution(0, 0, 10000))
        .to.not.be.reverted;
    });

    it("Should revert if distribution sums to less than 100%", async function () {
      const platform = 3000;
      const creator = 3000;
      const staking = 3000;
      const total = platform + creator + staking; // 9000 = 90%

      await expect(feeTester.validateDistribution(platform, creator, staking))
        .to.be.revertedWithCustomError(feeTester, "DistributionMustSumTo100")
        .withArgs(total);
    });

    it("Should revert if distribution sums to more than 100%", async function () {
      const platform = 5000;
      const creator = 6000;
      const staking = 4000;
      const total = platform + creator + staking; // 15000 = 150%

      await expect(feeTester.validateDistribution(platform, creator, staking))
        .to.be.revertedWithCustomError(feeTester, "DistributionMustSumTo100")
        .withArgs(total);
    });

    it("Should validate all three shares are within bounds", async function () {
      // Valid case: all within 0-100% and sum to 100%
      await expect(feeTester.validateDistribution(3333, 3333, 3334))
        .to.not.be.reverted;
    });
  });

  // ═══════════════════════════════════════════════════════════
  // FEE SPLITTING (3-WAY DISTRIBUTION) (4 TESTS)
  // ═══════════════════════════════════════════════════════════

  describe("Fee Splitting (3-Way Distribution)", function () {

    it("Should correctly split fee with 30/40/30 distribution", async function () {
      const totalFee = ethers.parseEther("1000"); // 1000 BASED
      const platformShare = 3000; // 30%
      const creatorShare = 4000;  // 40%
      const stakingShare = 3000;  // 30%

      const [platformAmount, creatorAmount, stakingAmount] =
        await feeTester.splitFee(totalFee, platformShare, creatorShare, stakingShare);

      expect(platformAmount).to.equal(ethers.parseEther("300")); // 30%
      expect(creatorAmount).to.equal(ethers.parseEther("400"));  // 40%
      expect(stakingAmount).to.equal(ethers.parseEther("300"));  // 30%

      // Verify total
      const reconstructedTotal = platformAmount + creatorAmount + stakingAmount;
      expect(reconstructedTotal).to.equal(totalFee);
    });

    it("Should correctly split fee with 25/50/25 distribution", async function () {
      const totalFee = ethers.parseEther("500"); // 500 BASED
      const platformShare = 2500; // 25%
      const creatorShare = 5000;  // 50%
      const stakingShare = 2500;  // 25%

      const [platformAmount, creatorAmount, stakingAmount] =
        await feeTester.splitFee(totalFee, platformShare, creatorShare, stakingShare);

      expect(platformAmount).to.equal(ethers.parseEther("125")); // 25%
      expect(creatorAmount).to.equal(ethers.parseEther("250"));  // 50%
      expect(stakingAmount).to.equal(ethers.parseEther("125"));  // 25%
    });

    it("Should correctly split fee with 20/60/20 distribution", async function () {
      const totalFee = ethers.parseEther("1000"); // 1000 BASED
      const platformShare = 2000; // 20%
      const creatorShare = 6000;  // 60%
      const stakingShare = 2000;  // 20%

      const [platformAmount, creatorAmount, stakingAmount] =
        await feeTester.splitFee(totalFee, platformShare, creatorShare, stakingShare);

      expect(platformAmount).to.equal(ethers.parseEther("200")); // 20%
      expect(creatorAmount).to.equal(ethers.parseEther("600"));  // 60%
      expect(stakingAmount).to.equal(ethers.parseEther("200"));  // 20%
    });

    it("Should revert if total fee is zero", async function () {
      await expect(feeTester.splitFee(0, 3000, 4000, 3000))
        .to.be.revertedWithCustomError(feeTester, "ZeroFeeAmount");
    });
  });

  // ═══════════════════════════════════════════════════════════
  // HELPER FUNCTIONS (2 TESTS)
  // ═══════════════════════════════════════════════════════════

  describe("Helper Functions", function () {

    it("Should correctly calculate voluntary fee tax (10%)", async function () {
      const voluntaryFee = ethers.parseEther("500"); // 500 BASED

      const [tax, netAmount] = await feeTester.calculateVoluntaryFeeTax(voluntaryFee);

      // Expected tax: 10% of 500 = 50 BASED
      expect(tax).to.equal(ethers.parseEther("50"));

      // Expected net: 500 - 50 = 450 BASED
      expect(netAmount).to.equal(ethers.parseEther("450"));

      // Verify total
      expect(tax + netAmount).to.equal(voluntaryFee);
    });

    it("Should return zero for zero voluntary fee (tax helper)", async function () {
      const [tax, netAmount] = await feeTester.calculateVoluntaryFeeTax(0);

      expect(tax).to.equal(0);
      expect(netAmount).to.equal(0);
    });

    it("Should return complete fee breakdown with all components", async function () {
      const bondAmount = ethers.parseEther("500");
      const voluntaryAmount = ethers.parseEther("500");
      const platformShare = 3000; // 30%
      const creatorShare = 4000;  // 40%
      const stakingShare = 3000;  // 30%

      const [bondFeeBps, voluntaryBonusBps, totalTradingFeeBps, voluntaryTax, voluntaryNet] =
        await feeTester.getFeeBreakdown(
          bondAmount,
          voluntaryAmount,
          platformShare,
          creatorShare,
          stakingShare
        );

      // Verify bond fee (~124 bps)
      expect(bondFeeBps).to.be.closeTo(124n, 1n);

      // Verify voluntary bonus (400 bps = 4%)
      expect(voluntaryBonusBps).to.equal(400n);

      // Verify total fee (bondFee + voluntaryBonus)
      expect(totalTradingFeeBps).to.equal(bondFeeBps + voluntaryBonusBps);

      // Verify voluntary tax (10% of 500 = 50 BASED)
      expect(voluntaryTax).to.equal(ethers.parseEther("50"));

      // Verify voluntary net (500 - 50 = 450 BASED)
      expect(voluntaryNet).to.equal(ethers.parseEther("450"));
    });

    it("Should revert in getFeeBreakdown if distribution invalid", async function () {
      const bondAmount = ethers.parseEther("500");
      const voluntaryAmount = ethers.parseEther("500");
      const platformShare = 5000; // 50%
      const creatorShare = 6000;  // 60%
      const stakingShare = 4000;  // 40%
      // Total = 150% (invalid)

      await expect(
        feeTester.getFeeBreakdown(
          bondAmount,
          voluntaryAmount,
          platformShare,
          creatorShare,
          stakingShare
        )
      ).to.be.revertedWithCustomError(feeTester, "DistributionMustSumTo100");
    });
  });

  // ═══════════════════════════════════════════════════════════
  // CONSTANTS VERIFICATION (Bonus Tests)
  // ═══════════════════════════════════════════════════════════

  describe("Constants Verification", function () {

    it("Should expose correct PRECISION constant", async function () {
      expect(await feeTester.PRECISION()).to.equal(PRECISION);
    });

    it("Should expose correct bond range constants", async function () {
      expect(await feeTester.MIN_BOND()).to.equal(MIN_BOND);
      expect(await feeTester.MAX_BOND()).to.equal(MAX_BOND);
    });

    it("Should expose correct bond fee range constants", async function () {
      expect(await feeTester.MIN_BOND_FEE_BPS()).to.equal(MIN_BOND_FEE_BPS);
      expect(await feeTester.MAX_BOND_FEE_BPS()).to.equal(MAX_BOND_FEE_BPS);
    });

    it("Should expose correct voluntary fee range constants", async function () {
      expect(await feeTester.MIN_VOLUNTARY_FEE()).to.equal(MIN_VOLUNTARY_FEE);
      expect(await feeTester.MAX_VOLUNTARY_FEE()).to.equal(MAX_VOLUNTARY_FEE);
    });

    it("Should expose correct voluntary bonus range constants", async function () {
      expect(await feeTester.MIN_VOLUNTARY_BONUS_BPS()).to.equal(MIN_VOLUNTARY_BONUS_BPS);
      expect(await feeTester.MAX_VOLUNTARY_BONUS_BPS()).to.equal(MAX_VOLUNTARY_BONUS_BPS);
    });

    it("Should expose correct voluntary fee tax constant", async function () {
      expect(await feeTester.VOLUNTARY_FEE_TAX_BPS()).to.equal(VOLUNTARY_FEE_TAX_BPS);
    });

    it("Should expose correct trading fee cap constant", async function () {
      expect(await feeTester.MAX_TRADING_FEE_BPS()).to.equal(MAX_TRADING_FEE_BPS);
    });
  });
});
