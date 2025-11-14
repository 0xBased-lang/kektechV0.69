/**
 * KEKTECH 3.0 - Proposal Vote Buttons Component
 *
 * Like/dislike voting for market proposals with real-time counts
 */
'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useProposalVotes, useSubmitProposalVote } from '@/lib/api/engagement'
import { useWalletAuth } from '@/lib/hooks/useWalletAuth'
import { ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Address } from 'viem'

interface ProposalVoteButtonsProps {
  marketAddress: Address
}

export function ProposalVoteButtons({ marketAddress }: ProposalVoteButtonsProps) {
  const { isAuthenticated, authenticate } = useWalletAuth()
  const { votes: voteData, refetch } = useProposalVotes(marketAddress)
  const { submitVote, isSubmitting } = useSubmitProposalVote(marketAddress)

  // Calculate percentages
  const totalVotes = (voteData?.likes || 0) + (voteData?.dislikes || 0)
  const upvotePercentage = totalVotes > 0 ? (voteData?.likes || 0) / totalVotes * 100 : 50
  const downvotePercentage = totalVotes > 0 ? (voteData?.dislikes || 0) / totalVotes * 100 : 50

  const handleVote = async (isUpvote: boolean) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to vote')
      authenticate()
      return
    }

    try {
      await submitVote(isUpvote ? 'like' : 'dislike')
      toast.success(isUpvote ? 'Voted like!' : 'Voted dislike!')
      refetch()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to vote'
      toast.error(message)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        {/* Vote Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Like Button */}
          <Button
            variant={voteData?.userVote === 'like' ? 'default' : 'outline'}
            size="lg"
            onClick={() => handleVote(true)}
            disabled={isSubmitting}
            className="flex flex-col items-center gap-2 h-auto py-4"
          >
            {isSubmitting ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <ThumbsUp className="h-6 w-6" />
            )}
            <div className="space-y-1 text-center">
              <div className="text-2xl font-bold">{voteData?.likes || 0}</div>
              <div className="text-xs opacity-75">Like</div>
            </div>
          </Button>

          {/* Dislike Button */}
          <Button
            variant={voteData?.userVote === 'dislike' ? 'default' : 'outline'}
            size="lg"
            onClick={() => handleVote(false)}
            disabled={isSubmitting}
            className="flex flex-col items-center gap-2 h-auto py-4"
          >
            {isSubmitting ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <ThumbsDown className="h-6 w-6" />
            )}
            <div className="space-y-1 text-center">
              <div className="text-2xl font-bold">{voteData?.dislikes || 0}</div>
              <div className="text-xs opacity-75">Dislike</div>
            </div>
          </Button>
        </div>

        {/* Progress Bar */}
        {totalVotes > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{upvotePercentage.toFixed(1)}% Like</span>
              <span>{downvotePercentage.toFixed(1)}% Dislike</span>
            </div>
            <Progress value={upvotePercentage} className="h-2" />
          </div>
        )}

        {/* Empty State */}
        {totalVotes === 0 && (
          <p className="text-sm text-center text-muted-foreground">
            No votes yet. Be the first to vote!
          </p>
        )}
      </CardContent>
    </Card>
  )
}
