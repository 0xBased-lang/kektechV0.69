/**
 * NFT Detail Page
 * Complete detail view for a specific NFT including:
 * - Trading statistics
 * - Complete transaction history
 * - Visual timeline of all events
 */

'use client'

import Link from 'next/link'
import { NFTStatistics } from './NFTStatistics'
import { NFTTimeline } from './NFTTimeline'
import { useAllVoucherMetadata } from '@/lib/hooks/useVoucherMetadata'
import { VOUCHER_NAMES } from '@/config/contracts/kektv-offers'

interface NFTHistoryPageProps {
  tokenId: number
}

export function NFTHistoryPage({ tokenId }: NFTHistoryPageProps) {
  const { metadataMap } = useAllVoucherMetadata()
  const nftMetadata = metadataMap[tokenId]

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Back Button */}
      <div>
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 text-[#daa520] hover:text-white transition-colors font-fredoka"
        >
          <span>←</span>
          <span>Back to Marketplace</span>
        </Link>
      </div>

      {/* Header */}
      <div className="text-center space-y-4">
        <div className="space-y-2">
          <h1 className="text-5xl font-bold text-[#daa520] font-fredoka">
            𝕂Ǝ𝕂TV #{tokenId}
          </h1>
          <p className="text-2xl text-gray-300">{VOUCHER_NAMES[tokenId as keyof typeof VOUCHER_NAMES]}</p>
          {nftMetadata?.name && (
            <p className="text-sm text-gray-500">{nftMetadata.name}</p>
          )}
        </div>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Complete trading history and statistics for this NFT
        </p>
      </div>

      {/* Statistics Section */}
      <section>
        <NFTStatistics tokenId={tokenId} />
      </section>

      {/* Timeline Section */}
      <section>
        <NFTTimeline tokenId={tokenId} />
      </section>

      {/* Info footer */}
      <div className="text-center text-xs text-gray-500 py-4">
        <p>History data provided by BasedAI Explorer</p>
        <p>Updates every minute • Data since contract deployment</p>
      </div>
    </div>
  )
}
