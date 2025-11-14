/**
 * KEKTECH 3.0 - Admin Action Hooks
 * Hooks for admin-only functions (role checking, parameter updates, overrides)
 */

'use client';

import { useContractWrite } from './useContractWrite';
import { useCallback } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import type { Address } from 'viem';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { keccak256, toBytes } from 'viem';
import AccessControlManagerABI from '@/lib/contracts/abis/AccessControlManager.json';
import ParameterStorageABI from '@/lib/contracts/abis/ParameterStorage.json';
import ResolutionManagerABI from '@/lib/contracts/abis/ResolutionManager.json';

// Admin role constant (keccak256("ADMIN_ROLE"))
const ADMIN_ROLE = keccak256(toBytes('ADMIN_ROLE'));

/**
 * Hook to check if the connected wallet has admin role
 *
 * Fixed: Removed manual state management to prevent infinite re-render loop.
 * Added staleTime to cache the admin role check for 60 seconds.
 */
export function useAdminRole() {
  const { address } = useAccount();

  const { data, isLoading, isError } = useReadContract({
    address: CONTRACT_ADDRESSES.AccessControlManager as Address,
    abi: AccessControlManagerABI.abi,
    functionName: 'hasRole',
    args: [ADMIN_ROLE, address],
    query: {
      enabled: !!address,
      staleTime: 60_000, // Cache for 60 seconds to prevent constant re-fetching
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  });

  return {
    isAdmin: data ?? false,
    isLoading: isLoading || !address, // Loading if querying OR no wallet connected
    isError,
    address,
  };
}

/**
 * Hook for rejecting a proposed market (admin only)
 */
export function useRejectMarket(marketAddress: Address) {
  const { write, hash, isLoading, isSuccess, isError, error } = useContractWrite({
    contractName: 'MarketFactory',
  });

  const rejectMarket = useCallback(
    (reason: string) => {
      // Call factory's rejectMarket function
      write('rejectMarket', [marketAddress, reason]);
    },
    [write, marketAddress]
  );

  return {
    rejectMarket,
    hash,
    isLoading,
    isSuccess,
    isError,
    error,
  };
}

/**
 * Hook for admin resolution override with custom outcome and reasoning
 */
export function useAdminResolveMarket(marketAddress: Address) {
  const { write, hash, isLoading, isSuccess, isError, error } = useContractWrite({
    contractName: 'ResolutionManager',
  });

  const adminResolveMarket = useCallback(
    (outcome: 0 | 1, reason: string) => {
      // Call ResolutionManager's adminResolveMarket function
      write('adminResolveMarket', [marketAddress, outcome, reason]);
    },
    [write, marketAddress]
  );

  return {
    adminResolveMarket,
    hash,
    isLoading,
    isSuccess,
    isError,
    error,
  };
}

/**
 * Hook for updating a system parameter
 */
export function useUpdateParameter() {
  const { write, hash, isLoading, isSuccess, isError, error } = useContractWrite({
    contractName: 'ParameterStorage',
  });

  const updateParameter = useCallback(
    (parameterKey: string, value: bigint) => {
      // Convert parameter key to bytes32
      const keyHash = keccak256(toBytes(parameterKey));
      write('setParameter', [keyHash, value]);
    },
    [write]
  );

  return {
    updateParameter,
    hash,
    isLoading,
    isSuccess,
    isError,
    error,
  };
}

/**
 * Hook for updating a boolean parameter
 */
export function useUpdateBoolParameter() {
  const { write, hash, isLoading, isSuccess, isError, error } = useContractWrite({
    contractName: 'ParameterStorage',
  });

  const updateBoolParameter = useCallback(
    (parameterKey: string, value: boolean) => {
      const keyHash = keccak256(toBytes(parameterKey));
      write('setBoolParameter', [keyHash, value]);
    },
    [write]
  );

  return {
    updateBoolParameter,
    hash,
    isLoading,
    isSuccess,
    isError,
    error,
  };
}

/**
 * Hook to get a parameter value
 */
export function useGetParameter(parameterKey: string) {
  const keyHash = keccak256(toBytes(parameterKey));

  const { data, isError, isSuccess, isLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.ParameterStorage as Address,
    abi: ParameterStorageABI.abi,
    functionName: 'getParameter',
    args: [keyHash],
  });

  return {
    value: data as bigint | undefined,
    isLoading,
    isSuccess,
    isError,
  };
}

