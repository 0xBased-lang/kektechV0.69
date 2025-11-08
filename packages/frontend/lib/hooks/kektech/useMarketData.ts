/**
 * KEKTECH 3.0 - Market Data Hooks
 * Hooks for reading market information
 */

'use client';

import { usePredictionMarketRead } from './useContractRead';
import { useContractRead } from './useContractRead';
import type { Address } from 'viem';
import type { MarketState, Outcome, Position } from '@/lib/contracts/types';

/**
 * Get market information
 */
export function useMarketInfo(marketAddress: Address, watch = false) {
  const { data: question } = usePredictionMarketRead<string>({
    marketAddress,
    functionName: 'question',
    watch,
  });

  const { data: description } = usePredictionMarketRead<string>({
    marketAddress,
    functionName: 'description',
    watch,
  });

  const { data: category } = usePredictionMarketRead<string>({
    marketAddress,
    functionName: 'category',
    watch,
  });

  const { data: state } = usePredictionMarketRead<MarketState>({
    marketAddress,
    functionName: 'state',
    watch,
  });

  const { data: outcome } = usePredictionMarketRead<Outcome>({
    marketAddress,
    functionName: 'outcome',
    watch,
  });

  const { data: creator } = usePredictionMarketRead<Address>({
    marketAddress,
    functionName: 'creator',
    watch,
  });

  const { data: endTime } = usePredictionMarketRead<bigint>({
    marketAddress,
    functionName: 'endTime',
    watch,
  });

  const { data: resolutionTime } = usePredictionMarketRead<bigint>({
    marketAddress,
    functionName: 'resolutionTime',
    watch,
  });

  const { data: totalYesShares } = usePredictionMarketRead<bigint>({
    marketAddress,
    functionName: 'totalYesShares',
    watch,
  });

  const { data: totalNoShares } = usePredictionMarketRead<bigint>({
    marketAddress,
    functionName: 'totalNoShares',
    watch,
  });

  const { data: totalVolume } = usePredictionMarketRead<bigint>({
    marketAddress,
    functionName: 'totalVolume',
    watch,
  });

  const { data: createdAt } = usePredictionMarketRead<bigint>({
    marketAddress,
    functionName: 'createdAt',
    watch,
  });

  return {
    question,
    description,
    category,
    state,
    outcome,
    creator,
    endTime,
    resolutionTime,
    totalYesShares,
    totalNoShares,
    totalVolume,
    createdAt,
    isLoading: !question, // Simple loading check
  };
}

/**
 * Get user's position in a market
 */
export function useUserPosition(marketAddress: Address, userAddress?: Address, watch = false) {
  const { data: position, isLoading } = usePredictionMarketRead<Position>({
    marketAddress,
    functionName: 'positions',
    args: userAddress ? [userAddress] : undefined,
    enabled: !!userAddress,
    watch,
  });

  return {
    position,
    yesShares: position?.yesShares || 0n,
    noShares: position?.noShares || 0n,
    totalInvested: position?.totalInvested || 0n,
    claimed: position?.claimed || false,
    // TODO: Calculate from position history/events
    yesInvestment: 0n,
    noInvestment: 0n,
    isLoading,
  };
}

/**
 * Get all markets from MarketFactory
 */
export function useMarketList(watch = false) {
  const { data: marketCount } = useContractRead<bigint>({
    contractName: 'MarketFactory',
    functionName: 'marketCount',
    watch,
  });

  // Note: This would need pagination in production
  // For now, return empty array (components will show "No markets" message)
  return {
    marketCount: marketCount ? Number(marketCount) : 0,
    markets: [] as Address[], // TODO: Implement market enumeration
    error: undefined,
    refetch: () => Promise.resolve(),
    isLoading: marketCount === undefined,
  };
}

/**
 * Get market address by ID
 */
export function useMarketAddress(marketId: bigint) {
  const { data: marketAddress, isLoading } = useContractRead<Address>({
    contractName: 'MarketFactory',
    functionName: 'markets',
    args: [marketId],
    enabled: marketId !== undefined,
  });

  return {
    marketAddress,
    isLoading,
  };
}

/**
 * Get price for buying shares
 */
export function useBuyPrice(
  marketAddress: Address,
  outcome: Outcome,
  amount: bigint,
  enabled = true
) {
  const { data: price, isLoading, refetch } = usePredictionMarketRead<bigint>({
    marketAddress,
    functionName: 'getBuyPrice',
    args: [outcome, amount],
    enabled: enabled && amount > 0n,
  });

  return {
    price: price || 0n,
    isLoading,
    refetch,
  };
}

/**
 * Get price for selling shares
 */
export function useSellPrice(
  marketAddress: Address,
  outcome: Outcome,
  amount: bigint,
  enabled = true
) {
  const { data: price, isLoading, refetch } = usePredictionMarketRead<bigint>({
    marketAddress,
    functionName: 'getSellPrice',
    args: [outcome, amount],
    enabled: enabled && amount > 0n,
  });

  return {
    price: price || 0n,
    isLoading,
    refetch,
  };
}
