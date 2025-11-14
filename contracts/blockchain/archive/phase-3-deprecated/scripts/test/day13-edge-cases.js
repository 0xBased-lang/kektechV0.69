/**
 * @title Day 13 - Edge Cases & Attack Simulation Testing
 * @notice Tests edge cases, boundary conditions, and attack vectors
 * @dev Comprehensive security and robustness testing
 */

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// ANSI color codes
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(message) {
  log("\n" + "═".repeat(60), "cyan");
  log(`   ${message}`, "cyan");
  log("═".repeat(60) + "\n", "cyan");
}

async function main() {
  const network = hre.network.name;
  const [deployer] = await ethers.getSigners();

  log("\n╔════════════════════════════════════════════════════════════╗", "magenta");
  log("║         DAY 13 - EDGE CASES & ATTACK SIMULATION           ║", "magenta");
  log("╚════════════════════════════════════════════════════════════╝\n", "magenta");

  header(`DAY 13 - EDGE CASE TESTING (${network.toUpperCase()})`);

  log(`${colors.bright}📋 Configuration${colors.reset}`);
  log(`Network: ${network}`);
  log(`Deployer: ${deployer.address}`);
  log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`);

  // Load deployment addresses
  let deploymentFile = path.join(__dirname, `../../${network}-deployment-split.json`);
  // Try fork-deployment-split.json if localhost is used
  if (!fs.existsSync(deploymentFile) && network === "localhost") {
    deploymentFile = path.join(__dirname, `../../fork-deployment-split.json`);
  }
  if (!fs.existsSync(deploymentFile)) {
    throw new Error(`Deployment file not found: ${deploymentFile}`);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));

  // Connect to Factory
  const factoryAddress = deployment.core?.FlexibleMarketFactoryCore || deployment.contracts?.FlexibleMarketFactoryCore;
  if (!factoryAddress) {
    throw new Error("FlexibleMarketFactoryCore address not found in deployment file");
  }
  const factory = await ethers.getContractAt("FlexibleMarketFactoryCore", factoryAddress);

  // Test tracking
  const results = {
    network,
    passed: [],
    failed: [],
    errors: [],
    gasUsed: {}
  };

  // Helper function to test edge cases
  async function testEdgeCase(testName, testFn, shouldFail = false) {
    log(`\n${colors.bright}🧪 Test: ${testName}${colors.reset}`);
    try {
      const result = await testFn();
      if (shouldFail) {
        log(`   ❌ FAILED: Expected to fail but succeeded`, "red");
        results.failed.push(testName);
        results.errors.push(`${testName}: Expected failure but succeeded`);
      } else {
        log(`   ✅ PASSED`, "green");
        results.passed.push(testName);
        if (result && result.gasUsed) {
          results.gasUsed[testName] = result.gasUsed.toString();
        }
      }
      return result;
    } catch (error) {
      if (shouldFail) {
        log(`   ✅ PASSED (Expected failure)`, "green");
        log(`   Error: ${error.message.split('\n')[0]}`, "yellow");
        results.passed.push(testName);
      } else {
        log(`   ❌ FAILED: ${error.message.split('\n')[0]}`, "red");
        results.failed.push(testName);
        results.errors.push(`${testName}: ${error.message}`);
      }
      return null;
    }
  }

  // Get minimum creator bond
  const minCreatorBond = await factory.minCreatorBond();
  log(`\n📊 Min Creator Bond: ${ethers.formatEther(minCreatorBond)} ETH`);

  // ========================================================================
  // CATEGORY 1: INVALID PARAMETERS
  // ========================================================================
  header("CATEGORY 1: INVALID PARAMETERS");

  // Test 1.1: Empty question
  await testEdgeCase(
    "Empty question (should fail)",
    async () => {
      const config = {
        question: "",
        description: "Test market",
        outcome1: "Yes",
        outcome2: "No",
        resolutionTime: Math.floor(Date.now() / 1000) + 86400,
        category: ethers.id("test"),
        creatorBond: minCreatorBond
      };
      return await factory.createMarket(config, { value: minCreatorBond });
    },
    true  // Should fail
  );

  // Test 1.2: Resolution time in the past
  await testEdgeCase(
    "Past resolution time (should fail)",
    async () => {
      const config = {
        question: "Will this work?",
        description: "Edge case test market",
        outcome1: "Yes",
        outcome2: "No",
        resolutionTime: Math.floor(Date.now() / 1000) - 86400,  // Yesterday
        category: ethers.id("test"),
        creatorBond: minCreatorBond
      };
      return await factory.createMarket(config, { value: minCreatorBond });
    },
    true  // Should fail
  );

  // Test 1.3: Resolution time too far in future (>1 year)
  await testEdgeCase(
    "Resolution time >1 year (should fail)",
    async () => {
      const config = {
        question: "Will this work?",
        description: "Edge case test market",
        outcome1: "Yes",
        outcome2: "No",
        resolutionTime: Math.floor(Date.now() / 1000) + (366 * 86400),  // >1 year
        category: ethers.id("test"),
        creatorBond: minCreatorBond
      };
      return await factory.createMarket(config, { value: minCreatorBond });
    },
    true  // Should fail
  );

  // Test 1.4: Zero category
  await testEdgeCase(
    "Zero category (should fail)",
    async () => {
      const config = {
        question: "Will this work?",
        description: "Edge case test market",
        outcome1: "Yes",
        outcome2: "No",
        resolutionTime: Math.floor(Date.now() / 1000) + 86400,
        category: ethers.ZeroHash,  // Zero bytes32
        creatorBond: minCreatorBond
      };
      return await factory.createMarket(config, { value: minCreatorBond });
    },
    true  // Should fail
  );

  // ========================================================================
  // CATEGORY 2: INSUFFICIENT BALANCE
  // ========================================================================
  header("CATEGORY 2: INSUFFICIENT BALANCE");

  // Test 2.1: Insufficient creator bond
  await testEdgeCase(
    "Insufficient creator bond (should fail)",
    async () => {
      const config = {
        question: "Will this work?",
        description: "Edge case test market",
        outcome1: "Yes",
        outcome2: "No",
        resolutionTime: Math.floor(Date.now() / 1000) + 86400,
        category: ethers.id("test"),
        creatorBond: minCreatorBond
      };
      const tooLittle = minCreatorBond / 2n;
      return await factory.createMarket(config, { value: tooLittle });
    },
    true  // Should fail
  );

  // Test 2.2: Zero value sent
  await testEdgeCase(
    "Zero value sent (should fail)",
    async () => {
      const config = {
        question: "Will this work?",
        description: "Edge case test market",
        outcome1: "Yes",
        outcome2: "No",
        resolutionTime: Math.floor(Date.now() / 1000) + 86400,
        category: ethers.id("test"),
        creatorBond: minCreatorBond
      };
      return await factory.createMarket(config, { value: 0 });
    },
    true  // Should fail
  );

  // ========================================================================
  // CATEGORY 3: MALICIOUS INPUTS
  // ========================================================================
  header("CATEGORY 3: MALICIOUS INPUTS");

  // Test 3.1: Extremely long question
  await testEdgeCase(
    "Extremely long question (should succeed)",
    async () => {
      const longQuestion = "A".repeat(1000);  // 1KB question
      const config = {
        question: longQuestion,
        description: "Edge case test market",
        outcome1: "Yes",
        outcome2: "No",
        resolutionTime: Math.floor(Date.now() / 1000) + 86400,
        category: ethers.id("test"),
        creatorBond: minCreatorBond
      };
      const tx = await factory.createMarket(config, { value: minCreatorBond });
      const receipt = await tx.wait();
      return { gasUsed: receipt.gasUsed };
    },
    false  // Should succeed (just expensive)
  );

  // Test 3.2: SQL injection attempt
  await testEdgeCase(
    "SQL injection attempt (should succeed)",
    async () => {
      const config = {
        question: "'; DROP TABLE markets; --",
        description: "Edge case test market",
        outcome1: "Yes",
        outcome2: "No",
        resolutionTime: Math.floor(Date.now() / 1000) + 86400,
        category: ethers.id("test"),
        creatorBond: minCreatorBond
      };
      const tx = await factory.createMarket(config, { value: minCreatorBond });
      const receipt = await tx.wait();
      return { gasUsed: receipt.gasUsed };
    },
    false  // Should succeed (treated as normal string)
  );

  // Test 3.3: XSS attempt
  await testEdgeCase(
    "XSS attempt (should succeed)",
    async () => {
      const config = {
        question: "<script>alert('XSS')</script>",
        description: "Edge case test market",
        outcome1: "Yes",
        outcome2: "No",
        resolutionTime: Math.floor(Date.now() / 1000) + 86400,
        category: ethers.id("test"),
        creatorBond: minCreatorBond
      };
      const tx = await factory.createMarket(config, { value: minCreatorBond });
      const receipt = await tx.wait();
      return { gasUsed: receipt.gasUsed };
    },
    false  // Should succeed (frontend responsibility)
  );

  // ========================================================================
  // CATEGORY 4: BOUNDARY CONDITIONS
  // ========================================================================
  header("CATEGORY 4: BOUNDARY CONDITIONS");

  // Test 4.1: Exact minimum bond
  await testEdgeCase(
    "Exact minimum bond (should succeed)",
    async () => {
      const config = {
        question: "Will exact minimum bond work?",
        description: "Edge case test market",
        outcome1: "Yes",
        outcome2: "No",
        resolutionTime: Math.floor(Date.now() / 1000) + 86400,
        category: ethers.id("test"),
        creatorBond: minCreatorBond
      };
      const tx = await factory.createMarket(config, { value: minCreatorBond });
      const receipt = await tx.wait();
      return { gasUsed: receipt.gasUsed };
    },
    false  // Should succeed
  );

  // Test 4.2: Resolution time = now + 1 second
  await testEdgeCase(
    "Resolution time = now + 1 second (should succeed)",
    async () => {
      const config = {
        question: "Will immediate resolution work?",
        description: "Edge case test market",
        outcome1: "Yes",
        outcome2: "No",
        resolutionTime: Math.floor(Date.now() / 1000) + 1,
        category: ethers.id("test"),
        creatorBond: minCreatorBond
      };
      const tx = await factory.createMarket(config, { value: minCreatorBond });
      const receipt = await tx.wait();
      return { gasUsed: receipt.gasUsed };
    },
    false  // Should succeed
  );

  // Test 4.3: Resolution time = exactly 1 year
  await testEdgeCase(
    "Resolution time = exactly 1 year (should succeed)",
    async () => {
      const config = {
        question: "Will max resolution time work?",
        description: "Edge case test market",
        outcome1: "Yes",
        outcome2: "No",
        resolutionTime: Math.floor(Date.now() / 1000) + 31536000,  // Exactly 1 year
        category: ethers.id("test"),
        creatorBond: minCreatorBond
      };
      const tx = await factory.createMarket(config, { value: minCreatorBond });
      const receipt = await tx.wait();
      return { gasUsed: receipt.gasUsed };
    },
    false  // Should succeed
  );

  // ========================================================================
  // SUMMARY
  // ========================================================================
  header("TEST SUMMARY");

  log(`${colors.green}✅ Passed: ${results.passed.length}${colors.reset}`);
  results.passed.forEach(test => log(`   - ${test}`));

  if (results.failed.length > 0) {
    log(`\n${colors.red}❌ Failed: ${results.failed.length}${colors.reset}`);
    results.failed.forEach(test => log(`   - ${test}`));
  }

  log(`\n${colors.bright}Total Tests: ${results.passed.length + results.failed.length}${colors.reset}`);
  log(`${colors.bright}Success Rate: ${((results.passed.length / (results.passed.length + results.failed.length)) * 100).toFixed(1)}%${colors.reset}`);

  // Save results
  const resultsFile = path.join(__dirname, `../../day13-${network}-results.json`);
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  log(`\n${colors.green}✅ Results saved to: ${resultsFile}${colors.reset}`);

  if (results.failed.length === 0) {
    log(`\n${colors.bright}${colors.green}🎉 ALL EDGE CASE TESTS PASSED!${colors.reset}`);
  } else {
    log(`\n${colors.bright}${colors.yellow}⚠️ SOME TESTS FAILED - REVIEW NEEDED${colors.reset}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
