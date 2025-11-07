import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { useEffect } from 'react'
import { KEKTECH_VOUCHERS } from '@/config/contracts/kektech-vouchers'
import { KEKTV_OFFERS_ADDRESS } from '@/config/contracts/kektv-offers'

/**
 * Hook to manage ERC-1155 voucher approval for the OFFERS contract
 *
 * This is separate from useKektvApproval which is for the marketplace!
 * The offers contract needs approval to transfer vouchers when accepting offers.
 *
 * ERC-1155 uses setApprovalForAll (no single token approval)
 * Once approved, offers contract can transfer all voucher types
 */
export function useKektvOffersApproval() {
  const { address } = useAccount()
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  // Check if offers contract is already approved
  const { data: isApproved, isLoading, refetch } = useReadContract({
    address: KEKTECH_VOUCHERS.address,
    abi: KEKTECH_VOUCHERS.abi,
    functionName: 'isApprovedForAll',
    args: address ? [address, KEKTV_OFFERS_ADDRESS] : undefined,
    query: {
      enabled: !!address, // Only query when wallet connected
      staleTime: 0, // Always fetch fresh data (no stale cache)
      gcTime: 0, // Don't cache results (wagmi v2 uses gcTime instead of cacheTime)
    },
  })

  // DEBUG: Log approval state changes
  useEffect(() => {
    if (address) {
      console.log('🔐 Offers Contract Approval Status:', {
        userAddress: address,
        offersContractAddress: KEKTV_OFFERS_ADDRESS,
        isApprovedRaw: isApproved,
        isApprovedBoolean: Boolean(isApproved),
        isLoading,
      })
    }
  }, [address, isApproved, isLoading])

  /**
   * Approve offers contract to transfer all voucher types
   * Required before accepting offers!
   */
  const approveOffersContract = async () => {
    if (!address) throw new Error('Wallet not connected')

    try {
      const hash = await writeContractAsync({
        address: KEKTECH_VOUCHERS.address,
        abi: KEKTECH_VOUCHERS.abi,
        functionName: 'setApprovalForAll',
        args: [KEKTV_OFFERS_ADDRESS, true],
      })

      return hash
    } catch (error) {
      throw error
    }
  }

  return {
    isApproved: Boolean(isApproved),
    isLoading,
    approveOffersContract,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
    refetch,
  }
}
