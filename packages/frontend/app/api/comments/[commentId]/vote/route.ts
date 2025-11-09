/**
 * KEKTECH 3.0 - Comment Voting API
 * POST /api/comments/[commentId]/vote - Upvote or downvote a comment
 *
 * 🔒 REQUIRES AUTHENTICATION
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyAuth } from '@/lib/auth/api-auth';

// POST - Vote on a comment (upvote or downvote)
// 🔒 REQUIRES AUTHENTICATION
export async function POST(
  request: NextRequest,
  { params }: { params: { commentId: string } }
) {
  try {
    // 🔒 AUTHENTICATION CHECK
    const auth = await verifyAuth();
    if (auth.error) return auth.error;

    const walletAddress = auth.walletAddress!; // ✅ Verified wallet from Supabase

    const { commentId } = params;
    const body = await request.json();
    const { vote } = body; // userId now comes from authenticated session

    if (vote !== 'upvote' && vote !== 'downvote') {
      return NextResponse.json(
        { success: false, error: 'Vote must be "upvote" or "downvote"' },
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
