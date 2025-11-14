/**
 * KEKTECH Smart Contract Configuration
 *
 * CRITICAL: These values are verified from production
 * DO NOT modify without consulting documentation
 */

// === Contract Addresses ===

// KEKTECH Main NFT Collection (ERC-721)
export const KEKTECH_CONTRACT_ADDRESS =
  '0x40B6184b901334C0A88f528c1A0a1de7a77490f1' as const

// TECH Token (ERC-20)
export const TECH_TOKEN_ADDRESS =
  '0x62E8D022CAf673906e62904f7BB5ae467082b546' as const

// KEKTECH Vouchers (ERC-1155)
export const KEKTECH_VOUCHERS_ADDRESS =
  '0x7FEF981beE047227f848891c6C9F9dad11767a48' as const

// === Chain Configuration ===
export const CHAIN_ID = 32323 as const // BasedAI Chain

// === NFT Collection Parameters ===
export const MAX_SUPPLY = 4200 as const
export const MAX_MINT_PER_TX = 50 as const

// === Backend API Endpoints ===
export const METADATA_API_URL = 'https://kektech.xyz/api/metadata' as const
export const RANKING_API_URL = 'https://api.kektech.xyz' as const
export const IMAGE_API_URL = 'https://kektech.xyz/api/image' as const

// === Block Explorer ===
export const EXPLORER_URL = 'https://explorer.bf1337.org' as const
export const EXPLORER_API_URL = 'https://explorer.bf1337.org/api/v2' as const

// === RPC Endpoint ===
export const RPC_URL = 'https://mainnet.basedaibridge.com/rpc/' as const
