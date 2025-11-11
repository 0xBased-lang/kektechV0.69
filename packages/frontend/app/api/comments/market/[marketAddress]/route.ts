/**
 * KEKTECH 3.0 - Comments API
 * POST /api/comments/[marketAddress] - Create comment
 * GET /api/comments/[marketAddress] - Get comments
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { createClient } from '@/lib/supabase/server';
import { applySecurityMiddleware } from '@/lib/middleware/security';
import { sanitizeComment, sanitizeAddress } from '@/lib/utils/sanitize';

// GET - Get comments for a market
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ marketAddress: string }> }
) {
  try {
    const { marketAddress } = await params;
    const { searchParams } = new URL(request.url);

    const sortBy = searchParams.get('sortBy') || 'recent'; // recent, top, controversial
    const filterType = searchParams.get('type') || 'all'; // all, general, resolution_vote
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = { marketAddress };
    if (filterType !== 'all') {
      where.type = filterType;
    }

    // Build order by clause
    let orderBy: any = { timestamp: 'desc' }; // default: recent
    if (sortBy === 'top') {
      orderBy = { upvotes: 'desc' };
    } else if (sortBy === 'controversial') {
      // TODO: Implement controversial sorting algorithm
      // For now, sort by comment count (upvotes + downvotes)
      orderBy = [{ upvotes: 'desc' }, { downvotes: 'desc' }];
    }

    // Fetch comments
    const comments = await prisma.comment.findMany({
      where,
      orderBy,
      take: limit,
      skip: offset,
    });

    // Get total count
    const total = await prisma.comment.count({ where });

    return NextResponse.json({
      success: true,
      data: {
        comments: comments.map((c) => ({
          id: c.id,
          userId: c.userId,
          comment: c.comment,
          upvotes: c.upvotes,
          downvotes: c.downvotes,
          type: c.type,
          timestamp: c.timestamp,
        })),
        total,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST - Create a new comment (🔒 REQUIRES AUTHENTICATION + SECURITY CHECKS)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ marketAddress: string }> }
) {
  try {
    // 🛡️ STEP 1: SECURITY MIDDLEWARE (Rate Limiting + Origin Validation)
    const securityError = await applySecurityMiddleware(request);
    if (securityError) return securityError;

    // 🔒 STEP 2: AUTHENTICATION CHECK
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please sign in with your wallet' },
        { status: 401 }
      );
    }

    // Extract wallet address from authenticated user metadata
    const walletAddress = user.user_metadata?.wallet_address || user.email?.split('@')[0];

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: 'Wallet address not found in session' },
        { status: 400 }
      );
    }

    // 🧹 STEP 3: SANITIZE AND VALIDATE INPUTS
    const { marketAddress: rawMarketAddress } = await params;
    const body = await request.json();
    const { comment: rawComment } = body;

    // Sanitize market address (prevent injection)
    const marketAddress = sanitizeAddress(rawMarketAddress);
    if (!marketAddress) {
      return NextResponse.json(
        { success: false, error: 'Invalid market address format' },
        { status: 400 }
      );
    }

    // Sanitize comment (XSS protection + validation)
    const comment = sanitizeComment(rawComment);
    if (!comment || comment.length < 1) {
      return NextResponse.json(
        { success: false, error: 'Comment cannot be empty' },
        { status: 400 }
      );
    }

    // Additional validation (sanitizeComment already limits to 1000 chars)
    if (comment.length > 1000) {
      return NextResponse.json(
        { success: false, error: 'Comment is too long (max 1000 characters)' },
        { status: 400 }
      );
    }

    // ✅ STEP 4: CREATE COMMENT (with sanitized data)
    const result = await prisma.comment.create({
      data: {
        marketAddress, // ✅ Sanitized address
        userId: walletAddress, // ✅ Verified wallet address
        comment, // ✅ Sanitized comment (XSS-safe)
        type: 'general',
      },
    });

    // Track user activity
    await prisma.userActivity.create({
      data: {
        userId: walletAddress, // ✅ Using verified wallet address
        activityType: 'comment',
        marketAddress,
      },
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}
