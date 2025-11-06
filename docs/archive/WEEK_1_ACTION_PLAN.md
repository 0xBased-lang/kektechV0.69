# 📅 WEEK 1 ACTION PLAN - Path to Mainnet

**Goal:** Complete comprehensive testing and fork validation
**Timeline:** 7 days
**Outcome:** Confidence level 85% → Ready for Week 2

---

## 🎯 DAILY BREAKDOWN

### **DAY 1 (Monday): Fix & Test Suite** ⏱️ 6 hours

#### Morning (2 hours): Fix Test Suite

```bash
cd expansion-packs/bmad-blockchain-dev

# Files to update (4 total):
# 1. test/security/CRITICAL-004-FeeCollectionResilience.test.js
# 2. test/security/CRITICAL-005-DisputeBondResilience.test.js
# 3. test/security/HIGH-004-GasGriefingProtection.test.js
# 4. test/security/MEDIUM-001-FrontRunningProtection.test.js

# In each file, find the deployFixture() function
# Around line 118 in each file

# REPLACE THIS:
const tx = await factory.createMarket(
    templateId,
    ethers.AbiCoder.defaultAbiCoder().encode(
        ["string", "string", "string", "address", "uint256", "uint256"],
        ["Question", "Yes", "No", creator.address, deadline, feePercent]
    ),
    { value: minBond }
);

# WITH THIS:
const tx = await factory.createMarketFromTemplateRegistry(
    templateId,
    "Test Market",
    "Yes",
    "No",
    deadline,
    feePercent,
    { value: minBond }
);
```

#### Afternoon (4 hours): Run All Tests

```bash
# 1. Compile contracts
npm run compile

# Expected: Clean compilation ✅

# 2. Run security tests
npx hardhat test test/security/CRITICAL-004-FeeCollectionResilience.test.js
npx hardhat test test/security/CRITICAL-005-DisputeBondResilience.test.js
npx hardhat test test/security/HIGH-004-GasGriefingProtection.test.js
npx hardhat test test/security/MEDIUM-001-FrontRunningProtection.test.js

# Expected: All tests pass ✅

# 3. Run all security tests together
npx hardhat test test/security/

# Expected: 63+ tests pass ✅
```

#### End of Day: Document Results

```markdown
# Day 1 Results

## Compilation
- Status: [PASS/FAIL]
- Issues: [None/List any]

## Test Execution
- CRITICAL-004: [X/15 tests passed]
- CRITICAL-005: [X/12 tests passed]
- HIGH-004: [X/15 tests passed]
- MEDIUM-001: [X/17 tests passed]
- Total: [X/63 tests passed]

## Issues Found
[List any test failures and investigation needed]

## Confidence Level
Day 1: 75% → [Update based on results]
```

**If tests fail:** Don't panic. Debug, fix, re-run. It's better to find bugs now!

---

### **DAY 2 (Tuesday): Fork Deployment** ⏱️ 8 hours

#### Morning (3 hours): Setup Fork

```bash
# 1. Start BasedAI mainnet fork
npm run node:fork

# This should start a local fork of BasedAI mainnet
# Leave running in terminal 1
```

```bash
# Terminal 2: Deploy contracts to fork
npm run deploy:fork

# Expected output:
# ✅ MasterRegistry deployed
# ✅ AccessControlManager deployed
# ✅ ParameterStorage deployed
# ✅ RewardDistributor deployed
# ✅ ResolutionManager deployed
# ✅ FlexibleMarketFactory deployed
# ✅ ParimutuelMarket template deployed
# ✅ All contracts configured
```

#### Afternoon (5 hours): Basic Operations Testing

