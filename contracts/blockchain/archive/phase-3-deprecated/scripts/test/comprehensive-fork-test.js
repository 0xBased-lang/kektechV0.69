/**
 * @title Comprehensive Fork Test Script
 * @notice Tests all functionality on BasedAI fork (Day 9 - Phase 2.1)
 * @dev Tests edge cases, market creation, templates, and integration
 */

const { ethers } = require("hardhat");
const fs = require("fs");

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m"
};

async function main() {
  console.log(`\n${colors.bright}${colors.magenta}╔══════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}║  COMPREHENSIVE FORK TESTING - DAY 9 VALIDATION         ║${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}╚══════════════════════════════════════════════════════════╝${colors.reset}\n`);

  // Load deployment state
  const deploymentPath = "./fork-deployment-split.json";
  if (!fs.existsSync(deploymentPath)) {
    console.log(`${colors.red}❌ Deployment state not found! Run deployment first.${colors.reset}`);
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const contracts = deployment.contracts;

  console.log(`${colors.cyan}📋 Test Configuration${colors.reset}`);
  console.log(`   Network:         ${colors.yellow}BasedAI Fork${colors.reset}`);
  console.log(`   Core:            ${colors.yellow}${contracts.FlexibleMarketFactoryCore}${colors.reset}`);
  console.log(`   Extensions:      ${colors.yellow}${contracts.FlexibleMarketFactoryExtensions}${colors.reset}\n`);

  // Get signers
  const [deployer, creator1, creator2, user1, user2] = await ethers.getSigners();

  console.log(`${colors.cyan}👥 Test Accounts${colors.reset}`);
  console.log(`   Deployer:  ${deployer.address}`);
  console.log(`   Creator1:  ${creator1.address}`);
  console.log(`   Creator2:  ${creator2.address}\n`);

  // Get contract instances
  const core = await ethers.getContractAt("FlexibleMarketFactoryCore", contracts.FlexibleMarketFactoryCore);
  const extensions = await ethers.getContractAt("FlexibleMarketFactoryExtensions", contracts.FlexibleMarketFactoryExtensions);
  const registry = await ethers.getContractAt("MasterRegistry", contracts.MasterRegistry);

  // Test results
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    tests: []
  };

  function recordTest(name, passed, error = null) {
    results.total++;
    if (passed) {
      results.passed++;
      console.log(`   ${colors.green}✅ ${name}${colors.reset}`);
    } else {
      results.failed++;
      console.log(`   ${colors.red}❌ ${name}${colors.reset}`);
      if (error) {
        console.log(`      ${colors.red}Error: ${error.message}${colors.reset}`);
      }
    }
    results.tests.push({ name, passed, error: error ? error.message : null });
  }

  // ═══════════════════════════════════════════════════════════════════
  // TEST 1: DEPLOYMENT VALIDATION
  // ═══════════════════════════════════════════════════════════════════

  console.log(`${colors.bright}${colors.blue}📦 Test Group 1: Deployment Validation${colors.reset}\n`);

  try {
    const coreAddr = await core.getAddress();
    recordTest("Core contract deployed", coreAddr !== ethers.ZeroAddress);
  } catch (error) {
    recordTest("Core contract deployed", false, error);
  }

  try {
    const extAddr = await extensions.getAddress();
    recordTest("Extensions contract deployed", extAddr !== ethers.ZeroAddress);
  } catch (error) {
    recordTest("Extensions contract deployed", false, error);
  }

  try {
    const extFromCore = await core.extensionsContract();
    const extAddr = await extensions.getAddress();
    recordTest("Core ↔ Extensions linked", extFromCore === extAddr);
  } catch (error) {
    recordTest("Core ↔ Extensions linked", false, error);
  }

  try {
    const marketCount = await core.marketCount();
    recordTest("Initial market count is zero", marketCount === 0n);
  } catch (error) {
    recordTest("Initial market count is zero", false, error);
  }

  // ═══════════════════════════════════════════════════════════════════
  // TEST 2: BASIC MARKET CREATION
  // ═══════════════════════════════════════════════════════════════════

  console.log(`\n${colors.bright}${colors.blue}📊 Test Group 2: Basic Market Creation${colors.reset}\n`);

  try {
    const config = {
      question: "Will BTC reach $100k by EOY?",
      description: "Test market for fork validation",
      resolutionTime: Math.floor(Date.now() / 1000) + 86400,
      creatorBond: ethers.parseEther("0.1"),
      category: ethers.keccak256(ethers.toUtf8Bytes("Crypto")),
      outcome1: "Yes",
      outcome2: "No"
    };

    const tx = await core.connect(creator1).createMarket(config, {
      value: ethers.parseEther("0.1")
    });
    const receipt = await tx.wait();

    recordTest("Create market via Core", receipt.status === 1);

    const marketCount = await core.marketCount();
    recordTest("Market count incremented", marketCount === 1n);

    // Get market address from event
    const event = receipt.logs.find(log => {
      try {
        const parsed = core.interface.parseLog(log);
        return parsed && parsed.name === "MarketCreated";
      } catch {
        return false;
      }
    });

    if (event) {
      const parsed = core.interface.parseLog(event);
      const marketAddr = parsed.args.market;
      recordTest("Market address emitted in event", marketAddr !== ethers.ZeroAddress);

      // Verify market exists
      const market = await ethers.getContractAt("PredictionMarket", marketAddr);
      const question = await market.question();
      recordTest("Market question matches", question === config.question);
    } else {
      recordTest("Market address emitted in event", false, new Error("Event not found"));
    }

  } catch (error) {
    recordTest("Create market via Core", false, error);
    recordTest("Market count incremented", false);
    recordTest("Market address emitted in event", false);
    recordTest("Market question matches", false);
  }

  // ═══════════════════════════════════════════════════════════════════
  // TEST 3: TEMPLATE SYSTEM
  // ═══════════════════════════════════════════════════════════════════

  console.log(`\n${colors.bright}${colors.blue}📋 Test Group 3: Template System${colors.reset}\n`);

  try {
    const templateId = ethers.keccak256(ethers.toUtf8Bytes("sports-match"));
    const tx = await extensions.connect(deployer).createTemplate(
      templateId,
      "Sports Match Template",
      ethers.keccak256(ethers.toUtf8Bytes("Sports")),
      "Team A Wins",
      "Team B Wins"
    );
    await tx.wait();

    recordTest("Create template via Extensions", true);

    const count = await extensions.getTemplateCount();
    recordTest("Template count is 1", count === 1n);

    const templates = await extensions.getAllTemplates();
    recordTest("Can enumerate templates", templates.length === 1);

  } catch (error) {
    recordTest("Create template via Extensions", false, error);
    recordTest("Template count is 1", false);
    recordTest("Can enumerate templates", false);
  }

  // ═══════════════════════════════════════════════════════════════════
  // TEST 4: EDGE CASES
  // ═══════════════════════════════════════════════════════════════════

  console.log(`\n${colors.bright}${colors.blue}⚡ Test Group 4: Edge Cases${colors.reset}\n`);

  // Test 4.1: Minimum bond amount
  try {
    const config = {
      question: "Minimum Bond Test",
      description: "Testing minimum bond",
      resolutionTime: Math.floor(Date.now() / 1000) + 86400,
      creatorBond: ethers.parseEther("0.1"),
      category: ethers.keccak256(ethers.toUtf8Bytes("General")),
      outcome1: "Yes",
      outcome2: "No"
    };

    const tx = await core.connect(creator2).createMarket(config, {
      value: ethers.parseEther("0.1") // Exact minimum
    });
    await tx.wait();

    recordTest("Accept minimum bond (0.1 ETH)", true);
  } catch (error) {
    recordTest("Accept minimum bond (0.1 ETH)", false, error);
  }

  // Test 4.2: Below minimum bond (should fail)
  try {
    const config = {
      question: "Below Minimum Bond Test",
      description: "Should fail",
      resolutionTime: Math.floor(Date.now() / 1000) + 86400,
      creatorBond: ethers.parseEther("0.05"),
      category: ethers.keccak256(ethers.toUtf8Bytes("General")),
      outcome1: "Yes",
      outcome2: "No"
    };

    await core.connect(creator2).createMarket(config, {
      value: ethers.parseEther("0.05") // Below minimum
    });

    recordTest("Reject below minimum bond", false, new Error("Should have reverted"));
  } catch (error) {
    recordTest("Reject below minimum bond", true); // Expected to fail
  }

  // Test 4.3: Past resolution time (should fail)
  try {
    const config = {
      question: "Past Time Test",
      description: "Should fail",
      resolutionTime: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      creatorBond: ethers.parseEther("0.1"),
      category: ethers.keccak256(ethers.toUtf8Bytes("General")),
      outcome1: "Yes",
      outcome2: "No"
    };

    await core.connect(creator2).createMarket(config, {
      value: ethers.parseEther("0.1")
    });

    recordTest("Reject past resolution time", false, new Error("Should have reverted"));
  } catch (error) {
    recordTest("Reject past resolution time", true); // Expected to fail
  }

  // Test 4.4: Far future resolution time
  try {
    const config = {
      question: "Far Future Test",
      description: "Testing far future",
      resolutionTime: Math.floor(Date.now() / 1000) + (365 * 24 * 3600), // 1 year
      creatorBond: ethers.parseEther("0.1"),
      category: ethers.keccak256(ethers.toUtf8Bytes("General")),
      outcome1: "Yes",
      outcome2: "No"
    };

    const tx = await core.connect(creator2).createMarket(config, {
      value: ethers.parseEther("0.1")
    });
    await tx.wait();

    recordTest("Accept far future resolution time", true);
  } catch (error) {
    recordTest("Accept far future resolution time", false, error);
  }

  // Test 4.5: Multiple markets rapidly
  try {
    for (let i = 0; i < 3; i++) {
      const config = {
        question: `Rapid Test ${i}`,
        description: `Market ${i}`,
        resolutionTime: Math.floor(Date.now() / 1000) + 86400,
        creatorBond: ethers.parseEther("0.1"),
        category: ethers.keccak256(ethers.toUtf8Bytes("General")),
        outcome1: "Yes",
        outcome2: "No"
      };

      await core.connect(creator1).createMarket(config, {
        value: ethers.parseEther("0.1")
      });
    }

    recordTest("Create multiple markets rapidly", true);
  } catch (error) {
    recordTest("Create multiple markets rapidly", false, error);
  }

  // ═══════════════════════════════════════════════════════════════════
  // TEST 5: ACCESS CONTROL
  // ═══════════════════════════════════════════════════════════════════

  console.log(`\n${colors.bright}${colors.blue}🔐 Test Group 5: Access Control${colors.reset}\n`);

  // Test 5.1: Unauthorized template creation
  try {
    const templateId = ethers.keccak256(ethers.toUtf8Bytes("unauthorized"));
    await extensions.connect(user1).createTemplate(
      templateId,
      "Unauthorized Template",
      ethers.keccak256(ethers.toUtf8Bytes("Test")),
      "A",
      "B"
    );

    recordTest("Prevent unauthorized template creation", false, new Error("Should have reverted"));
  } catch (error) {
    recordTest("Prevent unauthorized template creation", true); // Expected to fail
  }

  // Test 5.2: Unauthorized Core modification
  try {
    await core.connect(user1).setExtensionsContract(user1.address);
    recordTest("Prevent unauthorized Core modification", false, new Error("Should have reverted"));
  } catch (error) {
    recordTest("Prevent unauthorized Core modification", true); // Expected to fail
  }

  // ═══════════════════════════════════════════════════════════════════
  // FINAL SUMMARY
  // ═══════════════════════════════════════════════════════════════════

  console.log(`\n${colors.bright}╔══════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}║              FORK TEST RESULTS                          ║${colors.reset}`);
  console.log(`${colors.bright}╚══════════════════════════════════════════════════════════╝${colors.reset}\n`);

  console.log(`${colors.cyan}📊 Overall Results:${colors.reset}`);
  console.log(`   Total Tests:      ${results.total}`);
  console.log(`   ${colors.green}Passed:           ${results.passed}${colors.reset}`);
  console.log(`   ${colors.red}Failed:           ${results.failed}${colors.reset}`);
  console.log(`   ${colors.yellow}Success Rate:     ${((results.passed / results.total) * 100).toFixed(1)}%${colors.reset}\n`);

  // Group results
  const groups = {
    deployment: { passed: 0, total: 0 },
    market: { passed: 0, total: 0 },
    template: { passed: 0, total: 0 },
    edge: { passed: 0, total: 0 },
    access: { passed: 0, total: 0 }
  };

  results.tests.forEach((test, i) => {
    if (i < 4) {
      groups.deployment.total++;
      if (test.passed) groups.deployment.passed++;
    } else if (i < 8) {
      groups.market.total++;
      if (test.passed) groups.market.passed++;
    } else if (i < 11) {
      groups.template.total++;
      if (test.passed) groups.template.passed++;
    } else if (i < 16) {
      groups.edge.total++;
      if (test.passed) groups.edge.passed++;
    } else {
      groups.access.total++;
      if (test.passed) groups.access.passed++;
    }
  });

  console.log(`${colors.cyan}📋 Results by Category:${colors.reset}`);
  console.log(`   Deployment:       ${groups.deployment.passed}/${groups.deployment.total}`);
  console.log(`   Market Creation:  ${groups.market.passed}/${groups.market.total}`);
  console.log(`   Template System:  ${groups.template.passed}/${groups.template.total}`);
  console.log(`   Edge Cases:       ${groups.edge.passed}/${groups.edge.total}`);
  console.log(`   Access Control:   ${groups.access.passed}/${groups.access.total}\n`);

  // Save results
  const resultsPath = "./fork-test-results.json";
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`${colors.cyan}📄 Results saved to: ${colors.yellow}${resultsPath}${colors.reset}\n`);

  // Final verdict
  if (results.failed === 0) {
    console.log(`${colors.bright}${colors.green}╔══════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.bright}${colors.green}║           🎉 ALL TESTS PASSED! 🎉                       ║${colors.reset}`);
    console.log(`${colors.bright}${colors.green}╚══════════════════════════════════════════════════════════╝${colors.reset}\n`);
    console.log(`${colors.green}✅ Ready for Sepolia deployment!${colors.reset}\n`);
  } else {
    console.log(`${colors.bright}${colors.yellow}╔══════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.bright}${colors.yellow}║           ⚠️  SOME TESTS FAILED! ⚠️                     ║${colors.reset}`);
    console.log(`${colors.bright}${colors.yellow}╚══════════════════════════════════════════════════════════╝${colors.reset}\n`);
    console.log(`${colors.yellow}⚠️  Review failures before Sepolia deployment${colors.reset}\n`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
