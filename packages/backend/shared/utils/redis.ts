/**
 * KEKTECH 3.0 - Redis Client
 * Pub/Sub client for real-time event broadcasting to WebSocket server
 */

import { createClient } from 'redis';
import { logger } from './logger.js';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;

// Create Redis client for publishing
export const redisPublisher = createClient({
  url: REDIS_URL,
  password: REDIS_PASSWORD,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        logger.error('Redis reconnection failed after 10 attempts');
        return new Error('Redis reconnection limit exceeded');
      }
      // Exponential backoff: 2^retries * 100ms, max 3 seconds
      return Math.min(Math.pow(2, retries) * 100, 3000);
    },
  },
});

// Connection event handlers
redisPublisher.on('connect', () => {
  logger.info('Redis publisher connecting');
});

redisPublisher.on('ready', () => {
  logger.info('Redis publisher ready');
});

redisPublisher.on('error', (error) => {
  logger.error('Redis publisher error', { error: error.message });
});

redisPublisher.on('reconnecting', () => {
  logger.warn('Redis publisher reconnecting');
});

// Connect to Redis
export async function connectRedis() {
  try {
    await redisPublisher.connect();
    logger.info('Redis publisher connected', { url: REDIS_URL });
  } catch (error: any) {
    logger.error('Failed to connect Redis publisher', {
      error: error.message,
    });
    throw error;
  }
}

// Graceful disconnect
export async function disconnectRedis() {
  try {
    await redisPublisher.quit();
    logger.info('Redis publisher disconnected');
  } catch (error: any) {
    logger.error('Failed to disconnect Redis publisher', {
      error: error.message,
    });
  }
}

function toSnakeCase(value: string) {
  return value.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
}

/**
 * Publish event to Redis channel
 * @param channel - Channel name (e.g., 'events:market_created', 'market:0x123')
 * @param data - Event data to publish
 */
export async function publishEvent(channel: string, data: any) {
  try {
    const message = JSON.stringify(data);
    await redisPublisher.publish(channel, message);
    logger.debug('Event published to Redis', {
      channel,
      dataSize: message.length,
    });
  } catch (error: any) {
    logger.error('Failed to publish event to Redis', {
      channel,
      error: error.message,
    });
    // Don't throw - event is already in database, Redis is optional
  }
}

/**
 * Publish market event to multiple channels
 * - Global channel: events:{eventType}
 * - Market-specific channel: market:{marketAddress}
 */
export async function publishMarketEvent(
  eventType: string,
  marketAddress: string | null,
  eventData: any
) {
  const eventTypeKey = toSnakeCase(eventType);
  const payload = {
    type: eventType,
    marketAddress,
    data: eventData,
    timestamp: new Date().toISOString(),
  };

  // Publish to global event channel
  await publishEvent(`events:${eventTypeKey}`, payload);

  // Publish to market-specific channel if applicable
  if (marketAddress) {
    await publishEvent(`market:${marketAddress.toLowerCase()}`, payload);
  }
}
