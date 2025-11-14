/**
 * KEKTECH 3.0 - Live Bet Feed Component
 * Real-time feed of betting activity
 */
'use client';

import { useState, useCallback } from 'react';
import { useWatchBetPlaced } from '@/lib/hooks/kektech';
import { formatBasedAmount, formatAddress, formatRelativeTime } from '@/lib/utils';
import { Outcome } from '@/lib/contracts/types';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import type { Address } from 'viem';
import { cn } from '@/lib/utils';

interface BetEvent {
  user: Address;
  outcome: Outcome;
  amount: bigint;
  shares: bigint;
  timestamp: number;
}

interface LiveBetFeedProps {
  marketAddress?: Address;
  limit?: number;
  showMarketAddress?: boolean;
}

/**
 * Live feed of betting activity
 */
export function LiveBetFeed({
  marketAddress,
  limit = 10,
  showMarketAddress: _showMarketAddress = false,
}: LiveBetFeedProps) {
  const [bets, setBets] = useState<BetEvent[]>([]);

  // Watch for new bets
  const handleBet = useCallback((data: {
    bettor: Address;
    amount: bigint;
    outcome: number;
    sharesReceived: bigint;
  }) => {
    const newBet: BetEvent = {
      user: data.bettor,
      outcome: data.outcome as Outcome,
      amount: data.amount,
      shares: data.sharesReceived,
      timestamp: Math.floor(Date.now() / 1000),
    };

    setBets(prev => {
      const updated = [newBet, ...prev];
      return updated.slice(0, limit);
    });
  }, [limit]);

  // Subscribe to bet events (only if marketAddress is provided)
  useWatchBetPlaced(marketAddress!, handleBet);

  if (bets.length === 0) {
    return (
      <div className="p-8 bg-gray-900 rounded-xl border border-gray-800 text-center">
        <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-400 text-sm">No recent bets</p>
        <p className="text-gray-500 text-xs mt-1">
          Bet activity will appear here in real-time
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-800 flex items-center gap-2">
        <Activity className="w-5 h-5 text-kek-green" />
        <h3 className="text-lg font-bold text-white">Live Bet Feed</h3>
        <span className="ml-auto px-2 py-1 bg-green-500/10 text-green-400 rounded-full text-xs font-medium">
          Live
        </span>
      </div>

      {/* Bet list */}
      <div className="divide-y divide-gray-800">
        {bets.map((bet, index) => (
          <div
            key={`${bet.user}-${bet.timestamp}-${index}`}
            className={cn(
              'p-4 hover:bg-gray-800/50 transition',
              index === 0 && 'animate-fade-in'
            )}
          >
            <div className="flex items-center justify-between">
              {/* User & outcome */}
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center',
                    bet.outcome === Outcome.YES ? 'bg-green-500/10' : 'bg-red-500/10'
                  )}
                >
                  {bet.outcome === Outcome.YES ? (
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-gray-300">
                      {formatAddress(bet.user, 4)}
                    </span>
                    <span className="text-xs text-gray-500">bet on</span>
                    <span
                      className={cn(
                        'text-sm font-bold',
                        bet.outcome === Outcome.YES ? 'text-green-400' : 'text-red-400'
                      )}
                    >
                      {bet.outcome === Outcome.YES ? 'YES' : 'NO'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatRelativeTime(bet.timestamp)}
                  </p>
                </div>
              </div>

              {/* Amount */}
              <div className="text-right">
                <p className="text-sm font-bold text-white">
                  {formatBasedAmount(bet.amount, 2)} BASED
                </p>
                <p className="text-xs text-gray-400">
                  {formatBasedAmount(bet.shares, 2)} shares
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* View more */}
      {bets.length >= limit && (
        <div className="px-6 py-3 border-t border-gray-800 text-center">
          <p className="text-xs text-gray-500">
            Showing last {limit} bets
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Compact variant for sidebars
 */
export function CompactLiveBetFeed({ marketAddress }: { marketAddress?: Address }) {
  return <LiveBetFeed marketAddress={marketAddress} limit={5} />;
}