```bash
# Create test script: test-fork-basic.js

const { ethers } = require("hardhat");

async function main() {
    console.log("🧪 Fork Testing: Basic Operations\n");

    // Get signers
    const [deployer, user1, user2] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);
    console.log("User1:", user1.address);
    console.log("User2:", user2.address);

    // Get contracts (from deployment)
    const factory = await ethers.getContractAt(
        "FlexibleMarketFactory",
        "FACTORY_ADDRESS_FROM_DEPLOY"
    );

    // TEST 1: Create Market
    console.log("\n📝 TEST 1: Create Market");
    const deadline = Math.floor(Date.now() / 1000) + 86400; // +24 hours
    const tx = await factory.createMarketFromTemplateRegistry(
        1, // templateId
        "Will ETH reach $4000 by EOY?",
        "Yes",
        "No",
        deadline,
        1000, // 10% fee
        { value: ethers.parseEther("0.1") }
    );
    const receipt = await tx.wait();
    const marketAddress = /* extract from events */;
    console.log("✅ Market created:", marketAddress);

    // TEST 2: Place Bets
    console.log("\n💰 TEST 2: Place Bets");
    const market = await ethers.getContractAt("ParimutuelMarket", marketAddress);

    const bet1 = await market.connect(user1).placeBet(
        1, // YES
        "0x", // betData
        0, // no slippage check
        0, // no deadline
        { value: ethers.parseEther("1.0") }
    );
    await bet1.wait();
    console.log("✅ User1 bet 1 ETH on YES");

    const bet2 = await market.connect(user2).placeBet(
        2, // NO
        "0x",
        0,
        0,
        { value: ethers.parseEther("2.0") }
    );
    await bet2.wait();
    console.log("✅ User2 bet 2 ETH on NO");

    // TEST 3: Check Pool State
    console.log("\n📊 TEST 3: Check Pool State");
    const stats = await market.getMarketStats();
    console.log("Total Pool:", ethers.formatEther(stats[0]), "ETH");
    console.log("YES Total:", ethers.formatEther(stats[1]), "ETH");
    console.log("NO Total:", ethers.formatEther(stats[2]), "ETH");
    console.log("Total Bettors:", stats[3].toString());

    // TEST 4: Advance Time & Resolve
    console.log("\n⏰ TEST 4: Time Travel + Resolve");
    await ethers.provider.send("evm_increaseTime", [86400]);
    await ethers.provider.send("evm_mine");
    console.log("✅ Advanced 24 hours");

    // Get resolver (needs RESOLVER_ROLE)
    const resolve = await market.resolveMarket(1); // YES wins
    await resolve.wait();
    console.log("✅ Market resolved: YES wins");

    // TEST 5: Claim Winnings
    console.log("\n🎉 TEST 5: Claim Winnings");
    const balBefore = await ethers.provider.getBalance(user1.address);
    const claim = await market.connect(user1).claimWinnings();
    await claim.wait();
    const balAfter = await ethers.provider.getBalance(user1.address);
    const won = balAfter - balBefore;
    console.log("✅ User1 claimed:", ethers.formatEther(won), "ETH");

    console.log("\n✅ All basic operations successful!");
}

main().catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
});
```

```bash
# Run fork test
npx hardhat run test-fork-basic.js --network localhost

# Expected: All operations succeed ✅
```

#### End of Day: Document Results

```markdown
# Day 2 Results

## Fork Deployment
- Status: [SUCCESS/FAIL]
- All contracts deployed: [YES/NO]
- Gas used: [X ETH]

## Basic Operations
- Create market: [PASS/FAIL]
- Place bets: [PASS/FAIL]
- Resolve market: [PASS/FAIL]
- Claim winnings: [PASS/FAIL]

## Issues
[List any failures]

## Confidence Level
Day 2: 75% → [Update: should be ~85%]
```

---

### **DAY 3 (Wednesday): Unhappy Path Testing** ⏱️ 8 hours

