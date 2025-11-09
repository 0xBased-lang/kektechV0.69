'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useMarketList, useMarketInfo } from '@/lib/hooks/kektech/useMarketData';
import {
  useApproveMarket,
  useActivateMarket,
  useResolveMarket,
} from '@/lib/hooks/kektech/useMarketActions';
import type { Address } from 'viem';

export default function AdminDashboard() {
  const { address, isConnected } = useAccount();
  const { markets, isLoading } = useMarketList(true);
  const [selectedMarket, setSelectedMarket] = useState<Address | null>(null);
  const [resolveOutcome, setResolveOutcome] = useState<0 | 1>(0);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Admin Dashboard</h1>
          <p className="text-gray-400 mb-8">Please connect your wallet to access admin functions</p>
          <button className="bg-[#3fb8bd] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#2fa8ad] transition-colors">
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading markets...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Manage prediction markets</p>
          <p className="text-sm text-gray-500 mt-2">Connected as: {address}</p>
        </header>

        <div className="grid gap-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Markets ({markets.length})</h2>
            <div className="grid gap-4">
              {markets.length === 0 ? (
                <div className="bg-gray-900 p-6 rounded-lg text-center text-gray-400">
                  No markets found
                </div>
              ) : (
                markets.map((marketAddress) => (
                  <MarketAdminCard
                    key={marketAddress}
                    marketAddress={marketAddress}
                    isSelected={selectedMarket === marketAddress}
                    onSelect={() => setSelectedMarket(marketAddress)}
                  />
                ))
              )}
            </div>
          </section>

          {selectedMarket && (
            <section className="bg-gray-900 p-6 rounded-lg">
              <h2 className="text-2xl font-semibold mb-4">Market Actions</h2>
              <MarketActions marketAddress={selectedMarket} />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function MarketAdminCard({
  marketAddress,
  isSelected,
  onSelect,
}: {
  marketAddress: Address;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const marketInfo = useMarketInfo(marketAddress, true);

  const stateNames = ['PROPOSED', 'APPROVED', 'ACTIVE', 'CLOSED', 'RESOLVING', 'FINALIZED'];
  const stateName = marketInfo.state !== undefined ? stateNames[marketInfo.state] : 'UNKNOWN';

  const stateColors: Record<string, string> = {
    PROPOSED: 'bg-yellow-600',
    APPROVED: 'bg-blue-600',
    ACTIVE: 'bg-green-600',
    CLOSED: 'bg-orange-600',
    RESOLVING: 'bg-purple-600',
    FINALIZED: 'bg-gray-600',
  };

  return (
    <div
      className={`bg-gray-800 p-4 rounded-lg cursor-pointer border-2 transition-all ${
        isSelected ? 'border-[#3fb8bd]' : 'border-transparent hover:border-gray-700'
      }`}
      onClick={onSelect}
      data-testid="market-admin-card"
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white line-clamp-2">
            {marketInfo.question || marketAddress.slice(0, 10) + '...'}
          </h3>
          {marketInfo.description && (
            <p className="text-sm text-gray-400 mt-1 line-clamp-1">{marketInfo.description}</p>
          )}
        </div>
        <span
          className={`${
            stateColors[stateName] || 'bg-gray-600'
          } text-white px-3 py-1 rounded-full text-xs font-semibold ml-4`}
        >
          {stateName}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
        <div>
          <p className="text-gray-500">Creator</p>
          <p className="text-white font-mono text-xs">
            {marketInfo.creator ? `${marketInfo.creator.slice(0, 6)}...${marketInfo.creator.slice(-4)}` : '-'}
          </p>
        </div>
        <div>
          <p className="text-gray-500">Volume</p>
          <p className="text-white">
            {marketInfo.totalVolume
              ? `${(Number(marketInfo.totalVolume) / 1e18).toFixed(2)} BASED`
              : '0 BASED'}
          </p>
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-3 font-mono">{marketAddress}</p>
    </div>
  );
}

function MarketActions({ marketAddress }: { marketAddress: Address }) {
  const marketInfo = useMarketInfo(marketAddress, true);
  const approveMarket = useApproveMarket(marketAddress);
  const activateMarket = useActivateMarket(marketAddress);
  const resolveMarket = useResolveMarket(marketAddress);
  const [selectedOutcome, setSelectedOutcome] = useState<0 | 1>(0);

  const stateNames = ['PROPOSED', 'APPROVED', 'ACTIVE', 'CLOSED', 'RESOLVING', 'FINALIZED'];
  const currentState = marketInfo.state !== undefined ? stateNames[marketInfo.state] : 'UNKNOWN';

  return (
    <div className="space-y-4">
      <div className="bg-gray-800 p-4 rounded">
        <p className="text-sm text-gray-400 mb-1">Current State</p>
        <p className="text-2xl font-bold text-[#3fb8bd]">{currentState}</p>
      </div>

      <div className="grid gap-3">
        {/* Approve Market - Only show if PROPOSED */}
        {marketInfo.state === 0 && (
          <div className="bg-gray-800 p-4 rounded">
            <h3 className="font-semibold mb-2">Approve Market</h3>
            <p className="text-sm text-gray-400 mb-3">
              Approve this proposed market to move it to APPROVED state
            </p>
            <button
              onClick={() => approveMarket.approveMarket()}
              disabled={approveMarket.isLoading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              data-testid="approve-market-btn"
            >
              {approveMarket.isLoading ? 'Approving...' : 'Approve Market'}
            </button>
            {approveMarket.isSuccess && (
              <p className="text-green-400 text-sm mt-2">✓ Market approved successfully!</p>
            )}
            {approveMarket.isError && (
              <p className="text-red-400 text-sm mt-2">
                Error: {approveMarket.error?.message || 'Failed to approve'}
              </p>
            )}
          </div>
        )}

        {/* Activate Market - Only show if APPROVED */}
        {marketInfo.state === 1 && (
          <div className="bg-gray-800 p-4 rounded">
            <h3 className="font-semibold mb-2">Activate Market</h3>
            <p className="text-sm text-gray-400 mb-3">
              Activate this market to enable betting (moves to ACTIVE state)
            </p>
            <button
              onClick={() => activateMarket.activateMarket()}
              disabled={activateMarket.isLoading}
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              data-testid="activate-market-btn"
            >
              {activateMarket.isLoading ? 'Activating...' : 'Activate Market'}
            </button>
            {activateMarket.isSuccess && (
              <p className="text-green-400 text-sm mt-2">✓ Market activated successfully!</p>
            )}
            {activateMarket.isError && (
              <p className="text-red-400 text-sm mt-2">
                Error: {activateMarket.error?.message || 'Failed to activate'}
              </p>
            )}
          </div>
        )}

        {/* Resolve Market - Only show if CLOSED */}
        {marketInfo.state === 3 && (
          <div className="bg-gray-800 p-4 rounded">
            <h3 className="font-semibold mb-2">Resolve Market</h3>
            <p className="text-sm text-gray-400 mb-3">
              Select the winning outcome to resolve this market
            </p>
            <div className="space-y-3">
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedOutcome(0)}
                  className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                    selectedOutcome === 0
                      ? 'bg-[#4ecca7] text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  YES Wins
                </button>
                <button
                  onClick={() => setSelectedOutcome(1)}
                  className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                    selectedOutcome === 1
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  NO Wins
                </button>
              </div>
              <button
                onClick={() => resolveMarket.resolveMarket(selectedOutcome)}
                disabled={resolveMarket.isLoading}
                className="w-full bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                data-testid="resolve-market-btn"
              >
                {resolveMarket.isLoading ? 'Resolving...' : `Resolve as ${selectedOutcome === 0 ? 'YES' : 'NO'}`}
              </button>
              {resolveMarket.isSuccess && (
                <p className="text-green-400 text-sm">✓ Market resolved successfully!</p>
              )}
              {resolveMarket.isError && (
                <p className="text-red-400 text-sm">
                  Error: {resolveMarket.error?.message || 'Failed to resolve'}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Info for other states */}
        {marketInfo.state === 2 && (
          <div className="bg-gray-800 p-4 rounded text-center text-gray-400">
            Market is active. Wait for it to close before resolving.
          </div>
        )}
        {marketInfo.state === 4 && (
          <div className="bg-gray-800 p-4 rounded text-center text-gray-400">
            Market is in resolving state. Waiting for dispute period to end.
          </div>
        )}
        {marketInfo.state === 5 && (
          <div className="bg-gray-800 p-4 rounded text-center text-gray-400">
            Market is finalized. No further actions needed.
          </div>
        )}
      </div>
    </div>
  );
}
