'use client'

import { TraitDistribution } from '@/components/traits/TraitDistribution'

/**
 * Traits Overview Tab Content
 *
 * Shows trait distribution table with rarity percentages
 */
export function TraitsOverviewContent() {
  return (
    <div className="space-y-6">
      <div className="text-center max-w-2xl mx-auto">
        <h3 className="text-2xl font-bold text-[#daa520] mb-3 font-fredoka">Trait Rarities</h3>
        <p className="text-gray-400">
          Explore the rarity distribution of traits across the 𝕂Ǝ𝕂TECH collection.
          Switch to Filter tab to find NFTs with specific traits.
        </p>
      </div>
      <TraitDistribution />
    </div>
  )
}
