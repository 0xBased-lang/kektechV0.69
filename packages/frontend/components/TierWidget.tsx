'use client'

import { useState, useEffect } from 'react'
import { getTierDistribution, type TierDistribution } from '@/lib/blockchain/kektv'

interface TierWidgetProps {
  showTitle?: boolean
  compact?: boolean
}

export function TierWidget({ showTitle = true, compact = false }: TierWidgetProps) {
  const [tiers, setTiers] = useState<TierDistribution[]>([])
  const [loading, setLoading] = useState(true)
  const [totalMinted, setTotalMinted] = useState(0)

  useEffect(() => {
    const fetchTiers = async () => {
      try {
        const distribution = await getTierDistribution()
        setTiers(distribution)

        // Calculate total minted
        const minted = distribution.reduce((sum, tier) => sum + tier.minted, 0)
        setTotalMinted(minted)
      } catch (error) {
        console.error('Error fetching tier distribution:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTiers()

    // Refresh every 30 seconds
    const interval = setInterval(fetchTiers, 30000)
    return () => clearInterval(interval)
  }, [])

  const getPercentage = (minted: number, total: number) => {
    return total > 0 ? ((minted / total) * 100).toFixed(1) : '0.0'
  }

  if (loading) {
    return (
      <div className={`bg-gradient-to-br from-gray-900/50 to-transparent rounded-2xl border border-gray-800 ${compact ? 'p-4' : 'p-6'}`}>
        <div className="text-center text-gray-400">
          Loading tier distribution...
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-gradient-to-br from-gray-900/50 to-transparent rounded-2xl border border-[#3fb8bd]/20 ${compact ? 'p-4' : 'p-6'}`}>
      {showTitle && (
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-white mb-2 font-fredoka">Tier Distribution</h3>
          <p className="text-gray-400 text-sm">
            Total Minted: <span className="text-[#3fb8bd] font-bold">{totalMinted}</span> / <span className="text-gray-300">4,200</span>
          </p>
        </div>
      )}

      <div className="space-y-4">
        {tiers.map((tier) => {
          const percentage = getPercentage(tier.minted, tier.total)
          const remaining = tier.total - tier.minted

          return (
            <div key={tier.tier} className="space-y-2">
              {/* Tier Info Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: tier.color }}
                  />
                  <span className={`font-bold ${compact ? 'text-sm' : 'text-base'}`} style={{ color: tier.color }}>
                    {tier.tier}
                  </span>
                </div>
                <div className={`flex items-center gap-3 ${compact ? 'text-xs' : 'text-sm'}`}>
                  <span className="text-gray-400">
                    {tier.minted} / {tier.total}
                  </span>
                  <span className="text-[#3fb8bd] font-bold min-w-[60px] text-right">
                    {remaining} left
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full transition-all duration-500 rounded-full"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: tier.color,
                    boxShadow: `0 0 10px ${tier.color}40`
                  }}
                />
              </div>

              {/* Percentage */}
              {!compact && (
                <div className="text-right text-xs text-gray-500">
                  {percentage}% minted
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Summary Stats */}
      {!compact && (
        <div className="mt-6 pt-6 border-t border-gray-800">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-[#3fb8bd]">{totalMinted}</div>
              <div className="text-xs text-gray-400">Minted</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[#4ecca7]">{4200 - totalMinted}</div>
              <div className="text-xs text-gray-400">Remaining</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[#daa520]">{getPercentage(totalMinted, 4200)}%</div>
              <div className="text-xs text-gray-400">Progress</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
