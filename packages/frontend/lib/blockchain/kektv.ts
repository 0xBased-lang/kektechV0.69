/**
 * KEKTV Blockchain Service
 * Interacts with KEKTV NFT contract on BASED Chain
 */

// BASED Chain Configuration
export const BASED_CHAIN_CONFIG = {
  chainId: 32323,
  chainIdHex: '0x7e43',
  name: 'BASED',
  rpcUrl: 'https://mainnet.basedaibridge.com/rpc',
  explorerUrl: 'https://explorer.bf1337.org',
  nativeCurrency: {
    name: 'BASED',
    symbol: 'BASED',
    decimals: 18
  }
}

// Contract Addresses
export const CONTRACTS = {
  KEKTECH: '0x40B6184b901334C0A88f528c1A0a1de7a77490f1',
  KEKTV: '0x7FEF981beE047227f848891c6C9F9dad11767a48'
}

// ERC-721 ABI will be used in future versions for more complex interactions
// For now, we use simple eth_call with encoded function data

export interface NFTListing {
  tokenId: number
  name: string
  image: string
  price: string
  priceInBased: number
  owner: string
  listed: boolean
}

export interface UserNFTHoldings {
  kektech: number
  kektv: number
}

/**
 * Get NFT balance for a wallet address
 */
export async function getNFTBalance(
  walletAddress: string,
  contractAddress: string
): Promise<number> {
  try {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('No ethereum provider found')
    }

    // Use eth_call to query balance
    const data = encodeFunctionData('balanceOf(address)', [walletAddress])

    const result = await window.ethereum.request({
      method: 'eth_call',
      params: [
        {
          to: contractAddress,
          data: data
        },
        'latest'
      ]
    })

    // Decode result (it's a uint256)
    return parseInt(result as string, 16)
  } catch (error) {
    console.error('Error fetching NFT balance:', error)
    return 0
  }
}

/**
 * Get user's NFT holdings for both KEKTECH and KEKTV
 */
export async function getUserNFTHoldings(
  walletAddress: string
): Promise<UserNFTHoldings> {
  try {
    const [kektechBalance, kektvBalance] = await Promise.all([
      getNFTBalance(walletAddress, CONTRACTS.KEKTECH),
      getNFTBalance(walletAddress, CONTRACTS.KEKTV)
    ])

    return {
      kektech: kektechBalance,
      kektv: kektvBalance
    }
  } catch (error) {
    console.error('Error fetching user holdings:', error)
    return { kektech: 0, kektv: 0 }
  }
}

/**
 * Fetch KEKTV listings from blockchain
 * Note: This is a simplified version - a real implementation would need:
 * - A marketplace contract with listing functions
 * - Or indexing events from the blockchain
 * - Or a backend API that tracks listings
 */
export async function getKEKTVListings(): Promise<NFTListing[]> {
  try {
    // For now, return mock data with BASED pricing
    // TODO: Implement real marketplace contract integration
    return [
      {
        tokenId: 1,
        name: 'KEKTV #001',
        image: '/images/kektv-placeholder.gif',
        price: '10 BASED',
        priceInBased: 10,
        owner: '0x0000000000000000000000000000000000000000',
        listed: true
      },
      {
        tokenId: 2,
        name: 'KEKTV #002',
        image: '/images/kektv-placeholder.gif',
        price: '15 BASED',
        priceInBased: 15,
        owner: '0x0000000000000000000000000000000000000000',
        listed: true
      },
      {
        tokenId: 3,
        name: 'KEKTV #003',
        image: '/images/kektv-placeholder.gif',
        price: '20 BASED',
        priceInBased: 20,
        owner: '0x0000000000000000000000000000000000000000',
        listed: true
      }
    ]
  } catch (error) {
    console.error('Error fetching KEKTV listings:', error)
    return []
  }
}

/**
 * Get KEKTV marketplace statistics
 */
export async function getKEKTVMarketplaceStats() {
  try {
    // TODO: Implement real stats from blockchain/marketplace contract
    return {
      totalListed: 9,
      floorPrice: 10,
      holders: 7,
      volume24h: 250
    }
  } catch (error) {
    console.error('Error fetching marketplace stats:', error)
    return {
      totalListed: 0,
      floorPrice: 0,
      holders: 0,
      volume24h: 0
    }
  }
}

