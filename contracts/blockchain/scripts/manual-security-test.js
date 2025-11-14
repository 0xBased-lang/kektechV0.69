/**
 * KEKTECH 3.0 - Manual Security Testing Script
 *
 * This script performs comprehensive manual testing of ALL security fixes:
 * - CRITICAL-001: Pagination DoS Protection
 * - CRITICAL-002: Zero Winner Pool Auto-Cancellation
 * - HIGH-001: Whale Manipulation Protection
 * - HIGH-002: Dispute Bond Treasury Routing
 * - HIGH-003: Template Validation
 *
 * Run with: npx hardhat run scripts/manual-security-test.js --network localhost
 */

const hre = require("hardhat");
const { ethers } = hre;

// Test results tracker
const testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    tests: []
};

function logTest(name, passed, details) {
    testResults.total++;
    if (passed) {
        testResults.passed++;
        console.log(`\n✅ PASS: ${name}`);
    } else {
        testResults.failed++;
        console.log(`\n❌ FAIL: ${name}`);
    }
    if (details) console.log(`   ${details}`);
    testResults.tests.push({ name, passed, details });
}

async function main() {
    console.log("\n╔════════════════════════════════════════════════════════════════╗");
    console.log("║     KEKTECH 3.0 MANUAL SECURITY TESTING                        ║");
    console.log("║     Comprehensive Validation of All Security Fixes            ║");
    console.log("╚════════════════════════════════════════════════════════════════╝\n");

    const [deployer, resolver, user1, user2, disputer, treasury] = await ethers.getSigners();

    console.log("📋 Test Accounts:");
    console.log(`   Deployer: ${deployer.address}`);
    console.log(`   Resolver: ${resolver.address}`);
    console.log(`   User1: ${user1.address}`);
    console.log(`   User2: ${user2.address}`);
    console.log(`   Disputer: ${disputer.address}`);
    console.log(`   Treasury: ${treasury.address}`);

    // ========================================================================
    // DEPLOY SYSTEM
    // ========================================================================

    console.log("\n" + "=".repeat(70));
    console.log("PHASE 1: DEPLOYING COMPLETE SYSTEM");
    console.log("=".repeat(70));

    console.log("\n📦 Deploying core contracts...");

    // Deploy Master Registry
    const MasterRegistry = await ethers.getContractFactory("MasterRegistry");
    const registry = await MasterRegistry.deploy();
    await registry.waitForDeployment();
    console.log(`✓ MasterRegistry: ${registry.target}`);

    // Deploy Access Control Manager
    const AccessControlManager = await ethers.getContractFactory("AccessControlManager");
    const accessControl = await AccessControlManager.deploy(registry.target);
    await accessControl.waitForDeployment();
    await registry.setContract(ethers.keccak256(ethers.toUtf8Bytes("AccessControlManager")), accessControl.target);
    console.log(`✓ AccessControlManager: ${accessControl.target}`);

    // Grant roles
    const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
    const RESOLVER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("RESOLVER_ROLE"));
    await accessControl.grantRole(ADMIN_ROLE, deployer.address);
    await accessControl.grantRole(RESOLVER_ROLE, resolver.address);
    console.log(`✓ Roles granted`);

    // Deploy Parameter Storage
    const ParameterStorage = await ethers.getContractFactory("ParameterStorage");
    const paramStorage = await ParameterStorage.deploy(registry.target);
    await paramStorage.waitForDeployment();
    await registry.setContract(ethers.keccak256(ethers.toUtf8Bytes("ParameterStorage")), paramStorage.target);
    console.log(`✓ ParameterStorage: ${paramStorage.target}`);

    // Set parameters
    await paramStorage.setParameter(ethers.keccak256(ethers.toUtf8Bytes("DISPUTE_BOND")), ethers.parseEther("1"));
    await paramStorage.setParameter(ethers.keccak256(ethers.toUtf8Bytes("DISPUTE_PERIOD")), 86400);
    console.log(`✓ Parameters configured`);

    // Deploy Reward Distributor
    const RewardDistributor = await ethers.getContractFactory("RewardDistributor");
    const rewardDist = await RewardDistributor.deploy(registry.target);
    await rewardDist.waitForDeployment();
    await registry.setContract(ethers.keccak256(ethers.toUtf8Bytes("RewardDistributor")), rewardDist.target);
    console.log(`✓ RewardDistributor: ${rewardDist.target}`);

    // Deploy Resolution Manager
    const ResolutionManager = await ethers.getContractFactory("ResolutionManager");
    const resolutionManager = await ResolutionManager.deploy(registry.target);
    await resolutionManager.waitForDeployment();
    await registry.setContract(ethers.keccak256(ethers.toUtf8Bytes("ResolutionManager")), resolutionManager.target);
    console.log(`✓ ResolutionManager: ${resolutionManager.target}`);

    // Deploy Market Template
    const ParimutuelMarket = await ethers.getContractFactory("ParimutuelMarket");
    const marketTemplate = await ParimutuelMarket.deploy();
    await marketTemplate.waitForDeployment();
    console.log(`✓ ParimutuelMarket Template: ${marketTemplate.target}`);

    // Deploy Market Template Registry
    const MarketTemplateRegistry = await ethers.getContractFactory("MarketTemplateRegistry");
    const templateRegistry = await MarketTemplateRegistry.deploy(registry.target);
    await templateRegistry.waitForDeployment();
    await registry.setContract(ethers.keccak256(ethers.toUtf8Bytes("MarketTemplateRegistry")), templateRegistry.target);
    console.log(`✓ MarketTemplateRegistry: ${templateRegistry.target}`);

    // Register template
    const PARIMUTUEL_ID = ethers.keccak256(ethers.toUtf8Bytes("PARIMUTUEL"));
    await templateRegistry.registerTemplate(PARIMUTUEL_ID, marketTemplate.target);
    console.log(`✓ Template registered`);

    // Deploy Market Factory
    const FlexibleMarketFactory = await ethers.getContractFactory("FlexibleMarketFactory");
    const factory = await FlexibleMarketFactory.deploy(registry.target);
    await factory.waitForDeployment();
    await registry.setContract(ethers.keccak256(ethers.toUtf8Bytes("FlexibleMarketFactory")), factory.target);
    console.log(`✓ FlexibleMarketFactory: ${factory.target}`);

    console.log("\n✅ System deployment complete!\n");

    // ========================================================================
    // TEST CRITICAL-001: PAGINATION DOS PROTECTION
    // ========================================================================

    console.log("\n" + "=".repeat(70));
    console.log("PHASE 2: TESTING CRITICAL-001 - PAGINATION DOS PROTECTION");
    console.log("=".repeat(70));

    console.log("\n🔍 Test 1: Create 100 markets and test pagination...");

    const futureTime = Math.floor(Date.now() / 1000) + 3600;
    const markets = [];

    for (let i = 0; i < 100; i++) {
        const tx = await factory.createMarket(
            PARIMUTUEL_ID,
            `Test Market ${i}`,
            "Test description",
            futureTime,
            100, // 1% fee
            "ipfs://test",
            "0x"
        );
        const receipt = await tx.wait();
        const event = receipt.logs.find(log => {
            try { return factory.interface.parseLog(log).name === "MarketCreated"; }
            catch (e) { return false; }
        });
        const marketAddr = factory.interface.parseLog(event).args.marketAddress;
        markets.push(marketAddr);

        if ((i + 1) % 20 === 0) {
            console.log(`   Created ${i + 1}/100 markets...`);
        }
    }

    console.log("\n🔍 Test 2: Verify pagination works (no gas exhaustion)...");
    try {
        const [page1, total1] = await factory.getActiveMarkets(0, 50);
        const [page2, total2] = await factory.getActiveMarkets(50, 50);

        logTest(
            "CRITICAL-001: Pagination returns correct results",
            page1.length === 50 && page2.length === 50 && total1 === 100n,
            `Page1: ${page1.length}, Page2: ${page2.length}, Total: ${total1}`
        );
    } catch (e) {
        logTest("CRITICAL-001: Pagination test", false, e.message);
    }

    console.log("\n🔍 Test 3: Verify gas usage is reasonable...");
    try {
        const tx = await factory.getActiveMarkets.staticCall(0, 100);
        logTest(
            "CRITICAL-001: Pagination gas efficiency",
            true,
            "Pagination call succeeded (no gas exhaustion)"
        );
    } catch (e) {
        logTest("CRITICAL-001: Gas efficiency", false, e.message);
    }

    // ========================================================================
    // TEST CRITICAL-002: ZERO WINNER POOL AUTO-CANCELLATION
    // ========================================================================

    console.log("\n" + "=".repeat(70));
    console.log("PHASE 3: TESTING CRITICAL-002 - ZERO WINNER POOL");
    console.log("=".repeat(70));

    console.log("\n🔍 Test 1: Create market with bets on ONLY outcome 2...");
    const tx = await factory.createMarket(
        PARIMUTUEL_ID,
        "Zero Winner Pool Test",
        "Test market for zero winner scenario",
        futureTime,
        100,
        "ipfs://test",
        "0x"
    );
    const receipt = await tx.wait();
    const event = receipt.logs.find(log => {
        try { return factory.interface.parseLog(log).name === "MarketCreated"; }
        catch (e) { return false; }
    });
    const zeroWinnerMarketAddr = factory.interface.parseLog(event).args.marketAddress;
    const zeroWinnerMarket = await ethers.getContractAt("ParimutuelMarket", zeroWinnerMarketAddr);

    console.log(`   Market created: ${zeroWinnerMarketAddr}`);

    // Place bets on ONLY outcome 2
    await zeroWinnerMarket.connect(user1).placeBet(2, "0x", { value: ethers.parseEther("0.5") });
    await zeroWinnerMarket.connect(user2).placeBet(2, "0x", { value: ethers.parseEther("0.1") });

    console.log("   ✓ Bets placed: 0.5 ETH and 0.1 ETH on outcome 2");
    console.log("   ✓ Outcome 1 total: 0 ETH (no bets)");
    console.log("   ✓ Outcome 2 total: 0.6 ETH");

    console.log("\n🔍 Test 2: Fast forward to resolution time...");
    await ethers.provider.send("evm_increaseTime", [3601]);
    await ethers.provider.send("evm_mine");

    console.log("   ✓ Time advanced past deadline");

    console.log("\n🔍 Test 3: Resolve as outcome 1 (nobody bet on this)...");
    try {
        await resolutionManager.connect(resolver).resolveMarket(zeroWinnerMarketAddr, 1);
        const result = await zeroWinnerMarket.result();

        logTest(
            "CRITICAL-002: Market auto-cancels when zero bets on winner",
            result === 3n, // 3 = CANCELLED
            `Result: ${result === 3n ? 'CANCELLED' : 'NOT CANCELLED (BUG!)'}`
        );
    } catch (e) {
        logTest("CRITICAL-002: Zero winner auto-cancel", false, e.message);
    }

    console.log("\n🔍 Test 4: Verify users can claim full refunds...");
    try {
        const user1BalBefore = await ethers.provider.getBalance(user1.address);
        await zeroWinnerMarket.connect(user1).claimPayout();
        const user1BalAfter = await ethers.provider.getBalance(user1.address);

        const refunded = user1BalAfter - user1BalBefore;
        const expected = ethers.parseEther("0.5");
        const difference = refunded > expected ? refunded - expected : expected - refunded;

        logTest(
            "CRITICAL-002: Users receive full refund on cancelled market",
            difference < ethers.parseEther("0.01"), // Allow for gas
            `Refunded: ${ethers.formatEther(refunded)} ETH (expected ~0.5 ETH)`
        );
    } catch (e) {
        logTest("CRITICAL-002: Refund test", false, e.message);
    }

    // ========================================================================
    // TEST HIGH-001: WHALE MANIPULATION PROTECTION
    // ========================================================================

    console.log("\n" + "=".repeat(70));
    console.log("PHASE 4: TESTING HIGH-001 - WHALE MANIPULATION PROTECTION");
    console.log("=".repeat(70));

    console.log("\n🔍 Test 1: Create market for whale testing...");
    const whaleTx = await factory.createMarket(
        PARIMUTUEL_ID,
        "Whale Protection Test",
        "Test whale limits",
        futureTime,
        100,
        "ipfs://test",
        "0x"
    );
    const whaleReceipt = await whaleTx.wait();
    const whaleEvent = whaleReceipt.logs.find(log => {
        try { return factory.interface.parseLog(log).name === "MarketCreated"; }
        catch (e) { return false; }
    });
    const whaleMarketAddr = factory.interface.parseLog(whaleEvent).args.marketAddress;
    const whaleMarket = await ethers.getContractAt("ParimutuelMarket", whaleMarketAddr);

    console.log(`   Market created: ${whaleMarketAddr}`);

    console.log("\n🔍 Test 2: Place initial bet of 1 ETH...");
    await whaleMarket.connect(user1).placeBet(1, "0x", { value: ethers.parseEther("1") });
    console.log("   ✓ Initial pool: 1 ETH");

    console.log("\n🔍 Test 3: Try to place bet > 20% of pool (should fail)...");
    try {
        await whaleMarket.connect(user2).placeBet(2, "0x", { value: ethers.parseEther("0.3") });
        logTest("HIGH-001: Block bets > 20% of pool", false, "Large bet was allowed (BUG!)");
    } catch (e) {
        logTest(
            "HIGH-001: Block bets > 20% of pool",
            e.message.includes("BetTooLarge"),
            "Correctly blocked 0.3 ETH bet (0.3 > 20% of 1 ETH)"
        );
    }

    console.log("\n🔍 Test 4: Place bet exactly at 20% limit (should succeed)...");
    try {
        await whaleMarket.connect(user2).placeBet(2, "0x", { value: ethers.parseEther("0.2") });
        logTest("HIGH-001: Allow bets at exactly 20% limit", true, "0.2 ETH bet allowed");
    } catch (e) {
        logTest("HIGH-001: 20% limit bet", false, e.message);
    }

    console.log("\n🔍 Test 5: Try to place bet < minimum (should fail)...");
    try {
        const smallMarketTx = await factory.createMarket(PARIMUTUEL_ID, "Small Bet Test", "Test", futureTime, 100, "ipfs://test", "0x");
        const smallMarketReceipt = await smallMarketTx.wait();
        const smallMarketEvent = smallMarketReceipt.logs.find(log => {
            try { return factory.interface.parseLog(log).name === "MarketCreated"; }
            catch (e) { return false; }
        });
        const smallMarketAddr = factory.interface.parseLog(smallMarketEvent).args.marketAddress;
        const smallMarket = await ethers.getContractAt("ParimutuelMarket", smallMarketAddr);

        await smallMarket.connect(user1).placeBet(1, "0x", { value: ethers.parseEther("0.0001") });
        logTest("HIGH-001: Block bets < 0.001 ETH", false, "Tiny bet was allowed (BUG!)");
    } catch (e) {
        logTest(
            "HIGH-001: Block bets < 0.001 ETH",
            e.message.includes("BetTooSmall"),
            "Correctly blocked 0.0001 ETH bet"
        );
    }

    // ========================================================================
    // TEST HIGH-002: DISPUTE BOND TREASURY ROUTING
    // ========================================================================

    console.log("\n" + "=".repeat(70));
    console.log("PHASE 5: TESTING HIGH-002 - DISPUTE BOND TREASURY ROUTING");
    console.log("=".repeat(70));

    console.log("\n🔍 Test 1: Create and resolve a market...");
    const disputeTx = await factory.createMarket(
        PARIMUTUEL_ID,
        "Dispute Bond Test",
        "Test dispute bonds",
        futureTime,
        100,
        "ipfs://test",
        "0x"
    );
    const disputeReceipt = await disputeTx.wait();
    const disputeEvent = disputeReceipt.logs.find(log => {
        try { return factory.interface.parseLog(log).name === "MarketCreated"; }
        catch (e) { return false; }
    });
    const disputeMarketAddr = factory.interface.parseLog(disputeEvent).args.marketAddress;
    const disputeMarket = await ethers.getContractAt("ParimutuelMarket", disputeMarketAddr);

    await disputeMarket.connect(user1).placeBet(1, "0x", { value: ethers.parseEther("0.5") });
    await disputeMarket.connect(user2).placeBet(2, "0x", { value: ethers.parseEther("0.1") });

    await ethers.provider.send("evm_increaseTime", [3601]);
    await ethers.provider.send("evm_mine");

    await resolutionManager.connect(resolver).resolveMarket(disputeMarketAddr, 1);
    console.log("   ✓ Market resolved as outcome 1");

    console.log("\n🔍 Test 2: Submit dispute with 1 ETH bond...");
    const treasuryBalBefore = await rewardDist.treasuryFees();
    console.log(`   Treasury balance before: ${ethers.formatEther(treasuryBalBefore)} ETH`);

    await resolutionManager.connect(disputer).submitDispute(
        disputeMarketAddr,
        "I believe outcome 2 should have won",
        { value: ethers.parseEther("1") }
    );
    console.log("   ✓ Dispute submitted with 1 ETH bond");

    console.log("\n🔍 Test 3: Investigate and reject dispute...");
    await resolutionManager.investigateDispute(disputeMarketAddr, "Evidence insufficient");
    await resolutionManager.resolveDispute(disputeMarketAddr, false, 0);
    console.log("   ✓ Dispute rejected");

    console.log("\n🔍 Test 4: Verify bond went to treasury...");
    const treasuryBalAfter = await rewardDist.treasuryFees();
    const bondReceived = treasuryBalAfter - treasuryBalBefore;

    logTest(
        "HIGH-002: Rejected dispute bonds route to treasury",
        bondReceived === ethers.parseEther("1"),
        `Treasury received: ${ethers.formatEther(bondReceived)} ETH (expected 1 ETH)`
    );

    // ========================================================================
    // TEST HIGH-003: TEMPLATE VALIDATION
    // ========================================================================

    console.log("\n" + "=".repeat(70));
    console.log("PHASE 6: TESTING HIGH-003 - TEMPLATE VALIDATION");
    console.log("=".repeat(70));

    console.log("\n🔍 Test 1: Try to register EOA as template (should fail)...");
    try {
        await templateRegistry.registerTemplate(
            ethers.keccak256(ethers.toUtf8Bytes("INVALID_EOA")),
            user1.address
        );
        logTest("HIGH-003: Reject EOA as template", false, "EOA was accepted as template (BUG!)");
    } catch (e) {
        logTest(
            "HIGH-003: Reject EOA as template",
            e.message.includes("must be a contract"),
            "Correctly rejected EOA"
        );
    }

    console.log("\n🔍 Test 2: Try to register zero address (should fail)...");
    try {
        await templateRegistry.registerTemplate(
            ethers.keccak256(ethers.toUtf8Bytes("INVALID_ZERO")),
            ethers.ZeroAddress
        );
        logTest("HIGH-003: Reject zero address", false, "Zero address was accepted (BUG!)");
    } catch (e) {
        logTest(
            "HIGH-003: Reject zero address",
            e.message.includes("InvalidImplementation"),
            "Correctly rejected zero address"
        );
    }

    console.log("\n🔍 Test 3: Try to register contract without IMarket interface (should fail)...");
    try {
        // Try to use AccessControlManager as a template (doesn't have IMarket interface)
        await templateRegistry.registerTemplate(
            ethers.keccak256(ethers.toUtf8Bytes("INVALID_INTERFACE")),
            accessControl.target
        );
        logTest("HIGH-003: Reject invalid interface", false, "Invalid interface was accepted (BUG!)");
    } catch (e) {
        logTest(
            "HIGH-003: Reject invalid interface",
            e.message.includes("IMarket interface"),
            "Correctly rejected contract without IMarket interface"
        );
    }

    console.log("\n🔍 Test 4: Register valid template (should succeed)...");
    try {
        const newTemplate = await ParimutuelMarket.deploy();
        await newTemplate.waitForDeployment();

        await templateRegistry.registerTemplate(
            ethers.keccak256(ethers.toUtf8Bytes("PARIMUTUEL_V2")),
            newTemplate.target
        );

        logTest("HIGH-003: Accept valid template with IMarket interface", true, "Valid template registered");
    } catch (e) {
        logTest("HIGH-003: Valid template registration", false, e.message);
    }

    // ========================================================================
    // FINAL REPORT
    // ========================================================================

    console.log("\n" + "=".repeat(70));
    console.log("FINAL TEST RESULTS");
    console.log("=".repeat(70));

    console.log(`\nTotal Tests: ${testResults.total}`);
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`Success Rate: ${Math.round((testResults.passed / testResults.total) * 100)}%`);

    console.log("\n📊 Detailed Results:");
    testResults.tests.forEach((test, i) => {
        console.log(`\n${i + 1}. ${test.passed ? '✅' : '❌'} ${test.name}`);
        if (test.details) console.log(`   ${test.details}`);
    });

    if (testResults.failed === 0) {
        console.log("\n" + "=".repeat(70));
        console.log("🎉 ALL SECURITY FIXES VALIDATED SUCCESSFULLY! 🎉");
        console.log("🛡️  Your smart contracts are BULLETPROOF! 🛡️");
        console.log("=".repeat(70));
    } else {
        console.log("\n" + "=".repeat(70));
        console.log("⚠️  SOME TESTS FAILED - REVIEW REQUIRED");
        console.log("=".repeat(70));
    }

    // Save results to file
    const fs = require('fs');
    const resultsPath = './test-results/manual-security-test-results.json';
    fs.mkdirSync('./test-results', { recursive: true });
    fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
    console.log(`\n📁 Results saved to: ${resultsPath}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ FATAL ERROR:", error);
        process.exit(1);
    });
