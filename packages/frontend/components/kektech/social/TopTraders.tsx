/**
 * KEKTECH 3.0 - Top Traders Widget
 * Shows leaderboard of top traders
 */
'use client';

import { Trophy, TrendingUp, User } from 'lucide-react';
import Link from 'next/link';
import { truncate, formatBasedAmount } from '@/lib/utils';

interface Trader {
  address: string;
  volume: bigint;
  wins: number;
  accuracy: number;
}

/**
 * Top traders leaderboard widget
 */
export function TopTraders() {
  // TODO: Replace with actual API data
  const mockTraders: Trader[] = [
    { address: '0x1234567890abcdef1234567890abcdef12345678', volume: BigInt('15000000000000000000'), wins: 42, accuracy: 78.5 },
    { address: '0xabcdef1234567890abcdef1234567890abcdef12', volume: BigInt('12500000000000000000'), wins: 38, accuracy: 72.3 },
    { address: '0x9876543210fedcba9876543210fedcba98765432', volume: BigInt('10800000000000000000'), wins: 35, accuracy: 69.8 },
    { address: '0xfedcba9876543210fedcba9876543210fedcba98', volume: BigInt('9200000000000000000'), wins: 31, accuracy: 65.2 },
    { address: '0x5678901234abcdef5678901234abcdef56789012', volume: BigInt('7500000000000000000'), wins: 28, accuracy: 62.5 },
  ];

  const getMedalColor = (index: number) => {
    switch (index) {
      case 0: return 'text-[#FFD700]'; // Gold
      case 1: return 'text-[#C0C0C0]'; // Silver
      case 2: return 'text-[#CD7F32]'; // Bronze
      default: return 'text-terminal-tertiary';
    }
  };

  return (
    <div className="terminal-card p-4">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-[#FFD700]" />
        <h3 className="text-base font-bold text-terminal-primary">Top Traders</h3>
      </div>

      <div className="space-y-2">
        {mockTraders.map((trader, index) => (
          <Link
            key={trader.address}
            href={`/profile/${trader.address}`}
            className="block p-3 hover:bg-terminal-elevated rounded-lg transition group"
          >
            <div className="flex items-center gap-3">
              {/* Rank */}
              <div className="flex-shrink-0 w-6 text-center">
                {index < 3 ? (
                  <Trophy className={`w-4 h-4 ${getMedalColor(index)}`} />
                ) : (
                  <span className="text-xs text-terminal-tertiary mono-numbers">
                    #{index + 1}
                  </span>
                )}
              </div>

              {/* Avatar */}
              <div className="w-8 h-8 rounded-lg bg-kek-green/10 border border-kek-green/20 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-kek-green" />
              </div>

              {/* Trader Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-terminal-primary group-hover:text-kek-green transition mono-numbers truncate">
                    {truncate(trader.address, 12)}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-terminal-tertiary">
                    {formatBasedAmount(trader.volume)} vol
                  </span>
                  <span className="text-xs text-terminal-tertiary">
                    {trader.wins}W
                  </span>
                  <span className={`text-xs font-semibold mono-numbers ${
                    trader.accuracy >= 70 ? 'text-bullish' : trader.accuracy >= 60 ? 'text-[#d29922]' : 'text-terminal-tertiary'
                  }`}>
                    {trader.accuracy.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Trend Indicator */}
              <TrendingUp className="w-4 h-4 text-bullish flex-shrink-0 opacity-0 group-hover:opacity-100 transition" />
            </div>
          </Link>
        ))}
      </div>

      {/* View Full Leaderboard Link */}
      <Link
        href="/leaderboard"
        className="block mt-4 pt-3 border-t border-terminal text-center text-sm text-kek-green hover:text-kek-green/80 transition"
      >
        View full leaderboard
      </Link>
    </div>
  );
}
