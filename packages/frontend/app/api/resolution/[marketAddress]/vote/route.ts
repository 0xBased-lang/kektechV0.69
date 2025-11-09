/**
 * KEKTECH 3.0 - Resolution Voting API
 * POST /api/resolution/[marketAddress]/vote - 🔒 REQUIRES AUTHENTICATION
 * GET /api/resolution/[marketAddress]/vote - Public (shows user's vote if authenticated)
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyAuth } from '@/lib/auth/api-auth';
import { createClient } from '@/lib/supabase/server';

// GET - Get resolution votes for a market
export async function GET(
  request: NextRequest,
  { params }: { params: { marketAddress: string } }
) {
  try {
    const { marketAddress } = params;

    // Get all resolution votes
    const votes = await prisma.resolutionVote.findMany({
      where: { marketAddress },
      orderBy: { timestamp: 'desc' },
    });

    const agreeCount = votes.filter((v) => v.vote === 'agree').length;
    const disagreeCount = votes.filter((v) => v.vote === 'disagree').length;
    const total = votes.length;

    // Calculate percentages
    const agreePercentage = total > 0 ? (agreeCount / total) * 100 : 0;
    const disagreePercentage = total > 0 ? (disagreeCount / total) * 100 : 0;

    // Get user's vote if authenticated (optional)
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const walletAddress = user?.user_metadata?.wallet_address || user?.email?.split('@')[0];

    const userVote = walletAddress
      ? votes.find((v) => v.userId === walletAddress)
      : null;

    return NextResponse.json({
      success: true,
      data: {
        agreeCount,
        disagreeCount,
        total,
        agreePercentage,
        disagreePercentage,
        userVote: userVote ? { vote: userVote.vote, comment: userVote.comment } : null,
        votes: votes.map((v) => ({
          userId: v.userId,
          vote: v.vote,
          comment: v.comment,
          timestamp: v.timestamp,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching resolution votes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch votes' },
      { status: 500 }
    );
  }
}

// POST - Submit a resolution vote with mandatory comment
// 🔒 REQUIRES AUTHENTICATION
export async function POST(
  request: NextRequest,
  { params }: { params: { marketAddress: string } }
) {
  try {
    // 🔒 AUTHENTICATION CHECK
    const auth = await verifyAuth();
    if (auth.error) return auth.error;

    const walletAddress = auth.walletAddress!; // ✅ Verified wallet from Supabase

    const { marketAddress } = params;
    const body = await request.json();
    const { vote, comment } = body; // userId now comes from authenticated session

    if (vote !== 'agree' && vote !== 'disagree') {
      return NextResponse.json(
        { success: false, error: 'Vote must be "agree" or "disagree"' },
        { status: 400 }
      );
    }

    if (!comment || comment.trim().length < 20) {
      return NextResponse.json(
        { success: false, error: 'Comment is required (minimum 20 characters)' },
        { status: 400 }
      );
    }

    // Check if user already voted
    const existingVote = await prisma.resolutionVote.findUnique({
      where: {
        marketAddress_userId: {
          marketAddress,
          userId: walletAddress, // ✅ Using verified wallet address
        },
      },
    });

    if (existingVote) {
      return NextResponse.json(
        { success: false, error: 'You have already voted on this resolution' },
        { status: 400 }
      );
    }

    // Create the resolution vote
    const result = await prisma.resolutionVote.create({
      data: {
        marketAddress,
        userId: walletAddress, // ✅ Using verified wallet address
        vote,
        comment: comment.trim(),
      },
    });

    // Also create a comment entry (type: resolution_vote)
    await prisma.comment.create({
      data: {
        marketAddress,
        userId: walletAddress, // ✅ Using verified wallet address
        comment: comment.trim(),
        type: 'resolution_vote',
      },
    });

    // Track user activity
    await prisma.userActivity.create({
      data: {
        userId: walletAddress, // ✅ Using verified wallet address
        activityType: 'resolution_vote',
        marketAddress,
      },
    });

    // Get updated vote counts
    const votes = await prisma.resolutionVote.findMany({
      where: { marketAddress },
    });

    const agreeCount = votes.filter((v) => v.vote === 'agree').length;
    const disagreeCount = votes.filter((v) => v.vote === 'disagree').length;
    const total = votes.length;

    return NextResponse.json({
      success: true,
      data: {
        vote: result,
        agreeCount,
        disagreeCount,
        total,
        agreePercentage: (agreeCount / total) * 100,
        disagreePercentage: (disagreeCount / total) * 100,
      },
    });
  } catch (error) {
    console.error('Error submitting resolution vote:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit vote' },
      { status: 500 }
    );
  }
}
