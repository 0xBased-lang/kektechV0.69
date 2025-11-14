"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Settings,
  Check,
  X,
  Play,
  SkipForward,
  AlertTriangle,
  Shield,
  Search
} from "lucide-react";
import { useMarketList, useMarketInfo } from "@/lib/hooks/kektech/useMarketData";
import { useMarketInfoList } from "@/lib/hooks/kektech/useMarketInfoList";
import {
  useApproveMarket,
  useActivateMarket,
  useResolveMarket
} from "@/lib/hooks/kektech/useMarketActions";
import type { Address } from "viem";

const STATE_NAMES = ['PROPOSED', 'APPROVED', 'ACTIVE', 'CLOSED', 'RESOLVING', 'FINALIZED'];

export function MarketOverridePanel() {
  const { markets, isLoading } = useMarketList(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterState, setFilterState] = useState<number | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<Address | null>(null);

  // ✅ FIXED: Use dedicated hook for fetching multiple markets (no hooks-in-loop violation)
  const { marketInfos } = useMarketInfoList(markets, true);

  // Filter markets based on search and state filter
  const filteredMarkets = markets.filter((address, index) => {
    const info = marketInfos[index];
    if (!info) return false;

    // State filter
    if (filterState !== null && info.state !== filterState) {
      return false;
    }

    // Search filter
    if (searchTerm) {
      const question = info.question?.toLowerCase() || "";
      const addressLower = address.toLowerCase();
      const search = searchTerm.toLowerCase();

      return question.includes(search) || addressLower.includes(search);
    }

    return true;
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🔧 Market Overrides</CardTitle>
          <CardDescription>Loading markets...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          <span>Market Overrides</span>
          <Badge variant="secondary">{markets.length} Total</Badge>
        </CardTitle>
        <CardDescription>
          Manually override market states and force state transitions
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by question or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* State Filter */}
          <div className="flex gap-2">
            <Button
              variant={filterState === null ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterState(null)}
            >
              All
            </Button>
            {STATE_NAMES.map((name, idx) => (
              <Button
                key={name}
                variant={filterState === idx ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterState(idx)}
              >
                {name}
              </Button>
            ))}
          </div>
        </div>

        {/* Market List & Detail */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Market List */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {filteredMarkets.length} market{filteredMarkets.length !== 1 ? 's' : ''} found
            </p>

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredMarkets.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    No markets match the current filters
                  </AlertDescription>
                </Alert>
              ) : (
                filteredMarkets.map((address) => (
                  <MarketOverrideCard
                    key={address}
                    marketAddress={address}
                    isSelected={selectedMarket === address}
                    onSelect={() => setSelectedMarket(address)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Override Panel */}
          <div>
            {selectedMarket ? (
              <OverrideControlPanel marketAddress={selectedMarket} />
            ) : (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center text-muted-foreground py-12">
                  Select a market to view override options
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MarketOverrideCard({
  marketAddress,
  isSelected,
  onSelect
}: {
  marketAddress: Address;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const marketInfo = useMarketInfo(marketAddress, true);

  const currentState = marketInfo.state !== undefined ? STATE_NAMES[marketInfo.state] : 'UNKNOWN';

  const stateColors: Record<string, string> = {
    PROPOSED: 'bg-yellow-600',
    APPROVED: 'bg-blue-600',
    ACTIVE: 'bg-green-600',
    CLOSED: 'bg-orange-600',
    RESOLVING: 'bg-purple-600',
    FINALIZED: 'bg-gray-600',
  };

  return (
    <div
      className={`border rounded-lg p-3 cursor-pointer transition-all ${
        isSelected ? 'border-blue-600 shadow-md' : 'hover:border-gray-400'
      }`}
      onClick={onSelect}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h4 className="font-semibold text-sm line-clamp-2">
            {marketInfo.question || "Loading..."}
          </h4>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            {marketAddress.slice(0, 10)}...{marketAddress.slice(-8)}
          </p>
        </div>

        <Badge className={`${stateColors[currentState] || 'bg-gray-600'} text-white ml-2`}>
          {currentState}
        </Badge>
      </div>
    </div>
  );
}

function OverrideControlPanel({ marketAddress }: { marketAddress: Address }) {
  const marketInfo = useMarketInfo(marketAddress, true);
  const approveMarket = useApproveMarket(marketAddress);
  const activateMarket = useActivateMarket(marketAddress);
  const resolveMarket = useResolveMarket(marketAddress);

  const [selectedOutcome, setSelectedOutcome] = useState<0 | 1>(0);
  const [reason, setReason] = useState("");

  const currentState = marketInfo.state !== undefined ? STATE_NAMES[marketInfo.state] : 'UNKNOWN';

  const handleForceApprove = async () => {
    if (!reason.trim()) {
      alert("Please provide a reason for the override");
      return;
    }

    try {
      await approveMarket.approveMarket();
      setReason("");
    } catch (error) {
      console.error("Failed to approve:", error);
    }
  };

  const handleForceReject = async () => {
    if (!reason.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }

    try {
      // TODO: Implement reject functionality
      console.log("Rejecting market:", { marketAddress, reason });
    } catch (error) {
      console.error("Failed to reject:", error);
    }
  };

  const handleForceActivate = async () => {
    if (!reason.trim()) {
      alert("Please provide a reason for activation");
      return;
    }

    try {
      await activateMarket.activateMarket();
      setReason("");
    } catch (error) {
      console.error("Failed to activate:", error);
    }
  };

  const handleForceResolve = async () => {
    if (!reason.trim()) {
      alert("Please provide a reason for resolution");
      return;
    }

    try {
      await resolveMarket.resolveMarket(selectedOutcome);
      setReason("");
    } catch (error) {
      console.error("Failed to resolve:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          Admin Override Controls
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Market Info */}
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-sm font-semibold line-clamp-2 mb-2">
            {marketInfo.question || "Loading..."}
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">State:</span>
              <span className="ml-2 font-semibold">{currentState}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Creator:</span>
              <span className="ml-2 font-mono">
                {marketInfo.creator
                  ? `${marketInfo.creator.slice(0, 6)}...${marketInfo.creator.slice(-4)}`
                  : '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Warning */}
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Override actions bypass normal workflow. Use with caution and document your reasoning.
          </AlertDescription>
        </Alert>

        {/* Reason Input */}
        <div className="space-y-2">
          <label className="text-sm font-semibold">Override Reason (Required)</label>
          <Textarea
            placeholder="Explain why you're overriding the normal process..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="text-sm"
          />
        </div>

        {/* Override Actions */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Available Actions</h4>

          {/* Approve (if PROPOSED) */}
          {marketInfo.state === 0 && (
            <div className="flex gap-2">
              <Button
                onClick={handleForceApprove}
                disabled={approveMarket.isLoading || !reason.trim()}
                className="flex-1 bg-green-600 hover:bg-green-700"
                size="sm"
              >
                <Check className="h-4 w-4 mr-1" />
                Force Approve
              </Button>
              <Button
                onClick={handleForceReject}
                disabled={!reason.trim()}
                variant="destructive"
                size="sm"
                className="flex-1"
              >
                <X className="h-4 w-4 mr-1" />
                Force Reject
              </Button>
            </div>
          )}

          {/* Activate (if APPROVED) */}
          {marketInfo.state === 1 && (
            <Button
              onClick={handleForceActivate}
              disabled={activateMarket.isLoading || !reason.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="sm"
            >
              <Play className="h-4 w-4 mr-1" />
              Force Activate
            </Button>
          )}

          {/* Resolve (if ACTIVE or CLOSED) */}
          {(marketInfo.state === 2 || marketInfo.state === 3) && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button
                  variant={selectedOutcome === 0 ? "default" : "outline"}
                  className={selectedOutcome === 0 ? "bg-green-600" : ""}
                  onClick={() => setSelectedOutcome(0)}
                  size="sm"
                  disabled={!reason.trim()}
                >
                  YES
                </Button>
                <Button
                  variant={selectedOutcome === 1 ? "default" : "outline"}
                  className={selectedOutcome === 1 ? "bg-red-600" : ""}
                  onClick={() => setSelectedOutcome(1)}
                  size="sm"
                  disabled={!reason.trim()}
                >
                  NO
                </Button>
              </div>
              <Button
                onClick={handleForceResolve}
                disabled={resolveMarket.isLoading || !reason.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700"
                size="sm"
              >
                <SkipForward className="h-4 w-4 mr-1" />
                Force Resolve as {selectedOutcome === 0 ? "YES" : "NO"}
              </Button>
            </div>
          )}

          {/* Finalized state */}
          {marketInfo.state === 5 && (
            <div className="text-center text-sm text-muted-foreground py-4">
              Market is finalized. No further actions available.
            </div>
          )}
        </div>

        {/* Status Messages */}
        {approveMarket.isSuccess && (
          <Alert className="border-green-600 bg-green-50">
            <AlertDescription className="text-green-800">
              ✓ Market approved successfully!
            </AlertDescription>
          </Alert>
        )}

        {activateMarket.isSuccess && (
          <Alert className="border-blue-600 bg-blue-50">
            <AlertDescription className="text-blue-800">
              ✓ Market activated successfully!
            </AlertDescription>
          </Alert>
        )}

        {resolveMarket.isSuccess && (
          <Alert className="border-purple-600 bg-purple-50">
            <AlertDescription className="text-purple-800">
              ✓ Market resolved successfully!
            </AlertDescription>
          </Alert>
        )}

        {(approveMarket.isError || activateMarket.isError || resolveMarket.isError) && (
          <Alert variant="destructive">
            <AlertDescription>
              Error: {
                approveMarket.error?.message ||
                activateMarket.error?.message ||
                resolveMarket.error?.message ||
                "Failed to execute override"
              }
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
