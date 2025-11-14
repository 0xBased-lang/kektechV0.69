/**
 * KEKTECH 3.0 - Trending Markets Hook
 * Calculates trending markets based on activity metrics
 */
import { useMemo } from 'react';
import { useMarketInfoList } from './useMarketInfoList';
import { MarketState } from '@/lib/contracts/types';
import type { Address } from 'viem';

interface TrendingScore {
  address: Address;
  score: number;
  volume: bigint;
  createdAt: number;
  state: MarketState;
}

/**
 * Calculate trending score for markets
 *
 * Scoring Algorithm:
 * - Volume: Higher volume = higher score (40% weight)
 * - Recency: Newer markets = higher score (30% weight)
 * - State: ACTIVE > PROPOSED > others (20% weight)
 * - Activity: More engagement = higher score (10% weight - future)
 *
 * @param markets - Array of market addresses
 * @param limit - Maximum number of trending markets to return
 * @returns Sorted array of trending market addresses
 */
export function useTrendingMarkets(markets: Address[] | undefined, limit: number = 5): Address[] {
  // Fetch market info for all markets using the safe hook
  const { marketInfos } = useMarketInfoList(markets);

  // Calculate trending scores
  const trendingScores = useMemo(() => {
    const now = Date.now() / 1000; // Current time in seconds

    const scores: TrendingScore[] = marketInfos
      .filter(({ info }) => info !== null) // Only calculate for loaded markets
      .map(({ address, info }) => {
        if (!info) {
          return {
            address,
            score: 0,
            volume: 0n,
            createdAt: 0,
            state: MarketState.PROPOSED,
          };
        }

        // 1. Volume Score (40% weight)
        const totalVolume = (info.totalYesShares || 0n) + (info.totalNoShares || 0n);
        const volumeInBased = Number(totalVolume) / 1e18;
        const volumeScore = Math.min(volumeInBased / 100, 1.0); // Max score at 100 BASED volume

        // 2. Recency Score (30% weight)
        const createdAt = Number(info.createdAt || 0);
        const age = now - createdAt;
        let recencyScore = 0;
        if (age < 86400) { // < 1 day
          recencyScore = 1.0;
        } else if (age < 3 * 86400) { // < 3 days
          recencyScore = 0.8;
        } else if (age < 7 * 86400) { // < 7 days
          recencyScore = 0.5;
        } else if (age < 30 * 86400) { // < 30 days
          recencyScore = 0.2;
        } else {
          recencyScore = 0.1; // Older than 30 days
        }

        // 3. State Score (20% weight)
        let stateScore = 0;
        switch (info.state) {
          case MarketState.ACTIVE:
            stateScore = 1.0; // Active markets are most interesting
            break;
          case MarketState.PROPOSED:
            stateScore = 0.7; // Proposals need attention
            break;
          case MarketState.APPROVED:
            stateScore = 0.6; // Approved, waiting activation
            break;
          case MarketState.RESOLVING:
            stateScore = 0.8; // Resolution is exciting
            break;
          case MarketState.FINALIZED:
            stateScore = 0.3; // Already settled
            break;
          case MarketState.DISPUTED:
            stateScore = 0.5; // Disputed markets are interesting
            break;
          default:
            stateScore = 0;
        }

        // 4. Activity Score (10% weight - placeholder for future)
        // TODO: Add comment count, vote count, recent trades
        const activityScore = 0.5; // Neutral for now

        // Calculate final score (weighted average)
        const finalScore =
          (volumeScore * 0.4) +
          (recencyScore * 0.3) +
          (stateScore * 0.2) +
          (activityScore * 0.1);

        return {
          address,
          score: finalScore,
          volume: totalVolume,
          createdAt,
          state: info.state,
        };
      });

    // Sort by score (highest first)
    return scores.sort((a, b) => b.score - a.score);
  }, [marketInfos]);

  // Return top N trending market addresses
  return trendingScores.slice(0, limit).map(({ address }) => address);
}