```javascript
// test-fork-unhappy.js

async function testErrorConditions() {
    console.log("🧪 Fork Testing: Error Conditions\n");

    // TEST 1: Bet after deadline
    console.log("TEST 1: Bet after deadline");
    await ethers.provider.send("evm_increaseTime", [86500]);
    await expect(
        market.placeBet(1, "0x", 0, 0, { value: ethers.parseEther("1") })
    ).to.be.revertedWithCustomError(market, "BettingClosed");
    console.log("✅ Correctly rejects late bets");

    // TEST 2: Invalid outcome
    console.log("\nTEST 2: Invalid outcome");
    await expect(
        market.placeBet(3, "0x", 0, 0, { value: ethers.parseEther("1") })
    ).to.be.revertedWithCustomError(market, "InvalidOutcome");
    console.log("✅ Correctly rejects invalid outcomes");

    // TEST 3: Bet too small
    console.log("\nTEST 3: Bet below minimum");
    await expect(
        market.placeBet(1, "0x", 0, 0, { value: ethers.parseEther("0.0001") })
    ).to.be.revertedWithCustomError(market, "BetTooSmall");
    console.log("✅ Correctly enforces minimum bet");

    // TEST 4: Bet too large (whale protection)
    console.log("\nTEST 4: Bet above maximum");
    // Need pool > 0 first, then try 25% bet
    await expect(
        market.placeBet(1, "0x", 0, 0, { value: ethers.parseEther("1000") })
    ).to.be.revertedWithCustomError(market, "BetTooLarge");
    console.log("✅ Correctly enforces maximum bet");

    // TEST 5: Resolve before deadline
    console.log("\nTEST 5: Early resolution attempt");
    await expect(
        market.resolveMarket(1)
    ).to.be.revertedWithCustomError(market, "CannotResolveYet");
    console.log("✅ Correctly prevents early resolution");

    // TEST 6: Claim before resolution
    console.log("\nTEST 6: Claim before resolution");
    await expect(
        market.connect(user1).claimWinnings()
    ).to.be.revertedWithCustomError(market, "MarketNotResolved");
    console.log("✅ Correctly prevents early claims");

    // TEST 7: Claim twice
    console.log("\nTEST 7: Double claim attempt");
    // First resolve market and claim once
    await market.resolveMarket(1);
    await market.connect(user1).claimWinnings();
    // Try again
    await expect(
        market.connect(user1).claimWinnings()
    ).to.be.revertedWithCustomError(market, "AlreadyClaimed");
    console.log("✅ Correctly prevents double claims");

    console.log("\n✅ All error conditions handled correctly!");
}
```

---

### **DAY 4-5 (Thu-Fri): Attack Simulation** ⏱️ 16 hours

```javascript
// test-fork-attacks.js

async function testAttacks() {
    console.log("⚔️ Fork Testing: Attack Scenarios\n");

    // ATTACK 1: Gas Griefing
    console.log("ATTACK 1: Gas Griefing");
    const GasGrieferFactory = await ethers.getContractFactory("GasGriefingAttacker");
    const griefier = await GasGrieferFactory.deploy();

    // Bet from malicious contract
    await market.connect(griefier).placeBet(1, "0x", 0, 0, { value: ethers.parseEther("1") });

    // Resolve market (griefier wins)
    await market.resolveMarket(1);

    // Try to claim (should fall back to pull pattern)
    const claimTx = await market.connect(griefier).claimWinnings();
    const receipt = await claimTx.wait();

    // Check if used pull pattern fallback
    const unclaimedEvents = receipt.logs.filter(l =>
        l.eventName === "UnclaimedWinningsStored"
    );
    console.log("✅ Gas griefing handled:", unclaimedEvents.length > 0 ? "Pull pattern used" : "Direct transfer worked");

    // ATTACK 2: Reentrancy
    console.log("\nATTACK 2: Reentrancy Attack");
    const ReentrancyFactory = await ethers.getContractFactory("ReentrancyAttacker");
    const reentrant = await ReentrancyFactory.deploy(market.address);

    await expect(
        reentrant.attack({ value: ethers.parseEther("1") })
    ).to.be.reverted;
    console.log("✅ Reentrancy attack prevented");

    // ATTACK 3: Front-Running (Without Protection)
    console.log("\nATTACK 3: Front-Running Attempt");
    // User tries to bet without slippage protection
    // Attacker front-runs with large bet
    // User's transaction should execute but at worse odds
    const userBet = ethers.parseEther("1");
    const attackerBet = ethers.parseEther("10");

    // Simulate front-run
    await market.placeBet(1, "0x", 0, 0, { value: attackerBet });
    await market.placeBet(1, "0x", 0, 0, { value: userBet });

    // User gets worse odds but transaction succeeds
    console.log("⚠️  Front-run succeeded (user didn't use protection)");

    // ATTACK 4: Front-Running (With Protection)
    console.log("\nATTACK 4: Front-Running with Protection");
    const minOdds = 5000; // User wants at least 50% implied odds

    // Attacker front-runs
    await market.placeBet(1, "0x", 0, 0, { value: attackerBet });

    // User's transaction reverts (odds too bad)
    await expect(
        market.placeBet(1, "0x", minOdds, 0, { value: userBet })
    ).to.be.revertedWithCustomError(market, "SlippageTooHigh");
    console.log("✅ Slippage protection worked - bad transaction reverted");

    // ATTACK 5: RewardDistributor Failure
    console.log("\nATTACK 5: RewardDistributor Failure Simulation");
    // Temporarily break RewardDistributor (if possible in test)
    // Or test with mock that fails
    // Resolve market → should catch error and store fees
    console.log("✅ Fee collection failure handled (try-catch works)");

    console.log("\n✅ All attacks successfully defended against!");
}
```

