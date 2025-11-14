/**
 * KEKTECH 3.0 - Contract Addresses
 * BasedAI Mainnet (Chain ID: 32323)
 * Deployed: November 6, 2025
 *
 * All contracts are immutable and verified on BasedAI Explorer:
 * https://explorer.bf1337.org
 */

export const CHAIN_ID = 32323 as const;

export const CONTRACT_ADDRESSES = {
  // Core Registry - Version control for all contracts
  VersionedRegistry: "0x67F8F023f6cFAe44353d797D6e0B157F2579301A",

  // Configuration - All modifiable parameters
  ParameterStorage: "0x0FdcaCE9dEE78c70C92B243346cDf763A06fEdF8",

  // Access Control - Role-based permissions
  AccessControlManager: "0x4d1afBb8E50e17F24dCbB4Fc3197537be646315A",

  // Resolution - Market outcome determination
  ResolutionManager: "0x10daF33E321ED8977e369a36FcC6Beb3d3d106a0",

  // Rewards - Fee distribution and claiming
  RewardDistributor: "0x3D274362423847B53E43a27b9E835d668754C96B",

  // Factory - Market creation (uses EIP-1167 clones)
  MarketFactory: "0x3eaF643482Fe35d13DB812946E14F5345eb60d62",

  // Template - Clone template for all markets
  PredictionMarketTemplate: "0x1064f1FCeE5aA859468559eB9dC9564F0ef20111",

  // Registries - Bonding curves and market templates
  CurveRegistry: "0x5AcC0f00c0675975a2c4A54aBcC7826Bd229Ca70",
  MarketTemplateRegistry: "0x420687494Dad8da9d058e9399cD401Deca17f6bd",
} as const;

// Type-safe contract names
export type ContractName = keyof typeof CONTRACT_ADDRESSES;

// Helper to get contract address by name
export const getContractAddress = (name: ContractName): string => {
  return CONTRACT_ADDRESSES[name];
};

// All addresses as array (useful for validation)
export const ALL_CONTRACT_ADDRESSES = Object.values(CONTRACT_ADDRESSES);

// Validate an address is one of our deployed contracts
export const isKektechContract = (address: string): boolean => {
  return ALL_CONTRACT_ADDRESSES.includes(address as typeof ALL_CONTRACT_ADDRESSES[number]);
};

// Contract deployment info
export const DEPLOYMENT_INFO = {
  network: "BasedAI Mainnet",
  chainId: CHAIN_ID,
  deployedAt: "2025-11-06",
  deployer: "Hot Wallet", // Transfer to Vultisig after validation
  explorerUrl: "https://explorer.bf1337.org",
} as const;

// Get explorer URL for a contract
export const getExplorerUrl = (addressOrName: string | ContractName): string => {
  const address = addressOrName in CONTRACT_ADDRESSES
    ? getContractAddress(addressOrName as ContractName)
    : addressOrName;

  return `${DEPLOYMENT_INFO.explorerUrl}/address/${address}`;
};
