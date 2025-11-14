const { expect } = require("chai");
const { ethers } = require("hardhat");

/**
 * MEDIUM FIXES M-1 & M-2: Validation Tests
 *
 * M-1: Emergency Pause Mechanism
 * M-2: Maximum Market Duration (1 year)
 *
 * These features were already implemented in the codebase.
 * These tests validate they work correctly.
 */
describe("🔧 M-1 & M-2: MEDIUM Fixes Validation", function () {
    let factory, masterRegistry, accessControl, parameterStorage, curveRegistry, lmsrCurve;
    let deployer, user1, attacker;
    const MIN_CREATOR_BOND = ethers.parseEther("0.1");
    const ONE_YEAR = 31536000; // seconds

    beforeEach(async function () {
        [deployer, user1, attacker] = await ethers.getSigners();

        // Deploy infrastructure
        const MasterRegistry = await ethers.getContractFactory("MasterRegistry");
        masterRegistry = await MasterRegistry.deploy();
        await masterRegistry.waitForDeployment();

        const AccessControlManager = await ethers.getContractFactory("AccessControlManager");
        accessControl = await AccessControlManager.deploy(await masterRegistry.getAddress());
        await accessControl.waitForDeployment();

        const ParameterStorage = await ethers.getContractFactory("ParameterStorage");
        parameterStorage = await ParameterStorage.deploy(await masterRegistry.getAddress());
        await parameterStorage.waitForDeployment();

        // Register
        await masterRegistry.setContract(ethers.id("AccessControlManager"), await accessControl.getAddress());
        await masterRegistry.setContract(ethers.id("ParameterStorage"), await parameterStorage.getAddress());

        // Deploy CurveRegistry
        const CurveRegistry = await ethers.getContractFactory("CurveRegistry");
        curveRegistry = await CurveRegistry.deploy(await accessControl.getAddress());
        await curveRegistry.waitForDeployment();
        await masterRegistry.setContract(ethers.id("CurveRegistry"), await curveRegistry.getAddress());

        // Deploy LMSR
        const LMSRBondingCurve = await ethers.getContractFactory("LMSRBondingCurve");
        lmsrCurve = await LMSRBondingCurve.deploy();
        await lmsrCurve.waitForDeployment();
        await curveRegistry.registerCurve(await lmsrCurve.getAddress(), "v1.0.0", "LMSR", "DeFi", "", []);

        // Deploy Factory
        const FlexibleMarketFactory = await ethers.getContractFactory("FlexibleMarketFactory");
        factory = await FlexibleMarketFactory.deploy(await masterRegistry.getAddress(), MIN_CREATOR_BOND);
        await factory.waitForDeployment();
    });

    // ==================== M-1: EMERGENCY PAUSE MECHANISM ====================
    describe("🛡️ M-1: Emergency Pause Mechanism", function () {

        it("Should allow market creation when NOT paused", async function () {
            const now = await ethers.provider.getBlock('latest').then(b => b.timestamp);
            const marketConfig = {
                question: "Test market",
                description: "Testing pause",
                resolutionTime: now + 86400,
                creatorBond: MIN_CREATOR_BOND,
                category: ethers.id("Test"),
                outcome1: "Yes",
                outcome2: "No"
            };

            // Should work when not paused
            const tx = await factory.createMarketWithCurve(
                marketConfig,
                0, // LMSR
                ethers.parseEther("10"),
                { value: MIN_CREATOR_BOND }
            );

            await expect(tx).to.not.be.reverted;
        });

        it("Should prevent market creation when paused", async function () {
            // Pause the factory
            await factory.pause();

            const now = await ethers.provider.getBlock('latest').then(b => b.timestamp);
            const marketConfig = {
                question: "Test market",
                description: "Testing pause",
                resolutionTime: now + 86400,
                creatorBond: MIN_CREATOR_BOND,
                category: ethers.id("Test"),
                outcome1: "Yes",
                outcome2: "No"
            };

            // Should revert when paused
            await expect(
                factory.createMarketWithCurve(
                    marketConfig,
                    0,
                    ethers.parseEther("10"),
                    { value: MIN_CREATOR_BOND }
                )
            ).to.be.reverted; // Should revert with ContractPaused
        });

        it("Should only allow admin to pause", async function () {
            // Non-admin tries to pause
            await expect(
                factory.connect(attacker).pause()
            ).to.be.reverted; // Should revert with UnauthorizedAccess

            // Admin can pause
            await expect(factory.pause()).to.not.be.reverted;
        });

        it("Should only allow admin to unpause", async function () {
            // Pause first
            await factory.pause();

            // Non-admin tries to unpause
            await expect(
                factory.connect(attacker).unpause()
            ).to.be.reverted; // Should revert with UnauthorizedAccess

            // Admin can unpause
            await expect(factory.unpause()).to.not.be.reverted;
        });

        it("Should emit event when paused", async function () {
            await expect(factory.pause())
                .to.emit(factory, "FactoryPaused")
                .withArgs(true);
        });

        it("Should emit event when unpaused", async function () {
            await factory.pause();

            await expect(factory.unpause())
                .to.emit(factory, "FactoryPaused")
                .withArgs(false);
        });

        it("Should allow creation after unpause", async function () {
            // Pause
            await factory.pause();

            // Verify paused
            expect(await factory.paused()).to.equal(true);

            // Unpause
            await factory.unpause();

            // Verify unpaused
            expect(await factory.paused()).to.equal(false);

            // Create market should work
            const now = await ethers.provider.getBlock('latest').then(b => b.timestamp);
            const marketConfig = {
                question: "After unpause",
                description: "Testing unpause",
                resolutionTime: now + 86400,
                creatorBond: MIN_CREATOR_BOND,
                category: ethers.id("Test"),
                outcome1: "Yes",
                outcome2: "No"
            };

            const tx = await factory.createMarketWithCurve(
                marketConfig,
                0,
                ethers.parseEther("10"),
                { value: MIN_CREATOR_BOND }
            );

            await expect(tx).to.not.be.reverted;
        });

        it("Should prevent template creation when paused", async function () {
            await factory.pause();

            const now = await ethers.provider.getBlock('latest').then(b => b.timestamp);
            const config = {
                question: "Test",
                description: "Test",
                resolutionTime: now + 86400,
                creatorBond: MIN_CREATOR_BOND,
                category: ethers.id("Test"),
                outcome1: "Yes",
                outcome2: "No"
            };

            // createTemplate should also be blocked
            await expect(
                factory.createTemplate(
                    "TestTemplate",
                    config,
                    0, // LMSR
                    ethers.parseEther("10")
                )
            ).to.be.reverted;
        });

        it("Should check pause state is public", async function () {
            // Initially not paused
            expect(await factory.paused()).to.equal(false);

            // After pause
            await factory.pause();
            expect(await factory.paused()).to.equal(true);

            // After unpause
            await factory.unpause();
            expect(await factory.paused()).to.equal(false);
        });
    });

    // ==================== M-2: MAXIMUM MARKET DURATION ====================
    describe("📅 M-2: Maximum Market Duration", function () {

        it("Should accept market with 1 day resolution time", async function () {
            const now = await ethers.provider.getBlock('latest').then(b => b.timestamp);
            const marketConfig = {
                question: "1 day market",
                description: "Testing duration",
                resolutionTime: now + 86400, // 1 day
                creatorBond: MIN_CREATOR_BOND,
                category: ethers.id("Test"),
                outcome1: "Yes",
                outcome2: "No"
            };

            const tx = await factory.createMarketWithCurve(
                marketConfig,
                0,
                ethers.parseEther("10"),
                { value: MIN_CREATOR_BOND }
            );

            await expect(tx).to.not.be.reverted;
        });

        it("Should accept market with 1 week resolution time", async function () {
            const now = await ethers.provider.getBlock('latest').then(b => b.timestamp);
            const marketConfig = {
                question: "1 week market",
                description: "Testing duration",
                resolutionTime: now + (86400 * 7), // 1 week
                creatorBond: MIN_CREATOR_BOND,
                category: ethers.id("Test"),
                outcome1: "Yes",
                outcome2: "No"
            };

            const tx = await factory.createMarketWithCurve(
                marketConfig,
                0,
                ethers.parseEther("10"),
                { value: MIN_CREATOR_BOND }
            );

            await expect(tx).to.not.be.reverted;
        });

        it("Should accept market with 6 months resolution time", async function () {
            const now = await ethers.provider.getBlock('latest').then(b => b.timestamp);
            const marketConfig = {
                question: "6 months market",
                description: "Testing duration",
                resolutionTime: now + (86400 * 180), // ~6 months
                creatorBond: MIN_CREATOR_BOND,
                category: ethers.id("Test"),
                outcome1: "Yes",
                outcome2: "No"
            };

            const tx = await factory.createMarketWithCurve(
                marketConfig,
                0,
                ethers.parseEther("10"),
                { value: MIN_CREATOR_BOND }
            );

            await expect(tx).to.not.be.reverted;
        });

        it("Should accept market with exactly 1 year resolution time", async function () {
            const now = await ethers.provider.getBlock('latest').then(b => b.timestamp);
            const marketConfig = {
                question: "1 year market",
                description: "Testing max duration",
                resolutionTime: now + ONE_YEAR, // Exactly 1 year
                creatorBond: MIN_CREATOR_BOND,
                category: ethers.id("Test"),
                outcome1: "Yes",
                outcome2: "No"
            };

            const tx = await factory.createMarketWithCurve(
                marketConfig,
                0,
                ethers.parseEther("10"),
                { value: MIN_CREATOR_BOND }
            );

            await expect(tx).to.not.be.reverted;
        });

        it("Should reject market with 1 year + 1 day resolution time", async function () {
            const now = await ethers.provider.getBlock('latest').then(b => b.timestamp);
            const marketConfig = {
                question: "Over 1 year market",
                description: "Testing max duration exceeded",
                resolutionTime: now + ONE_YEAR + 86400, // 1 year + 1 day
                creatorBond: MIN_CREATOR_BOND,
                category: ethers.id("Test"),
                outcome1: "Yes",
                outcome2: "No"
            };

            await expect(
                factory.createMarketWithCurve(
                    marketConfig,
                    0,
                    ethers.parseEther("10"),
                    { value: MIN_CREATOR_BOND }
                )
            ).to.be.reverted; // Should revert with InvalidResolutionTime
        });

        it("Should reject market with 2 years resolution time", async function () {
            const now = await ethers.provider.getBlock('latest').then(b => b.timestamp);
            const marketConfig = {
                question: "2 years market",
                description: "Testing way too long",
                resolutionTime: now + (ONE_YEAR * 2), // 2 years
                creatorBond: MIN_CREATOR_BOND,
                category: ethers.id("Test"),
                outcome1: "Yes",
                outcome2: "No"
            };

            await expect(
                factory.createMarketWithCurve(
                    marketConfig,
                    0,
                    ethers.parseEther("10"),
                    { value: MIN_CREATOR_BOND }
                )
            ).to.be.reverted; // Should revert with InvalidResolutionTime
        });

        it("Should reject market with 10 years resolution time", async function () {
            const now = await ethers.provider.getBlock('latest').then(b => b.timestamp);
            const marketConfig = {
                question: "10 years market",
                description: "Testing extremely long",
                resolutionTime: now + (ONE_YEAR * 10), // 10 years
                creatorBond: MIN_CREATOR_BOND,
                category: ethers.id("Test"),
                outcome1: "Yes",
                outcome2: "No"
            };

            await expect(
                factory.createMarketWithCurve(
                    marketConfig,
                    0,
                    ethers.parseEther("10"),
                    { value: MIN_CREATOR_BOND }
                )
            ).to.be.reverted; // Should revert with InvalidResolutionTime
        });

        it("Should prevent protocol governance issues from long markets", async function () {
            const now = await ethers.provider.getBlock('latest').then(b => b.timestamp);

            // Try to create 100 markets with 10 year durations
            const longDuration = now + (ONE_YEAR * 10);

            const marketConfig = {
                question: "Long market",
                description: "Lock funds for 10 years",
                resolutionTime: longDuration,
                creatorBond: MIN_CREATOR_BOND,
                category: ethers.id("Test"),
                outcome1: "Yes",
                outcome2: "No"
            };

            // Should be rejected (can't lock bonds for 10 years)
            await expect(
                factory.createMarketWithCurve(
                    marketConfig,
                    0,
                    ethers.parseEther("10"),
                    { value: MIN_CREATOR_BOND }
                )
            ).to.be.reverted;
        });

        it("Should protect creator bonds from indefinite lock", async function () {
            const now = await ethers.provider.getBlock('latest').then(b => b.timestamp);

            // Malicious actor tries to lock creator bond for 100 years
            const veryLongTime = now + (ONE_YEAR * 100);

            const marketConfig = {
                question: "Evil long market",
                description: "Lock bonds forever",
                resolutionTime: veryLongTime,
                creatorBond: ethers.parseEther("10"), // Large bond
                category: ethers.id("Test"),
                outcome1: "Yes",
                outcome2: "No"
            };

            // Should be rejected
            await expect(
                factory.createMarketWithCurve(
                    marketConfig,
                    0,
                    ethers.parseEther("10"),
                    { value: ethers.parseEther("10") }
                )
            ).to.be.reverted;
        });
    });

    // ==================== COMBINED SCENARIOS ====================
    describe("🔄 Combined M-1 & M-2 Scenarios", function () {

        it("Should enforce both pause and duration limits", async function () {
            const now = await ethers.provider.getBlock('latest').then(b => b.timestamp);

            // Pause factory
            await factory.pause();

            // Try to create long market (both checks should apply)
            const marketConfig = {
                question: "Both checks",
                description: "Testing combined",
                resolutionTime: now + (ONE_YEAR * 2), // Too long
                creatorBond: MIN_CREATOR_BOND,
                category: ethers.id("Test"),
                outcome1: "Yes",
                outcome2: "No"
            };

            // Should revert due to pause (checked first)
            await expect(
                factory.createMarketWithCurve(
                    marketConfig,
                    0,
                    ethers.parseEther("10"),
                    { value: MIN_CREATOR_BOND }
                )
            ).to.be.reverted; // ContractPaused
        });

        it("Should check duration even when NOT paused", async function () {
            const now = await ethers.provider.getBlock('latest').then(b => b.timestamp);

            // Not paused
            expect(await factory.paused()).to.equal(false);

            // Try long market
            const marketConfig = {
                question: "Duration check",
                description: "Testing duration when not paused",
                resolutionTime: now + (ONE_YEAR * 5),
                creatorBond: MIN_CREATOR_BOND,
                category: ethers.id("Test"),
                outcome1: "Yes",
                outcome2: "No"
            };

            // Should still revert due to duration
            await expect(
                factory.createMarketWithCurve(
                    marketConfig,
                    0,
                    ethers.parseEther("10"),
                    { value: MIN_CREATOR_BOND }
                )
            ).to.be.reverted; // InvalidResolutionTime
        });
    });
});
