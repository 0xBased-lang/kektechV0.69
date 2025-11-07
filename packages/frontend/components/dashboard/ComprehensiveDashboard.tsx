'use client'

import { useState } from 'react'
import { usePortfolioData } from '@/lib/hooks/usePortfolioData'
import { PortfolioOverview, type DashboardSection } from './PortfolioOverview'
import { DetailViewSection } from './DetailViewSection'

interface ComprehensiveDashboardProps {
  address: string
}

/**
 * ComprehensiveDashboard Component
 *
 * Main dashboard component that orchestrates all portfolio sections:
 * - Portfolio Overview (Hero metrics)
 * - TECH Token Card (ERC-20)
 * - NFT Gallery (ERC-721)
 * - Voucher Section (ERC-1155)
 */
export function ComprehensiveDashboard({ address }: ComprehensiveDashboardProps) {
  const portfolio = usePortfolioData()

  // State to track which section is active (default: Complete Portfolio Overview)
  const [activeSection, setActiveSection] = useState<DashboardSection>('assets')

  // Global loading state
  if (portfolio.isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-[#3fb8bd] mb-4"></div>
        <p className="text-xl text-gray-400 font-fredoka">Loading your portfolio...</p>
        <p className="text-sm text-gray-500 mt-2">Fetching data from blockchain</p>
      </div>
    )
  }

  // Global error state
  if (portfolio.hasError && portfolio.errors.length > 0) {
    return (
      <div className="bg-red-900/20 border border-red-900 rounded-xl p-8 text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h3 className="text-xl font-bold text-red-100 mb-3 font-fredoka">
          Failed to Load Portfolio
        </h3>
        <div className="text-red-300 mb-6 space-y-2">
          {portfolio.errors.map((error, i) => (
            <p key={i} className="text-sm">
              {error}
            </p>
          ))}
        </div>
        <button
          onClick={portfolio.refetchAll}
          className="px-8 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition font-fredoka"
        >
          🔄 Retry All
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Portfolio Overview - Interactive Section Selector */}
      <PortfolioOverview
        techBalance={portfolio.techBalance?.balance || '0'}
        techBalanceCompact={portfolio.techBalance?.balanceCompact || '0'}
        totalNFTs={portfolio.metrics?.totalNFTs || 0}
        kektechNFTCount={portfolio.metrics?.kektechNFTCount || 0}
        totalVouchers={portfolio.metrics?.totalVouchers || 0}
        uniqueVoucherTypes={portfolio.metrics?.uniqueVoucherTypes || 0}
        isLoading={portfolio.isLoading}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      {/* Dynamic Detail View - Changes based on selected section */}
      <DetailViewSection
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        address={address}
        techBalance={portfolio.techBalance?.balance || '0'}
        techBalanceFormatted={portfolio.techBalance?.balanceFormatted || '0'}
        techBalanceCompact={portfolio.techBalance?.balanceCompact || '0'}
        techLoading={portfolio.techBalance?.isLoading || false}
        vouchers={portfolio.voucherBalance?.vouchers || []}
        ownedVouchers={portfolio.voucherBalance?.ownedVouchers || []}
        totalVouchers={portfolio.voucherBalance?.totalVouchers || 0}
        vouchersLoading={portfolio.voucherBalance?.isLoading || false}
        explorerUrl={portfolio.voucherBalance?.explorerUrl || 'https://explorer.bf1337.org'}
        totalNFTs={portfolio.metrics?.totalNFTs || 0}
        kektechNFTCount={portfolio.metrics?.kektechNFTCount || 0}
      />

      {/* Refresh Button */}
      <div className="text-center py-6">
        <button
          onClick={portfolio.refetchAll}
          className="px-6 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold transition font-fredoka inline-flex items-center gap-2"
        >
          <span>🔄</span>
          <span>Refresh All Data</span>
        </button>
        <p className="text-xs text-gray-500 mt-2">
          Data updates automatically every 10-15 seconds
        </p>
      </div>
    </div>
  )
}
