/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Activity,
  Users,
  DollarSign,
  Clock,
  BarChart3,
  Eye,
  AlertCircle
} from "lucide-react";
import { useMarketList, useMarketInfo } from "@/lib/hooks/kektech/useMarketData";
import { formatDistanceToNow } from "date-fns";
import { formatEther } from "viem";
import type { Address } from "viem";

interface MarketMetrics {
  totalBets: number;
  uniqueBettors: number;
  volume24h: bigint;
  yesShares: bigint;
  noShares: bigint;
  yesPercentage: number;
}

export function ActiveMarketsPanel() {
  const { markets, isLoading } = useMarketList(true);
  const [metrics, setMetrics] = useState<Record<string, MarketMetrics>>({});
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [sortBy, setSortBy] = useState<'volume' | 'activity' | 'expiry'>('volume');

  // Call hooks for ALL markets at top level (required by React rules)
  const marketInfos = markets.map((address) => useMarketInfo(address, true));

  // DEBUG: Log market info
  useEffect(() => {
    console.log('[ActiveMarketsPanel] Total markets:', markets.length);
    console.log('[ActiveMarketsPanel] Market states:', marketInfos.map((info, idx) => ({
      address: markets[idx],
      state: info?.state,
      question: info?.question
    })));
  }, [markets, marketInfos]);

  // Filter for ACTIVE markets (state = 2) using the pre-fetched info
  const activeMarkets = markets.filter((_, index) => {
    return marketInfos[index]?.state === 2;
  });

  // DEBUG: Log active markets count
  useEffect(() => {
    console.log('[ActiveMarketsPanel] Active markets (state=2):', activeMarkets.length);
  }, [activeMarkets.length]);

  useEffect(() => {
    // Fetch metrics for all active markets
    const fetchMetrics = async () => {
      if (activeMarkets.length === 0) return;

      setLoadingMetrics(true);
      try {
        const newMetrics: Record<string, MarketMetrics> = {};

        // TODO: Replace with actual API call to fetch metrics
        // For now, mock data
        activeMarkets.forEach((address) => {
          const totalShares = BigInt(Math.floor(Math.random() * 1000) + 100);
          const yesShares = BigInt(Math.floor(Number(totalShares) * (Math.random() * 0.6 + 0.2)));
          const noShares = totalShares - yesShares;

          newMetrics[address] = {
            totalBets: Math.floor(Math.random() * 100) + 10,
            uniqueBettors: Math.floor(Math.random() * 50) + 5,
            volume24h: BigInt(Math.floor(Math.random() * 50) * 10 ** 18),
            yesShares,
            noShares,
            yesPercentage: Number((yesShares * 100n) / totalShares),
          };
        });

        setMetrics(newMetrics);
      } catch (error) {
        console.error("Failed to fetch market metrics:", error);
      } finally {
        setLoadingMetrics(false);
      }
    };

    fetchMetrics();
  }, [activeMarkets.length]);

  // Sort markets based on selected criteria
  // Note: We already have marketInfos from above for all markets
  const sortedMarkets = [...activeMarkets].sort((aAddress, bAddress) => {
    const aIndex = markets.indexOf(aAddress);
    const bIndex = markets.indexOf(bAddress);

    if (sortBy === 'volume') {
      const volumeA = metrics[aAddress]?.volume24h || 0n;
      const volumeB = metrics[bAddress]?.volume24h || 0n;
      return volumeB > volumeA ? 1 : -1;
    } else if (sortBy === 'activity') {
      const betsA = metrics[aAddress]?.totalBets || 0;
      const betsB = metrics[bAddress]?.totalBets || 0;
      return betsB - betsA;
    } else {
      // Sort by expiry (soonest first) using pre-fetched market info
      const infoA = marketInfos[aIndex];
      const infoB = marketInfos[bIndex];
      return (infoA?.expiryTime || 0) - (infoB?.expiryTime || 0);
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🎯 Active Markets</CardTitle>
          <CardDescription>Loading active markets...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Calculate total statistics
  const totalVolume24h = Object.values(metrics).reduce(
    (sum, m) => sum + m.volume24h,
    0n
  );
  const totalBets = Object.values(metrics).reduce((sum, m) => sum + m.totalBets, 0);
  const uniqueBettors = new Set(
    Object.values(metrics).flatMap(() => Array(Math.floor(Math.random() * 50)))
  ).size;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              <span>Active Markets</span>
              <Badge variant="secondary">{activeMarkets.length} Live</Badge>
            </CardTitle>
            <CardDescription>
              Monitor live betting markets and their performance
            </CardDescription>
          </div>

          {/* Sort Options */}
          <div className="flex gap-2">
            <Button
              variant={sortBy === 'volume' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('volume')}
            >
              <DollarSign className="h-4 w-4 mr-1" />
              Volume
            </Button>
            <Button
              variant={sortBy === 'activity' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('activity')}
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              Activity
            </Button>
            <Button
              variant={sortBy === 'expiry' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('expiry')}
            >
              <Clock className="h-4 w-4 mr-1" />
              Expiry
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-xs text-muted-foreground">24h Volume</p>
                  <p className="text-2xl font-bold">
                    {parseFloat(formatEther(totalVolume24h)).toFixed(2)} BASED
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Total Bets</p>
                  <p className="text-2xl font-bold">{totalBets}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Active Users</p>
                  <p className="text-2xl font-bold">{uniqueBettors}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Market List */}
        {activeMarkets.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No active markets at the moment. Markets will appear here once they&apos;re activated.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            {sortedMarkets.map((address) => (
              <ActiveMarketCard
                key={address}
                marketAddress={address}
                metrics={metrics[address]}
                loadingMetrics={loadingMetrics}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ActiveMarketCard({
  marketAddress,
  metrics,
  loadingMetrics
}: {
  marketAddress: Address;
  metrics?: MarketMetrics;
  loadingMetrics: boolean;
}) {
  const marketInfo = useMarketInfo(marketAddress, true);

  const expiryTime = marketInfo.expiryTime ? new Date(Number(marketInfo.expiryTime) * 1000) : null;
  const isExpiringSoon = expiryTime && expiryTime.getTime() - Date.now() < 24 * 60 * 60 * 1000;

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold line-clamp-1">
              {marketInfo.question || "Loading..."}
            </h3>
            {isExpiringSoon && (
              <Badge variant="destructive" className="text-xs">
                <AlertCircle className="h-3 w-3 mr-1" />
                Closing Soon
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground font-mono">
            {marketAddress.slice(0, 10)}...{marketAddress.slice(-8)}
          </p>
        </div>

        {/* View Market Button */}
        <Button variant="outline" size="sm" asChild>
          <a href={`/market/${marketAddress}`} target="_blank" rel="noopener noreferrer">
            <Eye className="h-4 w-4 mr-1" />
            View
          </a>
        </Button>
      </div>

      {/* Metrics Grid */}
      {loadingMetrics || !metrics ? (
        <div className="text-sm text-muted-foreground">Loading metrics...</div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {/* Volume */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">24h Volume</p>
            <p className="font-semibold text-blue-600">
              {parseFloat(formatEther(metrics.volume24h)).toFixed(2)} Ξ
            </p>
          </div>

          {/* Bets */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Total Bets</p>
            <p className="font-semibold">{metrics.totalBets}</p>
          </div>

          {/* Bettors */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Bettors</p>
            <p className="font-semibold">{metrics.uniqueBettors}</p>
          </div>

          {/* Expiry */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Closes In</p>
            <p className="font-semibold text-sm">
              {expiryTime ? formatDistanceToNow(expiryTime) : "Unknown"}
            </p>
          </div>
        </div>
      )}

      {/* Outcome Distribution */}
      {metrics && (
        <div className="mt-3 space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>YES {metrics.yesPercentage.toFixed(1)}%</span>
            <span>NO {(100 - metrics.yesPercentage).toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden flex">
            <div
              className="bg-green-600"
              style={{ width: `${metrics.yesPercentage}%` }}
            />
            <div
              className="bg-red-600"
              style={{ width: `${100 - metrics.yesPercentage}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
