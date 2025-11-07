/**
 * KEKTECH 3.0 - Market Card Component
 * Individual market preview card
 */
'use client';

import { useMarketInfo } from '@/lib/hooks/kektech';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { MarketState } from '@/lib/contracts/types';
import { formatBasedAmount, formatPercentage, formatRelativeTime, truncate } from '@/lib/utils';
import { TrendingUp, Users, Clock, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import type { Address } from 'viem';

interface MarketCardProps {
  marketAddress: Address;
  compact?: boolean;
}

const stateConfig = {
  [MarketState.PROPOSED]: {
    label: 'Proposed',
    color: 'text-gray-400',
    bg: 'bg-gray-500/10',
  },
  [MarketState.APPROVED]: {
    label: 'Approved',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  [MarketState.ACTIVE]: {
    label: 'Active',
    color: 'text-green-400',
    bg: 'bg-green-500/10',
  },
  [MarketState.RESOLVING]: {
    label: 'Resolving',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
  },
  [MarketState.DISPUTED]: {
    label: 'Disputed',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
  },
  [MarketState.FINALIZED]: {
    label: 'Finalized',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
  },
};

/**
 * Market card with preview information
 */
export function MarketCard({ marketAddress, compact = false }: MarketCardProps) {
  const market = useMarketInfo(marketAddress, true);

  if (market.isLoading) {
    return (
      <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (!market.question) {
    return null;
  }

  const totalShares = (market.totalYesShares || 0n) + (market.totalNoShares || 0n);
  const yesPercentage = totalShares > 0n ? (Number(market.totalYesShares) / Number(totalShares)) * 100 : 50;
  const noPercentage = 100 - yesPercentage;

  const config = stateConfig[market.state || MarketState.PROPOSED];

  return (
    <Link href={`/markets/${marketAddress}`}>
      <div className="group p-6 bg-gray-900 rounded-xl border border-gray-800 hover:border-[#3fb8bd] transition cursor-pointer">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-[#3fb8bd] transition line-clamp-2">
              {market.question}
            </h3>
            {!compact && market.description && (
              <p className="text-sm text-gray-400 line-clamp-2">
                {truncate(market.description, 150)}
              </p>
            )}
          </div>

          {/* State badge */}
          <div className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-3 ${config.bg} ${config.color}`}>
            {config.label}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">Volume</p>
              <p className="text-sm font-semibold text-white">
                {formatBasedAmount(market.totalYesShares + market.totalNoShares)} BASED
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">Created</p>
              <p className="text-sm font-semibold text-white">
                {formatRelativeTime(Number(market.createdAt))}
              </p>
            </div>
          </div>
        </div>

        {/* Price chart */}
        {market.state === MarketState.ACTIVE && (
          <div className="mb-4">
            <div className="flex justify-between mb-2 text-xs">
              <span className="text-green-400 font-semibold">YES {formatPercentage(yesPercentage)}</span>
              <span className="text-red-400 font-semibold">NO {formatPercentage(noPercentage)}</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden flex">
              <div
                className="bg-green-500 transition-all"
                style={{ width: `${yesPercentage}%` }}
              />
              <div
                className="bg-red-500 transition-all"
                style={{ width: `${noPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Outcome (for finalized markets) */}
        {market.state === MarketState.FINALIZED && market.outcome !== undefined && (
          <div className="flex items-center gap-2 p-3 bg-purple-500/10 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-purple-400" />
            <span className="text-sm font-semibold text-purple-400">
              Outcome: {market.outcome === 1 ? 'YES' : market.outcome === 2 ? 'NO' : 'INVALID'}
            </span>
          </div>
        )}

        {/* Category tag */}
        {market.category && (
          <div className="mt-4 inline-flex items-center px-3 py-1 bg-gray-800 rounded-full text-xs text-gray-300">
            <TrendingUp className="w-3 h-3 mr-1" />
            {market.category}
          </div>
        )}
      </div>
    </Link>
  );
}

/**
 * Compact market card for lists
 */
export function CompactMarketCard({ marketAddress }: { marketAddress: Address }) {
  return <MarketCard marketAddress={marketAddress} compact />;
}
