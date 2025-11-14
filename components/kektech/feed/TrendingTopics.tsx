/**
 * KEKTECH 3.0 - Trending Topics Widget
 * Shows trending hashtags and topics
 */
'use client';

import { TrendingUp, Hash } from 'lucide-react';
import Link from 'next/link';

interface TrendingTopic {
  tag: string;
  count: number;
  change: number; // percentage change
}

/**
 * Trending topics widget
 */
export function TrendingTopics() {
  // TODO: Replace with actual API data
  const mockTopics: TrendingTopic[] = [
    { tag: 'Bitcoin', count: 1247, change: 12.5 },
    { tag: 'Ethereum', count: 892, change: 8.3 },
    { tag: 'BasedAI', count: 673, change: 25.7 },
    { tag: 'DeFi', count: 456, change: -3.2 },
    { tag: 'Predictions', count: 389, change: 15.8 },
  ];

  return (
    <div className="terminal-card p-4">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-kek-green" />
        <h3 className="text-base font-bold text-terminal-primary">Trending Topics</h3>
      </div>

      <div className="space-y-3">
        {mockTopics.map((topic, index) => (
          <Link
            key={topic.tag}
            href={`/feed?tag=${encodeURIComponent(topic.tag)}`}
            className="block p-3 hover:bg-terminal-elevated rounded-lg transition group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-xs text-terminal-tertiary mono-numbers">
                  #{index + 1}
                </span>
                <Hash className="w-3 h-3 text-kek-green flex-shrink-0" />
                <span className="text-sm font-semibold text-terminal-primary group-hover:text-kek-green transition truncate">
                  {topic.tag}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <span className={`text-xs font-semibold mono-numbers ${
                  topic.change > 0 ? 'text-bullish' : topic.change < 0 ? 'text-bearish' : 'text-terminal-tertiary'
                }`}>
                  {topic.change > 0 && '+'}{topic.change.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="mt-1.5 ml-7">
              <span className="text-xs text-terminal-tertiary">
                {topic.count.toLocaleString()} posts
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* View All Link */}
      <Link
        href="/feed?view=trending"
        className="block mt-4 pt-3 border-t border-terminal text-center text-sm text-kek-green hover:text-kek-green/80 transition"
      >
        View all trending topics
      </Link>
    </div>
  );
}
