import { parseEther } from 'viem'
import {
  KEKTECH_CONTRACT_ADDRESS,
  MAX_SUPPLY,
  MAX_MINT_PER_TX,
  METADATA_API_URL,
  RANKING_API_URL,
  IMAGE_API_URL,
} from '../constants'

/**
 * KEKTECH Main Collection Configuration
 *
 * This is the single source of truth for the main KEKTECH collection
 */

// Minimal ABI - Only the functions we need for the frontend
export const KEKTECH_MAIN_ABI = [
  // READ FUNCTIONS
  {
    name: 'saleIsActive',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'tokenPrice',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'totalSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'MAX_SUPPLY',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'MAX_MINT_PER_TX',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  // WRITE FUNCTION
  {
    name: 'mint',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{ name: 'quantity', type: 'uint256' }],
    outputs: [],
  },
] as const

// Collection Configuration
export const KEKTECH_MAIN = {
  // Identifiers
  id: 'kektech-main' as const,
  name: 'KEKTECH' as const,
  symbol: 'KEKTECH' as const,
  description: 'The original KEKTECH NFT collection on BasedAI' as const,

  // Contract Details
  address: KEKTECH_CONTRACT_ADDRESS,
  abi: KEKTECH_MAIN_ABI,

  // Supply Configuration (from constants, but can be verified on-chain)
  maxSupply: MAX_SUPPLY,
  maxMintPerTx: MAX_MINT_PER_TX,

  // Mint Price (read from contract, this is just the known value for reference)
  // Actual price should always be read from tokenPrice() function
  referenceMintPrice: parseEther('18369'), // 18369 $BASED

  // API Endpoints
  metadataAPI: METADATA_API_URL,
  rankingAPI: RANKING_API_URL,
  imageAPI: IMAGE_API_URL,

  // UI Configuration
  theme: {
    primary: '#00ff00',
    accent: '#ff00ff',
  },

  // Feature Flags
  features: {
    minting: true,
    gallery: true,
    trading: false, // Future: marketplace integration
  },
} as const

// Export type for use in components
export type CollectionConfig = typeof KEKTECH_MAIN