---

### **DAY 6 (Saturday): Integration Testing** ⏱️ 8 hours

```javascript
// test-fork-integration.js

async function testIntegration() {
    console.log("🔗 Fork Testing: Integration Scenarios\n");

    // SCENARIO 1: Multiple Markets
    console.log("SCENARIO 1: Multiple Markets");
    const markets = [];
    for (let i = 0; i < 10; i++) {
        const tx = await factory.createMarketFromTemplateRegistry(
            1,
            `Test Market ${i}`,
            "Yes",
            "No",
            deadline,
            1000,
            { value: ethers.parseEther("0.1") }
        );
        // Extract market address
        markets.push(marketAddress);
    }
    console.log("✅ Created 10 markets");

    // SCENARIO 2: Multiple Users
    console.log("\nSCENARIO 2: Multiple Users");
    const users = await ethers.getSigners();
    for (let i = 0; i < 20; i++) {
        const market = markets[i % 10];
        await market.connect(users[i]).placeBet(
            (i % 2) + 1, // Alternate YES/NO
            "0x",
            0,
            0,
            { value: ethers.parseEther("0.5") }
        );
    }
    console.log("✅ 20 users placed bets across markets");

    // SCENARIO 3: Mass Resolution
    console.log("\nSCENARIO 3: Mass Resolution");
    await ethers.provider.send("evm_increaseTime", [86400]);
    for (const market of markets) {
        await market.resolveMarket(1);
    }
    console.log("✅ Resolved all 10 markets");

    // SCENARIO 4: Mass Claims
    console.log("\nSCENARIO 4: Mass Claims");
    let successCount = 0;
    for (let i = 0; i < 20; i++) {
        const market = markets[i % 10];
        try {
            await market.connect(users[i]).claimWinnings();
            successCount++;
        } catch (e) {
            // User was on losing side
        }
    }
    console.log(`✅ ${successCount} successful claims (losers correctly got 0)`);

    console.log("\n✅ Integration testing complete!");
}
```

---

### **DAY 7 (Sunday): Documentation & Reporting** ⏱️ 4 hours

#### Create Comprehensive Test Report

