import { NextResponse } from 'next/server'

/**
 * Complete NFT Data API with Traits
 *
 * Security: Only returns minted NFTs from rankings API
 * Performance: Edge caching with stale-while-revalidate
 *
 * Flow:
 * 1. Fetch rankings (minted NFTs only)
 * 2. Batch fetch metadata for each NFT
 * 3. Return merged data with 5-minute cache
 */

export const runtime = 'edge'
export const revalidate = 300 // 5 minutes

interface NFTAttribute {
  trait_type: string
  value: string
}

interface NFTWithTraits {
  rank: number
  tokenId: string
  name: string
  rarityScore: number
  imageUrl: string
  attributes: NFTAttribute[]
}

// Batch fetch metadata with concurrency control
async function fetchMetadataBatch(tokenIds: string[], batchSize = 10): Promise<Map<string, NFTAttribute[]>> {
  const metadataMap = new Map<string, NFTAttribute[]>()

  // Process in batches to avoid overwhelming the API
  for (let i = 0; i < tokenIds.length; i += batchSize) {
    const batch = tokenIds.slice(i, i + batchSize)

    const batchPromises = batch.map(async (tokenId) => {
      try {
        const response = await fetch(
          `https://api.kektech.xyz/api/metadata/${tokenId}`,
          {
            cache: 'force-cache',
            next: { revalidate: 3600 } // Cache individual metadata for 1 hour
          }
        )

        if (response.ok) {
          const data = await response.json()
          if (data.attributes) {
            metadataMap.set(tokenId, data.attributes)
          }
        }
      } catch (error) {
        console.error(`Failed to fetch metadata for token ${tokenId}:`, error)
      }
    })

    await Promise.all(batchPromises)

    // Small delay between batches to be respectful to the API
    if (i + batchSize < tokenIds.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  return metadataMap
}

export async function GET() {
  try {
    // 1. Fetch rankings (minted NFTs only)
    const rankingsResponse = await fetch('https://api.kektech.xyz/rankings', {
      cache: 'no-cache' // Always get fresh minted list
    })

    if (!rankingsResponse.ok) {
      throw new Error('Failed to fetch rankings')
    }

    const { nfts } = await rankingsResponse.json()

    // 2. Extract token IDs for metadata fetching
    const tokenIds = nfts.map((nft: { tokenId: string }) => nft.tokenId)

    // 3. Batch fetch metadata
    const metadataMap = await fetchMetadataBatch(tokenIds)

    // 4. Merge rankings with metadata
    const nftsWithTraits: NFTWithTraits[] = nfts.map((nft: {
      rank: number
      tokenId: string
      name: string
      rarityScore: number
      imageUrl: string
    }) => ({
      ...nft,
      attributes: metadataMap.get(nft.tokenId) || []
    }))

    // 5. Return with cache headers
    return NextResponse.json(nftsWithTraits, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Total-NFTs': String(nftsWithTraits.length),
        'X-NFTs-With-Traits': String(nftsWithTraits.filter(n => n.attributes.length > 0).length)
      }
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch NFT data' },
      { status: 500 }
    )
  }
}