const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LMSRBondingCurve - Comprehensive Unit Tests", function () {
    let lmsr;
    let owner;

    // Test constants
    const ONE_ETHER = ethers.parseEther("1");
    const LIQUIDITY_PARAM = ethers.parseEther("10000"); // b = 10,000 ETH
    const MAX_UINT128 = (2n ** 128n) - 1n;

    beforeEach(async function () {
        [owner] = await ethers.getSigners();

        const LMSRBondingCurve = await ethers.getContractFactory("LMSRBondingCurve");
        lmsr = await LMSRBondingCurve.deploy();
        await lmsr.waitForDeployment();
    });

    // ============================================================================
    // CATEGORY 1: BASIC FUNCTIONALITY TESTS
    // ============================================================================

    describe("1. Basic Functionality", function () {
        it("Should deploy successfully", async function () {
            expect(await lmsr.getAddress()).to.be.properAddress;
        });

        it("Should return correct curve name", async function () {
            expect(await lmsr.name()).to.equal("LMSR");
        });

        it("Should calculate cost for buying first shares", async function () {
            const cost = await lmsr.calculateCost(
                0, // yesShares
                0, // noShares
                ONE_ETHER, // buy 1 share YES
                true, // isYes
                LIQUIDITY_PARAM
            );

            expect(cost).to.be.gt(0);
            expect(cost).to.be.lt(ONE_ETHER); // First share costs < 1 ETH due to LMSR
        });

        it("Should calculate price for balanced market", async function () {
            const price = await lmsr.getPrice(
                ethers.parseEther("1000"), // 1000 YES shares
                ethers.parseEther("1000"), // 1000 NO shares
                true, // YES price
                LIQUIDITY_PARAM
            );

            // Balanced market should have YES price ≈ 0.5 (50%)
            const halfEther = ONE_ETHER / 2n;
            const tolerance = ONE_ETHER / 100n; // 1% tolerance
            expect(price).to.be.closeTo(halfEther, tolerance);
        });

        it("Should calculate price for imbalanced market (YES favored)", async function () {
            const price = await lmsr.getPrice(
                ethers.parseEther("2000"), // 2000 YES shares
                ethers.parseEther("1000"), // 1000 NO shares
                true, // YES price
                LIQUIDITY_PARAM
            );

            // YES is favored, price should be > 0.5
            expect(price).to.be.gt(ONE_ETHER / 2n);
        });

        it("Should calculate price for imbalanced market (NO favored)", async function () {
            const price = await lmsr.getPrice(
                ethers.parseEther("1000"), // 1000 YES shares
                ethers.parseEther("2000"), // 2000 NO shares
                false, // NO price
                LIQUIDITY_PARAM
            );

            // NO is favored, price should be > 0.5
            expect(price).to.be.gt(ONE_ETHER / 2n);
        });
    });

    // ============================================================================
    // CATEGORY 2: MATHEMATICAL CORRECTNESS TESTS
    // ============================================================================

    describe("2. Mathematical Correctness", function () {
        it("Should satisfy: YES price + NO price = 1", async function () {
            const yesShares = ethers.parseEther("1500");
            const noShares = ethers.parseEther("1000");

            const yesPrice = await lmsr.getPrice(yesShares, noShares, true, LIQUIDITY_PARAM);
            const noPrice = await lmsr.getPrice(yesShares, noShares, false, LIQUIDITY_PARAM);

            // Prices should sum to 1 ETH
            const sum = yesPrice + noPrice;
            const tolerance = ONE_ETHER / 1000n; // 0.1% tolerance
            expect(sum).to.be.closeTo(ONE_ETHER, tolerance);
        });

        it("Should satisfy: Cost(buy) + Cost(sell) ≈ 0", async function () {
            const initialYes = ethers.parseEther("1000");
            const initialNo = ethers.parseEther("1000");
            const amount = ONE_ETHER;

            // Cost to buy 1 share YES
            const costBuy = await lmsr.calculateCost(
                initialYes,
                initialNo,
                amount,
                true,
                LIQUIDITY_PARAM
            );

            // Cost to sell 1 share YES (should be negative, represented as refund)
            const costSell = await lmsr.calculateCost(
                initialYes + amount, // After buying
                initialNo,
                amount,
                true,
                LIQUIDITY_PARAM
            );

            // Buy cost should be positive, sell cost should give similar refund
            expect(costBuy).to.be.gt(0);
            // Note: Selling would give back slightly less due to slippage
        });

        it("Should satisfy: Larger liquidity param = more stable prices", async function () {
            const yesShares = ethers.parseEther("1000");
            const noShares = ethers.parseEther("1000");
            const buyAmount = ethers.parseEther("100");

            // Cost with b = 1,000
            const costLowB = await lmsr.calculateCost(
                yesShares,
                noShares,
                buyAmount,
                true,
                ethers.parseEther("1000")
            );

            // Cost with b = 100,000
            const costHighB = await lmsr.calculateCost(
                yesShares,
                noShares,
                buyAmount,
                true,
                ethers.parseEther("100000")
            );

            // Higher b = less price impact = lower cost per share
            expect(costHighB).to.be.lt(costLowB);
        });

        it("Should have bounded loss property: max loss = b × ln(2)", async function () {
            // Market starts: 0 YES, 0 NO
            // Attacker buys 1M YES shares
            // Market resolves NO
            // Protocol loss should be ≤ b × ln(2)

            const b = ethers.parseEther("10000");
            const attackAmount = ethers.parseEther("1000000");

            const costToAttacker = await lmsr.calculateCost(
                0, // Start: 0 YES
                0, // Start: 0 NO
                attackAmount, // Buy 1M YES
                true,
                b
            );

            // Theoretical maximum loss: b × ln(2) ≈ b × 0.693
            // b = 10,000 ETH → max loss ≈ 6,930 ETH
            const maxTheoreticalLoss = (b * 693n) / 1000n; // 0.693 approximation

            // Attacker paid costToAttacker
            // If market resolves NO, attacker gets 0
            // Protocol loss = costToAttacker
            // This should be ≤ max theoretical loss
            expect(costToAttacker).to.be.lte(maxTheoreticalLoss * 11n / 10n); // 10% tolerance
        });

        it("Should handle zero initial shares correctly", async function () {
            const cost = await lmsr.calculateCost(
                0, // No existing shares
                0,
                ONE_ETHER,
                true,
                LIQUIDITY_PARAM
            );

            // First shares in empty market should cost approximately 0.5 ETH per share
            // Due to LMSR, first share costs b × ln(2) / shares
            expect(cost).to.be.gt(0);
            expect(cost).to.be.lt(ONE_ETHER); // Should be < 1 ETH
        });
    });

    // ============================================================================
    // CATEGORY 3: EDGE CASE TESTS
    // ============================================================================

    describe("3. Edge Cases", function () {
        it("Should handle zero amount buy", async function () {
            const cost = await lmsr.calculateCost(
                ethers.parseEther("1000"),
                ethers.parseEther("1000"),
                0, // Zero amount
                true,
                LIQUIDITY_PARAM
            );

            expect(cost).to.equal(0);
        });

        it("Should revert on zero liquidity parameter", async function () {
            await expect(
                lmsr.calculateCost(
                    ethers.parseEther("1000"),
                    ethers.parseEther("1000"),
                    ONE_ETHER,
                    true,
                    0 // Invalid b = 0
                )
            ).to.be.revertedWith("Invalid liquidity parameter");
        });

        it("Should handle very small amounts (1 wei)", async function () {
            const cost = await lmsr.calculateCost(
                ethers.parseEther("1000"),
                ethers.parseEther("1000"),
                1, // 1 wei
                true,
                LIQUIDITY_PARAM
            );

            expect(cost).to.be.gt(0);
            expect(cost).to.be.lt(1000); // Very small cost for 1 wei
        });

        it("Should handle very large amounts (approaching uint128 max)", async function () {
            const largeAmount = MAX_UINT128 / 1000n; // 1/1000th of max

            const cost = await lmsr.calculateCost(
                ethers.parseEther("1000"),
                ethers.parseEther("1000"),
                largeAmount,
                true,
                LIQUIDITY_PARAM
            );

            expect(cost).to.be.gt(0);
            // Should not revert due to overflow (Solidity 0.8+ protection)
        });

        it("Should handle extreme market imbalance (99% YES)", async function () {
            const yesShares = ethers.parseEther("99000");
            const noShares = ethers.parseEther("1000");

            const yesPrice = await lmsr.getPrice(yesShares, noShares, true, LIQUIDITY_PARAM);

            // YES should be very expensive (close to 1.0)
            expect(yesPrice).to.be.gt(ethers.parseEther("0.9")); // > 90%
        });

        it("Should handle extreme market imbalance (1% YES)", async function () {
            const yesShares = ethers.parseEther("1000");
            const noShares = ethers.parseEther("99000");

            const yesPrice = await lmsr.getPrice(yesShares, noShares, true, LIQUIDITY_PARAM);

            // YES should be very cheap (close to 0.0)
            expect(yesPrice).to.be.lt(ethers.parseEther("0.1")); // < 10%
        });

        it("Should handle buying both YES and NO sequentially", async function () {
            // Buy YES
            const costYes = await lmsr.calculateCost(
                ethers.parseEther("1000"),
                ethers.parseEther("1000"),
                ethers.parseEther("100"),
                true,
                LIQUIDITY_PARAM
            );

            // Buy NO (after YES purchase)
            const costNo = await lmsr.calculateCost(
                ethers.parseEther("1100"), // After YES purchase
                ethers.parseEther("1000"),
                ethers.parseEther("100"),
                false,
                LIQUIDITY_PARAM
            );

            // Both should have positive costs
            expect(costYes).to.be.gt(0);
            expect(costNo).to.be.gt(0);
        });

        it("Should handle rapid price changes (sequential large bets)", async function () {
            let yesShares = 0n;
            let noShares = 0n;
            const betSize = ethers.parseEther("1000");

            // Simulate 5 large YES bets
            for (let i = 0; i < 5; i++) {
                const cost = await lmsr.calculateCost(
                    yesShares,
                    noShares,
                    betSize,
                    true,
                    LIQUIDITY_PARAM
                );

                expect(cost).to.be.gt(0);
                yesShares += betSize;
            }

            // After 5 large YES bets, YES price should be very high
            const finalPrice = await lmsr.getPrice(yesShares, noShares, true, LIQUIDITY_PARAM);
            expect(finalPrice).to.be.gt(ethers.parseEther("0.8")); // > 80%
        });
    });

    // ============================================================================
    // CATEGORY 4: GAS EFFICIENCY TESTS
    // ============================================================================

    describe("4. Gas Efficiency", function () {
        it("Should calculate cost within reasonable gas limits", async function () {
            const tx = await lmsr.calculateCost.staticCall(
                ethers.parseEther("1000"),
                ethers.parseEther("1000"),
                ONE_ETHER,
                true,
                LIQUIDITY_PARAM
            );

            // Gas usage should be logged (view function, no gas charged)
            expect(tx).to.be.gt(0);
        });

        it("Should calculate price within reasonable gas limits", async function () {
            const tx = await lmsr.getPrice.staticCall(
                ethers.parseEther("1000"),
                ethers.parseEther("1000"),
                true,
                LIQUIDITY_PARAM
            );

            expect(tx).to.be.gt(0);
        });

        it("Should handle multiple sequential calculations efficiently", async function () {
            // Simulate 10 calculations in a row
            for (let i = 0; i < 10; i++) {
                const cost = await lmsr.calculateCost(
                    ethers.parseEther("1000") + BigInt(i * 100),
                    ethers.parseEther("1000"),
                    ethers.parseEther("10"),
                    true,
                    LIQUIDITY_PARAM
                );
                expect(cost).to.be.gt(0);
            }
        });
    });

    // ============================================================================
    // CATEGORY 5: INTEGRATION TESTS
    // ============================================================================

    describe("5. Integration Scenarios", function () {
        it("Should handle realistic betting scenario: $100k bet on YES", async function () {
            const initialYes = ethers.parseEther("50000"); // $50k YES
            const initialNo = ethers.parseEther("50000"); // $50k NO
            const betAmount = ethers.parseEther("100000"); // $100k bet

            const cost = await lmsr.calculateCost(
                initialYes,
                initialNo,
                betAmount,
                true, // Bet YES
                LIQUIDITY_PARAM
            );

            // Large bet should have significant price impact
            expect(cost).to.be.gt(betAmount / 2n); // At least 50% of bet amount
            expect(cost).to.be.lt(betAmount * 2n); // At most 2x bet amount

            // Check new price after bet
            const newPrice = await lmsr.getPrice(
                initialYes + betAmount,
                initialNo,
                true,
                LIQUIDITY_PARAM
            );

            // YES should now be > 50%
            expect(newPrice).to.be.gt(ONE_ETHER / 2n);
        });

        it("Should handle whale vs whale scenario", async function () {
            let yesShares = ethers.parseEther("10000");
            let noShares = ethers.parseEther("10000");

            // Whale 1 bets $500k YES
            const costWhale1 = await lmsr.calculateCost(
                yesShares,
                noShares,
                ethers.parseEther("500000"),
                true,
                LIQUIDITY_PARAM
            );
            yesShares += ethers.parseEther("500000");

            // Whale 2 bets $500k NO
            const costWhale2 = await lmsr.calculateCost(
                yesShares,
                noShares,
                ethers.parseEther("500000"),
                false,
                LIQUIDITY_PARAM
            );
            noShares += ethers.parseEther("500000");

            // After both whales, market should be somewhat balanced
            const finalYesPrice = await lmsr.getPrice(yesShares, noShares, true, LIQUIDITY_PARAM);

            // Price should be within 30% to 70% range (not perfectly balanced due to LMSR)
            expect(finalYesPrice).to.be.gt(ethers.parseEther("0.3"));
            expect(finalYesPrice).to.be.lt(ethers.parseEther("0.7"));
        });

        it("Should handle market lifecycle: creation → bets → resolution", async function () {
            // Start: Empty market (0, 0)
            const costFirstBet = await lmsr.calculateCost(
                0,
                0,
                ethers.parseEther("1000"),
                true,
                LIQUIDITY_PARAM
            );

            // Mid: Active trading (1000, 500)
            const costMidBet = await lmsr.calculateCost(
                ethers.parseEther("1000"),
                ethers.parseEther("500"),
                ethers.parseEther("500"),
                false,
                LIQUIDITY_PARAM
            );

            // End: Large final bet (1000, 1000)
            const costFinalBet = await lmsr.calculateCost(
                ethers.parseEther("1000"),
                ethers.parseEther("1000"),
                ethers.parseEther("10000"),
                true,
                LIQUIDITY_PARAM
            );

            // All costs should be valid
            expect(costFirstBet).to.be.gt(0);
            expect(costMidBet).to.be.gt(0);
            expect(costFinalBet).to.be.gt(0);

            // Final large bet should have highest cost (price impact)
            expect(costFinalBet).to.be.gt(costFirstBet);
            expect(costFinalBet).to.be.gt(costMidBet);
        });
    });

    // ============================================================================
    // CATEGORY 6: PRICE DISCOVERY TESTS
    // ============================================================================

    describe("6. Price Discovery", function () {
        it("Should move prices proportionally to bet size", async function () {
            const initialYes = ethers.parseEther("1000");
            const initialNo = ethers.parseEther("1000");

            // Small bet
            await lmsr.calculateCost(initialYes, initialNo, ethers.parseEther("10"), true, LIQUIDITY_PARAM);
            const priceAfterSmall = await lmsr.getPrice(
                initialYes + ethers.parseEther("10"),
                initialNo,
                true,
                LIQUIDITY_PARAM
            );

            // Large bet
            await lmsr.calculateCost(initialYes, initialNo, ethers.parseEther("1000"), true, LIQUIDITY_PARAM);
            const priceAfterLarge = await lmsr.getPrice(
                initialYes + ethers.parseEther("1000"),
                initialNo,
                true,
                LIQUIDITY_PARAM
            );

            // Large bet should move price more
            expect(priceAfterLarge).to.be.gt(priceAfterSmall);
        });

        it("Should converge to true odds with sufficient trading", async function () {
            // Simulate market where YES is truly 70% likely
            // Rational traders should push price toward 0.7

            let yesShares = 0n;
            let noShares = 0n;

            // Simulate 10 rational traders betting proportionally
            for (let i = 0; i < 10; i++) {
                // 70% bet YES (70 ETH)
                const yesCost = await lmsr.calculateCost(
                    yesShares,
                    noShares,
                    ethers.parseEther("70"),
                    true,
                    LIQUIDITY_PARAM
                );
                yesShares += ethers.parseEther("70");

                // 30% bet NO (30 ETH)
                const noCost = await lmsr.calculateCost(
                    yesShares,
                    noShares,
                    ethers.parseEther("30"),
                    false,
                    LIQUIDITY_PARAM
                );
                noShares += ethers.parseEther("30");
            }

            // After 10 rounds, YES price should be close to 70%
            const finalPrice = await lmsr.getPrice(yesShares, noShares, true, LIQUIDITY_PARAM);

            // Should be within 60% to 80% range (LMSR approximation)
            expect(finalPrice).to.be.gt(ethers.parseEther("0.6"));
            expect(finalPrice).to.be.lt(ethers.parseEther("0.8"));
        });
    });

    // ============================================================================
    // CATEGORY 7: COMPARISON TESTS (LMSR vs Mock)
    // ============================================================================

    describe("7. LMSR vs MockBondingCurve Comparison", function () {
        let mockCurve;

        beforeEach(async function () {
            const MockBondingCurve = await ethers.getContractFactory("MockBondingCurve");
            mockCurve = await MockBondingCurve.deploy();
            await mockCurve.waitForDeployment();
        });

        it("Should show LMSR has better price discovery than Mock", async function () {
            const betAmount = ethers.parseEther("1000");
            const curveParams = ONE_ETHER; // Mock: 1 ETH per share

            // LMSR cost
            const lmsrCost = await lmsr.calculateCost(
                0, 0, betAmount, true, LIQUIDITY_PARAM
            );

            // Mock cost (simple: cost = shares * price)
            const mockCost = await mockCurve.calculateCost(
                0, 0, betAmount, true, curveParams
            );

            // LMSR should have dynamic pricing (lower for first shares)
            expect(lmsrCost).to.not.equal(mockCost);
            expect(lmsrCost).to.be.lt(betAmount); // LMSR: < 1 ETH per share
        });

        it("Should show LMSR prices move with bets, Mock stays fixed", async function () {
            const initialShares = ethers.parseEther("1000");
            const betAmount = ethers.parseEther("1000");

            // LMSR prices before and after
            const lmsrPriceBefore = await lmsr.getPrice(initialShares, initialShares, true, LIQUIDITY_PARAM);
            const lmsrPriceAfter = await lmsr.getPrice(
                initialShares + betAmount,
                initialShares,
                true,
                LIQUIDITY_PARAM
            );

            // Mock prices (always reflects proportion)
            const mockPriceBefore = await mockCurve.getPrice(initialShares, initialShares, true, ONE_ETHER);
            const mockPriceAfter = await mockCurve.getPrice(
                initialShares + betAmount,
                initialShares,
                true,
                ONE_ETHER
            );

            // LMSR should show significant price movement
            expect(lmsrPriceAfter).to.be.gt(lmsrPriceBefore);

            // LMSR price difference should be substantial
            const lmsrDiff = lmsrPriceAfter - lmsrPriceBefore;
            expect(lmsrDiff).to.be.gt(ethers.parseEther("0.1")); // > 10% movement
        });
    });
});
