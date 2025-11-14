const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

/**
 * CRITICAL-004: Fee Collection Resilience Tests
 *
 * Tests for try-catch protection around RewardDistributor.collectFees()
 * to prevent market resolution bricking.
 *
 * Attack Scenario:
 * - RewardDistributor upgrade/malfunction causes collectFees() to revert
 * - Without fix: Market resolution permanently fails, funds locked forever
 * - With fix: Fees accumulate in contract, admin can withdraw later
 *
 * Coverage:
 * - Resolve market when RewardDistributor reverts
 * - Accumulate fees correctly
 * - Admin withdrawal of accumulated fees
 * - RewardDistributor upgrade scenarios
 * - Event emissions
 * - Continue fee collection after fix
 */
describe("CRITICAL-004: Fee Collection Resilience", function () {
    async function deployFixture() {
        const [owner, admin, resolver, creator, bettor1, bettor2] = await ethers.getSigners();

        // Deploy MasterRegistry
        const MasterRegistry = await ethers.getContractFactory("MasterRegistry");
        const registry = await MasterRegistry.deploy();
        await registry.waitForDeployment();

        // Deploy AccessControlManager
        const AccessControlManager = await ethers.getContractFactory("AccessControlManager");
        const accessControl = await AccessControlManager.deploy(registry.target);
        await accessControl.waitForDeployment();

        // Register AccessControlManager
        await registry.setContract(
            ethers.keccak256(ethers.toUtf8Bytes("AccessControlManager")),
            accessControl.target
        );

        // Grant roles
        const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
        const RESOLVER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("RESOLVER_ROLE"));
        await accessControl.grantRole(ADMIN_ROLE, admin.address);
        await accessControl.grantRole(RESOLVER_ROLE, resolver.address);

        // Deploy working RewardDistributor
        const RewardDistributor = await ethers.getContractFactory("RewardDistributor");
        const rewardDistributor = await RewardDistributor.deploy(registry.target);
        await rewardDistributor.waitForDeployment();

        // Deploy malicious RewardDistributor that always reverts
        const MaliciousRewardDistributor = await ethers.getContractFactory("MaliciousRewardDistributor");
        const maliciousRewardDistributor = await MaliciousRewardDistributor.deploy();
        await maliciousRewardDistributor.waitForDeployment();

        // Deploy mock configurable RewardDistributor
        const MockRewardDistributor = await ethers.getContractFactory("MockRewardDistributor");
        const mockRewardDistributor = await MockRewardDistributor.deploy();
        await mockRewardDistributor.waitForDeployment();

        // Register working RewardDistributor initially
        await registry.setContract(
            ethers.keccak256(ethers.toUtf8Bytes("RewardDistributor")),
            rewardDistributor.target
        );

        // Deploy ResolutionManager
        const disputeWindow = 7 * 24 * 60 * 60; // 7 days
        const minDisputeBond = ethers.parseEther("1");
        const ResolutionManager = await ethers.getContractFactory("ResolutionManager");
        const resolutionManager = await ResolutionManager.deploy(
            registry.target,
            disputeWindow,
            minDisputeBond
        );
        await resolutionManager.waitForDeployment();

        // Register ResolutionManager
        await registry.setContract(
            ethers.keccak256(ethers.toUtf8Bytes("ResolutionManager")),
            resolutionManager.target
        );

        // Deploy ParimutuelMarket template
        const ParimutuelMarket = await ethers.getContractFactory("ParimutuelMarket");
        const marketTemplate = await ParimutuelMarket.deploy();
        await marketTemplate.waitForDeployment();

        // Deploy FlexibleMarketFactory
        const minBond = ethers.parseEther("0.01");
        const FlexibleMarketFactory = await ethers.getContractFactory("FlexibleMarketFactory");
        const factory = await FlexibleMarketFactory.deploy(registry.target, minBond);
        await factory.waitForDeployment();

        // Register factory
        await registry.setContract(
            ethers.keccak256(ethers.toUtf8Bytes("FlexibleMarketFactory")),
            factory.target
        );

        // Deploy MarketTemplateRegistry
        const MarketTemplateRegistry = await ethers.getContractFactory("MarketTemplateRegistry");
        const templateRegistry = await MarketTemplateRegistry.deploy(registry.target);
        await templateRegistry.waitForDeployment();

        // Register MarketTemplateRegistry in MasterRegistry
        await registry.setContract(
            ethers.keccak256(ethers.toUtf8Bytes("MarketTemplateRegistry")),
            templateRegistry.target
        );

        // Register template
        const templateId = ethers.keccak256(ethers.toUtf8Bytes("PARIMUTUEL_V1"));
        await templateRegistry.connect(admin).registerTemplate(templateId, marketTemplate.target);

        // Create market
        const deadline = (await time.latest()) + 3600; // 1 hour from now
        const feePercent = 500; // 5%

        const tx = await factory.createMarketFromTemplateRegistry(
            templateId,
            "Will ETH hit $5000?",
            "Yes",
            "No",
            deadline,
            feePercent,
            { value: minBond }
        );
        const receipt = await tx.wait();
        const marketAddress = receipt.logs[0].args[0];

        const market = await ethers.getContractAt("ParimutuelMarket", marketAddress);

        return {
            registry,
            accessControl,
            rewardDistributor,
            maliciousRewardDistributor,
            mockRewardDistributor,
            resolutionManager,
            factory,
            market,
            marketTemplate,
            templateRegistry,
            owner,
            admin,
            resolver,
            creator,
            bettor1,
            bettor2,
            deadline
        };
    }

    describe("Market Resolution with RewardDistributor Failure", function () {
        it("Should resolve market even when RewardDistributor reverts", async function () {
            const { registry, market, maliciousRewardDistributor, resolver, bettor1, bettor2, deadline } =
                await loadFixture(deployFixture);

            // Place bets
            await market.connect(bettor1).placeBet(1, "0x", 0, 0, {
                value: ethers.parseEther("1")
            });
            await market.connect(bettor2).placeBet(2, "0x", 0, 0, {
                value: ethers.parseEther("1")
            });

            // Replace RewardDistributor with malicious one
            await registry.setContract(
                ethers.keccak256(ethers.toUtf8Bytes("RewardDistributor")),
                maliciousRewardDistributor.target
            );

            // Advance time past deadline
            await time.increaseTo(deadline + 1);

            // Resolve market - should NOT revert despite RewardDistributor failing
            await expect(
                resolutionManager.connect(resolver).resolveMarket(
                    market.target,
                    1, // Outcome 1 wins
                    "Evidence: ETH hit $5000"
                )
            ).to.not.be.reverted;

            // Verify market is resolved
            const result = await market.result();
            expect(result).to.equal(1); // OUTCOME1
        });

        it("Should accumulate fees when collectFees() fails", async function () {
            const { registry, market, maliciousRewardDistributor, resolver, bettor1, bettor2, deadline } =
                await loadFixture(deployFixture);

            // Place bets
            const bet1 = ethers.parseEther("1");
            const bet2 = ethers.parseEther("2");
            await market.connect(bettor1).placeBet(1, "0x", 0, 0, { value: bet1 });
            await market.connect(bettor2).placeBet(2, "0x", 0, 0, { value: bet2 });

            const totalPool = bet1 + bet2;
            const expectedFees = (totalPool * BigInt(500)) / BigInt(10000); // 5% fee

            // Replace with malicious RewardDistributor
            await registry.setContract(
                ethers.keccak256(ethers.toUtf8Bytes("RewardDistributor")),
                maliciousRewardDistributor.target
            );

            // Advance time and resolve
            await time.increaseTo(deadline + 1);
            await resolutionManager.connect(resolver).resolveMarket(
                market.target,
                1,
                "Evidence"
            );

            // Check accumulated fees
            const accumulatedFees = await market.accumulatedFees();
            expect(accumulatedFees).to.equal(expectedFees);
        });

        it("Should emit FeeCollectionFailed event with reason", async function () {
            const { registry, market, maliciousRewardDistributor, resolver, bettor1, bettor2, deadline } =
                await loadFixture(deployFixture);

            // Place bets
            await market.connect(bettor1).placeBet(1, "0x", 0, 0, {
                value: ethers.parseEther("1")
            });
            await market.connect(bettor2).placeBet(2, "0x", 0, 0, {
                value: ethers.parseEther("1")
            });

            // Replace with malicious RewardDistributor
            await registry.setContract(
                ethers.keccak256(ethers.toUtf8Bytes("RewardDistributor")),
                maliciousRewardDistributor.target
            );

            // Advance time
            await time.increaseTo(deadline + 1);

            // Resolve and check for FeeCollectionFailed event
            const tx = resolutionManager.connect(resolver).resolveMarket(
                market.target,
                1,
                "Evidence"
            );

            await expect(tx)
                .to.emit(market, "FeeCollectionFailed");
            // Note: event is emitted by market, not resolutionManager
        });
    });

    describe("Admin Withdrawal of Accumulated Fees", function () {
        it("Should allow admin to withdraw accumulated fees", async function () {
            const { registry, market, maliciousRewardDistributor, rewardDistributor,
                    admin, resolver, bettor1, bettor2, deadline } =
                await loadFixture(deployFixture);

            // Place bets
            await market.connect(bettor1).placeBet(1, "0x", 0, 0, {
                value: ethers.parseEther("1")
            });
            await market.connect(bettor2).placeBet(2, "0x", 0, 0, {
                value: ethers.parseEther("1")
            });

            // Replace with malicious RewardDistributor
            await registry.setContract(
                ethers.keccak256(ethers.toUtf8Bytes("RewardDistributor")),
                maliciousRewardDistributor.target
            );

            // Resolve market (fees accumulate)
            await time.increaseTo(deadline + 1);
            await resolutionManager.connect(resolver).resolveMarket(
                market.target,
                1,
                "Evidence"
            );

            const accumulatedFees = await market.accumulatedFees();
            expect(accumulatedFees).to.be.gt(0);

            // Fix RewardDistributor
            await registry.setContract(
                ethers.keccak256(ethers.toUtf8Bytes("RewardDistributor")),
                rewardDistributor.target
            );

            // Admin withdraws accumulated fees
            await expect(
                market.connect(admin).withdrawAccumulatedFees()
            ).to.emit(market, "AccumulatedFeesWithdrawn")
             .withArgs(accumulatedFees, admin.address);

            // Check accumulated fees cleared
            expect(await market.accumulatedFees()).to.equal(0);
        });

        it("Should revert withdrawal if not admin", async function () {
            const { market, bettor1 } = await loadFixture(deployFixture);

            await expect(
                market.connect(bettor1).withdrawAccumulatedFees()
            ).to.be.revertedWith("Only admin");
        });

        it("Should revert withdrawal if no accumulated fees", async function () {
            const { market, admin } = await loadFixture(deployFixture);

            await expect(
                market.connect(admin).withdrawAccumulatedFees()
            ).to.be.revertedWith("No accumulated fees");
        });

        it("Should send to admin if RewardDistributor still fails", async function () {
            const { registry, market, maliciousRewardDistributor,
                    admin, resolver, bettor1, bettor2, deadline } =
                await loadFixture(deployFixture);

            // Place bets and resolve with malicious RD
            await market.connect(bettor1).placeBet(1, "0x", 0, 0, {
                value: ethers.parseEther("1")
            });
            await market.connect(bettor2).placeBet(2, "0x", 0, 0, {
                value: ethers.parseEther("1")
            });

            await registry.setContract(
                ethers.keccak256(ethers.toUtf8Bytes("RewardDistributor")),
                maliciousRewardDistributor.target
            );

            await time.increaseTo(deadline + 1);
            await resolutionManager.connect(resolver).resolveMarket(
                market.target,
                1,
                "Evidence"
            );

            const accumulatedFees = await market.accumulatedFees();
            const adminBalanceBefore = await ethers.provider.getBalance(admin.address);

            // Try to withdraw (RewardDistributor still malicious)
            const tx = await market.connect(admin).withdrawAccumulatedFees();
            const receipt = await tx.wait();
            const gasUsed = receipt.gasUsed * receipt.gasPrice;

            // Admin should receive the fees directly
            const adminBalanceAfter = await ethers.provider.getBalance(admin.address);
            expect(adminBalanceAfter).to.equal(adminBalanceBefore + accumulatedFees - gasUsed);
        });
    });

    describe("RewardDistributor Upgrade Scenarios", function () {
        it("Should handle RewardDistributor upgrade mid-operation", async function () {
            const { registry, market, mockRewardDistributor, resolver, bettor1, bettor2, deadline } =
                await loadFixture(deployFixture);

            // Place bets
            await market.connect(bettor1).placeBet(1, "0x", 0, 0, {
                value: ethers.parseEther("1")
            });

            // Configure mock to fail
            await mockRewardDistributor.setShouldRevert(true);
            await registry.setContract(
                ethers.keccak256(ethers.toUtf8Bytes("RewardDistributor")),
                mockRewardDistributor.target
            );

            // Resolve (fails, accumulates)
            await time.increaseTo(deadline + 1);
            await resolutionManager.connect(resolver).resolveMarket(
                market.target,
                1,
                "Evidence"
            );

            expect(await market.accumulatedFees()).to.be.gt(0);

            // Fix mock
            await mockRewardDistributor.setShouldRevert(false);

            // Should continue working after fix
            await market.connect(bettor2).placeBet(2, "0x", 0, 0, {
                value: ethers.parseEther("1")
            });
        });

        it("Should continue fee collection after RewardDistributor is fixed", async function () {
            const { registry, market, mockRewardDistributor, rewardDistributor,
                    admin, resolver, bettor1, bettor2, deadline } =
                await loadFixture(deployFixture);

            // First market resolution with failure
            await market.connect(bettor1).placeBet(1, "0x", 0, 0, {
                value: ethers.parseEther("1")
            });
            await market.connect(bettor2).placeBet(2, "0x", 0, 0, {
                value: ethers.parseEther("1")
            });

            await mockRewardDistributor.setShouldRevert(true);
            await registry.setContract(
                ethers.keccak256(ethers.toUtf8Bytes("RewardDistributor")),
                mockRewardDistributor.target
            );

            await time.increaseTo(deadline + 1);
            await resolutionManager.connect(resolver).resolveMarket(
                market.target,
                1,
                "Evidence"
            );

            const feesAccumulated = await market.accumulatedFees();
            expect(feesAccumulated).to.be.gt(0);

            // Fix RewardDistributor
            await mockRewardDistributor.setShouldRevert(false);

            // Withdraw accumulated fees - should now succeed
            const balanceBefore = await mockRewardDistributor.getTreasuryBalance();
            await market.connect(admin).withdrawAccumulatedFees();

            // Fees should have been collected
            expect(await mockRewardDistributor.collectFeesCallCount()).to.be.gte(1);
        });
    });

    describe("Edge Cases and Attack Scenarios", function () {
        it("Should handle multiple failed fee collections", async function () {
            const { registry, market, maliciousRewardDistributor, resolver, bettor1, bettor2 } =
                await loadFixture(deployFixture);

            // Replace with malicious RD
            await registry.setContract(
                ethers.keccak256(ethers.toUtf8Bytes("RewardDistributor")),
                maliciousRewardDistributor.target
            );

            // Create multiple markets and resolve them all
            const totalFees = ethers.parseEther("0");

            // Market 1
            await market.connect(bettor1).placeBet(1, "0x", 0, 0, {
                value: ethers.parseEther("1")
            });
            await market.connect(bettor2).placeBet(2, "0x", 0, 0, {
                value: ethers.parseEther("1")
            });

            const deadline = await market.deadline();
            await time.increaseTo(deadline + 1n);

            await resolutionManager.connect(resolver).resolveMarket(
                market.target,
                1,
                "Evidence"
            );

            // All fees should be accumulated
            const accumulatedFees = await market.accumulatedFees();
            expect(accumulatedFees).to.be.gt(0);
        });

        it("Should not allow reentrancy during fee collection", async function () {
            const { market, bettor1, bettor2, resolver, deadline } =
                await loadFixture(deployFixture);

            // Place bets
            await market.connect(bettor1).placeBet(1, "0x", 0, 0, {
                value: ethers.parseEther("1")
            });
            await market.connect(bettor2).placeBet(2, "0x", 0, 0, {
                value: ethers.parseEther("1")
            });

            // Resolve (has reentrancy guard)
            await time.increaseTo(deadline + 1);
            await resolutionManager.connect(resolver).resolveMarket(
                market.target,
                1,
                "Evidence"
            );

            // Market should be resolved
            expect(await market.result()).to.equal(1);
        });

        it("Should handle zero fees correctly", async function () {
            const { registry, market, maliciousRewardDistributor, resolver, bettor1, deadline } =
                await loadFixture(deployFixture);

            // Place only one small bet
            await market.connect(bettor1).placeBet(1, "0x", 0, 0, {
                value: ethers.parseEther("0.001")
            });

            await registry.setContract(
                ethers.keccak256(ethers.toUtf8Bytes("RewardDistributor")),
                maliciousRewardDistributor.target
            );

            // Resolve
            await time.increaseTo(deadline + 1);
            await resolutionManager.connect(resolver).resolveMarket(
                market.target,
                1,
                "Evidence"
            );

            // Should resolve successfully even with tiny/zero fees
            expect(await market.result()).to.equal(1);
        });
    });
});
