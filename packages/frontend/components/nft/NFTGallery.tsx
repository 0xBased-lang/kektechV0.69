'use client'

import { useState, useMemo } from 'react'
import { EnhancedNFTCard } from './EnhancedNFTCard'
import { useRankings } from '@/lib/hooks/useRankings'
import { GalleryTabs } from '@/components/gallery/GalleryTabs'
import { CompactStatsWidget } from '@/components/CompactStatsWidget'
import { FilterTabContent } from '@/components/gallery/FilterTabContent'
import { TraitsOverviewContent } from '@/components/gallery/TraitsOverviewContent'

/**
 * NFTGallery Component
 *
 * Three-tab gallery layout:
 * - Ranking: Shows all minted NFTs by rank with stats widget
 * - Filter: Trait filtering with sidebar
 * - Traits: Trait distribution table (rarity overview)
 */
export function NFTGallery() {
  const { rankings: nfts, loading: isLoading, error } = useRankings(30000)
  const [searchId, setSearchId] = useState('')

  // Filter NFTs by ID
  const filteredNfts = useMemo(() => {
    if (!searchId.trim()) return nfts

    const searchTerm = searchId.trim().toLowerCase()
    return nfts.filter((nft) =>
      nft.tokenId.toString().includes(searchTerm)
    )
  }, [nfts, searchId])

  // Loading State
  if (isLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="aspect-square bg-gray-200 dark:bg-gray-800" />
            <div className="p-4">
              <div className="mb-2 h-6 w-3/4 rounded bg-gray-200 dark:bg-gray-800" />
              <div className="mb-3 h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-800" />
              <div className="mb-3 flex gap-1">
                <div className="h-6 w-16 rounded-full bg-gray-200 dark:bg-gray-800" />
                <div className="h-6 w-16 rounded-full bg-gray-200 dark:bg-gray-800" />
                <div className="h-6 w-16 rounded-full bg-gray-200 dark:bg-gray-800" />
              </div>
              <div className="h-9 w-full rounded-lg bg-gray-200 dark:bg-gray-800" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Error State
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center dark:border-red-900 dark:bg-red-900/20">
        <div className="mb-4 text-4xl">⚠️</div>
        <h3 className="mb-2 text-lg font-semibold text-red-900 dark:text-red-100">
          Failed to Load NFTs
        </h3>
        <p className="mb-4 text-red-700 dark:text-red-300">{error}</p>
      </div>
    )
  }

  // Empty State
  if (nfts.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 text-6xl">🎨</div>
        <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
          No NFTs Yet
        </h3>
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          Be the first to mint a KEKTECH NFT!
        </p>
        <a
          href="/mint"
          className="inline-block rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          Start Minting
        </a>
      </div>
    )
  }

  // Ranking Tab Content
  const renderRankingTab = () => (
    <div className="space-y-8">
      {/* Stats Widget */}
      <div className="mb-8">
        <CompactStatsWidget />
      </div>

      {/* Search Bar */}
      <div className="max-w-md mx-auto">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder="Search by NFT ID (e.g., 1, 42, 1337)..."
            className="w-full pl-11 pr-4 py-3 bg-gray-900/60 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-kek-green focus:border-transparent transition font-fredoka"
          />
          {searchId && (
            <button
              onClick={() => setSearchId('')}
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-white transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* No Results Message */}
      {searchId && filteredNfts.length === 0 && (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-xl font-bold text-white mb-2 font-fredoka">No NFTs Found</h3>
          <p className="text-gray-400 mb-4">
            No NFTs match ID &quot;{searchId}&quot;
          </p>
          <button
            onClick={() => setSearchId('')}
            className="px-6 py-2 bg-kek-green text-black font-bold rounded-lg hover:bg-kek-green/90 transition font-fredoka"
          >
            Clear Search
          </button>
        </div>
      )}

      {/* NFT Grid */}
      {filteredNfts.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredNfts.map((nft) => (
            <EnhancedNFTCard key={nft.tokenId} nft={nft} />
          ))}
        </div>
      )}

      {/* Footer Stats */}
      {filteredNfts.length > 0 && (
        <div className="text-center text-gray-400 border-t border-gray-800 pt-6">
          <p>
            Showing {filteredNfts.length} {searchId ? 'of ' + nfts.length : ''} NFTs • Updates
            automatically every 30 seconds
          </p>
        </div>
      )}
    </div>
  )

  // Filter Tab Content
  const renderFilterTab = () => <FilterTabContent />

  // Traits Tab Content
  const renderTraitsTab = () => <TraitsOverviewContent />

  // Three-Tab Layout
  return (
    <GalleryTabs>
      {(activeTab) => (
        <>
          {activeTab === 'ranking' && renderRankingTab()}
          {activeTab === 'filter' && renderFilterTab()}
          {activeTab === 'traits' && renderTraitsTab()}
        </>
      )}
    </GalleryTabs>
  )
}