/**
 * Hook to get a boolean parameter value
 */
export function useGetBoolParameter(parameterKey: string) {
  const keyHash = keccak256(toBytes(parameterKey));

  const { data, isError, isSuccess, isLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.ParameterStorage as Address,
    abi: ParameterStorageABI.abi,
    functionName: 'getBoolParameter',
    args: [keyHash],
  });

  return {
    value: data as boolean | undefined,
    isLoading,
    isSuccess,
    isError,
  };
}

/**
 * Hook to update dispute window (for switching between testing/production mode)
 */
export function useUpdateDisputeWindow() {
  const { write, hash, isLoading, isSuccess, isError, error } = useContractWrite({
    contractName: 'ResolutionManager',
  });

  const updateDisputeWindow = useCallback(
    (durationInSeconds: number) => {
      write('setDisputeWindow', [BigInt(durationInSeconds)]);
    },
    [write]
  );

  return {
    updateDisputeWindow,
    hash,
    isLoading,
    isSuccess,
    isError,
    error,
  };
}

/**
 * Hook to get current dispute window
 */
export function useGetDisputeWindow() {
  const { data, isError, isSuccess, isLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.ResolutionManager as Address,
    abi: ResolutionManagerABI.abi,
    functionName: 'getDisputeWindow',
  });

  return {
    disputeWindow: data as bigint | undefined,
    isLoading,
    isSuccess,
    isError,
  };
}

/**
 * Hook to update minimum dispute bond
 */
export function useUpdateMinDisputeBond() {
  const { write, hash, isLoading, isSuccess, isError, error } = useContractWrite({
    contractName: 'ResolutionManager',
  });

  const updateMinDisputeBond = useCallback(
    (bondAmount: bigint) => {
      write('setMinDisputeBond', [bondAmount]);
    },
    [write]
  );

  return {
    updateMinDisputeBond,
    hash,
    isLoading,
    isSuccess,
    isError,
    error,
  };
}

/**
 * Hook to get current minimum dispute bond
 */
export function useGetMinDisputeBond() {
  const { data, isError, isSuccess, isLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.ResolutionManager as Address,
    abi: ResolutionManagerABI.abi,
    functionName: 'getMinDisputeBond',
  });

  return {
    minDisputeBond: data as bigint | undefined,
    isLoading,
    isSuccess,
    isError,
  };
}

/**
 * Hook to get all proposed markets from factory
 */
export function useProposedMarkets() {
  // This would need to be implemented in the factory contract
  // For now, we'll filter markets by state
  // TODO: Add event-based tracking for proposed markets
  return {
    markets: [] as Address[],
    isLoading: false,
  };
}

/**
 * Hook to get proposal votes for a market
 */
export function useProposalVotes(_marketAddress: Address) {
  // TODO: Implement backend API call to get proposal votes
  // This will be connected to the database in Phase 2
  const [votes] = useState({
    likes: 0,
    dislikes: 0,
    userVote: null as 'like' | 'dislike' | null,
  });

  return {
    votes,
    isLoading: false,
  };
}

/**
 * Hook to get resolution votes for a market
 */
export function useResolutionVotes(_marketAddress: Address) {
  // TODO: Implement backend API call to get resolution votes
  // This will be connected to the database in Phase 2
  const [votes] = useState({
    agreeCount: 0,
    disagreeCount: 0,
    comments: [] as any[],
  });

  return {
    votes,
    isLoading: false,
  };
}

/**
 * Batch update multiple parameters
 */
export function useBatchUpdateParameters() {
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const batchUpdate = useCallback(async (updates: Record<string, bigint | boolean>) => {
    setUpdating(true);
    setError(null);

    try {
      // TODO: Implement batch update logic
      // This would need a multicall or multiple transactions
      console.log('Batch updating parameters:', updates);

      // Simulate success for now
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setSuccess(true);
    } catch (err) {
      setError(err as Error);
      setSuccess(false);
    } finally {
      setUpdating(false);
    }
  }, []);

  return {
    batchUpdate,
    isUpdating: updating,
    isSuccess: success,
    error,
  };
}
