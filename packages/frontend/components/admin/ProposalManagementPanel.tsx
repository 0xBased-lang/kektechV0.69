/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ThumbsUp, ThumbsDown, Check, X, Clock, TrendingUp } from "lucide-react";
import { useMarketList, useMarketInfo } from "@/lib/hooks/kektech/useMarketData";
import { useApproveMarket, useRejectMarket } from "@/lib/hooks/kektech";
import { useProposalVotes } from "@/lib/api/engagement";
import { formatDistanceToNow } from "date-fns";
import type { Address } from "viem";

export function ProposalManagementPanel() {
  const { markets, isLoading } = useMarketList(true);

  // Call hooks for ALL markets at top level (required by React rules)
  const marketInfos = markets.map((address) => useMarketInfo(address, true));

  // Filter for PROPOSED markets (state = 0) using pre-fetched info
  const proposedMarkets = markets.filter((_, index) => {
    return marketInfos[index]?.state === 0;
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>📋 Proposal Management</CardTitle>
          <CardDescription>Loading proposed markets...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>📋 Proposal Management</span>
          <Badge variant="secondary">{proposedMarkets.length} Pending</Badge>
        </CardTitle>
        <CardDescription>
          Review and manage market proposals. Markets need 10 likes within 24 hours to auto-approve.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {proposedMarkets.length === 0 ? (
          <Alert>
            <AlertDescription>
              No pending market proposals. All markets have been approved or rejected.
            </AlertDescription>
          </Alert>
        ) : (
          proposedMarkets.map((address) => (
            <ProposalCard
              key={address}
              marketAddress={address}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}

function ProposalCard({
  marketAddress
}: {
  marketAddress: Address;
}) {
  const marketInfo = useMarketInfo(marketAddress, true);
  const approveMarket = useApproveMarket(marketAddress);
  const rejectMarket = useRejectMarket(marketAddress);
  const { votes, isLoading: loadingVotes, refetch } = useProposalVotes(marketAddress);
  const [rejectReason, setRejectReason] = useState("");

  const likes = votes?.likes || 0;
  const dislikes = votes?.dislikes || 0;
  const totalVotes = likes + dislikes;
  const likePercentage = totalVotes > 0 ? (likes / totalVotes) * 100 : 0;
  const autoApproveThreshold = 10;
  const approvalWindow = 24 * 60 * 60 * 1000; // 24 hours in ms
  // For createdAt, we'll use market creation time or current time
  const createdAt = marketInfo.createdAt ? Number(marketInfo.createdAt) * 1000 : Date.now();
  const timeElapsed = Date.now() - createdAt;
  const timeRemaining = approvalWindow - timeElapsed;
  const willAutoApprove = likes >= autoApproveThreshold;

  const handleApprove = async () => {
    try {
      await approveMarket.approveMarket();
      refetch(); // Refresh votes
    } catch (error) {
      console.error("Failed to approve market:", error);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }

    try {
      await rejectMarket.rejectMarket(rejectReason);
      refetch(); // Refresh votes
    } catch (error) {
      console.error("Failed to reject market:", error);
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-semibold text-lg line-clamp-2">
            {marketInfo.question || "Loading..."}
          </h3>
          {marketInfo.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {marketInfo.description}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-2 font-mono">
            {marketAddress}
          </p>
        </div>

        {/* Auto-approve indicator */}
        {willAutoApprove && (
          <Badge className="bg-green-600 text-white">
            <TrendingUp className="h-3 w-3 mr-1" />
            Auto-Approve Ready
          </Badge>
        )}
      </div>

      {/* Voting Stats */}
      <div className="bg-muted/50 rounded-lg p-3 space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <ThumbsUp className="h-4 w-4 text-green-600" />
              <span className="font-semibold">{likes}</span>
              <span className="text-xs text-muted-foreground">Likes</span>
            </div>
            <div className="flex items-center gap-2">
              <ThumbsDown className="h-4 w-4 text-red-600" />
              <span className="font-semibold">{dislikes}</span>
              <span className="text-xs text-muted-foreground">Dislikes</span>
            </div>
          </div>

          {/* Time remaining */}
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4" />
            <span className="text-muted-foreground">
              {timeRemaining > 0
                ? `${formatDistanceToNow(new Date(Date.now() + timeRemaining))} left`
                : "Expired"}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{likes}/{autoApproveThreshold} likes needed</span>
            <span>{Math.round(likePercentage)}% approval</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                willAutoApprove ? 'bg-green-600' : 'bg-blue-600'
              }`}
              style={{ width: `${(likes / autoApproveThreshold) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Admin Actions */}
      <div className="flex gap-2">
        <Button
          onClick={handleApprove}
          disabled={approveMarket.isLoading || loadingVotes}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          <Check className="h-4 w-4 mr-2" />
          {approveMarket.isLoading ? "Approving..." : "Approve Now"}
        </Button>

        <Button
          onClick={handleReject}
          disabled={rejectMarket.isLoading || loadingVotes}
          variant="destructive"
          className="flex-1"
        >
          <X className="h-4 w-4 mr-2" />
          {rejectMarket.isLoading ? "Rejecting..." : "Reject"}
        </Button>
      </div>

      {/* Status Messages */}
      {approveMarket.isSuccess && (
        <Alert className="border-green-600 bg-green-50">
          <AlertDescription className="text-green-800">
            ✓ Market approved successfully! Moving to APPROVED state.
          </AlertDescription>
        </Alert>
      )}

      {approveMarket.isError && (
        <Alert variant="destructive">
          <AlertDescription>
            Error: {approveMarket.error?.message || "Failed to approve market"}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
