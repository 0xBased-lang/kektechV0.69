'use client'

import Image from 'next/image'
import Link from 'next/link'
import { RankingNFT } from '@/lib/api/kektech-rankings'

interface NFTCardProps {
  nft: RankingNFT
}

/**
 * NFTCard Component
 *
 * Displays a single NFT with:
 * - NFT image from API
 * - Token ID and name
 * - Global ranking position
 * - Rarity score
 * - Clickable to navigate to detail page
 */
export function NFTCard({ nft }: NFTCardProps) {
  return (
    <Link
      href={`/nft?id=${nft.tokenId}`}
      className="group block overflow-hidden rounded-lg border border-[#3fb8bd]/20 bg-gray-900 transition-all hover:border-[#3fb8bd]/50 hover:shadow-lg hover:shadow-[#3fb8bd]/20 dark:border-[#3fb8bd]/20 dark:bg-gray-900"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-800 dark:bg-gray-800">
        <Image
          src={nft.imageUrl}
          alt={nft.name}
          fill
          className="object-cover transition-transform group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          unoptimized
        />

        {/* Ranking Badge */}
        <div className="absolute right-2 top-2 rounded-full bg-gradient-to-r from-[#3fb8bd] to-[#4ecca7] px-3 py-1 text-xs font-semibold text-black shadow-lg">
          Rank #{nft.rank}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-fredoka mb-2 text-lg font-bold text-white dark:text-white">{nft.name}</h3>

        {/* Token ID */}
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="text-gray-400 dark:text-gray-400">Token ID:</span>
          <span className="font-semibold text-[#4ecca7] dark:text-[#4ecca7]">
            #{nft.tokenId}
          </span>
        </div>

        {/* Rarity Score */}
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="text-gray-400 dark:text-gray-400">Rarity Score:</span>
          <span className="font-semibold text-[#a855f7] dark:text-[#a855f7]">
            {nft.rarityScore.toFixed(2)}
          </span>
        </div>
      </div>
    </Link>
  )
}
