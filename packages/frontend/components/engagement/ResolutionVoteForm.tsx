/**
 * KEKTECH 3.0 - Resolution Vote Form Component
 *
 * Vote on market resolution with mandatory explanation (agree/disagree + comment)
 */
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useVoteOnResolution } from '@/lib/api/engagement'
import { useWalletAuth } from '@/lib/hooks/useWalletAuth'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Address } from 'viem'

interface ResolutionVoteFormProps {
  marketAddress: Address
}

export function ResolutionVoteForm({ marketAddress }: ResolutionVoteFormProps) {
  const { isAuthenticated, authenticate } = useWalletAuth()
  const { mutate: voteOnResolution, isPending } = useVoteOnResolution()
  const [isAgree, setIsAgree] = useState<boolean | null>(null)
  const [comment, setComment] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!isAuthenticated) {
      toast.error('Please sign in to vote')
      authenticate()
      return
    }

    if (isAgree === null) {
      toast.error('Please select agree or disagree')
      return
    }

    if (comment.trim().length < 20) {
      toast.error('Comment must be at least 20 characters')
      return
    }

    voteOnResolution(
      {
        marketAddress,
        isAgree,
        comment: comment.trim(),
      },
      {
        onSuccess: () => {
          toast.success('Resolution vote submitted!')
          setIsAgree(null)
          setComment('')
        },
        onError: (error: any) => {
          if (error.message?.includes('already voted')) {
            toast.error('You have already voted on this resolution')
          } else {
            toast.error(error.message || 'Failed to submit vote')
          }
        },
      }
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vote on Resolution</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Vote Selection */}
          <div className="space-y-3">
            <Label>Your Vote</Label>
            <RadioGroup
              value={isAgree === null ? '' : isAgree ? 'agree' : 'disagree'}
              onValueChange={(value) => setIsAgree(value === 'agree')}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="agree" id="agree" />
                <Label htmlFor="agree" className="flex items-center gap-2 cursor-pointer">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Agree with resolution</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="disagree" id="disagree" />
                <Label htmlFor="disagree" className="flex items-center gap-2 cursor-pointer">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span>Disagree with resolution</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Comment (Required) */}
          <div className="space-y-2">
            <Label htmlFor="resolution-comment">
              Explanation (Required) *
            </Label>
            <Textarea
              id="resolution-comment"
              placeholder="Explain your vote... (minimum 20 characters)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
              rows={4}
              className="resize-none"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Minimum 20 characters required</span>
              <span>{comment.length}/500</span>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isPending || isAgree === null || comment.trim().length < 20}
            className="w-full"
            size="lg"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting Vote...
              </>
            ) : (
              'Submit Resolution Vote'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
