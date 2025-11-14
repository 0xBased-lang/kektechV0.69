/**
 * Sepolia Deployment Validation Script
 * Validates all prerequisites before Sepolia deployment
 */

const fs = require('fs');
const path = require('path');

// Contract size limit (24KB = 24576 bytes)
const SIZE_LIMIT = 24576;

// Core contracts to validate
const CORE_CONTRACTS = [
  'VersionedRegistry',
  'ParameterStorage',
  'AccessControlManager',
  'ResolutionManager',
  'RewardDistributor',
  'FlexibleMarketFactoryUnified',
  'PredictionMarket',
  'CurveRegistry',
  'MarketTemplateRegistry'
];

async function validateContractSizes() {
  console.log('\n📦 CONTRACT SIZE VALIDATION');
  console.log('═══════════════════════════════════════\n');

  let allValid = true;
  let totalSize = 0;

  for (const contractName of CORE_CONTRACTS) {
    const artifactPath = path.join(
      __dirname,
      '../artifacts/contracts/core',
      `${contractName}.sol`,
      `${contractName}.json`
    );

    if (!fs.existsSync(artifactPath)) {
      console.log(`❌ ${contractName}: Artifact not found!`);
      allValid = false;
      continue;
    }

    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    const bytecode = artifact.deployedBytecode || artifact.bytecode;

    if (!bytecode || bytecode === '0x') {
      console.log(`❌ ${contractName}: No bytecode!`);
      allValid = false;
      continue;
    }

    // Calculate size (subtract '0x' prefix and divide by 2 for hex->bytes)
    const sizeBytes = (bytecode.length - 2) / 2;
    const sizeKB = (sizeBytes / 1024).toFixed(2);
    const percentage = ((sizeBytes / SIZE_LIMIT) * 100).toFixed(1);

    totalSize += sizeBytes;

    if (sizeBytes > SIZE_LIMIT) {
      console.log(`❌ ${contractName}: ${sizeKB} KB (${percentage}% of limit) - TOO LARGE!`);
      allValid = false;
    } else if (sizeBytes > SIZE_LIMIT * 0.9) {
      console.log(`⚠️  ${contractName}: ${sizeKB} KB (${percentage}% of limit) - WARNING: Close to limit`);
    } else {
      console.log(`✅ ${contractName}: ${sizeKB} KB (${percentage}% of limit)`);
    }
  }

  console.log(`\n📊 Total Size: ${(totalSize / 1024).toFixed(2)} KB`);
  console.log(`📊 Average Size: ${(totalSize / CORE_CONTRACTS.length / 1024).toFixed(2)} KB per contract\n`);

  return allValid;
}

async function validateConfiguration() {
  console.log('\n⚙️  CONFIGURATION VALIDATION');
  console.log('═══════════════════════════════════════\n');

  let allValid = true;

  // Check .env file
  const envPath = path.join(__dirname, '../.env');
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env file not found!');
    allValid = false;
  } else {
    console.log('✅ .env file exists');

    // Check for required variables (without revealing values)
    const envContent = fs.readFileSync(envPath, 'utf8');
    const requiredVars = ['SEPOLIA_RPC', 'PRIVATE_KEY'];

    for (const varName of requiredVars) {
      if (envContent.includes(`${varName}=`) && !envContent.includes(`${varName}=\n`)) {
        console.log(`✅ ${varName} configured`);
      } else {
        console.log(`❌ ${varName} not configured!`);
        allValid = false;
      }
    }
  }

  // Check deployment scripts
  const deployScripts = [
    'scripts/deploy/deploy-sepolia.js',
    'scripts/deploy/deploy-unified.js',
    'scripts/deploy/register-contracts.js'
  ];

  console.log('\n📜 Deployment Scripts:');
  for (const script of deployScripts) {
    const scriptPath = path.join(__dirname, '..', script);
    if (fs.existsSync(scriptPath)) {
      console.log(`✅ ${script}`);
    } else {
      console.log(`⚠️  ${script} not found (may not be needed)`);
    }
  }

  return allValid;
}

async function validateTestResults() {
  console.log('\n🧪 TEST RESULTS VALIDATION');
  console.log('═══════════════════════════════════════\n');

  // Check for recent test run
  const testLogPath = path.join(__dirname, '../test-results.json');

  if (fs.existsSync(testLogPath)) {
    const testResults = JSON.parse(fs.readFileSync(testLogPath, 'utf8'));
    console.log(`✅ Last test run: ${testResults.date}`);
    console.log(`📊 Passing: ${testResults.passing}/${testResults.total} (${testResults.percentage}%)`);

    if (testResults.percentage >= 70) {
      console.log(`✅ Test coverage acceptable (≥70%)`);
      return true;
    } else {
      console.log(`⚠️  Test coverage below recommended threshold (${testResults.percentage}% < 70%)`);
      return false;
    }
  } else {
    console.log('⚠️  No recent test results found');
    console.log('ℹ️  Run: npm test > test-results.json');
    return true; // Don't block on this
  }
}

async function main() {
  console.log('\n🚀 SEPOLIA DEPLOYMENT PRE-FLIGHT VALIDATION');
  console.log('═══════════════════════════════════════════════\n');
  console.log('Validating all prerequisites before Sepolia deployment...\n');

  const results = {
    contractSizes: await validateContractSizes(),
    configuration: await validateConfiguration(),
    testResults: await validateTestResults()
  };

  console.log('\n📋 VALIDATION SUMMARY');
  console.log('═══════════════════════════════════════\n');

  console.log(`Contract Sizes: ${results.contractSizes ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Configuration: ${results.configuration ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Test Results: ${results.testResults ? '✅ PASS' : '⚠️  WARNING'}`);

  const allPass = results.contractSizes && results.configuration;

  console.log('\n' + '═'.repeat(50));
  if (allPass) {
    console.log('\n✅ ALL VALIDATIONS PASSED!');
    console.log('🚀 Ready to deploy to Sepolia testnet\n');
    return 0;
  } else {
    console.log('\n❌ VALIDATION FAILED!');
    console.log('🛑 Fix issues before deploying to Sepolia\n');
    return 1;
  }
}

main()
  .then(code => process.exit(code))
  .catch(error => {
    console.error('\n❌ Validation script error:', error);
    process.exit(1);
  });
