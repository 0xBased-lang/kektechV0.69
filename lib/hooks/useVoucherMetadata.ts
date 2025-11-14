'use client'

import { useState, useEffect } from 'react'
import { usePublicClient } from 'wagmi'
import { KEKTECH_VOUCHERS } from '@/config/contracts'

/**
 * Voucher Metadata from ERC-1155 URI
 */
export interface VoucherMetadata {
  id: number
  name: string
  description: string
  image?: string
  animation_url?: string // GIF or video URL
  attributes?: Array<{
    trait_type: string
    value: string | number
  }>
}

/**
 * useVoucherMetadata Hook
 *
 * Fetches metadata for a specific voucher token ID from the contract URI
 * Handles IPFS URLs and returns proxied URLs for display
 *
 * @param tokenId - Token ID to fetch metadata for
 * @returns Object containing metadata, loading state, and error state
 */
export function useVoucherMetadata(tokenId: number) {
  const publicClient = usePublicClient()
  const [metadata, setMetadata] = useState<VoucherMetadata | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function fetchMetadata() {
      if (!publicClient) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Call contract's uri() function to get metadata URI
        const uri = await publicClient.readContract({
          address: KEKTECH_VOUCHERS.address,
          abi: KEKTECH_VOUCHERS.abi,
          functionName: 'uri',
          args: [BigInt(tokenId)],
        })

        if (!uri || typeof uri !== 'string') {
          throw new Error('No URI returned from contract')
        }

        // Convert IPFS URI to HTTP gateway URL if needed
        const metadataUrl = convertIpfsUrl(uri)

        // Fetch metadata JSON
        const response = await fetch(metadataUrl)
        if (!response.ok) {
          throw new Error(`Failed to fetch metadata: ${response.statusText}`)
        }

        const data = await response.json()

        // Process metadata
        const processedMetadata: VoucherMetadata = {
          id: tokenId,
          name: data.name || `Voucher #${tokenId}`,
          description: data.description || '',
          image: data.image ? convertIpfsUrl(data.image) : undefined,
          animation_url: data.animation_url ? convertIpfsUrl(data.animation_url) : undefined,
          attributes: data.attributes || [],
        }

        if (mounted) {
          setMetadata(processedMetadata)
          setLoading(false)
        }
      } catch (err) {
        console.error(`Error fetching metadata for voucher #${tokenId}:`, err)
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch metadata')
          setLoading(false)
        }
      }
    }

    fetchMetadata()

    return () => {
      mounted = false
    }
  }, [tokenId, publicClient])

  return { metadata, loading, error }
}

/**
 * useAllVoucherMetadata Hook
 *
 * Fetches metadata for all known voucher token IDs
 */
export function useAllVoucherMetadata() {
  const publicClient = usePublicClient()
  const [metadataMap, setMetadataMap] = useState<Record<number, VoucherMetadata>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function fetchAllMetadata() {
      if (!publicClient) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const results: Record<number, VoucherMetadata> = {}

        // Fetch metadata for all known token IDs in parallel
        await Promise.all(
          KEKTECH_VOUCHERS.knownTokenIds.map(async (tokenId) => {
            try {
              // Call contract's uri() function
              const uri = await publicClient.readContract({
                address: KEKTECH_VOUCHERS.address,
                abi: KEKTECH_VOUCHERS.abi,
                functionName: 'uri',
                args: [BigInt(tokenId)],
              })

              if (!uri || typeof uri !== 'string') {
                console.warn(`No URI for token ID ${tokenId}`)
                return
              }

              // Convert IPFS to HTTP if needed
              const metadataUrl = convertIpfsUrl(uri)

              // Fetch metadata JSON
              const response = await fetch(metadataUrl)
              if (!response.ok) {
                console.warn(`Failed to fetch metadata for token ${tokenId}:`, response.statusText)
                return
              }

              const data = await response.json()

              results[tokenId] = {
                id: tokenId,
                name: data.name || `Voucher #${tokenId}`,
                description: data.description || '',
                image: data.image ? convertIpfsUrl(data.image) : undefined,
                animation_url: data.animation_url ? convertIpfsUrl(data.animation_url) : undefined,
                attributes: data.attributes || [],
              }
            } catch (err) {
              console.error(`Error fetching metadata for voucher #${tokenId}:`, err)
            }
          })
        )

        if (mounted) {
          setMetadataMap(results)
          setLoading(false)
        }
      } catch (err) {
        console.error('Error fetching voucher metadata:', err)
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch metadata')
          setLoading(false)
        }
      }
    }

    fetchAllMetadata()

    return () => {
      mounted = false
    }
  }, [publicClient])

  return { metadataMap, loading, error }
}

/**
 * Convert IPFS URLs to HTTP gateway URLs
 */
function convertIpfsUrl(url: string): string {
  if (!url) return url

  // If it's already an HTTP URL, return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  // Handle ipfs:// protocol
  if (url.startsWith('ipfs://')) {
    const hash = url.replace('ipfs://', '')
    return `https://ipfs.io/ipfs/${hash}`
  }

  // Handle /ipfs/ path
  if (url.startsWith('/ipfs/')) {
    return `https://ipfs.io${url}`
  }

  // If it looks like an IPFS hash, add the gateway
  if (url.match(/^Qm[a-zA-Z0-9]{44}/) || url.match(/^ba[a-zA-Z0-9]{57}/)) {
    return `https://ipfs.io/ipfs/${url}`
  }

  // Otherwise return as-is
  return url
}
