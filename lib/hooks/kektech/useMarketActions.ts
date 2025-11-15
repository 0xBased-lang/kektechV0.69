/**
 * KEKTECH 3.0 - Market Action Hooks
 * Hooks for interacting with prediction markets (betting, claiming, etc.)
 */

'use client';

import { usePredictionMarketWrite, useContractWrite } from './useContractWrite';
import { useCallback, useMemo } from 'react';
import type { Address, Hex } from 'viem';
import { decodeEventLog } from 'viem';
import type { Outcome, MarketConfig } from '@/lib/contracts/types';
import { ABIS, CONTRACT_ADDRESSES } from '@/lib/contracts';

/**
 * Hook for creating a new market
 */
interface CurveOptions {
  curveType?: number;
  curveParams?: bigint;
}

export function useCreateMarket() {
  const {
    write,
    hash,
    receipt,
    isLoading,
    isSuccess,
    isError,
    error,
    friendlyError,
  } = useContractWrite({
    contractName: 'MarketFactory',
  });

  const createMarket = useCallback(
    (config: MarketConfig, bond: bigint, curve?: CurveOptions) => {
      if (curve && typeof curve.curveType === 'number') {
        write('createMarketWithCurve', [config, curve.curveType, curve.curveParams ?? 0n], bond);
      } else {
        write('createMarket', [config], bond);
      }
    },
    [write]
  );

  const marketAddress = useMemo(() => {
    if (!receipt) return null;

    for (const log of receipt.logs ?? []) {
      if (log.address.toLowerCase() !== CONTRACT_ADDRESSES.MarketFactory.toLowerCase()) {
        continue;
      }

      try {
        const decoded = decodeEventLog({
          abi: ABIS.MarketFactory,
          data: log.data,
          topics: log.topics as [] | [Hex, ...Hex[]],
        });

        if (decoded.eventName === 'MarketCreated') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const args = decoded.args as any;
          if (args?.marketAddress) {
            return args.marketAddress as Address;
          }
        }
      } catch {
        // Ignore non-matching logs
      }
    }

    return null;
  }, [receipt]);

  return {
    createMarket,
    hash,
    isLoading,
    isSuccess,
    isError,
    error,
    friendlyError,
    marketAddress,
  };
}

/**
 * Hook for placing a bet on a market
 */
export function usePlaceBet(marketAddress: Address) {
  const { write, hash, isLoading, isSuccess, isError, error, isPending, isConfirming, friendlyError } =
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
    friendlyError,
  };
}

/**
 * Hook for selling shares
 */
export function useSellShares(marketAddress: Address) {
  const { write, hash, isLoading, isSuccess, isError, error, friendlyError } =
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
    friendlyError,
  };
}

/**
 * Hook for claiming winnings
 */
export function useClaimWinnings(marketAddress: Address) {
  const { write, hash, isLoading, isSuccess, isError, error, friendlyError } =
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
    friendlyError,
  };
}

/**
 * Hook for resolving a market (admin/resolver only)
 */
export function useResolveMarket(marketAddress: Address) {
  const { write, hash, isLoading, isSuccess, isError, error, friendlyError } =
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
    friendlyError,
  };
}

/**
 * Hook for disputing a market outcome
 */
export function useDisputeMarket(marketAddress: Address) {
  const { write, hash, isLoading, isSuccess, isError, error, friendlyError } =
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
    friendlyError,
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
