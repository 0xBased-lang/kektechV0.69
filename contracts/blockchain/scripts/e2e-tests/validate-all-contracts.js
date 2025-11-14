const { ethers } = require("hardhat");

/**
 * VALIDATE ALL CONTRACTS
 *
 * Purpose: Comprehensive system health check for all deployed contracts
 *
 * This script validates:
 * - All 10 contracts exist and are accessible
 * - Registry configurations are correct
 * - Access control roles are properly set
 * - Contract interactions work
 * - Curve system is operational
 */

const CONTRACTS = {
  VersionedRegistry: "0x67F8F023f6cFAe44353d797D6e0B157F2579301A",
  FlexibleMarketFactoryUnified: "0x169b4019Fc12c5bD43BFA5d830Fd01A678df6a15",
  PredictionMarketTemplate: "0x8D608888f06abC299472DA558380B425Fc98CcC3",
  CurveRegistry: "0x5AcC0f00c0675975a2c4A54aBcC7826Bd229Ca70",
  LMSRCurve: "0x91DFC77A746Fe586217e6596ee408cf7E678dBE3",
  AccessControlManager: "0x4d1afBb8E50e17F24dCbB4Fc3197537be646315A",
  ParameterStorage: "0x0FdcaCE9dEE78c70C92B243346cDf763A06fEdF8",
  ResolutionManager: "0x10daF33E321ED8977e369a36FcC6Beb3d3d106a0",
  RewardDistributor: "0x3D274362423847B53E43a27b9E835d668754C96B",
  MarketTemplateRegistry: "0x420687494Dad8da9d058e9399cD401Deca17f6bd",
};

const MARKETS = {
  Market1: "0x31d2BC49A6FD4a066F5f8AC61Acd0E6c9105DD84",
};

