/**
 * Query Markets Script
 *
 * Fetches all markets from MarketFactory and displays their current state
 * Helps identify ACTIVE markets for E2E testing
 *
 * Usage: node scripts/query-markets.js
 */

const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

// Contract addresses from deployment
const MARKET_FACTORY_ADDRESS = '0x3eaF643482Fe35d13DB812946E14F5345eb60d62';

// Market states enum
const MarketState = {
  0: 'PROPOSED',
  1: 'APPROVED',
  2: 'ACTIVE',
  3: 'RESOLVING',
  4: 'DISPUTED',
  5: 'FINALIZED'
};

async function main() {
  console.log('🔍 Querying Markets from MarketFactory...\n');

  try {
    // Connect to BasedAI mainnet
    const provider = new ethers.JsonRpcProvider('https://mainnet.basedaibridge.com/rpc/');
    console.log('✅ Connected to BasedAI mainnet');

    // Get MarketFactory contract
    const marketFactoryAbi = [
      'function getAllMarkets() external view returns (address[] memory)',
      'function getMarketCount() external view returns (uint256)'
    ];

    const marketFactory = new ethers.Contract(
      MARKET_FACTORY_ADDRESS,
      marketFactoryAbi,
      provider
    );

    // Get all markets
    const allMarkets = await marketFactory.getAllMarkets();
    const marketCount = allMarkets.length;

    console.log(`📊 Total markets created: ${marketCount}\n`);

    if (marketCount === 0) {
      console.log('⚠️  No markets found');
      return;
    }

    // Get all markets
    console.log('📋 Fetching market details...\n');
    const markets = [];

    // Market ABI for querying individual markets
    const marketAbi = [
      'function question() external view returns (string memory)',
      'function currentState() external view returns (uint8)',
      'function resolutionTime() external view returns (uint256)',
      'function creator() external view returns (address)',
      'function totalVolume() external view returns (uint256)',
      'function getShareBalances(uint256) external view returns (uint256)',
      'function YES() external view returns (uint256)',
      'function NO() external view returns (uint256)'
    ];

    for (let i = 0; i < marketCount; i++) {
      try {
        const marketAddress = allMarkets[i];
        const market = new ethers.Contract(marketAddress, marketAbi, provider);

        // Query market details
        const [question, state, resolutionTime, creator] = await Promise.all([
          market.question().catch(() => 'Unknown'),
          market.currentState().catch(() => 0),
          market.resolutionTime().catch(() => 0n),
          market.creator().catch(() => '0x0000000000000000000000000000000000000000')
        ]);

        // Try to get balances for YES/NO
        let yesShares = 0n;
        let noShares = 0n;
        try {
          const YES = await market.YES();
          const NO = await market.NO();
          yesShares = await market.getShareBalances(YES);
          noShares = await market.getShareBalances(NO);
        } catch (e) {
          // Not all markets have this interface
        }

        const marketData = {
          id: i,
          address: marketAddress,
          question: question,
          state: Number(state),
          stateName: MarketState[Number(state)] || 'UNKNOWN',
          resolutionTime: Number(resolutionTime),
          creator: creator,
          yesShares: yesShares.toString(),
          noShares: noShares.toString()
        };

        markets.push(marketData);

        // Display market info
        console.log(`\n═══════════════════════════════════════════════════════`);
        console.log(`Market #${i}`);
        console.log(`═══════════════════════════════════════════════════════`);
        console.log(`Address:      ${marketAddress}`);
        console.log(`Question:     ${question}`);
        console.log(`State:        ${marketData.stateName} (${state})`);
        console.log(`Creator:      ${creator}`);

        if (resolutionTime > 0n) {
          const date = new Date(Number(resolutionTime) * 1000);
          console.log(`Resolution:   ${date.toISOString()}`);
        }

        if (yesShares > 0n || noShares > 0n) {
          console.log(`YES shares:   ${ethers.formatEther(yesShares)} BASED`);
          console.log(`NO shares:    ${ethers.formatEther(noShares)} BASED`);
        }

      } catch (error) {
        console.log(`\n⚠️  Market #${i}: Error fetching details`);
        console.log(`   ${error.message}`);
      }
    }

    // Summary
    console.log(`\n\n═══════════════════════════════════════════════════════`);
    console.log(`SUMMARY`);
    console.log(`═══════════════════════════════════════════════════════`);
    console.log(`Total Markets: ${marketCount}`);

    // Count by state
    const stateCounts = {};
    markets.forEach(m => {
      stateCounts[m.stateName] = (stateCounts[m.stateName] || 0) + 1;
    });

    console.log(`\nMarkets by State:`);
    Object.entries(stateCounts).forEach(([state, count]) => {
      console.log(`  ${state}: ${count}`);
    });

    // Find ACTIVE markets
    const activeMarkets = markets.filter(m => m.state === 2);
    if (activeMarkets.length > 0) {
      console.log(`\n✅ ACTIVE Markets (ready for E2E testing):`);
      activeMarkets.forEach(m => {
        console.log(`  • ${m.address}`);
        console.log(`    "${m.question}"`);
      });
    } else {
      console.log(`\n⚠️  No ACTIVE markets found`);
      console.log(`   Markets need to be in state 2 (ACTIVE) for trading tests`);
    }

    // Save to JSON file
    const outputPath = path.join(__dirname, '../test-results/market-query.json');
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(
      outputPath,
      JSON.stringify({
        timestamp: new Date().toISOString(),
        totalMarkets: Number(marketCount),
        markets,
        activeMarkets: activeMarkets.map(m => m.address)
      }, null, 2)
    );

    console.log(`\n💾 Results saved to: ${outputPath}`);

    // Recommendations for E2E testing
    console.log(`\n\n═══════════════════════════════════════════════════════`);
    console.log(`E2E TESTING RECOMMENDATIONS`);
    console.log(`═══════════════════════════════════════════════════════`);

    if (activeMarkets.length > 0) {
      console.log(`\n✅ Use this market for E2E tests:`);
      console.log(`   TEST_MARKET_ADDRESS=${activeMarkets[0].address}`);
      console.log(`   Question: "${activeMarkets[0].question}"`);
    } else {
      const approvedMarkets = markets.filter(m => m.state === 1);
      if (approvedMarkets.length > 0) {
        console.log(`\n⚙️  APPROVED markets found (need activation):`);
        approvedMarkets.forEach(m => {
          console.log(`   ${m.address} - "${m.question}"`);
        });
        console.log(`\n   To activate, call: market.changeMarketState(2)`);
      } else {
        console.log(`\n⚠️  No ACTIVE or APPROVED markets`);
        console.log(`   Options:`);
        console.log(`   1. Create new test market`);
        console.log(`   2. Approve & activate existing PROPOSED market`);
        console.log(`   3. Use existing market (tests will skip trading)`);
      }
    }

  } catch (error) {
    console.error('\n❌ Error querying markets:');
    console.error(error.message);
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
