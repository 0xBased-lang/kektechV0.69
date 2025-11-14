/**
 * KEKTECH 3.0 - Market Card Component
 * Individual market preview card
 */
'use client';

import { useMarketInfo } from '@/lib/hooks/kektech';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { MarketState } from '@/lib/contracts/types';
import { formatBasedAmount, formatPercentage, formatRelativeTime } from '@/lib/utils';
import { TrendingUp, Users, Clock, CheckCircle2, Pin, Flame, DollarSign, Zap } from 'lucide-react';
import Link from 'next/link';
import type { Address } from 'viem';

/**
 * Calculate engagement score (0-100) based on market metrics
 */
function calculateEngagementScore(
  totalShares: bigint,
  createdAt: bigint,
  state: MarketState
): number {
  const now = BigInt(Math.floor(Date.now() / 1000));
  const age = Number(now - createdAt);
  const dayInSeconds = 86400;

  // Volume score (0-40 points)
  const volumeInBased = Number(totalShares) / 1e18;
  const volumeScore = Math.min(volumeInBased / 100 * 40, 40);

  // Recency score (0-30 points) - decays over 7 days
  const maxAge = 7 * dayInSeconds;
  const recencyScore = Math.max(0, 30 * (1 - age / maxAge));

  // State score (0-30 points)
  const stateScores = {
    [MarketState.PROPOSED]: 10,
    [MarketState.APPROVED]: 15,
    [MarketState.ACTIVE]: 30,
    [MarketState.RESOLVING]: 25,
    [MarketState.DISPUTED]: 20,
    [MarketState.FINALIZED]: 5,
  };
  const stateScore = stateScores[state] || 0;

  return Math.round(volumeScore + recencyScore + stateScore);
}

/**
 * Determine priority badge for market
 */
function getPriorityBadge(
  score: number,
  totalShares: bigint,
  state: MarketState
): { type: 'urgent' | 'high' | 'medium' | null; label: string; icon: typeof Flame } | null {
  const volumeInBased = Number(totalShares) / 1e18;

  // 🚨 URGENT: Resolving state
  if (state === MarketState.RESOLVING || state === MarketState.DISPUTED) {
    return { type: 'urgent', label: 'URGENT', icon: Flame };
  }

  // 🎯 CONSENSUS: High engagement score
  if (score >= 70) {
    return { type: 'high', label: 'TRENDING', icon: TrendingUp };
  }

  // 💰 HIGH STAKES: Large volume
  if (volumeInBased >= 50) {
    return { type: 'medium', label: 'HIGH STAKES', icon: DollarSign };
  }

  return null;
}

interface MarketCardProps {
  marketAddress: Address;
  compact?: boolean;
  /** Show pin button (HOT tab only) */
  showPinButton?: boolean;
  /** Is this market pinned by user */
  isPinned?: boolean;
  /** Callback when pin button clicked */
  onTogglePin?: () => void;
}

const stateConfig = {
  [MarketState.PROPOSED]: {
    label: 'Proposed',
    color: 'text-terminal-tertiary',
    bg: 'bg-terminal-bg-tertiary',
  },
  [MarketState.APPROVED]: {
    label: 'Approved',
    color: 'text-[#58a6ff]',
    bg: 'bg-[#58a6ff]/10',
  },
  [MarketState.ACTIVE]: {
    label: 'Active',
    color: 'text-[#3fb950]',
    bg: 'bg-[#3fb950]/10',
  },
  [MarketState.RESOLVING]: {
    label: 'Resolving',
    color: 'text-[#d29922]',
    bg: 'bg-[#d29922]/10',
  },
  [MarketState.DISPUTED]: {
    label: 'Disputed',
    color: 'text-[#f85149]',
    bg: 'bg-[#f85149]/10',
  },
  [MarketState.FINALIZED]: {
    label: 'Finalized',
    color: 'text-[#bc8cff]',
    bg: 'bg-[#bc8cff]/10',
  },
};

/**
 * Market card with preview information
 */
