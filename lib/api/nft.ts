import { METADATA_API_URL, IMAGE_API_URL, RANKING_API_URL } from '@/config/constants'

/**
 * NFT Metadata Type
 */
export interface NFTMetadata {
  tokenId: number
  name: string
  description: string
  image: string
  attributes: Array<{
    trait_type: string
    value: string | number
  }>
  rarity?: {
    score: number
    rank: number
  }
}

/**
 * API Response Types
 */
export interface NFTListResponse {
  nfts: NFTMetadata[]
  total: number
  page: number
  limit: number
}

/**
 * Fetch all NFTs with pagination
 */
export async function fetchNFTs(page = 1, limit = 12): Promise<NFTListResponse> {
  try {
    const response = await fetch(`${METADATA_API_URL}?page=${page}&limit=${limit}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch NFTs: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching NFTs:', error)
    throw error
  }
}

/**
 * Fetch single NFT by token ID
 */
export async function fetchNFT(tokenId: number): Promise<NFTMetadata> {
  try {
    const response = await fetch(`${METADATA_API_URL}/${tokenId}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch NFT #${tokenId}: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error(`Error fetching NFT #${tokenId}:`, error)
    throw error
  }
}

/**
 * Fetch NFT image URL
 */
export function getNFTImageURL(tokenId: number): string {
  return `${IMAGE_API_URL}/${tokenId}`
}

/**
 * Fetch NFT ranking/leaderboard
 */
export async function fetchRanking() {
  try {
    const response = await fetch(RANKING_API_URL)

    if (!response.ok) {
      throw new Error(`Failed to fetch ranking: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching ranking:', error)
    throw error
  }
}

/**
 * Mock data for development (when API is unavailable)
 */
export function getMockNFTs(count = 12): NFTMetadata[] {
  return Array.from({ length: count }, (_, i) => ({
    tokenId: i + 1,
    name: `KEKTECH #${i + 1}`,
    description: 'A unique KEKTECH NFT on the $BASED Chain',
    image: `https://via.placeholder.com/400?text=KEKTECH+%23${i + 1}`,
    attributes: [
      { trait_type: 'Background', value: ['Blue', 'Green', 'Red', 'Purple'][i % 4] },
      { trait_type: 'Body', value: ['Robot', 'Alien', 'Human', 'Cyborg'][i % 4] },
      { trait_type: 'Eyes', value: ['Laser', 'Normal', 'Glowing', '3D'][i % 4] },
      { trait_type: 'Accessory', value: ['Hat', 'Glasses', 'Necklace', 'None'][i % 4] },
    ],
    rarity: {
      score: Math.random() * 100,
      rank: i + 1,
    },
  }))
}
