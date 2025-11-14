'use client'

import { useState, useEffect } from 'react'
import { getTierDistribution, getTotalSupply, CONTRACTS, type TierDistribution } from '@/lib/blockchain/kektv'

/**
 * Combined Collection Stats and Tier Distribution Widget
 * Elegant merged view for gallery page
 */
export function CollectionStatsWidget() {
  const [tiers, setTiers] = useState<TierDistribution[]>([])
  const [loading, setLoading] = useState(true)
  const [totalMinted, setTotalMinted] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [distribution, total] = await Promise.all([
          getTierDistribution(),
          getTotalSupply(CONTRACTS.KEKTECH)
        ])

        setTiers(distribution)
        setTotalMinted(total)
      } catch (error) {
        console.error('Error fetching collection stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const getPercentage = (minted: number, total: number) => {
    return total > 0 ? ((minted / total) * 100).toFixed(1) : '0.0'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-kek-green border-t-transparent" />
      </div>
    )
  }

  const totalSupply = 4200
  const remaining = totalSupply - totalMinted
  const progress = getPercentage(totalMinted, totalSupply)

  return (
    <div className="bg-gradient-to-br from-gray-900/80 to-gray-950/80 rounded-2xl border border-kek-green/30 p-8 backdrop-blur-sm">
      {/* Header Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Minted */}
        <div className="text-center p-6 rounded-xl bg-gradient-to-br from-kek-green/10 to-transparent border border-kek-green/20">
          <div className="text-sm font-medium text-gray-400 mb-2">Total Minted</div>
          <div className="text-4xl font-bold text-kek-green font-fredoka">{totalMinted}</div>
          <div className="text-xs text-gray-500 mt-1">of {totalSupply}</div>
        </div>

        {/* Remaining */}
        <div className="text-center p-6 rounded-xl bg-gradient-to-br from-[#4ecca7]/10 to-transparent border border-[#4ecca7]/20">
          <div className="text-sm font-medium text-gray-400 mb-2">Remaining</div>
          <div className="text-4xl font-bold text-[#4ecca7] font-fredoka">{remaining}</div>
          <div className="text-xs text-gray-500 mt-1">NFTs left</div>
        </div>

        {/* Progress */}
        <div className="text-center p-6 rounded-xl bg-gradient-to-br from-[#a855f7]/10 to-transparent border border-[#a855f7]/20">
          <div className="text-sm font-medium text-gray-400 mb-2">Progress</div>
          <div className="text-4xl font-bold text-[#a855f7] font-fredoka">{progress}%</div>
          <div className="text-xs text-gray-500 mt-1">complete</div>
        </div>
      </div>

      {/* Tier Distribution Title */}
      <div className="mb-6 pb-4 border-b border-gray-800">
        <h3 className="text-xl font-bold text-white font-fredoka">Tier Distribution</h3>
        <p className="text-sm text-gray-400 mt-1">Live rarity breakdown across all minted NFTs</p>
      </div>

      {/* Tier Breakdown */}
      <div className="space-y-5">
        {tiers.map((tier) => {
          const percentage = getPercentage(tier.minted, tier.total)
          const remaining = tier.total - tier.minted

          return (
            <div key={tier.tier} className="space-y-2">
              {/* Tier Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: tier.color, boxShadow: `0 0 10px ${tier.color}40` }}
                  />
                  <span className="font-bold text-base" style={{ color: tier.color }}>
                    {tier.tier}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-400">
                    <span className="text-white font-medium">{tier.minted}</span> / {tier.total}
                  </span>
                  <span className="text-kek-green font-bold min-w-[80px] text-right">
                    {remaining} left
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative h-3 bg-gray-800/50 rounded-full overflow-hidden backdrop-blur-sm">
                <div
                  className="absolute top-0 left-0 h-full transition-all duration-700 ease-out rounded-full"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: tier.color,
                    boxShadow: `0 0 15px ${tier.color}60, inset 0 1px 0 rgba(255,255,255,0.2)`
                  }}
                />

              </div>

              {/* Percentage */}
              <div className="flex justify-end">
                <span className="text-xs text-gray-500">{percentage}% minted</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
