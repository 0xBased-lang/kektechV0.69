import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSwitchChain,
} from 'wagmi'
import { KEKTV_MARKETPLACE_ADDRESS, KEKTV_MARKETPLACE_ABI } from '@/config/contracts/kektv-marketplace'
import { basedChain } from '@/config/chains'

/**
 * Hook for KEKTV Marketplace operations (ERC-1155 vouchers)
 *
 * Handles:
 * - Listing vouchers for sale (with quantity)
 * - Buying vouchers from listings
 * - Cancelling listings
 * - Auto network switching to BasedAI
 */
export function useKektvMarketplace() {
  const { address, chainId } = useAccount()
  const { switchChainAsync } = useSwitchChain()
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  /**
   * List KEKTV vouchers for sale
   * @param tokenId - Voucher type ID (0-3: Genesis, Silver, Gold, Platinum)
   * @param amount - Number of vouchers to list
   * @param pricePerItemString - Price per voucher in BASED (e.g., "1000")
   */
  const listVoucher = async (
    tokenId: bigint,
    amount: bigint,
    pricePerItemString: string
  ) => {
    if (!address) throw new Error('Wallet not connected')

    try {
      // Auto-switch to BasedAI Chain if on wrong network
      if (chainId !== basedChain.id) {
        await switchChainAsync({ chainId: basedChain.id })
      }

      // Convert price string to wei (1 BASED = 10^18 wei)
      const pricePerItem = BigInt(pricePerItemString) * BigInt(10 ** 18)

      // List the voucher
      const hash = await writeContractAsync({
        address: KEKTV_MARKETPLACE_ADDRESS,
        abi: KEKTV_MARKETPLACE_ABI,
        functionName: 'listVoucher',
        args: [tokenId, amount, pricePerItem],
        gas: 500000n, // Fixed gas limit to avoid RPC estimation issues
      })

      return hash
    } catch (error) {
      throw error
    }
  }

  /**
   * Buy KEKTV vouchers from a listing
   * @param seller - Address of the seller
   * @param tokenId - Voucher type ID
   * @param amount - Number of vouchers to buy
   * @param totalPrice - Total price in wei (pricePerItem × amount, WITHOUT fee)
   */
  const buyVoucher = async (
    seller: `0x${string}`,
    tokenId: bigint,
    amount: bigint,
    totalPrice: bigint
  ) => {
    if (!address) throw new Error('Wallet not connected')

    try {
      // Auto-switch to BasedAI Chain if on wrong network
      if (chainId !== basedChain.id) {
        await switchChainAsync({ chainId: basedChain.id })
      }

      // 🔧 IMPORTANT: Buyer pays ONLY the listing price!
      // Contract deducts 2.5% fee FROM THE SELLER's proceeds
      // Example: 1000 BASED listing
      //   - Buyer pays: 1000 BASED
      //   - Seller receives: 975 BASED (1000 - 2.5%)
      //   - Platform receives: 25 BASED (2.5% fee)
      const platformFee = (totalPrice * 250n) / 10000n // 2.5%
      const sellerReceives = totalPrice - platformFee

      console.log('💰 Buy Calculation:', {
        buyerPays: (totalPrice / BigInt(10 ** 18)).toString() + ' BASED',
        sellerReceives: (sellerReceives / BigInt(10 ** 18)).toString() + ' BASED',
        platformFee: (platformFee / BigInt(10 ** 18)).toString() + ' BASED',
      })

      // Buy the voucher - buyer pays ONLY listing price
      // Fee is deducted from seller's proceeds by the contract
      const hash = await writeContractAsync({
        address: KEKTV_MARKETPLACE_ADDRESS,
        abi: KEKTV_MARKETPLACE_ABI,
        functionName: 'buyVoucher',
        args: [seller, tokenId, amount],
        value: totalPrice, // ✅ Buyer pays ONLY listing price (fee deducted from seller!)
        gas: 500000n, // Increased gas limit to handle complex operations
      })

      return hash
    } catch (error) {
      throw error
    }
  }

  /**
   * Cancel a voucher listing
   * @param tokenId - Voucher type ID to cancel
   */
  const cancelListing = async (tokenId: bigint) => {
    if (!address) throw new Error('Wallet not connected')

    try {
      // Auto-switch to BasedAI Chain if on wrong network
      if (chainId !== basedChain.id) {
        await switchChainAsync({ chainId: basedChain.id })
      }

      // Cancel the listing
      const hash = await writeContractAsync({
        address: KEKTV_MARKETPLACE_ADDRESS,
        abi: KEKTV_MARKETPLACE_ABI,
        functionName: 'cancelListing',
        args: [tokenId],
        gas: 200000n, // Fixed gas limit for cancel transactions
      })

      return hash
    } catch (error) {
      throw error
    }
  }

  return {
    listVoucher,
    buyVoucher,
    cancelListing,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  }
}
