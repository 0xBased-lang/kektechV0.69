'use client'

import { useMemo } from 'react'
import Image from 'next/image'
import type { DashboardSection } from './PortfolioOverview'
import { TechTokenCard } from './TechTokenCard'
import { VoucherSection } from './VoucherSection'
import { KektechNFTsOnly } from '@/components/wallet/KektechNFTsOnly'
import { useWalletNFTs } from '@/lib/hooks/useWalletNFTs'
import { KEKTECH_CONTRACT_ADDRESS } from '@/config/constants'
import type { VoucherBalance } from '@/lib/hooks/useVoucherBalance'

interface DetailViewSectionProps {
  activeSection: DashboardSection
  onSectionChange: (section: DashboardSection) => void
  address: string

  // TECH Token props
  techBalance: string
  techBalanceFormatted: string
  techBalanceCompact: string
  techLoading: boolean

  // Voucher props
  vouchers: VoucherBalance[]
  ownedVouchers: VoucherBalance[]
  totalVouchers: number
  vouchersLoading: boolean
  explorerUrl: string

  // Portfolio metrics
  totalNFTs: number
  kektechNFTCount: number
}

/**
 * DetailViewSection Component
 *
 * Dynamically displays detailed information based on the active section:
 * - 'nfts': Shows NFT gallery with KEKTECH and other NFTs
 * - 'tech': Shows TECH token details and actions
 * - 'vouchers': Shows voucher collection and details
 * - 'assets': Shows comprehensive portfolio summary
 */
