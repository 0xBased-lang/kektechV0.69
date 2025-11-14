/**
 * KEKTECH 3.0 - Global Activity Feed
 * Twitter-style social feed for all platform activity
 */
'use client';

import { useState } from 'react';
import { ActivityFeed } from '@/components/kektech/feed/ActivityFeed';
import { CreatePostForm } from '@/components/kektech/feed/CreatePostForm';
import { TrendingTopics } from '@/components/kektech/feed/TrendingTopics';
import { TopTraders } from '@/components/kektech/social/TopTraders';
import { MessageSquare, TrendingUp, Users, Zap } from 'lucide-react';
import { useAccount } from 'wagmi';

type FeedTab = 'all' | 'markets' | 'comments' | 'following';

const FEED_TABS = [
  { key: 'all' as FeedTab, label: 'All Activity', icon: Zap },
  { key: 'markets' as FeedTab, label: 'Markets', icon: TrendingUp },
  { key: 'comments' as FeedTab, label: 'Comments', icon: MessageSquare },
  { key: 'following' as FeedTab, label: 'Following', icon: Users },
] as const;

export default function GlobalFeedPage() {
  const [activeTab, setActiveTab] = useState<FeedTab>('all');
  const { address: userAddress } = useAccount();

  return (
    <div className="min-h-screen bg-terminal">
      {/* Header */}
      <div className="border-b border-terminal bg-terminal-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-kek-green/10 rounded-lg border border-kek-green/20">
              <MessageSquare className="w-6 h-6 text-kek-green" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-terminal-primary mono-numbers">
                Global Feed
              </h1>
              <p className="text-terminal-tertiary text-sm mt-0.5">
                Community activity and discussions
              </p>
            </div>
          </div>
        </div>

        {/* Feed Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-0.5 overflow-x-auto scrollbar-hide">
            {FEED_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`
                    flex items-center gap-2 px-4 py-3 font-semibold text-sm whitespace-nowrap transition-all relative
                    ${isActive
                      ? 'text-kek-green bg-terminal-elevated'
                      : 'text-terminal-tertiary hover:text-terminal-secondary hover:bg-terminal-elevated/50'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-kek-green" />
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
          {/* Left Column - Feed (2/3 width) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Create Post Form - Only show when connected */}
            {userAddress && (
              <div className="mb-6">
                <CreatePostForm />
              </div>
            )}

            {/* Activity Feed */}
            <ActivityFeed activeTab={activeTab} />
          </div>

          {/* Right Sidebar - Trending & Stats (1/3 width) */}
          <div className="space-y-6">
            {/* Trending Topics */}
            <TrendingTopics />

            {/* Top Traders */}
            <TopTraders />

            {/* Platform Stats */}
            <div className="p-4 bg-terminal-card rounded-lg border border-terminal">
              <h4 className="font-semibold text-terminal-primary mb-3 flex items-center gap-2">
                <span className="text-kek-green">◆</span>
                Platform Stats
              </h4>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-terminal-tertiary">Total Markets</span>
                  <span className="text-terminal-primary font-semibold mono-numbers px-2 py-0.5 bg-terminal-elevated rounded">
                    -
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-terminal-tertiary">Active Traders</span>
                  <span className="text-terminal-primary font-semibold mono-numbers px-2 py-0.5 bg-terminal-elevated rounded">
                    -
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-terminal-tertiary">Total Volume</span>
                  <span className="text-terminal-primary font-semibold mono-numbers px-2 py-0.5 bg-terminal-elevated rounded">
                    - BASED
                  </span>
                </div>
              </div>
            </div>

            {/* Feed Info */}
            <div className="p-4 bg-terminal-card rounded-lg border border-terminal">
              <h4 className="font-semibold text-terminal-primary mb-2 flex items-center gap-2">
                <span className="text-kek-green">→</span>
                About Feed
              </h4>
              <p className="text-sm text-terminal-tertiary">
                The global feed shows all platform activity including market creation, trades,
                comments, and resolution votes. Connect your wallet to participate in discussions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
