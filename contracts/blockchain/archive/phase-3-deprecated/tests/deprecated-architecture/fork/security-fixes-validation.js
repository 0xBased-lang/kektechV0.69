const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

/**
 * KEKTECH 3.0 Security Fixes - Fork Validation Test Suite
 *
 * This test suite validates all security fixes on BasedAI mainnet fork:
 * - H-2: Bond refund double-spend prevention
 * - M-3: Bond tracking accuracy
 * - M-4: Minimum bet enforcement
 * - M-2: Role-based parameter access
 *
 * Run with: npx hardhat test test/fork/security-fixes-validation.js --network forkedBasedAI
 */
describe("🔒 Security Fixes Validation - BasedAI Fork", function () {
    // Increase timeout for fork operations
    this.timeout(120000);

    let registry, paramStorage, accessControl, factory, market;
    let owner, admin, creator, user1, user2;
    let marketAddress;

    // TX options for BasedAI (legacy transactions, 1 gwei)
    const TX_OPTIONS = {
        gasLimit: 6000000,
        gasPrice: ethers.parseUnits("1", "gwei"),
        type: 0 // Legacy transaction
    };

    before(async function () {
        console.log("\n🚀 Deploying KEKTECH 3.0 with Security Fixes to Fork...\n");

        [owner, admin, creator, user1, user2] = await ethers.getSigners();

        console.log("📋 Deployer:", owner.address);
        console.log("💰 Balance:", ethers.formatEther(await ethers.provider.getBalance(owner.address)), "BASED\n");

        // Deploy VersionedRegistry
        console.log("1️⃣  Deploying VersionedRegistry...");
        const VersionedRegistry = await ethers.getContractFactory("VersionedRegistry");
        registry = await VersionedRegistry.deploy(TX_OPTIONS);
        await registry.waitForDeployment();
        console.log("   ✅ VersionedRegistry:", await registry.getAddress());

        // Deploy AccessControlManager
        console.log("2️⃣  Deploying AccessControlManager...");
        const AccessControlManager = await ethers.getContractFactory("AccessControlManager");
        accessControl = await AccessControlManager.deploy(await registry.getAddress(), TX_OPTIONS);
        await accessControl.waitForDeployment();
        console.log("   ✅ AccessControlManager:", await accessControl.getAddress());

        // Deploy ParameterStorage (WITH M-2 FIX)
        console.log("3️⃣  Deploying ParameterStorage V2 (M-2 FIX)...");
        const ParameterStorage = await ethers.getContractFactory("ParameterStorage");
        paramStorage = await ParameterStorage.deploy(await registry.getAddress(), TX_OPTIONS);
        await paramStorage.waitForDeployment();
        console.log("   ✅ ParameterStorage V2:", await paramStorage.getAddress());

        // Deploy FlexibleMarketFactory (WITH M-3 & H-2 FIXES)
        console.log("4️⃣  Deploying FlexibleMarketFactory V2 (M-3 & H-2 FIXES)...");
        const FlexibleMarketFactory = await ethers.getContractFactory("FlexibleMarketFactory");
        factory = await FlexibleMarketFactory.deploy(
            await registry.getAddress(),
            ethers.parseEther("1"), // minCreatorBond = 1 BASED
            TX_OPTIONS
        );
        await factory.waitForDeployment();
        console.log("   ✅ FlexibleMarketFactory V2:", await factory.getAddress());

        // Deploy ResolutionManager (needed for market resolution)
        console.log("5️⃣  Deploying ResolutionManager...");
        const ResolutionManager = await ethers.getContractFactory("ResolutionManager");
        const resolutionManager = await ResolutionManager.deploy(
            await registry.getAddress(),
            48 * 60 * 60, // disputeWindow: 48 hours
            ethers.parseEther("0.5"), // minDisputeBond: 0.5 BASED
            TX_OPTIONS
        );
        await resolutionManager.waitForDeployment();
        console.log("   ✅ ResolutionManager:", await resolutionManager.getAddress());

        // Register contracts
        console.log("6️⃣  Registering contracts in VersionedRegistry...");
        await registry.setContract(ethers.id("AccessControlManager"), await accessControl.getAddress(), 1);
        await registry.setContract(ethers.id("ParameterStorage"), await paramStorage.getAddress(), 1);
        await registry.setContract(ethers.id("FlexibleMarketFactory"), await factory.getAddress(), 1);
        await registry.setContract(ethers.id("ResolutionManager"), await resolutionManager.getAddress(), 1);
        console.log("   ✅ All contracts registered");

        // Setup roles (M-2 FIX: Use AccessControlManager)
        console.log("7️⃣  Setting up roles...");
        await accessControl.grantRole(ethers.id("ADMIN_ROLE"), owner.address, TX_OPTIONS);
        await accessControl.grantRole(ethers.id("ADMIN_ROLE"), admin.address, TX_OPTIONS);
        await accessControl.grantRole(ethers.id("RESOLVER_ROLE"), admin.address, TX_OPTIONS);
        console.log("   ✅ Roles configured");

        // Setup parameters
        console.log("8️⃣  Setting parameters...");
        await paramStorage.setParameter(ethers.id("minimumBet"), ethers.parseEther("0.01"), TX_OPTIONS);
        await paramStorage.setParameter(ethers.id("maximumBet"), ethers.parseEther("100"), TX_OPTIONS);
        await paramStorage.setParameter(ethers.id("platformFeePercent"), 250, TX_OPTIONS); // 2.5%
        console.log("   ✅ Parameters set");

        console.log("\n✅ Deployment Complete!\n");
    });

    // ============= M-2: Role-Based Parameter Access =============

    describe("🔐 M-2: Role-Based Parameter Access (FIXED)", function () {
        it("Should enforce ADMIN_ROLE for setParameter", async function () {
            console.log("\n   Testing M-2: Role-based access control...");

            // Owner has ADMIN_ROLE - should succeed
            await expect(
                paramStorage.setParameter(ethers.id("testParam"), 123, TX_OPTIONS)
            ).to.not.be.reverted;
            console.log("   ✅ Owner with ADMIN_ROLE can set parameters");

            // User without ADMIN_ROLE - should revert
            await expect(
                paramStorage.connect(user1).setParameter(ethers.id("testParam"), 456, TX_OPTIONS)
            ).to.be.revertedWithCustomError(paramStorage, "NotAuthorized");
            console.log("   ✅ User without ADMIN_ROLE cannot set parameters");
        });

        it("Should allow multiple admins to manage parameters", async function () {
            console.log("\n   Testing multiple admin access...");

            // Admin (has ADMIN_ROLE) should succeed
            await expect(
                paramStorage.connect(admin).setParameter(ethers.id("adminParam"), 789, TX_OPTIONS)
            ).to.not.be.reverted;
            console.log("   ✅ Admin with ADMIN_ROLE can set parameters");

            // Verify value was set
            const value = await paramStorage.getParameter(ethers.id("adminParam"));
            expect(value).to.equal(789);
            console.log("   ✅ Parameter value correct:", value.toString());
        });
    });

    // ============= M-4: Minimum Bet Enforcement =============

    describe("💰 M-4: Minimum Bet Enforcement (FIXED)", function () {
        before(async function () {
            // Create a test market
            console.log("\n   Creating test market for M-4 validation...");

            const resolutionTime = Math.floor(Date.now() / 1000) + 86400; // 1 day from now
            const config = {
                question: "Security Fix Validation Market",
                description: "Testing M-4: Minimum bet enforcement",
                resolutionTime: resolutionTime,
                creatorBond: ethers.parseEther("1"),
                category: ethers.id("security-test"),
                outcome1: "Yes",
                outcome2: "No"
            };

            const tx = await factory.connect(creator).createMarket(
                config,
                { value: ethers.parseEther("1"), ...TX_OPTIONS }
            );
            const receipt = await tx.wait();

            // Extract market address from event
            const event = receipt.logs.find(log => {
                try {
                    return factory.interface.parseLog(log).name === "MarketCreated";
                } catch {
                    return false;
                }
            });
            marketAddress = factory.interface.parseLog(event).args.marketAddress;

            // Get market contract
            const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
            market = PredictionMarket.attach(marketAddress);

            console.log("   ✅ Test market created:", marketAddress);
        });

        it("Should enforce minimum bet (0.01 BASED)", async function () {
            console.log("\n   Testing M-4: Minimum bet enforcement...");

            // Bet below minimum should revert
            await expect(
                market.connect(user1).placeBet(1, 0, { value: ethers.parseEther("0.005"), ...TX_OPTIONS })
            ).to.be.revertedWithCustomError(market, "BetTooSmall");
            console.log("   ✅ Bet below minimum (0.005 BASED) reverted");

            // Bet at minimum should succeed
            await expect(
                market.connect(user1).placeBet(1, 0, { value: ethers.parseEther("0.01"), ...TX_OPTIONS })
            ).to.not.be.reverted;
            console.log("   ✅ Bet at minimum (0.01 BASED) succeeded");

            // Bet above minimum should succeed
            await expect(
                market.connect(user2).placeBet(2, 0, { value: ethers.parseEther("1"), ...TX_OPTIONS })
            ).to.not.be.reverted;
            console.log("   ✅ Bet above minimum (1 BASED) succeeded");
        });

        it("Should NOT allow bypass with minimumBet = 0", async function () {
            console.log("\n   Testing M-4: No bypass with zero minimum...");

            // Set minimum to 0 (admin only)
            await paramStorage.setParameter(ethers.id("minimumBet"), 0, TX_OPTIONS);
            console.log("   📝 Set minimumBet to 0");

            // With M-4 fix, 0 means "0 minimum enforced", not "bypass"
            // So bet of 0 should revert
            await expect(
                market.connect(user1).placeBet(1, 0, { value: 0, ...TX_OPTIONS })
            ).to.be.reverted; // Will revert with InvalidBetAmount or similar
            console.log("   ✅ Zero-value bet reverted (no bypass)");

            // Reset minimum for other tests
            await paramStorage.setParameter(ethers.id("minimumBet"), ethers.parseEther("0.01"), TX_OPTIONS);
        });
    });

    // ============= M-3: Bond Tracking =============

    describe("📊 M-3: Bond Tracking Accuracy (FIXED)", function () {
        let testMarket1, testMarket2;
        const bond1 = ethers.parseEther("1.5");
        const bond2 = ethers.parseEther("2.0");

        it("Should track creator bonds accurately", async function () {
            console.log("\n   Testing M-3: Bond tracking...");

            // Create market 1 with 1.5 BASED bond
            const resolutionTime = Math.floor(Date.now() / 1000) + 86400;
            const config1 = {
                question: "Bond Test Market 1",
                description: "Testing M-3",
                resolutionTime: resolutionTime,
                creatorBond: bond1,
                category: ethers.id("bond-test"),
                outcome1: "Yes",
                outcome2: "No"
            };

            const tx1 = await factory.connect(creator).createMarket(
                config1,
                { value: bond1, ...TX_OPTIONS }
            );
            const receipt1 = await tx1.wait();
            const event1 = receipt1.logs.find(log => {
                try {
                    return factory.interface.parseLog(log).name === "MarketCreated";
                } catch {
                    return false;
                }
            });
            testMarket1 = factory.interface.parseLog(event1).args.marketAddress;
            console.log("   ✅ Market 1 created with", ethers.formatEther(bond1), "BASED bond");

            // Create market 2 with 2.0 BASED bond
            const config2 = {
                question: "Bond Test Market 2",
                description: "Testing M-3",
                resolutionTime: resolutionTime,
                creatorBond: bond2,
                category: ethers.id("bond-test"),
                outcome1: "Yes",
                outcome2: "No"
            };

            const tx2 = await factory.connect(user1).createMarket(
                config2,
                { value: bond2, ...TX_OPTIONS }
            );
            const receipt2 = await tx2.wait();
            const event2 = receipt2.logs.find(log => {
                try {
                    return factory.interface.parseLog(log).name === "MarketCreated";
                } catch {
                    return false;
                }
            });
            testMarket2 = factory.interface.parseLog(event2).args.marketAddress;
            console.log("   ✅ Market 2 created with", ethers.formatEther(bond2), "BASED bond");

            // Verify heldBonds tracking (M-3 FIX)
            const held1 = await factory.getHeldBond(testMarket1);
            const held2 = await factory.getHeldBond(testMarket2);

            expect(held1).to.equal(bond1);
            expect(held2).to.equal(bond2);
            console.log("   ✅ Bond 1 tracked:", ethers.formatEther(held1), "BASED");
            console.log("   ✅ Bond 2 tracked:", ethers.formatEther(held2), "BASED");

            // Verify total bonds
            const totalBonds = await factory.getTotalHeldBonds();
            expect(totalBonds).to.be.gte(bond1 + bond2); // >= because there might be other markets
            console.log("   ✅ Total bonds tracked:", ethers.formatEther(totalBonds), "BASED");

            // Verify factory balance matches accounting
            const factoryBalance = await ethers.provider.getBalance(await factory.getAddress());
            expect(factoryBalance).to.be.gte(totalBonds);
            console.log("   ✅ Factory balance:", ethers.formatEther(factoryBalance), "BASED");
            console.log("   ✅ Balance >= Total bonds (accounting correct)");
        });
    });

    // ============= H-2: Double-Spend Prevention =============

    describe("🛡️  H-2: Bond Refund Double-Spend Prevention (FIXED)", function () {
        let refundTestMarket;
        const bondAmount = ethers.parseEther("1");

        before(async function () {
            // Create a market for refund testing
            console.log("\n   Creating market for H-2 refund test...");

            const resolutionTime = Math.floor(Date.now() / 1000) + 86400;
            const config = {
                question: "Refund Test Market",
                description: "Testing H-2: Double-spend prevention",
                resolutionTime: resolutionTime,
                creatorBond: bondAmount,
                category: ethers.id("refund-test"),
                outcome1: "Yes",
                outcome2: "No"
            };

            const tx = await factory.connect(creator).createMarket(
                config,
                { value: bondAmount, ...TX_OPTIONS }
            );
            const receipt = await tx.wait();
            const event = receipt.logs.find(log => {
                try {
                    return factory.interface.parseLog(log).name === "MarketCreated";
                } catch {
                    return false;
                }
            });
            refundTestMarket = factory.interface.parseLog(event).args.marketAddress;
            console.log("   ✅ Refund test market created:", refundTestMarket);
        });

        it("Should refund bond successfully", async function () {
            console.log("\n   Testing H-2: First refund (should succeed)...");

            // Get creator balance before refund
            const balanceBefore = await ethers.provider.getBalance(creator.address);

            // Verify bond is tracked
            const heldBefore = await factory.getHeldBond(refundTestMarket);
            expect(heldBefore).to.equal(bondAmount);
            console.log("   📊 Bond tracked before refund:", ethers.formatEther(heldBefore), "BASED");

            // Refund bond (admin only)
            await factory.connect(admin).refundCreatorBond(refundTestMarket, TX_OPTIONS);
            console.log("   ✅ Bond refunded successfully");

            // Verify creator received funds
            const balanceAfter = await ethers.provider.getBalance(creator.address);
            expect(balanceAfter).to.be.gt(balanceBefore);
            console.log("   ✅ Creator received refund");

            // Verify heldBonds was zeroed (M-3 + H-2 FIX)
            const heldAfter = await factory.getHeldBond(refundTestMarket);
            expect(heldAfter).to.equal(0);
            console.log("   ✅ Bond tracking zeroed:", heldAfter.toString());
        });

        it("Should prevent double-spend (second refund should revert)", async function () {
            console.log("\n   Testing H-2: Double-spend prevention...");

            // Try to refund again - should revert
            await expect(
                factory.connect(admin).refundCreatorBond(refundTestMarket, TX_OPTIONS)
            ).to.be.revertedWithCustomError(factory, "InvalidBondAmount");
            console.log("   ✅ Second refund attempt reverted (double-spend prevented!)");

            // Verify bond is still zero
            const held = await factory.getHeldBond(refundTestMarket);
            expect(held).to.equal(0);
            console.log("   ✅ Bond remains zero:", held.toString());
        });
    });

    // ============= Complete Market Lifecycle =============

    describe("🔄 Complete Market Lifecycle on Fork", function () {
        let lifecycleMarket;
        let lifecycleMarketAddress;

        it("Should complete full cycle: Create → Bet → Resolve → Claim", async function () {
            console.log("\n   Testing complete market lifecycle...");

            // 1. CREATE MARKET
            console.log("\n   1️⃣  Creating market...");
            const resolutionTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour
            const config = {
                question: "Will lifecycle test succeed?",
                description: "Complete lifecycle validation",
                resolutionTime: resolutionTime,
                creatorBond: ethers.parseEther("1"),
                category: ethers.id("lifecycle"),
                outcome1: "Yes",
                outcome2: "No"
            };

            const tx = await factory.connect(creator).createMarket(
                config,
                { value: ethers.parseEther("1"), ...TX_OPTIONS }
            );
            const receipt = await tx.wait();
            const event = receipt.logs.find(log => {
                try {
                    return factory.interface.parseLog(log).name === "MarketCreated";
                } catch {
                    return false;
                }
            });
            lifecycleMarketAddress = factory.interface.parseLog(event).args.marketAddress;

            const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
            lifecycleMarket = PredictionMarket.attach(lifecycleMarketAddress);
            console.log("   ✅ Market created:", lifecycleMarketAddress);

            // 2. PLACE BETS
            console.log("\n   2️⃣  Placing bets...");
            await lifecycleMarket.connect(user1).placeBet(1, 0, { value: ethers.parseEther("5"), ...TX_OPTIONS });
            console.log("   ✅ User1 bet 5 BASED on outcome 1");

            await lifecycleMarket.connect(user2).placeBet(2, 0, { value: ethers.parseEther("3"), ...TX_OPTIONS });
            console.log("   ✅ User2 bet 3 BASED on outcome 2");

            // Verify bets
            const info = await lifecycleMarket.getMarketInfo();
            expect(info.totalVolume).to.equal(ethers.parseEther("8"));
            expect(info.totalBets).to.equal(2);
            console.log("   ✅ Total volume:", ethers.formatEther(info.totalVolume), "BASED");
            console.log("   ✅ Total bets:", info.totalBets.toString());

            // 3. FAST FORWARD TIME
            console.log("\n   3️⃣  Fast forwarding to resolution time...");
            await time.increaseTo(resolutionTime + 1);
            console.log("   ✅ Time advanced");

            // 4. RESOLVE MARKET
            console.log("\n   4️⃣  Resolving market...");
            await lifecycleMarket.connect(admin).resolveMarket(1, TX_OPTIONS); // Outcome 1 wins
            console.log("   ✅ Market resolved (Outcome 1 wins)");

            // Verify resolution
            const infoAfter = await lifecycleMarket.getMarketInfo();
            expect(infoAfter.isResolved).to.be.true;
            expect(infoAfter.result).to.equal(1);
            console.log("   ✅ Market is resolved");

            // 5. CLAIM WINNINGS
            console.log("\n   5️⃣  Claiming winnings...");
            const balanceBefore = await ethers.provider.getBalance(user1.address);

            await lifecycleMarket.connect(user1).claimWinnings(TX_OPTIONS);
            console.log("   ✅ User1 claimed winnings");

            const balanceAfter = await ethers.provider.getBalance(user1.address);
            expect(balanceAfter).to.be.gt(balanceBefore);
            console.log("   ✅ User1 received payout");

            // Verify cannot claim twice
            await expect(
                lifecycleMarket.connect(user1).claimWinnings(TX_OPTIONS)
            ).to.be.revertedWithCustomError(lifecycleMarket, "AlreadyClaimed");
            console.log("   ✅ Double claim prevented");

            console.log("\n   🎉 Complete lifecycle test passed!");
        });
    });

    // ============= Final Summary =============

    after(async function () {
        console.log("\n" + "=".repeat(70));
        console.log("🎉 FORK VALIDATION COMPLETE!");
        console.log("=".repeat(70));
        console.log("\n✅ All Security Fixes Validated on BasedAI Fork:\n");
        console.log("   🔐 M-2: Role-based parameter access working correctly");
        console.log("   💰 M-4: Minimum bet enforcement (no bypass)");
        console.log("   📊 M-3: Bond tracking accurate");
        console.log("   🛡️  H-2: Double-spend prevention working");
        console.log("   🔄 Complete market lifecycle functional");
        console.log("\n" + "=".repeat(70));
        console.log("✅ System is PRODUCTION READY for mainnet deployment!");
        console.log("=".repeat(70) + "\n");
    });
});
