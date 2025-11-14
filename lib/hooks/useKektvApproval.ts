import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { useEffect } from 'react'
import { KEKTECH_VOUCHERS } from '@/config/contracts/kektech-vouchers'
import { KEKTV_MARKETPLACE_ADDRESS } from '@/config/contracts/kektv-marketplace'

/**
 * Hook to manage ERC-1155 voucher approval for the marketplace
 *
 * ERC-1155 uses setApprovalForAll (no single token approval)
 * Once approved, marketplace can transfer all voucher types
 */
export function useKektvApproval() {
  const { address } = useAccount()
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  // Check if marketplace is already approved
  // 🐛 FIX: Disable cache to prevent flash bug
  const { data: isApproved, isLoading, refetch } = useReadContract({
    address: KEKTECH_VOUCHERS.address,
    abi: KEKTECH_VOUCHERS.abi,
    functionName: 'isApprovedForAll',
    args: address ? [address, KEKTV_MARKETPLACE_ADDRESS] : undefined,
    query: {
      enabled: !!address, // Only query when wallet connected
      staleTime: 0, // Always fetch fresh data (no stale cache)
      gcTime: 0, // Don't cache results (wagmi v2 uses gcTime instead of cacheTime)
    },
  })

  // 🐛 DEBUG: Log approval state changes
  useEffect(() => {
    if (address) {
      console.log('🔐 Approval Status Debug:', {
        userAddress: address,
        marketplaceAddress: KEKTV_MARKETPLACE_ADDRESS,
        isApprovedRaw: isApproved,
        isApprovedBoolean: Boolean(isApproved),
        isLoading,
      })
    }
  }, [address, isApproved, isLoading])

  /**
   * Approve marketplace to transfer all voucher types
   */
  const approveMarketplace = async () => {
    if (!address) throw new Error('Wallet not connected')

    try {
      const hash = await writeContractAsync({
        address: KEKTECH_VOUCHERS.address,
        abi: KEKTECH_VOUCHERS.abi,
        functionName: 'setApprovalForAll',
        args: [KEKTV_MARKETPLACE_ADDRESS, true],
      })

      return hash
    } catch (error) {
      throw error
    }
  }

  return {
    isApproved: Boolean(isApproved),
    isLoading, // 🐛 FIX: Export loading state for UI
    approveMarketplace,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
    refetch,
  }
}
