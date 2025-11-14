import { NextRequest, NextResponse } from 'next/server'

/**
 * Individual NFT Data API - Simplified Direct Backend Call
 *
 * Security: Backend enforces minted-only NFTs (checks blockchain totalSupply)
 * Performance: Single API call, 60-second cache
 * Architecture: Frontend proxies to backend (single source of truth)
 *
 * This endpoint serves the NFT detail page with complete metadata
 */

export const runtime = 'edge'

interface NFTAttribute {
  trait_type: string
  value: string
  rarity?: number
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  const { tokenId } = await params

  try {
    // Direct call to backend - it handles ALL logic:
    // - Checks blockchain totalSupply (only minted NFTs allowed)
    // - Loads metadata from files
    // - Adds ranking data
    // - Returns combined response OR 404 for unminted NFTs
    const response = await fetch(
      `https://api.kektech.xyz/api/nft/${tokenId}`,
      {
        next: { revalidate: 60 }, // Refresh every minute
      }
    )

    // Backend returns 404 for unminted NFTs - pass it through
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: 'NFT not found or not yet minted'
      }))
      return NextResponse.json(errorData, { status: response.status })
    }

    // Get data from backend (already includes rank, metadata, etc.)
    const nftData = await response.json()

    // Add rarity percentages to attributes
    const attributes = nftData.attributes?.map((attr: NFTAttribute) => ({
      ...attr,
      rarity: calculateRarity(attr.value, attr.trait_type)
    })) || []

    // Build response with frontend-specific structure
    const nftComplete = {
      tokenId: nftData.tokenId,
      name: nftData.name,
      rarityScore: nftData.rarityScore,
      rank: nftData.rank,
      imageUrl: `https://api.kektech.xyz/api/image/${tokenId}`,
      description: nftData.description,
      attributes,
      metadata: {
        name: nftData.name,
        description: nftData.description,
        image: nftData.image,
        attributes
      }
    }

    return NextResponse.json(nftComplete, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'X-Token-Id': tokenId,
      }
    })

  } catch (error) {
    console.error('Frontend API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch NFT data' },
      { status: 500 }
    )
  }
}

// Helper function to calculate rarity percentages
function calculateRarity(value: string, _traitType: string): number {
  // This is a placeholder - in production you'd calculate from actual distribution
  const rarityMap: Record<string, number> = {
    'psychedelic': 1.45,
    'rare_diablo': 0.21,
    'kekius': 0.71,
    'maximus': 0.52,
    // Add more mappings based on your trait distribution
  }

  return rarityMap[value.toLowerCase()] || 10.0 // Default to 10% if not found
}