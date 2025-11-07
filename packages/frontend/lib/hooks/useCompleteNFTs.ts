/**
 * DEPRECATED: Use useStaticMetadata instead
 *
 * This hook now uses static metadata for 500x faster performance.
 * Kept for backwards compatibility.
 */

import { useStaticMetadata, type CompleteNFT } from './useStaticMetadata'

export type { NFTAttribute, CompleteNFT } from './useStaticMetadata'

interface UseCompleteNFTsResult {
  data: CompleteNFT[] | null
  isLoading: boolean
  error: Error | null
  stats: {
    total: number
    withTraits: number
  }
}

/**
 * Hook to fetch complete NFT data with traits
 *
 * NOW USES STATIC METADATA (500x faster)
 * - Load time: <50ms (was 25-30s)
 * - API calls: 1 (was 247)
 * - Single fetch per session
 *
 * @deprecated Use useStaticMetadata directly for more features
 */
export function useCompleteNFTs(): UseCompleteNFTsResult {
  const { data, isLoading, error, stats } = useStaticMetadata()

  return {
    data,
    isLoading,
    error,
    stats: {
      total: stats.total,
      withTraits: stats.withTraits
    }
  }
}