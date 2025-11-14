/**
 * KEKTECH 3.0 - Database Health Check API
 * GET /api/health/db - Check database connectivity and Prisma Client status
 */

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 🔌 LAZY IMPORT: Ensures DATABASE_URL is available before Prisma initialization
    const prisma = (await import('@/lib/db/prisma')).default;

    // Test 1: Basic database connectivity
    await prisma.$queryRaw`SELECT 1`;

    // Test 2: Check if Comment table exists and get count
    const commentCount = await prisma.comment.count();

    // Test 3: Check if other tables exist
    const proposalVoteCount = await prisma.proposalVote.count();
    const resolutionVoteCount = await prisma.resolutionVote.count();
    const userActivityCount = await prisma.userActivity.count();

    return NextResponse.json({
      success: true,
      database: 'connected',
      prisma: 'initialized',
      tables: {
        comments: commentCount,
        proposalVotes: proposalVoteCount,
        resolutionVotes: resolutionVoteCount,
        userActivity: userActivityCount,
      },
      timestamp: new Date().toISOString(),
      environment: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        nodeEnv: process.env.NODE_ENV,
      },
    });
  } catch (error) {
    console.error('Database health check failed:', error);

    return NextResponse.json(
      {
        success: false,
        database: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' && error instanceof Error
          ? error.stack
          : undefined,
        environment: {
          hasDatabaseUrl: !!process.env.DATABASE_URL,
          nodeEnv: process.env.NODE_ENV,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
