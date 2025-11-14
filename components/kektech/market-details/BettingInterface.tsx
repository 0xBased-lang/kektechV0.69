/**
 * KEKTECH 3.0 - Betting Interface
 * Place YES/NO bets on prediction markets
 */
'use client';

import { useState } from 'react';
import { usePlaceBet, useBuyPrice, useMarketInfo } from '@/lib/hooks/kektech';
import { useWallet } from '@/lib/hooks/kektech';
import { Outcome } from '@/lib/contracts/types';
import { ButtonLoading } from '../ui/LoadingSpinner';
import { TransactionError, InlineError } from '../ui/ErrorDisplay';
import { parseEther, formatEther } from 'viem';
import type { Address } from 'viem';
import { TrendingUp, TrendingDown, Wallet, AlertTriangle } from 'lucide-react';

// Market state names for user-friendly messages
const STATE_NAMES: Record<number, string> = {
  0: 'Proposed (Awaiting Approval)',
  1: 'Approved (Pending Activation)',
  2: 'Active',
  3: 'Resolving',
  4: 'Disputed',
  5: 'Finalized',
};

interface BettingInterfaceProps {
  marketAddress: Address;
  onSuccess?: () => void;
}

/**
 * Betting interface with YES/NO options
 */
export function BettingInterface({ marketAddress, onSuccess }: BettingInterfaceProps) {
  const { isConnected, balance, connect } = useWallet();
  const [outcome, setOutcome] = useState<Outcome>(Outcome.YES);
  const [amount, setAmount] = useState('1.0');
  const [error, setError] = useState<string>('');

  const { placeBet, isLoading, isSuccess, error: txError } = usePlaceBet(marketAddress);
  const { price: yesPrice } = useBuyPrice(marketAddress, Outcome.YES, parseEther(amount || '0'));
  const { price: noPrice } = useBuyPrice(marketAddress, Outcome.NO, parseEther(amount || '0'));

  // 🎯 FIX: Get market state to validate before allowing bets
  const market = useMarketInfo(marketAddress);
  const marketState = market.state;

  const handleBet = async () => {
    try {
      setError('');

      // 🎯 FIX: Validate market is in ACTIVE(2) state
      if (marketState !== 2) {
        const stateName = marketState !== undefined ? STATE_NAMES[marketState] : 'Unknown';
        setError(`Cannot bet: Market is "${stateName}". Only Active markets accept bets.`);
        return;
      }

      // Validate amount
      if (!amount || Number(amount) <= 0) {
        setError('Please enter a valid amount');
        return;
      }

      const betAmount = parseEther(amount);

      // Check balance
      if (balance && betAmount > balance) {
        setError('Insufficient balance');
        return;
      }

      await placeBet(outcome, betAmount);

      // Success
      if (onSuccess) {
        onSuccess();
      }

      // Reset form
      setAmount('1.0');
    } catch (err) {
      console.error('Bet error:', err);
    }
  };

  if (!isConnected) {
    return (
      <div className="p-6 bg-gray-900 rounded-xl border border-gray-800 text-center">
        <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-400 mb-4">Connect your wallet to place bets</p>
        <button
          onClick={() => connect()}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-kek-green to-[#4ecca7] text-black font-bold hover:scale-105 transition"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
      <h3 className="text-xl font-bold text-white mb-6">Place Your Bet</h3>

      {/* 🎯 FIX: Show warning if market is not ACTIVE */}
      {marketState !== undefined && marketState !== 2 && (
        <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-yellow-400 font-semibold mb-1">
              Market Status: {STATE_NAMES[marketState]}
            </p>
            <p className="text-yellow-300/80 text-sm">
              {marketState === 0 && 'This market is awaiting admin approval. Betting will open once activated.'}
              {marketState === 1 && 'This market is approved. An admin will activate betting soon.'}
              {marketState === 3 && 'This market is resolving. Betting is closed, outcome will be determined shortly.'}
              {marketState === 4 && 'This market is disputed. Admin review in progress.'}
              {marketState === 5 && 'This market is finalized. Betting is closed, winners can claim their rewards.'}
            </p>
          </div>
        </div>
      )}

      {/* Outcome selector */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => setOutcome(Outcome.YES)}
          className={`p-4 rounded-xl border-2 transition ${
            outcome === Outcome.YES
              ? 'border-green-500 bg-green-500/10'
              : 'border-gray-700 bg-gray-800 hover:border-green-500/50'
          }`}
        >
          <TrendingUp className={`w-6 h-6 mx-auto mb-2 ${outcome === Outcome.YES ? 'text-green-400' : 'text-gray-400'}`} />
          <p className={`font-bold ${outcome === Outcome.YES ? 'text-green-400' : 'text-gray-300'}`}>YES</p>
          {yesPrice && (
            <p className="text-xs text-gray-400 mt-1">
              {formatEther(yesPrice)} shares
            </p>
          )}
        </button>

        <button
          onClick={() => setOutcome(Outcome.NO)}
          className={`p-4 rounded-xl border-2 transition ${
            outcome === Outcome.NO
              ? 'border-red-500 bg-red-500/10'
              : 'border-gray-700 bg-gray-800 hover:border-red-500/50'
          }`}
        >
          <TrendingDown className={`w-6 h-6 mx-auto mb-2 ${outcome === Outcome.NO ? 'text-red-400' : 'text-gray-400'}`} />
          <p className={`font-bold ${outcome === Outcome.NO ? 'text-red-400' : 'text-gray-300'}`}>NO</p>
          {noPrice && (
            <p className="text-xs text-gray-400 mt-1">
              {formatEther(noPrice)} shares
            </p>
          )}
        </button>
      </div>

      {/* Amount input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Bet Amount (BASED)
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="1.0"
          step="0.1"
          min="0"
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-kek-green"
        />
        {balance && (
          <p className="text-xs text-gray-400 mt-1">
            Balance: {formatEther(balance)} BASED
          </p>
        )}
        {error && <InlineError message={error} />}
      </div>

      {/* Submit button */}
      <button
        onClick={handleBet}
        disabled={isLoading || isSuccess || marketState !== 2}
        className={`w-full py-4 rounded-xl font-bold transition ${
          marketState !== 2
            ? 'bg-gray-600 cursor-not-allowed'
            : outcome === Outcome.YES
            ? 'bg-green-500 hover:bg-green-600'
            : 'bg-red-500 hover:bg-red-600'
        } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isLoading ? (
          <ButtonLoading text="Placing Bet..." />
        ) : isSuccess ? (
          'Bet Placed! ✓'
        ) : marketState !== 2 ? (
          'Betting Not Available'
        ) : (
          `Bet ${amount} BASED on ${outcome === Outcome.YES ? 'YES' : 'NO'}`
        )}
      </button>

      {/* Transaction error */}
      {txError && (
        <div className="mt-4">
          <TransactionError error={txError} />
        </div>
      )}
    </div>
  );
}
