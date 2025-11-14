'use client'

import { useState, useMemo } from 'react'
import { useCompleteNFTs } from '@/lib/hooks/useCompleteNFTs'
import { TraitFilterSidebar } from './TraitFilterSidebar'
import { EnhancedNFTCard } from '@/components/nft/EnhancedNFTCard'
import { TraitDistribution } from '@/components/traits/TraitDistribution'

interface FilterState {
  [category: string]: string[]
}

/**
 * Traits Tab Content
 *
 * Two modes:
 * 1. Overview: Shows trait distribution table
 * 2. Filter: Shows sidebar + filtered NFT grid
 */
export function TraitsTabContent() {
  const { data: nfts, isLoading, error, stats } = useCompleteNFTs()
  const [viewMode, setViewMode] = useState<'overview' | 'filter'>('filter')
  const [filters, setFilters] = useState<FilterState>({})

  // Filter NFTs based on selected traits
  const filteredNFTs = useMemo(() => {
    const baseNFTs = nfts || []

    // Sort by Token ID (ascending) for filter view
    const sortedNFTs = [...baseNFTs].sort((a, b) =>
      parseInt(a.tokenId) - parseInt(b.tokenId)
    )

    // If no filters, return all sorted by Token ID
    if (Object.keys(filters).length === 0) return sortedNFTs

    // Filter NFTs that match ALL selected traits
    return sortedNFTs.filter(nft => {
      // NFT must match ALL selected categories (AND logic)
      return Object.entries(filters).every(([category, selectedValues]) => {
        if (selectedValues.length === 0) return true

        // Find if NFT has any of the selected values for this category
        return nft.attributes?.some((attr: { trait_type: string; value: string }) =>
          attr.trait_type === category &&
          selectedValues.includes(attr.value)
        )
      })
    })
  }, [nfts, filters])

  // Loading State
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-kek-green mx-auto mb-4"></div>
          <p className="text-gray-400">Loading NFT trait data...</p>
          <p className="text-sm text-gray-500 mt-2">This may take up to 30 seconds on first load</p>
        </div>
      </div>
    )
  }

  // Error State
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">⚠️</div>
          <h3 className="text-xl font-bold text-white mb-2">Failed to Load Trait Data</h3>
          <p className="text-gray-400 mb-4">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-kek-green text-black font-bold rounded-lg hover:bg-kek-green/90 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Subtle Mode Toggle */}
      <div className="flex justify-center border-b border-kek-green/30 pb-4">
        <div className="flex items-center gap-2 bg-gray-900/60 rounded-lg p-1 border border-kek-green/20">
          <button
            onClick={() => setViewMode('filter')}
            className={`px-4 py-1.5 rounded-md font-fredoka text-sm font-medium transition-all duration-200 ${
              viewMode === 'filter'
                ? 'bg-kek-green text-black'
                : 'text-kek-green hover:bg-kek-green/10'
            }`}
          >
            🔍 Filter
          </button>
          <button
            onClick={() => setViewMode('overview')}
            className={`px-4 py-1.5 rounded-md font-fredoka text-sm font-medium transition-all duration-200 ${
              viewMode === 'overview'
                ? 'bg-[#4ecca7] text-black'
                : 'text-[#4ecca7] hover:bg-[#4ecca7]/10'
            }`}
          >
            👀 Overview
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      {stats && viewMode === 'filter' && (
        <div className="flex justify-center gap-8 text-sm text-gray-400 font-fredoka">
          <span>
            Total Minted: <span className="text-kek-green font-bold">{stats.total}</span>
          </span>
          <span>•</span>
          <span>
            Filtered: <span className="text-[#4ecca7] font-bold">{filteredNFTs.length}</span>
          </span>
        </div>
      )}

      {/* Content */}
      {viewMode === 'overview' ? (
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-[#daa520] mb-3 font-fredoka">𝕂Ǝ𝕂丅ᵉ匚🅷 Traits</h3>
            <p className="text-gray-400">
              Explore the rarity of traits across the 𝕂Ǝ𝕂TECH collection.
              Switch to Filter mode to find NFTs with specific traits.
            </p>
          </div>
          <TraitDistribution />
        </div>
      ) : (
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="flex-shrink-0">
            <TraitFilterSidebar
              nfts={nfts || []}
              onFilterChange={setFilters}
            />
          </div>

          {/* NFT Grid */}
          <div className="flex-1">
            {filteredNFTs.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-white mb-2">No NFTs Found</h3>
                <p className="text-gray-400">
                  {Object.keys(filters).length === 0
                    ? 'Select traits to filter the collection'
                    : 'No NFTs match the selected trait combination'}
                </p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredNFTs.map((nft) => (
                  <EnhancedNFTCard key={nft.tokenId} nft={nft} showRank={false} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}