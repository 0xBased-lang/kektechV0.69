/**
 * NFT Statistics Component
 * Shows key metrics for an NFT in a clean, organized way
 */

'use client'

import { useNFTStats } from '@/lib/hooks/useOfferHistory'
import { formatUnits } from 'ethers'

interface NFTStatisticsProps {
  tokenId: number
}

export function NFTStatistics({ tokenId }: NFTStatisticsProps) {
  const { stats, isLoading } = useNFTStats(tokenId)

  if (isLoading) {
    return (
      <div className="bg-gray-900/60 rounded-lg border border-gray-700/50 p-6 animate-pulse">
        <div className="h-32 bg-gray-800 rounded"></div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="bg-gray-900/60 rounded-lg border border-gray-700/50 p-6">
        <p className="text-gray-400 text-center">No trading history yet</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-900/60 rounded-lg border border-gray-700/50 p-6">
      <h3 className="text-lg font-bold text-[#daa520] mb-4 font-fredoka">
        📊 Trading Statistics
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Offers */}
        <StatCard
          label="Total Offers"
          value={stats.totalOffers.toString()}
          icon="💰"
        />

        {/* Accepted Sales */}
        <StatCard
          label="Sales Completed"
          value={stats.acceptedOffers.toString()}
          icon="✅"
          highlight={stats.acceptedOffers > 0}
        />

        {/* Active Offers */}
        <StatCard
          label="Active Offers"
          value={stats.activeOffers.toString()}
          icon="🔄"
          highlight={stats.activeOffers > 0}
        />

        {/* Total Volume */}
        <StatCard
          label="Total Volume"
          value={formatUnits(stats.totalVolume, 18) + ' TECH'}
          icon="📈"
        />

        {/* Average Price */}
        {stats.acceptedOffers > 0 && (
          <StatCard
            label="Avg Sale Price"
            value={formatUnits(stats.averagePrice, 18) + ' TECH'}
            icon="💎"
          />
        )}

        {/* Last Sale */}
        {stats.lastSalePrice && (
          <>
            <StatCard
              label="Last Sale Price"
              value={formatUnits(stats.lastSalePrice, 18) + ' TECH'}
              icon="🏷️"
            />
            <StatCard
              label="Last Sale Date"
              value={formatDate(stats.lastSaleDate!)}
              icon="📅"
            />
          </>
        )}

        {/* Cancelled/Rejected */}
        {(stats.cancelledOffers > 0 || stats.rejectedOffers > 0) && (
          <StatCard
            label="Cancelled/Rejected"
            value={`${stats.cancelledOffers + stats.rejectedOffers}`}
            icon="❌"
          />
        )}
      </div>
    </div>
  )
}

/**
 * Individual stat card
 */
function StatCard({
  label,
  value,
  icon,
  highlight,
}: {
  label: string
  value: string
  icon: string
  highlight?: boolean
}) {
  return (
    <div
      className={`bg-gray-800/50 rounded-lg p-4 border ${
        highlight ? 'border-[#daa520]/50' : 'border-gray-700/50'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      <p className="text-lg font-bold text-white truncate" title={value}>
        {value}
      </p>
    </div>
  )
}

/**
 * Format Unix timestamp to readable date
 */
function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`

  return date.toLocaleDateString()
}
