/**
 * KEKTECH 3.0 - Proposals Page
 * Community market proposals awaiting validation
 */
'use client';

import { ProposalCard } from '@/components/kektech';
import { useMarketList, useMarketInfo } from '@/lib/hooks/kektech';
import { LoadingSpinner } from '@/components/kektech/ui/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';
import { MarketState } from '@/lib/contracts/types';
import { Sparkles, TrendingUp } from 'lucide-react';

export default function ProposalsPage() {
  const { markets, isLoading, marketCount } = useMarketList(true);

  // Call hooks for all markets at top level (required by React rules)
  const marketInfos = markets.map((address) => useMarketInfo(address, true));

  // Filter for PROPOSED markets (state = 0)
  const proposedMarkets = markets.filter((_, index) => {
    return marketInfos[index]?.state === MarketState.PROPOSED;
  });

  // DEBUG: Log proposals
  console.log('[ProposalsPage] Total markets:', markets.length);
  console.log('[ProposalsPage] Proposed markets:', proposedMarkets.length);
  console.log('[ProposalsPage] Market states:', marketInfos.map((info, idx) => ({
    address: markets[idx],
    state: info?.state
  })));

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
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-8 h-8 text-[#3fb8bd]" />
          <h1 className="text-4xl font-bold text-white">Market Proposals</h1>
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
            <span className="text-gray-400">Proposed:</span>
            <span className="font-semibold text-[#3fb8bd]">{proposedMarkets.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-gray-400">Need 10+ upvotes to activate</span>
          </div>
        </div>
      </div>

      {/* Proposals Grid */}
      {proposedMarkets.length === 0 ? (
        <EmptyState message="No market proposals yet. Be the first to create one!" />
      ) : (
        <div className="grid gap-4">
          {proposedMarkets.map((address) => (
            <ProposalCard key={address} marketAddress={address} />
          ))}
        </div>
      )}

      {/* Info Section */}
      <div className="mt-12 p-6 bg-gray-900 rounded-xl border border-gray-800">
        <h2 className="text-xl font-bold text-white mb-4">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-[#3fb8bd]/20 flex items-center justify-center text-[#3fb8bd] font-bold">
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
