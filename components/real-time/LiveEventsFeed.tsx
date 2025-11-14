'use client';

/**
 * KEKTECH 3.0 - Live Events Feed Component
 * Displays real-time events from WebSocket connection
 *
 * Features:
 * - Auto-connects to WebSocket server
 * - Displays latest events with animation
 * - Connection status indicator
 * - Manual reconnection
 * - Event filtering by type
 */

import React, { useEffect } from 'react';
import { useKektechWebSocket, MarketEvent } from '@/lib/hooks/useKektechWebSocket';
import { formatDistanceToNow } from 'date-fns';
import { Activity, AlertCircle, CheckCircle2, RefreshCw, Wifi, WifiOff } from 'lucide-react';

export interface LiveEventsFeedProps {
  /** Market address to filter events (optional) */
  marketAddress?: string;
  /** Subscribe to all events */
  subscribeToAll?: boolean;
  /** Maximum events to display */
  maxEvents?: number;
  /** Enable debug logging */
  debug?: boolean;
  /** Custom className */
  className?: string;
}

export function LiveEventsFeed({
  marketAddress,
  subscribeToAll = true,
  maxEvents = 10,
  debug = false,
  className = '',
}: LiveEventsFeedProps) {
  const { connected, events, error, reconnectAttempts, reconnect } = useKektechWebSocket({
    marketAddress,
    subscribeToAll,
    debug,
  });

  // Log events for debugging
  useEffect(() => {
    if (debug && events.length > 0) {
      console.log('[LiveEventsFeed] New event:', events[0]);
    }
  }, [events, debug]);

  const displayedEvents = events.slice(0, maxEvents);

  return (
    <div className={`rounded-lg border bg-card p-4 ${className}`}>
      {/* Header with connection status */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Live Updates</h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Connection status */}
          {connected ? (
            <div className="flex items-center gap-1 text-sm text-green-600">
              <Wifi className="h-4 w-4" />
              <span>Connected</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-sm text-red-600">
              <WifiOff className="h-4 w-4" />
              <span>
                {reconnectAttempts > 0 ? `Reconnecting (${reconnectAttempts})...` : 'Disconnected'}
              </span>
            </div>
          )}

          {/* Reconnect button */}
          {!connected && (
            <button
              onClick={reconnect}
              className="rounded p-1 hover:bg-accent"
              title="Reconnect"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-300">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div>
              <p className="font-medium">Connection Error</p>
              <p className="text-xs opacity-90">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Events list */}
      <div className="space-y-2">
        {displayedEvents.length === 0 ? (
          <div className="rounded-md bg-muted p-6 text-center text-sm text-muted-foreground">
            <Activity className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p>Waiting for events...</p>
            {!connected && <p className="mt-1 text-xs">Not connected to event stream</p>}
          </div>
        ) : (
          displayedEvents.map((event, index) => (
            <EventCard key={`${event.transactionHash || event.timestamp}-${index}`} event={event} />
          ))
        )}
      </div>

      {/* Footer with event count */}
      {events.length > maxEvents && (
        <div className="mt-4 text-center text-xs text-muted-foreground">
          Showing {maxEvents} of {events.length} events
        </div>
      )}
    </div>
  );
}

/**
 * Individual event card component
 */
function EventCard({ event }: { event: MarketEvent }) {
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'MarketCreated':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'BetPlaced':
        return <Activity className="h-4 w-4 text-blue-600" />;
      case 'MarketResolved':
        return <CheckCircle2 className="h-4 w-4 text-purple-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getEventLabel = (type: string) => {
    switch (type) {
      case 'MarketCreated':
        return 'New Market';
      case 'BetPlaced':
        return 'Bet Placed';
      case 'MarketResolved':
        return 'Market Resolved';
      default:
        return type;
    }
  };

  const truncateAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const timestamp = event.timestamp ? new Date(event.timestamp) : new Date();
  const eventQuestion = typeof event.data?.question === 'string' ? event.data.question : undefined;

  return (
    <div className="group rounded-md border bg-card p-3 transition-all hover:bg-accent/50">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="mt-0.5 flex-shrink-0">{getEventIcon(event.type)}</div>

        {/* Content */}
        <div className="flex-1 space-y-1">
          {/* Event type and time */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{getEventLabel(event.type)}</span>
            <span className="text-xs text-muted-foreground" title={timestamp.toISOString()}>
              {formatDistanceToNow(timestamp, { addSuffix: true })}
            </span>
          </div>

          {/* Event details */}
          {eventQuestion && (
            <p className="text-sm text-muted-foreground">{eventQuestion}</p>
          )}

          {/* Market address */}
          {event.marketAddress && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Market:</span>
              <code className="rounded bg-muted px-1 py-0.5 font-mono">
                {truncateAddress(event.marketAddress)}
              </code>
            </div>
          )}

          {/* Transaction hash */}
          {event.transactionHash && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Tx:</span>
              <a
                href={`https://explorer.basedai.network/tx/${event.transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-primary hover:underline"
              >
                {truncateAddress(event.transactionHash)}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
