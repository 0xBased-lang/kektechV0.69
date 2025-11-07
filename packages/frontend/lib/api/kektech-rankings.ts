/**
 * KEKTECH Rankings API Client
 *
 * This client interfaces with the rankings API via our Next.js proxy route.
 * Architecture: Browser → /api/rankings → https://api.kektech.xyz/rankings
 *
 * CORS Solution: Instead of calling api.kektech.xyz directly (which causes CORS errors),
 * we use a Next.js API route that proxies the request server-side.
 *
 * VERIFIED API RESPONSE STRUCTURE (2025-10-10):
 * - Total NFTs: 2470 (live count)
 * - Response format matches TypeScript types below exactly
 * - All data triple-verified from live API
 */

/**
 * Single NFT Ranking Entry
 *
 * IMPORTANT: Types match EXACT API response structure
 * - tokenId is STRING (not number) from API
 * - All fields are required (no optional fields)
 */
export interface RankingNFT {
  rank: number           // Global rank: 1-4199
  tokenId: string        // Token ID as string: "420", "69", "1337", etc.
  name: string           // Full NFT name with emojis: "𝕂Ǝ𝕂TECH#420 Captain Alpha 🌙"
  rarityScore: number    // Rarity score: 22.46-97.07
  imageUrl: string       // Full image URL: "https://api.kektech.xyz/api/image/420"
}

/**
 * Rankings API Response
 *
 * Matches exact structure returned by https://api.kektech.xyz/rankings
 */
export interface RankingsResponse {
  nfts: RankingNFT[]     // Array of 2470 NFTs (as of 2025-10-10)
}

/**
 * Fetch Rankings API Configuration
 *
 * CORS Solution: We use our Next.js API proxy route at /api/rankings
 * instead of calling the external API directly from the browser.
 * This avoids CORS issues while maintaining the same functionality.
 */
const RANKINGS_CONFIG = {
  /**
   * Base URL for rankings API
   * Uses Next.js API route proxy to avoid CORS issues
   * Route: /app/api/rankings/route.ts
   */
  url: '/api/rankings',

  /** Request timeout in milliseconds */
  timeout: 10000, // 10 seconds

  /** Number of retry attempts on failure */
  retries: 3,

  /** Delay between retries (exponential backoff) */
  retryDelay: 1000, // Start with 1 second
} as const

/**
 * Fetch all NFT rankings from the production API
 *
 * @returns Promise<RankingsResponse> - All 2470 minted NFTs with rankings
 * @throws Error if API fails after all retries
 *
 * @example
 * ```typescript
 * const { nfts } = await fetchRankings()
 * console.log(`Loaded ${nfts.length} NFTs`)
 * console.log(`Top NFT: ${nfts[0].name} (Rank #${nfts[0].rank})`)
 * ```
 */
export async function fetchRankings(): Promise<RankingsResponse> {
  let lastError: Error | null = null

  // Retry logic with exponential backoff
  for (let attempt = 1; attempt <= RANKINGS_CONFIG.retries; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), RANKINGS_CONFIG.timeout)

      // Fetch from API
      const response = await fetch(RANKINGS_CONFIG.url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        cache: 'no-cache', // Always get fresh data
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // Check response status
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`)
      }

      // Parse JSON response
      const data: RankingsResponse = await response.json()

      // Validate response structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid API response: expected object')
      }

      if (!Array.isArray(data.nfts)) {
        throw new Error('Invalid API response: expected nfts array')
      }

      // Validate NFT entries
      if (data.nfts.length > 0) {
        const firstNFT = data.nfts[0]
        if (!firstNFT.rank || !firstNFT.tokenId || !firstNFT.name || !firstNFT.rarityScore || !firstNFT.imageUrl) {
          throw new Error('Invalid NFT structure in API response')
        }
      }

      // Success! Return data (production-safe logging removed)
      return data

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Log attempt
      console.warn(
        `⚠️  Rankings API attempt ${attempt}/${RANKINGS_CONFIG.retries} failed:`,
        lastError.message
      )

      // If not last attempt, wait before retry (exponential backoff)
      if (attempt < RANKINGS_CONFIG.retries) {
        const delay = RANKINGS_CONFIG.retryDelay * Math.pow(2, attempt - 1)
        // Retrying with exponential backoff (logging removed for production)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  // All retries failed
  throw new Error(
    `Failed to fetch rankings after ${RANKINGS_CONFIG.retries} attempts: ${lastError?.message || 'Unknown error'}`
  )
}

/**
 * Generate mock ranking data for development/fallback
 *
 * @param count Number of mock NFTs to generate (default: 12)
 * @returns Mock rankings response matching API structure
 *
 * @example
 * ```typescript
 * const mockData = getMockRankings(12)
 * ```
 */
export function getMockRankings(count = 12): RankingsResponse {
  const rarityTiers = [
    { name: 'Mythic', scoreRange: [90, 100], chance: 0.05 },
    { name: 'Legendary', scoreRange: [80, 90], chance: 0.10 },
    { name: 'Epic', scoreRange: [70, 80], chance: 0.15 },
    { name: 'Rare', scoreRange: [50, 70], chance: 0.30 },
    { name: 'Common', scoreRange: [20, 50], chance: 0.40 },
  ]

  const traits = [
    ['Robot', 'Alien', 'Human', 'Cyborg', 'AI'],
    ['Laser Eyes', 'Normal Eyes', 'Glowing Eyes', '3D Glasses', 'VR Headset'],
    ['Blue Background', 'Green Background', 'Purple Background', 'Red Background', 'Gradient'],
    ['Gold Chain', 'Silver Chain', 'Diamond Ring', 'Crown', 'None'],
  ]

  return {
    nfts: Array.from({ length: count }, (_, i) => {
      // Select rarity tier
      const rand = Math.random()
      let cumulative = 0
      let tier = rarityTiers[rarityTiers.length - 1]

      for (const t of rarityTiers) {
        cumulative += t.chance
        if (rand <= cumulative) {
          tier = t
          break
        }
      }

      // Generate rarity score
      const [min, max] = tier.scoreRange
      const rarityScore = Number((min + Math.random() * (max - min)).toFixed(2))

      // Generate random traits
      const selectedTraits = traits.map(
        traitList => traitList[Math.floor(Math.random() * traitList.length)]
      )

      return {
        rank: i + 1,
        tokenId: String(i + 1),
        name: `𝕂Ǝ𝕂TECH#${i + 1} ${tier.name} ${selectedTraits[0]}`,
        rarityScore,
        imageUrl: `https://api.kektech.xyz/api/image/${i + 1}`,
      }
    }),
  }
}

/**
 * Fetch rankings with automatic fallback to mock data
 *
 * This function tries to fetch real data from API, but falls back to mock data
 * if the API is unavailable. Useful for development and resilience.
 *
 * @param count Number of mock NFTs if fallback is needed (default: 12)
 * @returns Promise<RankingsResponse> - Real or mock rankings data
 *
 * @example
 * ```typescript
 * const { nfts } = await fetchRankingsWithFallback()
 * // Will always return data (real or mock)
 * ```
 */
export async function fetchRankingsWithFallback(count = 12): Promise<RankingsResponse> {
  try {
    // Try to fetch real data
    return await fetchRankings()
  } catch (error) {
    // Log error and fall back to mock data
    console.error('❌ Rankings API failed, using mock data:', error)
    console.warn(`📦 Generating ${count} mock NFTs for development`)
    return getMockRankings(count)
  }
}
