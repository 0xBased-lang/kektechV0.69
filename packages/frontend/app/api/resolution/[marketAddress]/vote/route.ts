/**
 * KEKTECH 3.0 - Resolution Voting API
 * POST /api/resolution/[marketAddress]/vote - 🔒 REQUIRES AUTHENTICATION + SECURITY
 * GET /api/resolution/[marketAddress]/vote - Public (shows user's vote if authenticated)
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyAuth } from '@/lib/auth/api-auth';
import { createClient } from '@/lib/supabase/server';
import { applySecurityMiddleware } from '@/lib/middleware/security';
import { sanitizeAddress, sanitizeComment } from '@/lib/utils/sanitize';

// GET - Get resolution votes for a market
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ marketAddress: string }> }
) {
  try {
    const { marketAddress } = await params;

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
    const supabase = await createClient();
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
// 🔒 REQUIRES AUTHENTICATION + SECURITY CHECKS
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ marketAddress: string }> }
) {
  try {
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
    const { vote, comment: rawComment } = body;

    // Sanitize market address
    const marketAddress = sanitizeAddress(rawMarketAddress);
    if (!marketAddress) {
      return NextResponse.json(
        { success: false, error: 'Invalid market address format' },
        { status: 400 }
      );
    }

    // Validate vote input
    if (vote !== 'agree' && vote !== 'disagree') {
      return NextResponse.json(
        { success: false, error: 'Vote must be "agree" or "disagree"' },
        { status: 400 }
      );
    }

    // Sanitize comment (XSS protection)
    const comment = sanitizeComment(rawComment);
    if (!comment || comment.length < 20) {
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

    // ✅ STEP 4: CREATE RESOLUTION VOTE (with sanitized data)
    const result = await prisma.resolutionVote.create({
      data: {
        marketAddress, // ✅ Sanitized address
        userId: walletAddress, // ✅ Verified wallet address
        vote,
        comment, // ✅ Sanitized comment (XSS-safe)
      },
    });

    // Also create a comment entry (type: resolution_vote)
    await prisma.comment.create({
      data: {
        marketAddress, // ✅ Sanitized address
        userId: walletAddress, // ✅ Verified wallet address
        comment, // ✅ Sanitized comment (XSS-safe)
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
