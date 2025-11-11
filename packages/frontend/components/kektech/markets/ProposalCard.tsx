/**
 * KEKTECH 3.0 - Proposal Card Component
 * Market proposal card with community voting
 */
'use client';

import { useState, useEffect } from 'react';
import { useMarketInfo } from '@/lib/hooks/kektech';
import { useAccount } from 'wagmi';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { MarketState } from '@/lib/contracts/types';
import { truncate, formatRelativeTime } from '@/lib/utils';
import { ThumbsUp, ThumbsDown, TrendingUp, Users, Clock, Sparkles } from 'lucide-react';
import Link from 'next/link';
import type { Address } from 'viem';

interface ProposalCardProps {
  marketAddress: Address;
  compact?: boolean;
}

interface VoteData {
  likes: number;
  dislikes: number;
  netVotes: number;
  userVote?: 'like' | 'dislike' | null;
}

/**
 * Proposal card with voting functionality
 */
export function ProposalCard({ marketAddress, compact = false }: ProposalCardProps) {
  const market = useMarketInfo(marketAddress, true);
  const { address: userAddress } = useAccount();

  const [voteData, setVoteData] = useState<VoteData>({
    likes: 0,
    dislikes: 0,
    netVotes: 0,
    userVote: null
  });
  const [isVoting, setIsVoting] = useState(false);
  const [loadingVotes, setLoadingVotes] = useState(true);

  // Fetch vote data from API
  useEffect(() => {
    const fetchVotes = async () => {
      try {
        const url = userAddress
          ? `/api/proposals/${marketAddress}/votes?userAddress=${userAddress}`
          : `/api/proposals/${marketAddress}/votes`;

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch votes');

        const data = await response.json();
        setVoteData({
          likes: data.likes || 0,
          dislikes: data.dislikes || 0,
          netVotes: data.netVotes || 0,
          userVote: data.userVote || null
        });
      } catch (error) {
        console.error('Error fetching votes:', error);
      } finally {
        setLoadingVotes(false);
      }
    };

    fetchVotes();
  }, [marketAddress, userAddress]);

  // Handle vote submission
  const handleVote = async (voteType: 'like' | 'dislike') => {
    if (!userAddress) {
      alert('Please connect your wallet to vote');
      return;
    }

    if (isVoting) return;

    setIsVoting(true);
    try {
      const response = await fetch(`/api/proposals/${marketAddress}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vote: voteType  // API expects 'vote' not 'voteType'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit vote');
      }

      const data = await response.json();

      // Update vote data from API response
      if (data.success && data.data) {
        setVoteData({
          likes: data.data.likes,
          dislikes: data.data.dislikes,
          netVotes: data.data.likes - data.data.dislikes,
          userVote: voteType
        });
      }
    } catch (error: any) {
      console.error('Error submitting vote:', error);
      alert(error.message || 'Failed to submit vote');
    } finally {
      setIsVoting(false);
    }
  };

  if (market.isLoading || loadingVotes) {
    return (
      <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  // Show error state ONLY if data failed AND no fallback
  if (market.hasError && !market.usingFallback) {
    return (
      <div className="p-6 bg-red-900/20 rounded-xl border border-red-500/50">
        <div className="text-center">
          <p className="text-red-400 mb-4">Failed to load market data</p>
          <p className="text-gray-400 text-sm mb-4">Address: {marketAddress}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Don't render if no question (even with fallback this should have data)
  if (!market.question) {
    return null;
  }

  // Don't filter by state when using fallback - show all markets for testing
  if (!market.usingFallback && market.state !== MarketState.PROPOSED) {
    return null;
  }

  // Calculate progress toward activation (10+ net upvotes needed)
  const activationThreshold = 10;
  const progress = Math.min((voteData.netVotes / activationThreshold) * 100, 100);
  const isReadyToActivate = voteData.netVotes >= activationThreshold;

  return (
    <div className="group p-6 bg-gray-900 rounded-xl border border-gray-800 hover:border-[#3fb8bd] transition">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <Link href={`/feels-good-markets/kek-futures/market/${marketAddress}`}>
            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-[#3fb8bd] transition line-clamp-2 cursor-pointer">
              {market.question}
            </h3>
          </Link>
          {!compact && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-green-400">{market.outcome1Name}</span>
              <span className="text-sm text-gray-500">vs</span>
              <span className="text-sm text-red-400">{market.outcome2Name}</span>
            </div>
          )}
          <p className="text-xs text-gray-500">
            by {truncate(market.creator || '', 10, 6)}
          </p>
        </div>

        {/* Status badge */}
        <div className="flex flex-col gap-2">
          {market.usingFallback && (
            <div className="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap bg-yellow-500/20 text-yellow-400">
              ⚠️ Test Data
            </div>
          )}
          <div className="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap bg-gray-500/10 text-gray-400">
            💡 {market.usingFallback ? 'Active' : 'Proposed'}
          </div>
        </div>
      </div>

      {/* Vote Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="flex items-center gap-2">
          <ThumbsUp className="w-4 h-4 text-green-400" />
          <div>
            <p className="text-xs text-gray-400">Likes</p>
            <p className="text-sm font-semibold text-white">{voteData.likes}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThumbsDown className="w-4 h-4 text-red-400" />
          <div>
            <p className="text-xs text-gray-400">Dislikes</p>
            <p className="text-sm font-semibold text-white">{voteData.dislikes}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#3fb8bd]" />
          <div>
            <p className="text-xs text-gray-400">Net Votes</p>
            <p className={`text-sm font-semibold ${voteData.netVotes >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {voteData.netVotes >= 0 ? '+' : ''}{voteData.netVotes}
            </p>
          </div>
        </div>
      </div>

      {/* Progress to Activation */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-gray-400">
            {isReadyToActivate ? (
              <span className="text-green-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Ready for activation!
              </span>
            ) : (
              `${activationThreshold - voteData.netVotes} more votes needed`
            )}
          </span>
          <span className="text-xs text-gray-400">{voteData.netVotes}/{activationThreshold}</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${isReadyToActivate ? 'bg-green-500' : 'bg-[#3fb8bd]'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Vote Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => handleVote('like')}
          disabled={isVoting || voteData.userVote === 'like'}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition ${
            voteData.userVote === 'like'
              ? 'bg-green-500/20 text-green-400 border border-green-500/50'
              : 'bg-gray-800 text-gray-300 hover:bg-green-500/10 hover:text-green-400 hover:border-green-500/30 border border-gray-700'
          } ${isVoting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <ThumbsUp className="w-4 h-4" />
          <span>{voteData.userVote === 'like' ? 'Liked' : 'Like'}</span>
        </button>

        <button
          onClick={() => handleVote('dislike')}
          disabled={isVoting || voteData.userVote === 'dislike'}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition ${
            voteData.userVote === 'dislike'
              ? 'bg-red-500/20 text-red-400 border border-red-500/50'
              : 'bg-gray-800 text-gray-300 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 border border-gray-700'
          } ${isVoting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <ThumbsDown className="w-4 h-4" />
          <span>{voteData.userVote === 'dislike' ? 'Disliked' : 'Dislike'}</span>
        </button>
      </div>

      {/* Footer metadata */}
      <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{formatRelativeTime(Number(market.createdAt))}</span>
          </div>
          {market.category && (
            <div className="flex items-center gap-1 px-2 py-1 bg-gray-800 rounded-full">
              <TrendingUp className="w-3 h-3" />
              <span>{market.category}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Compact proposal card for lists
 */
export function CompactProposalCard({ marketAddress }: { marketAddress: Address }) {
  return <ProposalCard marketAddress={marketAddress} compact />;
}
