/**
 * KEKTECH 3.0 - Comment Voting API
 * POST /api/comments/[commentId]/vote - Upvote or downvote a comment
 *
 * 🔒 REQUIRES AUTHENTICATION + SECURITY CHECKS
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/api-auth';
import { applySecurityMiddleware } from '@/lib/middleware/security';

// POST - Vote on a comment (upvote or downvote)
// 🔒 REQUIRES AUTHENTICATION + SECURITY CHECKS
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    // 🔌 LAZY IMPORT: Ensures DATABASE_URL is available before Prisma initialization
    const prisma = (await import('@/lib/db/prisma')).default;

    // 🛡️ STEP 1: SECURITY MIDDLEWARE (Rate Limiting + Origin Validation)
    const securityError = await applySecurityMiddleware(request);
    if (securityError) return securityError;

    // 🔒 STEP 2: AUTHENTICATION CHECK
    const auth = await verifyAuth();
    if (auth.error) return auth.error;

    const walletAddress = auth.walletAddress!; // ✅ Verified wallet from Supabase

    // 🧹 STEP 3: VALIDATE INPUTS
    const { commentId } = await params;
    const body = await request.json();
    const { vote } = body;

    // Validate vote input
    if (vote !== 'upvote' && vote !== 'downvote') {
      return NextResponse.json(
        { success: false, error: 'Vote must be "upvote" or "downvote"' },
        { status: 400 }
      );
    }

    // Validate commentId format (should be UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(commentId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid comment ID format' },
        { status: 400 }
      );
    }

    // Check if comment exists
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return NextResponse.json(
        { success: false, error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Check if user already voted on this comment
    const existingVote = await prisma.commentVote.findUnique({
      where: {
        commentId_userId: {
          commentId,
          userId: walletAddress, // ✅ Using verified wallet address
        },
      },
    });

    // If user already voted, update the vote
    if (existingVote) {
      // Remove old vote count
      if (existingVote.vote === 'upvote') {
        await prisma.comment.update({
          where: { id: commentId },
          data: { upvotes: { decrement: 1 } },
        });
      } else {
        await prisma.comment.update({
          where: { id: commentId },
          data: { downvotes: { decrement: 1 } },
        });
      }

      // Update the vote
      await prisma.commentVote.update({
        where: {
          commentId_userId: {
            commentId,
            userId: walletAddress, // ✅ Using verified wallet address
          },
        },
        data: {
          vote,
          timestamp: new Date(),
        },
      });
    } else {
      // Create new vote
      await prisma.commentVote.create({
        data: {
          commentId,
          userId: walletAddress, // ✅ Using verified wallet address
          vote,
        },
      });
    }

    // Update comment vote count
    if (vote === 'upvote') {
      await prisma.comment.update({
        where: { id: commentId },
        data: { upvotes: { increment: 1 } },
      });
    } else {
      await prisma.comment.update({
        where: { id: commentId },
        data: { downvotes: { increment: 1 } },
      });
    }

    // Get updated comment
    const updatedComment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    return NextResponse.json({
      success: true,
      data: updatedComment,
    });
  } catch (error) {
    console.error('Error voting on comment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to vote on comment' },
      { status: 500 }
    );
  }
}
