/**
 * Diagnostic script to check CurveRegistry configuration
 * Run with: node scripts/diagnose-registry.js
 */

const { ethers } = require('ethers');

// Contract addresses
const VERSIONED_REGISTRY = '0x67F8F023f6cFAe44353d797D6e0B157F2579301A';
const EXPECTED_CURVE_REGISTRY = '0x5AcC0f00c0675975a2c4A54aBcC7826Bd229Ca70';
const RPC_URL = 'https://mainnet.basedaibridge.com/rpc/';

// Minimal ABI for getContract
const VERSIONED_REGISTRY_ABI = [
  'function getContract(bytes32 name) view returns (address)',
];

const CURVE_REGISTRY_ABI = [
  'function getCurveAddress(uint8 curveType) view returns (address)',
];

async function diagnose() {
  console.log('🔍 Diagnosing Registry Configuration\n');
  console.log('='.repeat(60));

  // Create provider
  const provider = new ethers.JsonRpcProvider(RPC_URL);

  // Create contract instance
  const versionedRegistry = new ethers.Contract(
    VERSIONED_REGISTRY,
    VERSIONED_REGISTRY_ABI,
    provider
  );

  try {
    // Check if CurveRegistry is registered
    console.log('\n1️⃣  Checking VersionedRegistry for CurveRegistry...');
    const curveRegistryKey = ethers.id('CurveRegistry');
    console.log(`   Key: ${curveRegistryKey}`);

    const curveRegistryAddress = await versionedRegistry.getContract(curveRegistryKey);
    console.log(`   Registered Address: ${curveRegistryAddress}`);
    console.log(`   Expected Address:   ${EXPECTED_CURVE_REGISTRY}`);

    if (curveRegistryAddress === ethers.ZeroAddress) {
      console.log('\n❌ PROBLEM FOUND: CurveRegistry NOT registered in VersionedRegistry!');
      console.log('\n📝 FIX REQUIRED:');
      console.log('   Run: cd contracts/blockchain && npx hardhat run scripts/step3-update-versioned-registry.js --network basedai');
      return false;
    }

    if (curveRegistryAddress.toLowerCase() !== EXPECTED_CURVE_REGISTRY.toLowerCase()) {
      console.log(`\n⚠️  WARNING: CurveRegistry registered at different address!`);
      console.log(`   Expected: ${EXPECTED_CURVE_REGISTRY}`);
      console.log(`   Found:    ${curveRegistryAddress}`);
    } else {
      console.log('\n✅ CurveRegistry is properly registered!');
    }

    // Check if LMSR curve is registered
    console.log('\n2️⃣  Checking CurveRegistry for LMSR curve...');
    const curveRegistry = new ethers.Contract(
      curveRegistryAddress,
      CURVE_REGISTRY_ABI,
      provider
    );

    const lmsrAddress = await curveRegistry.getCurveAddress(0); // 0 = LMSR
    console.log(`   LMSR Curve Address: ${lmsrAddress}`);

    if (lmsrAddress === ethers.ZeroAddress) {
      console.log('\n❌ PROBLEM FOUND: LMSR curve NOT registered in CurveRegistry!');
      console.log('\n📝 FIX REQUIRED:');
      console.log('   Run: cd contracts/blockchain && npx hardhat run scripts/step2-register-lmsr-curve.js --network basedai');
      return false;
    }

    console.log('\n✅ LMSR curve is properly registered!');

    // Check Linear curve
    console.log('\n3️⃣  Checking CurveRegistry for Linear curve...');
    const linearAddress = await curveRegistry.getCurveAddress(1); // 1 = Linear
    console.log(`   Linear Curve Address: ${linearAddress}`);

    if (linearAddress === ethers.ZeroAddress) {
      console.log('\n⚠️  Linear curve NOT registered (optional)');
    } else {
      console.log('\n✅ Linear curve is registered!');
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ ALL CHECKS PASSED! Registry is properly configured.');
    console.log('\n💡 Market creation should work now. Try again from the admin panel.');

    return true;

  } catch (error) {
    console.error('\n❌ ERROR during diagnosis:', error.message);
    if (error.code === 'CALL_EXCEPTION') {
      console.log('\n💡 This usually means the contract doesn\'t exist at that address or the RPC is down.');
    }
    return false;
  }
}

// Run diagnosis
diagnose()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
