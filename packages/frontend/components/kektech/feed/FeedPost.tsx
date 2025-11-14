/**
 * KEKTECH 3.0 - Feed Post Component
 * Individual activity post in Twitter-style format
 */
'use client';

import { TrendingUp, MessageSquare, DollarSign, Vote, CheckCircle, User, Clock } from 'lucide-react';
import Link from 'next/link';
import { formatRelativeTime, truncate } from '@/lib/utils';
import type { Activity } from './ActivityFeed';

interface FeedPostProps {
  activity: Activity;
}

const ACTIVITY_CONFIG = {
  market_created: {
    icon: TrendingUp,
    color: 'text-kek-green',
    bgColor: 'bg-kek-green/10',
    label: 'created a market',
  },
  bet_placed: {
    icon: DollarSign,
    color: 'text-[#d29922]',
    bgColor: 'bg-[#d29922]/10',
    label: 'placed a bet',
  },
  comment: {
    icon: MessageSquare,
    color: 'text-[#58a6ff]',
    bgColor: 'bg-[#58a6ff]/10',
    label: 'commented',
  },
  resolution_vote: {
    icon: Vote,
    color: 'text-[#bc8cff]',
    bgColor: 'bg-[#bc8cff]/10',
    label: 'voted on resolution',
  },
  market_resolved: {
    icon: CheckCircle,
    color: 'text-[#3fb950]',
    bgColor: 'bg-[#3fb950]/10',
    label: 'resolved',
  },
};

/**
 * Individual feed post component
 */
export function FeedPost({ activity }: FeedPostProps) {
  const config = ACTIVITY_CONFIG[activity.type];
  const Icon = config.icon;

  return (
    <div className="terminal-card terminal-hover p-4">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        {/* User Avatar */}
        <div className={`p-2 rounded-lg ${config.bgColor} flex-shrink-0`}>
          <User className={`w-4 h-4 ${config.color}`} />
        </div>

        {/* Post Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-terminal-primary font-semibold text-sm mono-numbers">
              {truncate(activity.userAddress, 12)}
            </span>
            <span className="text-terminal-tertiary text-xs">{config.label}</span>
            <span className="text-terminal-tertiary text-xs">•</span>
            <span className="text-terminal-tertiary text-xs flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatRelativeTime(Math.floor(activity.timestamp / 1000))}
            </span>
          </div>

          {/* Activity Type Badge */}
          <div className="mt-1.5">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${config.bgColor} ${config.color}`}>
              <Icon className="w-3 h-3" />
              {activity.type.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Content Based on Activity Type */}
      {activity.type === 'market_created' && (
        <div className="ml-11">
          <Link
            href={`/feels-good-markets/kek-futures/market/${activity.marketAddress}`}
            className="block p-3 bg-terminal-elevated hover:bg-terminal-bg-hover rounded-lg border border-terminal hover:border-kek-green/50 transition"
          >
            <div className="flex items-start gap-2">
              <TrendingUp className="w-4 h-4 text-kek-green mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-terminal-primary">
                  {activity.metadata?.marketQuestion}
                </p>
                <p className="text-xs text-terminal-tertiary mt-1">
                  Click to view market details and place bets
                </p>
              </div>
            </div>
          </Link>
        </div>
      )}

      {activity.type === 'bet_placed' && (
        <div className="ml-11">
          <div className="p-3 bg-terminal-elevated rounded-lg border border-terminal">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-terminal-tertiary">Bet Details</span>
              <span className={`text-sm font-bold ${activity.metadata?.betSide === 'YES' ? 'text-bullish' : 'text-bearish'} mono-numbers`}>
                {activity.metadata?.betSide}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-terminal-secondary">Amount</span>
              <span className="text-sm font-semibold text-terminal-primary mono-numbers">
                {activity.metadata?.betAmount}
              </span>
            </div>
            {activity.metadata?.marketQuestion && (
              <Link
                href={`/feels-good-markets/kek-futures/market/${activity.marketAddress}`}
                className="block mt-2 pt-2 border-t border-terminal"
              >
                <p className="text-xs text-terminal-tertiary hover:text-kek-green transition">
                  {truncate(activity.metadata.marketQuestion, 60)}
                </p>
              </Link>
            )}
          </div>
        </div>
      )}

      {activity.type === 'comment' && activity.content && (
        <div className="ml-11">
          <div className="p-3 bg-terminal-elevated rounded-lg border border-terminal">
            <p className="text-sm text-terminal-secondary mb-2 line-clamp-3">
              {activity.content}
            </p>
            {activity.metadata?.marketQuestion && (
              <Link
                href={`/feels-good-markets/kek-futures/market/${activity.marketAddress}`}
                className="block pt-2 border-t border-terminal"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-3 h-3 text-kek-green" />
                  <p className="text-xs text-terminal-tertiary hover:text-kek-green transition">
                    on: {truncate(activity.metadata.marketQuestion, 50)}
                  </p>
                </div>
              </Link>
            )}
          </div>
        </div>
      )}

      {activity.type === 'resolution_vote' && (
        <div className="ml-11">
          <div className="p-3 bg-terminal-elevated rounded-lg border border-terminal">
            <div className="flex items-center justify-between">
              <span className="text-sm text-terminal-secondary">Voted for outcome</span>
              <span className={`text-sm font-bold ${activity.metadata?.outcome === 'YES' ? 'text-bullish' : activity.metadata?.outcome === 'NO' ? 'text-bearish' : 'text-terminal-tertiary'} mono-numbers`}>
                {activity.metadata?.outcome}
              </span>
            </div>
            {activity.metadata?.marketQuestion && (
              <Link
                href={`/feels-good-markets/kek-futures/market/${activity.marketAddress}`}
                className="block mt-2 pt-2 border-t border-terminal"
              >
                <p className="text-xs text-terminal-tertiary hover:text-kek-green transition">
                  {truncate(activity.metadata.marketQuestion, 60)}
                </p>
              </Link>
            )}
          </div>
        </div>
      )}

      {activity.type === 'market_resolved' && (
        <div className="ml-11">
          <div className="p-3 bg-[#3fb950]/10 rounded-lg border border-[#3fb950]/20">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-[#3fb950]" />
              <span className="text-sm font-semibold text-[#3fb950]">
                Market Resolved: {activity.metadata?.outcome}
              </span>
            </div>
            {activity.metadata?.marketQuestion && (
              <Link
                href={`/feels-good-markets/kek-futures/market/${activity.marketAddress}`}
                className="block"
              >
                <p className="text-xs text-terminal-tertiary hover:text-kek-green transition">
                  {truncate(activity.metadata.marketQuestion, 60)}
                </p>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
