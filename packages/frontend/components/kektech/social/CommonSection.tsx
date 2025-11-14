/**
 * KEKTECH 3.0 - Common Section
 * Displays most liked/active comments for discovery
 */
'use client';

import { useState } from 'react';
import { useTopComments, TopCommentsTimeframe } from '@/lib/hooks/useTopComments';
import { MessageSquare, ThumbsUp, Clock, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { truncate } from '@/lib/utils';
import { LoadingSpinner } from '@/components/kektech/ui/LoadingSpinner';

interface Comment {
  id: string;
  comment: string;
  marketAddress: string;
  userId: string;
  upvotes: number;
  downvotes: number;
  timestamp: string;
  marketQuestion?: string;
}

interface CommonSectionProps {
  /** Maximum comments to display */
  maxComments?: number;
  /** Custom className */
  className?: string;
}

/**
 * Community discovery section showing top comments
 * - Sort by timeframe: 24h, 7d, all time
 * - Click to jump to full context
 * - Encourages engagement
 */
export function CommonSection({ maxComments = 10, className = '' }: CommonSectionProps) {
  const [timeframe, setTimeframe] = useState<TopCommentsTimeframe>('all');
  const { comments, isLoading, error } = useTopComments(timeframe, maxComments);

  return (
    <div className={`bg-gray-900/30 rounded-xl border border-gray-800 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#3fb8bd]/10 rounded-lg">
            <MessageSquare className="w-6 h-6 text-[#3fb8bd]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">💬 Most Liked Comments</h2>
            <p className="text-gray-400 text-sm mt-1">
              Discover the best insights from the community
            </p>
          </div>
        </div>

        {/* Timeframe Selector */}
        <div className="flex gap-2">
          {(['day', 'week', 'all'] as TopCommentsTimeframe[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                timeframe === tf
                  ? 'bg-[#3fb8bd] text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-gray-300 hover:bg-gray-700'
              }`}
            >
              {tf === 'day' ? '24h' : tf === 'week' ? '7d' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          <p className="font-medium">Failed to load top comments</p>
          <p className="text-xs mt-1 opacity-90">{error.message}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" text="Loading top comments..." />
        </div>
      )}

      {/* Comments List */}
      {!isLoading && !error && (
        <div className="space-y-4">
          {comments.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">No comments yet</p>
              <p className="text-sm mt-2">Be the first to share your thoughts!</p>
            </div>
          ) : (
            comments.map((comment, index) => (
              <TopCommentCard
                key={comment.id}
                comment={comment}
                rank={index + 1}
              />
            ))
          )}
        </div>
      )}

      {/* Footer CTA */}
      {!isLoading && comments.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-800 text-center">
          <p className="text-gray-400 text-sm mb-4">
            Join the conversation and share your insights!
          </p>
          <Link
            href="/markets"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#3fb8bd] hover:bg-[#3fb8bd]/90 text-white font-semibold rounded-xl transition"
          >
            <MessageSquare className="w-5 h-5" />
            Start Commenting
          </Link>
        </div>
      )}
    </div>
  );
}

/**
 * Individual top comment card
 */
function TopCommentCard({
  comment,
  rank,
}: {
  comment: Comment;
  rank: number;
}) {
  return (
    <Link
      href={`/market/${comment.marketAddress}#comment-${comment.id}`}
      className="block group"
    >
      <div className="p-4 bg-gray-800/30 hover:bg-gray-800/50 rounded-lg border border-gray-800 hover:border-[#3fb8bd]/30 transition">
        {/* Rank Badge */}
        <div className="flex items-start gap-4">
          <div
            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
              rank === 1
                ? 'bg-yellow-500/20 text-yellow-500 border-2 border-yellow-500'
                : rank === 2
                ? 'bg-gray-400/20 text-gray-400 border-2 border-gray-400'
                : rank === 3
                ? 'bg-orange-500/20 text-orange-500 border-2 border-orange-500'
                : 'bg-gray-700 text-gray-400'
            }`}
          >
            {rank}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Comment Text */}
            <p className="text-gray-200 mb-3 group-hover:text-white transition">
              "{truncate(comment.comment, 200)}"
            </p>

            {/* Metadata */}
            <div className="flex items-center gap-4 text-sm">
              {/* Upvotes */}
              <div className="flex items-center gap-1 text-green-400">
                <ThumbsUp className="w-4 h-4" />
                <span className="font-semibold">{comment.upvotes}</span>
              </div>

              {/* Author */}
              <div className="flex items-center gap-1 text-gray-400">
                <User className="w-4 h-4" />
                <span>{comment.userName || truncate(comment.userId, 12)}</span>
              </div>

              {/* Time */}
              <div className="flex items-center gap-1 text-gray-500">
                <Clock className="w-4 h-4" />
                <span>{formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}</span>
              </div>

              {/* Market Badge */}
              <div className="ml-auto px-3 py-1 bg-gray-900/50 rounded-full text-gray-400 text-xs truncate max-w-[200px]">
                {comment.marketName || truncate(comment.marketAddress, 12)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
