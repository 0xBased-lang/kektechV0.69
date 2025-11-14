'use client'

import { useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useWalletNFTs } from '@/lib/hooks/useWalletNFTs'
import { useStaticMetadata } from '@/lib/hooks/useStaticMetadata'
import { KEKTECH_CONTRACT_ADDRESS } from '@/config/constants'

interface NFTDashboardProps {
  address: string
}

/**
 * NFTDashboard Component
 *
 * Displays wallet NFTs with portfolio overview and collection breakdown
 */
export function NFTDashboard({ address }: NFTDashboardProps) {
  const { nfts, loading, error, retry } = useWalletNFTs(address)
  const { data: staticMetadata, isLoading: metadataLoading } = useStaticMetadata()

  // Separate KEKTECH NFTs from other NFTs and merge with static metadata
  const { kektechNFTs, otherNFTs } = useMemo(() => {
    const kektech = nfts.filter((nft) => {
      const nftAddress = nft?.token?.address
      if (!nftAddress || !KEKTECH_CONTRACT_ADDRESS) return false
      return nftAddress.toLowerCase() === KEKTECH_CONTRACT_ADDRESS.toLowerCase()
    })
    const others = nfts.filter((nft) => {
      const nftAddress = nft?.token?.address
      if (!nftAddress || !KEKTECH_CONTRACT_ADDRESS) return true
      return nftAddress.toLowerCase() !== KEKTECH_CONTRACT_ADDRESS.toLowerCase()
    })

    // Merge KEKTECH NFTs with static metadata for images
    const kektechWithImages = kektech.map(nft => {
      const staticNFT = staticMetadata?.find(s => s.tokenId === nft.id)

      return {
        ...nft,
        image_url: staticNFT?.imageUrl || nft.image_url,
        metadata: {
          ...nft.metadata,
          name: staticNFT?.name || nft.metadata?.name,
          image_url: staticNFT?.imageUrl || nft.metadata?.image_url,
          attributes: staticNFT?.attributes || nft.metadata?.attributes || []
        }
      }
    })

    return { kektechNFTs: kektechWithImages, otherNFTs: others }
  }, [nfts, staticMetadata])

  // Loading state (wait for both API and metadata)
  if (loading || metadataLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-kek-green"></div>
        <p className="mt-4 text-gray-400">Loading your NFTs...</p>
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

  // Empty state
  if (nfts.length === 0) {
    return (
      <div className="bg-gray-900/60 rounded-xl border border-gray-800 p-12 text-center max-w-2xl mx-auto">
        <div className="text-6xl mb-6">🎨</div>
        <h3 className="text-2xl font-bold text-white mb-4 font-fredoka">No NFTs Found</h3>
        <p className="text-gray-400 mb-6">
          You don&apos;t have any NFTs in your wallet yet. Start by minting a 𝕂Ǝ𝕂TECH NFT!
        </p>
        <Link
          href="/marketplace"
          className="inline-block px-8 py-3 rounded-xl bg-gradient-to-r from-kek-green to-[#4ecca7] text-black font-bold hover:scale-105 transition font-fredoka"
        >
          Mint 𝕂Ǝ𝕂TECH NFTs
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-12">
      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900/60 rounded-xl border border-gray-800 p-6 text-center">
          <div className="text-4xl mb-3">🎨</div>
          <div className="text-3xl font-bold text-white mb-2">{nfts.length}</div>
          <div className="text-sm text-gray-400">Total NFTs</div>
        </div>

        <div className="bg-gray-900/60 rounded-xl border border-gray-800 p-6 text-center">
          <div className="text-4xl mb-3">🐸</div>
          <div className="text-3xl font-bold text-kek-green mb-2">{kektechNFTs.length}</div>
          <div className="text-sm text-gray-400">𝕂Ǝ𝕂TECH NFTs</div>
        </div>

        <div className="bg-gray-900/60 rounded-xl border border-gray-800 p-6 text-center">
          <div className="text-4xl mb-3">🌐</div>
          <div className="text-3xl font-bold text-white mb-2">{otherNFTs.length}</div>
          <div className="text-sm text-gray-400">Other NFTs</div>
        </div>
      </div>

      {/* KEKTECH Collection */}
      {kektechNFTs.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-white mb-6 font-fredoka">
            Your 𝕂Ǝ𝕂TECH Collection ({kektechNFTs.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {kektechNFTs.map((nft) => (
              <div
                key={nft.id}
                className="bg-gray-900/60 rounded-xl border border-gray-800 hover:border-kek-green transition overflow-hidden group"
              >
                <div className="aspect-square relative bg-gray-800">
                  {nft.image_url || nft.metadata?.image_url ? (
                    <Image
                      src={nft.image_url || nft.metadata?.image_url || ''}
                      alt={nft.metadata?.name || `NFT #${nft.id}`}
                      fill
                      className="object-cover"
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
                  <h3 className="font-bold text-white text-sm truncate">
                    {nft.metadata?.name || `#${nft.id}`}
                  </h3>
                  <p className="text-xs text-gray-400">𝕂Ǝ𝕂TECH</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other NFTs */}
      {otherNFTs.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-white mb-6 font-fredoka">
            Your Other Base NFTs ({otherNFTs.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {otherNFTs.map((nft) => (
              <div
                key={nft.id}
                className="bg-gray-900/60 rounded-xl border border-gray-800 hover:border-gray-700 transition overflow-hidden"
              >
                <div className="aspect-square relative bg-gray-800">
                  {nft.image_url || nft.metadata?.image_url ? (
                    <Image
                      src={nft.image_url || nft.metadata?.image_url || ''}
                      alt={nft.metadata?.name || `NFT #${nft.id}`}
                      fill
                      className="object-cover"
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
                    🎨
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-bold text-white text-sm truncate">
                    {nft.metadata?.name || `#${nft.id}`}
                  </h3>
                  <p className="text-xs text-gray-400">{nft.token.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rewards Section */}
      {kektechNFTs.length > 0 && (
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
      )}
    </div>
  )
}
