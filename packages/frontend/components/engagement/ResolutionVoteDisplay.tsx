/**
 * KEKTECH 3.0 - Resolution Vote Display Component
 *
 * Display resolution voting results with community votes
 */
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useResolutionVotes } from '@/lib/api/engagement'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { Address } from 'viem'

interface ResolutionVoteDisplayProps {
  marketAddress: Address
}

export function ResolutionVoteDisplay({ marketAddress }: ResolutionVoteDisplayProps) {
  const { votes, isLoading } = useResolutionVotes(marketAddress)

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!votes || votes.total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resolution Votes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            No votes yet. Be the first to vote on this resolution!
          </p>
        </CardContent>
      </Card>
    )
  }

  // Calculate vote counts
  const agreeVotes = votes.filter((v) => v.isAgree).length
  const disagreeVotes = votes.filter((v) => !v.isAgree).length
  const totalVotes = votes.length
  const agreePercentage = (agreeVotes / totalVotes) * 100
  const disagreePercentage = (disagreeVotes / totalVotes) * 100

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resolution Votes ({totalVotes})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Vote Summary */}
        <div className="space-y-4">
          {/* Agree Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="font-medium">Agree</span>
              </span>
              <span className="text-muted-foreground">
                {agreeVotes} votes ({agreePercentage.toFixed(1)}%)
              </span>
            </div>
            <Progress value={agreePercentage} className="h-2" />
          </div>

          {/* Disagree Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="font-medium">Disagree</span>
              </span>
              <span className="text-muted-foreground">
                {disagreeVotes} votes ({disagreePercentage.toFixed(1)}%)
              </span>
            </div>
            <Progress value={disagreePercentage} className="h-2" />
          </div>
        </div>

        {/* Individual Votes */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Community Votes</h4>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {votes.map((vote) => (
              <div
                key={vote.id}
                className="border rounded-lg p-4 space-y-2"
              >
                {/* Vote Header */}
                <div className="flex items-center justify-between">
                  <Badge variant={vote.isAgree ? 'default' : 'destructive'}>
                    {vote.isAgree ? (
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                    ) : (
                      <XCircle className="h-3 w-3 mr-1" />
                    )}
                    {vote.isAgree ? 'Agree' : 'Disagree'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(vote.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>

                {/* Voter */}
                <p className="text-xs font-mono text-muted-foreground">
                  {vote.userAddress.slice(0, 6)}...{vote.userAddress.slice(-4)}
                </p>

                {/* Comment */}
                <p className="text-sm">{vote.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
