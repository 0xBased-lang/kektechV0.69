/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import {
  Scale,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield
} from "lucide-react";
import { useMarketList, useMarketInfo, useAdminResolveMarket } from "@/lib/hooks/kektech";
import { useResolutionVotes } from "@/lib/api/engagement";
import { formatDistanceToNow } from "date-fns";
import type { Address } from "viem";

export function ResolutionControlPanel() {
  const { markets, isLoading } = useMarketList(true);
  const [selectedMarket, setSelectedMarket] = useState<Address | null>(null);

  // Call hooks for ALL markets at top level (required by React rules)
  const marketInfos = markets.map((address) => useMarketInfo(address, true));

  // Filter for RESOLVING markets (state = 4 or 5 in old system, or RESOLVING/DISPUTED states)
  const resolvingMarkets = markets.filter((_, index) => {
    const state = marketInfos[index]?.state;
    return state === 4 || state === 5; // RESOLVING or DISPUTED
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>⚖️ Resolution Control</CardTitle>
          <CardDescription>Loading markets in resolution...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="h-5 w-5" />
          <span>Resolution Control</span>
          <Badge variant="secondary">{resolvingMarkets.length} Resolving</Badge>
        </CardTitle>
        <CardDescription>
          Review community votes and resolve disputed markets
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {resolvingMarkets.length === 0 ? (
          <Alert>
            <AlertDescription>
              No markets currently in resolution. Markets will appear here during the dispute window.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Market List */}
            <div className="space-y-3">
              {resolvingMarkets.map((address) => (
                <ResolutionMarketCard
                  key={address}
                  marketAddress={address}
                  isSelected={selectedMarket === address}
                  onSelect={() => setSelectedMarket(address)}
                />
              ))}
            </div>

            {/* Detail Panel */}
            <div>
              {selectedMarket ? (
                <ResolutionDetailPanel
                  marketAddress={selectedMarket}
                />
              ) : (
                <Card className="h-full flex items-center justify-center">
                  <CardContent className="text-center text-muted-foreground py-12">
                    Select a market to view resolution details
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ResolutionMarketCard({
  marketAddress,
  isSelected,
  onSelect
}: {
  marketAddress: Address;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const marketInfo = useMarketInfo(marketAddress, true);
  const { votes, isLoading: loadingData } = useResolutionVotes(marketAddress);

  const agreePercentage = votes?.agreePercentage || 0;
  const willAutoFinalize = agreePercentage >= 75;
  const needsReview = agreePercentage < 60 && agreePercentage > 40;

  const stateNames = ['PROPOSED', 'APPROVED', 'ACTIVE', 'RESOLVING', 'DISPUTED', 'FINALIZED'];
  const currentState = marketInfo.state !== undefined ? stateNames[marketInfo.state] : 'UNKNOWN';

  return (
    <div
      className={`border rounded-lg p-3 cursor-pointer transition-all ${
        isSelected ? 'border-blue-600 shadow-md' : 'hover:border-gray-400'
      }`}
      onClick={onSelect}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h4 className="font-semibold text-sm line-clamp-2">
            {marketInfo.question || "Loading..."}
          </h4>
          <Badge variant="outline" className="mt-1 text-xs">
            {currentState}
          </Badge>
        </div>

        {/* Status indicator */}
        {votes && (
          <div className="ml-2">
            {willAutoFinalize ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : needsReview ? (
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            ) : (
              <Clock className="h-5 w-5 text-blue-600" />
            )}
          </div>
        )}
      </div>

      {/* Vote Summary */}
      {loadingData || !votes ? (
        <div className="text-xs text-muted-foreground">Loading votes...</div>
      ) : (
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-green-600">✓ Agree: {votes.agreeCount}</span>
            <span className="text-red-600">✗ Disagree: {votes.disagreeCount}</span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden flex">
            <div
              className="bg-green-600"
              style={{ width: `${agreePercentage}%` }}
            />
            <div
              className="bg-red-600"
              style={{ width: `${100 - agreePercentage}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {agreePercentage.toFixed(1)}% agreement
          </p>
        </div>
      )}

      {/* Time remaining - TODO: Get from market info */}
      {marketInfo.expiryTime && (
        <p className="text-xs text-muted-foreground mt-2">
          <Clock className="h-3 w-3 inline mr-1" />
          Dispute window active
        </p>
      )}
    </div>
  );
}

function ResolutionDetailPanel({
  marketAddress
}: {
  marketAddress: Address;
}) {
  const marketInfo = useMarketInfo(marketAddress, true);
  const { votes, isLoading, refetch } = useResolutionVotes(marketAddress);
  const adminResolve = useAdminResolveMarket(marketAddress);
  const [adminReason, setAdminReason] = useState("");
  const [selectedOutcome, setSelectedOutcome] = useState<0 | 1>(0);

  const totalVotes = votes?.total || 0;
  const agreePercentage = votes?.agreePercentage || 0;

  const handleAdminResolve = async () => {
    if (!adminReason.trim()) {
      alert("Please provide a reason for the admin resolution");
      return;
    }

    try {
      await adminResolve.adminResolveMarket(selectedOutcome, adminReason);
      refetch(); // Refresh votes after resolution
    } catch (error) {
      console.error("Failed to resolve market:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Resolution Details</CardTitle>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {marketInfo.question}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading resolution data...</div>
        ) : !votes ? (
          <div className="text-center py-8 text-muted-foreground">No resolution data found</div>
        ) : (
          <>
            {/* Proposed Outcome - TODO: Get from contract */}
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Proposed Outcome</p>
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-600">
                  Pending Resolution
                </Badge>
              </div>
            </div>

            {/* Vote Breakdown */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Scale className="h-4 w-4" />
                Community Votes
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <ThumbsUp className="h-4 w-4 text-green-600 mb-1" />
                  <p className="text-2xl font-bold text-green-700">{votes.agreeCount}</p>
                  <p className="text-xs text-green-600">Agree ({agreePercentage.toFixed(1)}%)</p>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <ThumbsDown className="h-4 w-4 text-red-600 mb-1" />
                  <p className="text-2xl font-bold text-red-700">{votes.disagreeCount}</p>
                  <p className="text-xs text-red-600">Disagree ({(100 - agreePercentage).toFixed(1)}%)</p>
                </div>
              </div>

          {/* Thresholds */}
          <div className="text-xs space-y-1">
            <p className={agreePercentage >= 75 ? "text-green-600 font-semibold" : "text-muted-foreground"}>
              ✓ ≥75% → Auto-finalize {agreePercentage >= 75 && "(READY)"}
            </p>
            <p className={agreePercentage < 60 && agreePercentage > 40 ? "text-yellow-600 font-semibold" : "text-muted-foreground"}>
              ⚠️ 40-60% → Needs admin review {agreePercentage < 60 && agreePercentage > 40 && "(REVIEW)"}
            </p>
          </div>
        </div>

            {/* Comments */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Comments ({votes.votes.length})
              </h4>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {votes.votes.length === 0 ? (
                  <div className="text-center text-sm text-muted-foreground py-4">
                    No comments yet
                  </div>
                ) : (
                  votes.votes.map((vote, idx) => (
                    <div key={idx} className="border rounded-lg p-2 text-sm">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-mono text-muted-foreground">
                          {vote.userId.slice(0, 6)}...{vote.userId.slice(-4)}
                        </span>
                        <Badge variant={vote.vote === 'agree' ? 'default' : 'destructive'} className="text-xs">
                          {vote.vote}
                        </Badge>
                      </div>
                      <p className="text-xs">{vote.comment}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(vote.timestamp))} ago
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

        {/* Admin Override */}
        <div className="border-t pt-4 space-y-3">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-600" />
            Admin Override
          </h4>

          {/* Outcome Selection */}
          <div className="flex gap-2">
            <Button
              variant={selectedOutcome === 0 ? "default" : "outline"}
              className={selectedOutcome === 0 ? "bg-green-600" : ""}
              onClick={() => setSelectedOutcome(0)}
              size="sm"
            >
              Resolve as YES
            </Button>
            <Button
              variant={selectedOutcome === 1 ? "default" : "outline"}
              className={selectedOutcome === 1 ? "bg-red-600" : ""}
              onClick={() => setSelectedOutcome(1)}
              size="sm"
            >
              Resolve as NO
            </Button>
          </div>

          {/* Admin Reason */}
          <Textarea
            placeholder="Provide a reason for admin resolution (required)..."
            value={adminReason}
            onChange={(e) => setAdminReason(e.target.value)}
            rows={3}
            className="text-sm"
          />

              <Button
                onClick={handleAdminResolve}
                disabled={adminResolve.isLoading || !adminReason.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Shield className="h-4 w-4 mr-2" />
                {adminResolve.isLoading ? "Resolving..." : `Finalize as ${selectedOutcome === 0 ? "YES" : "NO"}`}
              </Button>

              {adminResolve.isSuccess && (
                <Alert className="border-green-600 bg-green-50">
                  <AlertDescription className="text-green-800">
                    ✓ Market resolved successfully!
                  </AlertDescription>
                </Alert>
              )}

              {adminResolve.isError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    Error: {adminResolve.error?.message || "Failed to resolve market"}
                  </AlertDescription>
                </Alert>
              )}

              <p className="text-xs text-muted-foreground">
                ⚠️ Admin resolution will override community votes and immediately finalize the market.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
