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
  const { data: question, isLoading: questionLoading, isError: questionError } = usePredictionMarketRead<string>({
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

  const { data: state, isLoading: stateLoading, isError: stateError } = usePredictionMarketRead<MarketState>({
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

  // Better loading logic: Check critical fields and their loading states
  const isLoading = (questionLoading || stateLoading) && !question && state === undefined;
  const hasError = (questionError || stateError) && !questionLoading && !stateLoading;

  return {
    question: question || (hasError ? 'Error loading market' : undefined),
    description: description || '',
    category,
    state: state ?? 0, // Default to PROPOSED if undefined
    outcome,
    creator,
    endTime,
    resolutionTime,
    totalYesShares,
    totalNoShares,
    totalVolume,
    createdAt,
    isLoading,
    hasError,
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

// Hardcoded fallback markets (used when RPC fails)
const FALLBACK_MARKETS: Address[] = [
  '0x31d2BC49A6FD4a066F5f8AC61Acd0E6c9105DD84', // Test market on BasedAI mainnet
];

/**
 * Get all markets from MarketFactory
 *
 * Enhanced with bulletproof reliability:
 * - Fallback to hardcoded test market if RPC fails
 * - Aggressive retry configuration
 * - Graceful degradation
 */
export function useMarketList(watch = false) {
  const { data: marketCount } = useContractRead<bigint>({
    contractName: 'MarketFactory',
    functionName: 'getMarketCount',
    watch,
  });

  const {
    data: markets,
    isLoading: marketsLoading,
    isError: marketsError,
    refetch
  } = useContractRead<Address[]>({
    contractName: 'MarketFactory',
    functionName: 'getAllMarkets',
    watch,
  });

  // Use fallback markets if RPC fails
  const finalMarkets = markets || (marketsError ? FALLBACK_MARKETS : []);

  // Log errors only (not verbose status updates)
  if (marketsError && !markets) {
    console.warn('⚠️  MarketFactory.getAllMarkets() failed, using fallback markets');
  }

  return {
    marketCount: marketCount ? Number(marketCount) : (finalMarkets.length || 0),
    markets: finalMarkets,
    error: marketsError,
    refetch,
    isLoading: marketCount === undefined || marketsLoading,
    usingFallback: marketsError && !markets,
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

/**
 * Get current odds from the contract
 *
 * CRITICAL: This uses the contract's getOdds() function which includes VirtualLiquidity!
 * - Empty market: Returns (20000, 20000) = 2.0x odds on both sides
 * - After bets: Returns dynamically calculated odds based on share distribution
 * - Values are in basis points (10000 = 1.0x = 100%)
 *
 * DO NOT calculate odds manually from shares - always use this hook!
 *
 * @param marketAddress - The market contract address
 * @param watch - Whether to watch for updates
 * @returns Odds for both outcomes in basis points and percentage format
 */
export function useMarketOdds(marketAddress: Address, watch = false) {
  const { data, isLoading, refetch } = usePredictionMarketRead<readonly [bigint, bigint]>({
    marketAddress,
    functionName: 'getOdds',
    watch,
  });

  // Parse odds from contract (returns [odds1, odds2] in basis points)
  const odds1BasisPoints = data?.[0] || 20000n; // Default: 2.0x = 20000 basis points
  const odds2BasisPoints = data?.[1] || 20000n; // Default: 2.0x = 20000 basis points

  // Convert to percentages (20000 basis points = 200% = 2.0x multiplier)
  const odds1Percentage = Number(odds1BasisPoints) / 100; // e.g., 20000 → 200%
  const odds2Percentage = Number(odds2BasisPoints) / 100; // e.g., 20000 → 200%

  // Convert to decimal multipliers (e.g., 2.0x)
  const odds1Multiplier = Number(odds1BasisPoints) / 10000; // e.g., 20000 → 2.0
  const odds2Multiplier = Number(odds2BasisPoints) / 10000; // e.g., 20000 → 2.0

  // Calculate implied probabilities (inverse of odds)
  // For 2.0x odds: probability = 1/2.0 = 0.5 = 50%
  const odds1Probability = odds1Multiplier > 0 ? (1 / odds1Multiplier) * 100 : 50;
  const odds2Probability = odds2Multiplier > 0 ? (1 / odds2Multiplier) * 100 : 50;

  return {
    // Raw contract values (basis points)
    odds1BasisPoints: Number(odds1BasisPoints),
    odds2BasisPoints: Number(odds2BasisPoints),

    // Percentage format (200% = 2.0x)
    odds1Percentage,
    odds2Percentage,

    // Multiplier format (2.0x)
    odds1Multiplier,
    odds2Multiplier,

    // Implied probabilities (50% for 2.0x odds)
    odds1Probability,
    odds2Probability,

    // State
    isLoading,
    refetch,
  };
}
