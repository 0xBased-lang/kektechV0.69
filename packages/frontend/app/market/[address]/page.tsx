/**
 * KEKTECH 3.0 - Market Detail Page with Social Engagement
 * Individual market page with betting, comments, and community features
 */
'use client';

import { use } from 'react';
import { useMarketInfo } from '@/lib/hooks/kektech';
import { LoadingSpinner } from '@/components/kektech/ui/LoadingSpinner';
import { ArrowLeft, Users, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { type Address } from 'viem';
import { MarketState } from '@/lib/contracts/types';

// Engagement Components
import {
  ProposalVoteButtons,
  CommentSection,
  ResolutionVoteForm,
  ResolutionVoteDisplay
} from '@/components/engagement';

// Market Components
import { BettingInterface } from '@/components/kektech/market-details/BettingInterface';

interface MarketPageProps {
  params: Promise<{ address: string }>;
}

export default function MarketPage({ params }: MarketPageProps) {
  const { address } = use(params);
  const marketAddress = address as Address;

  // 🚨 CRITICAL FIX: useMarketInfo returns properties directly, not wrapped in 'info' object
  const {
    state,
    question,
    outcome1Name: _outcome1Name,
    outcome2Name: _outcome2Name,
    creator: _creator,
    resolutionTime: _resolutionTime,
    isResolved: _isResolved,
    totalBets: _totalBets,
    totalVolume: _totalVolume,
    isLoading,
    hasError,
    usingFallback
  } = useMarketInfo(marketAddress);

  // 🔍 DEBUG: Log market data
  console.log('🎯 Market Page Debug:', {
    marketAddress,
    state,
    question,
    isLoading,
    hasError,
    usingFallback
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading market..." />
      </div>
    );
  }

  if (hasError || !question) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-2">Market Not Found</h2>
          <p className="text-gray-400 mb-6">This market doesn't exist or failed to load</p>
          <Link
            href="/markets"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#3fb8bd] hover:bg-[#3fb8bd]/90 text-white font-semibold rounded-xl transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Markets
          </Link>
        </div>
      </div>
    );
  }

  const getStateLabel = (state: MarketState) => {
    const labels = {
      [MarketState.PROPOSED]: '💡 Proposed',
      [MarketState.APPROVED]: '✅ Approved',
      [MarketState.ACTIVE]: '📈 Active',
      [MarketState.RESOLVING]: '⏳ Resolving',
      [MarketState.DISPUTED]: '⚖️ Disputed',
      [MarketState.FINALIZED]: '✅ Finalized',
    };
    return labels[state] || 'Unknown';
  };

  const getStateColor = (state: MarketState) => {
    const colors = {
      [MarketState.PROPOSED]: 'text-yellow-500 bg-yellow-500/10',
      [MarketState.APPROVED]: 'text-green-500 bg-green-500/10',
      [MarketState.ACTIVE]: 'text-[#3fb8bd] bg-[#3fb8bd]/10',
      [MarketState.RESOLVING]: 'text-orange-500 bg-orange-500/10',
      [MarketState.DISPUTED]: 'text-red-500 bg-red-500/10',
      [MarketState.FINALIZED]: 'text-emerald-500 bg-emerald-500/10',
    };
    return colors[state] || 'text-gray-500 bg-gray-500/10';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-950/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/markets"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Markets
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${getStateColor(state ?? MarketState.PROPOSED)}`}>
                  {getStateLabel(state ?? MarketState.PROPOSED)}
                </span>
                <span className="text-gray-500 text-sm">
                  {marketAddress.slice(0, 6)}...{marketAddress.slice(-4)}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Market Details
              </h1>
              <p className="text-gray-400">
                View odds, place bets, and engage with the community
              </p>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <div className="text-center">
                <Users className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                <div className="text-white font-semibold">--</div>
                <div className="text-gray-500">Traders</div>
              </div>
              <div className="text-center">
                <MessageSquare className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                <div className="text-white font-semibold">--</div>
                <div className="text-gray-500">Comments</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content - Market Info & Trading (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Market Stats */}
            <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
              <h3 className="text-lg font-bold text-white mb-4">Market Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-gray-400 text-sm mb-1">State</div>
                  <div className="text-white font-semibold">{getStateLabel(state)}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm mb-1">Total Volume</div>
                  <div className="text-white font-semibold">-- BASED</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm mb-1">Total Traders</div>
                  <div className="text-white font-semibold">--</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm mb-1">Created</div>
                  <div className="text-white font-semibold">--</div>
                </div>
              </div>
            </div>

            {/* Trading Interface - ACTIVE Markets */}
            {state === MarketState.ACTIVE && (
              <BettingInterface marketAddress={marketAddress} />
            )}

            {/* Proposal Voting - PROPOSED Markets */}
            {state === MarketState.PROPOSED && (
              <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
                <h3 className="text-lg font-bold text-white mb-4">Community Voting</h3>
                <p className="text-gray-400 mb-4">
                  This market needs 10+ net upvotes to be activated for trading.
                </p>
                <ProposalVoteButtons marketAddress={marketAddress} />
              </div>
            )}

            {/* Resolution Voting - RESOLVING Markets */}
            {state === MarketState.RESOLVING && (
              <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
                <h3 className="text-lg font-bold text-white mb-4">Resolution Voting</h3>
                <p className="text-gray-400 mb-4">
                  Help determine the outcome by voting and providing evidence.
                </p>
                <ResolutionVoteForm marketAddress={marketAddress} />
              </div>
            )}

            {/* Resolution Results - FINALIZED Markets */}
            {state === MarketState.FINALIZED && (
              <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
                <h3 className="text-lg font-bold text-white mb-4">Resolution Results</h3>
                <ResolutionVoteDisplay marketAddress={marketAddress} />
              </div>
            )}

            {/* Comments Section - ALL STATES */}
            <CommentSection marketAddress={marketAddress} />
          </div>

          {/* Right Sidebar - Market Info (1/3 width) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Quick Info */}
              <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4">
                <h4 className="font-semibold text-white mb-3">Quick Info</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Address</span>
                    <span className="text-white font-mono">
                      {marketAddress.slice(0, 6)}...{marketAddress.slice(-4)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status</span>
                    <span className={`font-semibold ${getStateColor(state).split(' ')[0]}`}>
                      {getStateLabel(state)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Network</span>
                    <span className="text-white">BasedAI</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4">
                <h4 className="font-semibold text-white mb-3">Actions</h4>
                <div className="space-y-2">
                  <button className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition text-sm">
                    Share Market
                  </button>
                  <button className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition text-sm">
                    View on Explorer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
