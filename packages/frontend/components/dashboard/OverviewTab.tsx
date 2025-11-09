import { usePortfolioData } from '@/lib/hooks/usePortfolioData'
import { SummaryCard } from './SummaryCard'

interface OverviewTabProps {
  address: string
  onTabChange: (tab: 'overview' | 'portfolio' | 'feels-good') => void
}

/**
 * Overview Tab Component
 *
 * Shows high-level summary with quick navigation to other tabs
 * - Portfolio summary (NFT count, TECH balance)
 * - Feels Good summary (active positions, P&L) [TODO: Add prediction market data]
 * - Total value (coming soon)
 */
export function OverviewTab({ address: _address, onTabChange }: OverviewTabProps) {
  const portfolio = usePortfolioData()

  // Calculate portfolio stats
  const nftCount = portfolio.nfts.all?.length || 0
  const techBalance = portfolio.techBalance.data?.formatted || '0'
  const voucherCount = portfolio.voucherBalance.data?.total || 0

  return (
    <div>
      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <SummaryCard
          title="KEKTECH Portfolio"
          value={`${nftCount} NFTs`}
          subvalue={`${parseFloat(techBalance).toFixed(2)} TECH • ${voucherCount} Vouchers`}
          icon="🖼️"
          gradient="from-purple-600 to-purple-800"
          onClick={() => onTabChange('portfolio')}
          isLoading={portfolio.techBalance.isLoading || portfolio.nfts.isLoading}
        />

        <SummaryCard
          title="Feels Good Positions"
          value="Coming Soon"
          subvalue="Prediction markets launching"
          icon="📈"
          gradient="from-[#4ecca7] to-[#37a580]"
          onClick={() => onTabChange('feels-good')}
        />

        <SummaryCard
          title="Total Value"
          value="Coming Soon"
          subvalue="Portfolio valuation"
          icon="💰"
          gradient="from-[#3fb8bd] to-[#2a8388]"
          disabled
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-8 mb-8">
        <h3 className="text-xl font-fredoka font-bold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickActionButton
            label="View Markets"
            icon="📊"
            href="/feels-good-markets/kek-futures"
          />
          <QuickActionButton
            label="Mint NFTs"
            icon="🎨"
            href="/feels-good-markets/nft-marketplace"
          />
          <QuickActionButton
            label="Claim Rewards"
            icon="🏆"
            href="#"
            disabled
          />
          <QuickActionButton
            label="Gallery"
            icon="🖼️"
            href="/gallery"
          />
        </div>
      </div>

      {/* Welcome / Info Section */}
      <div className="bg-gradient-to-br from-[#3fb8bd]/10 to-transparent rounded-xl border border-[#3fb8bd]/20 p-8">
        <h3 className="text-2xl font-fredoka font-bold text-white mb-3">
          Welcome to Your Dashboard
        </h3>
        <p className="text-gray-300 mb-4">
          This is your central hub for managing all your KEKTECH assets and prediction market positions.
        </p>
        <ul className="space-y-2 text-gray-400 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-[#3fb8bd] mt-0.5">✓</span>
            <span><strong className="text-white">KEKTECH Portfolio:</strong> View your NFT collection, TECH tokens, and KEKTV vouchers</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#3fb8bd] mt-0.5">✓</span>
            <span><strong className="text-white">Feels Good:</strong> Track your prediction market positions and P&L</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#3fb8bd] mt-0.5">✓</span>
            <span><strong className="text-white">Ultra-Low Fees:</strong> 1000x cheaper than traditional prediction markets</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

// Quick Action Button Component
interface QuickActionButtonProps {
  label: string
  icon: string
  href: string
  disabled?: boolean
}

function QuickActionButton({ label, icon, href, disabled }: QuickActionButtonProps) {
  if (disabled) {
    return (
      <button
        disabled
        className="flex flex-col items-center gap-2 p-4 bg-gray-800/30 rounded-lg border border-gray-700 opacity-50 cursor-not-allowed"
      >
        <span className="text-3xl">{icon}</span>
        <span className="text-sm font-semibold text-gray-500">{label}</span>
      </button>
    )
  }

  return (
    <a
      href={href}
      className="flex flex-col items-center gap-2 p-4 bg-gray-800/30 rounded-lg border border-gray-700 hover:border-[#3fb8bd] hover:bg-gray-800/50 transition group"
    >
      <span className="text-3xl group-hover:scale-110 transition">{icon}</span>
      <span className="text-sm font-semibold text-gray-300 group-hover:text-[#3fb8bd]">{label}</span>
    </a>
  )
}
