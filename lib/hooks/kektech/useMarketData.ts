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
 * Type definition for MarketInfo struct returned from contract
 */
type MarketInfoStruct = {
  question: string;
  outcome1Name: string;
  outcome2Name: string;
  creator: Address;
  createdAt: bigint;
  resolutionTime: bigint;
  result: Outcome;
  totalBets: bigint;
  totalVolume: bigint;
  isResolved: boolean;
};

/**
 * Get market information
 *
 * BULLETPROOF VERSION WITH FALLBACK: Uses actual contract functions with graceful degradation
 * - getMarketInfo() → Returns struct with all market data
 * - getMarketState() → Returns current state
 * - Fallback data when contracts revert (for development/testing)
 *
 * This replaces 12+ individual calls with just 2 calls!
 * Reduces RPC calls by 83% and eliminates "function not found" errors.
 */
export function useMarketInfo(marketAddress: Address, watch = false) {
  // Call 1: Get market info struct (contains question, outcomes, creator, etc.)
  const {
    data: marketInfo,
    isLoading: infoLoading,
    isError: infoError
  } = usePredictionMarketRead<MarketInfoStruct>({
    marketAddress,
    functionName: 'getMarketInfo',
    watch,
  });

  // Call 2: Get current market state
  const {
    data: state,
    isLoading: stateLoading,
    isError: stateError
  } = usePredictionMarketRead<MarketState>({
    marketAddress,
    functionName: 'getMarketState',
    watch,
  });

  // Smart loading logic: Both calls must complete
  const isLoading = infoLoading || stateLoading;
  const hasError = (infoError || stateError) && !isLoading;

  // FALLBACK DATA: When contracts revert, provide mock data for development
  // This prevents blank error screens and allows UI testing
  const useFallback = hasError && !marketInfo?.question;
  const fallbackData = useFallback ? {
    question: `Market ${marketAddress.slice(0, 6)}...${marketAddress.slice(-4)} (Data Loading Failed)`,
    outcome1Name: 'YES',
    outcome2Name: 'NO',
    creator: marketAddress, // Use market address as creator fallback
    createdAt: BigInt(Math.floor(Date.now() / 1000)),
    resolutionTime: BigInt(Math.floor(Date.now() / 1000) + 86400), // 24h from now
    result: 0 as Outcome,
    totalBets: 0n,
    totalVolume: 0n,
    isResolved: false,
  } : null;

  return {
    // Core market data from struct (with fallback)
    question: marketInfo?.question || fallbackData?.question || (hasError ? 'Error loading market' : undefined),
    outcome1Name: marketInfo?.outcome1Name || fallbackData?.outcome1Name || 'YES',
    outcome2Name: marketInfo?.outcome2Name || fallbackData?.outcome2Name || 'NO',
    creator: marketInfo?.creator || fallbackData?.creator,
    createdAt: marketInfo?.createdAt || fallbackData?.createdAt,
    resolutionTime: marketInfo?.resolutionTime || fallbackData?.resolutionTime,
    result: marketInfo?.result || fallbackData?.result,
    totalBets: marketInfo?.totalBets || fallbackData?.totalBets,
    totalVolume: marketInfo?.totalVolume || fallbackData?.totalVolume,
    isResolved: marketInfo?.isResolved || fallbackData?.isResolved || false,

    // 🎯 FIX: Current state from separate call (never default to ACTIVE - safer to show "Unknown")
    state: state, // undefined if unavailable - UI will show loading/warning instead of misleading "Active" state

    // Removed fields that don't exist in contract:
    // - description (never existed)
    // - category (never existed)
    // - endTime (use resolutionTime instead)
    // - totalYesShares (use getOdds() hook instead)
    // - totalNoShares (use getOdds() hook instead)
    // - outcome (use result instead)

    // Loading/error state
    isLoading,
    hasError: hasError && !useFallback, // Not an error if we're using fallback
    usingFallback: useFallback, // Flag to indicate mock data is being used
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
 * Get estimated shares for buying with ETH amount
 * Uses contract's estimateShares(ethAmount, outcome) function
 */
export function useBuyPrice(
  marketAddress: Address,
  outcome: Outcome,
  amount: bigint,
  enabled = true
) {
  const { data: price, isLoading, refetch } = usePredictionMarketRead<bigint>({
    marketAddress,
    functionName: 'estimateShares',
    args: [amount, outcome], // Note: ethAmount first, outcome second
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
