/**
 * useActiveOfferCount Hook
 *
 * Counts only ACTIVE offers from a list of offer IDs
 * Fixes the bug where counter shows "2 offers" but only 1 card displays
 * (because inactive offers are included in the count)
 */

import { useState, useEffect } from 'react'
import { useReadContracts } from 'wagmi'
import type { Abi } from 'viem'
import { KEKTV_OFFERS_ADDRESS, KEKTV_OFFERS_ABI } from '@/config/contracts/kektv-offers'

export function useActiveOfferCount(offerIds: bigint[]) {
  const [activeCount, setActiveCount] = useState(0)

  // Batch-fetch all offer details efficiently using multicall
  const { data: offersData, isLoading } = useReadContracts({
    contracts: offerIds.map(id => ({
      address: KEKTV_OFFERS_ADDRESS,
      abi: KEKTV_OFFERS_ABI as Abi,
      functionName: 'getOffer',
      args: [id],
    })),
    query: {
      enabled: offerIds.length > 0,
    },
  })

  useEffect(() => {
    if (!offersData || isLoading) {
      setActiveCount(0)
      return
    }

    // Count how many offers are active
    let count = 0
    for (const result of offersData) {
      if (result.status === 'success' && result.result) {
        // Parse offer struct (can be object or array depending on wagmi version)
        const offer = result.result as unknown
        const offerAsObject = offer as Record<string, unknown>
        const offerAsArray = offer as unknown[]

        // Check if offer.active is true (handle both object and array formats)
        const isActive = offerAsObject.active !== undefined
          ? (offerAsObject.active as boolean)
          : (offerAsArray[7] as boolean)

        if (isActive) {
          count++
        }
      }
    }

    setActiveCount(count)
  }, [offersData, isLoading])

  return {
    activeCount,
    isLoading,
  }
}
