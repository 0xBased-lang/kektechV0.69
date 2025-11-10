/**
 * KEKTECH 3.0 - Prediction Markets Page
 * Browse all active and past prediction markets
 */
'use client';

import { MarketList } from '@/components/kektech/markets/MarketList';
import { LiveEventsFeed } from '@/components/real-time/LiveEventsFeed';
import { TrendingUp, Plus } from 'lucide-react';
import Link from 'next/link';

export default function MarketsPage() {

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-950/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#3fb8bd]/10 rounded-xl">
                <TrendingUp className="w-8 h-8 text-[#3fb8bd]" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Prediction Markets
                </h1>
                <p className="text-gray-400 mt-1">
                  Bet on future events with BASED tokens
                </p>
              </div>
            </div>

            {/* Create Market Button */}
            <Link
              href="/feels-good-markets/kek-futures/create"
              className="flex items-center gap-2 px-6 py-3 bg-[#3fb8bd] hover:bg-[#3fb8bd]/90 text-white font-semibold rounded-xl transition"
            >
              <Plus className="w-5 h-5" />
              Create Market
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Market List (2/3 width) */}
          <div className="lg:col-span-2">
            <MarketList />

            {/* Info Footer */}
            <div className="mt-12 p-6 bg-gray-900/50 rounded-xl border border-gray-800">
              <h3 className="text-lg font-bold text-white mb-3">
                How Prediction Markets Work
              </h3>
              <div className="grid md:grid-cols-3 gap-6 text-sm text-gray-300">
                <div>
                  <h4 className="font-semibold text-[#3fb8bd] mb-2">1. Browse & Bet</h4>
                  <p>
                    Find markets about future events and place bets with BASED tokens.
                    Your odds are determined by the LMSR bonding curve.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-[#3fb8bd] mb-2">2. Wait for Resolution</h4>
                  <p>
                    After the event occurs, the market enters a 48-hour dispute window
                    before being finalized.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-[#3fb8bd] mb-2">3. Claim Winnings</h4>
                  <p>
                    If your prediction was correct, claim your winnings plus a share
                    of the losing pool!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Live Events Feed (1/3 width) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <LiveEventsFeed
                subscribeToAll={true}
                maxEvents={10}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
