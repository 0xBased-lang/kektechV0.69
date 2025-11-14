/**
 * KEKTECH 3.0 - Feed Mode Toggle
 * Toggle between All Activity and Comments Only feed modes
 */
'use client';

import { useState, useEffect } from 'react';
import { Activity, MessageSquare } from 'lucide-react';

export type FeedMode = 'all' | 'comments';

interface FeedModeToggleProps {
  /** Current mode */
  mode: FeedMode;
  /** Callback when mode changes */
  onModeChange: (mode: FeedMode) => void;
  /** Optional CSS classes */
  className?: string;
}

/**
 * Toggle switch for feed mode
 * - All Activity: Shows bets, votes, resolutions, comments
 * - Comments Only: Shows only comment activity
 * - Saves user preference to localStorage
 */
export function FeedModeToggle({ mode, onModeChange, className = '' }: FeedModeToggleProps) {
  return (
    <div className={`flex items-center gap-2 p-1 bg-gray-900/50 rounded-lg border border-gray-800 ${className}`}>
      {/* All Activity Button */}
      <button
        onClick={() => onModeChange('all')}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all ${
          mode === 'all'
            ? 'bg-kek-green text-white shadow-lg shadow-kek-green/20'
            : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
        }`}
      >
        <Activity className="w-4 h-4" />
        <span className="hidden sm:inline">All Activity</span>
        <span className="sm:hidden">All</span>
      </button>

      {/* Comments Only Button */}
      <button
        onClick={() => onModeChange('comments')}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all ${
          mode === 'comments'
            ? 'bg-kek-green text-white shadow-lg shadow-kek-green/20'
            : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
        }`}
      >
        <MessageSquare className="w-4 h-4" />
        <span className="hidden sm:inline">Comments</span>
        <span className="sm:hidden">💬</span>
      </button>
    </div>
  );
}

/**
 * Hook to manage feed mode with localStorage persistence
 */
export function useFeedMode(): [FeedMode, (mode: FeedMode) => void] {
  const [mode, setMode] = useState<FeedMode>('all');

  // Load saved preference on mount
  useEffect(() => {
    const saved = localStorage.getItem('kektech-feed-mode');
    if (saved === 'all' || saved === 'comments') {
      setMode(saved);
    }
  }, []);

  // Save preference when it changes
  const handleModeChange = (newMode: FeedMode) => {
    setMode(newMode);
    localStorage.setItem('kektech-feed-mode', newMode);
  };

  return [mode, handleModeChange];
}
