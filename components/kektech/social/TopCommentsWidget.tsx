/**
 * KEKTECH 3.0 - Top Comments Widget
 * Sidebar widget showing "Comment of the Day"
 */
'use client';

import { useTopComments } from '@/lib/hooks/useTopComments';
import { ThumbsUp, Crown, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { truncate } from '@/lib/utils';
import { LoadingSpinner } from '@/components/kektech/ui/LoadingSpinner';

interface TopCommentsWidgetProps {
  /** Custom className */
  className?: string;
}

/**
 * Compact widget showing the #1 comment of the day
 * - Updates daily
 * - Click to view full context
 * - Encourages quality discussions
 */
export function TopCommentsWidget({ className = '' }: TopCommentsWidgetProps) {
  const { comments, isLoading, error } = useTopComments('day', 1);

  const topComment = comments[0];

  if (isLoading) {
    return (
      <div className={`p-4 bg-gray-900/50 rounded-xl border border-gray-800 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="sm" />
        </div>
      </div>
    );
  }

  if (error || !topComment) {
    return null; // Don't show widget if no data
  }

  return (
    <div className={`p-4 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-xl border border-yellow-500/20 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Crown className="w-5 h-5 text-yellow-500" />
        <h4 className="font-bold text-white flex items-center gap-2">
          Comment of the Day
          <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" />
        </h4>
      </div>

      {/* Top Comment */}
      <Link
        href={`/market/${topComment.marketAddress}#comment-${topComment.id}`}
        className="block group"
      >
        {/* Comment Text */}
        <div className="mb-3 p-3 bg-gray-900/50 rounded-lg">
          <p className="text-sm text-gray-200 group-hover:text-white transition line-clamp-3">
            &ldquo;{truncate(topComment.comment, 150)}&rdquo;
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            {/* Upvotes */}
            <div className="flex items-center gap-1 text-green-400 font-semibold">
              <ThumbsUp className="w-3 h-3" />
              <span>{topComment.upvotes}</span>
            </div>

            {/* Author */}
            <span className="text-gray-400">
              by {topComment.userName || truncate(topComment.userId, 10)}
            </span>
          </div>

          {/* Time */}
          <span className="text-gray-500">
            {formatDistanceToNow(new Date(topComment.timestamp), { addSuffix: true })}
          </span>
        </div>

        {/* Market Badge */}
        <div className="mt-2 px-2 py-1 bg-gray-900/50 rounded text-xs text-gray-400 truncate">
          {topComment.marketName || truncate(topComment.marketAddress, 20)}
        </div>

        {/* Hover Indicator */}
        <div className="mt-3 text-center">
          <span className="text-xs text-kek-green font-medium group-hover:underline">
            View Full Context →
          </span>
        </div>
      </Link>

      {/* Footer Note */}
      <div className="mt-3 pt-3 border-t border-gray-800/50 text-center">
        <p className="text-xs text-gray-500">
          🏆 Highest voted in last 24h
        </p>
      </div>
    </div>
  );
}
