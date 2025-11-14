import { useState, useEffect, useMemo } from 'react'
import { useAccount, usePublicClient, useReadContract } from 'wagmi'
import { KEKTV_MARKETPLACE_ADDRESS, KEKTV_MARKETPLACE_ABI } from '@/config/contracts/kektv-marketplace'
import { KEKTECH_VOUCHERS, VOUCHER_TYPES } from '@/config/contracts/kektech-vouchers'

export type VoucherListing = {
  seller: `0x${string}`
  tokenId: number
  voucherName: string
  voucherIcon: string
  rarity: string
  amount: bigint
  pricePerItem: bigint
  totalPrice: bigint
  active: boolean
}

// Known sellers list (temporary solution - will be replaced with event indexing)
const KNOWN_SELLERS: `0x${string}`[] = [
  '0xD90e78886b165d0a5497409528042Fc22bB33d2E', // Creator wallet
  // Add more seller addresses as they list items
]

/**
 * Hook to fetch KEKTV voucher marketplace listings
 *
 * Mode 1: Single Seller (when sellerAddress provided) - for "Your Listings"
 * Mode 2: All Sellers (when no sellerAddress) - for "Browse & Buy"
 *
 * Note: ERC-1155 marketplaces require seller address + tokenId for lookups
 * This temporary solution checks known sellers. Future: event indexing or backend API
 */
export function useKektvListings(sellerAddress?: `0x${string}`) {
  const publicClient = usePublicClient()
  const [listings, setListings] = useState<VoucherListing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // If seller address provided, check only that seller (for "Your Listings")
  // If not provided, check ALL known sellers (for "Browse & Buy")
  const targetAddresses = useMemo(
    () => (sellerAddress ? [sellerAddress] : KNOWN_SELLERS),
    [sellerAddress]
  )

  useEffect(() => {
    const fetchListings = async () => {
      if (!publicClient || targetAddresses.length === 0) {
        setListings([])
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        const activeListings: VoucherListing[] = []

        // Check all target addresses
        for (const sellerAddr of targetAddresses) {
          // Check all known voucher types (0-3) for each seller
          for (const voucher of VOUCHER_TYPES) {
            try {
              const listing = await publicClient.readContract({
                address: KEKTV_MARKETPLACE_ADDRESS,
                abi: KEKTV_MARKETPLACE_ABI,
                functionName: 'listings',
                args: [sellerAddr, BigInt(voucher.id)],
              })

              if (listing && Array.isArray(listing)) {
                // listings returns a tuple: [amount, pricePerItem, active]
                const [amount, pricePerItem, active] = listing as [bigint, bigint, boolean]

                if (active && amount > 0n && pricePerItem > 0n) {
                  activeListings.push({
                    seller: sellerAddr,
                    tokenId: voucher.id,
                    voucherName: voucher.name,
                    voucherIcon: voucher.icon,
                    rarity: voucher.rarity,
                    amount,
                    pricePerItem,
                    totalPrice: amount * pricePerItem,
                    active: true,
                  })
                }
              }
            } catch {
              // Skip vouchers that error (not listed)
              continue
            }
          }
        }

        setListings(activeListings)
        setIsLoading(false)
      } catch {
        setError('Failed to fetch marketplace listings')
        setIsLoading(false)
      }
    }

    fetchListings()
  }, [publicClient, targetAddresses])

  return {
    listings,
    isLoading,
    error,
    refetch: () => {
      setIsLoading(true)
    },
  }
}

/**
 * Hook to check user's voucher balances
 * Used to determine which vouchers they can list
 */
export function useUserVoucherBalances() {
  const { address } = useAccount()

  // Read balances for all voucher types
  const { data: balances, isLoading, error } = useReadContract({
    address: KEKTECH_VOUCHERS.address,
    abi: KEKTECH_VOUCHERS.abi,
    functionName: 'balanceOfBatch',
    args: address ? [
      [address, address, address, address],
      [0n, 1n, 2n, 3n],
    ] : undefined,
  })

  const vouchersWithBalances = VOUCHER_TYPES.map((voucher, index) => ({
    ...voucher,
    balance: balances ? balances[index] : 0n,
  }))

  return {
    vouchers: vouchersWithBalances,
    isLoading,
    error,
    hasVouchers: vouchersWithBalances.some(v => v.balance > 0n),
  }
}
