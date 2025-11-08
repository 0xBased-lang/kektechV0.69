/**
 * KEKTECH 3.0 - Position List Component
 * Display all user positions across markets
 */
'use client';

import { useMarketList } from '@/lib/hooks/kektech';
import { useWallet } from '@/lib/hooks/kektech';
import { PositionCard } from './PositionCard';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Wallet, TrendingUp } from 'lucide-react';
import type { Address } from 'viem';

interface PositionListProps {
  filter?: 'all' | 'active' | 'won' | 'lost';
}

/**
 * List of all user positions
 */
export function PositionList({ filter = 'all' }: PositionListProps) {
  const { address, isConnected, connect } = useWallet();
  const { markets, isLoading } = useMarketList();

  // Wallet connection required
  if (!isConnected || !address) {
    return (
      <div className="p-12 bg-gray-900 rounded-xl border border-gray-800 text-center">
        <Wallet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h3>
        <p className="text-gray-400 mb-6">Connect your wallet to see your positions</p>
        <button
          onClick={() => connect()}
          className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#3fb8bd] to-[#4ecca7] text-black font-bold hover:scale-105 transition"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" text="Loading your positions..." />
      </div>
    );
  }

  if (!markets || markets.length === 0) {
    return (
      <div className="text-center py-12">
        <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-400 text-lg">No markets found</p>
        <p className="text-gray-500 text-sm mt-2">
          Start betting on prediction markets to see your positions here
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Filter buttons */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { value: 'all', label: 'All Positions' },
          { value: 'active', label: 'Active' },
          { value: 'won', label: 'Won' },
          { value: 'lost', label: 'Lost' },
        ].map(({ value, label }) => (
          <button
            key={value}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === value
                ? 'bg-[#3fb8bd] text-black'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Position grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {markets.map((marketAddress: Address) => (
          <PositionCard
            key={marketAddress}
            marketAddress={marketAddress}
            userAddress={address}
            showMarketInfo
          />
        ))}
      </div>
    </div>
  );
}
