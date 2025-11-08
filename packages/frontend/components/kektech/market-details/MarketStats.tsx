/**
 * KEKTECH 3.0 - Market Stats Component
 * Advanced market statistics and analytics
 */
'use client';

import { useMarketInfo, useMarketOdds } from '@/lib/hooks/kektech';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { formatBasedAmount, formatPercentage } from '@/lib/utils';
import { TrendingUp, TrendingDown, Users, DollarSign, BarChart3, PieChart } from 'lucide-react';
import type { Address } from 'viem';

interface MarketStatsProps {
  marketAddress: Address;
}

/**
 * Market statistics display
 *
 * CRITICAL: Uses contract's getOdds() which includes VirtualLiquidity!
 * - Empty market: Shows 2.0x odds on both sides (not 50%/50%!)
 * - Uses implied probabilities from odds, not raw share distribution
 */
export function MarketStats({ marketAddress }: MarketStatsProps) {
  const market = useMarketInfo(marketAddress, true);
  const odds = useMarketOdds(marketAddress, true);

  if (market.isLoading || odds.isLoading) {
    return (
      <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (!market.question) {
    return null;
  }

  // Use IMPLIED PROBABILITIES from contract odds (includes VirtualLiquidity!)
  // DO NOT calculate from raw shares - that misses virtual liquidity!
  const yesPercentage = odds.odds1Probability;
  const noPercentage = odds.odds2Probability;
  const totalShares = (market.totalYesShares || 0n) + (market.totalNoShares || 0n);
  const totalVolume = totalShares;

  // Calculate liquidity (simplified - in production, get from contract)
  const liquidity = totalShares; // Placeholder

  return (
    <div className="space-y-6">
      {/* Price Chart */}
      <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-[#3fb8bd]" />
          <h3 className="text-lg font-bold text-white">Current Odds</h3>
        </div>

        <div className="space-y-4">
          {/* YES bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-sm font-semibold text-green-400">YES</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-green-400">
                  {odds.odds1Multiplier.toFixed(2)}x
                </span>
                <span className="text-xs text-gray-400 ml-2">
                  ({formatPercentage(yesPercentage)})
                </span>
              </div>
            </div>
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all"
                style={{ width: `${yesPercentage}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {formatBasedAmount(market.totalYesShares || 0n, 2)} shares
            </p>
          </div>

          {/* NO bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-400" />
                <span className="text-sm font-semibold text-red-400">NO</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-red-400">
                  {odds.odds2Multiplier.toFixed(2)}x
                </span>
                <span className="text-xs text-gray-400 ml-2">
                  ({formatPercentage(noPercentage)})
                </span>
              </div>
            </div>
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-500 to-rose-500 transition-all"
                style={{ width: `${noPercentage}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {formatBasedAmount(market.totalNoShares || 0n, 2)} shares
            </p>
          </div>
        </div>
      </div>

      {/* Volume & Liquidity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Total Volume */}
        <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-5 h-5 text-[#3fb8bd]" />
            <h3 className="text-sm font-medium text-gray-400">Total Volume</h3>
          </div>
          <p className="text-3xl font-bold text-white mb-1">
            {formatBasedAmount(totalVolume, 2)}
          </p>
          <p className="text-sm text-gray-400">BASED tokens</p>
        </div>

        {/* Liquidity */}
        <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
          <div className="flex items-center gap-2 mb-3">
            <PieChart className="w-5 h-5 text-[#3fb8bd]" />
            <h3 className="text-sm font-medium text-gray-400">Liquidity</h3>
          </div>
          <p className="text-3xl font-bold text-white mb-1">
            {formatBasedAmount(liquidity, 2)}
          </p>
          <p className="text-sm text-gray-400">Available</p>
        </div>
      </div>

      {/* Market Activity */}
      <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-[#3fb8bd]" />
          <h3 className="text-lg font-bold text-white">Market Activity</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-400 mb-1">YES Volume</p>
            <p className="text-xl font-bold text-green-400">
              {formatBasedAmount(market.totalYesShares || 0n, 2)}
            </p>
          </div>

          <div className="p-4 bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-400 mb-1">NO Volume</p>
            <p className="text-xl font-bold text-red-400">
              {formatBasedAmount(market.totalNoShares || 0n, 2)}
            </p>
          </div>
        </div>
      </div>

      {/* Outcome (if finalized) */}
      {market.outcome !== undefined && market.state === 5 && (
        <div className="p-6 bg-purple-500/10 border border-purple-500/30 rounded-xl">
          <h3 className="text-lg font-bold text-purple-400 mb-2">Final Outcome</h3>
          <p className="text-3xl font-bold text-white">
            {market.outcome === 1 ? 'YES' : market.outcome === 2 ? 'NO' : 'INVALID'}
          </p>
        </div>
      )}
    </div>
  );
}
