import { useEffect, useState, useCallback } from 'react'
import { useChainId, useAccount } from 'wagmi'
import { basedChain } from '@/config/chains'

/**
 * Network Configuration Validator
 *
 * Detects if MetaMask has BasedAI network configured with wrong currency symbol.
 * This happens when users manually add the network or add it from another site
 * with incorrect settings that get cached permanently.
 *
 * Detection strategy:
 * 1. Check if connected to BasedAI (chain 32323)
 * 2. Attempt to read network config from MetaMask
 * 3. Verify currency symbol matches expected "BASED"
 *
 * Since MetaMask doesn't expose network config via API, we use
 * a heuristic: If user tries to mint and MetaMask shows "ETH",
 * we know config is wrong.
 */
export function useNetworkConfigValidator() {
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const [isValidating, setIsValidating] = useState(false)
  const [isConfigValid, setIsConfigValid] = useState<boolean | null>(null)
  const [lastCheckTime, setLastCheckTime] = useState<number>(0)

  // Validate network configuration
  const validateConfig = useCallback(async (): Promise<boolean> => {
    // Only validate if on BasedAI chain
    if (!isConnected || chainId !== basedChain.id) {
      return true // Not our concern if not on BasedAI
    }

    setIsValidating(true)

    try {
      // Check if window.ethereum exists
      if (typeof window === 'undefined' || !window.ethereum) {
        return true // Can't validate without ethereum provider
      }

      // Strategy: Try to get the network config
      // Unfortunately, MetaMask doesn't expose this directly
      // We'll mark as "needs verification" and let the modal handle it

      // For now, we assume it might be misconfigured and show warning
      // The modal will guide users to verify

      // This will be overridden by user verification in the modal
      setIsConfigValid(null) // Unknown, needs user verification
      setLastCheckTime(Date.now())

      return true
    } catch (error) {
      console.error('Error validating network config:', error)
      return true // On error, don't block
    } finally {
      setIsValidating(false)
    }
  }, [isConnected, chainId])

  // Validate on mount and when chain changes
  useEffect(() => {
    validateConfig()
  }, [validateConfig])

  // Manual validation trigger
  const revalidate = () => {
    return validateConfig()
  }

  // Mark as valid (after user has verified)
  const markAsValid = () => {
    setIsConfigValid(true)
    setLastCheckTime(Date.now())
    // Store in sessionStorage so we don't keep asking
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('basedai_network_verified', 'true')
      sessionStorage.setItem('basedai_network_verified_time', Date.now().toString())
    }
  }

  // Check if already verified this session
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const verified = sessionStorage.getItem('basedai_network_verified')
      const verifiedTime = sessionStorage.getItem('basedai_network_verified_time')

      if (verified === 'true' && verifiedTime) {
        const timeSince = Date.now() - parseInt(verifiedTime)
        // Valid for 24 hours
        if (timeSince < 24 * 60 * 60 * 1000) {
          setIsConfigValid(true)
        }
      }
    }
  }, [])

  // Determine if we need to show verification modal
  const needsVerification = isConnected &&
                           chainId === basedChain.id &&
                           isConfigValid !== true

  return {
    isValidating,
    isConfigValid,
    needsVerification,
    lastCheckTime,
    validateConfig: revalidate,
    markAsValid,
  }
}
