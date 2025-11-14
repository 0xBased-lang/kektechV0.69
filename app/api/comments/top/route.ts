/**
 * KEKTECH 3.0 - Top Comments API
 * GET /api/comments/top?timeframe=day|week|all&limit=10
 * Returns top-rated comments across all markets
 *
 * FIXED: Uses lazy Prisma import to prevent server startup freeze
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Lazy import Prisma only when route is called (prevents server freeze on startup)
    const prisma = (await import('@/lib/db/prisma')).default;

    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || 'all';
    const limit = parseInt(searchParams.get('limit') || '10');

    // Calculate time cutoff based on timeframe
    let timeCutoff = new Date(0); // Beginning of time for 'all'
    const now = new Date();

    if (timeframe === 'day') {
      timeCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    } else if (timeframe === 'week') {
      timeCutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Fetch top comments with engagement scoring
    const comments = await prisma.comment.findMany({
      where: {
        timestamp: {
          gte: timeCutoff,
        },
      },
      orderBy: {
        upvotes: 'desc',
      },
      take: limit * 3, // Fetch extra for engagement calculation
    });

    // Calculate engagement scores
    const enrichedComments = comments.map((c) => {
      const netVotes = c.upvotes - c.downvotes;
      const totalVotes = c.upvotes + c.downvotes;
      const ageHours = (now.getTime() - c.timestamp.getTime()) / (1000 * 60 * 60);
      const recencyScore = Math.max(0, 1 - ageHours / 168); // Decay over 1 week

      // Engagement formula: 70% net votes, 20% recency, 10% total engagement
      const engagementScore =
        (netVotes * 0.7) +
        (recencyScore * 10 * 0.2) +
        (totalVotes * 0.1);

      return {
        id: c.id,
        marketAddress: c.marketAddress,
        userId: c.userId,
        comment: c.comment,
        upvotes: c.upvotes,
        downvotes: c.downvotes,
        netVotes,
        engagementScore: Math.round(engagementScore * 100) / 100,
        timestamp: c.timestamp,
        type: c.type,
      };
    });

    // Sort by engagement score and limit results
    enrichedComments.sort((a, b) => b.engagementScore - a.engagementScore);
    const topComments = enrichedComments.slice(0, limit);

    return NextResponse.json({
      success: true,
      data: {
        comments: topComments,
        total: topComments.length,
        timeframe,
      },
    });

  } catch (error) {
    console.error('Error fetching top comments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch top comments' },
      { status: 500 }
    );
  }
}
