'use client'

import { useEffect, useState } from 'react'

interface TierData {
  name: string
  minted: number
  total: number
  color: string
}

interface RankingStats {
  totalNFTs: number
  tiers: TierData[]
}

interface RankingNFT {
  tier?: string
  [key: string]: unknown
}

/**
 * TierRankingWidget Component
 *
 * Displays collection statistics with rarity tiers
 * - Total NFTs minted
 * - Tier breakdown (Mythic, Legendary, Epic, Rare, Common)
 * - Real-time data from API
 */
export function TierRankingWidget() {
  const [stats, setStats] = useState<RankingStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRankingStats = async () => {
      try {
        // Use proxy endpoint to avoid CORS issues
        const response = await fetch('/api/rankings')
        if (!response.ok) throw new Error('Failed to fetch rankings')

        const data = (await response.json()) as RankingNFT[]

        // Count NFTs by tier
        const tierCounts = {
          Mythic: 0,
          Legendary: 0,
          Epic: 0,
          Rare: 0,
          Common: 0,
        }

        data.forEach((nft) => {
          if (nft.tier) {
            tierCounts[nft.tier as keyof typeof tierCounts]++
          }
        })

        // Tier totals (from old website)
        const tierTotals = {
          Mythic: 13,
          Legendary: 42,
          Epic: 195,
          Rare: 670,
          Common: 3280,
        }

        setStats({
          totalNFTs: data.length,
          tiers: [
            {
              name: 'Mythic',
              minted: tierCounts.Mythic,
              total: tierTotals.Mythic,
              color: '#a335ee', // Purple
            },
            {
              name: 'Legendary',
              minted: tierCounts.Legendary,
              total: tierTotals.Legendary,
              color: '#daa520', // Goldenrod (softer gold)
            },
            {
              name: 'Epic',
              minted: tierCounts.Epic,
              total: tierTotals.Epic,
              color: '#1eff00', // Green
            },
            {
              name: 'Rare',
              minted: tierCounts.Rare,
              total: tierTotals.Rare,
              color: '#ff5757', // Red
            },
            {
              name: 'Common',
              minted: tierCounts.Common,
              total: tierTotals.Common,
              color: '#3498db', // Blue
            },
          ],
        })
      } catch (error) {
        console.error('Error fetching ranking stats:', error)
        // Set to null on error to hide the widget
        setStats(null)
      } finally {
        setLoading(false)
      }
    }

    fetchRankingStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-kek-green border-t-transparent" />
      </div>
    )
  }

  // Hide widget if data failed to load
  if (!stats || stats.tiers.length === 0) {
    return null
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      {/* Total NFTs Card */}
      <div className="flex-1 rounded-xl border border-kek-green/30 bg-gradient-to-br from-gray-900 to-gray-950 p-6 text-center">
        <h3 className="font-fredoka mb-3 text-sm font-bold uppercase tracking-wide text-gray-400">
          TOTAL NFTS
        </h3>
        <div className="font-fredoka text-5xl font-bold text-kek-green">{stats.totalNFTs}</div>
      </div>

      {/* Rarity Tiers Card */}
      <div className="flex-1 rounded-xl border border-kek-green/30 bg-gradient-to-br from-gray-900 to-gray-950 p-6">
        <h3 className="font-fredoka mb-4 text-sm font-bold uppercase tracking-wide text-gray-400">
          RARITY TIERS
        </h3>
        <div className="space-y-2">
          {stats.tiers.map((tier) => (
            <div key={tier.name} className="flex items-center justify-between text-sm">
              <span className="font-fredoka font-medium" style={{ color: tier.color }}>
                {tier.name}:
              </span>
              <span className="font-fredoka font-bold text-white">
                {tier.minted}/{tier.total}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
