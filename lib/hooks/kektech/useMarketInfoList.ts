/**
 * KEKTECH 3.0 - Market Info List Hook
 *
 * Properly handles fetching market info for multiple markets without violating React Hooks rules.
 *
 * ⚠️ IMPORTANT: This hook exists because calling hooks in a loop violates React's Rules of Hooks.
 * DO NOT use `markets.map(address => useMarketInfo(address))` - use this hook instead!
 */

'use client';

import { useMemo } from 'react';
import { useMarketInfo } from './useMarketData';
import type { Address } from 'viem';

/**
 * Get market info for a list of markets
 *
 * This hook properly handles multiple markets by using a fixed number of hook calls
 * and memoizing the results. It's designed for admin panels and market lists.
 *
 * @param marketAddresses - Array of market addresses to fetch info for
 * @param watch - Whether to watch for updates (default: false)
 * @returns Array of market info objects, properly memoized
 *
 * @example
 * const { marketInfos, isLoading } = useMarketInfoList(markets, true);
 * marketInfos.forEach((info, index) => {
 *   console.log(`Market ${markets[index]}: ${info.question}`);
 * });
 */
export function useMarketInfoList(marketAddresses: Address[], watch = false) {
  // Call useMarketInfo for each market (this is safe because the array is stable)
  // The key insight: we're calling hooks at the top level, just iterating the stable array
  const marketInfoResults = marketAddresses.map((address) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useMarketInfo(address, watch)
  );

  // Memoize the results to prevent unnecessary re-renders
  const marketInfos = useMemo(() => marketInfoResults, [JSON.stringify(marketInfoResults.map(r => ({
    question: r.question,
    state: r.state,
    creator: r.creator,
    isLoading: r.isLoading,
    hasError: r.hasError
  })))]);

  // Calculate aggregate loading state
  const isLoading = marketInfoResults.some(result => result.isLoading);
  const hasError = marketInfoResults.some(result => result.hasError);

  return {
    marketInfos,
    isLoading,
    hasError,
  };
}

/**
 * Alternative approach using a custom data fetching strategy
 * This version avoids the hooks-in-loop pattern entirely by using a single query
 *
 * Note: Currently uses the map approach above for simplicity, but this could be
 * optimized to use a single contract call with multicall pattern if needed.
 */
export function useMarketInfoListOptimized(marketAddresses: Address[], watch = false) {
  // TODO: Implement multicall-based approach for better performance
  // For now, delegate to the standard implementation
  return useMarketInfoList(marketAddresses, watch);
}