export function MarketCard({
  marketAddress,
  compact = false,
  showPinButton = false,
  isPinned = false,
  onTogglePin
}: MarketCardProps) {
  const market = useMarketInfo(marketAddress, true);

  if (market.isLoading) {
    return (
      <div className="p-6 bg-terminal-card rounded-lg border border-terminal">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (!market.question) {
    return null;
  }

  const totalVolume = market.totalVolume || 0n;
  const yesPercentage = 50;
  const noPercentage = 50;

  const config = stateConfig[market.state || MarketState.PROPOSED];

  // Calculate engagement metrics
  const engagementScore = calculateEngagementScore(
    totalVolume,
    market.createdAt || 0n,
    market.state || MarketState.PROPOSED
  );

  const priorityBadge = getPriorityBadge(
    engagementScore,
    totalVolume,
    market.state || MarketState.PROPOSED
  );
  const cardClasses = compact
    ? 'group terminal-card terminal-hover cursor-pointer px-4 py-3'
    : 'group terminal-card terminal-hover cursor-pointer';

  return (
    <div className="relative">
      {/* Pin Button (if enabled) */}
      {showPinButton && onTogglePin && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onTogglePin();
          }}
          className={`absolute top-4 right-4 z-10 p-2 rounded-lg transition ${
            isPinned
              ? 'bg-kek-green/20 hover:bg-kek-green/30 text-kek-green'
              : 'bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white'
          }`}
          title={isPinned ? 'Unpin market' : 'Pin market'}
        >
          <Pin className={`w-4 h-4 ${isPinned ? 'fill-current' : ''}`} />
        </button>
      )}

      <Link href={`/feels-good-markets/kek-futures/market/${marketAddress}`}>
        <div className={cardClasses}>
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              {/* Title with engagement indicator */}
              <div className="flex items-start gap-2 mb-1">
                <h3 className="text-base font-bold text-terminal-primary group-hover:text-kek-green transition line-clamp-2">
                  {market.question}
                </h3>
              </div>

            </div>

            {/* State badge */}
            <div className={`px-2.5 py-0.5 rounded text-xs font-semibold whitespace-nowrap ml-3 ${config.bg} ${config.color}`}>
              {config.label}
            </div>
          </div>

          {/* Engagement Score & Priority Badge */}
          <div className="flex items-center gap-2 mb-3">
            {/* Engagement Score */}
            <div className="engagement-score">
              <Zap className="w-3 h-3 text-kek-green" />
              <span className="text-terminal-primary">{engagementScore}</span>
            </div>

            {/* Priority Badge */}
            {priorityBadge && (
              <div className={`badge-${priorityBadge.type} flex items-center gap-1`}>
                <priorityBadge.icon className="w-3 h-3" />
                {priorityBadge.label}
              </div>
            )}
          </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-terminal-elevated rounded">
              <Users className="w-3.5 h-3.5 text-kek-green" />
            </div>
            <div>
              <p className="text-xs text-terminal-tertiary">Volume</p>
              <p className="text-sm font-semibold text-terminal-primary mono-numbers">
                {formatBasedAmount(totalVolume)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-terminal-elevated rounded">
              <Clock className="w-3.5 h-3.5 text-kek-green" />
            </div>
            <div>
              <p className="text-xs text-terminal-tertiary">Created</p>
              <p className="text-sm font-semibold text-terminal-secondary">
                {formatRelativeTime(Number(market.createdAt))}
              </p>
            </div>
          </div>
        </div>

        {/* YES/NO Percentage Bar - Enhanced Terminal Style */}
        {market.state === MarketState.ACTIVE && (
          <div className="mb-3">
            <div className="flex justify-between mb-1.5 text-xs">
              <span className="text-bullish font-bold mono-numbers">
                YES {formatPercentage(yesPercentage)}
              </span>
              <span className="text-bearish font-bold mono-numbers">
                NO {formatPercentage(noPercentage)}
              </span>
            </div>
            <div className="percentage-bar">
              <div
                className="percentage-bar-yes"
                style={{ width: `${yesPercentage}%` }}
              />
              <div
                className="percentage-bar-no"
                style={{ width: `${noPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Outcome (for finalized markets) */}
        {market.state === MarketState.FINALIZED && market.result !== undefined && (
          <div className="flex items-center gap-2 p-2.5 bg-[#bc8cff]/10 rounded border border-[#bc8cff]/20">
            <CheckCircle2 className="w-4 h-4 text-[#bc8cff]" />
            <span className="text-sm font-semibold text-[#bc8cff] mono-numbers">
              OUTCOME: {market.result === 1 ? 'YES' : market.result === 2 ? 'NO' : 'INVALID'}
            </span>
          </div>
        )}
        </div>
      </Link>
    </div>
  );
}

/**
 * Compact market card for lists
 */
export function CompactMarketCard({ marketAddress }: { marketAddress: Address }) {
  return <MarketCard marketAddress={marketAddress} compact />;
}
