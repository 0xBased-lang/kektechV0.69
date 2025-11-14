/**
 * KEKTECH 3.0 - Contract Integration
 * Main entry point for interacting with BasedAI mainnet contracts
 */

import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, ContractName, CHAIN_ID } from './addresses';
import { ABIS, ABIName } from './abis';

// Re-export for convenience
export { CONTRACT_ADDRESSES, CHAIN_ID } from './addresses';
export { ABIS } from './abis';
export type { ContractName } from './addresses';
export type { ABIName } from './abis';
export { getExplorerUrl } from './addresses';

/**
 * Create a contract instance (read-only)
 * @param name Contract name
 * @param provider Ethers provider (optional, uses default RPC if not provided)
 */
export function getContract(
  name: ContractName,
  provider?: ethers.Provider
): ethers.Contract {
  const address = CONTRACT_ADDRESSES[name];

  // Map contract names to ABI names (handle aliases)
  const abiName: ABIName = name === 'MarketFactory'
    ? 'MarketFactory'
    : name as ABIName;

  const abi = ABIS[abiName];

  // Use provided provider or create default
  const contractProvider = provider || new ethers.JsonRpcProvider(
    process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.basedai.com'
  );

  return new ethers.Contract(address, abi, contractProvider);
}

/**
 * Create a contract instance with signer (for write operations)
 * @param name Contract name
 * @param signer Ethers signer
 */
export function getContractWithSigner(
  name: ContractName,
  signer: ethers.Signer
): ethers.Contract {
  const address = CONTRACT_ADDRESSES[name];

  const abiName: ABIName = name === 'MarketFactory'
    ? 'MarketFactory'
    : name as ABIName;

  const abi = ABIS[abiName];

  return new ethers.Contract(address, abi, signer);
}

/**
 * Create a PredictionMarket contract instance at a specific address
 * (Used for interacting with market clones)
 * @param marketAddress Address of the cloned market
 * @param providerOrSigner Provider or Signer
 */
export function getPredictionMarket(
  marketAddress: string,
  providerOrSigner: ethers.Provider | ethers.Signer
): ethers.Contract {
  const abi = ABIS.PredictionMarket;
  return new ethers.Contract(marketAddress, abi, providerOrSigner);
}

/**
 * Get all contracts as an object (read-only)
 * @param provider Ethers provider (optional)
 */
export function getAllContracts(provider?: ethers.Provider) {
  return {
    versionedRegistry: getContract('VersionedRegistry', provider),
    parameterStorage: getContract('ParameterStorage', provider),
    accessControlManager: getContract('AccessControlManager', provider),
    resolutionManager: getContract('ResolutionManager', provider),
    rewardDistributor: getContract('RewardDistributor', provider),
    marketFactory: getContract('MarketFactory', provider),
    predictionMarketTemplate: getContract('PredictionMarketTemplate', provider),
    curveRegistry: getContract('CurveRegistry', provider),
    marketTemplateRegistry: getContract('MarketTemplateRegistry', provider),
  };
}

/**
 * Validate that we're on the correct network
 * @param provider Ethers provider
 * @throws Error if wrong network
 */
export async function validateNetwork(provider: ethers.Provider): Promise<void> {
  const network = await provider.getNetwork();
  if (Number(network.chainId) !== CHAIN_ID) {
    throw new Error(
      `Wrong network! Expected BasedAI Mainnet (${CHAIN_ID}), got ${network.chainId}`
    );
  }
}

/**
 * Check if an address is a valid Ethereum address
 */
export function isValidAddress(address: string): boolean {
  return ethers.isAddress(address);
}

/**
 * Format an address for display (0x1234...5678)
 */
export function formatAddress(address: string, chars: number = 4): string {
  if (!isValidAddress(address)) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}
