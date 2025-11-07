import { defineChain } from 'viem'

/**
 * $BASED Chain Configuration
 *
 * CRITICAL: Chain ID is 32323 (verified from production VPS)
 * DO NOT change this value without verifying with the backend
 */
export const basedChain = defineChain({
  id: 32323,
  name: 'BasedAI',
  nativeCurrency: {
    name: 'BASED',
    symbol: 'BASED',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.basedai.network',
        'https://mainnet.basedaibridge.com/rpc/', // Fallback
      ],
    },
    public: {
      http: [
        process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.basedai.network',
        'https://mainnet.basedaibridge.com/rpc/', // Fallback
      ],
    },
  },
  blockExplorers: {
    default: {
      name: 'BasedAI Explorer',
      url: 'https://explorer.bf1337.org',
    },
  },
  testnet: false,
})
