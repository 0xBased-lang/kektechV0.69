/**
 * KEKTECH 3.0 - Comment Only Feed
 * Displays only comment activity from the real-time feed
 */
'use client';

import { useKektechWebSocket, MarketEvent } from '@/lib/hooks/useKektechWebSocket';
import { MessageSquare, ThumbsUp, ThumbsDown, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { truncate } from '@/lib/utils';

interface CommentOnlyFeedProps {
  /** Market address to filter (optional) */
  marketAddress?: string;
  /** Subscribe to all markets */
  subscribeToAll?: boolean;
  /** Maximum comments to display */
  maxComments?: number;
  /** Custom className */
  className?: string;
}

/**
 * Feed showing only comment activity
 * - New comments posted
 * - Comment votes (likes/dislikes)
 * - Click to jump to comment context
 */
export function CommentOnlyFeed({
  marketAddress,
  subscribeToAll = true,
  maxComments = 15,
  className = '',
}: CommentOnlyFeedProps) {
  const { connected, events, error } = useKektechWebSocket({
    marketAddress,
    subscribeToAll,
  });

  // Filter for comment-related events only
  const commentEvents = events.filter((event) => {
    const type = event.type.toLowerCase();
    return (
      type.includes('comment') ||
      type === 'CommentPosted' ||
      type === 'CommentVoted' ||
      type === 'CommentUpvoted' ||
      type === 'CommentDownvoted'
    );
  });

  const displayedComments = commentEvents.slice(0, maxComments);

  return (
    <div className={`bg-gray-900/50 rounded-xl border border-gray-800 p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-kek-green" />
          <h3 className="text-lg font-bold text-white">Comments Feed</h3>
        </div>
        <div className={`text-xs font-medium ${connected ? 'text-green-400' : 'text-red-400'}`}>
          {connected ? '● Live' : '○ Offline'}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          <p className="font-medium">Connection Error</p>
          <p className="text-xs mt-1 opacity-90">{error}</p>
        </div>
      )}

      {/* Comments list */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
        {displayedComments.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No comments yet</p>
            <p className="text-xs mt-1 opacity-70">
              {!connected ? 'Waiting for connection...' : 'Be the first to comment!'}
            </p>
          </div>
        ) : (
          displayedComments.map((event, index) => (
            <CommentEventCard key={`${event.transactionHash || event.timestamp}-${index}`} event={event} />
          ))
        )}
      </div>

      {/* Footer */}
      {commentEvents.length > maxComments && (
        <div className="mt-4 pt-4 border-t border-gray-800 text-center text-xs text-gray-400">
          Showing {maxComments} of {commentEvents.length} comments
        </div>
      )}
    </div>
  );
}

/**
 * Individual comment event card
 */
function CommentEventCard({ event }: { event: MarketEvent }) {
  const getEventIcon = () => {
    const type = event.type.toLowerCase();
    if (type.includes('upvote') || type.includes('like')) {
      return <ThumbsUp className="w-4 h-4 text-green-500" />;
    }
    if (type.includes('downvote') || type.includes('dislike')) {
      return <ThumbsDown className="w-4 h-4 text-red-500" />;
    }
    return <MessageSquare className="w-4 h-4 text-kek-green" />;
  };

  const getEventAction = () => {
    const type = event.type.toLowerCase();
    if (type.includes('upvote') || type.includes('like')) {
      return 'liked a comment';
    }
    if (type.includes('downvote') || type.includes('dislike')) {
      return 'disliked a comment';
    }
    return 'posted a comment';
  };

  // Extract comment text from event data
  const rawComment = event.data?.content ?? event.data?.text ?? event.data?.comment ?? '';
  const commentText: string = typeof rawComment === 'string' ? rawComment : String(rawComment ?? '');
  const rawAuthor = event.data?.author ?? event.data?.user ?? 'Anonymous';
  const author = typeof rawAuthor === 'string' ? rawAuthor : String(rawAuthor ?? 'Anonymous');
  const rawMarketName = event.data?.marketName ?? event.marketAddress;
  const marketLabel = typeof rawMarketName === 'string' ? rawMarketName : String(rawMarketName ?? event.marketAddress);
  const marketName = truncate(marketLabel, 32);

  return (
    <Link
      href={`/market/${event.marketAddress}#comment-${event.data?.commentId || ''}`}
      className="block group"
    >
      <div className="p-3 bg-gray-800/30 hover:bg-gray-800/50 rounded-lg border border-gray-800 hover:border-kek-green/30 transition cursor-pointer">
        {/* Header */}
        <div className="flex items-start gap-3 mb-2">
          {/* Icon */}
          <div className="flex-shrink-0 mt-0.5">
            {getEventIcon()}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-sm font-medium text-gray-300 truncate">
                {truncate(author, 20)}
              </span>
              <span className="text-xs text-gray-500">{getEventAction()}</span>
            </div>

            {/* Comment text (if available) */}
            {commentText && (
              <p className="text-sm text-gray-400 line-clamp-2 mb-2">
                &ldquo;{truncate(commentText, 100)}&rdquo;
              </p>
            )}

            {/* Market badge */}
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-1 bg-gray-900/50 rounded text-gray-400 truncate max-w-[200px]">
                {marketName}
              </span>
              <span className="text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
