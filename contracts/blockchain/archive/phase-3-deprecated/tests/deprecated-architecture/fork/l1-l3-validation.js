const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("🔒 L-1 & L-3 Security Fixes - Fork Validation", function() {
    let deployer, user1, user2;
    let registry, accessControl, params, factory, market;

    const TX_OPTIONS = {
        gasLimit: 500000,
        maxFeePerGas: ethers.parseUnits("100", "gwei"),
        maxPriorityFeePerGas: ethers.parseUnits("2", "gwei")
    };

    before(async function() {
        [deployer, user1, user2] = await ethers.getSigners();

        console.log("\n🚀 Deploying contracts for L-1 & L-3 validation...\n");

        // Deploy core contracts
        const VersionedRegistry = await ethers.getContractFactory("VersionedRegistry");
        registry = await VersionedRegistry.deploy();
        console.log("   ✅ VersionedRegistry:", await registry.getAddress());

        const AccessControlManager = await ethers.getContractFactory("AccessControlManager");
        accessControl = await AccessControlManager.deploy(await registry.getAddress());
        console.log("   ✅ AccessControlManager:", await accessControl.getAddress());

        const ParameterStorage = await ethers.getContractFactory("ParameterStorage");
        params = await ParameterStorage.deploy(await registry.getAddress());
        console.log("   ✅ ParameterStorage:", await params.getAddress());

        const FlexibleMarketFactory = await ethers.getContractFactory("FlexibleMarketFactory");
        factory = await FlexibleMarketFactory.deploy(
            await registry.getAddress(),
            ethers.parseEther("0.1")
        );
        console.log("   ✅ FlexibleMarketFactory:", await factory.getAddress());

        // Register contracts
        await registry.setContract(ethers.id("AccessControlManager"), await accessControl.getAddress(), 1);
        await registry.setContract(ethers.id("ParameterStorage"), await params.getAddress(), 1);
        await registry.setContract(ethers.id("FlexibleMarketFactory"), await factory.getAddress(), 1);

        // Setup roles
        await accessControl.grantRole(ethers.id("ADMIN_ROLE"), deployer.address);
        await accessControl.grantRole(ethers.id("RESOLVER_ROLE"), deployer.address);

        // Set parameters
        await params.setParameter(ethers.id("minimumBet"), ethers.parseEther("0.01"));

        // Create market
        const resolutionTime = (await time.latest()) + 86400;
        const marketConfig = {
            question: "L-1/L-3 Test Market",
            description: "Testing slippage protection and cancellation",
            resolutionTime: resolutionTime,
            creatorBond: ethers.parseEther("1"),
            category: ethers.id("test"),
            outcome1: "Yes",
            outcome2: "No"
        };

        await factory.createMarket(marketConfig, { value: ethers.parseEther("1"), ...TX_OPTIONS });
        const markets = await factory.getAllMarkets();

        const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
        market = PredictionMarket.attach(markets[0]);
        console.log("   ✅ Test Market:", await market.getAddress());
    });

    describe("🛡️  L-1: Slippage Protection", function() {
        it("Should allow bet with minExpectedOdds = 0 (no protection)", async function() {
            await expect(
                market.connect(user1).placeBet(1, 0, {
                    value: ethers.parseEther("1"),
                    ...TX_OPTIONS
                })
            ).to.emit(market, "BetPlaced");

            console.log("   ✅ Bet placed with no slippage protection");
        });

        it("Should allow bet when odds are favorable", async function() {
            // Require at least 1.0x odds (always acceptable)
            await expect(
                market.connect(user2).placeBet(2, 10000, {
                    value: ethers.parseEther("0.5"),
                    ...TX_OPTIONS
                })
            ).to.emit(market, "BetPlaced");

            console.log("   ✅ Bet placed with acceptable odds");
        });

        it("Should revert when odds below minimum expectation", async function() {
            // Unrealistic high odds requirement (100x) should fail
            await expect(
                market.connect(user1).placeBet(1, 1000000, {
                    value: ethers.parseEther("0.1"),
                    ...TX_OPTIONS
                })
            ).to.be.revertedWithCustomError(market, "SlippageTooHigh");

            console.log("   ✅ Slippage protection prevented unfavorable bet");
        });
    });

    describe("🚫 L-3: Market Cancellation", function() {
        let cancelMarket;

        before(async function() {
            // Create new market for cancellation test
            const resolutionTime = (await time.latest()) + 86400;
            const marketConfig = {
                question: "Cancellation Test Market",
                description: "Testing cancellation and refunds",
                resolutionTime: resolutionTime,
                creatorBond: ethers.parseEther("1"),
                category: ethers.id("test"),
                outcome1: "Yes",
                outcome2: "No"
            };

            await factory.createMarket(marketConfig, { value: ethers.parseEther("1"), ...TX_OPTIONS });
            const markets = await factory.getAllMarkets();

            const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
            cancelMarket = PredictionMarket.attach(markets[markets.length - 1]);
            console.log("\n   ✅ Cancellation test market created:", await cancelMarket.getAddress());

            // Place bets
            await cancelMarket.connect(user1).placeBet(1, 0, {
                value: ethers.parseEther("2"),
                ...TX_OPTIONS
            });
            await cancelMarket.connect(user2).placeBet(2, 0, {
                value: ethers.parseEther("1"),
                ...TX_OPTIONS
            });
            console.log("   ✅ Bets placed: User1=2 BASED, User2=1 BASED");
        });

        it("Should allow admin/resolver to cancel market", async function() {
            await expect(
                cancelMarket.connect(deployer).cancelMarket(TX_OPTIONS)
            ).to.emit(cancelMarket, "MarketResolved");

            const result = await cancelMarket.result();
            expect(result).to.equal(3); // CANCELLED = 3

            console.log("   ✅ Market cancelled by resolver");
        });

        it("Should allow users to claim refunds", async function() {
            const user1BalanceBefore = await ethers.provider.getBalance(user1.address);
            const user2BalanceBefore = await ethers.provider.getBalance(user2.address);

            // User1 claims refund
            await cancelMarket.connect(user1).claimRefund(TX_OPTIONS);
            console.log("   ✅ User1 claimed refund");

            // User2 claims refund
            await cancelMarket.connect(user2).claimRefund(TX_OPTIONS);
            console.log("   ✅ User2 claimed refund");

            // Verify refunds (accounting for gas)
            const user1BalanceAfter = await ethers.provider.getBalance(user1.address);
            const user2BalanceAfter = await ethers.provider.getBalance(user2.address);

            // Should have received close to original bet (minus gas)
            expect(user1BalanceAfter).to.be.closeTo(
                user1BalanceBefore + ethers.parseEther("2"),
                ethers.parseEther("0.01") // Gas tolerance
            );
            expect(user2BalanceAfter).to.be.closeTo(
                user2BalanceBefore + ethers.parseEther("1"),
                ethers.parseEther("0.01")
            );

            console.log("   ✅ Full refunds received by both users");
        });

        it("Should prevent double refund claims", async function() {
            await expect(
                cancelMarket.connect(user1).claimRefund(TX_OPTIONS)
            ).to.be.revertedWithCustomError(cancelMarket, "AlreadyClaimed");

            console.log("   ✅ Double refund prevented");
        });
    });
});
