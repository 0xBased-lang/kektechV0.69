'use client'

export type DashboardSection = 'nfts' | 'tech' | 'vouchers' | 'assets'

interface PortfolioOverviewProps {
  techBalance: string
  techBalanceCompact: string
  totalNFTs: number
  kektechNFTCount: number
  totalVouchers: number
  uniqueVoucherTypes: number
  isLoading: boolean
  activeSection: DashboardSection
  onSectionChange: (section: DashboardSection) => void
}

/**
 * PortfolioOverview Component
 *
 * Hero section displaying aggregated portfolio metrics
 */
export function PortfolioOverview({
  techBalance,
  techBalanceCompact,
  totalNFTs,
  kektechNFTCount,
  totalVouchers,
  uniqueVoucherTypes,
  isLoading,
  activeSection,
  onSectionChange,
}: PortfolioOverviewProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center mb-8">
        <div className="inline-flex rounded-xl bg-gray-900/60 border border-gray-800 p-1">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="px-6 py-3 rounded-lg animate-pulse flex items-center gap-2"
            >
              <div className="h-5 w-5 bg-gray-800 rounded"></div>
              <div className="h-4 w-20 bg-gray-800 rounded"></div>
              <div className="h-3 w-8 bg-gray-800 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-center mb-8">
      <div className="inline-flex rounded-xl bg-gray-900/60 border border-gray-800 p-1">
        {/* KEKTECH NFTs Tab */}
        <button
          onClick={() => onSectionChange('nfts')}
          className={`
            px-6 py-3 rounded-lg font-fredoka font-bold transition-all duration-200 flex items-center gap-2
            ${activeSection === 'nfts'
              ? 'bg-[#4ecca7] text-black shadow-lg shadow-[#4ecca7]/20'
              : 'text-[#4ecca7] hover:text-white hover:bg-gray-800/50'
            }
          `}
        >
          <span>𝕂Ǝ𝕂TECH</span>
          <span className="text-sm opacity-75">
            {kektechNFTCount}
          </span>
        </button>

        {/* TECH Token Tab */}
        <button
          onClick={() => onSectionChange('tech')}
          className={`
            px-6 py-3 rounded-lg font-fredoka font-bold transition-all duration-200 flex items-center gap-2
            ${activeSection === 'tech'
              ? 'bg-kek-green text-black shadow-lg shadow-kek-green/20'
              : 'text-kek-green hover:text-white hover:bg-gray-800/50'
            }
          `}
        >
          <span>TECH</span>
          <span className="text-sm opacity-75">{techBalanceCompact}</span>
        </button>

        {/* Vouchers Tab - Changed to YELLOW */}
        <button
          onClick={() => onSectionChange('vouchers')}
          className={`
            px-6 py-3 rounded-lg font-fredoka font-bold transition-all duration-200 flex items-center gap-2
            ${activeSection === 'vouchers'
              ? 'bg-[#daa520] text-black shadow-lg shadow-[#daa520]/20'
              : 'text-[#daa520] hover:text-white hover:bg-gray-800/50'
            }
          `}
        >
          <span>𝕂Ǝ𝕂TV</span>
          <span className="text-sm opacity-75">
            {totalVouchers}{uniqueVoucherTypes > 1 && ` (${uniqueVoucherTypes})`}
          </span>
        </button>

        {/* Total Assets Tab - Changed to PURPLE */}
        <button
          onClick={() => onSectionChange('assets')}
          className={`
            px-6 py-3 rounded-lg font-fredoka font-bold transition-all duration-200 flex items-center gap-2
            ${activeSection === 'assets'
              ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
              : 'text-purple-400 hover:text-white hover:bg-gray-800/50'
            }
          `}
        >
          <span>Overview</span>
          <span className="text-sm opacity-75">
            {totalNFTs + (totalVouchers > 0 ? 1 : 0) + (parseFloat(techBalance) > 0 ? 1 : 0)}
          </span>
        </button>
      </div>
    </div>
  )
}
