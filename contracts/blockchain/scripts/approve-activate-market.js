/**
 * Approve & Activate Market Script
 *
 * Changes a market from PROPOSED → APPROVED → ACTIVE
 * Requires admin wallet with ADMIN_ROLE
 *
 * Usage: node scripts/approve-activate-market.js <market_address>
 */

const { ethers } = require('hardhat');
require('dotenv').config();

// Contract addresses from deployment
const MARKET_FACTORY_ADDRESS = '0x3eaF643482Fe35d13DB812946E14F5345eb60d62';

// Market states
const MarketState = {
  0: 'PROPOSED',
  1: 'APPROVED',
  2: 'ACTIVE',
  3: 'RESOLVING',
  4: 'DISPUTED',
  5: 'FINALIZED'
};

async function main() {
  // Get market address from command line or use default
  const marketAddress = process.argv[2] || '0x3B69aD439BA54B85BE5743C645eEfD18d0857EBe';

  console.log('🚀 Market Approval & Activation Script');
  console.log('═══════════════════════════════════════════════════════\n');
  console.log(`Target Market: ${marketAddress}\n`);

  try {
    // Connect to BasedAI mainnet
    const provider = new ethers.JsonRpcProvider('https://mainnet.basedaibridge.com/rpc/');
    console.log('✅ Connected to BasedAI mainnet');

    // Get admin wallet from private key
    const adminPrivateKey = process.env.PRIVATE_KEY;
    if (!adminPrivateKey) {
      throw new Error('PRIVATE_KEY not found in .env file');
    }

    const adminWallet = new ethers.Wallet(adminPrivateKey, provider);
    console.log(`✅ Admin wallet loaded: ${adminWallet.address}`);

    // Check admin balance
    const balance = await provider.getBalance(adminWallet.address);
    console.log(`💰 Admin balance: ${ethers.formatEther(balance)} BASED\n`);

    if (balance < ethers.parseEther('0.1')) {
      console.log('⚠️  Warning: Low balance, may not have enough gas');
    }

    // Get MarketFactory contract (state changes happen through factory!)
    const factoryAbi = [
      'function approveMarket(address) external',
      'function activateMarket(address) external'
    ];

    const factory = new ethers.Contract(
      MARKET_FACTORY_ADDRESS,
      factoryAbi,
      adminWallet
    );

    // Get market contract (for reading state only)
    const marketAbi = [
      'function question() external view returns (string memory)',
      'function currentState() external view returns (uint8)',
      'function resolutionTime() external view returns (uint256)',
      'function creator() external view returns (address)'
    ];

    const market = new ethers.Contract(marketAddress, marketAbi, provider);

    // Get current market state
    console.log('📊 Checking current market state...');
    const [currentState, question, resolutionTime] = await Promise.all([
      market.currentState(),
      market.question().catch(() => 'Unknown'),
      market.resolutionTime()
    ]);

    console.log(`   Question: ${question}`);
    console.log(`   Current State: ${MarketState[Number(currentState)]} (${currentState})`);
    console.log(`   Resolution: ${new Date(Number(resolutionTime) * 1000).toISOString()}\n`);

    // Check if already ACTIVE
    if (Number(currentState) === 2) {
      console.log('✅ Market is already ACTIVE!');
      console.log('   No action needed.\n');
      return;
    }

    // Step 1: Approve if PROPOSED
    if (Number(currentState) === 0) {
      console.log('📝 Step 1: Approving market (PROPOSED → APPROVED)...');
      console.log('   Calling MarketFactory.approveMarket()...');

      const approveTx = await factory.approveMarket(marketAddress, {
        gasLimit: 5000000 // 5M gas limit
      });
      console.log(`   Transaction sent: ${approveTx.hash}`);
      console.log(`   Waiting for confirmation...`);

      const approveReceipt = await approveTx.wait();
      console.log(`   ✅ Approved! Gas used: ${approveReceipt.gasUsed.toString()}`);
      console.log(`   Block: ${approveReceipt.blockNumber}\n`);

      // Verify state change
      const newState = await market.currentState();
      console.log(`   State verified: ${MarketState[Number(newState)]} (${newState})\n`);

      if (Number(newState) !== 1) {
        throw new Error('Failed to change state to APPROVED');
      }
    } else if (Number(currentState) === 1) {
      console.log('✅ Market already APPROVED, skipping to activation...\n');
    } else {
      throw new Error(`Market is in unexpected state: ${MarketState[Number(currentState)]}`);
    }

    // Step 2: Activate (APPROVED → ACTIVE)
    console.log('📝 Step 2: Activating market (APPROVED → ACTIVE)...');
    console.log('   Calling MarketFactory.activateMarket()...');

    const activateTx = await factory.activateMarket(marketAddress, {
      gasLimit: 5000000 // 5M gas limit
    });
    console.log(`   Transaction sent: ${activateTx.hash}`);
    console.log(`   Waiting for confirmation...`);

    const activateReceipt = await activateTx.wait();
    console.log(`   ✅ Activated! Gas used: ${activateReceipt.gasUsed.toString()}`);
    console.log(`   Block: ${activateReceipt.blockNumber}\n`);

    // Verify final state
    const finalState = await market.currentState();
    console.log(`   State verified: ${MarketState[Number(finalState)]} (${finalState})\n`);

    if (Number(finalState) !== 2) {
      throw new Error('Failed to change state to ACTIVE');
    }

    // Check updated balance
    const newBalance = await provider.getBalance(adminWallet.address);
    const gasSpent = balance - newBalance;

    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ SUCCESS - Market is now ACTIVE!');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`Market: ${marketAddress}`);
    console.log(`State: ACTIVE (2)`);
    console.log(`Gas spent: ${ethers.formatEther(gasSpent)} BASED`);
    console.log(`New balance: ${ethers.formatEther(newBalance)} BASED\n`);
    console.log('🎉 Market is ready for E2E testing!');
    console.log(`   View on explorer: https://explorer.bf1337.org/address/${marketAddress}\n`);

  } catch (error) {
    console.error('\n❌ Error activating market:');
    console.error(error.message);

    if (error.code === 'CALL_EXCEPTION') {
      console.error('\n💡 Possible reasons:');
      console.error('   1. Admin wallet does not have ADMIN_ROLE');
      console.error('   2. Market contract does not support changeMarketState()');
      console.error('   3. Market is in a state that cannot be changed');
      console.error('\n   Check admin role:');
      console.error('   AccessControlManager.hasRole(ADMIN_ROLE, adminAddress)');
    }

    console.error('\nStack trace:');
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
