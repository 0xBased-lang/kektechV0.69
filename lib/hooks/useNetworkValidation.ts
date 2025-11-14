'use client'

import { useAccount, useChainId } from 'wagmi'
import { basedChain } from '@/config/chains'

/**
 * Network Validation Hook
 *
 * Provides utilities for checking if user is on the correct network.
 * Use this hook to conditionally disable features when on wrong network.
 *
 * @example
 * ```tsx
 * const { isCorrectNetwork, isWrongNetwork } = useNetworkValidation()
 *
 * <button disabled={isWrongNetwork}>
 *   Mint NFT
 * </button>
 * ```
 */

export function useNetworkValidation() {
  const { isConnected } = useAccount()
  const currentChainId = useChainId()

  const isCorrectNetwork = isConnected && currentChainId === basedChain.id
  const isWrongNetwork = isConnected && currentChainId !== basedChain.id

  return {
    /** User is connected and on BasedAI network */
    isCorrectNetwork,

    /** User is connected but on wrong network */
    isWrongNetwork,

    /** User is not connected at all */
    isDisconnected: !isConnected,

    /** Current chain ID (or undefined if not connected) */
    currentChainId: isConnected ? currentChainId : undefined,

    /** Expected chain ID (BasedAI) */
    expectedChainId: basedChain.id,

    /** Whether user can interact with the dApp */
    canInteract: isCorrectNetwork,
  }
}
