/**
 * KEKTECH 3.0 - Comment Form Component
 *
 * Allows authenticated users to post comments on prediction markets
 *
 * Features:
 * - Wallet authentication required
 * - Real-time character count
 * - Loading states
 * - Error handling
 * - Success feedback with toast
 * - Auto-clears after successful post
 */

'use client'

import { useState } from 'react'
import { useWalletAuth } from '@/lib/hooks/useWalletAuth'
import { useSubmitComment } from '@/lib/api/engagement'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import { toast } from 'sonner'

interface CommentFormProps {
  marketAddress: `0x${string}`
  onCommentPosted?: () => void
}

export function CommentForm({ marketAddress, onCommentPosted }: CommentFormProps) {
  const [comment, setComment] = useState('')
  const { isAuthenticated, authenticate } = useWalletAuth()
  const { submitComment, isSubmitting, error } = useSubmitComment(marketAddress)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!comment.trim()) {
      toast.error('Comment cannot be empty')
      return
    }

    if (comment.trim().length < 1) {
      toast.error('Comment is too short')
      return
    }

    if (comment.trim().length > 500) {
      toast.error('Comment is too long (max 500 characters)')
      return
    }

    // Post comment
    try {
      await submitComment(comment.trim())
      toast.success('Comment posted successfully!')
      setComment('') // Clear form
      onCommentPosted?.() // Callback for parent to refresh
    } catch (err) {
      // Error already set by hook
      toast.error((err as Error).message || 'Failed to post comment')
    }
  }

  const handleSignIn = async () => {
    try {
      await authenticate()
      toast.success('Successfully signed in!')
    } catch {
      toast.error('Failed to sign in')
    }
  }

  // If not authenticated, show sign-in prompt
  if (!isAuthenticated) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            Sign in with your wallet to post comments
          </p>
          <Button onClick={handleSignIn}>
            Sign In with Wallet
          </Button>
        </div>
      </Card>
    )
  }

  const characterCount = comment.length
  const isOverLimit = characterCount > 500
  const characterCountColor = isOverLimit
    ? 'text-red-500'
    : characterCount > 450
    ? 'text-yellow-500'
    : 'text-muted-foreground'

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="comment" className="block text-sm font-medium mb-2">
            Post a Comment
          </label>
          <Textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your thoughts on this market..."
            rows={4}
            disabled={isSubmitting}
            className="resize-none"
          />
          <div className="flex justify-between items-center mt-2">
            <span className={`text-sm ${characterCountColor}`}>
              {characterCount} / 500 characters
            </span>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <p className="text-sm">{error.message || 'Failed to post comment'}</p>
          </Alert>
        )}

        <div className="flex justify-end gap-2">
          {comment && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setComment('')}
              disabled={isSubmitting}
            >
              Clear
            </Button>
          )}
          <Button
            type="submit"
            disabled={isSubmitting || !comment.trim() || isOverLimit}
          >
            {isSubmitting ? 'Posting...' : 'Post Comment'}
          </Button>
        </div>
      </form>
    </Card>
  )
}
