const { ethers } = require('hardhat');

async function checkMarketState(marketAddress) {
  const market = await ethers.getContractAt('PredictionMarket', marketAddress);
  
  try {
    const state = await market.currentState();
    const stateNames = ['PROPOSED', 'APPROVED', 'ACTIVE', 'RESOLVING', 'DISPUTED', 'FINALIZED'];
    console.log('Market ' + marketAddress + ':');
    console.log('  State: ' + state + ' (' + stateNames[state] + ')');
    
    const isResolved = await market.isResolved();
    console.log('  Is Resolved: ' + isResolved);
    
    const resolutionTime = await market.resolutionTime();
    const resDate = new Date(Number(resolutionTime) * 1000);
    const nowDate = new Date();
    console.log('  Resolution Time: ' + resDate.toISOString());
    console.log('  Current Time: ' + nowDate.toISOString());
    
    return state;
  } catch (error) {
    console.error('Error checking market ' + marketAddress + ':', error.message);
    return null;
  }
}

async function main() {
  console.log('Checking market states...\n');
  
  // First failed transaction market
  await checkMarketState('0x3B69aD439BA54B85BE5743C645eEfD18d0857EBe');
  console.log('');
  
  // Second failed transaction market
  await checkMarketState('0x593c6A47d51644A54115e60aCf0Bd8bbd371e449');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
