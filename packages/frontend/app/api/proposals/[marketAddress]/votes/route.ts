/**
 * KEKTECH 3.0 - Proposal Votes API
 * GET /api/proposals/[marketAddress]/votes - Get vote counts and user's vote
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Helper function to create Supabase client (lazy initialization)
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

// GET - Get vote counts for a market proposal
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ marketAddress: string }> }
) {
  try {
    const { marketAddress } = await params;
    const { searchParams } = new URL(request.url);
    const userAddress = searchParams.get('userAddress');

    // Initialize Supabase client (lazy initialization at runtime)
    const supabase = getSupabaseClient();

    // Get all votes for this market from Supabase
    const { data: votes, error } = await supabase
      .from('ProposalVote')
      .select('*')
      .eq('marketAddress', marketAddress);

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    // Calculate vote counts
    const likes = votes?.filter((v: any) => v.vote === 'like').length || 0;
    const dislikes = votes?.filter((v: any) => v.vote === 'dislike').length || 0;
    const netVotes = likes - dislikes;

    // Get user's vote if userAddress provided
    let userVote: 'like' | 'dislike' | null = null;
    if (userAddress && votes) {
      const userVoteRecord = votes.find((v: any) =>
        v.userId.toLowerCase() === userAddress.toLowerCase()
      );
      userVote = userVoteRecord?.vote || null;
    }

    return NextResponse.json({
      likes,
      dislikes,
      netVotes,
      userVote,
      total: votes?.length || 0
    });
  } catch (error) {
    console.error('Error fetching proposal votes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch votes' },
      { status: 500 }
    );
  }
}
