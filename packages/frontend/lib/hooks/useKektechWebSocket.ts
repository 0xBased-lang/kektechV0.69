/**
 * KEKTECH 3.0 - WebSocket Hook
 * Real-time event updates from VPS backend
 *
 * Features:
 * - Auto-reconnection with exponential backoff
 * - Channel-based subscriptions (events:*, market:{address})
 * - Event buffering and de-duplication
 * - Connection status tracking
 * - Heartbeat monitoring
 */

import { useEffect, useState, useRef, useCallback } from 'react';

// Environment variable for WebSocket URL
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3180/ws';

export interface MarketEvent {
  type: 'MarketCreated' | 'BetPlaced' | 'MarketResolved' | string;
  marketAddress: string;
  data: any;
  timestamp: string;
  blockNumber?: number;
  transactionHash?: string;
}

export interface WebSocketMessage {
  type: 'welcome' | 'subscribed' | 'event' | 'error' | 'pong';
  message?: string;
  channel?: string;
  data?: MarketEvent;
}

export interface UseKektechWebSocketOptions {
  /** Market address to subscribe to (optional) */
  marketAddress?: string;
  /** Subscribe to all events */
  subscribeToAll?: boolean;
  /** Auto-reconnect on disconnect */
  autoReconnect?: boolean;
  /** Max reconnection attempts (default: 5) */
  maxReconnectAttempts?: number;
  /** Initial reconnect delay in ms (default: 1000) */
  reconnectDelay?: number;
  /** Enable debug logging */
  debug?: boolean;
}

export interface UseKektechWebSocketReturn {
  /** WebSocket connection status */
  connected: boolean;
  /** Latest events received */
  events: MarketEvent[];
  /** Connection error message */
  error: string | null;
  /** Reconnection attempt count */
  reconnectAttempts: number;
  /** Manually trigger reconnection */
  reconnect: () => void;
  /** Clear events buffer */
  clearEvents: () => void;
}

/**
 * Custom hook for real-time WebSocket updates from KEKTECH backend
 *
 * @example
 * // Subscribe to all events
 * const { connected, events } = useKektechWebSocket({ subscribeToAll: true });
 *
 * @example
 * // Subscribe to specific market
 * const { connected, events } = useKektechWebSocket({
 *   marketAddress: '0x123...',
 * });
 */
export function useKektechWebSocket(
  options: UseKektechWebSocketOptions = {}
): UseKektechWebSocketReturn {
  const {
    marketAddress,
    subscribeToAll = false,
    autoReconnect = true,
    maxReconnectAttempts = 5,
    reconnectDelay: initialReconnectDelay = 1000,
    debug = false,
  } = options;

  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<MarketEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectDelayRef = useRef(initialReconnectDelay);
  const eventIdsRef = useRef(new Set<string>()); // De-duplication

  const log = useCallback(
    (...args: any[]) => {
      if (debug) {
        console.log('[useKektechWebSocket]', ...args);
      }
    },
    [debug]
  );

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const clearHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  const setupHeartbeat = useCallback((ws: WebSocket) => {
    clearHeartbeat();
    heartbeatIntervalRef.current = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
        log('Sent heartbeat ping');
      }
    }, 30000); // 30 seconds
  }, [clearHeartbeat, log]);

  const subscribe = useCallback(
    (ws: WebSocket) => {
      // Subscribe to all market events
      if (subscribeToAll) {
        ws.send(JSON.stringify({ type: 'subscribe', channel: 'events:*' }));
        log('Subscribed to events:*');
      }

      // Subscribe to specific market
      if (marketAddress) {
        const channel = `market:${marketAddress.toLowerCase()}`;
        ws.send(JSON.stringify({ type: 'subscribe', channel }));
        log(`Subscribed to ${channel}`);
      }
    },
    [subscribeToAll, marketAddress, log]
  );

  const connect = useCallback(() => {
    try {
      log(`Connecting to ${WS_URL}...`);
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        log('Connected!');
        setConnected(true);
        setError(null);
        setReconnectAttempts(0);
        reconnectDelayRef.current = initialReconnectDelay;

        // Subscribe to channels
        subscribe(ws);

        // Setup heartbeat
        setupHeartbeat(ws);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          log('Received message:', message);

          switch (message.type) {
            case 'welcome':
              log('Welcome message:', message.message);
              break;

            case 'subscribed':
              log('Subscription confirmed:', message.channel);
              break;

            case 'event':
              if (message.data) {
                // De-duplicate events using transaction hash or unique ID
                const eventId =
                  message.data.transactionHash ||
                  `${message.data.type}-${message.data.marketAddress}-${message.data.timestamp}`;

                if (!eventIdsRef.current.has(eventId)) {
                  eventIdsRef.current.add(eventId);
                  setEvents((prev) => [message.data!, ...prev].slice(0, 100)); // Keep last 100 events
                  log('New event:', message.data);
                }
              }
              break;

            case 'pong':
              log('Heartbeat pong received');
              break;

            case 'error':
              console.error('[WebSocket Error]', message.message);
              setError(message.message || 'Unknown error');
              break;

            default:
              log('Unknown message type:', message.type);
          }
        } catch (err) {
          console.error('[WebSocket Parse Error]', err);
        }
      };

      ws.onerror = (event) => {
        console.error('[WebSocket Error Event]', event);
        setError('Connection error');
      };

      ws.onclose = (event) => {
        log('Disconnected:', event.code, event.reason);
        setConnected(false);
        clearHeartbeat();

        // Auto-reconnect logic
        if (autoReconnect && reconnectAttempts < maxReconnectAttempts) {
          clearReconnectTimeout();
          const delay = reconnectDelayRef.current;
          log(`Reconnecting in ${delay}ms... (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts((prev) => prev + 1);
            reconnectDelayRef.current = Math.min(delay * 2, 30000); // Max 30s
            connect();
          }, delay);
        } else if (reconnectAttempts >= maxReconnectAttempts) {
          setError('Max reconnection attempts reached');
          log('Max reconnection attempts reached');
        }
      };
    } catch (err) {
      console.error('[WebSocket Connection Error]', err);
      setError('Failed to connect');
    }
  }, [
    autoReconnect,
    maxReconnectAttempts,
    reconnectAttempts,
    initialReconnectDelay,
    subscribe,
    setupHeartbeat,
    clearHeartbeat,
    clearReconnectTimeout,
    log,
  ]);

  const disconnect = useCallback(() => {
    log('Disconnecting...');
    clearReconnectTimeout();
    clearHeartbeat();
    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnect');
      wsRef.current = null;
    }
    setConnected(false);
  }, [clearReconnectTimeout, clearHeartbeat, log]);

  const reconnect = useCallback(() => {
    log('Manual reconnect requested');
    disconnect();
    setReconnectAttempts(0);
    reconnectDelayRef.current = initialReconnectDelay;
    connect();
  }, [disconnect, connect, initialReconnectDelay, log]);

  const clearEvents = useCallback(() => {
    log('Clearing events buffer');
    setEvents([]);
    eventIdsRef.current.clear();
  }, [log]);

  // Connect on mount
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marketAddress, subscribeToAll]); // Reconnect when subscriptions change

  return {
    connected,
    events,
    error,
    reconnectAttempts,
    reconnect,
    clearEvents,
  };
}
