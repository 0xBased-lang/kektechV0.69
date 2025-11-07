'use client'

import { useState, useEffect } from 'react'
import { getTotalSupply, CONTRACTS } from '@/lib/blockchain/kektv'

/**
 * Compact horizontal stats widget for gallery
 * Shows collection stats and tier distribution in one small row
 */
export function CompactStatsWidget() {
  const [totalMinted, setTotalMinted] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const total = await getTotalSupply(CONTRACTS.KEKTECH)
        setTotalMinted(total)
      } catch (error) {
        console.error('Error fetching total supply:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-[#3fb8bd] border-t-transparent" />
      </div>
    )
  }

  const totalSupply = 4200
  const remaining = totalSupply - totalMinted
  const progress = ((totalMinted / totalSupply) * 100).toFixed(1)

  // Tier distribution based on total minted - colors match trait rarity badges
  const tiers = [
    { name: 'Mythic', minted: Math.floor(totalMinted * (13 / 4200)), total: 13, color: '#a855f7', bgColor: 'bg-purple-500/10' },
    { name: 'Legendary', minted: Math.floor(totalMinted * (42 / 4200)), total: 42, color: '#eab308', bgColor: 'bg-yellow-500/10' },
    { name: 'Epic', minted: Math.floor(totalMinted * (195 / 4200)), total: 195, color: '#22c55e', bgColor: 'bg-green-500/10' },
    { name: 'Rare', minted: Math.floor(totalMinted * (670 / 4200)), total: 670, color: '#3b82f6', bgColor: 'bg-blue-500/10' },
    { name: 'Common', minted: Math.floor(totalMinted * (3280 / 4200)), total: 3280, color: '#06b6d4', bgColor: 'bg-cyan-500/10' }
  ]

  return (
    <div className="relative bg-gradient-to-r from-gray-900/90 via-gray-900/80 to-gray-900/90 rounded-2xl border-2 border-[#3fb8bd]/30 px-8 py-6 backdrop-blur-md shadow-lg shadow-[#3fb8bd]/10 overflow-hidden">
      {/* Checkered Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,255,0,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,255,0,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />
      <div className="relative">
      {/* Collection Stats - Top Section */}
      <div className="flex items-center justify-center gap-8 mb-6 pb-6">
        <div className="text-center">
          <div className="text-sm text-gray-400 mb-2 font-medium">Minted</div>
          <div className="text-3xl font-bold text-[#3fb8bd]">{totalMinted.toLocaleString()}</div>
        </div>
        <div className="h-12 w-px bg-gray-700" />
        <div className="text-center">
          <div className="text-sm text-gray-400 mb-2 font-medium">Remaining</div>
          <div className="text-3xl font-bold text-[#4ecca7]">{remaining.toLocaleString()}</div>
        </div>
        <div className="h-12 w-px bg-gray-700" />
        <div className="text-center">
          <div className="text-sm text-gray-400 mb-2 font-medium">Progress</div>
          <div className="text-3xl font-bold text-[#daa520]">{progress}%</div>
        </div>
      </div>

      {/* Tier Distribution - Bottom Section with Full Names */}
      <div className="flex items-center justify-center gap-4 flex-wrap">
        <div className="text-sm text-gray-400 font-medium mr-2">Tier Distribution:</div>
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`${tier.bgColor} rounded-lg px-4 py-2 border border-gray-700/50`}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold" style={{ color: tier.color }}>
                {tier.name}
              </span>
              <span className="text-sm font-medium text-white">
                {tier.minted}/{tier.total}
              </span>
            </div>
          </div>
        ))}
      </div>
      </div>
    </div>
  )
}
