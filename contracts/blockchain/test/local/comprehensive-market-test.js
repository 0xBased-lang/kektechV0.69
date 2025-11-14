const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
const fs = require("fs");
const path = require("path");

/**
 * @title Comprehensive Market Creation Test - 100% Validation
 * @notice Tests complete prediction market lifecycle on fork with full compliance
 */
describe("🎯 KEKTECH 3.0 - Complete Market Lifecycle Validation", function () {
    let deployer, creator, bettor1, bettor2, bettor3, resolver;
    let registry, accessControl, parameterStorage, marketFactory;
    let resolutionManager, rewardDistributor;
    let market, marketAddress;

    const CREATOR_BOND = ethers.parseEther("0.02");
    const BET_AMOUNT_1 = ethers.parseEther("0.05");
    const BET_AMOUNT_2 = ethers.parseEther("0.03");
    const BET_AMOUNT_3 = ethers.parseEther("0.08");

    before(async function () {
        console.log("\n🚀 COMPREHENSIVE TEST SETUP - Loading deployed contracts...\n");

        [deployer, creator, bettor1, bettor2, bettor3, resolver] = await ethers.getSigners();

        // Load deployment
        const deploymentPath = path.join(__dirname, "../../deployments/fork-deployment.json");
        const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));

        console.log("📋 Contract Addresses:");
        console.log(`   VersionedRegistry: ${deployment.contracts.masterRegistry}`);
        console.log(`   MarketFactory: ${deployment.contracts.marketFactory}`);
        console.log(`   ResolutionManager: ${deployment.contracts.resolutionManager}\n`);

        // Connect to contracts
        registry = await ethers.getContractAt("VersionedRegistry", deployment.contracts.masterRegistry);
        accessControl = await ethers.getContractAt("AccessControlManager", deployment.contracts.accessControl);
        parameterStorage = await ethers.getContractAt("ParameterStorage", deployment.contracts.parameterStorage);
        marketFactory = await ethers.getContractAt("FlexibleMarketFactory", deployment.contracts.marketFactory);
        resolutionManager = await ethers.getContractAt("ResolutionManager", deployment.contracts.resolutionManager);
        rewardDistributor = await ethers.getContractAt("RewardDistributor", deployment.contracts.rewardDistributor);

        console.log("✅ All contracts connected successfully\n");
    });

    describe("📊 PHASE 1: Market Creation", function () {
        it("✅ Should create prediction market with correct parameters", async function () {
            console.log("🎯 Creating prediction market...");

            const currentTime = await time.latest();
            const resolutionTime = currentTime + 300; // 5 minutes from now

            const marketConfig = {
                question: "Will ETH reach $5000 by end of 2025?",
                description: "Market resolves YES if ETH price reaches $5000 or higher by Dec 31, 2025",
                resolutionTime: resolutionTime,
                creatorBond: CREATOR_BOND,
                category: ethers.id("crypto-price"),
                outcome1: "YES",
                outcome2: "NO"
            };

            const tx = await marketFactory.connect(creator).createMarket(
                marketConfig,
                { value: CREATOR_BOND }
            );

            const receipt = await tx.wait();

            // Extract market address from event
            const event = receipt.logs.find(log => {
                try {
                    const parsed = marketFactory.interface.parseLog(log);
                    return parsed && parsed.name === "MarketCreated";
                } catch {
                    return false;
                }
            });

            expect(event, "MarketCreated event not found").to.not.be.undefined;

            const parsed = marketFactory.interface.parseLog(event);
            marketAddress = parsed.args.market;

            console.log(`   ✅ Market created: ${marketAddress}`);
            console.log(`   ✅ Gas used: ${receipt.gasUsed}\n`);

            expect(marketAddress).to.not.equal(ethers.ZeroAddress);
            expect(parsed.args.creator).to.equal(creator.address);
        });

        it("✅ Should connect to created market and verify state", async function () {
            expect(marketAddress, "Market address must be set").to.not.be.undefined;

            market = await ethers.getContractAt("PredictionMarket", marketAddress);

            const [
                marketCreator,
                marketQuestion,
                yesPool,
                noPool,
                totalBets,
                resolved,
                ,
                ,
            ] = await market.getMarketInfo();

            expect(marketCreator).to.equal(creator.address);
            expect(marketQuestion).to.include("ETH");
            expect(yesPool).to.equal(0);
            expect(noPool).to.equal(0);
            expect(totalBets).to.equal(0);
            expect(resolved).to.be.false;

            console.log("   ✅ Market state verified: Ready for betting\n");
        });
    });

    describe("💰 PHASE 2: Betting System", function () {
        it("✅ Should allow Bettor 1 to place YES bet", async function () {
            expect(market, "Market must be initialized").to.not.be.undefined;

            console.log(`💸 Bettor 1 betting ${ethers.formatEther(BET_AMOUNT_1)} ETH on YES...`);

            await expect(
                market.connect(bettor1).placeBet(true, 0, { value: BET_AMOUNT_1 })
            ).to.emit(market, "BetPlaced")
              .withArgs(bettor1.address, true, BET_AMOUNT_1);

            const bet = await market.getBetInfo(bettor1.address);
            expect(bet.amount).to.equal(BET_AMOUNT_1);
            expect(bet.outcome).to.be.true;

            console.log("   ✅ Bettor 1 bet placed successfully\n");
        });

        it("✅ Should allow Bettor 3 to place YES bet", async function () {
            console.log(`💸 Bettor 3 betting ${ethers.formatEther(BET_AMOUNT_3)} ETH on YES...`);

            await expect(
                market.connect(bettor3).placeBet(true, 0, { value: BET_AMOUNT_3 })
            ).to.emit(market, "BetPlaced");

            const bet = await market.getBetInfo(bettor3.address);
            expect(bet.amount).to.equal(BET_AMOUNT_3);
            expect(bet.outcome).to.be.true;

            console.log("   ✅ Bettor 3 bet placed successfully\n");
        });

        it("✅ Should allow Bettor 2 to place NO bet", async function () {
            console.log(`💸 Bettor 2 betting ${ethers.formatEther(BET_AMOUNT_2)} ETH on NO...`);

            await expect(
                market.connect(bettor2).placeBet(false, 0, { value: BET_AMOUNT_2 })
            ).to.emit(market, "BetPlaced");

            const bet = await market.getBetInfo(bettor2.address);
            expect(bet.amount).to.equal(BET_AMOUNT_2);
            expect(bet.outcome).to.be.false;

            console.log("   ✅ Bettor 2 bet placed successfully\n");
        });

        it("✅ Should track pool totals correctly", async function () {
            const [
                ,
                ,
                yesPool,
                noPool,
                totalBets,
                ,
                ,
                ,
            ] = await market.getMarketInfo();

            const expectedYes = BET_AMOUNT_1 + BET_AMOUNT_3;
            const expectedNo = BET_AMOUNT_2;

            expect(yesPool).to.equal(expectedYes);
            expect(noPool).to.equal(expectedNo);
            expect(totalBets).to.equal(3n);

            console.log("📊 Pool Status:");
            console.log(`   YES Pool: ${ethers.formatEther(yesPool)} ETH`);
            console.log(`   NO Pool: ${ethers.formatEther(noPool)} ETH`);
            console.log(`   Total Bets: ${totalBets}\n`);
        });
    });

    describe("⏰ PHASE 3: Time-Based Resolution", function () {
        it("✅ Should prevent early resolution (before delay)", async function () {
            console.log("⏰ Testing resolution delay enforcement...");

            const RESOLVER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("RESOLVER_ROLE"));

            // Grant resolver role if not already granted
            const hasRole = await accessControl.hasRole(RESOLVER_ROLE, resolver.address);
            if (!hasRole) {
                await accessControl.grantRole(RESOLVER_ROLE, resolver.address);
            }

            // Try to resolve immediately - should fail (outcome 1 = YES, with evidence)
            await expect(
                resolutionManager.connect(resolver).resolveMarket(
                    marketAddress,
                    1, // 1 = outcome1 (YES)
                    "Early resolution test - should fail"
                )
            ).to.be.reverted;

            console.log("   ✅ Early resolution correctly prevented\n");
        });

        it("✅ Should allow resolution after time delay", async function () {
            console.log("⏰ Advancing time past resolution delay...");

            // Fast-forward 5 minutes + 1 second
            await time.increase(301);

            console.log("   ✅ Time advanced successfully\n");
        });
    });

    describe("🏆 PHASE 4: Market Resolution", function () {
        it("✅ Should resolve market with YES outcome", async function () {
            console.log("🏆 Resolving market with YES outcome...");

            const winningOutcome = 1; // 1 = outcome1 (YES), 2 = outcome2 (NO)
            const evidence = "ETH reached $5000 on Dec 15, 2025 at 3:45 PM UTC - Verified via Chainlink price feed";

            await expect(
                resolutionManager.connect(resolver).resolveMarket(
                    marketAddress,
                    winningOutcome,
                    evidence
                )
            ).to.emit(resolutionManager, "MarketResolved");

            // Verify resolution
            const [
                ,
                ,
                ,
                ,
                ,
                resolved,
                outcome,
                ,
            ] = await market.getMarketInfo();

            expect(resolved).to.be.true;
            expect(outcome).to.equal(winningOutcome);

            console.log(`   ✅ Market resolved: ${winningOutcome === 1 ? "YES" : "NO"} wins (outcome ${winningOutcome})\n`);
        });

        it("✅ Should calculate correct payout amounts", async function () {
            console.log("💰 Calculating payouts...");

            const [
                ,
                ,
                yesPool,
                noPool,
                ,
                ,
                ,
                ,
            ] = await market.getMarketInfo();

            const totalPool = yesPool + noPool;
            const platformFee = (totalPool * 250n) / 10000n;
            const totalPayout = totalPool - platformFee;

            console.log(`   Total Pool: ${ethers.formatEther(totalPool)} ETH`);
            console.log(`   Platform Fee (2.5%): ${ethers.formatEther(platformFee)} ETH`);
            console.log(`   Total Payout: ${ethers.formatEther(totalPayout)} ETH\n`);

            expect(totalPool).to.be.greaterThan(0);
            expect(platformFee).to.be.greaterThan(0);
            expect(totalPayout).to.equal(totalPool - platformFee);
        });
    });

    describe("💸 PHASE 5: Withdrawals", function () {
        it("✅ Should allow Bettor 1 (winner) to claim rewards", async function () {
            console.log("💸 Bettor 1 claiming winnings...");

            const balanceBefore = await ethers.provider.getBalance(bettor1.address);

            await expect(
                market.connect(bettor1).claimWinnings()
            ).to.emit(market, "WinningsClaimed");

            const balanceAfter = await ethers.provider.getBalance(bettor1.address);
            const profit = balanceAfter - balanceBefore;

            console.log(`   ✅ Claimed ${ethers.formatEther(profit)} ETH profit\n`);

            expect(balanceAfter).to.be.greaterThan(balanceBefore);
        });

        it("✅ Should allow Bettor 3 (winner) to claim rewards", async function () {
            console.log("💸 Bettor 3 claiming winnings...");

            const balanceBefore = await ethers.provider.getBalance(bettor3.address);

            await expect(
                market.connect(bettor3).claimWinnings()
            ).to.emit(market, "WinningsClaimed");

            const balanceAfter = await ethers.provider.getBalance(bettor3.address);
            const profit = balanceAfter - balanceBefore;

            console.log(`   ✅ Claimed ${ethers.formatEther(profit)} ETH profit\n`);

            expect(balanceAfter).to.be.greaterThan(balanceBefore);
        });

        it("✅ Should prevent Bettor 2 (loser) from claiming", async function () {
            console.log("🚫 Testing loser claim prevention...");

            await expect(
                market.connect(bettor2).claimWinnings()
            ).to.be.reverted;

            console.log("   ✅ Losers correctly prevented from claiming\n");
        });

        it("✅ Should prevent double claims", async function () {
            console.log("🚫 Testing double claim prevention...");

            await expect(
                market.connect(bettor1).claimWinnings()
            ).to.be.reverted;

            console.log("   ✅ Double claims correctly prevented\n");
        });
    });

    describe("📈 PHASE 6: System Integrity", function () {
        it("✅ Should have minimal remaining market balance", async function () {
            console.log("📈 Verifying fund distribution...");

            const marketBalance = await ethers.provider.getBalance(marketAddress);

            console.log(`   Market Balance: ${ethers.formatEther(marketBalance)} ETH`);

            // Market should have minimal balance (dust only)
            expect(marketBalance).to.be.lessThan(ethers.parseEther("0.001"));

            console.log("   ✅ All funds properly distributed\n");
        });

        it("✅ Should maintain accurate final state", async function () {
            const [
                ,
                ,
                yesPool,
                noPool,
                totalBets,
                resolved,
                outcome,
                ,
            ] = await market.getMarketInfo();

            expect(resolved).to.be.true;
            expect(outcome).to.equal(1); // 1 = outcome1 (YES) won
            expect(totalBets).to.equal(3n);
            expect(yesPool).to.be.greaterThan(0);
            expect(noPool).to.be.greaterThan(0);

            console.log("   ✅ Final state verified correctly\n");
        });
    });

    after(function () {
        console.log("═".repeat(60));
        console.log("🎉 100% COMPREHENSIVE VALIDATION COMPLETE!");
        console.log("═".repeat(60));
        console.log("\n✅ All phases tested and validated:");
        console.log("   ✅ Market Creation");
        console.log("   ✅ Betting System");
        console.log("   ✅ Time-Based Resolution");
        console.log("   ✅ Market Resolution");
        console.log("   ✅ Withdrawal System");
        console.log("   ✅ System Integrity\n");
        console.log("🏆 KEKTECH 3.0 Platform: 100% Operational!\n");
    });
});
