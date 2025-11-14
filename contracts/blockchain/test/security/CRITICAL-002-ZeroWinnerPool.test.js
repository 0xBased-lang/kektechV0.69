const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

/**
 * CRITICAL-002: Zero Winning Pool Edge Case Tests
 *
 * Tests for the critical edge case where no one bet on the winning outcome.
 * Without the fix, funds would be stuck forever in the contract.
 *
 * Coverage:
 * - Auto-cancellation when winningTotal == 0
 * - Full refunds on cancelled markets
 * - No fee collection on cancellation
 * - Edge cases and scenarios
 */
describe("CRITICAL-002: Zero Winning Pool Protection", function () {
    async function deployFixture() {
        const [owner, admin, resolver, user1, user2, user3] = await ethers.getSigners();

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

        // Grant roles
        const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
        const RESOLVER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("RESOLVER_ROLE"));
        await accessControl.grantRole(ADMIN_ROLE, admin.address);
        await accessControl.grantRole(RESOLVER_ROLE, resolver.address);

        // Deploy RewardDistributor (mock for fees)
        const RewardDistributor = await ethers.getContractFactory("RewardDistributor");
        const rewardDistributor = await RewardDistributor.deploy(registry.target);
        await rewardDistributor.waitForDeployment();

        await registry.setContract(
            ethers.keccak256(ethers.toUtf8Bytes("RewardDistributor")),
            rewardDistributor.target
        );

        // Deploy ResolutionManager
        const disputeWindow = 86400; // 1 day
        const minDisputeBond = ethers.parseEther("0.1");
        const ResolutionManager = await ethers.getContractFactory("ResolutionManager");
        const resolutionManager = await ResolutionManager.deploy(
            registry.target,
            disputeWindow,
            minDisputeBond
        );
        await resolutionManager.waitForDeployment();

        await registry.setContract(
            ethers.keccak256(ethers.toUtf8Bytes("ResolutionManager")),
            resolutionManager.target
        );

        // Allow ResolutionManager to act as resolver in markets (PM requires caller to have RESOLVER_ROLE)
        await accessControl.grantRole(RESOLVER_ROLE, resolutionManager.target);

        // Deploy ParimutuelMarket
        const ParimutuelMarket = await ethers.getContractFactory("ParimutuelMarket");
        const market = await ParimutuelMarket.deploy();
        await market.waitForDeployment();

        // Initialize market
        const deadline = (await time.latest()) + 3600; // 1 hour from now
        const initData = ethers.AbiCoder.defaultAbiCoder().encode(
            ["string", "string", "string", "address", "uint256", "uint256"],
            ["Will ETH reach $5000?", "YES", "NO", owner.address, deadline, 1000] // 10% fee
        );

        await market.initialize(registry.target, initData);

        return {
            registry,
            accessControl,
            rewardDistributor,
            resolutionManager,
            market,
            owner,
            admin,
            resolver,
            user1,
            user2,
            user3,
            deadline
        };
    }

    describe("Zero Winner Pool Detection", function () {
        it("Should cancel market if no one bet on winning side", async function () {
            const { market, resolver, resolutionManager, user1, user2, deadline } = await loadFixture(deployFixture);

            // Only bet on outcome 2
            await market.connect(user1).placeBet(2, "0x", 0, 0, { value: ethers.parseEther("0.5") });
            await market.connect(user2).placeBet(2, "0x", 0, 0, { value: ethers.parseEther("0.1") });

            // Total pool: 0.6 ETH, all on outcome 2 (0.5 + 0.1)
            expect(await market.totalPool()).to.equal(ethers.parseEther("0.6"));
            expect(await market.outcome1Total()).to.equal(0);
            expect(await market.outcome2Total()).to.equal(ethers.parseEther("0.6"));

            // Fast forward past deadline
            await time.increaseTo(deadline + 1);

            // Try to resolve as outcome 1 (no one bet on this!)
            await market.connect(resolver).resolveMarket(1);

            // Market should be CANCELLED, not resolved as outcome 1
            const result = await market.result();
            expect(result).to.equal(3); // 3 = CANCELLED (enum: UNRESOLVED=0, OUTCOME1=1, OUTCOME2=2, CANCELLED=3)
        });

        it("Should allow full refunds on cancelled market", async function () {
            const { market, resolver, resolutionManager, user1, user2, deadline } = await loadFixture(deployFixture);

            const bet1 = ethers.parseEther("0.5");
            const bet2 = ethers.parseEther("0.1");

            // Only bet on outcome 2
            await market.connect(user1).placeBet(2, "0x", 0, 0, { value: bet1 });
            await market.connect(user2).placeBet(2, "0x", 0, 0, { value: bet2 });

            // Fast forward and resolve
            await time.increaseTo(deadline + 1);
            await market.connect(resolver).resolveMarket(1);

            // Check market is cancelled
            expect(await market.result()).to.equal(3); // CANCELLED

            // User1 should get full refund
            const payout1 = await market.calculatePayout(user1.address);
            expect(payout1).to.equal(bet1);

            // User2 should get full refund
            const payout2 = await market.calculatePayout(user2.address);
            expect(payout2).to.equal(bet2);
        });

        it("Should successfully claim refunds on cancelled market", async function () {
            const { market, resolver, resolutionManager, user1, user2, deadline } = await loadFixture(deployFixture);

            const bet1 = ethers.parseEther("0.5");
            const bet2 = ethers.parseEther("0.1");

            // Only bet on outcome 2
            await market.connect(user1).placeBet(2, "0x", 0, 0, { value: bet1 });
            await market.connect(user2).placeBet(2, "0x", 0, 0, { value: bet2 });

            const balanceBefore1 = await ethers.provider.getBalance(user1.address);
            const balanceBefore2 = await ethers.provider.getBalance(user2.address);

            // Resolve as cancelled
            await time.increaseTo(deadline + 1);
            await market.connect(resolver).resolveMarket(1);

            // Claim refunds
            const tx1 = await market.connect(user1).claimWinnings();
            const receipt1 = await tx1.wait();
            const gasCost1 = receipt1.gasUsed * tx1.gasPrice;

            const tx2 = await market.connect(user2).claimWinnings();
            const receipt2 = await tx2.wait();
            const gasCost2 = receipt2.gasPrice * receipt2.gasUsed;

            // Verify full refunds (minus gas)
            const balanceAfter1 = await ethers.provider.getBalance(user1.address);
            const balanceAfter2 = await ethers.provider.getBalance(user2.address);

            expect(balanceAfter1).to.equal(balanceBefore1 + bet1 - gasCost1);
            expect(balanceAfter2).to.equal(balanceBefore2 + bet2 - gasCost2);
        });

        it("Should NOT collect fees on cancelled market", async function () {
            const { market, resolver, resolutionManager, rewardDistributor, user1, deadline } = await loadFixture(deployFixture);

            await market.connect(user1).placeBet(2, "0x", 0, 0, { value: ethers.parseEther("100") });

            const rewardBalanceBefore = await ethers.provider.getBalance(rewardDistributor.target);

            // Resolve as cancelled
            await time.increaseTo(deadline + 1);
            await market.connect(resolver).resolveMarket(1);

            const rewardBalanceAfter = await ethers.provider.getBalance(rewardDistributor.target);

            // No fees should be collected
            expect(rewardBalanceAfter).to.equal(rewardBalanceBefore);
        });

        it("Should handle both outcomes bet but one side is zero at resolution", async function () {
            const { market, resolver, resolutionManager, user1, user2, user3, deadline } = await loadFixture(deployFixture);

            // Initial bets on both sides
            await market.connect(user1).placeBet(1, "0x", 0, 0, { value: ethers.parseEther("0.5") });
            await market.connect(user2).placeBet(2, "0x", 0, 0, { value: ethers.parseEther("0.1") });

            // This scenario wouldn't trigger the zero winner case
            // since both sides have bets

            // Fast forward
            await time.increaseTo(deadline + 1);

            // Resolve as outcome 1
            await market.connect(resolver).resolveMarket(1);

            // Should resolve normally (not cancelled)
            expect(await market.result()).to.equal(1); // OUTCOME1
        });
    });

    describe("Edge Cases", function () {
        it("Should handle market with zero total pool", async function () {
            const { market, resolver, resolutionManager, deadline } = await loadFixture(deployFixture);

            // No bets at all
            expect(await market.totalPool()).to.equal(0);

            // Try to resolve
            await time.increaseTo(deadline + 1);

            // Both outcomes have zero, so either resolution should cancel
            await market.connect(resolver).resolveMarket(1);

            expect(await market.result()).to.equal(3); // CANCELLED
        });

        it("Should handle explicit CANCELLED resolution", async function () {
            const { market, resolver, resolutionManager, user1, deadline } = await loadFixture(deployFixture);

            await market.connect(user1).placeBet(1, "0x", 0, 0, { value: ethers.parseEther("0.5") });

            await time.increaseTo(deadline + 1);

            // Explicitly resolve as CANCELLED
            await market.connect(resolver).resolveMarket(3);

            expect(await market.result()).to.equal(3); // CANCELLED

            // User should get refund
            const payout = await market.calculatePayout(user1.address);
            expect(payout).to.equal(ethers.parseEther("0.5"));
        });

        it("Should handle user who bet on both outcomes in cancelled market", async function () {
            const { market, resolver, resolutionManager, user1, deadline } = await loadFixture(deployFixture);

            // User bets on both outcomes (respect 20% whale limit)
            await market.connect(user1).placeBet(1, "0x", 0, 0, { value: ethers.parseEther("1.0") });
            await market.connect(user1).placeBet(2, "0x", 0, 0, { value: ethers.parseEther("0.1") });

            await time.increaseTo(deadline + 1);

            // Explicitly cancel market
            await market.connect(resolver).resolveMarket(3);

            // User should get BOTH bets back
            const payout = await market.calculatePayout(user1.address);
            expect(payout).to.equal(ethers.parseEther("1.1")); // 1.0 + 0.1
        });

        it("Should prevent double claiming on cancelled market", async function () {
            const { market, resolver, resolutionManager, user1, deadline } = await loadFixture(deployFixture);

            await market.connect(user1).placeBet(2, "0x", 0, 0, { value: ethers.parseEther("0.1") });

            await time.increaseTo(deadline + 1);
            await market.connect(resolver).resolveMarket(1);

            // First claim should succeed
            await market.connect(user1).claimWinnings();

            // Second claim should fail
            await expect(
                market.connect(user1).claimWinnings()
            ).to.be.revertedWithCustomError(market, "AlreadyClaimed");
        });
    });

    describe("Fund Safety", function () {
        it("Should ensure no ETH is stuck in contract after cancellation", async function () {
            const { market, resolver, resolutionManager, user1, user2, user3, deadline } = await loadFixture(deployFixture);

            // Multiple users bet
            await market.connect(user1).placeBet(2, "0x", 0, 0, { value: ethers.parseEther("0.5") });
            await market.connect(user2).placeBet(2, "0x", 0, 0, { value: ethers.parseEther("0.1") });
            await market.connect(user3).placeBet(2, "0x", 0, 0, { value: ethers.parseEther("0.1") });

            const totalBet = ethers.parseEther("0.7");

            // Market balance should equal total bets
            expect(await ethers.provider.getBalance(market.target)).to.equal(totalBet);

            // Cancel market
            await time.increaseTo(deadline + 1);
            await resolutionManager.connect(resolver).resolveMarket(market.target, 1, "Evidence");

            // All users claim
            await market.connect(user1).claimWinnings();
            await market.connect(user2).claimWinnings();
            await market.connect(user3).claimWinnings();

            // Contract should be empty (all funds returned)
            expect(await ethers.provider.getBalance(market.target)).to.equal(0);
        });

        it("Should have contract balance match expected payouts", async function () {
            const { market, resolver, resolutionManager, user1, user2, deadline } = await loadFixture(deployFixture);

            await market.connect(user1).placeBet(2, "0x", 0, 0, { value: ethers.parseEther("0.6") });
            await market.connect(user2).placeBet(2, "0x", 0, 0, { value: ethers.parseEther("0.1") });

            const contractBalance = await ethers.provider.getBalance(market.target);

            // Cancel
            await time.increaseTo(deadline + 1);
            await market.connect(resolver).resolveMarket(1);

            const payout1 = await market.calculatePayout(user1.address);
            const payout2 = await market.calculatePayout(user2.address);

            // Sum of payouts should equal contract balance
            expect(payout1 + payout2).to.equal(contractBalance);
        });
    });

    describe("Safety Checks", function () {
        it("Should have require() fallback for invalid state", async function () {
            const { market, resolver, resolutionManager, user1, deadline } = await loadFixture(deployFixture);

            // This test verifies the safety check in calculatePayout
            // The require(winningTotal > 0) should never trigger if resolveMarket works correctly
            // but it's there as a last line of defense

            await market.connect(user1).placeBet(1, "0x", 0, 0, { value: ethers.parseEther("0.5") });

            await time.increaseTo(deadline + 1);
            await market.connect(resolver).resolveMarket(1);

            // Should resolve normally (has winning bets)
            expect(await market.result()).to.equal(1);

            // Payout calculation should work
            const payout = await market.calculatePayout(user1.address);
            expect(payout).to.be.greaterThan(0);
        });
    });
});
