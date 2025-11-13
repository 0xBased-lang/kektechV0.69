/**
 * KEKTECH 3.0 - Contract Configuration
 * Contract addresses, ABIs, and ethers.js instances
 */

import { ethers } from 'ethers';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const RPC_HTTP_URL = process.env.RPC_HTTP_URL;
const CHAIN_ID = parseInt(process.env.CHAIN_ID || '32323');
const MARKET_FACTORY_ADDRESS = process.env.MARKET_FACTORY_ADDRESS;
const PREDICTION_MARKET_TEMPLATE = process.env.PREDICTION_MARKET_TEMPLATE;

if (!RPC_HTTP_URL) {
  throw new Error('RPC_HTTP_URL not set in environment');
}
if (!MARKET_FACTORY_ADDRESS) {
  throw new Error('MARKET_FACTORY_ADDRESS not set in environment');
}

// Create JSON-RPC provider
export const provider = new ethers.JsonRpcProvider(RPC_HTTP_URL, {
  chainId: CHAIN_ID,
  name: 'BasedAI Mainnet',
});

// Load contract ABIs
const abisDir = path.join(process.cwd(), 'shared/abis');
const marketFactoryAbiPath = path.join(abisDir, 'MarketFactory.json');
const predictionMarketAbiPath = path.join(abisDir, 'PredictionMarket.json');

const marketFactoryAbi = JSON.parse(
  readFileSync(marketFactoryAbiPath, 'utf-8')
).abi;
const predictionMarketAbi = JSON.parse(
  readFileSync(predictionMarketAbiPath, 'utf-8')
).abi;

// Create contract instances
export const marketFactory = new ethers.Contract(
  MARKET_FACTORY_ADDRESS,
  marketFactoryAbi,
  provider
);

// Helper: Get PredictionMarket contract instance for a specific market
export function getPredictionMarketContract(marketAddress: string) {
  return new ethers.Contract(
    marketAddress,
    predictionMarketAbi,
    provider
  );
}

// Contract addresses
export const addresses = {
  marketFactory: MARKET_FACTORY_ADDRESS,
  predictionMarketTemplate: PREDICTION_MARKET_TEMPLATE,
};

// Event signatures for filtering
export const eventSignatures = {
  // MarketFactory events
  MarketCreated: 'MarketCreated(address,address,string,string,uint256)',

  // PredictionMarket events
  BetPlaced: 'BetPlaced(address,uint8,uint256,uint256)',
  BetResolved: 'BetResolved(address,uint8,uint256)',
  MarketResolved: 'MarketResolved(uint8,uint256)',
  StateTransition: 'StateTransition(uint8,uint8)',
  MarketCancelled: 'MarketCancelled()',
};

// Log initialization
logger.info('Contracts configured', {
  rpcUrl: RPC_HTTP_URL,
  chainId: CHAIN_ID,
  marketFactory: MARKET_FACTORY_ADDRESS,
});

// Test provider connection
provider.getBlockNumber()
  .then((blockNumber) => {
    logger.info('RPC provider connected', {
      currentBlock: blockNumber,
    });
  })
  .catch((error) => {
    logger.error('Failed to connect to RPC provider', {
      error: error.message,
      rpcUrl: RPC_HTTP_URL,
    });
  });

export default {
  provider,
  marketFactory,
  getPredictionMarketContract,
  addresses,
  eventSignatures,
};
