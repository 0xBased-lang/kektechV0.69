/**
 * KEKTECH 3.0 - Claim Button Component
 * Claim winnings from finalized markets
 */
'use client';

import { useClaimWinnings, useUserPosition, useMarketInfo } from '@/lib/hooks/kektech';
import { useWallet } from '@/lib/hooks/kektech';
import { ButtonLoading } from '../ui/LoadingSpinner';
import { TransactionError } from '../ui/ErrorDisplay';
import { MarketState, Outcome } from '@/lib/contracts/types';
import { formatBasedAmount } from '@/lib/utils';
import { Trophy, CheckCircle } from 'lucide-react';
import type { Address } from 'viem';
import { cn } from '@/lib/utils';

interface ClaimButtonProps {
  marketAddress: Address;
  onSuccess?: () => void;
  variant?: 'default' | 'compact';
  className?: string;
}

/**
 * Button to claim winnings from a market
 */
export function ClaimButton({
  marketAddress,
  onSuccess,
  variant = 'default',
  className,
}: ClaimButtonProps) {
  const { address, isConnected } = useWallet();
  const market = useMarketInfo(marketAddress, true);
  const position = useUserPosition(marketAddress, address!);
  const { claimWinnings, isLoading, isSuccess, error } = useClaimWinnings(marketAddress);

  // Not connected
  if (!isConnected || !address) {
    return null;
  }

  // Market not finalized
  if (market.state !== MarketState.FINALIZED) {
    return null;
  }

  // No winning position
  const hasYesShares = position.yesShares && position.yesShares > 0n;
  const hasNoShares = position.noShares && position.noShares > 0n;
  const wonMarket = (market.result === Outcome.YES && hasYesShares) ||
                   (market.result === Outcome.NO && hasNoShares);

  if (!wonMarket) {
    return null;
  }

  // Already claimed
  if (isSuccess) {
    return (
      <div className={cn(
        'flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-lg',
        className
      )}>
        <CheckCircle className="w-5 h-5 text-green-400" />
        <span className="text-sm font-medium text-green-400">
          Claimed Successfully!
        </span>
      </div>
    );
  }

  const winningShares = market.result === Outcome.YES ? position.yesShares : position.noShares;

  const handleClaim = async () => {
    await claimWinnings();
    if (onSuccess) {
      onSuccess();
    }
  };

  if (variant === 'compact') {
    return (
      <div className={className}>
        <button
          onClick={handleClaim}
          disabled={isLoading}
          className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <ButtonLoading text="Claiming..." />
          ) : (
            <>
              <Trophy className="w-4 h-4" />
              Claim Winnings
            </>
          )}
        </button>
        {error && (
          <div className="mt-2">
            <TransactionError error={error} />
          </div>
        )}
      </div>
    );
  }

  // Default variant - full card
  return (
    <div className={cn('p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl', className)}>
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
          <Trophy className="w-6 h-6 text-green-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white mb-1">Congratulations! 🎉</h3>
          <p className="text-sm text-gray-300">
            You won this market and can claim your winnings
          </p>
        </div>
      </div>

      {/* Winnings info */}
      <div className="p-4 bg-gray-900/50 rounded-lg mb-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">Winning Shares</p>
            <p className="text-lg font-bold text-white">
              {formatBasedAmount(winningShares || 0n, 2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Outcome</p>
            <p className="text-lg font-bold text-green-400">
              {market.result === Outcome.YES ? 'YES' : 'NO'}
            </p>
          </div>
        </div>
      </div>

      {/* Claim button */}
      <button
        onClick={handleClaim}
        disabled={isLoading}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <ButtonLoading text="Claiming Winnings..." />
        ) : (
          'Claim Winnings'
        )}
      </button>

      {/* Error display */}
      {error && (
        <div className="mt-4">
          <TransactionError error={error} />
        </div>
      )}
    </div>
  );
}
