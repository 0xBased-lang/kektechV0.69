'use client'

import { useState } from 'react'

interface GalleryTabsProps {
  children: (activeTab: 'ranking' | 'filter' | 'traits') => React.ReactNode
}

/**
 * Gallery Tabs Component
 *
 * Three-tab layout for the gallery:
 * - Ranking: Shows all NFTs by rank with stats widget
 * - Filter: Trait filtering with sidebar
 * - Traits: Trait distribution table (rarity overview)
 */
export function GalleryTabs({ children }: GalleryTabsProps) {
  const [activeTab, setActiveTab] = useState<'ranking' | 'filter' | 'traits'>('ranking')

  return (
    <div className="space-y-8">
      {/* Tab Navigation - Dashboard Style */}
      <div className="flex justify-center">
        <div className="inline-flex gap-2 rounded-xl bg-gray-900/60 border border-gray-800 p-1">
          <button
            onClick={() => setActiveTab('ranking')}
            className={`
              px-8 py-3 rounded-lg font-fredoka font-bold transition-all duration-200
              ${activeTab === 'ranking'
                ? 'bg-kek-green text-black shadow-lg shadow-kek-green/20'
                : 'text-kek-green hover:text-white hover:bg-gray-800/50'
              }
            `}
          >
            Ranking
          </button>
          <button
            onClick={() => setActiveTab('filter')}
            className={`
              px-8 py-3 rounded-lg font-fredoka font-bold transition-all duration-200
              ${activeTab === 'filter'
                ? 'bg-[#4ecca7] text-black shadow-lg shadow-[#4ecca7]/20'
                : 'text-[#4ecca7] hover:text-white hover:bg-gray-800/50'
              }
            `}
          >
            Filter
          </button>
          <button
            onClick={() => setActiveTab('traits')}
            className={`
              px-8 py-3 rounded-lg font-fredoka font-bold transition-all duration-200
              ${activeTab === 'traits'
                ? 'bg-[#daa520] text-black shadow-lg shadow-[#daa520]/20'
                : 'text-[#daa520] hover:text-white hover:bg-gray-800/50'
              }
            `}
          >
            Traits
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {children(activeTab)}
      </div>
    </div>
  )
}
