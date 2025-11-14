import { useState, useEffect } from 'react'
import { KEKTECH_VOUCHERS_ADDRESS } from '@/config/contracts/kektech-vouchers'

/**
 * Voucher holder information from BasedAI explorer
 */
export interface VoucherHolder {
  address: string
  balance: bigint
}

/**
 * API response structure from BasedAI explorer
 */
interface HolderApiItem {
  address: {
    hash: string
  }
  value: string
}

/**
 * Hook to fetch live holder data for a specific voucher token ID
 * Uses BasedAI explorer API to get real-time ownership information
 *
 * @param tokenId - The voucher token ID to query (0-3)
 * @returns Holder list, total supply, and loading state
 */
export function useVoucherHolders(tokenId: number | null) {
  const [holders, setHolders] = useState<VoucherHolder[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (tokenId === null) {
      setHolders([])
      return
    }

    const fetchHolders = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Query BasedAI explorer API for token holders
        const response = await fetch(
          `https://explorer.bf1337.org/api/v2/tokens/${KEKTECH_VOUCHERS_ADDRESS}/instances/${tokenId}/holders?limit=100`
        )

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        const data = await response.json()

        // Transform API response to holder list
        const holderList: VoucherHolder[] = (data.items || []).map((item: HolderApiItem) => ({
          address: item.address.hash,
          balance: BigInt(item.value),
        }))

        // Sort by balance (highest first)
        holderList.sort((a, b) => Number(b.balance - a.balance))

        setHolders(holderList)
      } catch (err) {
        console.error('Failed to fetch voucher holders:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        setHolders([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchHolders()
  }, [tokenId])

  // Calculate total supply across all holders
  const totalSupply = holders.reduce((sum, h) => sum + h.balance, 0n)

  return {
    holders,
    totalSupply,
    holderCount: holders.length,
    isLoading,
    error,
    refetch: () => {
      setIsLoading(true)
    },
  }
}
