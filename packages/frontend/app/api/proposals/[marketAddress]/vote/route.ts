/**
 * KEKTECH 3.0 - Proposal Voting API
 * POST /api/proposals/[marketAddress]/vote - 🔒 REQUIRES AUTHENTICATION + SECURITY
 * GET /api/proposals/[marketAddress]/vote - Public (shows user's vote if authenticated)
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/api-auth';
import { createClient } from '@/lib/supabase/server';
import { applySecurityMiddleware } from '@/lib/middleware/security';
import { sanitizeAddress } from '@/lib/utils/sanitize';

// GET - Get vote counts for a market proposal
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ marketAddress: string }> }
) {
  try {
    // 🔌 LAZY IMPORT: Ensures DATABASE_URL is available before Prisma initialization
    const prisma = (await import('@/lib/db/prisma')).default;

    const { marketAddress } = await params;

    // Get all votes for this market
    const votes = await prisma.proposalVote.findMany({
      where: { marketAddress },
    });

    const likes = votes.filter((v) => v.vote === 'like').length;
    const dislikes = votes.filter((v) => v.vote === 'dislike').length;

    // Get user's vote if authenticated (optional)
    const supabase = await createClient();
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
// 🔒 REQUIRES AUTHENTICATION + SECURITY CHECKS
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ marketAddress: string }> }
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

    // 🧹 STEP 3: SANITIZE AND VALIDATE INPUTS
    const { marketAddress: rawMarketAddress } = await params;
    const body = await request.json();
    const { vote } = body;

    // Sanitize market address
    let marketAddress: string;
    try {
      marketAddress = sanitizeAddress(rawMarketAddress);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid market address format' },
        { status: 400 }
      );
    }

    // Validate vote input
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
