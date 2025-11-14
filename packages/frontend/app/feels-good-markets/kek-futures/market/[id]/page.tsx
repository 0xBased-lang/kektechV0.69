/**
 * KEKTECH 3.0 - Market Detail Page
 * View and interact with a specific prediction market
 */
'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { MarketHeader } from '@/components/kektech/market-details/MarketHeader';
import { MarketStats } from '@/components/kektech/market-details/MarketStats';
import { BettingInterface } from '@/components/kektech/market-details/BettingInterface';
import { LiveBetFeed } from '@/components/kektech/live/LiveBetFeed';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { Address } from 'viem';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CommentSection } from '@/components/engagement/CommentSection';
import { ProposalVoteButtons } from '@/components/engagement/ProposalVoteButtons';
import { ResolutionVoteForm } from '@/components/engagement/ResolutionVoteForm';
import { ResolutionVoteDisplay } from '@/components/engagement/ResolutionVoteDisplay';

export default function MarketDetailPage() {
  const params = useParams();
  const marketAddress = params.id as Address;
  const [activeEngagementTab, setActiveEngagementTab] = useState<'discussion' | 'sentiment' | 'resolution'>('discussion');

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

            {/* Engagement Section - KEKTECH Style */}
            <div className="mt-8">
              {/* Section Header */}
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-[#3fb8bd] font-fredoka mb-2">
                  Community Engagement
                </h3>
                <p className="text-gray-400 text-sm font-fredoka">
                  Discuss, vote on proposals, and participate in market resolution
                </p>
              </div>

              {/* Tabs Container - Using shadcn Tabs with KEKTECH styling */}
              <Tabs
                defaultValue="discussion"
                value={activeEngagementTab}
                onValueChange={(value) => setActiveEngagementTab(value as 'discussion' | 'sentiment' | 'resolution')}
                className="w-full"
              >
                {/* Tab List - KEKTECH styled */}
                <TabsList className="bg-gray-900 border border-gray-800 rounded-xl p-1 mb-6 w-full sm:w-auto">
                  <TabsTrigger
                    value="discussion"
                    className="font-fredoka font-medium text-sm data-[state=active]:bg-gray-950 data-[state=active]:text-[#3fb8bd] data-[state=active]:shadow-sm data-[state=active]:border-[#3fb8bd]/30 text-gray-400 hover:text-gray-300 transition-all rounded-lg"
                  >
                    💬 Discussion
                  </TabsTrigger>
                  <TabsTrigger
                    value="sentiment"
                    className="font-fredoka font-medium text-sm data-[state=active]:bg-gray-950 data-[state=active]:text-[#3fb8bd] data-[state=active]:shadow-sm data-[state=active]:border-[#3fb8bd]/30 text-gray-400 hover:text-gray-300 transition-all rounded-lg"
                  >
                    📊 Sentiment Voting
                  </TabsTrigger>
                  <TabsTrigger
                    value="resolution"
                    className="font-fredoka font-medium text-sm data-[state=active]:bg-gray-950 data-[state=active]:text-[#3fb8bd] data-[state=active]:shadow-sm data-[state=active]:border-[#3fb8bd]/30 text-gray-400 hover:text-gray-300 transition-all rounded-lg"
                  >
                    ⚖️ Resolution
                  </TabsTrigger>
                </TabsList>

                {/* Tab Content - Discussion */}
                <TabsContent value="discussion" className="mt-0">
                  <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
                    <CommentSection marketAddress={marketAddress} />
                  </div>
                </TabsContent>

                {/* Tab Content - Sentiment Voting */}
                <TabsContent value="sentiment" className="mt-0">
                  <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
                    <div className="max-w-3xl mx-auto">
                      <div className="mb-4">
                        <h4 className="text-lg font-bold text-white font-fredoka mb-2">
                          Vote on Market Proposals
                        </h4>
                        <p className="text-sm text-gray-400 font-fredoka">
                          Share your sentiment on how this market should resolve
                        </p>
                      </div>
                      <ProposalVoteButtons marketAddress={marketAddress} />
                    </div>
                  </div>
                </TabsContent>

                {/* Tab Content - Resolution */}
                <TabsContent value="resolution" className="mt-0">
                  <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
                    <div className="space-y-6">
                      <div className="mb-4">
                        <h4 className="text-lg font-bold text-white font-fredoka mb-2">
                          Market Resolution Status
                        </h4>
                        <p className="text-sm text-gray-400 font-fredoka">
                          View current resolution status and submit your vote when eligible
                        </p>
                      </div>

                      {/* Resolution Display */}
                      <ResolutionVoteDisplay marketAddress={marketAddress} />

                      {/* Resolution Voting Form */}
                      <div className="pt-6 border-t border-gray-800">
                        <ResolutionVoteForm marketAddress={marketAddress} />
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
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
