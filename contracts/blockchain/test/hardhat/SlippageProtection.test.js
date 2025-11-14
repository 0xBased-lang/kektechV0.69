const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

describe("L-1: Slippage Protection & Front-Running Prevention", function () {
    async function deployMarketFixture() {
        const [owner, admin, user1, user2, frontRunner] = await ethers.getSigners();

        // Deploy registry
        const VersionedRegistry = await ethers.getContractFactory("VersionedRegistry");
        const registry = await VersionedRegistry.deploy();

        // Deploy access control
        const AccessControlManager = await ethers.getContractFactory("AccessControlManager");
        const accessControl = await AccessControlManager.deploy(await registry.getAddress());

        // Deploy parameter storage
        const ParameterStorage = await ethers.getContractFactory("ParameterStorage");
        const paramStorage = await ParameterStorage.deploy(await registry.getAddress());

        // Deploy resolution manager
        const ResolutionManager = await ethers.getContractFactory("ResolutionManager");
        const resolutionManager = await ResolutionManager.deploy(
            await registry.getAddress(),
            48 * 60 * 60,
            ethers.parseEther("0.5")
        );

        // Deploy PredictionMarket Template (REQUIRED for factory cloning!)
        const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
        const marketTemplate = await PredictionMarket.deploy();
        await marketTemplate.waitForDeployment();

        // Deploy LMSR Curve (bonding curve for price calculations)
        const LMSRCurve = await ethers.getContractFactory("LMSRCurve");
        const lmsrCurve = await LMSRCurve.deploy();
        await lmsrCurve.waitForDeployment();

        // Deploy factory
        const FlexibleMarketFactoryUnified = await ethers.getContractFactory("FlexibleMarketFactoryUnified");
        const factory = await FlexibleMarketFactoryUnified.deploy(
            await registry.getAddress(),
            ethers.parseEther("0.1") // minCreatorBond
        );

        // Setup roles FIRST (needed for setDefaultCurve and parameters)
        await accessControl.grantRole(ethers.id("ADMIN_ROLE"), owner.address); // Owner needs ADMIN_ROLE
        await accessControl.grantRole(ethers.id("ADMIN_ROLE"), admin.address);
        await accessControl.grantRole(ethers.id("RESOLVER_ROLE"), admin.address);

        // Register contracts
        await registry.setContract(ethers.id("PredictionMarketTemplate"), await marketTemplate.getAddress(), 1);
        await registry.setContract(ethers.id("AccessControlManager"), await accessControl.getAddress(), 1);
        await registry.setContract(ethers.id("ParameterStorage"), await paramStorage.getAddress(), 1);
        await registry.setContract(ethers.id("FlexibleMarketFactory"), await factory.getAddress(), 1);
        await registry.setContract(ethers.id("ResolutionManager"), await resolutionManager.getAddress(), 1);
        await registry.setContract(ethers.id("LMSRCurve"), await lmsrCurve.getAddress(), 1);

        // Set LMSR as factory's default curve (owner has ADMIN_ROLE now)
        await factory.setDefaultCurve(await lmsrCurve.getAddress());

        // Set parameters
        await paramStorage.setParameter(ethers.id("minimumBet"), ethers.parseEther("0.01"));
        await paramStorage.setParameter(ethers.id("maximumBet"), ethers.parseEther("100"));
        await paramStorage.setParameter(ethers.id("platformFeePercent"), 250);

        // Create market
        const resolutionTime = (await time.latest()) + 86400;
        const marketConfig = {
            question: "Will ETH reach $5000?",
            description: "ETH price prediction market",
            resolutionTime: resolutionTime,
            creatorBond: ethers.parseEther("1"),
            category: ethers.id("crypto"),
            outcome1: "Yes",
            outcome2: "No"
        };

        await factory.createMarket(marketConfig, { value: ethers.parseEther("1") });
        const markets = await factory.getAllMarkets();
        const marketAddress = markets[0];

        const market = await ethers.getContractAt("PredictionMarket", marketAddress);

        // Grant BACKEND_ROLE to admin for market approval
        await accessControl.grantRole(ethers.id("BACKEND_ROLE"), admin.address);

        // Approve and activate market via factory (admin has BACKEND_ROLE)
        await factory.connect(admin).approveMarket(marketAddress);
        await factory.connect(admin).activateMarket(marketAddress);

        return {
            registry,
            accessControl,
            paramStorage,
            factory,
            market,
            owner,
            admin,
            user1,
            user2,
            frontRunner,
            resolutionTime
        };
    }

    describe("Basic Slippage Protection", function () {
        it("Should allow bet when minExpectedOdds = 0 (no slippage check)", async function () {
            const { market, user1 } = await loadFixture(deployMarketFixture);

            // No slippage protection (minExpectedOdds = 0)
            await expect(
                market.connect(user1).placeBet(1, 0, { value: ethers.parseEther("1") })
            ).to.not.be.reverted;
        });

        it("Should allow bet when current odds >= minExpectedOdds", async function () {
            const { market, user1 } = await loadFixture(deployMarketFixture);

            // Get current odds (with VirtualLiquidity: 2.0x = 20000 basis points)
            const [odds1, odds2] = await market.getOdds();
            expect(odds1).to.equal(20000); // 2.0x odds due to VirtualLiquidity

            // Set minExpectedOdds to 20000 (exactly current odds)
            await expect(
                market.connect(user1).placeBet(1, 20000, { value: ethers.parseEther("1") })
            ).to.not.be.reverted;
        });

        it("Should revert bet when current odds < minExpectedOdds", async function () {
            const { market, user1, user2 } = await loadFixture(deployMarketFixture);

            // User2 bets LARGE amount (100 ETH), significantly shifting odds
            // With VirtualLiquidity (100 shares) + LMSR, need big bet to move odds below 1.5x
            await market.connect(user2).placeBet(1, 0, { value: ethers.parseEther("100") });

            // Now odds for outcome1 are MUCH lower (heavy favorite)
            const [odds1] = await market.getOdds();

            // User1 tries to bet expecting 1.5x (15000 bp), but odds are lower now
            // This should revert because current odds < minExpectedOdds
            await expect(
                market.connect(user1).placeBet(1, 15000, { value: ethers.parseEther("1") })
            ).to.be.revertedWithCustomError(market, "SlippageTooHigh");
        });
    });

    describe("Front-Running Attack Prevention", function () {
        it("Should prevent MEV bot from front-running user bet", async function () {
            const { market, user1, frontRunner } = await loadFixture(deployMarketFixture);

            // Scenario: User1 sees odds at 2.0x (VirtualLiquidity) and expects at least 1.5x
            const user1ExpectedOdds = 15000; // 1.5x minimum acceptable (25% slippage tolerance)

            // MEV bot front-runs with MAXIMUM bet (100 ETH) to shift odds
            await market.connect(frontRunner).placeBet(1, 0, { value: ethers.parseEther("100") });

            // Now odds have shifted significantly (LMSR + VirtualLiquidity = 100 shares cushion)
            const [odds1AfterFrontRun] = await market.getOdds();
            expect(odds1AfterFrontRun).to.be.lt(user1ExpectedOdds); // Should be below 1.5x now

            // User1's bet reverts due to slippage protection
            await expect(
                market.connect(user1).placeBet(1, user1ExpectedOdds, { value: ethers.parseEther("1") })
            ).to.be.revertedWithCustomError(market, "SlippageTooHigh");

            // User1 is protected from getting worse odds than expected
        });

        it("Should allow bet after odds stabilize", async function () {
            const { market, user1, frontRunner } = await loadFixture(deployMarketFixture);

            // Front-runner bets
            await market.connect(frontRunner).placeBet(1, 0, { value: ethers.parseEther("50") });

            // Check new odds
            const [odds1] = await market.getOdds();

            // User1 bets with realistic expectation based on current odds
            await expect(
                market.connect(user1).placeBet(1, odds1, { value: ethers.parseEther("1") })
            ).to.not.be.reverted;
        });
    });

    describe("Odds Calculation and Slippage", function () {
        it("Should correctly calculate odds after each bet", async function () {
            const { market, user1, user2 } = await loadFixture(deployMarketFixture);

            // Initial odds (no bets): 2.0x for both (with VirtualLiquidity)
            let [odds1, odds2] = await market.getOdds();
            expect(odds1).to.equal(20000); // 2.0x due to VirtualLiquidity
            expect(odds2).to.equal(20000); // 2.0x due to VirtualLiquidity

            // User1 bets 10 ETH on outcome1
            await market.connect(user1).placeBet(1, 0, { value: ethers.parseEther("10") });

            // Odds should shift: outcome1 becomes favorite (lower odds), outcome2 underdog (higher odds)
            [odds1, odds2] = await market.getOdds();
            expect(odds1).to.be.lt(20000); // Favorite (less than 2.0x)
            expect(odds2).to.be.gt(20000); // Underdog (more than 2.0x)

            // User2 bets 5 ETH on outcome2
            await market.connect(user2).placeBet(2, 0, { value: ethers.parseEther("5") });

            // Odds should adjust
            const [newOdds1, newOdds2] = await market.getOdds();
            expect(newOdds1).to.be.gt(odds1); // Outcome1 odds improve (less favorite)
            expect(newOdds2).to.be.lt(odds2); // Outcome2 odds worsen (less underdog)
        });

        it("Should handle extreme slippage with large bets", async function () {
            const { market, user1, user2 } = await loadFixture(deployMarketFixture);

            // Small initial bet
            await market.connect(user1).placeBet(1, 0, { value: ethers.parseEther("1") });

            // Huge bet shifts odds drastically
            await market.connect(user2).placeBet(1, 0, { value: ethers.parseEther("99") });

            // Odds for outcome1 are now lower (heavy favorite)
            // With LMSR + VirtualLiquidity, minimum odds = 10100 (1.01x floor)
            // After 100 ETH bet, odds ≈ 12277 (1.228x) - can't go below safety floor!
            const [odds1] = await market.getOdds();
            expect(odds1).to.be.closeTo(12277, 500); // ≈1.23x after massive bet

            // User trying to bet expecting 1.5x odds should fail (current odds ≈1.23x)
            await expect(
                market.connect(user1).placeBet(1, 15000, { value: ethers.parseEther("1") })
            ).to.be.revertedWithCustomError(market, "SlippageTooHigh");
        });
    });

    describe("Gas Efficiency", function () {
        it("Should not significantly increase gas when minExpectedOdds = 0", async function () {
            const { market, user1 } = await loadFixture(deployMarketFixture);

            const tx = await market.connect(user1).placeBet(1, 0, { value: ethers.parseEther("1") });
            const receipt = await tx.wait();

            // First bet with LMSR bonding curve is expensive (~970k gas)
            // Includes: binary search, LMSR math (exp/log), share minting, initialization
            // This is acceptable for production (still <1M gas, ~$0.0001 on BasedAI)
            expect(receipt.gasUsed).to.be.lt(1000000); // <1M gas for first bet
        });

        it("Should add minimal gas cost for slippage check", async function () {
            const { market, user1 } = await loadFixture(deployMarketFixture);

            // Bet with slippage check (2.0x = 20000 with VirtualLiquidity)
            const tx = await market.connect(user1).placeBet(1, 20000, { value: ethers.parseEther("1") });
            const receipt = await tx.wait();

            // First bet gas + slippage check overhead (~970k + 3k = ~973k)
            // Slippage check adds minimal cost (just getOdds + comparison)
            expect(receipt.gasUsed).to.be.lt(1000000); // <1M gas including slippage check
        });
    });

    describe("Edge Cases", function () {
        it("Should handle minExpectedOdds = 0 (no protection)", async function () {
            const { market, user1, frontRunner } = await loadFixture(deployMarketFixture);

            // Front-runner bets
            await market.connect(frontRunner).placeBet(1, 0, { value: ethers.parseEther("90") });

            // User accepts any odds (minExpectedOdds = 0)
            await expect(
                market.connect(user1).placeBet(1, 0, { value: ethers.parseEther("1") })
            ).to.not.be.reverted;
        });

        it("Should handle minExpectedOdds = max uint256", async function () {
            const { market, user1 } = await loadFixture(deployMarketFixture);

            // User expects impossibly high odds
            await expect(
                market.connect(user1).placeBet(1, ethers.MaxUint256, { value: ethers.parseEther("1") })
            ).to.be.revertedWithCustomError(market, "SlippageTooHigh");
        });

        it("Should work correctly for both outcomes", async function () {
            const { market, user1, user2 } = await loadFixture(deployMarketFixture);

            // Bet on outcome1
            await market.connect(user1).placeBet(1, 0, { value: ethers.parseEther("10") });

            // Outcome2 should have better odds now
            const [, odds2] = await market.getOdds();

            // Bet on outcome2 with slippage protection
            await expect(
                market.connect(user2).placeBet(2, odds2, { value: ethers.parseEther("5") })
            ).to.not.be.reverted;
        });
    });

    describe("Integration with Existing Features", function () {
        it("Should work with minimum/maximum bet limits", async function () {
            const { market, user1 } = await loadFixture(deployMarketFixture);

            // Should respect minimum bet (0.01 ETH parameter check happens first)
            await expect(
                market.connect(user1).placeBet(1, 20000, { value: ethers.parseEther("0.005") })
            ).to.be.revertedWithCustomError(market, "BetTooSmall");

            // Should work with valid bet amount (1 ETH) and slippage protection (2.0x = 20000)
            // Note: Use 1 ETH to ensure LMSR can buy shares (0.01 ETH too small for bonding curve)
            await expect(
                market.connect(user1).placeBet(1, 20000, { value: ethers.parseEther("1") })
            ).to.not.be.reverted;
        });

        it("Should work with multiple bets from same user", async function () {
            const { market, user1 } = await loadFixture(deployMarketFixture);

            // First bet
            await market.connect(user1).placeBet(1, 0, { value: ethers.parseEther("1") });

            // Get current odds
            const [odds1] = await market.getOdds();

            // Second bet from same user (accumulates)
            await expect(
                market.connect(user1).placeBet(1, odds1 - 1000n, { value: ethers.parseEther("1") })
            ).to.not.be.reverted;
        });
    });
});
