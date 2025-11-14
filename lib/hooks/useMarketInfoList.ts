/**
 * KEKTECH 3.0 - Market Info List Hook
 * Safely fetches market info for an array of addresses
 * Fixes React hooks violations by calling hooks at top level
 */

import { useMemo } from 'react';
import { useMarketInfo } from './kektech';
import type { Address } from 'viem';
type MarketInfoResult = ReturnType<typeof useMarketInfo>;

// Maximum number of markets to fetch at once (prevent too many hooks)
const MAX_MARKETS = 100;

/**
 * Custom hook to fetch market info for multiple addresses
 * Ensures hooks are called at the top level to comply with React rules
 */
export function useMarketInfoList(
  addresses: Address[] | undefined,
  autoRefresh: boolean = false
): {
  marketInfos: Array<{ address: Address; info: MarketInfoResult | undefined }>;
  isLoading: boolean;
  isError: boolean;
} {
  // Limit the number of markets to prevent performance issues
  const limitedAddresses = useMemo(() => {
    if (!addresses) return [];
    if (addresses.length > MAX_MARKETS) {
      console.warn(`useMarketInfoList: Limiting to ${MAX_MARKETS} markets (got ${addresses.length})`);
      return addresses.slice(0, MAX_MARKETS);
    }
    return addresses;
  }, [addresses]);

  // Create a stable array of addresses (fill with dummy addresses if needed)
  // This ensures we always call the same number of hooks
  const stableAddresses = useMemo(() => {
    const result: (Address | null)[] = [];
    for (let i = 0; i < MAX_MARKETS; i++) {
      result.push(i < limitedAddresses.length ? limitedAddresses[i] : null);
    }
    return result;
  }, [limitedAddresses]);

  // Call hooks for all addresses (including nulls to maintain stable hook count)
  // This is a workaround for React's hook rules - we must call the same number of hooks every render
  const allMarketData = stableAddresses.map(address => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const result = useMarketInfo(
      address || '0x0000000000000000000000000000000000000000' as Address,
      address !== null && autoRefresh // Only auto-refresh real addresses
    );
    return address ? result : null;
  });

  // Filter out null addresses and aggregate loading/error states
  const marketInfos = useMemo(() => {
    const validData: Array<{ address: Address; info: MarketInfoResult | undefined }> = [];
    let hasLoading = false;
    let hasError = false;

    for (let i = 0; i < limitedAddresses.length; i++) {
      const address = limitedAddresses[i];
      const data = allMarketData[i];

      if (data) {
        validData.push({
          address,
          info: data  // 🎯 FIX: data IS the market info (flat object), not nested under data.info
        });

        if (data.isLoading) hasLoading = true;
        if (data.hasError) hasError = true;
      }
    }

    return {
      marketInfos: validData,
      isLoading: hasLoading,
      isError: hasError
    };
  }, [limitedAddresses, allMarketData]);

  return marketInfos;
}

/**
 * Alternative implementation using a single contract call for all markets
 * More efficient but requires backend support
 */
export function useMarketInfoListBatch(
  addresses: Address[] | undefined
): {
  marketInfos: Array<{ address: Address; info: MarketInfoResult | undefined }>;
  isLoading: boolean;
  isError: boolean;
} {
  // TODO: Implement batch fetching when backend supports it
  // This would make a single call to fetch all market info at once
  // Much more efficient than calling hooks for each market

  // For now, fallback to the individual hook approach
  return useMarketInfoList(addresses);
}
