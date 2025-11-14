/**
 * KEKTECH 3.0 - Proposals Page
 * Community market proposals awaiting validation
 */
'use client';

import { ProposalCard } from '@/components/kektech';
import { useMarketList, useMarketInfo } from '@/lib/hooks/kektech';
import { LoadingSpinner } from '@/components/kektech/ui/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';
import { MarketState, marketStateToString } from '@/lib/contracts/types';
import { Sparkles, TrendingUp, Bug } from 'lucide-react';
import { Address } from 'viem';
import { useState, memo } from 'react';

/**
 * Wrapper component for each market that calls hooks safely
 * This pattern avoids React Hooks violations when filtering dynamic lists
 */
const ProposalCardWrapper = memo(function ProposalCardWrapper({
  address,
  showAll
}: {
  address: Address;
  showAll: boolean;
}) {
  const marketInfo = useMarketInfo(address, true);

  // In normal mode, only show PROPOSED markets
  // In debug mode, show ALL markets with state badges
  if (!showAll && marketInfo?.state !== MarketState.PROPOSED) {
    return null;
  }

  return (
    <div className="relative">
      {/* State Badge (only in debug mode) */}
      {showAll && (
        <div className="absolute top-4 right-4 z-10">
          <span className={`
            px-3 py-1 rounded-full text-xs font-semibold
            ${marketInfo?.state === MarketState.PROPOSED ? 'bg-yellow-500/20 text-yellow-400' : ''}
            ${marketInfo?.state === MarketState.APPROVED ? 'bg-green-500/20 text-green-400' : ''}
            ${marketInfo?.state === MarketState.ACTIVE ? 'bg-blue-500/20 text-blue-400' : ''}
            ${marketInfo?.state === MarketState.RESOLVING ? 'bg-purple-500/20 text-purple-400' : ''}
            ${marketInfo?.state === MarketState.DISPUTED ? 'bg-red-500/20 text-red-400' : ''}
            ${marketInfo?.state === MarketState.FINALIZED ? 'bg-gray-500/20 text-gray-400' : ''}
          `}>
            {marketStateToString(marketInfo?.state ?? 0)}
          </span>
        </div>
      )}
      <ProposalCard marketAddress={address} />
    </div>
  );
});

export default function ProposalsPage() {
  const { markets, isLoading, marketCount } = useMarketList(true);
  const [showAll, setShowAll] = useState(false);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-kek-green" />
            <h1 className="text-4xl font-bold text-white">Market Proposals</h1>
          </div>
          {/* Debug Toggle */}
          <button
            onClick={() => setShowAll(!showAll)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors
              ${showAll
                ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
              }
            `}
          >
            <Bug className="w-4 h-4" />
            <span className="text-sm font-medium">
              {showAll ? 'Debug: All States' : 'Proposed Only'}
            </span>
          </button>
        </div>
        <p className="text-gray-400 text-lg">
          Community-proposed markets awaiting validation. Vote to help activate the best ideas!
        </p>
        <div className="mt-4 flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Total Markets:</span>
            <span className="font-semibold text-white">{marketCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-gray-400">Need 10+ upvotes to activate</span>
          </div>
          {showAll && (
            <div className="flex items-center gap-2 text-yellow-400">
              <Bug className="w-4 h-4" />
              <span>Debug mode: Showing all market states</span>
            </div>
          )}
        </div>
      </div>

      {/* Proposals Grid */}
      <div className="grid gap-4">
        {markets.length === 0 ? (
          <EmptyState title="No market proposals yet. Be the first to create one!" />
        ) : (
          markets.map((address) => (
            <ProposalCardWrapper key={address} address={address} showAll={showAll} />
          ))
        )}
      </div>

      {/* Info Section */}
      <div className="mt-12 p-6 bg-gray-900 rounded-xl border border-gray-800">
        <h2 className="text-xl font-bold text-white mb-4">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-kek-green/20 flex items-center justify-center text-kek-green font-bold">
                1
              </div>
              <h3 className="font-semibold text-white">Propose</h3>
            </div>
            <p className="text-gray-400 text-sm">
              Anyone can create a market proposal. It starts in PROPOSED state.
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold">
                2
              </div>
              <h3 className="font-semibold text-white">Vote</h3>
            </div>
            <p className="text-gray-400 text-sm">
              Community votes with likes/dislikes. Markets need 10+ net upvotes.
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
                3
              </div>
              <h3 className="font-semibold text-white">Activate</h3>
            </div>
            <p className="text-gray-400 text-sm">
              At 10+ upvotes, markets auto-activate and open for trading!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
