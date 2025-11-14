/**
 * KEKTECH 3.0 - Market Filters Hook
 * Manages filter state with localStorage persistence
 */
'use client';

import { useState, useEffect, useMemo } from 'react';
import { MarketState } from '@/lib/contracts/types';
import type { Address } from 'viem';
import type { FilterState } from '@/components/kektech/markets/MarketFilters';

const STORAGE_KEY = 'kektech_market_filters';

const DEFAULT_FILTERS: FilterState = {
  search: '',
  sortBy: 'engagement',
  states: [],
};

/**
 * Load filters from localStorage
 */
function loadFilters(): FilterState {
  if (typeof window === 'undefined') return DEFAULT_FILTERS;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_FILTERS;

    const parsed = JSON.parse(stored);
    return {
      search: parsed.search || '',
      sortBy: parsed.sortBy || 'engagement',
      states: Array.isArray(parsed.states) ? parsed.states : [],
    };
  } catch (error) {
    console.error('Failed to load filters from localStorage:', error);
    return DEFAULT_FILTERS;
  }
}

/**
 * Save filters to localStorage
 */
function saveFilters(filters: FilterState) {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  } catch (error) {
    console.error('Failed to save filters to localStorage:', error);
  }
}

export interface MarketWithInfo {
  address: Address;
  info: {
    question?: string;
    description?: string;
    state?: MarketState;
    createdAt?: bigint;
    totalYesShares?: bigint;
    totalNoShares?: bigint;
  };
  engagementScore?: number;
}

/**
 * Calculate engagement score for sorting
 */
function calculateEngagementScore(
  totalShares: bigint,
  createdAt: bigint,
  state: MarketState
): number {
  const now = BigInt(Math.floor(Date.now() / 1000));
  const age = Number(now - createdAt);
  const dayInSeconds = 86400;

  // Volume score (0-40 points)
  const volumeInBased = Number(totalShares) / 1e18;
  const volumeScore = Math.min(volumeInBased / 100 * 40, 40);

  // Recency score (0-30 points) - decays over 7 days
  const maxAge = 7 * dayInSeconds;
  const recencyScore = Math.max(0, 30 * (1 - age / maxAge));

  // State score (0-30 points)
  const stateScores = {
    [MarketState.PROPOSED]: 10,
    [MarketState.APPROVED]: 15,
    [MarketState.ACTIVE]: 30,
    [MarketState.RESOLVING]: 25,
    [MarketState.DISPUTED]: 20,
    [MarketState.FINALIZED]: 5,
  };
  const stateScore = stateScores[state] || 0;

  return Math.round(volumeScore + recencyScore + stateScore);
}

/**
 * Hook to manage market filters with persistence
 */
export function useMarketFilters(markets: MarketWithInfo[]) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [isClient, setIsClient] = useState(false);

  // Load filters on mount
  useEffect(() => {
    setIsClient(true);
    setFilters(loadFilters());
  }, []);

  // Save filters when they change
  useEffect(() => {
    if (isClient) {
      saveFilters(filters);
    }
  }, [filters, isClient]);

  // Filter and sort markets
  const filteredMarkets = useMemo(() => {
    if (!markets) return [];

    let result = [...markets];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(({ info }) => {
        const question = (info.question || '').toLowerCase();
        const description = (info.description || '').toLowerCase();
        return question.includes(searchLower) || description.includes(searchLower);
      });
    }

    // Apply state filter
    if (filters.states.length > 0) {
      result = result.filter(({ info }) =>
        filters.states.includes(info.state ?? MarketState.PROPOSED)
      );
    }

    // Calculate engagement scores for sorting
    const marketsWithScores = result.map(market => ({
      ...market,
      engagementScore: calculateEngagementScore(
        (market.info?.totalYesShares || 0n) + (market.info?.totalNoShares || 0n),
        market.info?.createdAt || 0n,
        market.info?.state || MarketState.PROPOSED
      ),
    }));

    // Apply sort
    switch (filters.sortBy) {
      case 'engagement':
        marketsWithScores.sort((a, b) => (b.engagementScore || 0) - (a.engagementScore || 0));
        break;
      case 'volume':
        marketsWithScores.sort((a, b) => {
          const volumeA = Number((a.info?.totalYesShares || 0n) + (a.info?.totalNoShares || 0n));
          const volumeB = Number((b.info?.totalYesShares || 0n) + (b.info?.totalNoShares || 0n));
          return volumeB - volumeA;
        });
        break;
      case 'newest':
        marketsWithScores.sort((a, b) => Number(b.info?.createdAt || 0n) - Number(a.info?.createdAt || 0n));
        break;
      case 'oldest':
        marketsWithScores.sort((a, b) => Number(a.info?.createdAt || 0n) - Number(b.info?.createdAt || 0n));
        break;
    }

    return marketsWithScores;
  }, [markets, filters]);

  return {
    filters,
    setFilters,
    filteredMarkets,
    totalCount: markets?.length || 0,
    filteredCount: filteredMarkets.length,
  };
}
