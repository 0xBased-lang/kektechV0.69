/**
 * KEKTECH 3.0 - Engagement API Client
 * Client-side API calls for proposal voting, resolution voting, and comments
 */

import { useState, useEffect, useCallback } from 'react';
import type { Address } from 'viem';

// Types
export interface ProposalVotes {
  likes: number;
  dislikes: number;
  total: number;
  userVote: 'like' | 'dislike' | null;
}

export interface ResolutionVotes {
  agreeCount: number;
  disagreeCount: number;
  total: number;
  agreePercentage: number;
  disagreePercentage: number;
  userVote: { vote: 'agree' | 'disagree'; comment: string } | null;
  votes: ResolutionVote[];
}

export interface ResolutionVote {
  userId: string;
  vote: 'agree' | 'disagree';
  comment: string;
  timestamp: Date;
}

export interface Comment {
  id: string;
  userId: string;
  comment: string;
  upvotes: number;
  downvotes: number;
  type: 'general' | 'resolution_vote';
  timestamp: Date;
}

export interface CommentResponse {
  comments: Comment[];
  total: number;
  limit: number;
  offset: number;
}

// ========== PROPOSAL VOTING ==========

/**
 * Hook to fetch proposal votes for a market
 */
export function useProposalVotes(marketAddress: Address) {
  const [votes, setVotes] = useState<ProposalVotes | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchVotes = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/proposals/${marketAddress}/vote`);
      const data = await response.json();

      if (data.success) {
        setVotes(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch votes');
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [marketAddress]);

  useEffect(() => {
    fetchVotes();
  }, [fetchVotes]);

  return {
    votes,
    isLoading,
    error,
    refetch: fetchVotes,
  };
}

/**
 * Hook to submit a proposal vote
 */
export function useSubmitProposalVote(marketAddress: Address) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [success, setSuccess] = useState(false);

  const submitVote = useCallback(
    async (vote: 'like' | 'dislike') => {
      setIsSubmitting(true);
      setError(null);
      setSuccess(false);

      try {
        const response = await fetch(`/api/proposals/${marketAddress}/vote`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ vote }),
        });

        const data = await response.json();

        if (data.success) {
          setSuccess(true);
          return data.data;
        } else {
          throw new Error(data.error || 'Failed to submit vote');
        }
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [marketAddress]
  );

  return {
    submitVote,
    isSubmitting,
    error,
    success,
  };
}

// ========== RESOLUTION VOTING ==========

/**
 * Hook to fetch resolution votes for a market
 */
export function useResolutionVotes(marketAddress: Address) {
  const [votes, setVotes] = useState<ResolutionVotes | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchVotes = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/resolution/${marketAddress}/vote`);
      const data = await response.json();

      if (data.success) {
        setVotes(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch votes');
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [marketAddress]);

  useEffect(() => {
    fetchVotes();
  }, [fetchVotes]);

  return {
    votes,
    isLoading,
    error,
    refetch: fetchVotes,
  };
}

/**
 * Hook to submit a resolution vote with mandatory comment
 */
export function useSubmitResolutionVote(marketAddress: Address) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [success, setSuccess] = useState(false);

  const submitVote = useCallback(
    async (vote: 'agree' | 'disagree', comment: string) => {
      setIsSubmitting(true);
      setError(null);
      setSuccess(false);

      // Validate comment length
      if (comment.trim().length < 20) {
        const error = new Error('Comment must be at least 20 characters');
        setError(error);
        setIsSubmitting(false);
        throw error;
      }

      try {
        const response = await fetch(`/api/resolution/${marketAddress}/vote`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ vote, comment }),
        });

        const data = await response.json();

        if (data.success) {
          setSuccess(true);
          return data.data;
        } else {
          throw new Error(data.error || 'Failed to submit vote');
        }
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [marketAddress]
  );

  return {
    submitVote,
    isSubmitting,
    error,
    success,
  };
}

// ========== COMMENTS ==========

/**
 * Hook to fetch comments for a market
 */
export function useComments(
  marketAddress: Address,
  options?: {
    sortBy?: 'recent' | 'top' | 'controversial';
    type?: 'all' | 'general' | 'resolution_vote';
    limit?: number;
    offset?: number;
  }
) {
  const [comments, setComments] = useState<CommentResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (options?.sortBy) params.set('sortBy', options.sortBy);
      if (options?.type) params.set('type', options.type);
      if (options?.limit) params.set('limit', options.limit.toString());
      if (options?.offset) params.set('offset', options.offset.toString());

      const response = await fetch(
        `/api/comments/market/${marketAddress}?${params.toString()}`
      );
      const data = await response.json();

      if (data.success) {
        setComments(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch comments');
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [marketAddress, options?.sortBy, options?.type, options?.limit, options?.offset]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  return {
    comments,
    isLoading,
    error,
    refetch: fetchComments,
  };
}

/**
 * Hook to submit a comment
 */
export function useSubmitComment(marketAddress: Address) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [success, setSuccess] = useState(false);

  const submitComment = useCallback(
    async (comment: string) => {
      setIsSubmitting(true);
      setError(null);
      setSuccess(false);

      try {
        const response = await fetch(`/api/comments/market/${marketAddress}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ comment }),
        });

        const data = await response.json();

        if (data.success) {
          setSuccess(true);
          return data.data;
        } else {
          throw new Error(data.error || 'Failed to submit comment');
        }
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [marketAddress]
  );

  return {
    submitComment,
    isSubmitting,
    error,
    success,
  };
}

/**
 * Hook to vote on a comment
 */
export function useVoteOnComment(commentId: string) {
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const voteOnComment = useCallback(
    async (vote: 'upvote' | 'downvote') => {
      setIsVoting(true);
      setError(null);

      try {
        const response = await fetch(`/api/comments/${commentId}/vote`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ vote }),
        });

        const data = await response.json();

        if (data.success) {
          return data.data;
        } else {
          throw new Error(data.error || 'Failed to vote on comment');
        }
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setIsVoting(false);
      }
    },
    [commentId]
  );

  return {
    voteOnComment,
    isVoting,
    error,
  };
}

/**
 * Hook to subscribe to real-time comment updates
 * NOTE: Stub implementation - will be replaced with Supabase real-time when integrated
 */
export function useCommentSubscription(
  marketAddress: Address,
  onUpdate: () => void
) {
  useEffect(() => {
    // TODO: Implement Supabase real-time subscription when integrated
    // For now, this is a stub to prevent build errors

    // Example implementation (when Supabase is ready):
    // const subscription = supabase
    //   .from('comments')
    //   .on('INSERT', () => onUpdate())
    //   .on('UPDATE', () => onUpdate())
    //   .on('DELETE', () => onUpdate())
    //   .subscribe()
    //
    // return () => {
    //   subscription.unsubscribe()
    // }

    return () => {}
  }, [marketAddress, onUpdate])
}
