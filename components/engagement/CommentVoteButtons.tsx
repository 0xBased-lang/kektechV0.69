/**
 * KEKTECH 3.0 - Comment Vote Buttons Component
 *
 * Upvote/downvote buttons for comments
 *
 * Features:
 * - Requires authentication
 * - Optimistic UI updates
 * - Visual feedback for user's vote
 * - Disabled state while loading
 * - Toast notifications
 */

'use client'

import { useState } from 'react'
import { useWalletAuth } from '@/lib/hooks/useWalletAuth'
import { useVoteOnComment } from '@/lib/api/engagement'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ThumbsUp, ThumbsDown } from 'lucide-react'

interface CommentVoteButtonsProps {
  commentId: string
  initialUpvotes: number
  initialDownvotes: number
  onVote?: () => void
}

export function CommentVoteButtons({
  commentId,
  initialUpvotes,
  initialDownvotes,
  onVote,
}: CommentVoteButtonsProps) {
  const { isAuthenticated, authenticate, walletAddress: _walletAddress } = useWalletAuth()
  const { voteOnComment, isVoting } = useVoteOnComment(commentId)

  // Local state for optimistic updates
  const [upvotes, setUpvotes] = useState(initialUpvotes)
  const [downvotes, setDownvotes] = useState(initialDownvotes)
  const [userVote, setUserVote] = useState<'upvote' | 'downvote' | null>(null)

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    // Check authentication
    if (!isAuthenticated) {
      toast.error('Please sign in to vote')
      try {
        await authenticate()
      } catch {
        return
      }
    }

    // Optimistic update
    const previousUpvotes = upvotes
    const previousDownvotes = downvotes
    const previousUserVote = userVote

    // Update UI optimistically
    if (userVote === voteType) {
      // User is removing their vote
      if (voteType === 'upvote') {
        setUpvotes(upvotes - 1)
      } else {
        setDownvotes(downvotes - 1)
      }
      setUserVote(null)
    } else if (userVote) {
      // User is switching vote
      if (voteType === 'upvote') {
        setUpvotes(upvotes + 1)
        setDownvotes(downvotes - 1)
      } else {
        setUpvotes(upvotes - 1)
        setDownvotes(downvotes + 1)
      }
      setUserVote(voteType)
    } else {
      // User is voting for first time
      if (voteType === 'upvote') {
        setUpvotes(upvotes + 1)
      } else {
        setDownvotes(downvotes + 1)
      }
      setUserVote(voteType)
    }

    // Submit vote
    try {
      const result = await voteOnComment(voteType)

      // Update with actual server data
      if (result?.upvotes !== undefined && result?.downvotes !== undefined) {
        setUpvotes(result.upvotes)
        setDownvotes(result.downvotes)
      }
      onVote?.()
    } catch (err) {
      // Revert optimistic update
      setUpvotes(previousUpvotes)
      setDownvotes(previousDownvotes)
      setUserVote(previousUserVote)
      toast.error((err as Error).message || 'Failed to vote')
    }
  }

  return (
    <div className="flex items-center gap-1">
      {/* Upvote Button */}
      <Button
        variant={userVote === 'upvote' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleVote('upvote')}
        disabled={isVoting}
        className="h-8 px-2"
      >
        <ThumbsUp className="h-4 w-4" />
        <span className="ml-1 text-xs">{upvotes}</span>
      </Button>

      {/* Downvote Button */}
      <Button
        variant={userVote === 'downvote' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleVote('downvote')}
        disabled={isVoting}
        className="h-8 px-2"
      >
        <ThumbsDown className="h-4 w-4" />
        <span className="ml-1 text-xs">{downvotes}</span>
      </Button>
    </div>
  )
}
