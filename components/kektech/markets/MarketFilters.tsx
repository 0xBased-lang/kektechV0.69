/**
 * KEKTECH 3.0 - Market Filters Component
 * Advanced filtering and sorting for markets
 */
'use client';

import { useState } from 'react';
import { Search, SlidersHorizontal, X, TrendingUp, Clock, DollarSign, Zap } from 'lucide-react';
import { MarketState } from '@/lib/contracts/types';

export type SortOption = 'engagement' | 'volume' | 'newest' | 'oldest';

export interface FilterState {
  search: string;
  sortBy: SortOption;
  states: MarketState[];
}

interface MarketFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  totalMarkets: number;
  filteredCount: number;
}

const SORT_OPTIONS: { value: SortOption; label: string; icon: typeof TrendingUp }[] = [
  { value: 'engagement', label: 'Engagement', icon: Zap },
  { value: 'volume', label: 'Volume', icon: DollarSign },
  { value: 'newest', label: 'Newest', icon: Clock },
  { value: 'oldest', label: 'Oldest', icon: Clock },
];

const STATE_OPTIONS: { value: MarketState; label: string; color: string }[] = [
  { value: MarketState.PROPOSED, label: 'Proposed', color: 'text-terminal-tertiary' },
  { value: MarketState.APPROVED, label: 'Approved', color: 'text-[#58a6ff]' },
  { value: MarketState.ACTIVE, label: 'Active', color: 'text-[#3fb950]' },
  { value: MarketState.RESOLVING, label: 'Resolving', color: 'text-[#d29922]' },
  { value: MarketState.DISPUTED, label: 'Disputed', color: 'text-[#f85149]' },
  { value: MarketState.FINALIZED, label: 'Finalized', color: 'text-[#bc8cff]' },
];

/**
 * Advanced market filtering component with search, sort, and state filters
 */
export function MarketFilters({
  filters,
  onFiltersChange,
  totalMarkets,
  filteredCount,
}: MarketFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Update search
  const handleSearchChange = (search: string) => {
    onFiltersChange({ ...filters, search });
  };

  // Update sort
  const handleSortChange = (sortBy: SortOption) => {
    onFiltersChange({ ...filters, sortBy });
  };

  // Toggle state filter
  const toggleState = (state: MarketState) => {
    const states = filters.states.includes(state)
      ? filters.states.filter(s => s !== state)
      : [...filters.states, state];
    onFiltersChange({ ...filters, states });
  };

  // Clear all filters
  const clearFilters = () => {
    onFiltersChange({
      search: '',
      sortBy: 'engagement',
      states: [],
    });
  };

  const hasActiveFilters = filters.search || filters.states.length > 0;

  return (
    <div className="space-y-3">
      {/* Search and Sort Bar */}
      <div className="flex items-center gap-2">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-terminal-tertiary" />
          <input
            type="text"
            placeholder="Search markets..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-terminal-card border border-terminal rounded-lg text-terminal-primary placeholder:text-terminal-tertiary focus:border-kek-green focus:outline-none transition text-sm"
          />
          {filters.search && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-terminal-elevated rounded transition"
            >
              <X className="w-3.5 h-3.5 text-terminal-tertiary" />
            </button>
          )}
        </div>

        {/* Advanced Filters Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`px-4 py-2.5 rounded-lg border transition flex items-center gap-2 text-sm font-medium ${
            showAdvanced || hasActiveFilters
              ? 'bg-kek-green/10 border-kek-green text-kek-green'
              : 'bg-terminal-card border-terminal text-terminal-secondary hover:border-kek-green/50'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">Filters</span>
          {hasActiveFilters && (
            <span className="w-2 h-2 bg-kek-green rounded-full" />
          )}
        </button>
      </div>

      {/* Advanced Filters Panel */}
      {showAdvanced && (
        <div className="p-4 bg-terminal-card border border-terminal rounded-lg space-y-4">
          {/* Sort Options */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-terminal-primary">Sort By</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SORT_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isActive = filters.sortBy === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => handleSortChange(option.value)}
                    className={`px-3 py-2 rounded-lg border transition flex items-center gap-2 text-sm font-medium ${
                      isActive
                        ? 'bg-kek-green/10 border-kek-green text-kek-green'
                        : 'bg-terminal-elevated border-terminal text-terminal-secondary hover:border-kek-green/50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* State Filters */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-terminal-primary">Market States</h3>
              {filters.states.length > 0 && (
                <button
                  onClick={() => onFiltersChange({ ...filters, states: [] })}
                  className="text-xs text-kek-green hover:text-kek-green/80 transition"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {STATE_OPTIONS.map((option) => {
                const isActive = filters.states.includes(option.value);
                return (
                  <button
                    key={option.value}
                    onClick={() => toggleState(option.value)}
                    className={`px-3 py-2 rounded-lg border transition text-sm font-medium ${
                      isActive
                        ? 'bg-terminal-elevated border-kek-green text-kek-green'
                        : `bg-terminal-elevated border-terminal ${option.color} hover:border-kek-green/50`
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Clear All Filters */}
          {hasActiveFilters && (
            <div className="pt-3 border-t border-terminal">
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 bg-terminal-elevated hover:bg-terminal-bg-hover border border-terminal rounded-lg text-terminal-secondary hover:text-kek-green transition text-sm font-medium flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-terminal-tertiary">
          Showing <span className="text-terminal-primary font-semibold mono-numbers">{filteredCount}</span> of{' '}
          <span className="text-terminal-primary font-semibold mono-numbers">{totalMarkets}</span> markets
        </p>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-kek-green hover:text-kek-green/80 transition"
          >
            Reset filters
          </button>
        )}
      </div>
    </div>
  );
}
