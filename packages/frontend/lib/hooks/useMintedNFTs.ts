import { useState, useEffect } from 'react'
import { usePublicClient } from 'wagmi'
import { decodeEventLog, type Hash } from 'viem'

/**
 * Hook to fetch minted NFT data after successful mint transaction
 *
 * Workflow:
 * 1. Wait for transaction to be confirmed
 * 2. Parse transaction receipt for Transfer events
 * 3. Extract token IDs (where from = 0x000... = minted)
 * 4. Fetch NFT metadata from backend API
 * 5. Return array of minted NFTs with images
 */

interface MintedNFT {
  tokenId: string
  name: string
  imageUrl: string
  rank?: number
  rarityScore?: number
}

interface UseMintedNFTsResult {
  mintedNFTs: MintedNFT[]
  isLoading: boolean
  error: string | null
}

export function useMintedNFTs(
  hash: Hash | undefined,
  isConfirmed: boolean
): UseMintedNFTsResult {
  const publicClient = usePublicClient()
  const [mintedNFTs, setMintedNFTs] = useState<MintedNFT[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!hash || !isConfirmed || !publicClient) {
      return
    }

    let isMounted = true

    async function fetchMintedNFTs() {
      setIsLoading(true)
      setError(null)

      try {
        // 1. Get transaction receipt
        const receipt = await publicClient.getTransactionReceipt({ hash: hash! })

        // 2. Parse logs for Transfer events
        // Standard ERC721 Transfer event signature
        const TRANSFER_EVENT_SIGNATURE =
          '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'

        const transferLogs = receipt.logs.filter(
          (log) => log.topics[0] === TRANSFER_EVENT_SIGNATURE
        )

        // 3. Extract token IDs (from == 0x000... = minted)
        const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
        const tokenIds: string[] = []

        for (const log of transferLogs) {
          try {
            const decoded = decodeEventLog({
              abi: [
                {
                  type: 'event',
                  name: 'Transfer',
                  inputs: [
                    { name: 'from', type: 'address', indexed: true },
                    { name: 'to', type: 'address', indexed: true },
                    { name: 'tokenId', type: 'uint256', indexed: true },
                  ],
                },
              ],
              data: log.data,
              topics: log.topics,
            })

            // Check if this is a mint (from zero address)
            if (
              decoded.args.from.toLowerCase() === ZERO_ADDRESS.toLowerCase()
            ) {
              tokenIds.push(decoded.args.tokenId.toString())
            }
          } catch (err) {
            console.warn('Failed to decode transfer log:', err)
          }
        }

        if (tokenIds.length === 0) {
          throw new Error('No minted tokens found in transaction')
        }

        // 4. Fetch NFT metadata from backend (limit to first 3)
        const nftsToFetch = tokenIds.slice(0, 3)
        const fetchedNFTs: MintedNFT[] = []

        for (const tokenId of nftsToFetch) {
          try {
            const response = await fetch(`/api/nft/${tokenId}`)

            if (!response.ok) {
              throw new Error(`Failed to fetch NFT ${tokenId}`)
            }

            const data = await response.json()
            fetchedNFTs.push({
              tokenId,
              name: data.name || `KEKTECH #${tokenId}`,
              imageUrl: data.imageUrl || '',
              rank: data.rank,
              rarityScore: data.rarityScore,
            })
          } catch (err) {
            console.error(`Failed to fetch NFT ${tokenId}:`, err)
            // Add placeholder for failed fetches
            fetchedNFTs.push({
              tokenId,
              name: `KEKTECH #${tokenId}`,
              imageUrl: '', // Will show fallback in UI
            })
          }
        }

        if (isMounted) {
          setMintedNFTs(fetchedNFTs)
        }
      } catch (err) {
        console.error('Error fetching minted NFTs:', err)
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch NFTs')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchMintedNFTs()

    return () => {
      isMounted = false
    }
  }, [hash, isConfirmed, publicClient])

  return {
    mintedNFTs,
    isLoading,
    error,
  }
}
