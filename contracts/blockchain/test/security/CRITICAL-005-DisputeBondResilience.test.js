const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

/**
 * CRITICAL-005: Dispute Bond Resilience Tests
 *
 * Tests for try-catch protection around dispute bond transfers
 * to prevent dispute resolution bricking.
 *
 * Attack Scenario:
 * - RewardDistributor fails during rejected dispute bond transfer
 * - Without fix: Dispute resolution permanently blocked
 * - With fix: Bonds held in contract, admin can withdraw later
 *
 * Coverage:
 * - Resolve dispute when RewardDistributor reverts
 * - Hold bonds correctly
 * - Admin withdrawal of held bonds
 * - Event emissions
 * - Dispute workflow integrity
 */
describe("CRITICAL-005: Dispute Bond Resilience", function () {
    async function deployFixture() {
        const [owner, admin, resolver, disputer, creator, bettor1, bettor2] = await ethers.getSigners();

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

        // Deploy RewardDistributor
        const RewardDistributor = await ethers.getContractFactory("RewardDistributor");
        const rewardDistributor = await RewardDistributor.deploy(registry.target);
        await rewardDistributor.waitForDeployment();

        // Deploy malicious RewardDistributor
        const MaliciousRewardDistributor = await ethers.getContractFactory("MaliciousRewardDistributor");
        const maliciousRewardDistributor = await MaliciousRewardDistributor.deploy();
        await maliciousRewardDistributor.waitForDeployment();

        await registry.setContract(
            ethers.keccak256(ethers.toUtf8Bytes("RewardDistributor")),
            rewardDistributor.target
        );

        // Deploy ResolutionManager
        const disputeWindow = 7 * 24 * 60 * 60;
        const minDisputeBond = ethers.parseEther("1");
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

        // Deploy and setup market
        const ParimutuelMarket = await ethers.getContractFactory("ParimutuelMarket");
        const marketTemplate = await ParimutuelMarket.deploy();
        await marketTemplate.waitForDeployment();

        const FlexibleMarketFactory = await ethers.getContractFactory("FlexibleMarketFactory");
        const minBond = ethers.parseEther("0.01");
        const factory = await FlexibleMarketFactory.deploy(registry.target, minBond);
        await factory.waitForDeployment();

        await registry.setContract(
            ethers.keccak256(ethers.toUtf8Bytes("FlexibleMarketFactory")),
            factory.target
        );

        const MarketTemplateRegistry = await ethers.getContractFactory("MarketTemplateRegistry");
        const templateRegistry = await MarketTemplateRegistry.deploy(registry.target);
        await templateRegistry.waitForDeployment();

        // Register MarketTemplateRegistry in MasterRegistry
        await registry.setContract(
            ethers.keccak256(ethers.toUtf8Bytes("MarketTemplateRegistry")),
            templateRegistry.target
        );

        const templateId = ethers.keccak256(ethers.toUtf8Bytes("PARIMUTUEL_V1"));
        await templateRegistry.connect(admin).registerTemplate(templateId, marketTemplate.target);

        const deadline = (await time.latest()) + 3600;
        const feePercent = 500;

        const tx = await factory.createMarketFromTemplateRegistry(
            templateId,
            "Test Market",
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
            resolutionManager,
            factory,
            market,
            owner,
            admin,
            resolver,
            disputer,
            creator,
            bettor1,
            bettor2,
            deadline,
            minDisputeBond
        };
    }

    describe("Dispute Resolution with RewardDistributor Failure", function () {
        it("Should resolve dispute even when collectFees() reverts", async function () {
            const { registry, market, resolutionManager, maliciousRewardDistributor,
                    resolver, disputer, bettor1, bettor2, deadline, minDisputeBond } =
                await loadFixture(deployFixture);

            // Place bets
            await market.connect(bettor1).placeBet(1, "0x", 0, 0, {
                value: ethers.parseEther("1")
            });
            await market.connect(bettor2).placeBet(2, "0x", 0, 0, {
                value: ethers.parseEther("1")
            });

            // Resolve market
            await time.increaseTo(deadline + 1);
            await resolutionManager.connect(resolver).resolveMarket(
                market.target,
                1,
                "Evidence"
            );

            // Dispute the resolution
            await resolutionManager.connect(disputer).disputeResolution(
                market.target,
                "I disagree",
                { value: minDisputeBond }
            );

            // Replace with malicious RewardDistributor
            await registry.setContract(
                ethers.keccak256(ethers.toUtf8Bytes("RewardDistributor")),
                maliciousRewardDistributor.target
            );

            // Resolve dispute (reject it) - should NOT revert
            await expect(
                resolutionManager.connect(resolver).resolveDispute(
                    market.target,
                    false, // Reject dispute
                    0
                )
            ).to.not.be.reverted;
        });

        it("Should hold bonds when transfer fails", async function () {
            const { registry, market, resolutionManager, maliciousRewardDistributor,
                    resolver, disputer, bettor1, bettor2, deadline, minDisputeBond } =
                await loadFixture(deployFixture);

            // Setup and dispute
            await market.connect(bettor1).placeBet(1, "0x", 0, 0, {
                value: ethers.parseEther("1")
            });
            await market.connect(bettor2).placeBet(2, "0x", 0, 0, {
                value: ethers.parseEther("1")
            });

            await time.increaseTo(deadline + 1);
            await resolutionManager.connect(resolver).resolveMarket(
                market.target,
                1,
                "Evidence"
            );

            await resolutionManager.connect(disputer).disputeResolution(
                market.target,
                "Dispute",
                { value: minDisputeBond }
            );

            // Replace with malicious RD
            await registry.setContract(
                ethers.keccak256(ethers.toUtf8Bytes("RewardDistributor")),
                maliciousRewardDistributor.target
            );

            // Reject dispute
            await resolutionManager.connect(resolver).resolveDispute(
                market.target,
                false,
                0
            );

            // Check held bonds
            const heldBonds = await resolutionManager.heldBonds(market.target);
            expect(heldBonds).to.equal(minDisputeBond);
        });

        it("Should emit DisputeBondTransferFailed event", async function () {
            const { registry, market, resolutionManager, maliciousRewardDistributor,
                    resolver, disputer, bettor1, bettor2, deadline, minDisputeBond } =
                await loadFixture(deployFixture);

            // Setup and dispute
            await market.connect(bettor1).placeBet(1, "0x", 0, 0, {
                value: ethers.parseEther("1")
            });
            await market.connect(bettor2).placeBet(2, "0x", 0, 0, {
                value: ethers.parseEther("1")
            });

            await time.increaseTo(deadline + 1);
            await resolutionManager.connect(resolver).resolveMarket(
                market.target,
                1,
                "Evidence"
            );

            await resolutionManager.connect(disputer).disputeResolution(
                market.target,
                "Dispute",
                { value: minDisputeBond }
            );

            // Replace with malicious RD
            await registry.setContract(
                ethers.keccak256(ethers.toUtf8Bytes("RewardDistributor")),
                maliciousRewardDistributor.target
            );

            // Reject dispute and check event
            await expect(
                resolutionManager.connect(resolver).resolveDispute(
                    market.target,
                    false,
                    0
                )
            ).to.emit(resolutionManager, "DisputeBondTransferFailed")
             .withArgs(market.target, minDisputeBond);
        });
    });

    describe("Admin Withdrawal of Held Bonds", function () {
        it("Should allow admin to withdraw held bonds", async function () {
            const { registry, market, resolutionManager, maliciousRewardDistributor,
                    rewardDistributor, admin, resolver, disputer, bettor1, bettor2, deadline, minDisputeBond } =
                await loadFixture(deployFixture);

            // Setup dispute with malicious RD
            await market.connect(bettor1).placeBet(1, "0x", 0, 0, {
                value: ethers.parseEther("1")
            });
            await market.connect(bettor2).placeBet(2, "0x", 0, 0, {
                value: ethers.parseEther("1")
            });

            await time.increaseTo(deadline + 1);
            await resolutionManager.connect(resolver).resolveMarket(
                market.target,
                1,
                "Evidence"
            );

            await resolutionManager.connect(disputer).disputeResolution(
                market.target,
                "Dispute",
                { value: minDisputeBond }
            );

            await registry.setContract(
                ethers.keccak256(ethers.toUtf8Bytes("RewardDistributor")),
                maliciousRewardDistributor.target
            );

            await resolutionManager.connect(resolver).resolveDispute(
                market.target,
                false,
                0
            );

            // Fix RewardDistributor
            await registry.setContract(
                ethers.keccak256(ethers.toUtf8Bytes("RewardDistributor")),
                rewardDistributor.target
            );

            // Admin withdraws held bonds
            await expect(
                resolutionManager.connect(admin).withdrawHeldBonds(market.target)
            ).to.emit(resolutionManager, "DisputeBondCollected")
             .withArgs(market.target, minDisputeBond, await time.latest() + 1);

            // Check bonds cleared
            expect(await resolutionManager.heldBonds(market.target)).to.equal(0);
        });

        it("Should revert if not admin", async function () {
            const { resolutionManager, market, disputer } = await loadFixture(deployFixture);

            await expect(
                resolutionManager.connect(disputer).withdrawHeldBonds(market.target)
            ).to.be.reverted; // Will fail onlyAdmin modifier
        });

        it("Should revert if no held bonds", async function () {
            const { resolutionManager, market, admin } = await loadFixture(deployFixture);

            await expect(
                resolutionManager.connect(admin).withdrawHeldBonds(market.target)
            ).to.be.revertedWith("No held bonds");
        });

        it("Should send to admin if RewardDistributor still fails", async function () {
            const { registry, market, resolutionManager, maliciousRewardDistributor,
                    admin, resolver, disputer, bettor1, bettor2, deadline, minDisputeBond } =
                await loadFixture(deployFixture);

            // Setup dispute and hold bonds
            await market.connect(bettor1).placeBet(1, "0x", 0, 0, {
                value: ethers.parseEther("1")
            });
            await market.connect(bettor2).placeBet(2, "0x", 0, 0, {
                value: ethers.parseEther("1")
            });

            await time.increaseTo(deadline + 1);
            await resolutionManager.connect(resolver).resolveMarket(
                market.target,
                1,
                "Evidence"
            );

            await resolutionManager.connect(disputer).disputeResolution(
                market.target,
                "Dispute",
                { value: minDisputeBond }
            );

            await registry.setContract(
                ethers.keccak256(ethers.toUtf8Bytes("RewardDistributor")),
                maliciousRewardDistributor.target
            );

            await resolutionManager.connect(resolver).resolveDispute(
                market.target,
                false,
                0
            );

            // Try to withdraw with malicious RD still active
            const adminBalanceBefore = await ethers.provider.getBalance(admin.address);

            const tx = await resolutionManager.connect(admin).withdrawHeldBonds(market.target);
            const receipt = await tx.wait();
            const gasUsed = receipt.gasUsed * receipt.gasPrice;

            // Admin should receive bonds directly
            const adminBalanceAfter = await ethers.provider.getBalance(admin.address);
            expect(adminBalanceAfter).to.equal(adminBalanceBefore + minDisputeBond - gasUsed);
        });
    });

    describe("Dispute Workflow Integrity", function () {
        it("Should maintain dispute workflow with bond holding", async function () {
            const { registry, market, resolutionManager, maliciousRewardDistributor,
                    resolver, disputer, bettor1, bettor2, deadline, minDisputeBond } =
                await loadFixture(deployFixture);

            // Setup market
            await market.connect(bettor1).placeBet(1, "0x", 0, 0, {
                value: ethers.parseEther("1")
            });
            await market.connect(bettor2).placeBet(2, "0x", 0, 0, {
                value: ethers.parseEther("1")
            });

            await time.increaseTo(deadline + 1);
            await resolutionManager.connect(resolver).resolveMarket(
                market.target,
                1,
                "Evidence"
            );

            // Dispute
            await resolutionManager.connect(disputer).disputeResolution(
                market.target,
                "Dispute",
                { value: minDisputeBond }
            );

            // Replace RD and resolve dispute
            await registry.setContract(
                ethers.keccak256(ethers.toUtf8Bytes("RewardDistributor")),
                maliciousRewardDistributor.target
            );

            await resolutionManager.connect(resolver).resolveDispute(
                market.target,
                false,
                0
            );

            // Dispute should be resolved despite bond holding
            // Market resolution should still be valid
            expect(await market.result()).to.equal(1);
        });

        it("Should handle upheld disputes correctly (no bond holding)", async function () {
            const { market, resolutionManager, resolver, disputer, bettor1, bettor2, deadline, minDisputeBond } =
                await loadFixture(deployFixture);

            await market.connect(bettor1).placeBet(1, "0x", 0, 0, {
                value: ethers.parseEther("1")
            });
            await market.connect(bettor2).placeBet(2, "0x", 0, 0, {
                value: ethers.parseEther("1")
            });

            await time.increaseTo(deadline + 1);
            await resolutionManager.connect(resolver).resolveMarket(
                market.target,
                1,
                "Evidence"
            );

            const disputerBalanceBefore = await ethers.provider.getBalance(disputer.address);

            await resolutionManager.connect(disputer).disputeResolution(
                market.target,
                "Dispute",
                { value: minDisputeBond }
            );

            // Uphold dispute - bond should be refunded
            await resolutionManager.connect(resolver).resolveDispute(
                market.target,
                true, // Uphold
                2     // New outcome
            );

            // Disputer should get bond back
            const disputerBalanceAfter = await ethers.provider.getBalance(disputer.address);
            // Balance should be roughly the same (minus gas)
            expect(disputerBalanceAfter).to.be.gt(disputerBalanceBefore - ethers.parseEther("0.1"));
        });
    });
});
