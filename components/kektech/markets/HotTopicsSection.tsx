/**
 * KEKTECH 3.0 - Hot Topics Section
 * Displays trending markets + user's pinned markets
 */
'use client';

import { useState, useEffect } from 'react';
import { MarketCard } from './MarketCard';
import { useTrendingMarkets } from '@/lib/hooks/useTrendingMarkets';
import { Flame, Pin, TrendingUp } from 'lucide-react';
import type { Address } from 'viem';

interface HotTopicsSectionProps {
  /** All available markets */
  markets: Address[];
  /** Maximum number of trending markets to show */
  maxTrending?: number;
}

/**
 * Shows trending + pinned markets in HOT tab
 * - User's pinned markets appear first
 * - Then trending markets (by activity)
 * - Pin/unpin functionality with localStorage
 */
export function HotTopicsSection({ markets, maxTrending = 3 }: HotTopicsSectionProps) {
  const [pinnedMarkets, setPinnedMarkets] = useState<Address[]>([]);

  // Load pinned markets from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('kektech-pinned-markets');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPinnedMarkets(parsed);
      } catch (e) {
        console.error('Failed to parse pinned markets:', e);
      }
    }
  }, []);

  // Save pinned markets to localStorage when they change
  useEffect(() => {
    localStorage.setItem('kektech-pinned-markets', JSON.stringify(pinnedMarkets));
  }, [pinnedMarkets]);

  // Calculate trending markets using the algorithm
  const trendingMarkets = useTrendingMarkets(markets, maxTrending);

  // Filter out pinned markets from trending
  const filteredTrending = trendingMarkets.filter(addr => !pinnedMarkets.includes(addr));

  // Combine: pinned first, then trending
  const displayMarkets = [...pinnedMarkets, ...filteredTrending].slice(0, maxTrending + pinnedMarkets.length);

  if (displayMarkets.length === 0) {
    return null; // Don't show section if no markets
  }

  return (
    <div className="mb-8">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-orange-500/10 rounded-lg">
          <Flame className="w-6 h-6 text-orange-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">🔥 Hot Topics</h2>
          <p className="text-gray-400 text-sm">
            Trending markets and your pinned favorites
          </p>
        </div>
      </div>

      {/* Markets Grid */}
      <div className="space-y-4">
        {displayMarkets.map((marketAddress) => {
          const isPinned = pinnedMarkets.includes(marketAddress);
          const isTrending = trendingMarkets.includes(marketAddress);

          return (
            <div key={marketAddress} className="relative">
              {/* Pinned/Trending Badges */}
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                {isPinned && (
                  <div className="flex items-center gap-1 px-3 py-1 bg-kek-green/20 border border-kek-green/30 rounded-full text-kek-green text-xs font-semibold backdrop-blur-sm">
                    <Pin className="w-3 h-3 fill-current" />
                    Pinned
                  </div>
                )}
                {isTrending && !isPinned && (
                  <div className="flex items-center gap-1 px-3 py-1 bg-orange-500/20 border border-orange-500/30 rounded-full text-orange-500 text-xs font-semibold backdrop-blur-sm">
                    <TrendingUp className="w-3 h-3" />
                    Trending
                  </div>
                )}
              </div>

              {/* Market Card */}
              <MarketCard
                marketAddress={marketAddress}
                showPinButton={true}
                isPinned={isPinned}
                onTogglePin={() => {
                  if (isPinned) {
                    setPinnedMarkets(prev => prev.filter(addr => addr !== marketAddress));
                  } else {
                    setPinnedMarkets(prev => [...prev, marketAddress]);
                  }
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Info Message */}
      {pinnedMarkets.length === 0 && (
        <div className="mt-4 p-4 bg-gray-900/30 rounded-lg border border-gray-800">
          <p className="text-gray-400 text-sm">
            💡 <strong>Tip:</strong> Click the pin button on any market card to keep it at the top!
          </p>
        </div>
      )}
    </div>
  );
}
