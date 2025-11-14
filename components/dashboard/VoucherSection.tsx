'use client'

import Link from 'next/link'
import Image from 'next/image'
import type { VoucherBalance } from '@/lib/hooks/useVoucherBalance'
import { KEKTECH_VOUCHERS } from '@/config/contracts'
import { useAllVoucherMetadata } from '@/lib/hooks/useVoucherMetadata'

interface VoucherSectionProps {
  vouchers: VoucherBalance[]
  ownedVouchers: VoucherBalance[]
  totalVouchers: number
  isLoading: boolean
  explorerUrl: string
}

/**
 * VoucherSection Component
 *
 * Displays ERC-1155 voucher collection with balances
 */
export function VoucherSection({
  vouchers,
  ownedVouchers,
  totalVouchers,
  isLoading,
  explorerUrl,
}: VoucherSectionProps) {
  // Fetch metadata for all vouchers (includes GIF URLs)
  const { metadataMap, loading: metadataLoading } = useAllVoucherMetadata()

  if (isLoading || metadataLoading) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-48 bg-gray-800 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-900/60 rounded-xl border border-gray-800 p-6 animate-pulse"
            >
              <div className="h-12 w-12 bg-gray-800 rounded-lg mb-3"></div>
              <div className="h-6 w-32 bg-gray-800 rounded mb-2"></div>
              <div className="h-4 w-full bg-gray-800 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // If no vouchers at all, show empty state
  if (totalVouchers === 0) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#daa520] mb-6 font-fredoka flex items-center gap-2">
          Your 𝕂Ǝ𝕂TECH Vouchers
          <span className="text-gray-500 text-lg">(0)</span>
        </h2>

        <div className="bg-gray-900/60 rounded-xl border border-gray-800 p-12 text-center">
          <div className="text-6xl mb-6">🎫</div>
          <h3 className="text-xl font-bold text-white mb-4 font-fredoka">
            No Vouchers Found
          </h3>
          <p className="text-gray-400 mb-6">
            You don&apos;t have any 𝕂Ǝ𝕂TECH vouchers yet. Vouchers grant exclusive
            benefits and rewards!
          </p>
          <Link
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 rounded-xl bg-[#daa520]/20 text-[#daa520] font-bold hover:bg-[#daa520]/30 transition font-fredoka"
          >
            Learn More
          </Link>
        </div>
      </div>
    )
  }

  // Get rarity color gradient
  const getRarityGradient = (rarity: string) => {
    return (
      KEKTECH_VOUCHERS.rarityColors[rarity as keyof typeof KEKTECH_VOUCHERS.rarityColors] ||
      'from-gray-500 to-gray-600'
    )
  }

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#daa520] font-fredoka flex items-center gap-2">
          Your 𝕂Ǝ𝕂TECH Vouchers
          <span className="text-[#daa520]/70 text-lg">({totalVouchers})</span>
        </h2>
        <Link
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-xl bg-[#daa520]/20 text-[#daa520] text-sm font-bold hover:bg-[#daa520]/30 transition"
        >
          View Contract
        </Link>
      </div>

      {/* Voucher Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        {vouchers
          .filter((voucher) => voucher.id !== 0) // Exclude token ID 0 (test token)
          .map((voucher) => {
          const owned = voucher.balanceNumber > 0
          const gradient = getRarityGradient(voucher.rarity)
          const metadata = metadataMap[voucher.id]

          // Prefer animation_url (GIF/video) over static image
          const mediaUrl = metadata?.animation_url || metadata?.image || voucher.imageUrl

          return (
            <div
              key={voucher.id}
              className={`rounded-xl border p-6 transition ${
                owned
                  ? 'bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-500/30 hover:border-yellow-500/50'
                  : 'bg-gray-900/30 border-gray-800/50 opacity-50'
              }`}
            >
              {/* Voucher Image & Badge */}
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                {/* Large Image */}
                {mediaUrl ? (
                  <div className="relative w-full sm:w-48 h-48 rounded-lg overflow-hidden bg-black/20 flex-shrink-0">
                    {/* GIFs can be displayed as images with unoptimized flag */}
                    <Image
                      src={mediaUrl}
                      alt={metadata?.name || voucher.name}
                      fill
                      className="object-contain"
                      unoptimized // Important for GIFs to animate
                    />
                  </div>
                ) : (
                  <div className="w-full sm:w-48 h-48 flex items-center justify-center bg-black/20 rounded-lg">
                    <div className="text-7xl">{voucher.icon}</div>
                  </div>
                )}

                {/* Voucher Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-bold text-[#daa520] text-xl mb-2 font-fredoka">
                        {metadata?.name || voucher.name}
                      </h3>
                      {owned ? (
                        <div className={`px-3 py-1 rounded-lg bg-gradient-to-r ${gradient} text-white text-sm font-bold flex-shrink-0`}>
                          ×{voucher.balanceNumber}
                        </div>
                      ) : (
                        <div className="px-3 py-1 rounded-lg bg-gray-800 text-gray-500 text-sm font-bold flex-shrink-0">
                          Not Owned
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mb-4">
                      {metadata?.description || voucher.description}
                    </p>
                  </div>

                  {/* Token ID Badge */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-800/50">
                    <span className="text-sm text-gray-400">
                      Token ID
                    </span>
                    <span className="text-sm font-bold text-[#daa520] font-mono">
                      #{voucher.id}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary Info */}
      <div className="bg-gradient-to-br from-[#daa520]/10 to-yellow-600/10 rounded-xl border border-[#daa520]/20 p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-[#daa520] mb-2 font-fredoka">
              𝕂Ǝ𝕂TV Summary
            </h3>
            <p className="text-gray-300">
              You own <span className="font-bold text-white">{totalVouchers}</span> voucher
              {totalVouchers !== 1 ? 's' : ''} across{' '}
              <span className="font-bold text-white">{ownedVouchers.length}</span> type
              {ownedVouchers.length !== 1 ? 's' : ''}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Vouchers grant exclusive benefits and rewards in the 𝕂Ǝ𝕂TECH ecosystem
            </p>
          </div>
          <button
            disabled
            className="px-6 py-3 rounded-xl bg-gray-800/50 text-gray-500 font-bold cursor-not-allowed font-fredoka whitespace-nowrap opacity-50"
            title="Coming soon"
          >
            🎁 Redeem (Coming Soon)
          </button>
        </div>
      </div>
    </div>
  )
}
