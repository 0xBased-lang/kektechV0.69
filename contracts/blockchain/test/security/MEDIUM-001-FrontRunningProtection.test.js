const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

/**
 * MEDIUM-001: Front-Running Protection Tests
 *
 * Tests for slippage protection and deadline enforcement in placeBet().
 *
 * Attack Scenario:
 * - MEV bot front-runs user bet with large bet to manipulate odds
 * - User gets worse odds than expected (5-15% profit loss)
 * - With fix: minAcceptableOdds reverts if odds too low
 * - With fix: deadline reverts if transaction too old
 *
 * Coverage:
 * - minAcceptableOdds enforcement
 * - Deadline enforcement
 * - Disable protections with 0 values
 * - Sandwich attack prevention
 * - Odds calculation correctness
 */
describe("MEDIUM-001: Front-Running Protection", function () {
    async function deployFixture() {
        const [owner, admin, resolver, creator, user1, user2, mevBot] = await ethers.getSigners();

        // Deploy infrastructure (simplified)
        const MasterRegistry = await ethers.getContractFactory("MasterRegistry");
        const registry = await MasterRegistry.deploy();
        await registry.waitForDeployment();

        const AccessControlManager = await ethers.getContractFactory("AccessControlManager");
        const accessControl = await AccessControlManager.deploy(registry.target);
        await accessControl.waitForDeployment();

        await registry.setContract(
            ethers.keccak256(ethers.toUtf8Bytes("AccessControlManager")),
            accessControl.target
        );

        const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
        const RESOLVER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("RESOLVER_ROLE"));
        await accessControl.grantRole(ADMIN_ROLE, admin.address);
        await accessControl.grantRole(RESOLVER_ROLE, resolver.address);

        const RewardDistributor = await ethers.getContractFactory("RewardDistributor");
        const rewardDistributor = await RewardDistributor.deploy(registry.target);
        await rewardDistributor.waitForDeployment();

        await registry.setContract(
            ethers.keccak256(ethers.toUtf8Bytes("RewardDistributor")),
            rewardDistributor.target
        );

        const ResolutionManager = await ethers.getContractFactory("ResolutionManager");
        const resolutionManager = await ResolutionManager.deploy(
            registry.target,
            7 * 24 * 60 * 60,
            ethers.parseEther("1")
        );
        await resolutionManager.waitForDeployment();

        await registry.setContract(
            ethers.keccak256(ethers.toUtf8Bytes("ResolutionManager")),
            resolutionManager.target
        );

        // Create market
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
            market,
            owner,
            admin,
            resolver,
            creator,
            user1,
            user2,
            mevBot,
            deadline
        };
    }

    describe("Slippage Protection", function () {
        it("Should revert when odds below minAcceptableOdds", async function () {
            const { market, user1, user2 } = await loadFixture(deployFixture);

            // User1 places bet, establishing initial odds
            await market.connect(user1).placeBet(1, "0x", 0, 0, {
                value: ethers.parseEther("10")
            });

            // User2 tries to bet with protection
            // After user2's bet, odds would be unfavorable
            // Set minAcceptableOdds too high so it reverts
            await expect(
                market.connect(user2).placeBet(1, "0x", 9000, 0, {
                    value: ethers.parseEther("1")
                })
            ).to.be.revertedWithCustomError(market, "SlippageTooHigh");
        });

        it("Should succeed when odds at or above minAcceptableOdds", async function () {
            const { market, user1, user2 } = await loadFixture(deployFixture);

            // Establish initial pool
            await market.connect(user1).placeBet(1, "0x", 0, 0, {
                value: ethers.parseEther("5")
            });
            await market.connect(user2).placeBet(2, "0x", 0, 0, {
                value: ethers.parseEther("5")
            });

            // Place bet with reasonable minAcceptableOdds
            await expect(
                market.connect(user1).placeBet(1, "0x", 3000, 0, {
                    value: ethers.parseEther("1")
                })
            ).to.not.be.reverted;
        });

        it("Should work with minAcceptableOdds = 0 (disabled)", async function () {
            const { market, user1 } = await loadFixture(deployFixture);

            // With 0, protection is disabled - should always work
            await expect(
                market.connect(user1).placeBet(1, "0x", 0, 0, {
                    value: ethers.parseEther("1")
                })
            ).to.not.be.reverted;
        });

        it("Should calculate odds correctly after bet", async function () {
            const { market, user1, user2 } = await loadFixture(deployFixture);

            // Place initial bets
            await market.connect(user1).placeBet(1, "0x", 0, 0, {
                value: ethers.parseEther("6")
            });
            await market.connect(user2).placeBet(2, "0x", 0, 0, {
                value: ethers.parseEther("4")
            });

            // Total pool: 10 ETH
            // Outcome1: 6 ETH, Outcome2: 4 ETH
            // Implied odds for outcome1: (4/10) * 10000 = 4000 (40%)

            // User1 bets 2 more on outcome1
            // New pool: 12 ETH
            // New outcome1: 8 ETH, outcome2: 4 ETH
            // New implied odds: (4/12) * 10000 = 3333 (33.33%)

            // Should revert if minAcceptableOdds > 3333
            await expect(
                market.connect(user1).placeBet(1, "0x", 3500, 0, {
                    value: ethers.parseEther("2")
                })
            ).to.be.revertedWithCustomError(market, "SlippageTooHigh");

            // Should succeed if minAcceptableOdds <= 3333
            await expect(
                market.connect(user1).placeBet(1, "0x", 3300, 0, {
                    value: ethers.parseEther("2")
                })
            ).to.not.be.reverted;
        });
    });

    describe("Deadline Protection", function () {
        it("Should revert when deadline expired", async function () {
            const { market, user1 } = await loadFixture(deployFixture);

            const currentTime = await time.latest();
            const expiredDeadline = currentTime - 100;

            await expect(
                market.connect(user1).placeBet(1, "0x", 0, expiredDeadline, {
                    value: ethers.parseEther("1")
                })
            ).to.be.revertedWithCustomError(market, "DeadlineExpired");
        });

        it("Should succeed when deadline not expired", async function () {
            const { market, user1 } = await loadFixture(deployFixture);

            const currentTime = await time.latest();
            const futureDeadline = currentTime + 1000;

            await expect(
                market.connect(user1).placeBet(1, "0x", 0, futureDeadline, {
                    value: ethers.parseEther("1")
                })
            ).to.not.be.reverted;
        });

        it("Should work with deadline = 0 (disabled)", async function () {
            const { market, user1 } = await loadFixture(deployFixture);

            await expect(
                market.connect(user1).placeBet(1, "0x", 0, 0, {
                    value: ethers.parseEther("1")
                })
            ).to.not.be.reverted;
        });
    });

    describe("MEV Attack Prevention", function () {
        it("Should prevent sandwich attacks", async function () {
            const { market, user1, mevBot } = await loadFixture(deployFixture);

            // MEV bot front-runs with large bet
            await market.connect(mevBot).placeBet(1, "0x", 0, 0, {
                value: ethers.parseEther("100")
            });

            // User tries to bet but odds are now terrible
            // With minAcceptableOdds, transaction reverts
            await expect(
                market.connect(user1).placeBet(2, "0x", 4500, 0, {
                    value: ethers.parseEther("10")
                })
            ).to.be.revertedWithCustomError(market, "SlippageTooHigh");

            // User could succeed with lower minAcceptableOdds or 0
            await expect(
                market.connect(user1).placeBet(2, "0x", 0, 0, {
                    value: ethers.parseEther("10")
                })
            ).to.not.be.reverted;
        });

        it("Should protect against stale transactions", async function () {
            const { market, user1 } = await loadFixture(deployFixture);

            const currentTime = await time.latest();
            const shortDeadline = currentTime + 10;

            // Advance time to expire the deadline
            await time.increase(20);

            // Transaction should revert
            await expect(
                market.connect(user1).placeBet(1, "0x", 0, shortDeadline, {
                    value: ethers.parseEther("1")
                })
            ).to.be.revertedWithCustomError(market, "DeadlineExpired");
        });

        it("Should allow user to set conservative slippage", async function () {
            const { market, user1 } = await loadFixture(deployFixture);

            // User sets very conservative slippage (48% minimum odds)
            // First bet should work
            await expect(
                market.connect(user1).placeBet(1, "0x", 4800, 0, {
                    value: ethers.parseEther("1")
                })
            ).to.not.be.reverted;
        });
    });

    describe("Backwards Compatibility", function () {
        it("Should work like before with (0, 0) parameters", async function () {
            const { market, user1, user2, mevBot } = await loadFixture(deployFixture);

            // Any bet should work with (0, 0) - no protection
            await expect(
                market.connect(user1).placeBet(1, "0x", 0, 0, {
                    value: ethers.parseEther("1")
                })
            ).to.not.be.reverted;

            await expect(
                market.connect(mevBot).placeBet(1, "0x", 0, 0, {
                    value: ethers.parseEther("100")
                })
            ).to.not.be.reverted;

            await expect(
                market.connect(user2).placeBet(2, "0x", 0, 0, {
                    value: ethers.parseEther("1")
                })
            ).to.not.be.reverted;
        });
    });

    describe("Emergency Withdrawal", function () {
        it("Should allow emergency withdrawal after 90 days + resolved", async function () {
            const { market, admin, resolver, user1, deadline } = await loadFixture(deployFixture);

            // Place bet and resolve
            await market.connect(user1).placeBet(1, "0x", 0, 0, {
                value: ethers.parseEther("1")
            });

            await time.increaseTo(deadline + 1);
            const resolutionManager = await ethers.getContractAt(
                "ResolutionManager",
                await market.registry().then(r =>
                    r.getContract(ethers.keccak256(ethers.toUtf8Bytes("ResolutionManager")))
                )
            );

            await resolutionManager.connect(resolver).resolveMarket(
                market.target,
                1,
                "Evidence"
            );

            // Advance 90 days
            await time.increase(91 * 24 * 60 * 60);

            // Emergency withdrawal should work
            await expect(
                market.connect(admin).emergencyWithdraw()
            ).to.emit(market, "EmergencyWithdrawal");
        });

        it("Should require admin role", async function () {
            const { market, user1, deadline } = await loadFixture(deployFixture);

            await time.increaseTo(deadline + 91 * 24 * 60 * 60);

            await expect(
                market.connect(user1).emergencyWithdraw()
            ).to.be.revertedWith("Only admin");
        });

        it("Should require market resolved", async function () {
            const { market, admin } = await loadFixture(deployFixture);

            await expect(
                market.connect(admin).emergencyWithdraw()
            ).to.be.revertedWith("Market not resolved");
        });

        it("Should require 90 days passed", async function () {
            const { market, admin, resolver, user1, deadline } = await loadFixture(deployFixture);

            await market.connect(user1).placeBet(1, "0x", 0, 0, {
                value: ethers.parseEther("1")
            });

            await time.increaseTo(deadline + 1);
            const resolutionManager = await ethers.getContractAt(
                "ResolutionManager",
                await market.registry().then(r =>
                    r.getContract(ethers.keccak256(ethers.toUtf8Bytes("ResolutionManager")))
                )
            );

            await resolutionManager.connect(resolver).resolveMarket(
                market.target,
                1,
                "Evidence"
            );

            // Try too early
            await expect(
                market.connect(admin).emergencyWithdraw()
            ).to.be.revertedWith("Too early for emergency withdrawal");
        });
    });
});