/**
 * Helper function to encode function data for eth_call
 */
function encodeFunctionData(signature: string, params: unknown[]): string {
  // Simple function signature hashing (first 4 bytes of keccak256)
  const functionSelector = keccak256(signature).slice(0, 10)

  // For balanceOf, we need to encode the address parameter
  if (signature === 'balanceOf(address)' && params.length === 1) {
    const address = (params[0] as string).toLowerCase().replace('0x', '')
    // Pad address to 32 bytes (64 hex chars)
    const paddedAddress = address.padStart(64, '0')
    return functionSelector + paddedAddress
  }

  // For totalSupply(), just return the function selector (no params)
  if (signature === 'totalSupply()') {
    return functionSelector
  }

  return functionSelector
}

/**
 * Simple keccak256 hash (for function selectors)
 * In production, use a proper library like ethers.js
 */
function keccak256(text: string): string {
  // For now, return pre-computed hash for balanceOf and totalSupply
  // In production, use: import { keccak256 as keccak } from 'ethers'
  const precomputed: { [key: string]: string } = {
    'balanceOf(address)': '0x70a08231',
    'totalSupply()': '0x18160ddd'
  }

  return precomputed[text] || '0x00000000'
}

/**
 * Tier distribution interface
 */
export interface TierDistribution {
  tier: 'Mythic' | 'Legendary' | 'Epic' | 'Rare' | 'Common'
  minted: number
  total: number
  color: string
}

/**
 * Get tier distribution for KEKTECH NFTs
 * Shows how many NFTs are minted in each rarity tier
 */
export async function getTierDistribution(): Promise<TierDistribution[]> {
  try {
    // TODO: In production, query blockchain or API for actual minted counts
    // For now, use simulated data that will be dynamically updated

    // Get total minted from contract (totalSupply)
    const totalMinted = await getTotalSupply(CONTRACTS.KEKTECH)

    // Distribute minted NFTs across tiers based on rarity weights
    // This is a simplified calculation - actual implementation would
    // query metadata or trait data from blockchain
    const distribution: TierDistribution[] = [
      {
        tier: 'Mythic',
        minted: Math.floor(totalMinted * (13 / 4200)),
        total: 13,
        color: '#ff00ff'
      },
      {
        tier: 'Legendary',
        minted: Math.floor(totalMinted * (42 / 4200)),
        total: 42,
        color: '#ffd700'
      },
      {
        tier: 'Epic',
        minted: Math.floor(totalMinted * (195 / 4200)),
        total: 195,
        color: '#9d4edd'
      },
      {
        tier: 'Rare',
        minted: Math.floor(totalMinted * (670 / 4200)),
        total: 670,
        color: '#3fb8bd'
      },
      {
        tier: 'Common',
        minted: Math.floor(totalMinted * (3280 / 4200)),
        total: 3280,
        color: '#6c757d'
      }
    ]

    return distribution
  } catch (error) {
    console.error('Error fetching tier distribution:', error)
    // Return empty tiers on error
    return [
      { tier: 'Mythic', minted: 0, total: 13, color: '#ff00ff' },
      { tier: 'Legendary', minted: 0, total: 42, color: '#ffd700' },
      { tier: 'Epic', minted: 0, total: 195, color: '#9d4edd' },
      { tier: 'Rare', minted: 0, total: 670, color: '#3fb8bd' },
      { tier: 'Common', minted: 0, total: 3280, color: '#6c757d' }
    ]
  }
}

/**
 * Get total supply of NFTs from contract
 */
export async function getTotalSupply(contractAddress: string): Promise<number> {
  try {
    // Use eth_call to query totalSupply - works without wallet connection
    const data = encodeFunctionData('totalSupply()', [])

    // Create provider directly - no wallet needed for read operations
    const rpcUrl = BASED_CHAIN_CONFIG.rpcUrl

    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_call',
        params: [
          {
            to: contractAddress,
            data: data
          },
          'latest'
        ]
      })
    })

    const json = await response.json()

    if (json.result) {
      // Decode result (it's a uint256)
      return parseInt(json.result as string, 16)
    }

    // Fallback to 0 if no result
    return 0
  } catch (error) {
    console.error('Error fetching total supply:', error)
    return 0 // Return 0 on error to show accurate data
  }
}

// Type declaration for ethereum provider is handled globally