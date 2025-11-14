import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId, useSwitchChain } from 'wagmi'
import { KEKTECH_MAIN } from '@/config/contracts'
import { basedChain } from '@/config/chains'

/**
 * Custom hook for minting KEKTECH NFTs
 *
 * Handles the complete minting flow:
 * - Transaction preparation
 * - Contract interaction
 * - Transaction confirmation
 * - Error handling
 */
export function useMint() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChainAsync } = useSwitchChain()
  const [mintAmount, setMintAmount] = useState(1)

  // Write contract hook
  const {
    writeContract,
    data: hash,
    isPending: isWritePending,
    error: writeError,
  } = useWriteContract()

  // Wait for transaction receipt
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash,
  })

  /**
   * Execute mint transaction
   */
  const mint = async () => {
    if (!isConnected || !address) {
      throw new Error('Please connect your wallet first')
    }

    if (mintAmount < 1 || mintAmount > KEKTECH_MAIN.maxMintPerTx) {
      throw new Error(
        `Mint amount must be between 1 and ${KEKTECH_MAIN.maxMintPerTx}`
      )
    }

    try {
      // Auto-switch to BasedAI Chain if on wrong network
      if (chainId !== basedChain.id) {
        console.log(`Switching from chain ${chainId} to BasedAI chain ${basedChain.id}`)
        await switchChainAsync({ chainId: basedChain.id })
      }

      // Calculate total cost (using reference price)
      const totalCost = BigInt(mintAmount) * KEKTECH_MAIN.referenceMintPrice

      // Execute mint transaction with explicit chain ID
      writeContract({
        address: KEKTECH_MAIN.address,
        abi: KEKTECH_MAIN.abi,
        functionName: 'mint',
        args: [BigInt(mintAmount)],
        value: totalCost,
        chainId: basedChain.id,
      })
    } catch (error) {
      console.error('Mint error:', error)
      throw error
    }
  }

  return {
    // State
    mintAmount,
    setMintAmount,
    isConnected,
    address,

    // Transaction status
    isWritePending,
    isConfirming,
    isConfirmed,
    hash,

    // Errors
    error: writeError || confirmError,

    // Actions
    mint,

    // Helpers
    maxMintPerTx: KEKTECH_MAIN.maxMintPerTx,
  }
}
