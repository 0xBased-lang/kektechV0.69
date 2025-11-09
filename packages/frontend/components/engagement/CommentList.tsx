/**
 * KEKTECH 3.0 - Comment List Component
 *
 * Real-time comment list with Supabase subscriptions
 * Auto-updates when new comments posted or votes change
 */
'use client'

import { useEffect } from 'react'
import { useComments, useCommentSubscription } from '@/lib/api/engagement'
import { CommentItem } from './CommentItem'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import type { Address } from 'viem'

interface CommentListProps {
  marketAddress: Address
}

export function CommentList({ marketAddress }: CommentListProps) {
  // Fetch comments
  const {
    data: comments,
    error,
    refetch,
    isLoading
  } = useComments(marketAddress)

  // Subscribe to real-time updates
  useCommentSubscription(marketAddress, refetch)

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load comments. <button onClick={() => refetch()} className="underline">Try again</button>
        </AlertDescription>
      </Alert>
    )
  }

  // Empty state
  if (!comments || comments.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg font-medium mb-2">No comments yet</p>
        <p className="text-sm">Be the first to share your thoughts!</p>
      </div>
    )
  }

  // Render comments (sorted by newest first)
  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          marketAddress={marketAddress}
        />
      ))}
    </div>
  )
}
