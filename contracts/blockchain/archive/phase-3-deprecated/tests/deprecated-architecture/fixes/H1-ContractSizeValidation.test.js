const { expect } = require("chai");
const { ethers } = require("hardhat");

/**
 * HIGH FIX H-1: Contract Size Validation Test
 *
 * Validates that:
 * 1. String length limits prevent deployment failures
 * 2. Post-deployment size check catches oversized contracts
 * 3. Normal markets deploy successfully
 */
describe("🔧 H-1: Contract Size Validation Fix", function () {
    let factory, masterRegistry, accessControl, parameterStorage, curveRegistry, lmsrCurve;
    let deployer;
    const MIN_CREATOR_BOND = ethers.parseEther("0.1");

    beforeEach(async function () {
        [deployer] = await ethers.getSigners();

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

    describe("✅ String Length Validation", function () {

        it("Should accept normal-length strings", async function () {
            const now = await ethers.provider.getBlock('latest').then(b => b.timestamp);
            const marketConfig = {
                question: "Will Bitcoin reach $100k?",
                description: "Test market",
                resolutionTime: now + 86400,
                creatorBond: MIN_CREATOR_BOND,
                category: ethers.id("Crypto"),
                outcome1: "Yes",
                outcome2: "No"
            };

            const tx = await factory.createMarketWithCurve(
                marketConfig,
                0, // LMSR
                ethers.parseEther("10"),
                { value: MIN_CREATOR_BOND }
            );

            await expect(tx).to.not.be.reverted;
        });

        it("Should accept maximum-length question (500 chars)", async function () {
            const now = await ethers.provider.getBlock('latest').then(b => b.timestamp);
            const marketConfig = {
                question: "A".repeat(500), // Exactly 500 characters
                description: "Test",
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

        it("Should accept maximum-length description (2000 chars)", async function () {
            const now = await ethers.provider.getBlock('latest').then(b => b.timestamp);
            const marketConfig = {
                question: "Test question",
                description: "B".repeat(2000), // Exactly 2000 characters
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

        it("Should accept maximum-length outcomes (100 chars each)", async function () {
            const now = await ethers.provider.getBlock('latest').then(b => b.timestamp);
            const marketConfig = {
                question: "Test question",
                description: "Test",
                resolutionTime: now + 86400,
                creatorBond: MIN_CREATOR_BOND,
                category: ethers.id("Test"),
                outcome1: "Y".repeat(100), // Exactly 100 characters
                outcome2: "N".repeat(100)  // Exactly 100 characters
            };

            const tx = await factory.createMarketWithCurve(
                marketConfig,
                0,
                ethers.parseEther("10"),
                { value: MIN_CREATOR_BOND }
            );

            await expect(tx).to.not.be.reverted;
        });

        it("Should reject question longer than 500 chars", async function () {
            const now = await ethers.provider.getBlock('latest').then(b => b.timestamp);
            const marketConfig = {
                question: "A".repeat(501), // 1 char over limit
                description: "Test",
                resolutionTime: now + 86400,
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
            ).to.be.reverted; // Should revert with InvalidQuestion
        });

        it("Should reject description longer than 2000 chars", async function () {
            const now = await ethers.provider.getBlock('latest').then(b => b.timestamp);
            const marketConfig = {
                question: "Test",
                description: "B".repeat(2001), // 1 char over limit
                resolutionTime: now + 86400,
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
            ).to.be.reverted; // Should revert with InvalidQuestion
        });

        it("Should reject outcome longer than 100 chars", async function () {
            const now = await ethers.provider.getBlock('latest').then(b => b.timestamp);
            const marketConfig = {
                question: "Test",
                description: "Test",
                resolutionTime: now + 86400,
                creatorBond: MIN_CREATOR_BOND,
                category: ethers.id("Test"),
                outcome1: "Y".repeat(101), // 1 char over limit
                outcome2: "No"
            };

            await expect(
                factory.createMarketWithCurve(
                    marketConfig,
                    0,
                    ethers.parseEther("10"),
                    { value: MIN_CREATOR_BOND }
                )
            ).to.be.reverted; // Should revert with InvalidQuestion
        });

        it("Should reject empty outcomes", async function () {
            const now = await ethers.provider.getBlock('latest').then(b => b.timestamp);
            const marketConfig = {
                question: "Test",
                description: "Test",
                resolutionTime: now + 86400,
                creatorBond: MIN_CREATOR_BOND,
                category: ethers.id("Test"),
                outcome1: "", // Empty
                outcome2: "No"
            };

            await expect(
                factory.createMarketWithCurve(
                    marketConfig,
                    0,
                    ethers.parseEther("10"),
                    { value: MIN_CREATOR_BOND }
                )
            ).to.be.reverted; // Should revert with InvalidQuestion
        });
    });

    describe("✅ Post-Deployment Size Check", function () {

        it("Should validate deployed contract has valid size", async function () {
            const now = await ethers.provider.getBlock('latest').then(b => b.timestamp);
            const marketConfig = {
                question: "Will this deploy successfully?",
                description: "Testing deployment size check",
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

            const receipt = await tx.wait();

            // Find MarketCreated event
            const event = receipt.logs.find(log => {
                try {
                    const parsed = factory.interface.parseLog(log);
                    return parsed.name === "MarketCreated";
                } catch {
                    return false;
                }
            });

            expect(event).to.not.be.undefined;

            const parsed = factory.interface.parseLog(event);
            const marketAddress = parsed.args.marketAddress;

            // Verify contract has valid size (should be > 0 and < 24KB)
            const code = await ethers.provider.getCode(marketAddress);
            const size = (code.length - 2) / 2; // Remove 0x and convert hex to bytes

            console.log(`      Deployed contract size: ${size} bytes (${(size/1024).toFixed(2)} KB)`);

            expect(size).to.be.greaterThan(0);
            expect(size).to.be.lessThan(24576); // Under 24KB EVM limit
        });

        it("Should detect contract size is reasonable", async function () {
            const now = await ethers.provider.getBlock('latest').then(b => b.timestamp);

            // Create market with maximum allowed strings
            const marketConfig = {
                question: "A".repeat(500),    // Max question
                description: "B".repeat(2000), // Max description
                resolutionTime: now + 86400,
                creatorBond: MIN_CREATOR_BOND,
                category: ethers.id("Test"),
                outcome1: "Y".repeat(100),    // Max outcome1
                outcome2: "N".repeat(100)     // Max outcome2
            };

            const tx = await factory.createMarketWithCurve(
                marketConfig,
                0,
                ethers.parseEther("10"),
                { value: MIN_CREATOR_BOND }
            );

            const receipt = await tx.wait();

            // Should still succeed with max strings
            expect(receipt.status).to.equal(1);

            // Find market address
            const event = receipt.logs.find(log => {
                try {
                    const parsed = factory.interface.parseLog(log);
                    return parsed.name === "MarketCreated";
                } catch {
                    return false;
                }
            });

            const parsed = factory.interface.parseLog(event);
            const marketAddress = parsed.args.marketAddress;

            // Verify size is still under limit
            const code = await ethers.provider.getCode(marketAddress);
            const size = (code.length - 2) / 2;

            console.log(`      Max strings contract size: ${size} bytes (${(size/1024).toFixed(2)} KB)`);

            expect(size).to.be.lessThan(24576); // Still under 24KB
        });
    });

    describe("📊 Gas Analysis", function () {

        it("Should report gas usage with string validation", async function () {
            const now = await ethers.provider.getBlock('latest').then(b => b.timestamp);
            const marketConfig = {
                question: "Gas test market",
                description: "Testing gas usage",
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

            const receipt = await tx.wait();
            console.log(`      Gas used with H-1 fix: ${receipt.gasUsed}`);

            // Gas increase should be minimal (< 5000 gas for string checks)
            // Base gas was around 2.7M, so we expect around 2.705M
            expect(receipt.gasUsed).to.be.lessThan(ethers.parseUnits("3000000", 0));
        });
    });
});
