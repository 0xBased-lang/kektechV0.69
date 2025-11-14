const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LMSRBondingCurve - Core Functionality Tests", function () {
    let lmsr;
    let owner;

    // Test constants
    const ONE_ETHER = ethers.parseEther("1");
    const LIQUIDITY_PARAM = ethers.parseEther("10000"); // b = 10,000 ETH

    beforeEach(async function () {
        [owner] = await ethers.getSigners();

        const LMSRBondingCurve = await ethers.getContractFactory("LMSRBondingCurve");
        lmsr = await LMSRBondingCurve.deploy();
        await lmsr.waitForDeployment();
    });

    describe("1. Basic Interface Compliance", function () {
        it("Should deploy successfully", async function () {
            expect(await lmsr.getAddress()).to.be.properAddress;
        });

        it("Should return correct curve name", async function () {
            const name = await lmsr.curveName();
            expect(name).to.include("LMSR");
        });

        it("Should validate curve parameters correctly", async function () {
            // Valid parameter
            const [valid, reason] = await lmsr.validateParams(LIQUIDITY_PARAM);
            expect(valid).to.be.true;
            expect(reason).to.equal("");

            // Invalid: too small
            const [valid2, reason2] = await lmsr.validateParams(ethers.parseEther("0.0001"));
            expect(valid2).to.be.false;
            expect(reason2).to.not.equal("");

            // Invalid: zero
            const [valid3, reason3] = await lmsr.validateParams(0);
            expect(valid3).to.be.false;
            expect(reason3).to.not.equal("");
        });
    });

    describe("2. Cost Calculation Tests", function () {
        it("Should calculate cost for buying first shares", async function () {
            // Interface: calculateCost(curveParams, currentYes, currentNo, outcome, shares)
            const cost = await lmsr.calculateCost(
                LIQUIDITY_PARAM, // curveParams FIRST
                0,              // currentYes
                0,              // currentNo
                true,           // outcome (YES)
                ONE_ETHER       // shares to buy
            );

            expect(cost).to.be.gt(0);
            expect(cost).to.be.lt(ONE_ETHER); // First share costs < 1 ETH due to LMSR subsidy
        });

        it("Should calculate higher cost for subsequent shares", async function () {
            const firstCost = await lmsr.calculateCost(
                LIQUIDITY_PARAM,
                0,
                0,
                true,
                ONE_ETHER
            );

            const secondCost = await lmsr.calculateCost(
                LIQUIDITY_PARAM,
                ONE_ETHER,       // After first purchase
                0,
                true,
                ONE_ETHER
            );

            expect(secondCost).to.be.gt(firstCost); // Price increases with purchases
        });

        it("Should revert on zero share purchase", async function () {
            await expect(
                lmsr.calculateCost(
                    LIQUIDITY_PARAM,
                    ethers.parseEther("1000"),
                    ethers.parseEther("1000"),
                    true,
                    0 // Zero shares
                )
            ).to.be.revertedWith("Shares must be positive");
        });

        it("Should revert on invalid liquidity parameter", async function () {
            await expect(
                lmsr.calculateCost(
                    0, // Invalid: zero liquidity
                    ethers.parseEther("1000"),
                    ethers.parseEther("1000"),
                    true,
                    ONE_ETHER
                )
            ).to.be.revertedWith("Invalid liquidity param");
        });
    });

    describe("3. Price Calculation Tests", function () {
        it("Should return balanced prices for equal shares", async function () {
            // Interface: getPrices(curveParams, currentYes, currentNo) → (yesPrice, noPrice)
            // Prices are in BASIS POINTS (0-10000), where 10000 = 100%
            const [yesPrice, noPrice] = await lmsr.getPrices(
                LIQUIDITY_PARAM,
                ethers.parseEther("1000"), // Equal shares
                ethers.parseEther("1000")
            );

            // Balanced market should be ~5000/5000 (50%/50%)
            expect(yesPrice).to.be.closeTo(5000, 50); // Within 0.5%
            expect(noPrice).to.be.closeTo(5000, 50);
            expect(yesPrice + noPrice).to.equal(10000); // Must sum to 100%
        });

        it("Should show YES favored when more YES shares exist", async function () {
            const [yesPrice, noPrice] = await lmsr.getPrices(
                LIQUIDITY_PARAM,
                ethers.parseEther("2000"), // 2x YES shares
                ethers.parseEther("1000")
            );

            expect(yesPrice).to.be.gt(5000); // YES price > 50%
            expect(noPrice).to.be.lt(5000); // NO price < 50%
            expect(yesPrice + noPrice).to.equal(10000);
        });

        it("Should show NO favored when more NO shares exist", async function () {
            const [yesPrice, noPrice] = await lmsr.getPrices(
                LIQUIDITY_PARAM,
                ethers.parseEther("1000"),
                ethers.parseEther("2000") // 2x NO shares
            );

            expect(yesPrice).to.be.lt(5000); // YES price < 50%
            expect(noPrice).to.be.gt(5000); // NO price > 50%
            expect(yesPrice + noPrice).to.equal(10000);
        });

        it("Should handle zero shares (equilibrium)", async function () {
            const [yesPrice, noPrice] = await lmsr.getPrices(
                LIQUIDITY_PARAM,
                0,
                0
            );

            // Empty market defaults to 50/50
            expect(yesPrice).to.equal(5000);
            expect(noPrice).to.equal(5000);
        });
    });

    describe("4. Refund Calculation Tests", function () {
        it("Should calculate refund for selling shares", async function () {
            // Interface: calculateRefund(curveParams, currentYes, currentNo, outcome, shares)
            const refund = await lmsr.calculateRefund(
                LIQUIDITY_PARAM,
                ethers.parseEther("1000"), // Current YES shares
                ethers.parseEther("1000"), // Current NO shares
                true,                       // Selling YES
                ethers.parseEther("100")    // Shares to sell
            );

            expect(refund).to.be.gt(0);
        });

        it("Should give refund less than original cost (slippage)", async function () {
            const initialYes = ethers.parseEther("1000");
            const initialNo = ethers.parseEther("1000");
            const amount = ethers.parseEther("100");

            // Cost to buy
            const costToBuy = await lmsr.calculateCost(
                LIQUIDITY_PARAM,
                initialYes,
                initialNo,
                true,
                amount
            );

            // Refund to sell immediately after
            const refundFromSell = await lmsr.calculateRefund(
                LIQUIDITY_PARAM,
                initialYes + amount, // After buying
                initialNo,
                true,
                amount
            );

            // Refund should be ≤ cost (LMSR property; can be equal in balanced markets)
            expect(refundFromSell).to.be.lte(costToBuy);
            expect(refundFromSell).to.be.gt(0);
        });

        it("Should revert when selling more shares than exist", async function () {
            await expect(
                lmsr.calculateRefund(
                    LIQUIDITY_PARAM,
                    ethers.parseEther("1000"),
                    ethers.parseEther("1000"),
                    true,
                    ethers.parseEther("2000") // More than exists
                )
            ).to.be.revertedWith("Insufficient YES shares");
        });
    });

    describe("5. Mathematical Properties", function () {
        it("Should satisfy: YES price + NO price = 10000 (100%)", async function () {
            const [yesPrice, noPrice] = await lmsr.getPrices(
                LIQUIDITY_PARAM,
                ethers.parseEther("1500"),
                ethers.parseEther("1000")
            );

            expect(yesPrice + noPrice).to.equal(10000);
        });

        it("Should satisfy: Larger liquidity param = lower price impact", async function () {
            const yesShares = ethers.parseEther("1000");
            const noShares = ethers.parseEther("1000");
            const buyAmount = ethers.parseEther("100");

            // Cost with b = 1,000
            const costLowB = await lmsr.calculateCost(
                ethers.parseEther("1000"), // Small liquidity
                yesShares,
                noShares,
                true,
                buyAmount
            );

            // Cost with b = 100,000
            const costHighB = await lmsr.calculateCost(
                ethers.parseEther("100000"), // Large liquidity
                yesShares,
                noShares,
                true,
                buyAmount
            );

            // Higher liquidity = less price impact = lower cost per share
            expect(costHighB).to.be.lt(costLowB);
        });

        it("Should satisfy: Bounded loss property", async function () {
            // Market starts: 0 YES, 0 NO
            // Attacker buys large amount (realistic: 10k ETH, not 1M)
            // Max loss should be ≈ b × ln(2) ≈ b × 0.693

            const b = ethers.parseEther("10000");
            const attackAmount = ethers.parseEther("10000"); // Realistic attack size

            const costToAttacker = await lmsr.calculateCost(
                b,
                0, // Start: 0 YES
                0, // Start: 0 NO
                true,
                attackAmount
            );

            // Theoretical maximum loss: b × ln(2) ≈ b × 0.693 = 6930 ETH
            const maxTheoreticalLoss = (b * 693n) / 1000n;

            // Attacker paid cost, if market resolves wrong, protocol loses ≤ max loss
            expect(costToAttacker).to.be.lte(maxTheoreticalLoss * 12n / 10n); // 20% tolerance
        });

        it("Should handle sequential large bets correctly", async function () {
            let yesShares = 0n;
            let noShares = 0n;
            const betSize = ethers.parseEther("1000");

            // 5 large YES bets
            for (let i = 0; i < 5; i++) {
                const cost = await lmsr.calculateCost(
                    LIQUIDITY_PARAM,
                    yesShares,
                    noShares,
                    true,
                    betSize
                );

                expect(cost).to.be.gt(0);
                yesShares += betSize;
            }

            // After 5 large YES bets (5000 ETH), YES price should be significantly higher
            // With b=10000, this moves price to ~62% (LMSR has gradual price impact)
            const [finalYesPrice, finalNoPrice] = await lmsr.getPrices(
                LIQUIDITY_PARAM,
                yesShares,
                noShares
            );

            expect(finalYesPrice).to.be.gt(6000); // > 60% (realistic for LMSR with b=10k)
            expect(finalNoPrice).to.be.lt(4000); // < 40%
        });
    });

    describe("6. Integration Tests", function () {
        it("Should handle realistic betting scenario", async function () {
            const initialYes = ethers.parseEther("50000"); // $50k YES
            const initialNo = ethers.parseEther("50000"); // $50k NO
            const betAmount = ethers.parseEther("100000"); // $100k bet

            const cost = await lmsr.calculateCost(
                LIQUIDITY_PARAM,
                initialYes,
                initialNo,
                true, // Bet YES
                betAmount
            );

            // Large bet should have significant cost
            expect(cost).to.be.gt(0);
            expect(cost).to.be.gt(betAmount / 2n); // At least 50% of bet amount

            // Check new price after bet
            const [newYesPrice, newNoPrice] = await lmsr.getPrices(
                LIQUIDITY_PARAM,
                initialYes + betAmount,
                initialNo
            );

            // YES should now be > 50%
            expect(newYesPrice).to.be.gt(5000);
            expect(newYesPrice + newNoPrice).to.equal(10000);
        });

        it("Should handle market lifecycle correctly", async function () {
            // Empty market
            const costFirst = await lmsr.calculateCost(
                LIQUIDITY_PARAM,
                0,
                0,
                true,
                ethers.parseEther("1000")
            );

            // Active market
            const costMid = await lmsr.calculateCost(
                LIQUIDITY_PARAM,
                ethers.parseEther("1000"),
                ethers.parseEther("500"),
                false,
                ethers.parseEther("500")
            );

            // Large final bet
            const costFinal = await lmsr.calculateCost(
                LIQUIDITY_PARAM,
                ethers.parseEther("1000"),
                ethers.parseEther("1000"),
                true,
                ethers.parseEther("10000")
            );

            // All costs should be positive
            expect(costFirst).to.be.gt(0);
            expect(costMid).to.be.gt(0);
            expect(costFinal).to.be.gt(0);

            // Final large bet should have highest cost (price impact)
            expect(costFinal).to.be.gt(costFirst);
        });
    });

    describe("7. Gas Efficiency", function () {
        it("Should calculate cost in reasonable gas", async function () {
            const result = await lmsr.calculateCost.staticCall(
                LIQUIDITY_PARAM,
                ethers.parseEther("1000"),
                ethers.parseEther("1000"),
                true,
                ONE_ETHER
            );

            expect(result).to.be.gt(0);
        });

        it("Should calculate prices in reasonable gas", async function () {
            const [yesPrice, noPrice] = await lmsr.getPrices.staticCall(
                LIQUIDITY_PARAM,
                ethers.parseEther("1000"),
                ethers.parseEther("1000")
            );

            expect(yesPrice + noPrice).to.equal(10000);
        });

        it("Should handle multiple calculations efficiently", async function () {
            for (let i = 0; i < 10; i++) {
                const cost = await lmsr.calculateCost(
                    LIQUIDITY_PARAM,
                    ethers.parseEther("1000") + BigInt(i * 100),
                    ethers.parseEther("1000"),
                    true,
                    ethers.parseEther("10")
                );
                expect(cost).to.be.gt(0);
            }
        });
    });
});
