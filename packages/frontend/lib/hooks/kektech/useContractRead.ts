/**
 * KEKTECH 3.0 - Base Contract Read Hook
 * Generic hook for reading from any contract
 */

'use client';

import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES, ABIS, type ContractName, type ABIName } from '@/lib/contracts';
import type { Address } from 'viem';

interface UseContractReadParams {
  contractName: ContractName;
  functionName: string;
  args?: readonly unknown[];
  enabled?: boolean;
  watch?: boolean;
}

export function useContractRead<T = unknown>({
  contractName,
  functionName,
  args,
  enabled = true,
  watch = false,
}: UseContractReadParams) {
  const address = CONTRACT_ADDRESSES[contractName] as Address;

  // Map contract names to ABI names
  const abiName: ABIName = contractName === 'MarketFactory'
    ? 'MarketFactory'
    : contractName as ABIName;

  const abi = ABIS[abiName];

  const result = useReadContract({
    address,
    abi,
    functionName,
    args,
    query: {
      enabled,
      refetchInterval: watch ? 5000 : false, // Poll every 5s if watching
      staleTime: 10000, // Consider data fresh for 10s
      gcTime: 30000, // Keep in cache for 30s (formerly cacheTime)
      retry: 2, // Retry failed queries twice
      retryDelay: 1000, // Wait 1 second between retries
    },
  });

  return {
    data: result.data as T | undefined,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
    refetch: result.refetch,
    isSuccess: result.isSuccess,
  };
}

/**
 * Hook for reading from a specific PredictionMarket clone
 */
export function usePredictionMarketRead<T = unknown>({
  marketAddress,
  functionName,
  args,
  enabled = true,
  watch = false,
}: {
  marketAddress: Address;
  functionName: string;
  args?: readonly unknown[];
  enabled?: boolean;
  watch?: boolean;
}) {
  const abi = ABIS.PredictionMarket;

  const result = useReadContract({
    address: marketAddress,
    abi,
    functionName,
    args,
    query: {
      enabled: enabled && !!marketAddress,
      refetchInterval: watch ? 5000 : false,
      staleTime: 10000, // Consider data fresh for 10s
      gcTime: 30000, // Keep in cache for 30s (formerly cacheTime)
      retry: 2, // Retry failed queries twice
      retryDelay: 1000, // Wait 1 second between retries
    },
  });

  return {
    data: result.data as T | undefined,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
    refetch: result.refetch,
    isSuccess: result.isSuccess,
  };
}
