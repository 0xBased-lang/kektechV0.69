/**
 * KEKTECH 3.0 - Top Comments Hook
 * Fetches top-rated comments across all markets
 */

import { useState, useEffect, useCallback } from 'react';
import type { Address } from 'viem';

export interface TopComment {
  id: string;
  marketAddress: Address;
  marketName?: string;
  userId: string;
  userName?: string;
  comment: string;
  upvotes: number;
  downvotes: number;
  netVotes: number; // upvotes - downvotes
  engagementScore: number; // Calculated score
  timestamp: Date;
  type: 'general' | 'resolution_vote';
}

export interface TopCommentsResponse {
  comments: TopComment[];
  total: number;
  timeframe: 'day' | 'week' | 'all';
}

export type TopCommentsTimeframe = 'day' | 'week' | 'all';

/**
 * Hook to fetch top comments across all markets
 *
 * Engagement Score Formula:
 * - Net votes (upvotes - downvotes): 70% weight
 * - Recency bonus: 20% weight
 * - Total engagement (upvotes + downvotes): 10% weight
 *
 * @param timeframe - Time window: 'day' (24h), 'week' (7d), 'all'
 * @param limit - Maximum comments to return
 */
export function useTopComments(timeframe: TopCommentsTimeframe = 'all', limit: number = 10) {
  const [data, setData] = useState<TopCommentsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTopComments = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        timeframe,
        limit: limit.toString(),
      });

      const response = await fetch(`/api/comments/top?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch top comments');
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [timeframe, limit]);

  useEffect(() => {
    fetchTopComments();
  }, [fetchTopComments]);

  return {
    comments: data?.comments || [],
    total: data?.total || 0,
    timeframe: data?.timeframe || timeframe,
    isLoading,
    error,
    refetch: fetchTopComments,
  };
}

/**
 * Calculate engagement score for a comment
 * Used for sorting when API is unavailable
 */
export function calculateEngagementScore(
  upvotes: number,
  downvotes: number,
  timestamp: Date,
  now: Date = new Date()
): number {
  // Net votes (70% weight)
  const netVotes = upvotes - downvotes;
  const netVoteScore = Math.max(0, netVotes) / Math.max(1, netVotes + 10); // Normalized 0-1

  // Recency bonus (20% weight)
  const ageHours = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);
  let recencyScore = 0;
  if (ageHours < 24) {
    recencyScore = 1.0; // Last 24 hours
  } else if (ageHours < 72) {
    recencyScore = 0.7; // Last 3 days
  } else if (ageHours < 168) {
    recencyScore = 0.4; // Last 7 days
  } else if (ageHours < 720) {
    recencyScore = 0.2; // Last 30 days
  } else {
    recencyScore = 0.1; // Older than 30 days
  }

  // Total engagement (10% weight)
  const totalEngagement = upvotes + downvotes;
  const engagementScore = Math.min(totalEngagement / 20, 1.0); // Normalized 0-1, max at 20 votes

  // Final weighted score
  const finalScore = netVoteScore * 0.7 + recencyScore * 0.2 + engagementScore * 0.1;

  return finalScore;
}
