'use client'

import { useReadContract, useAccount } from 'wagmi'
import { KEKTV_MARKETPLACE_ADDRESS, KEKTV_MARKETPLACE_ABI } from '@/config/contracts/kektv-marketplace'

/**
 * useMarketplaceListing Hook
 * 
 * Checks if a specific token is currently listed on the marketplace
 * Used to detect conflicts when accepting offers
 * 
 * @param tokenId - The voucher token ID to check
 * @returns Listing details including amount, price, and active status
 */
export function useMarketplaceListing(tokenId: number | bigint | null) {
  const { address } = useAccount()

  const {
    data: listing,
    isLoading,
    refetch,
  } = useReadContract({
    address: KEKTV_MARKETPLACE_ADDRESS,
    abi: KEKTV_MARKETPLACE_ABI,
    functionName: 'listings',
    args: address && tokenId !== null ? [address, BigInt(tokenId)] : undefined,
    query: {
      enabled: !!address && tokenId !== null,
      refetchInterval: 5000, // Refresh every 5 seconds
    },
  })

  // Parse listing data from contract tuple
  const isListed = listing ? listing[2] === true && listing[0] > 0n : false
  const listingAmount = listing ? listing[0] : 0n
  const listingPrice = listing ? listing[1] : 0n

  return {
    isListed,
    listing: {
      amount: listingAmount,
      pricePerItem: listingPrice,
      active: isListed,
    },
    isLoading,
    refetch,
  }
}
