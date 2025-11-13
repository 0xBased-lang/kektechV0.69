/**
 * KEKTECH 3.0 - WebSocket Server
 * Real-time event broadcasting to frontend clients via WebSocket
 *
 * Features:
 * - Redis pub/sub integration for event streaming
 * - Channel-based subscriptions (events:*, market:{address})
 * - Heartbeat/ping-pong for connection health
 * - Graceful reconnection handling
 */

import 'dotenv/config';
import { WebSocketServer, WebSocket } from 'ws';
import { createClient } from 'redis';
import { createServer } from 'http';
import { logger } from '../../shared/utils/logger.js';

// Configuration
const WS_PORT = parseInt(process.env.WS_PORT || '3180');
const WS_HOST = process.env.WS_HOST || '0.0.0.0';
const WS_PATH = process.env.WS_PATH || '/ws';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
const HEARTBEAT_INTERVAL = 30000; // 30 seconds

// Client connection interface
interface WSClient {
  ws: WebSocket;
  id: string;
  subscriptions: Set<string>;
  isAlive: boolean;
}

interface ChannelSubscription {
  clients: Set<string>;
  matcher: RegExp;
}

class WebSocketServerManager {
  private server: WebSocketServer;
  private httpServer;
  private redisSubscriber;
  private clients: Map<string, WSClient> = new Map();
  private channelClients: Map<string, ChannelSubscription> = new Map();
  private heartbeatInterval?: NodeJS.Timeout;

