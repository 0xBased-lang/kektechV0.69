'use client'

import { useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useWalletNFTs } from '@/lib/hooks/useWalletNFTs'
import { useStaticMetadata } from '@/lib/hooks/useStaticMetadata'
import { KEKTECH_CONTRACT_ADDRESS } from '@/config/constants'

interface KektechNFTsOnlyProps {
  address: string
}

/**
 * KektechNFTsOnly Component
 *
 * Displays ONLY KEKTECH NFTs (filters out all other NFTs)
 */
export function KektechNFTsOnly({ address }: KektechNFTsOnlyProps) {
  const { nfts, loading, error, retry } = useWalletNFTs(address)
  const { data: staticMetadata, isLoading: metadataLoading } = useStaticMetadata()

  // Filter to show ONLY KEKTECH NFTs and merge with static metadata for images
  const kektechNFTs = useMemo(() => {
    const filteredNFTs = nfts.filter((nft) => {
      const nftAddress = nft?.token?.address
      if (!nftAddress || !KEKTECH_CONTRACT_ADDRESS) return false

      const isKektech = nftAddress.toLowerCase() === KEKTECH_CONTRACT_ADDRESS.toLowerCase()

      // Debug logging to diagnose categorization issue (ALWAYS ENABLED FOR DIAGNOSIS)
      console.log('✅ KEKTECH NFT Check:', {
        nftId: nft.id,
        nftName: nft.metadata?.name || nft.token?.name,
        nftAddress: nftAddress,
        kektechAddress: KEKTECH_CONTRACT_ADDRESS,
        nftAddressLower: nftAddress.toLowerCase(),
        kektechAddressLower: KEKTECH_CONTRACT_ADDRESS.toLowerCase(),
        isKektech,
        willShowInKektechSection: isKektech
      })

      return isKektech
    })

    // Merge with static metadata to get images
    return filteredNFTs.map(nft => {
      const staticNFT = staticMetadata?.find(s => s.tokenId === nft.id)

      return {
        ...nft,
        // Use static metadata image if available (fallback to API image)
        image_url: staticNFT?.imageUrl || nft.image_url,
        metadata: {
          ...nft.metadata,
          name: staticNFT?.name || nft.metadata?.name,
          image_url: staticNFT?.imageUrl || nft.metadata?.image_url,
          attributes: staticNFT?.attributes || nft.metadata?.attributes || []
        }
      }
    })
  }, [nfts, staticMetadata])

  // Loading state (wait for both API and metadata)
  if (loading || metadataLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#3fb8bd]"></div>
        <p className="mt-4 text-gray-400">Loading your 𝕂Ǝ𝕂TECH NFTs...</p>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-900 rounded-xl p-8 text-center max-w-2xl mx-auto">
        <div className="text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-bold text-red-100 mb-3">Failed to Load NFTs</h3>
        <p className="text-red-300 mb-6">{error}</p>
        <button
          onClick={retry}
          className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition font-fredoka"
        >
          🔄 Retry
        </button>
        <p className="text-xs text-gray-400 mt-4">
          Address: {address?.slice(0, 6)}...{address?.slice(-4)}
        </p>
      </div>
    )
  }

  // Empty state - No KEKTECH NFTs
  if (kektechNFTs.length === 0) {
    return (
      <div className="bg-gray-900/60 rounded-xl border border-gray-800 p-12 text-center max-w-2xl mx-auto">
        <div className="text-6xl mb-6">🐸</div>
        <h3 className="text-2xl font-bold text-white mb-4 font-fredoka">No 𝕂Ǝ𝕂TECH NFTs Found</h3>
        <p className="text-gray-400 mb-6">
          You don&apos;t have any 𝕂Ǝ𝕂TECH NFTs in your wallet yet. Start by minting one!
        </p>
        <Link
          href="/marketplace"
          className="inline-block px-8 py-3 rounded-xl bg-gradient-to-r from-[#3fb8bd] to-[#4ecca7] text-black font-bold hover:scale-105 transition font-fredoka"
        >
          Mint 𝕂Ǝ𝕂TECH NFTs
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* KEKTECH Collection */}
      <div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {kektechNFTs.map((nft) => (
            <Link
              key={nft.id}
              href={`/nft?id=${nft.id}`}
              className="bg-gray-900/60 rounded-xl border border-gray-800 hover:border-[#3fb8bd] transition overflow-hidden group cursor-pointer"
            >
              <div className="aspect-square relative bg-gray-800">
                {nft.image_url || nft.metadata?.image_url ? (
                  <Image
                    src={nft.image_url || nft.metadata?.image_url || ''}
                    alt={nft.metadata?.name || `NFT #${nft.id}`}
                    fill
                    className="object-cover group-hover:scale-105 transition"
                    unoptimized
                    onError={(e) => {
                      // Fallback to placeholder on image error
                      e.currentTarget.style.display = 'none'
                      const placeholder = e.currentTarget.nextElementSibling as HTMLElement
                      if (placeholder) placeholder.style.display = 'flex'
                    }}
                  />
                ) : null}
                <div className="flex items-center justify-center h-full text-4xl" style={{ display: nft.image_url || nft.metadata?.image_url ? 'none' : 'flex' }}>
                  🐸
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-bold text-[#3fb8bd] text-sm truncate">
                  {nft.metadata?.name || `#${nft.id}`}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Rewards Section */}
      <div className="bg-gradient-to-br from-[#4ecca7]/10 to-transparent rounded-2xl border border-[#4ecca7]/20 p-8">
        <h2 className="text-2xl font-bold text-[#4ecca7] mb-4 font-fredoka">
          🎁 Your Rewards
        </h2>
        <p className="text-gray-300 mb-6">
          You own {kektechNFTs.length} 𝕂Ǝ𝕂TECH NFT{kektechNFTs.length > 1 ? 's' : ''}!
          Earn daily rewards and exclusive benefits.
        </p>
        <Link
          href="/rewards"
          className="inline-block px-6 py-3 rounded-xl bg-[#4ecca7]/20 text-[#4ecca7] font-bold hover:bg-[#4ecca7]/30 transition font-fredoka"
        >
          View Rewards Details
        </Link>
      </div>
    </div>
  )
}
