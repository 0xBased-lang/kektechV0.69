/**
 * TECH Token Configuration (ERC-20)
 *
 * Main utility token for the KEKTECH ecosystem
 */

export const TECH_TOKEN_ADDRESS = '0x62E8D022CAf673906e62904f7BB5ae467082b546' as const

// Minimal ERC-20 ABI for reading balances and metadata
export const TECH_TOKEN_ABI = [
  // READ FUNCTIONS
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
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
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'name',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
  // WRITE FUNCTIONS (for future use)
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const

// Token Configuration
export const TECH_TOKEN = {
  // Identifiers
  id: 'tech-token' as const,
  name: 'TECH' as const,
  symbol: 'TECH' as const,
  description: 'Utility token for the KEKTECH ecosystem on BasedAI' as const,

  // Contract Details
  address: TECH_TOKEN_ADDRESS,
  abi: TECH_TOKEN_ABI,

  // Token Parameters (verified from explorer)
  decimals: 18,
  totalSupply: '133742069', // 133.7M TECH (before decimals)

  // Explorer Links
  explorerUrl: `https://explorer.bf1337.org/token/${TECH_TOKEN_ADDRESS}`,

  // UI Configuration
  theme: {
    primary: '#3fb8bd',
    gradient: 'from-cyan-500 to-blue-500',
  },

  // Feature Flags
  features: {
    transfer: true,
    swap: false, // Future: DEX integration
    stake: false, // Future: staking rewards
  },
} as const

// Export type for use in components
export type TechTokenConfig = typeof TECH_TOKEN