  constructor() {
    // Create HTTP server for WebSocket
    this.httpServer = createServer();

    // Create WebSocket server
    this.server = new WebSocketServer({
      server: this.httpServer,
      path: WS_PATH,
    });

    // Create Redis subscriber client
    this.redisSubscriber = createClient({
      url: REDIS_URL,
      password: REDIS_PASSWORD,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis subscriber reconnection failed after 10 attempts');
            return new Error('Redis reconnection limit exceeded');
          }
          return Math.min(Math.pow(2, retries) * 100, 3000);
        },
      },
    });

    this.setupEventHandlers();
  }

  private createMatcher(pattern: string): RegExp {
    const escaped = pattern
      .replace(/[-/\\^$+?.()|[\]{}]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    return new RegExp(`^${escaped}$`, 'i');
  }

  private setupEventHandlers() {
    // WebSocket server events
    this.server.on('connection', this.handleConnection.bind(this));
    this.server.on('error', (error) => {
      logger.error('WebSocket server error', { error: error.message });
    });

    // Redis subscriber events
    this.redisSubscriber.on('connect', () => {
      logger.info('Redis subscriber connecting');
    });

    this.redisSubscriber.on('ready', () => {
      logger.info('Redis subscriber ready');
    });

    this.redisSubscriber.on('error', (error) => {
      logger.error('Redis subscriber error', { error: error.message });
    });

    this.redisSubscriber.on('reconnecting', () => {
      logger.warn('Redis subscriber reconnecting');
    });
  }

  async start() {
    try {
      // Connect to Redis
      await this.redisSubscriber.connect();
      logger.info('Redis subscriber connected', { url: REDIS_URL });

      // Start HTTP server
      this.httpServer.listen(WS_PORT, WS_HOST, () => {
        logger.info('🚀 WebSocket Server started', {
          host: WS_HOST,
          port: WS_PORT,
          path: WS_PATH,
          url: `ws://${WS_HOST}:${WS_PORT}${WS_PATH}`,
        });
      });

      // Start heartbeat
      this.startHeartbeat();
    } catch (error: any) {
      logger.error('Failed to start WebSocket server', {
        error: error.message,
      });
      throw error;
    }
  }

  async stop() {
    logger.info('Stopping WebSocket Server...');

    // Stop heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Close all client connections
    this.clients.forEach((client) => {
      client.ws.close(1000, 'Server shutting down');
    });

    // Close WebSocket server
    this.server.close();

    // Close HTTP server
    this.httpServer.close();

    // Disconnect Redis
    await this.redisSubscriber.quit();

    logger.info('WebSocket Server stopped');
  }

  private handleConnection(ws: WebSocket) {
    const clientId = this.generateClientId();

    const client: WSClient = {
      ws,
      id: clientId,
      subscriptions: new Set(),
      isAlive: true,
    };

    this.clients.set(clientId, client);

    logger.info('Client connected', {
      clientId,
      totalClients: this.clients.size,
    });

    // Send welcome message
    this.send(ws, {
      type: 'connected',
      clientId,
      timestamp: new Date().toISOString(),
    });

    // Handle messages from client
    ws.on('message', (data) => {
      this.handleMessage(client, data);
    });

    // Handle pong responses
    ws.on('pong', () => {
      client.isAlive = true;
    });

    // Handle disconnection
    ws.on('close', () => {
      this.handleDisconnection(client);
    });

    // Handle errors
    ws.on('error', (error) => {
      logger.error('WebSocket client error', {
        clientId,
        error: error.message,
      });
    });
  }

  private handleMessage(client: WSClient, data: any) {
    try {
      const message = JSON.parse(data.toString());

      logger.debug('Message received', {
        clientId: client.id,
        type: message.type,
      });

      switch (message.type) {
        case 'subscribe':
          this.handleSubscribe(client, message.channel);
          break;

        case 'unsubscribe':
          this.handleUnsubscribe(client, message.channel);
          break;

        case 'ping':
          this.send(client.ws, { type: 'pong', timestamp: new Date().toISOString() });
          break;

        default:
          logger.warn('Unknown message type', {
            clientId: client.id,
            type: message.type,
          });
      }
    } catch (error: any) {
      logger.error('Failed to handle message', {
        clientId: client.id,
        error: error.message,
      });
    }
  }

  private async handleSubscribe(client: WSClient, channel: string) {
    if (!channel) {
      this.send(client.ws, {
        type: 'error',
        message: 'Channel is required',
      });
      return;
    }

    // Add to client's subscriptions
    client.subscriptions.add(channel);

    // Add client to channel's client list
    if (!this.channelClients.has(channel)) {
      this.channelClients.set(channel, {
        clients: new Set(),
        matcher: this.createMatcher(channel),
      });

      // Subscribe to Redis channel (pattern matching)
      await this.redisSubscriber.pSubscribe(channel, (message, messageChannel) => {
        this.broadcastToChannel(messageChannel, message);
      });

      logger.info('Subscribed to Redis channel', { channel });
    }

    this.channelClients.get(channel)!.clients.add(client.id);

    logger.info('Client subscribed to channel', {
      clientId: client.id,
      channel,
      channelClients: this.channelClients.get(channel)!.clients.size,
    });

    // Confirm subscription
    this.send(client.ws, {
      type: 'subscribed',
      channel,
      timestamp: new Date().toISOString(),
    });
  }

  private async handleUnsubscribe(client: WSClient, channel: string) {
    if (!channel) {
      return;
    }

    // Remove from client's subscriptions
    client.subscriptions.delete(channel);

    // Remove client from channel's client list
    const channelSubscription = this.channelClients.get(channel);
    if (channelSubscription) {
      channelSubscription.clients.delete(client.id);

      // If no more clients on this channel, unsubscribe from Redis
      if (channelSubscription.clients.size === 0) {
        this.channelClients.delete(channel);
        await this.redisSubscriber.pUnsubscribe(channel);
        logger.info('Unsubscribed from Redis channel', { channel });
      }
    }

    logger.info('Client unsubscribed from channel', {
      clientId: client.id,
      channel,
    });

    // Confirm unsubscription
    this.send(client.ws, {
      type: 'unsubscribed',
      channel,
      timestamp: new Date().toISOString(),
    });
  }

  private handleDisconnection(client: WSClient) {
    // Remove from all channels
    client.subscriptions.forEach(async (channel) => {
      const channelSubscription = this.channelClients.get(channel);
      if (channelSubscription) {
        channelSubscription.clients.delete(client.id);

        if (channelSubscription.clients.size === 0) {
          this.channelClients.delete(channel);
          await this.redisSubscriber.pUnsubscribe(channel);
        }
      }
    });

    // Remove from clients map
    this.clients.delete(client.id);

    logger.info('Client disconnected', {
      clientId: client.id,
      totalClients: this.clients.size,
    });
  }

  private broadcastToChannel(channel: string, message: string) {
    let parsed;
    try {
      parsed = JSON.parse(message);
    } catch {
      parsed = { data: message };
    }

    const payload = {
      type: 'event',
      channel,
      data: parsed,
      timestamp: new Date().toISOString(),
    };

    const deliveredClients = new Set<string>();
    let sentCount = 0;

    this.channelClients.forEach((subscription, pattern) => {
      if (!subscription.matcher.test(channel)) {
        return;
      }

      subscription.clients.forEach((clientId) => {
        if (deliveredClients.has(clientId)) {
          return;
        }

        const client = this.clients.get(clientId);
        if (client && client.ws.readyState === WebSocket.OPEN) {
          this.send(client.ws, payload);
          deliveredClients.add(clientId);
          sentCount++;
        }
      });
    });

    logger.debug('Broadcast to channel', {
      channel,
      clients: sentCount,
    });
  }

  private send(ws: WebSocket, data: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach((client) => {
        if (!client.isAlive) {
          logger.warn('Client failed heartbeat, terminating', {
            clientId: client.id,
          });
          client.ws.terminate();
          return;
        }

        client.isAlive = false;
        client.ws.ping();
      });
    }, HEARTBEAT_INTERVAL);

    logger.info('Heartbeat started', {
      interval: HEARTBEAT_INTERVAL,
    });
  }

  private generateClientId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Initialize and start server
const wsServer = new WebSocketServerManager();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  await wsServer.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  await wsServer.stop();
  process.exit(0);
});

// Start server
wsServer.start().catch((error) => {
  logger.error('Fatal error starting WebSocket server', {
    error: error.message,
  });
  process.exit(1);
});
