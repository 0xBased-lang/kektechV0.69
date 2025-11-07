/**
 * KEKTECH 3.0 - Position Card Component
 * Display user's position in a prediction market
 */
'use client';

import { useUserPosition, useMarketInfo } from '@/lib/hooks/kektech';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { MarketState, Outcome } from '@/lib/contracts/types';
import { formatBasedAmount } from '@/lib/utils';
import { TrendingUp, TrendingDown, Trophy, Clock } from 'lucide-react';
import Link from 'next/link';
import type { Address } from 'viem';
import { cn } from '@/lib/utils';

interface PositionCardProps {
  marketAddress: Address;
  userAddress: Address;
  showMarketInfo?: boolean;
}

/**
 * Card showing user's position in a single market
 */
export function PositionCard({
  marketAddress,
  userAddress,
  showMarketInfo = true,
}: PositionCardProps) {
  const position = useUserPosition(marketAddress, userAddress);
  const market = useMarketInfo(marketAddress, true);

  if (position.isLoading || market.isLoading) {
    return (
      <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  // No position
  if (!position.yesShares && !position.noShares) {
    return null;
  }

  const hasYesShares = position.yesShares && position.yesShares > 0n;
  const hasNoShares = position.noShares && position.noShares > 0n;
  const totalInvested = (position.yesInvestment || 0n) + (position.noInvestment || 0n);

  // Calculate potential profit (simplified)
  const isFinalized = market.state === MarketState.FINALIZED;
  const wonMarket = isFinalized && (
    (market.outcome === Outcome.YES && hasYesShares) ||
    (market.outcome === Outcome.NO && hasNoShares)
  );

  return (
    <Link href={`/markets/${marketAddress}`}>
      <div className="group p-6 bg-gray-900 rounded-xl border border-gray-800 hover:border-[#3fb8bd] transition cursor-pointer">
        {/* Market info (if enabled) */}
        {showMarketInfo && market.question && (
          <div className="mb-4 pb-4 border-b border-gray-800">
            <h3 className="font-semibold text-white group-hover:text-[#3fb8bd] transition line-clamp-2">
              {market.question}
            </h3>
            {market.category && (
              <span className="inline-block mt-2 px-2 py-1 bg-gray-800 rounded text-xs text-gray-300">
                {market.category}
              </span>
            )}
          </div>
        )}

        {/* Position summary */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* YES shares */}
          {hasYesShares && (
            <div className={cn(
              'p-3 rounded-lg',
              wonMarket && market.outcome === Outcome.YES ? 'bg-green-500/10' : 'bg-gray-800'
            )}>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-sm font-medium text-green-400">YES</span>
                {wonMarket && market.outcome === Outcome.YES && (
                  <Trophy className="w-4 h-4 text-yellow-400 ml-auto" />
                )}
              </div>
              <p className="text-lg font-bold text-white">
                {formatBasedAmount(position.yesShares || 0n, 2)}
              </p>
              <p className="text-xs text-gray-400">shares</p>
            </div>
          )}

          {/* NO shares */}
          {hasNoShares && (
            <div className={cn(
              'p-3 rounded-lg',
              wonMarket && market.outcome === Outcome.NO ? 'bg-red-500/10' : 'bg-gray-800'
            )}>
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-red-400" />
                <span className="text-sm font-medium text-red-400">NO</span>
                {wonMarket && market.outcome === Outcome.NO && (
                  <Trophy className="w-4 h-4 text-yellow-400 ml-auto" />
                )}
              </div>
              <p className="text-lg font-bold text-white">
                {formatBasedAmount(position.noShares || 0n, 2)}
              </p>
              <p className="text-xs text-gray-400">shares</p>
            </div>
          )}
        </div>

        {/* Investment info */}
        <div className="flex items-center justify-between text-sm">
          <div>
            <p className="text-gray-400">Invested</p>
            <p className="font-semibold text-white">
              {formatBasedAmount(totalInvested, 4)} BASED
            </p>
          </div>

          {/* Market status */}
          <div className="flex items-center gap-2">
            {isFinalized ? (
              wonMarket ? (
                <span className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-xs font-medium">
                  Won! 🎉
                </span>
              ) : (
                <span className="px-3 py-1 bg-gray-800 text-gray-400 rounded-full text-xs font-medium">
                  Closed
                </span>
              )
            ) : market.state === MarketState.ACTIVE ? (
              <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-xs font-medium flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Active
              </span>
            ) : (
              <span className="px-3 py-1 bg-gray-800 text-gray-400 rounded-full text-xs font-medium">
                {market.state === MarketState.RESOLVING ? 'Resolving' : 'Pending'}
              </span>
            )}
          </div>
        </div>

        {/* Claim indicator (if applicable) */}
        {wonMarket && (
          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <p className="text-sm text-green-400 font-medium text-center">
              You can claim your winnings! 💰
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}
