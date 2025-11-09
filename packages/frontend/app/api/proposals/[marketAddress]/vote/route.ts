/**
 * KEKTECH 3.0 - Proposal Voting API
 * POST /api/proposals/[marketAddress]/vote - 🔒 REQUIRES AUTHENTICATION
 * GET /api/proposals/[marketAddress]/vote - Public (shows user's vote if authenticated)
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyAuth } from '@/lib/auth/api-auth';
import { createClient } from '@/lib/supabase/server';

// GET - Get vote counts for a market proposal
export async function GET(
  request: NextRequest,
  { params }: { params: { marketAddress: string } }
) {
  try {
    const { marketAddress } = params;

    // Get all votes for this market
    const votes = await prisma.proposalVote.findMany({
      where: { marketAddress },
    });

    const likes = votes.filter((v) => v.vote === 'like').length;
    const dislikes = votes.filter((v) => v.vote === 'dislike').length;

    // Get user's vote if authenticated (optional)
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const walletAddress = user?.user_metadata?.wallet_address || user?.email?.split('@')[0];

    const userVote = walletAddress
      ? votes.find((v) => v.userId === walletAddress)?.vote
      : null;

    return NextResponse.json({
      success: true,
      data: {
        likes,
        dislikes,
        userVote,
        total: votes.length,
      },
    });
  } catch (error) {
    console.error('Error fetching proposal votes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch votes' },
      { status: 500 }
    );
  }
}

// POST - Submit a vote for a market proposal
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
    const { vote } = body; // userId now comes from authenticated session

    if (vote !== 'like' && vote !== 'dislike') {
      return NextResponse.json(
        { success: false, error: 'Vote must be "like" or "dislike"' },
        { status: 400 }
      );
    }

    // Upsert the vote (update if exists, create if not)
    const result = await prisma.proposalVote.upsert({
      where: {
        marketAddress_userId: {
          marketAddress,
          userId: walletAddress, // ✅ Using verified wallet address
        },
      },
      update: {
        vote,
        timestamp: new Date(),
      },
      create: {
        marketAddress,
        userId: walletAddress, // ✅ Using verified wallet address
        vote,
      },
    });

    // Track user activity
    await prisma.userActivity.create({
      data: {
        userId: walletAddress, // ✅ Using verified wallet address
        activityType: 'proposal_vote',
        marketAddress,
      },
    });

    // Get updated vote counts
    const votes = await prisma.proposalVote.findMany({
      where: { marketAddress },
    });

    const likes = votes.filter((v) => v.vote === 'like').length;
    const dislikes = votes.filter((v) => v.vote === 'dislike').length;

    return NextResponse.json({
      success: true,
      data: {
        vote: result,
        likes,
        dislikes,
        total: votes.length,
      },
    });
  } catch (error) {
    console.error('Error submitting proposal vote:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit vote' },
      { status: 500 }
    );
  }
}
