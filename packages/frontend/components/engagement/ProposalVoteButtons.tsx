/**
 * KEKTECH 3.0 - Proposal Vote Buttons Component
 *
 * Like/dislike voting for market proposals with real-time counts
 */
'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useProposalVotes, useVoteOnProposal } from '@/lib/api/engagement'
import { useWalletAuth } from '@/lib/hooks/useWalletAuth'
import { ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Address } from 'viem'

interface ProposalVoteButtonsProps {
  marketAddress: Address
}

export function ProposalVoteButtons({ marketAddress }: ProposalVoteButtonsProps) {
  const { isAuthenticated, authenticate } = useWalletAuth()
  const { data: voteData, refetch } = useProposalVotes(marketAddress)
  const { mutate: vote, isPending } = useVoteOnProposal()

  // Calculate percentages
  const totalVotes = (voteData?.upvotes || 0) + (voteData?.downvotes || 0)
  const upvotePercentage = totalVotes > 0 ? (voteData?.upvotes || 0) / totalVotes * 100 : 50
  const downvotePercentage = totalVotes > 0 ? (voteData?.downvotes || 0) / totalVotes * 100 : 50

  const handleVote = (isUpvote: boolean) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to vote')
      authenticate()
      return
    }

    vote(
      {
        marketAddress,
        isUpvote,
      },
      {
        onSuccess: () => {
          toast.success(isUpvote ? 'Voted like!' : 'Voted dislike!')
          refetch()
        },
        onError: (error: any) => {
          toast.error(error.message || 'Failed to vote')
        },
      }
    )
  }

  return (
    <Card>
      <CardContent className="pt-6">
        {/* Vote Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Like Button */}
          <Button
            variant={voteData?.userVote === true ? 'default' : 'outline'}
            size="lg"
            onClick={() => handleVote(true)}
            disabled={isPending}
            className="flex flex-col items-center gap-2 h-auto py-4"
          >
            {isPending ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <ThumbsUp className="h-6 w-6" />
            )}
            <div className="space-y-1 text-center">
              <div className="text-2xl font-bold">{voteData?.upvotes || 0}</div>
              <div className="text-xs opacity-75">Like</div>
            </div>
          </Button>

          {/* Dislike Button */}
          <Button
            variant={voteData?.userVote === false ? 'default' : 'outline'}
            size="lg"
            onClick={() => handleVote(false)}
            disabled={isPending}
            className="flex flex-col items-center gap-2 h-auto py-4"
          >
            {isPending ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <ThumbsDown className="h-6 w-6" />
            )}
            <div className="space-y-1 text-center">
              <div className="text-2xl font-bold">{voteData?.downvotes || 0}</div>
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
