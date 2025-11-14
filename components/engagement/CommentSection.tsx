/**
 * KEKTECH 3.0 - Comment Section Component
 *
 * Complete comment system combining form and list
 */
'use client'

import { CommentForm } from './CommentForm'
import { CommentList } from './CommentList'
import type { Address } from 'viem'

interface CommentSectionProps {
  marketAddress: Address
}

export function CommentSection({ marketAddress }: CommentSectionProps) {
  return (
    <div className="space-y-6">
      {/* Comment Form */}
      <CommentForm marketAddress={marketAddress} />

      {/* Comment List */}
      <CommentList marketAddress={marketAddress} />
    </div>
  )
}
