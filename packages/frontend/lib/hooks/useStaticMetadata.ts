import { useState, useEffect } from 'react'

/**
 * NFT Attribute Interface
 */
export interface NFTAttribute {
  trait_type: string
  value: string
}

/**
 * Complete NFT with Traits
 */
export interface CompleteNFT {
  rank: number
  tokenId: string
  name: string
  rarityScore: number
  imageUrl: string
  attributes: NFTAttribute[]
}

/**
 * Trait Statistics
 */
export interface TraitStats {
  [category: string]: {
    [value: string]: {
      count: number
      percentage: string
    }
  }
}

/**
 * Static Metadata Response
 */
export interface StaticMetadata {
  generated: string
  totalSupply: number
  nfts: CompleteNFT[]
  traitStats: TraitStats
}

/**
 * Hook Result Interface
 */
interface UseStaticMetadataResult {
  data: CompleteNFT[] | null
  traitStats: TraitStats | null
  isLoading: boolean
  error: Error | null
  stats: {
    total: number
    withTraits: number
    generated: string | null
  }
}

/**
 * useStaticMetadata Hook
 *
 * Loads pre-generated metadata from static JSON file.
 *
 * Benefits:
 *   - 500x faster than API calls (<50ms vs 25-30s)
 *   - Single fetch per session (cached in memory)
 *   - No API rate limiting concerns
 *   - Instant trait filtering
 *
 * Usage:
 *   const { data, traitStats, isLoading, error, stats } = useStaticMetadata()
 */
export function useStaticMetadata(): UseStaticMetadataResult {
  const [data, setData] = useState<CompleteNFT[] | null>(null)
  const [traitStats, setTraitStats] = useState<TraitStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    withTraits: 0,
    generated: null as string | null
  })

  useEffect(() => {
    let isCancelled = false

    const loadMetadata = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Check session storage for cached data (persist across page reloads)
        const cacheKey = 'kektech-static-metadata'
        const cacheTimeKey = 'kektech-static-metadata-time'
        const cachedData = sessionStorage.getItem(cacheKey)
        const cachedTime = sessionStorage.getItem(cacheTimeKey)

        // Cache is valid for entire session
        if (cachedData && cachedTime) {
          try {
            const parsed: StaticMetadata = JSON.parse(cachedData)

            if (!isCancelled) {
              setData(parsed.nfts)
              setTraitStats(parsed.traitStats)
              setStats({
                total: parsed.nfts.length,
                withTraits: parsed.nfts.filter(n => n.attributes.length > 0).length,
                generated: parsed.generated
              })
              setIsLoading(false)
              return
            }
          } catch {
            // Cache corrupted, fetch fresh data
            console.warn('Cache corrupted, fetching fresh data')
            sessionStorage.removeItem(cacheKey)
            sessionStorage.removeItem(cacheTimeKey)
          }
        }

        // Fetch from static JSON file (included in build)
        const response = await fetch('/data/minted-metadata.json', {
          cache: 'force-cache' // Browser caches this file
        })

        if (!response.ok) {
          throw new Error(`Failed to load metadata: ${response.statusText}`)
        }

        const metadata: StaticMetadata = await response.json()

        if (!isCancelled) {
          // Store in session storage
          sessionStorage.setItem(cacheKey, JSON.stringify(metadata))
          sessionStorage.setItem(cacheTimeKey, String(Date.now()))

          setData(metadata.nfts)
          setTraitStats(metadata.traitStats)
          setStats({
            total: metadata.nfts.length,
            withTraits: metadata.nfts.filter(n => n.attributes.length > 0).length,
            generated: metadata.generated
          })
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Failed to load static metadata:', err)
          setError(
            err instanceof Error
              ? err
              : new Error('Failed to load metadata')
          )
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    loadMetadata()

    return () => {
      isCancelled = true
    }
  }, [])

  return { data, traitStats, isLoading, error, stats }
}

/**
 * Get single NFT by token ID with dynamic fallback
 *
 * HYBRID SYSTEM:
 * 1. First tries static file (fast, <50ms)
 * 2. If not found → Falls back to live API (for new mints)
 * 3. Ensures ALL NFTs work (old + newly minted)
 *
 * @param tokenId - Token ID to search for
 * @returns CompleteNFT or null if not found
 */
export function useStaticNFT(tokenId: string): {
  nft: CompleteNFT | null
  isLoading: boolean
  error: Error | null
  traitStats: TraitStats | null
} {
  const { data, traitStats, isLoading: staticLoading, error: staticError } = useStaticMetadata()
  const [dynamicNft, setDynamicNft] = useState<CompleteNFT | null>(null)
  const [dynamicLoading, setDynamicLoading] = useState(false)
  const [dynamicError, setDynamicError] = useState<Error | null>(null)

  // Try static file first
  const staticNft = data?.find(n => n.tokenId === tokenId) || null

  // If not found in static file AND static file finished loading, try live API
  useEffect(() => {
    if (staticLoading || staticNft || !tokenId || !data) {
      return // Still loading static, or already found, or no data
    }

    // NFT not found in static file - fetch from live API
    const fetchDynamic = async () => {
      setDynamicLoading(true)
      setDynamicError(null)

      try {
        const response = await fetch(`/api/nft/${tokenId}`)

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(`NFT #${tokenId} not found or not yet minted`)
          }
          throw new Error(`Failed to fetch NFT: ${response.statusText}`)
        }

        const nftData: CompleteNFT = await response.json()
        setDynamicNft(nftData)
      } catch (err) {
        console.error(`Failed to fetch dynamic NFT ${tokenId}:`, err)
        setDynamicError(
          err instanceof Error ? err : new Error('Failed to fetch NFT')
        )
      } finally {
        setDynamicLoading(false)
      }
    }

    fetchDynamic()
  }, [tokenId, staticLoading, staticNft, data])

  // Return static NFT if found, otherwise dynamic NFT
  const nft = staticNft || dynamicNft
  const isLoading = staticLoading || dynamicLoading
  const error = staticError || dynamicError

  return { nft, isLoading, error, traitStats }
}
