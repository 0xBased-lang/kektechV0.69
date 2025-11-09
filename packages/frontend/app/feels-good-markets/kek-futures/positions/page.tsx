'use client';

import { useState } from 'react';
import { PositionList } from '@/components/kektech/positions/PositionList';
import { useMarketList, useWallet } from '@/lib/hooks/kektech';
import { TrendingUp, Wallet as WalletIcon, DollarSign, Award } from 'lucide-react';

export default function PositionsPage() {
  const [filter, setFilter] = useState<'all' | 'active' | 'won' | 'lost'>('all');
  const { address, isConnected } = useWallet();
  const { markets } = useMarketList();

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">My Positions</h1>
          <p className="text-gray-400">Track your prediction market positions and winnings</p>
        </div>

        {/* Portfolio Summary */}
        {isConnected && address && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={<WalletIcon className="w-6 h-6" />}
              title="Active Markets"
              value={markets.length.toString()}
              subtitle="Markets with positions"
            />
            <StatCard
              icon={<DollarSign className="w-6 h-6" />}
              title="Total Invested"
              value="0.00 BASED"
              subtitle="Across all markets"
              note="Coming soon"
            />
            <StatCard
              icon={<TrendingUp className="w-6 h-6" />}
              title="Current Value"
              value="0.00 BASED"
              subtitle="Current portfolio value"
              note="Coming soon"
            />
            <StatCard
              icon={<Award className="w-6 h-6" />}
              title="Total P&L"
              value="+0.00 BASED"
              subtitle="Profit/Loss"
              valueColor="text-green-400"
              note="Coming soon"
            />
          </div>
        )}

        {/* Filter Tabs */}
        {isConnected && (
          <div className="flex gap-2 mb-6 flex-wrap">
            {[
              { value: 'all' as const, label: 'All Positions' },
              { value: 'active' as const, label: 'Active' },
              { value: 'won' as const, label: 'Won' },
              { value: 'lost' as const, label: 'Lost' },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`px-6 py-3 rounded-lg font-semibold transition ${
                  filter === value
                    ? 'bg-[#3fb8bd] text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
                data-testid={`filter-${value}`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Position List */}
        <PositionList filter={filter} />
      </div>
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
  subtitle,
  valueColor = 'text-white',
  note,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  valueColor?: string;
  note?: string;
}) {
  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-gray-800 rounded-lg text-[#3fb8bd]">{icon}</div>
        <h3 className="text-sm font-medium text-gray-400">{title}</h3>
      </div>
      <div className="mb-1">
        <p className={`text-3xl font-bold ${valueColor}`}>{value}</p>
      </div>
      <p className="text-sm text-gray-500">{subtitle}</p>
      {note && (
        <p className="text-xs text-yellow-600 mt-2 italic">
          ℹ️ {note}
        </p>
      )}
    </div>
  );
}
