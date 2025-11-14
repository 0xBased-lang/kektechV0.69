const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

/**
 * HIGH-001: Whale Manipulation Protection Tests
 *
 * Tests for minimum and maximum bet limits that prevent:
 * - Whale manipulation attacks (large bets)
 * - Dust spam attacks (tiny bets)
 *
 * Coverage:
 * - Minimum bet enforcement (0.001 ETH)
 * - Maximum bet enforcement (20% of pool)
 * - Progressive scaling
 * - Edge cases
 */
describe("HIGH-001: Whale Manipulation Protection", function () {
    async function deployFixture() {
        const [owner, admin, resolver, whale, user1, user2] = await ethers.getSigners();

        // Deploy MasterRegistry
        const MasterRegistry = await ethers.getContractFactory("MasterRegistry");
        const registry = await MasterRegistry.deploy();
        await registry.waitForDeployment();

        // Deploy AccessControlManager
        const AccessControlManager = await ethers.getContractFactory("AccessControlManager");
        const accessControl = await AccessControlManager.deploy(registry.target);
        await accessControl.waitForDeployment();

        await registry.setContract(
            ethers.keccak256(ethers.toUtf8Bytes("AccessControlManager")),
            accessControl.target
        );

        const RESOLVER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("RESOLVER_ROLE"));
        await accessControl.grantRole(RESOLVER_ROLE, resolver.address);

        // Deploy RewardDistributor
        const RewardDistributor = await ethers.getContractFactory("RewardDistributor");
        const rewardDistributor = await RewardDistributor.deploy(registry.target);
        await rewardDistributor.waitForDeployment();

        await registry.setContract(
            ethers.keccak256(ethers.toUtf8Bytes("RewardDistributor")),
            rewardDistributor.target
        );

        // Deploy ParimutuelMarket
        const ParimutuelMarket = await ethers.getContractFactory("ParimutuelMarket");
        const market = await ParimutuelMarket.deploy();
        await market.waitForDeployment();

        // Initialize
        const deadline = (await time.latest()) + 3600;
        const initData = ethers.AbiCoder.defaultAbiCoder().encode(
            ["string", "string", "string", "address", "uint256", "uint256"],
            ["Test Market", "YES", "NO", owner.address, deadline, 1000]
        );

        await market.initialize(registry.target, initData);

        return { market, owner, whale, user1, user2, deadline };
    }

    describe("Minimum Bet Protection", function () {
        it("Should enforce minimum bet of 0.001 ETH", async function () {
            const { market } = await loadFixture(deployFixture);

            const MIN_BET = ethers.parseEther("0.001");

            // Bet below minimum should fail
            await expect(
                market.placeBet(1, "0x", 0, 0, { value: MIN_BET - 1n })
            ).to.be.revertedWithCustomError(market, "BetTooSmall");

            // Exactly minimum should succeed
            await expect(
                market.placeBet(1, "0x", 0, 0, { value: MIN_BET })
            ).to.not.be.reverted;
        });

        it("Should prevent dust spam with tiny bets", async function () {
            const { market } = await loadFixture(deployFixture);

            // 1 wei bet should fail
            await expect(
                market.placeBet(1, "0x", 0, 0, { value: 1 })
            ).to.be.revertedWithCustomError(market, "BetTooSmall");

            // 0.0001 ETH should fail
            await expect(
                market.placeBet(1, "0x", 0, 0, { value: ethers.parseEther("0.0001") })
            ).to.be.revertedWithCustomError(market, "BetTooSmall");
        });
    });

    describe("Maximum Bet Protection (20% of Pool)", function () {
        it("Should allow any bet size on empty pool", async function () {
            const { market, whale } = await loadFixture(deployFixture);

            // First bet can be any size (no pool yet)
            await expect(
                market.connect(whale).placeBet(1, "0x", 0, 0, { value: ethers.parseEther("1000") })
            ).to.not.be.reverted;
        });

        it("Should enforce 20% max bet after initial pool", async function () {
            const { market, user1, whale } = await loadFixture(deployFixture);

            // Initial bet of 10 ETH
            await market.connect(user1).placeBet(1, "0x", 0, 0, { value: ethers.parseEther("10") });

            // Pool is now 10 ETH
            // Max bet = 20% of 10 ETH = 2 ETH

            // 2.1 ETH should fail (> 20%)
            await expect(
                market.connect(whale).placeBet(1, "0x", 0, 0, { value: ethers.parseEther("2.1") })
            ).to.be.revertedWithCustomError(market, "BetTooLarge");

            // 2 ETH should succeed (exactly 20%)
            await expect(
                market.connect(whale).placeBet(1, "0x", 0, 0, { value: ethers.parseEther("2") })
            ).to.not.be.reverted;
        });

        it("Should prevent whale from dominating pool", async function () {
            const { market, user1, whale } = await loadFixture(deployFixture);

            // Users create initial pool
            await market.connect(user1).placeBet(1, "0x", 0, 0, { value: ethers.parseEther("100") });

            // Whale tries to bet 90 ETH (90% of pool) - should fail
            await expect(
                market.connect(whale).placeBet(1, "0x", 0, 0, { value: ethers.parseEther("90") })
            ).to.be.revertedWithCustomError(market, "BetTooLarge");

            // Whale can only bet 20 ETH (20% of 100 ETH pool)
            await market.connect(whale).placeBet(1, "0x", 0, 0, { value: ethers.parseEther("20") });

            // Now pool is 120 ETH
            // Whale tries to bet another 100 ETH (83% of pool) - should fail
            await expect(
                market.connect(whale).placeBet(1, "0x", 0, 0, { value: ethers.parseEther("100") })
            ).to.be.revertedWithCustomError(market, "BetTooLarge");

            // Can bet 24 ETH (20% of 120 ETH)
            await market.connect(whale).placeBet(1, "0x", 0, 0, { value: ethers.parseEther("24") });
        });

        it("Should calculate max bet correctly", async function () {
            const { market, user1, whale } = await loadFixture(deployFixture);

            // Create pool of 50 ETH
            await market.connect(user1).placeBet(1, "0x", 0, 0, { value: ethers.parseEther("50") });

            const totalPool = await market.totalPool();
            expect(totalPool).to.equal(ethers.parseEther("50"));

            // Max bet = 20% of 50 = 10 ETH
            const maxBet = (totalPool * 2000n) / 10000n; // 2000 basis points = 20%
            expect(maxBet).to.equal(ethers.parseEther("10"));

            // 10.01 ETH should fail (over 20% of current 50 ETH pool)
            await expect(
                market.connect(whale).placeBet(1, "0x", 0, 0, { value: maxBet + ethers.parseEther("0.01") })
            ).to.be.revertedWithCustomError(market, "BetTooLarge");

            // 10 ETH should succeed (exactly 20%)
            await expect(
                market.connect(whale).placeBet(1, "0x", 0, 0, { value: maxBet })
            ).to.not.be.reverted;
        });
    });

    describe("Progressive Scaling", function () {
        it("Should allow progressively larger bets as pool grows", async function () {
            const { market, user1, user2, whale } = await loadFixture(deployFixture);

            // Pool: 0 -> Whale can bet any amount
            await market.connect(whale).placeBet(1, "0x", 0, 0, { value: ethers.parseEther("10") });

            // Pool: 10 -> Max = 2 ETH
            await market.connect(user1).placeBet(1, "0x", 0, 0, { value: ethers.parseEther("2") });

            // Pool: 12 -> Max = 2.4 ETH
            await market.connect(user2).placeBet(1, "0x", 0, 0, { value: ethers.parseEther("2.4") });

            // Pool: 14.4 -> Max = 2.88 ETH
            await market.connect(whale).placeBet(1, "0x", 0, 0, { value: ethers.parseEther("2.88") });

            // Verify total
            expect(await market.totalPool()).to.equal(ethers.parseEther("17.28"));
        });

        it("Should handle large pools correctly", async function () {
            const { market, user1, whale } = await loadFixture(deployFixture);

            // Create large pool
            await market.connect(user1).placeBet(1, "0x", 0, 0, { value: ethers.parseEther("1000") });

            // 201 ETH should fail first (over 20%)
            await expect(
                market.connect(whale).placeBet(1, "0x", 0, 0, { value: ethers.parseEther("201") })
            ).to.be.revertedWithCustomError(market, "BetTooLarge");

            // Max bet on 1000 ETH pool = 200 ETH should succeed
            await expect(
                market.connect(whale).placeBet(1, "0x", 0, 0, { value: ethers.parseEther("200") })
            ).to.not.be.reverted;
        });
    });

    describe("Economic Attack Prevention", function () {
        it("Should prevent whale from manipulating odds right before deadline", async function () {
            const { market, user1, user2, whale, deadline } = await loadFixture(deployFixture);

            // Initial balanced pool
            await market.connect(user1).placeBet(1, "0x", 0, 0, { value: ethers.parseEther("50") });
            await market.connect(user2).placeBet(2, "0x", 0, 0, { value: ethers.parseEther("10") });

            // Whale tries to manipulate just before deadline
            // Would want to bet 900 ETH to dominate, but can only bet 20 ETH (20% of 100)

            await expect(
                market.connect(whale).placeBet(1, "0x", 0, 0, { value: ethers.parseEther("900") })
            ).to.be.reverted;

            // Can only bet up to 20% of current pool (12 ETH)
            await market.connect(whale).placeBet(1, "0x", 0, 0, { value: ethers.parseEther("12") });

            // New pool: 72 ETH (62 on outcome1, 10 on outcome2)
            // Odds changed but not drastically
            const [odds1After, odds2After] = await market.getCurrentImpliedOdds();
            console.log(`    Odds after 20% bet: ${Number(odds1After) / 100}% vs ${Number(odds2After) / 100}%`);

            // Verify odds didn't shift too dramatically (not 90%+ for whale's side)
            expect(Number(odds1After)).to.be.lessThan(6000); // Less than 60% (not dominance)
        });

        it("Should make manipulation unprofitable", async function () {
            const { market, user1, whale } = await loadFixture(deployFixture);

            // Small initial pool
            await market.connect(user1).placeBet(1, "0x", 0, 0, { value: ethers.parseEther("1") });

            // Whale wants to bet large amount but is limited
            // Can only bet 0.2 ETH (20% of 1 ETH pool)

            await market.connect(whale).placeBet(1, "0x", 0, 0, { value: ethers.parseEther("0.2") });

            // Whale's bet is only 16.7% of total pool (0.2 / 1.2)
            // This doesn't give whale significant advantage

            const totalPool = await market.totalPool();
            const whaleBet = ethers.parseEther("0.2");
            const whalePercentage = (whaleBet * 10000n) / totalPool;

            console.log(`    Whale controls: ${Number(whalePercentage) / 100}% of pool`);
            expect(Number(whalePercentage)).to.be.lessThan(2000); // Less than 20%
        });
    });

    describe("Edge Cases", function () {
        it("Should handle bet exactly at maximum", async function () {
            const { market, user1, whale } = await loadFixture(deployFixture);

            await market.connect(user1).placeBet(1, "0x", 0, 0, { value: ethers.parseEther("100") });

            const maxBet = ethers.parseEther("20"); // 20% of 100

            // Exactly at max should succeed
            await expect(
                market.connect(whale).placeBet(1, "0x", 0, 0, { value: maxBet })
            ).to.not.be.reverted;
        });

        it("Should handle bet just over maximum", async function () {
            const { market, user1, whale } = await loadFixture(deployFixture);

            await market.connect(user1).placeBet(1, "0x", 0, 0, { value: ethers.parseEther("100") });

            const maxBet = ethers.parseEther("20");
            const overMax = maxBet + 1n;

            // Just over max should fail
            await expect(
                market.connect(whale).placeBet(1, "0x", 0, 0, { value: overMax })
            ).to.be.revertedWithCustomError(market, "BetTooLarge");
        });

        it("Should apply limits to both outcomes", async function () {
            const { market, user1, whale } = await loadFixture(deployFixture);

            // Create pool on outcome 1
            await market.connect(user1).placeBet(1, "0x", 0, 0, { value: ethers.parseEther("50") });

            // Whale tries large bet on outcome 2
            await expect(
                market.connect(whale).placeBet(2, "0x", 0, 0, { value: ethers.parseEther("50") })
            ).to.be.revertedWithCustomError(market, "BetTooLarge");

            // Can bet 10 ETH (20% of 50 ETH pool)
            await market.connect(whale).placeBet(2, "0x", 0, 0, { value: ethers.parseEther("10") });
        });

        it("Should allow multiple users to each bet up to limit", async function () {
            const { market, user1, user2, whale } = await loadFixture(deployFixture);

            // Initial pool
            await market.connect(user1).placeBet(1, "0x", 0, 0, { value: ethers.parseEther("100") });

            // User2 bets max (20 ETH)
            await market.connect(user2).placeBet(1, "0x", 0, 0, { value: ethers.parseEther("20") });

            // Pool now 120 ETH, max is 24 ETH
            // Whale can also bet up to the new max
            await expect(
                market.connect(whale).placeBet(1, "0x", 0, 0, { value: ethers.parseEther("24") })
            ).to.not.be.reverted;
        });
    });

    describe("Constants Verification", function () {
        it("Should have correct MAX_BET_PERCENT constant (20%)", async function () {
            const { market } = await loadFixture(deployFixture);

            const MAX_BET_PERCENT = await market.MAX_BET_PERCENT();
            expect(MAX_BET_PERCENT).to.equal(2000); // 2000 basis points = 20%
        });

        it("Should have correct MIN_BET constant (0.001 ETH)", async function () {
            const { market } = await loadFixture(deployFixture);

            const MIN_BET = await market.MIN_BET();
            expect(MIN_BET).to.equal(ethers.parseEther("0.001"));
        });
    });
});
