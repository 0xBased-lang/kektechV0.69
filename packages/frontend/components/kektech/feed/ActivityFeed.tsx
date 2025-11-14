/**
 * KEKTECH 3.0 - Activity Feed Component
 * Displays platform activity in a Twitter-style feed
 */
'use client';

import { useState, useEffect } from 'react';
import { FeedPost } from './FeedPost';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { MessageSquare, TrendingUp, Clock } from 'lucide-react';

export type FeedTab = 'all' | 'markets' | 'comments' | 'following';

export type ActivityType = 'market_created' | 'bet_placed' | 'comment' | 'resolution_vote' | 'market_resolved';

export interface Activity {
  id: string;
  type: ActivityType;
  userAddress: string;
  marketAddress?: string;
  timestamp: number;
  content?: string;
  metadata?: {
    marketQuestion?: string;
    betAmount?: string;
    betSide?: 'YES' | 'NO';
    commentId?: string;
    parentCommentId?: string;
    outcome?: 'YES' | 'NO' | 'INVALID';
  };
}

interface ActivityFeedProps {
  activeTab: FeedTab;
}

/**
 * Activity feed component with real-time updates
 */
export function ActivityFeed({ activeTab }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<ActivityType | 'all'>('all');

  // Load activities
  useEffect(() => {
    loadActivities();
  }, [activeTab, filter]);

  const loadActivities = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      // For now, using mock data
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockActivities: Activity[] = [
        {
          id: '1',
          type: 'market_created',
          userAddress: '0x1234...5678',
          marketAddress: '0x31d2BC49A6FD4a066F5f8AC61Acd0E6c9105DD84',
          timestamp: Date.now() - 300000, // 5 min ago
          metadata: {
            marketQuestion: 'Will Bitcoin reach $100k by end of 2025?',
          },
        },
        {
          id: '2',
          type: 'bet_placed',
          userAddress: '0xabcd...efgh',
          marketAddress: '0x31d2BC49A6FD4a066F5f8AC61Acd0E6c9105DD84',
          timestamp: Date.now() - 600000, // 10 min ago
          metadata: {
            marketQuestion: 'Will Bitcoin reach $100k by end of 2025?',
            betAmount: '10 BASED',
            betSide: 'YES',
          },
        },
        {
          id: '3',
          type: 'comment',
          userAddress: '0xuser...1234',
          marketAddress: '0x31d2BC49A6FD4a066F5f8AC61Acd0E6c9105DD84',
          timestamp: Date.now() - 900000, // 15 min ago
          content: 'Based on current market trends and institutional adoption, I think YES is very likely. The halving effect combined with ETF approvals could push BTC to new ATHs.',
          metadata: {
            marketQuestion: 'Will Bitcoin reach $100k by end of 2025?',
            commentId: 'comment-123',
          },
        },
      ];

      setActivities(mockActivities);
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter activities based on tab and filter
  const filteredActivities = activities.filter(activity => {
    // Apply tab filter
    if (activeTab === 'markets' && activity.type !== 'market_created') return false;
    if (activeTab === 'comments' && activity.type !== 'comment') return false;
    // TODO: Implement following filter
    if (activeTab === 'following') return true; // Placeholder

    // Apply type filter
    if (filter !== 'all' && activity.type !== filter) return false;

    return true;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" text="Loading activity..." />
      </div>
    );
  }

  if (filteredActivities.length === 0) {
    return (
      <div className="text-center py-16 bg-terminal-card rounded-lg border border-terminal">
        <div className="text-6xl mb-4">📭</div>
        <h3 className="text-xl font-bold text-terminal-primary mb-2">No Activity Yet</h3>
        <p className="text-terminal-tertiary">
          {activeTab === 'following'
            ? 'Follow users to see their activity here'
            : 'Be the first to create a market or comment!'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Activity Type Filter */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap transition ${
            filter === 'all'
              ? 'bg-kek-green/10 border-kek-green text-kek-green'
              : 'bg-terminal-elevated border-terminal text-terminal-tertiary hover:border-kek-green/50'
          }`}
        >
          All Types
        </button>
        <button
          onClick={() => setFilter('market_created')}
          className={`px-3 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
            filter === 'market_created'
              ? 'bg-kek-green/10 border-kek-green text-kek-green'
              : 'bg-terminal-elevated border-terminal text-terminal-tertiary hover:border-kek-green/50'
          }`}
        >
          <TrendingUp className="w-3 h-3" />
          Markets
        </button>
        <button
          onClick={() => setFilter('comment')}
          className={`px-3 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
            filter === 'comment'
              ? 'bg-kek-green/10 border-kek-green text-kek-green'
              : 'bg-terminal-elevated border-terminal text-terminal-tertiary hover:border-kek-green/50'
          }`}
        >
          <MessageSquare className="w-3 h-3" />
          Comments
        </button>
        <button
          onClick={() => setFilter('bet_placed')}
          className={`px-3 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
            filter === 'bet_placed'
              ? 'bg-kek-green/10 border-kek-green text-kek-green'
              : 'bg-terminal-elevated border-terminal text-terminal-tertiary hover:border-kek-green/50'
          }`}
        >
          <Clock className="w-3 h-3" />
          Trades
        </button>
      </div>

      {/* Activity Feed */}
      <div className="space-y-3">
        {filteredActivities.map((activity) => (
          <FeedPost key={activity.id} activity={activity} />
        ))}
      </div>

      {/* Load More Button */}
      <div className="flex justify-center pt-4">
        <button className="px-6 py-2.5 bg-terminal-card hover:bg-terminal-elevated border border-terminal hover:border-kek-green/50 rounded-lg text-terminal-secondary hover:text-kek-green transition text-sm font-medium">
          Load More Activity
        </button>
      </div>
    </div>
  );
}
