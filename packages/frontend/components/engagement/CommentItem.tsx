/**
 * KEKTECH 3.0 - Comment Item Component
 *
 * Displays a single comment with:
 * - User address (truncated)
 * - Timestamp (relative time)
 * - Comment text
 * - Vote buttons (upvote/downvote)
 * - Vote counts
 */

'use client'

import { formatDistanceToNow } from 'date-fns'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CommentVoteButtons } from './CommentVoteButtons'

interface CommentItemProps {
  comment: {
    id: string
    userId: string
    comment: string
    upvotes: number
    downvotes: number
    type: 'general' | 'resolution_vote'
    timestamp: Date
  }
  marketAddress: `0x${string}`
  onVote?: () => void
}

export function CommentItem({ comment, marketAddress: _marketAddress, onVote }: CommentItemProps) {
  // Truncate wallet address: 0x1234...5678
  const truncatedAddress = comment.userId
    ? `${comment.userId.slice(0, 6)}...${comment.userId.slice(-4)}`
    : 'Unknown'

  // Format timestamp
  const timestamp =
    typeof comment.timestamp === 'string'
      ? new Date(comment.timestamp)
      : comment.timestamp
  const timeAgo = formatDistanceToNow(timestamp, { addSuffix: true })

  // Net votes (upvotes - downvotes)
  const netVotes = comment.upvotes - comment.downvotes

  return (
    <Card className="p-4">
      <div className="space-y-3">
        {/* Header: User & Timestamp */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* User Address */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-medium text-primary">
                  {comment.userId.slice(2, 4).toUpperCase()}
                </span>
              </div>
              <span className="text-sm font-medium">{truncatedAddress}</span>
            </div>

            {/* Badge for resolution vote comments */}
            {comment.type === 'resolution_vote' && (
              <Badge variant="secondary" className="text-xs">
                Resolution Vote
              </Badge>
            )}
          </div>

          {/* Timestamp */}
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        </div>

        {/* Comment Text */}
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {comment.comment}
        </p>

        {/* Footer: Vote Buttons & Count */}
        <div className="flex items-center justify-between pt-2 border-t">
          <CommentVoteButtons
            commentId={comment.id}
            initialUpvotes={comment.upvotes}
            initialDownvotes={comment.downvotes}
            onVote={onVote}
          />

          {/* Net Vote Score */}
          <div className="flex items-center gap-1">
            <span
              className={`text-sm font-medium ${
                netVotes > 0
                  ? 'text-green-600'
                  : netVotes < 0
                  ? 'text-red-600'
                  : 'text-muted-foreground'
              }`}
            >
              {netVotes > 0 ? '+' : ''}
              {netVotes}
            </span>
            <span className="text-xs text-muted-foreground">score</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
