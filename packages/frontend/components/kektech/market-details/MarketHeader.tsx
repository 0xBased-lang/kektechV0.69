/**
 * KEKTECH 3.0 - Market Header Component
 * Detailed market information header
 */
'use client';

import { useMarketInfo } from '@/lib/hooks/kektech';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { MarketState } from '@/lib/contracts/types';
import { formatRelativeTime, formatDate, copyToClipboard, formatAddress } from '@/lib/utils';
import { Calendar, Clock, Tag, User, ExternalLink, Copy, CheckCircle } from 'lucide-react';
import type { Address } from 'viem';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface MarketHeaderProps {
  marketAddress: Address;
}

const stateConfig = {
  [MarketState.PROPOSED]: {
    label: 'Proposed',
    color: 'text-gray-400',
    bg: 'bg-gray-500/10',
    border: 'border-gray-500/30',
  },
  [MarketState.APPROVED]: {
    label: 'Approved',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
  },
  [MarketState.ACTIVE]: {
    label: 'Active - Betting Open',
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
  },
  [MarketState.RESOLVING]: {
    label: 'Resolving - 48h Dispute Window',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
  },
  [MarketState.DISPUTED]: {
    label: 'Disputed - Under Review',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
  },
  [MarketState.FINALIZED]: {
    label: 'Finalized - Claims Open',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
  },
};

/**
 * Market header with full details
 */
export function MarketHeader({ marketAddress }: MarketHeaderProps) {
  const market = useMarketInfo(marketAddress, true);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(marketAddress);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (market.isLoading) {
    return (
      <div className="p-8 bg-gray-900 rounded-xl border border-gray-800">
        <LoadingSpinner size="lg" text="Loading market details..." />
      </div>
    );
  }

  if (!market.question) {
    return (
      <div className="p-8 bg-gray-900 rounded-xl border border-gray-800 text-center">
        <p className="text-gray-400">Market not found</p>
      </div>
    );
  }

  const config = stateConfig[market.state || MarketState.PROPOSED];

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      {/* Status banner */}
      <div className={cn('px-6 py-3 border-b', config.bg, config.border)}>
        <div className="flex items-center justify-between">
          <p className={cn('text-sm font-semibold', config.color)}>
            {config.label}
          </p>
          {market.state === MarketState.ACTIVE && market.endTime && (
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Ends {formatRelativeTime(Number(market.endTime))}
            </p>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="p-6">
        {/* Question */}
        <h1 className="text-3xl font-bold text-white mb-4">
          {market.question}
        </h1>

        {/* Description */}
        {market.description && (
          <p className="text-gray-300 mb-6 whitespace-pre-wrap leading-relaxed">
            {market.description}
          </p>
        )}

        {/* Metadata grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-6 border-b border-gray-800">
          {/* Category */}
          {market.category && (
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Category</p>
                <p className="text-sm font-semibold text-white">{market.category}</p>
              </div>
            </div>
          )}

          {/* Creator */}
          {market.creator && (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Creator</p>
                <p className="text-sm font-semibold text-white font-mono">
                  {formatAddress(market.creator, 4)}
                </p>
              </div>
            </div>
          )}

          {/* Created date */}
          {market.createdAt && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Created</p>
                <p className="text-sm font-semibold text-white">
                  {formatDate(Number(market.createdAt))}
                </p>
              </div>
            </div>
          )}

          {/* End date */}
          {market.endTime && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">End Date</p>
                <p className="text-sm font-semibold text-white">
                  {formatDate(Number(market.endTime))}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Contract address */}
        <div className="mt-6 flex items-center gap-3">
          <p className="text-xs text-gray-400">Contract:</p>
          <code className="text-xs text-gray-300 font-mono bg-gray-800 px-3 py-1 rounded">
            {formatAddress(marketAddress, 6)}
          </code>
          <button
            onClick={handleCopy}
            className="p-1 hover:bg-gray-800 rounded transition"
            title="Copy address"
          >
            {copied ? (
              <CheckCircle className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-gray-400" />
            )}
          </button>
          <a
            href={`https://explorer.bf1337.org/address/${marketAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 hover:bg-gray-800 rounded transition"
            title="View on explorer"
          >
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </a>
        </div>
      </div>
    </div>
  );
}
