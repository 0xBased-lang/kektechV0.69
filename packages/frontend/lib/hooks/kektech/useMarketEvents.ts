/**
 * KEKTECH 3.0 - Market Event Hooks
 * Real-time event listeners for market updates
 */

'use client';

import { useWatchContractEvent } from 'wagmi';
import { CONTRACT_ADDRESSES, ABIS } from '@/lib/contracts';
import type { Address } from 'viem';
import { useCallback } from 'react';

/**
 * Watch for new market creation events
 */
export function useWatchMarketCreated(
  onMarketCreated?: (data: {
    marketId: bigint;
    marketAddress: Address;
    creator: Address;
    question: string;
    endTime: bigint;
  }) => void
) {
  useWatchContractEvent({
    address: CONTRACT_ADDRESSES.MarketFactory as Address,
    abi: ABIS.MarketFactory,
    eventName: 'MarketCreated',
    onLogs: useCallback(
      (logs: readonly unknown[]) => {
        if (onMarketCreated && logs.length > 0) {
          const log = logs[0] as { args?: Record<string, unknown> };
          if (log.args) {
            onMarketCreated({
              marketId: log.args.marketId as bigint,
              marketAddress: log.args.marketAddress as Address,
              creator: log.args.creator as Address,
              question: log.args.question as string,
              endTime: log.args.endTime as bigint,
            });
          }
        }
      },
      [onMarketCreated]
    ),
  });
}

/**
 * Watch for bet placed events on a specific market
 */
export function useWatchBetPlaced(
  marketAddress: Address,
  onBetPlaced?: (data: {
    bettor: Address;
    amount: bigint;
    outcome: number;
    sharesReceived: bigint;
  }) => void
) {
  useWatchContractEvent({
    address: marketAddress,
    abi: ABIS.PredictionMarket,
    eventName: 'BetPlaced',
    onLogs: useCallback(
      (logs: readonly unknown[]) => {
        if (onBetPlaced && logs.length > 0) {
          const log = logs[0] as { args?: Record<string, unknown> };
          if (log.args) {
            onBetPlaced({
              bettor: log.args.bettor as Address,
              amount: log.args.amount as bigint,
              outcome: log.args.outcome as number,
              sharesReceived: log.args.sharesReceived as bigint,
            });
          }
        }
      },
      [onBetPlaced]
    ),
  });
}

/**
 * Watch for market resolution events
 */
export function useWatchMarketResolved(
  marketAddress: Address,
  onMarketResolved?: (data: {
    outcome: number;
    resolver: Address;
    timestamp: bigint;
  }) => void
) {
  useWatchContractEvent({
    address: marketAddress,
    abi: ABIS.PredictionMarket,
    eventName: 'MarketResolved',
    onLogs: useCallback(
      (logs: readonly unknown[]) => {
        if (onMarketResolved && logs.length > 0) {
          const log = logs[0] as { args?: Record<string, unknown> };
          if (log.args) {
            onMarketResolved({
              outcome: log.args.outcome as number,
              resolver: log.args.resolver as Address,
              timestamp: log.args.timestamp as bigint,
            });
          }
        }
      },
      [onMarketResolved]
    ),
  });
}

/**
 * Watch for market dispute events
 */
export function useWatchMarketDisputed(
  marketAddress: Address,
  onMarketDisputed?: (data: {
    disputer: Address;
    reason: string;
    timestamp: bigint;
  }) => void
) {
  useWatchContractEvent({
    address: marketAddress,
    abi: ABIS.PredictionMarket,
    eventName: 'MarketDisputed',
    onLogs: useCallback(
      (logs: readonly unknown[]) => {
        if (onMarketDisputed && logs.length > 0) {
          const log = logs[0] as { args?: Record<string, unknown> };
          if (log.args) {
            onMarketDisputed({
              disputer: log.args.disputer as Address,
              reason: log.args.reason as string,
              timestamp: log.args.timestamp as bigint,
            });
          }
        }
      },
      [onMarketDisputed]
    ),
  });
}

/**
 * Watch for winnings claimed events
 */
export function useWatchWinningsClaimed(
  marketAddress: Address,
  onWinningsClaimed?: (data: {
    claimer: Address;
    amount: bigint;
    timestamp: bigint;
  }) => void
) {
  useWatchContractEvent({
    address: marketAddress,
    abi: ABIS.PredictionMarket,
    eventName: 'WinningsClaimed',
    onLogs: useCallback(
      (logs: readonly unknown[]) => {
        if (onWinningsClaimed && logs.length > 0) {
          const log = logs[0] as { args?: Record<string, unknown> };
          if (log.args) {
            onWinningsClaimed({
              claimer: log.args.claimer as Address,
              amount: log.args.amount as bigint,
              timestamp: log.args.timestamp as bigint,
            });
          }
        }
      },
      [onWinningsClaimed]
    ),
  });
}

/**
 * Watch for market state change events
 */
export function useWatchMarketStateChanged(
  marketAddress: Address,
  onStateChanged?: (data: {
    oldState: number;
    newState: number;
    timestamp: bigint;
  }) => void
) {
  useWatchContractEvent({
    address: marketAddress,
    abi: ABIS.PredictionMarket,
    eventName: 'StateChanged',
    onLogs: useCallback(
      (logs: readonly unknown[]) => {
        if (onStateChanged && logs.length > 0) {
          const log = logs[0] as { args?: Record<string, unknown> };
          if (log.args) {
            onStateChanged({
              oldState: log.args.oldState as number,
              newState: log.args.newState as number,
              timestamp: log.args.timestamp as bigint,
            });
          }
        }
      },
      [onStateChanged]
    ),
  });
}
