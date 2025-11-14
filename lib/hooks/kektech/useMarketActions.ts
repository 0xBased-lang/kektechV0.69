/**
 * KEKTECH 3.0 - Market Action Hooks
 * Hooks for interacting with prediction markets (betting, claiming, etc.)
 */

'use client';

import { usePredictionMarketWrite, useContractWrite } from './useContractWrite';
import { useCallback } from 'react';
import type { Address } from 'viem';
import type { Outcome, MarketConfig } from '@/lib/contracts/types';

/**
 * Hook for creating a new market
 */
export function useCreateMarket() {
  const { write, hash, isLoading, isSuccess, isError, error } = useContractWrite({
    contractName: 'MarketFactory',
  });

  const createMarket = useCallback(
    (config: MarketConfig, bond: bigint) => {
      write('createMarket', [config], bond);
    },
    [write]
  );

  return {
    createMarket,
    hash,
    isLoading,
    isSuccess,
    isError,
    error,
  };
}

/**
 * Hook for placing a bet on a market
 */
export function usePlaceBet(marketAddress: Address) {
  const { write, hash, isLoading, isSuccess, isError, error, isPending, isConfirming } =
    usePredictionMarketWrite({ marketAddress });

  const placeBet = useCallback(
    (outcome: Outcome, amount: bigint, minOdds: bigint = 0n) => {
      // minOdds: Minimum acceptable odds (0n = no slippage protection)
      // Contract signature: placeBet(uint8 _outcome, uint256 _minExpectedOdds)
      write('placeBet', [outcome, minOdds], amount);
    },
    [write]
  );

  return {
    placeBet,
    hash,
    isLoading,
    isSuccess,
    isError,
    error,
    isPending,
    isConfirming,
  };
}

/**
 * Hook for selling shares
 */
export function useSellShares(marketAddress: Address) {
  const { write, hash, isLoading, isSuccess, isError, error } =
    usePredictionMarketWrite({ marketAddress });

  const sellShares = useCallback(
    (outcome: Outcome, amount: bigint) => {
      write('sellShares', [outcome, amount]);
    },
    [write]
  );

  return {
    sellShares,
    hash,
    isLoading,
    isSuccess,
    isError,
    error,
  };
}

/**
 * Hook for claiming winnings
 */
export function useClaimWinnings(marketAddress: Address) {
  const { write, hash, isLoading, isSuccess, isError, error } =
    usePredictionMarketWrite({ marketAddress });

  const claimWinnings = useCallback(() => {
    write('claimWinnings', []);
  }, [write]);

  return {
    claimWinnings,
    hash,
    isLoading,
    isSuccess,
    isError,
    error,
  };
}

/**
 * Hook for resolving a market (admin/resolver only)
 */
export function useResolveMarket(marketAddress: Address) {
  const { write, hash, isLoading, isSuccess, isError, error } =
    usePredictionMarketWrite({ marketAddress });

  const resolveMarket = useCallback(
    (outcome: Outcome) => {
      write('resolve', [outcome]);
    },
    [write]
  );

  return {
    resolveMarket,
    hash,
    isLoading,
    isSuccess,
    isError,
    error,
  };
}

/**
 * Hook for disputing a market outcome
 */
export function useDisputeMarket(marketAddress: Address) {
  const { write, hash, isLoading, isSuccess, isError, error } =
    usePredictionMarketWrite({ marketAddress });

  const disputeMarket = useCallback(
    (reason: string) => {
      write('dispute', [reason]);
    },
    [write]
  );

  return {
    disputeMarket,
    hash,
    isLoading,
    isSuccess,
    isError,
    error,
  };
}

/**
 * Hook for approving a proposed market (admin only)
 *
 * ⚠️ DEPRECATED: This directly calls market.approve() which requires onlyFactory modifier
 * Use useAdminApproveMarket() instead which correctly calls factory.approveMarket()
 */
export function useApproveMarket(marketAddress: Address) {
  const { write, hash, isLoading, isSuccess, isError, error } =
    usePredictionMarketWrite({ marketAddress });

  const approveMarket = useCallback(() => {
    write('approve', []);
  }, [write]);

  return {
    approveMarket,
    hash,
    isLoading,
    isSuccess,
    isError,
    error,
  };
}

/**
 * Hook for admin approving a proposed market via MarketFactory
 *
 * This is the CORRECT way to approve markets from the frontend.
 * The PredictionMarket.approve() function has an onlyFactory modifier,
 * meaning it can only be called by the MarketFactory contract.
 *
 * This hook calls MarketFactory.approveMarket(marketAddress) which then
 * internally calls market.approve() with the proper authorization.
 */
export function useAdminApproveMarket(marketAddress: Address) {
  const { write, hash, isLoading, isSuccess, isError, error } = useContractWrite({
    contractName: 'MarketFactory',
  });

  const approveMarket = useCallback(() => {
    write('adminApproveMarket', [marketAddress]);
  }, [write, marketAddress]);

  return {
    approveMarket,
    hash,
    isLoading,
    isSuccess,
    isError,
    error,
  };
}

/**
 * Hook for activating an approved market
 */
export function useActivateMarket(marketAddress: Address) {
  const { write, hash, isLoading, isSuccess, isError, error } =
    usePredictionMarketWrite({ marketAddress });

  const activateMarket = useCallback(() => {
    write('activate', []);
  }, [write]);

  return {
    activateMarket,
    hash,
    isLoading,
    isSuccess,
    isError,
    error,
  };
}
