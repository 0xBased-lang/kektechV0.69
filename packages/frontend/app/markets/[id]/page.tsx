/**
 * KEKTECH 3.0 - Market Detail Page
 * View and interact with a specific prediction market
 */
'use client';

import { useParams } from 'next/navigation';
import { MarketHeader } from '@/components/kektech/market-details/MarketHeader';
import { MarketStats } from '@/components/kektech/market-details/MarketStats';
import { BettingInterface } from '@/components/kektech/market-details/BettingInterface';
import { LiveBetFeed } from '@/components/kektech/live/LiveBetFeed';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { Address } from 'viem';

export default function MarketDetailPage() {
  const params = useParams();
  const marketAddress = params.id as Address;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black">
      {/* Back Button */}
      <div className="border-b border-gray-800 bg-gray-950/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/markets"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Markets
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Market Info & Betting */}
          <div className="lg:col-span-2 space-y-6">
            {/* Market Header */}
            <MarketHeader marketAddress={marketAddress} />

            {/* Market Stats */}
            <MarketStats marketAddress={marketAddress} />

            {/* Betting Interface */}
            <BettingInterface marketAddress={marketAddress} />
          </div>

          {/* Right Column - Live Activity */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <h2 className="text-xl font-bold text-white mb-4">Live Bet Feed</h2>
              <LiveBetFeed marketAddress={marketAddress} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
