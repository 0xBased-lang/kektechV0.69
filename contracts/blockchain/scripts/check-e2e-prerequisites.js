/**
 * Check E2E Test Prerequisites
 *
 * Verifies that all requirements are met before running E2E tests:
 * - Test wallet has sufficient BASED
 * - Admin wallet has sufficient BASED
 * - Test market is in ACTIVE state
 * - Dev server is running (optional check)
 */

const { ethers } = require('ethers');

async function main() {
  console.log('🔍 E2E Test Prerequisites Check\n');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    const provider = new ethers.JsonRpcProvider('https://mainnet.basedaibridge.com/rpc/');

    // Check test wallet (use ethers.getAddress to get proper checksum)
    const testAddr = ethers.getAddress('0x9469dce114c11cb03f03dd5a85451b03718b1fe9');
    const testBalance = await provider.getBalance(testAddr);
    console.log('📍 Test Wallet:');
    console.log(`   Address: ${testAddr}`);
    console.log(`   Balance: ${ethers.formatEther(testBalance)} BASED`);
    console.log(`   Status: ${Number(testBalance) >= ethers.parseEther('0.5') ? '✅ SUFFICIENT' : '❌ INSUFFICIENT (needs 0.5+)'}\n`);

    // Check admin wallet (deployer wallet from .env)
    const adminAddr = ethers.getAddress('0x25fD72154857Bd204345808a690d51a61A81EB0b');
    const adminBalance = await provider.getBalance(adminAddr);
    console.log('📍 Admin Wallet:');
    console.log(`   Address: ${adminAddr}`);
    console.log(`   Balance: ${ethers.formatEther(adminBalance)} BASED`);
    console.log(`   Status: ${Number(adminBalance) >= ethers.parseEther('0.1') ? '✅ SUFFICIENT' : '❌ INSUFFICIENT (needs 0.1+)'}\n`);

    // Check market (use ethers.getAddress to get proper checksum)
    const marketAddr = ethers.getAddress('0x3b69ad439ba54b85be5743c645eefd18d0857ebe');
    const marketAbi = ['function currentState() external view returns (uint8)'];
    const market = new ethers.Contract(marketAddr, marketAbi, provider);
    const state = await market.currentState();
    const stateNames = ['PROPOSED', 'APPROVED', 'ACTIVE', 'RESOLVING', 'DISPUTED', 'FINALIZED'];
    console.log('📍 Test Market:');
    console.log(`   Address: ${marketAddr}`);
    console.log(`   State: ${state} (${stateNames[Number(state)]})`);
    console.log(`   Status: ${Number(state) === 2 ? '✅ ACTIVE (ready for trading)' : '⚠️ NOT ACTIVE'}\n`);

    // Dev server check (optional)
    console.log('📍 Dev Server:');
    try {
      const http = require('http');
      await new Promise((resolve, reject) => {
        const req = http.get('http://localhost:3006', (res) => {
          console.log(`   Port: 3006`);
          console.log(`   Status: ✅ RUNNING (HTTP ${res.statusCode})\n`);
          resolve();
        });
        req.on('error', (err) => {
          console.log(`   Port: 3006`);
          console.log(`   Status: ⚠️ NOT RUNNING (start with: npm run dev)\n`);
          resolve(); // Don't fail, just warn
        });
        req.setTimeout(2000, () => {
          req.destroy();
          console.log(`   Port: 3006`);
          console.log(`   Status: ⚠️ TIMEOUT (server may not be ready)\n`);
          resolve();
        });
      });
    } catch (e) {
      console.log(`   Status: ⚠️ CHECK FAILED\n`);
    }

    console.log('═══════════════════════════════════════════════════════');
    console.log('SUMMARY');
    console.log('═══════════════════════════════════════════════════════');

    const allGood = Number(testBalance) >= ethers.parseEther('0.5') &&
                    Number(adminBalance) >= ethers.parseEther('0.1') &&
                    Number(state) === 2;

    if (allGood) {
      console.log('\n✅ ALL CRITICAL PREREQUISITES MET!\n');
      console.log('Ready to run E2E tests:');
      console.log('  cd ../frontend');
      console.log('  npx playwright test tests/e2e/ --reporter=list\n');
    } else {
      console.log('\n⚠️ SOME PREREQUISITES NOT MET:\n');
      if (Number(testBalance) < ethers.parseEther('0.5')) {
        console.log('   ❌ Test wallet needs more BASED');
        console.log('      Fund 0x9469dce114c11cb03f03dd5a85451b03718b1fe9 with ~5 BASED\n');
      }
      if (Number(adminBalance) < ethers.parseEther('0.1')) {
        console.log('   ❌ Admin wallet needs more BASED');
        console.log('      (Already has 30k+ BASED, should be fine)\n');
      }
      if (Number(state) !== 2) {
        console.log('   ❌ Market not ACTIVE');
        console.log('      Run: node scripts/approve-activate-market.js\n');
      }
    }

  } catch (error) {
    console.error('\n❌ Error checking prerequisites:');
    console.error(error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
