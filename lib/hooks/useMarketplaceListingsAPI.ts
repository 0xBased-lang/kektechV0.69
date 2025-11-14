import { useState, useEffect } from 'react'

export type VoucherListing = {
  seller: `0x${string}`
  tokenId: number
  voucherName: string
  voucherIcon: string
  rarity: string
  amount: bigint
  pricePerItem: bigint
  totalPrice: bigint
  blockNumber: bigint
  transactionHash: string
}

/**
 * Hook to fetch marketplace listings from API
 *
 * This replaces the old KNOWN_SELLERS approach by fetching from our API
 * which scans blockchain events automatically.
 *
 * Benefits:
 * - Finds ALL sellers automatically (no manual list)
 * - Fast (cached for 30s)
 * - Only 1 API call instead of 400 RPC calls
 *
 * Modes:
 * - If sellerAddress provided: Filters to show only that seller's listings
 * - If no sellerAddress: Shows ALL listings
 */
export function useMarketplaceListingsAPI(sellerAddress?: `0x${string}`) {
  const [listings, setListings] = useState<VoucherListing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchListings = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Fetch from API
        const response = await fetch('/api/marketplace/listings', {
          // Revalidate every 30 seconds
          next: { revalidate: 30 }
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch listings: ${response.statusText}`)
        }

        const data = await response.json()

        // Convert BigInt strings back to BigInt
        const parsedListings: VoucherListing[] = data.map((listing: {
          seller: string
          tokenId: number
          voucherName: string
          voucherIcon: string
          rarity: string
          amount: string
          pricePerItem: string
          totalPrice: string
          blockNumber: string
          transactionHash: string
        }) => ({
          ...listing,
          amount: BigInt(listing.amount),
          pricePerItem: BigInt(listing.pricePerItem),
          totalPrice: BigInt(listing.totalPrice),
          blockNumber: BigInt(listing.blockNumber),
        }))

        // Filter by seller if provided (for "Your Listings")
        const filteredListings = sellerAddress
          ? parsedListings.filter(l => l.seller.toLowerCase() === sellerAddress.toLowerCase())
          : parsedListings

        setListings(filteredListings)
        setIsLoading(false)
      } catch (err) {
        console.error('Failed to fetch marketplace listings:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        setIsLoading(false)
      }
    }

    fetchListings()

    // Refresh every 30 seconds
    const interval = setInterval(fetchListings, 30000)

    return () => clearInterval(interval)
  }, [sellerAddress])

  return {
    listings,
    isLoading,
    error,
    refetch: () => {
      setIsLoading(true)
    },
  }
}
