'use client'
import { useState } from 'react'
import { BrowseOffers } from './BrowseOffers'
import { MakeOfferForm } from './MakeOfferForm'

type OfferView = 'marketplace' | 'create'

/**
 * Main container for the Offers system with compact layout
 *
 * Architecture:
 * - All Offers: Browse all offers with smart "For You" filtering
 * - Create Offer: Make new offers
 *
 * Note: "My Activity" moved to dedicated "My Trading Activity" page
 */
export function OffersView() {
  const [activeView, setActiveView] = useState<OfferView>('marketplace')

  return (
    <div className="max-w-7xl mx-auto">
      {/* Compact Horizontal Navigation Bar - STICKY */}
      <div className="sticky top-0 z-20 bg-black/90 backdrop-blur-sm border-b border-gray-700/50">
        <div className="flex items-center justify-around py-4 px-6">
          {/* All Offers Button */}
          <button
            onClick={() => setActiveView('marketplace')}
            className={`flex items-center gap-3 px-6 py-2 rounded-lg transition-all cursor-pointer ${
              activeView === 'marketplace'
                ? 'bg-[#daa520]/20 border border-[#daa520]/50'
                : 'border border-transparent hover:bg-gray-800/50'
            }`}
          >
            <span className="text-3xl">🏪</span>
            <div className="text-left">
              <div className="text-2xl font-bold text-[#daa520]">All Offers</div>
              <div className="text-xs text-gray-400 whitespace-nowrap">Browse marketplace</div>
            </div>
          </button>

          {/* Create Offer Button */}
          <button
            onClick={() => setActiveView('create')}
            className={`flex items-center gap-3 px-6 py-2 rounded-lg transition-all cursor-pointer ${
              activeView === 'create'
                ? 'bg-[#daa520]/20 border border-[#daa520]/50'
                : 'border border-transparent hover:bg-gray-800/50'
            }`}
          >
            <span className="text-3xl">➕</span>
            <div className="text-left">
              <div className="text-2xl font-bold text-[#daa520]">Create Offer</div>
              <div className="text-xs text-gray-400 whitespace-nowrap">Make new offer</div>
            </div>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6">
        {activeView === 'marketplace' && <BrowseOffers />}
        {activeView === 'create' && <MakeOfferForm />}
      </div>
    </div>
  )
}
