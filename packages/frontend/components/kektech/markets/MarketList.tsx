/**
 * KEKTECH 3.0 - Market List Component
 * Grid of market cards with filters
 */
'use client';

import { useMarketList } from '@/lib/hooks/kektech';
import { MarketCard } from './MarketCard';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { MarketState } from '@/lib/contracts/types';
import { useState } from 'react';
import type { Address } from 'viem';

interface MarketListProps {
  filterState?: MarketState;
  limit?: number;
}

/**
 * List of all markets with optional filtering
 */
export function MarketList({ filterState, limit }: MarketListProps) {
  const { markets, isLoading } = useMarketList();
  const [filter, setFilter] = useState<MarketState | undefined>(filterState);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" text="Loading markets..." />
      </div>
    );
  }

  if (!markets || markets.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-lg">No markets found</p>
        <p className="text-gray-500 text-sm mt-2">Be the first to create a prediction market!</p>
      </div>
    );
  }

  // Filter markets
  let filteredMarkets = markets;
  if (filter !== undefined) {
    // Filter logic will be implemented based on market state
    filteredMarkets = markets; // Placeholder
  }

  // Limit markets
  if (limit) {
    filteredMarkets = filteredMarkets.slice(0, limit);
  }

  return (
    <div>
      {/* Filter buttons */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { state: undefined, label: 'All' },
          { state: MarketState.ACTIVE, label: 'Active' },
          { state: MarketState.FINALIZED, label: 'Finalized' },
        ].map(({ state, label }) => (
          <button
            key={label}
            onClick={() => setFilter(state)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === state
                ? 'bg-kek-green text-black'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Market grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMarkets.map((marketAddress: Address) => (
          <MarketCard key={marketAddress} marketAddress={marketAddress} />
        ))}
      </div>
    </div>
  );
}