async function main() {
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║       VALIDATE ALL CONTRACTS - SYSTEM HEALTH CHECK        ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  const [signer] = await ethers.getSigners();
  console.log("📍 Validator Account:", signer.address);
  console.log("");

  let allChecks = [];
  let passCount = 0;
  let failCount = 0;

  // ============= CONTRACT EXISTENCE CHECKS =============
  console.log("🔍 PHASE 1: CONTRACT EXISTENCE VERIFICATION");
  console.log("═".repeat(63));

  for (const [name, address] of Object.entries(CONTRACTS)) {
    try {
      const code = await ethers.provider.getCode(address);
      const exists = code !== "0x";
      const status = exists ? "✅" : "❌";

      console.log(`   ${status} ${name.padEnd(32)} ${address}`);

      allChecks.push({
        phase: "Existence",
        check: name,
        status: exists ? "PASS" : "FAIL"
      });

      if (exists) passCount++;
      else failCount++;
    } catch (error) {
      console.log(`   ❌ ${name.padEnd(32)} Error: ${error.message}`);
      failCount++;
    }
  }

  // Check markets
  console.log("\n📊 MARKETS");
  for (const [name, address] of Object.entries(MARKETS)) {
    try {
      const code = await ethers.provider.getCode(address);
      const exists = code !== "0x";
      const status = exists ? "✅" : "❌";

      console.log(`   ${status} ${name.padEnd(32)} ${address}`);

      allChecks.push({
        phase: "Markets",
        check: name,
        status: exists ? "PASS" : "FAIL"
      });

      if (exists) passCount++;
      else failCount++;
    } catch (error) {
      console.log(`   ❌ ${name.padEnd(32)} Error: ${error.message}`);
      failCount++;
    }
  }

  console.log("");

  // ============= REGISTRY CONFIGURATION CHECKS =============
  console.log("🗂️  PHASE 2: REGISTRY CONFIGURATION VERIFICATION");
  console.log("═".repeat(63));

  try {
    const registry = await ethers.getContractAt(
      "IVersionedRegistry",
      CONTRACTS.VersionedRegistry
    );

    // Check registered contracts
    const checks = [
      { name: "FlexibleMarketFactoryUnified", key: "FlexibleMarketFactoryUnified", expected: CONTRACTS.FlexibleMarketFactoryUnified },
      { name: "PredictionMarketTemplate", key: "PredictionMarketTemplate", expected: CONTRACTS.PredictionMarketTemplate },
      { name: "CurveRegistry", key: "CurveRegistry", expected: CONTRACTS.CurveRegistry },
      { name: "AccessControlManager", key: "AccessControlManager", expected: CONTRACTS.AccessControlManager },
      { name: "ParameterStorage", key: "ParameterStorage", expected: CONTRACTS.ParameterStorage },
      { name: "ResolutionManager", key: "ResolutionManager", expected: CONTRACTS.ResolutionManager },
      { name: "RewardDistributor", key: "RewardDistributor", expected: CONTRACTS.RewardDistributor },
    ];

    for (const check of checks) {
      try {
        const registered = await registry.getContract(ethers.keccak256(ethers.toUtf8Bytes(check.key)));
        const isCorrect = registered.toLowerCase() === check.expected.toLowerCase();
        const status = isCorrect ? "✅" : "❌";

        console.log(`   ${status} ${check.name}`);
        if (!isCorrect) {
          console.log(`      Expected: ${check.expected}`);
          console.log(`      Got:      ${registered}`);
        }

        allChecks.push({
          phase: "Registry",
          check: check.name,
          status: isCorrect ? "PASS" : "FAIL"
        });

        if (isCorrect) passCount++;
        else failCount++;
      } catch (error) {
        console.log(`   ❌ ${check.name} - Error: ${error.message}`);
        failCount++;
      }
    }
  } catch (error) {
    console.log(`   ❌ Registry check failed: ${error.message}`);
    failCount++;
  }

  console.log("");

  // ============= CURVE SYSTEM CHECKS =============
  console.log("📈 PHASE 3: CURVE SYSTEM VERIFICATION");
  console.log("═".repeat(63));

  try {
    const curveRegistry = await ethers.getContractAt(
      "ICurveRegistry",
      CONTRACTS.CurveRegistry
    );

    // Check if LMSRCurve is registered
    try {
      const lmsrAddress = await curveRegistry.getCurveByName("LMSRCurve");
      const isCorrect = lmsrAddress.toLowerCase() === CONTRACTS.LMSRCurve.toLowerCase();
      const status = isCorrect ? "✅" : "❌";

      console.log(`   ${status} LMSRCurve registered in CurveRegistry`);
      console.log(`      Address: ${lmsrAddress}`);

      allChecks.push({
        phase: "Curve System",
        check: "LMSRCurve registration",
        status: isCorrect ? "PASS" : "FAIL"
      });

      if (isCorrect) passCount++;
      else failCount++;

      // Check if curve is active
      try {
        const isActive = await curveRegistry.isCurveActive(lmsrAddress);
        const activeStatus = isActive ? "✅" : "❌";

        console.log(`   ${activeStatus} LMSRCurve is active`);

        allChecks.push({
          phase: "Curve System",
          check: "LMSRCurve active",
          status: isActive ? "PASS" : "FAIL"
        });

        if (isActive) passCount++;
        else failCount++;
      } catch (e) {
        console.log(`   ⚠️  Could not check if LMSRCurve is active: ${e.message}`);
      }
    } catch (error) {
      console.log(`   ❌ LMSRCurve not found in registry: ${error.message}`);
      failCount++;
    }
  } catch (error) {
    console.log(`   ❌ CurveRegistry check failed: ${error.message}`);
    failCount++;
  }

  console.log("");

  // ============= ACCESS CONTROL CHECKS =============
  console.log("🔐 PHASE 4: ACCESS CONTROL VERIFICATION");
  console.log("═".repeat(63));

  try {
    const accessControl = await ethers.getContractAt(
      "IAccessControlManager",
      CONTRACTS.AccessControlManager
    );

    // Check if deployer has DEFAULT_ADMIN_ROLE
    const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;

    try {
      const hasAdminRole = await accessControl.hasRole(DEFAULT_ADMIN_ROLE, signer.address);
      const status = hasAdminRole ? "✅" : "❌";

      console.log(`   ${status} Deployer has DEFAULT_ADMIN_ROLE`);
      console.log(`      Account: ${signer.address}`);

      allChecks.push({
        phase: "Access Control",
        check: "Deployer admin role",
        status: hasAdminRole ? "PASS" : "FAIL"
      });

      if (hasAdminRole) passCount++;
      else failCount++;
    } catch (error) {
      console.log(`   ❌ Admin role check failed: ${error.message}`);
      failCount++;
    }
  } catch (error) {
    console.log(`   ❌ AccessControlManager check failed: ${error.message}`);
    failCount++;
  }

  console.log("");

  // ============= FACTORY CHECKS =============
  console.log("🏭 PHASE 5: FACTORY FUNCTIONALITY VERIFICATION");
  console.log("═".repeat(63));

  try {
    const factory = await ethers.getContractAt(
      "FlexibleMarketFactoryUnified",
      CONTRACTS.FlexibleMarketFactoryUnified
    );

    // Check factory can access registry
    try {
      const factoryRegistry = await factory.registry();
      const isCorrect = factoryRegistry.toLowerCase() === CONTRACTS.VersionedRegistry.toLowerCase();
      const status = isCorrect ? "✅" : "❌";

      console.log(`   ${status} Factory points to correct VersionedRegistry`);
      console.log(`      Registry: ${factoryRegistry}`);

      allChecks.push({
        phase: "Factory",
        check: "Registry configuration",
        status: isCorrect ? "PASS" : "FAIL"
      });

      if (isCorrect) passCount++;
      else failCount++;
    } catch (error) {
      console.log(`   ❌ Factory registry check failed: ${error.message}`);
      failCount++;
    }

    // Check minimum creator bond
    try {
      const minBond = await factory.minCreatorBond();
      console.log(`   ✅ Minimum creator bond: ${ethers.formatEther(minBond)} BASED`);
      passCount++;
    } catch (error) {
      console.log(`   ❌ Min bond check failed: ${error.message}`);
      failCount++;
    }
  } catch (error) {
    console.log(`   ❌ Factory check failed: ${error.message}`);
    failCount++;
  }

  console.log("");

  // ============= MARKET 1 CHECKS =============
  console.log("📊 PHASE 6: MARKET 1 VERIFICATION");
  console.log("═".repeat(63));

  try {
    const market = await ethers.getContractAt(
      "PredictionMarket",
      MARKETS.Market1
    );

    // Check basic market info
    try {
      const question = await market.question();
      const state = await market.currentState();

      console.log(`   ✅ Market 1 accessible`);
      console.log(`      Question: ${question.substring(0, 50)}...`);
      console.log(`      State: ${state}`);

      passCount++;

      allChecks.push({
        phase: "Market 1",
        check: "Market accessible",
        status: "PASS"
      });
    } catch (error) {
      console.log(`   ❌ Market 1 check failed: ${error.message}`);
      failCount++;
    }

    // Check if market can get odds
    try {
      const odds = await market.getOdds();
      console.log(`   ✅ Market odds retrievable: [${odds[0]}, ${odds[1]}]`);
      passCount++;
    } catch (error) {
      console.log(`   ❌ Odds check failed: ${error.message}`);
      failCount++;
    }
  } catch (error) {
    console.log(`   ❌ Market 1 load failed: ${error.message}`);
    failCount++;
  }

  console.log("");

  // ============= INTEGRATION CHECKS =============
  console.log("🔗 PHASE 7: INTEGRATION VERIFICATION");
  console.log("═".repeat(63));

  try {
    const registry = await ethers.getContractAt(
      "IVersionedRegistry",
      CONTRACTS.VersionedRegistry
    );

    // Verify factory can get template from registry
    try {
      const templateAddress = await registry.getContract(
        ethers.keccak256(ethers.toUtf8Bytes("PredictionMarketTemplate"))
      );

      const isCorrect = templateAddress.toLowerCase() === CONTRACTS.PredictionMarketTemplate.toLowerCase();
      const status = isCorrect ? "✅" : "❌";

      console.log(`   ${status} Factory can access PredictionMarketTemplate`);

      allChecks.push({
        phase: "Integration",
        check: "Template access",
        status: isCorrect ? "PASS" : "FAIL"
      });

      if (isCorrect) passCount++;
      else failCount++;
    } catch (error) {
      console.log(`   ❌ Template access check failed: ${error.message}`);
      failCount++;
    }

    // Verify factory can get CurveRegistry
    try {
      const curveRegistryAddress = await registry.getContract(
        ethers.keccak256(ethers.toUtf8Bytes("CurveRegistry"))
      );

      const isCorrect = curveRegistryAddress.toLowerCase() === CONTRACTS.CurveRegistry.toLowerCase();
      const status = isCorrect ? "✅" : "❌";

      console.log(`   ${status} Factory can access CurveRegistry`);

      allChecks.push({
        phase: "Integration",
        check: "CurveRegistry access",
        status: isCorrect ? "PASS" : "FAIL"
      });

      if (isCorrect) passCount++;
      else failCount++;
    } catch (error) {
      console.log(`   ❌ CurveRegistry access check failed: ${error.message}`);
      failCount++;
    }
  } catch (error) {
    console.log(`   ❌ Integration checks failed: ${error.message}`);
    failCount++;
  }

  console.log("");

  // ============= SUMMARY =============
  console.log("═".repeat(63));
  console.log("VALIDATION SUMMARY");
  console.log("═".repeat(63));

  const totalChecks = passCount + failCount;
  const passRate = totalChecks > 0 ? ((passCount / totalChecks) * 100).toFixed(1) : 0;

  console.log(`\n   Total Checks: ${totalChecks}`);
  console.log(`   ✅ Passed: ${passCount} (${passRate}%)`);
  console.log(`   ❌ Failed: ${failCount}`);

  if (failCount === 0) {
    console.log("\n   🎉 ALL SYSTEMS OPERATIONAL!");
    console.log("   ✅ System is ready for E2E testing");
    console.log("\n   Next steps:");
    console.log("   1. Run verify-market1-status.js to check Market 1");
    console.log("   2. Run test-market1-lifecycle.js for Phase A testing");
  } else {
    console.log("\n   ⚠️  SOME CHECKS FAILED");
    console.log("   Review failures above before proceeding with testing");
  }

  console.log("\n" + "═".repeat(63));
  console.log("");

  // Output detailed check results
  if (failCount > 0) {
    console.log("FAILED CHECKS DETAIL:");
    console.log("═".repeat(63));

    const failedChecks = allChecks.filter(c => c.status === "FAIL");
    for (const check of failedChecks) {
      console.log(`   ❌ ${check.phase}: ${check.check}`);
    }
    console.log("");
  }

  // Exit with appropriate code
  if (failCount > 0) {
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ FATAL ERROR:", error.message);
    console.error(error);
    process.exit(1);
  });
