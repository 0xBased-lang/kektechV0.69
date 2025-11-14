/**
 * KEKTECH 3.0 - Community Prediction Markets
 * Social prediction markets platform with proposal voting and community engagement
 */
'use client';

import { useState, useMemo } from 'react';
import { useMarketList } from '@/lib/hooks/kektech';
import { useMarketInfoList } from '@/lib/hooks/useMarketInfoList';
import { useMarketFilters } from '@/lib/hooks/useMarketFilters';
import { MarketCard } from '@/components/kektech/markets/MarketCard';
import { MarketFilters } from '@/components/kektech/markets/MarketFilters';
import { HotTopicsSection } from '@/components/kektech/markets/HotTopicsSection';
import { LiveEventsFeed } from '@/components/real-time/LiveEventsFeed';
import { CommentOnlyFeed } from '@/components/kektech/feed/CommentOnlyFeed';
import { FeedModeToggle, useFeedMode } from '@/components/kektech/feed/FeedModeToggle';
import { CommonSection } from '@/components/kektech/social/CommonSection';
import { TopCommentsWidget } from '@/components/kektech/social/TopCommentsWidget';
import { LoadingSpinner } from '@/components/kektech/ui/LoadingSpinner';
import { MarketState } from '@/lib/contracts/types';
import { TrendingUp, Plus, Flame, Lightbulb, TrendingUp as ActiveIcon, Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import type { Address } from 'viem';

type TabKey = 'hot' | 'proposals' | 'active' | 'resolving' | 'finalized';

const TABS = [
  { key: 'hot' as TabKey, label: '🔥 HOT', icon: Flame, state: undefined },
  { key: 'proposals' as TabKey, label: '💡 PROPOSALS', icon: Lightbulb, state: MarketState.PROPOSED },
  { key: 'active' as TabKey, label: '📈 ACTIVE', icon: ActiveIcon, state: MarketState.ACTIVE },
  { key: 'resolving' as TabKey, label: '⏳ RESOLVING', icon: Clock, state: MarketState.RESOLVING },
  { key: 'finalized' as TabKey, label: '✅ RESOLVED', icon: CheckCircle, state: MarketState.FINALIZED },
] as const;

export default function MarketsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('hot');
  const [feedMode, setFeedMode] = useFeedMode();
  const { markets, isLoading: isLoadingMarkets } = useMarketList();

  // Fetch market info for all markets using the safe hook
  const { marketInfos, isLoading: isLoadingMarketData } = useMarketInfoList(markets);

  // Prepare markets for filtering (filter out markets with undefined info)
  const marketsForFiltering = useMemo(() => {
    return marketInfos
      .filter(({ info }) => info !== undefined)
      .map(({ address, info }) => ({
        address,
        info: info!,  // TypeScript: we know info is defined after filter
      }));
  }, [marketInfos]);

  // Apply advanced filtering
  const {
    filters,
    setFilters,
    filteredMarkets: allFilteredMarkets,
    totalCount,
  } = useMarketFilters(marketsForFiltering);

  // Apply tab-based filtering on top of search/sort filters
  const tabFilteredMarkets = useMemo(() => {
    const selectedTab = TABS.find(t => t.key === activeTab);

    // HOT tab shows all filtered markets
    if (!selectedTab || selectedTab.state === undefined) {
      return allFilteredMarkets;
    }

    // Other tabs filter by specific state
    return allFilteredMarkets.filter(
      (market) => market.info?.state === selectedTab.state  // 🎯 FIX: market.info is the nested structure
    );
  }, [allFilteredMarkets, activeTab]);

  // Extract addresses for rendering
  const displayMarkets = tabFilteredMarkets.map(({ address }) => address);

  // Combine loading states
  const isLoading = isLoadingMarkets || isLoadingMarketData;

  return (
    <div className="min-h-screen bg-terminal">
      {/* Header - Terminal Style */}
      <div className="border-b border-terminal bg-terminal-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#3fb8bd]/10 rounded-lg border border-[#3fb8bd]/20">
                <TrendingUp className="w-6 h-6 text-[#3fb8bd]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-terminal-primary mono-numbers">
                  KEKTECH Markets
                </h1>
                <p className="text-terminal-tertiary text-sm mt-0.5">
                  Trade predictions on BasedAI • Chain 32323
                </p>
              </div>
            </div>

            {/* Create Market Button - Terminal Style */}
            <Link
              href="/markets/create"
              className="flex items-center gap-2 px-4 py-2 bg-[#3fb8bd] hover:bg-[#3fb8bd]/90 text-terminal-black font-semibold rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-[#3fb8bd]/20"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create Market</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Tab Navigation - Terminal Style */}
      <div className="border-b border-terminal bg-terminal-card/50 sticky top-[73px] z-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-0.5 overflow-x-auto scrollbar-hide">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;

              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`
                    flex items-center gap-2 px-4 py-3 font-semibold text-sm whitespace-nowrap transition-all relative
                    ${isActive
                      ? 'text-[#3fb8bd] bg-terminal-elevated'
                      : 'text-terminal-tertiary hover:text-terminal-secondary hover:bg-terminal-elevated/50'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3fb8bd]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content - Three Column Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content - Market List (2/3 width) */}
          <div className="lg:col-span-2">
            {/* Advanced Filters */}
            <div className="mb-6">
              <MarketFilters
                filters={filters}
                onFiltersChange={setFilters}
                totalMarkets={totalCount}
                filteredCount={displayMarkets.length}
              />
            </div>

            {(isLoading || isLoadingMarketData) ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" text={isLoading ? "Loading markets..." : "Loading market data..."} />
              </div>
            ) : displayMarkets.length === 0 ? (
              <div className="text-center py-16 bg-terminal-card rounded-lg border border-terminal">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-bold text-terminal-primary mb-2">No Markets Found</h3>
                <p className="text-terminal-tertiary mb-6">
                  {activeTab === 'hot' ? 'Be the first to create a prediction market!' : 'No markets in this category yet.'}
                </p>
                {activeTab === 'hot' && (
                  <Link
                    href="/markets/create"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#3fb8bd] hover:bg-[#3fb8bd]/90 text-terminal-black font-semibold rounded-lg transition shadow-lg shadow-[#3fb8bd]/10"
                  >
                    <Plus className="w-5 h-5" />
                    Create Market
                  </Link>
                )}
              </div>
            ) : (
              <>
                {/* Hot Topics Section - HOT tab only */}
                {activeTab === 'hot' && markets && (
                  <HotTopicsSection markets={markets} maxTrending={3} />
                )}

                {/* All Markets List */}
                <div className="space-y-3">
                  {displayMarkets.map((marketAddress: Address) => (
                    <MarketCard key={marketAddress} marketAddress={marketAddress} />
                  ))}
                </div>
              </>
            )}

            {/* Info Section - Terminal Style */}
            {!isLoading && displayMarkets.length > 0 && (
              <div className="mt-12 p-6 bg-terminal-card rounded-lg border border-terminal">
                <h3 className="text-lg font-bold text-terminal-primary mb-4 flex items-center gap-2">
                  <span className="text-[#3fb8bd]">→</span>
                  How It Works
                </h3>
                <div className="grid md:grid-cols-3 gap-6 text-sm text-terminal-secondary">
                  <div>
                    <h4 className="font-semibold text-[#3fb8bd] mb-2 mono-numbers">01. Propose</h4>
                    <p>
                      Create proposals and get 10+ community votes.
                      Auto-activates when threshold met.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#3fb8bd] mb-2 mono-numbers">02. Trade</h4>
                    <p>
                      Place bets, discuss with evidence,
                      and engage with the community.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#3fb8bd] mb-2 mono-numbers">03. Resolve</h4>
                    <p>
                      Community consensus determines outcomes.
                      Winners claim rewards.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Common Section - Most Liked Comments */}
            {!isLoading && displayMarkets.length > 0 && (
              <CommonSection maxComments={10} className="mt-12" />
            )}
          </div>

          {/* Right Sidebar - Dual-Mode Feed (1/3 width) */}
          <div className="lg:col-span-1">
            <div className="sticky top-[176px] space-y-6">
              {/* Feed Mode Toggle */}
              <FeedModeToggle
                mode={feedMode}
                onModeChange={setFeedMode}
              />

              {/* Conditional Feed Rendering */}
              {feedMode === 'all' ? (
                <LiveEventsFeed
                  subscribeToAll={true}
                  maxEvents={20}
                />
              ) : (
                <CommentOnlyFeed
                  subscribeToAll={true}
                  maxComments={15}
                />
              )}

              {/* Comment of the Day Widget */}
              <TopCommentsWidget />

              {/* Platform Stats - Terminal Style */}
              <div className="p-4 bg-terminal-card rounded-lg border border-terminal">
                <h4 className="font-semibold text-terminal-primary mb-3 flex items-center gap-2">
                  <span className="text-[#3fb8bd]">◆</span>
                  Platform Stats
                </h4>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-terminal-tertiary">Markets</span>
                    <span className="text-terminal-primary font-semibold mono-numbers px-2 py-0.5 bg-terminal-elevated rounded">
                      {markets?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-terminal-tertiary">View</span>
                    <span className="text-[#3fb8bd] font-semibold text-xs">
                      {TABS.find(t => t.key === activeTab)?.label}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-terminal-tertiary">Feed</span>
                    <span className="text-[#3fb8bd] font-semibold text-xs capitalize">
                      {feedMode === 'all' ? 'All Activity' : 'Comments'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-terminal">
                    <span className="text-terminal-tertiary">Chain</span>
                    <span className="text-terminal-secondary font-semibold mono-numbers text-xs">
                      32323
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