export function DetailViewSection({
  activeSection,
  onSectionChange,
  address,
  techBalance,
  techBalanceFormatted,
  techBalanceCompact,
  techLoading,
  vouchers,
  ownedVouchers,
  totalVouchers,
  vouchersLoading,
  explorerUrl,
  totalNFTs,
  kektechNFTCount,
}: DetailViewSectionProps) {

  // Fetch all NFTs to show other NFTs in the portfolio overview
  const { nfts } = useWalletNFTs(address)

  // Filter to get only non-KEKTECH NFTs
  const otherNFTs = useMemo(() => {
    return nfts.filter((nft) => {
      const nftAddress = nft?.token?.address  // ← FIXED: Use "address" not "address_hash"
      if (!nftAddress || !KEKTECH_CONTRACT_ADDRESS) return true

      const isKektech = nftAddress.toLowerCase() === KEKTECH_CONTRACT_ADDRESS.toLowerCase()

      // Debug logging to diagnose categorization issue (ALWAYS ENABLED FOR DIAGNOSIS)
      console.log('🔍 NFT Contract Check:', {
        nftId: nft.id,
        nftName: nft.metadata?.name || nft.token?.name,
        nftAddress: nftAddress,
        kektechAddress: KEKTECH_CONTRACT_ADDRESS,
        nftAddressLower: nftAddress.toLowerCase(),
        kektechAddressLower: KEKTECH_CONTRACT_ADDRESS.toLowerCase(),
        isKektech,
        willShowInOtherNFTs: !isKektech
      })

      return !isKektech
    })
  }, [nfts])

  // NFT Section - ONLY KEKTECH NFTs
  if (activeSection === 'nfts') {
    return (
      <div className="relative bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl border border-green-500/20 p-8 overflow-hidden">
        {/* Checkered Background Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,255,0,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,255,0,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />
        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-green-400 mb-2 font-fredoka">
                🐸 Your 𝕂Ǝ𝕂TECH NFTs
              </h2>
              <p className="text-gray-400">
                View and manage your {kektechNFTCount} 𝕂Ǝ𝕂TECH NFTs on BasedAI Network
              </p>
            </div>
          </div>
          <KektechNFTsOnly address={address} />
        </div>
      </div>
    )
  }

  // TECH Token Section
  if (activeSection === 'tech') {
    return (
      <div>
        <TechTokenCard
          balance={techBalance}
          balanceFormatted={techBalanceFormatted}
          balanceCompact={techBalanceCompact}
          isLoading={techLoading}
        />
      </div>
    )
  }

  // Vouchers Section - Changed to YELLOW
  if (activeSection === 'vouchers') {
    return (
      <div className="relative bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 rounded-2xl border border-yellow-500/20 p-8 overflow-hidden">
        {/* Checkered Background Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,255,0,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,255,0,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />
        <div className="relative">
          <VoucherSection
            vouchers={vouchers}
            ownedVouchers={ownedVouchers}
            totalVouchers={totalVouchers}
            isLoading={vouchersLoading}
            explorerUrl={explorerUrl}
          />
        </div>
      </div>
    )
  }

  // Total Assets Overview Section
  if (activeSection === 'assets') {
    return (
      <div className="relative bg-gradient-to-br from-gray-700/10 to-gray-800/10 rounded-2xl border border-gray-700/30 p-8 overflow-hidden">
        {/* Checkered Background Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,255,0,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,255,0,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />
        <div className="relative">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-[#3fb8bd] mb-2 font-fredoka">
            📊 Complete Portfolio Overview
          </h2>
          <p className="text-white text-lg">
            Comprehensive view of all your assets on BasedAI Network
          </p>
        </div>

        {/* Portfolio Summary Cards - Reordered: KEKTECH NFTs, TECH Tokens, Vouchers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* KEKTECH NFTs Summary - LEFT - Clickable */}
          <button
            onClick={() => onSectionChange('nfts')}
            className="bg-green-500/10 rounded-xl border border-green-500/20 p-6 hover:border-green-500/40 hover:bg-green-500/15 transition cursor-pointer text-left"
          >
            <div className="text-4xl mb-4">🐸</div>
            <h3 className="text-xl font-bold text-green-400 mb-2 font-fredoka">
              𝕂Ǝ𝕂TECH NFTs
            </h3>
            <div className="text-3xl font-bold text-white mb-2">
              {kektechNFTCount}
            </div>
            <p className="text-sm text-gray-400">
              𝕂Ǝ𝕂TECH NFTs
              {totalNFTs > kektechNFTCount && ` (+${totalNFTs - kektechNFTCount} others)`}
            </p>
          </button>

          {/* TECH Tokens Summary - MIDDLE - Clickable */}
          <button
            onClick={() => onSectionChange('tech')}
            className="bg-cyan-500/10 rounded-xl border border-cyan-500/20 p-6 hover:border-cyan-500/40 hover:bg-cyan-500/15 transition cursor-pointer text-left"
          >
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-xl font-bold text-cyan-400 mb-2 font-fredoka">
              TECH Tokens
            </h3>
            <div className="text-3xl font-bold text-white mb-2">
              {techBalanceCompact}
            </div>
            <p className="text-sm text-gray-400">
              {parseFloat(techBalance) > 0
                ? `${techBalance} TECH`
                : 'No tokens held'}
            </p>
          </button>

          {/* Vouchers Summary - RIGHT - Clickable - Changed to YELLOW */}
          <button
            onClick={() => onSectionChange('vouchers')}
            className="bg-yellow-500/10 rounded-xl border border-yellow-500/20 p-6 hover:border-yellow-500/40 hover:bg-yellow-500/15 transition cursor-pointer text-left"
          >
            <div className="text-4xl mb-4">🎫</div>
            <h3 className="text-xl font-bold text-[#daa520] mb-2 font-fredoka">
              𝕂Ǝ𝕂TECH Vouchers
            </h3>
            <div className="text-3xl font-bold text-white mb-2">
              {totalVouchers}
            </div>
            <p className="text-sm text-gray-400">
              {ownedVouchers.length} type{ownedVouchers.length !== 1 ? 's' : ''} owned
            </p>
          </button>
        </div>

        {/* Asset Breakdown */}
        <div className="bg-gray-900/60 rounded-xl border border-gray-800 p-6">
          <h3 className="text-xl font-bold text-[#3fb8bd] mb-4 font-fredoka">
            Asset Breakdown
          </h3>
          <div className="space-y-4">
            {/* 1st: KEKTECH NFTs - Clickable */}
            <button
              onClick={() => onSectionChange('nfts')}
              className="w-full flex items-center justify-between pb-4 border-b border-gray-800 hover:bg-gray-800/50 -mx-3 px-3 py-2 rounded-lg transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">🐸</div>
                <div className="text-left">
                  <div className="text-white font-bold">𝕂Ǝ𝕂TECH NFTs (ERC-721)</div>
                  <div className="text-sm text-gray-400">{kektechNFTCount} collectibles</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-green-400 font-bold">
                  {kektechNFTCount} Owned
                </div>
              </div>
            </button>

            {/* 2nd: TECH Token - Clickable */}
            <button
              onClick={() => onSectionChange('tech')}
              className="w-full flex items-center justify-between pb-4 border-b border-gray-800 hover:bg-gray-800/50 -mx-3 px-3 py-2 rounded-lg transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">💰</div>
                <div className="text-left">
                  <div className="text-white font-bold">TECH Token (ERC-20)</div>
                  <div className="text-sm text-gray-400">{techBalanceCompact} balance</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-cyan-400 font-bold">
                  {parseFloat(techBalance) > 0 ? 'Active' : 'Empty'}
                </div>
              </div>
            </button>

            {/* 3rd: KEKTECH Vouchers - Clickable - Changed to YELLOW */}
            <button
              onClick={() => onSectionChange('vouchers')}
              className="w-full flex items-center justify-between pb-4 border-b border-gray-800 hover:bg-gray-800/50 -mx-3 px-3 py-2 rounded-lg transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">🎫</div>
                <div className="text-left">
                  <div className="text-white font-bold">𝕂Ǝ𝕂TECH Vouchers (ERC-1155)</div>
                  <div className="text-sm text-gray-400">{ownedVouchers.length} types</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[#daa520] font-bold">
                  {totalVouchers} Total
                </div>
              </div>
            </button>

            {/* 4th: Based NFTs (only show if they exist) - Non-clickable info */}
            {totalNFTs > kektechNFTCount && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">🎨</div>
                  <div>
                    <div className="text-white font-bold">Based NFTs (ERC-721)</div>
                    <div className="text-sm text-gray-400">Various collections</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold">
                    {totalNFTs - kektechNFTCount} Owned
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Based NFTs Visual Gallery */}
        {otherNFTs.length > 0 && (
          <div className="mt-8 bg-gray-900/60 rounded-xl border border-gray-800 p-6">
            <h3 className="text-xl font-bold text-[#3fb8bd] mb-4 font-fredoka">
              🎨 Based NFTs
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Your collection of {otherNFTs.length} NFT{otherNFTs.length !== 1 ? 's' : ''} from various Based collections
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {otherNFTs.map((nft) => (
                <div
                  key={nft.id}
                  className="aspect-square relative bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-gray-600 transition group"
                  title={nft.metadata?.name || `NFT #${nft.id}`}
                >
                  {nft.image_url || nft.metadata?.image_url ? (
                    <Image
                      src={nft.image_url || nft.metadata?.image_url || ''}
                      alt={nft.metadata?.name || `NFT #${nft.id}`}
                      fill
                      className="object-cover group-hover:scale-110 transition"
                      unoptimized
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        const placeholder = e.currentTarget.nextElementSibling as HTMLElement
                        if (placeholder) placeholder.style.display = 'flex'
                      }}
                    />
                  ) : null}
                  <div
                    className="absolute inset-0 flex items-center justify-center text-2xl bg-gray-800"
                    style={{ display: nft.image_url || nft.metadata?.image_url ? 'none' : 'flex' }}
                  >
                    🎨
                  </div>
                  {/* Hover overlay with name */}
                  <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition flex items-center justify-center p-2">
                    <p className="text-white text-xs text-center line-clamp-2 font-semibold">
                      {nft.metadata?.name || `#${nft.id}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-6 flex flex-wrap gap-4">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex-1 min-w-[200px] px-6 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold transition font-fredoka"
          >
            🔝 Back to Top
          </button>
          <button
            disabled
            className="flex-1 min-w-[200px] px-6 py-3 rounded-xl bg-gray-800/50 text-gray-500 font-bold cursor-not-allowed font-fredoka opacity-50"
            title="Coming soon"
          >
            📊 Export Portfolio (Coming Soon)
          </button>
        </div>
        </div>
      </div>
    )
  }

  return null
}
