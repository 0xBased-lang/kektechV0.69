'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * NFT Item from BasedAI Explorer API
 */
export interface NFTItem {
  id: string
  image_url: string | null
  animation_url: string | null
  metadata: {
    name?: string
    description?: string
    image_url?: string
    attributes?: Array<{
      trait_type: string
      value: string | number
    }>
  } | null
  token: {
    name: string
    symbol: string
    address: string  // ← FIXED: API returns "address", not "address_hash"
    type: string
  }
  token_type: string
  value: string
}

/**
 * useWalletNFTs Hook
 *
 * Fetches all NFTs owned by a wallet address from BasedAI Explorer API
 * with retry logic and enhanced error handling
 *
 * @param address - Wallet address to fetch NFTs for
 * @returns Object containing NFTs, loading state, error state, and retry function
 */
export function useWalletNFTs(address: string | undefined) {
  const [nfts, setNfts] = useState<NFTItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNFTs = useCallback(async (isRetry = false) => {
    if (!address) {
      setNfts([])
      setLoading(false)
      return
    }

    setLoading(true)
    if (!isRetry) {
      setError(null)
    }

    const maxRetries = 3
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Add timeout to prevent hanging requests
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

        const response = await fetch(
          `https://explorer.bf1337.org/api/v2/addresses/${address}/nft`,
          {
            signal: controller.signal,
            headers: {
              'Accept': 'application/json',
            },
          }
        )

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(
            `API Error: ${response.status} ${response.statusText}`
          )
        }

        const data = await response.json()

        // Validate response structure
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid API response format')
        }

        const items = data.items || []
        setNfts(items)
        setError(null)
        setLoading(false)
        return // Success - exit retry loop
      } catch (err) {
        lastError = err instanceof Error ? err : new Error('Unknown error occurred')
        console.error(`NFT fetch attempt ${attempt + 1}/${maxRetries + 1} failed:`, lastError)

        // If this isn't the last attempt, wait before retrying
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000) // Exponential backoff, max 5s
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    // All retries failed
    const errorMessage = lastError?.name === 'AbortError'
      ? 'Request timeout - Please check your connection and try again'
      : lastError?.message || 'Failed to fetch NFTs after multiple attempts'

    setError(errorMessage)
    setNfts([])
    setLoading(false)
  }, [address])

  // Manual retry function
  const retry = useCallback(() => {
    fetchNFTs(true)
  }, [fetchNFTs])

  useEffect(() => {
    fetchNFTs()
  }, [fetchNFTs])

  return { nfts, loading, error, retry }
}