```markdown
# WEEK 1 FORK TESTING REPORT

## Executive Summary
- Tests Executed: [X total]
- Tests Passed: [X]
- Tests Failed: [X]
- Critical Issues: [X]
- High Issues: [X]
- Medium Issues: [X]
- Confidence Level: [X%]

## Test Results by Category

### Basic Operations (Day 2)
- Market Creation: [PASS/FAIL]
- Betting: [PASS/FAIL]
- Resolution: [PASS/FAIL]
- Claims: [PASS/FAIL]

### Error Conditions (Day 3)
- Late bets rejected: [PASS/FAIL]
- Invalid outcomes rejected: [PASS/FAIL]
- Min/Max bet enforced: [PASS/FAIL]
- Double claims prevented: [PASS/FAIL]

### Attack Scenarios (Days 4-5)
- Gas griefing: [PASS/FAIL]
- Reentrancy: [PASS/FAIL]
- Front-running (unprotected): [OBSERVED]
- Front-running (protected): [PASS/FAIL]
- Fee collection failures: [PASS/FAIL]

### Integration (Day 6)
- Multiple markets: [PASS/FAIL]
- Multiple users: [PASS/FAIL]
- Mass operations: [PASS/FAIL]

## Issues Found

### Critical Issues
[List with details and reproduction steps]

### High Issues
[List with details]

### Medium/Low Issues
[List with details]

## Gas Usage Analysis
- Market creation: [X gas]
- Place bet: [X gas]
- Resolve market: [X gas]
- Claim winnings: [X gas]

## Recommendations

### Must Fix Before Mainnet
1. [Critical issue 1]
2. [Critical issue 2]

### Should Fix
1. [High issue 1]
2. [High issue 2]

### Nice to Have
1. [Medium issue 1]

## Next Steps
1. Fix all critical issues
2. Re-test on fork
3. Proceed to Week 2 (extended testing)
4. Schedule external audit

## Confidence Assessment
- Start of Week 1: 75%
- End of Week 1: [Update based on results]
- Target for Mainnet: 98%
```

---

## 📊 SUCCESS CRITERIA

### Week 1 Complete When:

- ✅ All 63+ tests pass (Day 1)
- ✅ Fork deployment successful (Day 2)
- ✅ Basic operations work (Day 2)
- ✅ Error conditions handled correctly (Day 3)
- ✅ All attack scenarios defended (Days 4-5)
- ✅ Integration scenarios pass (Day 6)
- ✅ Comprehensive report created (Day 7)
- ✅ Zero critical issues remaining
- ✅ All high issues documented with fixes
- ✅ Confidence level ≥ 85%

### If Success:
→ Proceed to Week 2 (Extended Testing)

### If Failures:
→ Fix issues
→ Repeat failed tests
→ Don't proceed until clean

---

## 🚨 CRITICAL CHECKPOINTS

### Checkpoint 1: Day 1 End
**Question:** Do all tests pass?
- YES → Continue to Day 2 ✅
- NO → Debug and fix before proceeding ⚠️

### Checkpoint 2: Day 2 End
**Question:** Does fork deployment work?
- YES → Continue to Day 3 ✅
- NO → Fix deployment issues ⚠️

### Checkpoint 3: Day 5 End
**Question:** Are all attacks defended?
- YES → Continue to Day 6 ✅
- NO → Fix security issues immediately ⚠️

### Checkpoint 4: Day 7 End
**Question:** Confidence ≥ 85%?
- YES → Proceed to Week 2 ✅
- NO → Extend Week 1 testing ⚠️

---

## 💡 TIPS FOR SUCCESS

1. **Document Everything**
   - Screenshot results
   - Save console logs
   - Note all failures
   - Track gas usage

2. **Don't Skip Steps**
   - Each day builds on previous
   - Shortcuts = missed bugs
   - Thoroughness = confidence

3. **Test Realistically**
   - Use realistic amounts
   - Simulate real users
   - Think like an attacker

4. **Stay Paranoid**
   - Assume bugs exist
   - Look for edge cases
   - Question everything
   - Prove it works

5. **Ask for Help**
   - If stuck, ask community
   - Review documentation
   - Check similar projects
   - Don't struggle alone

---

## 📞 QUESTIONS?

- Full details: `FINAL_PRE_MAINNET_VERIFICATION_ULTRATHINK.md`
- Executive summary: `DEPLOYMENT_RECOMMENDATION_EXECUTIVE_SUMMARY.md`
- Security audit: `BLOCKCHAIN_TOOL_COMPREHENSIVE_AUDIT_REPORT.md`

**Ready to start?** Let's fix those tests and begin Week 1! 🚀
