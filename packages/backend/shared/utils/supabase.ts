/**
 * KEKTECH 3.0 - Supabase Client
 * Database client for Event Indexer to write blockchain events
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { logger } from './logger.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing required Supabase credentials. Check .env file.');
}

// Create Supabase client with service role key
// This bypasses Row Level Security (RLS) for backend operations
export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

logger.info('Supabase client initialized', {
  url: SUPABASE_URL,
});

// Helper: Insert indexed event
export async function insertIndexedEvent(event: {
  eventType: string;
  marketAddress: string | null;
  blockNumber: bigint;
  transactionHash: string;
  logIndex: number;
  eventData: any;
  timestamp?: string;
}) {
  try {
    const payload = {
      id: randomUUID(),
      eventType: event.eventType,
      marketAddress: event.marketAddress,
      blockNumber: event.blockNumber.toString(), // Convert BigInt to string
      transactionHash: event.transactionHash,
      logIndex: event.logIndex,
      eventData: event.eventData,
      processed: false,
      timestamp: event.timestamp ?? new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('IndexedEvent')
      .insert(payload)
      .select()
      .single();

    if (error) {
      // Check if it's a duplicate (unique constraint violation)
      if (error.code === '23505') {
        logger.debug('Duplicate event skipped', {
          txHash: event.transactionHash,
          logIndex: event.logIndex,
        });
        return null; // Silently skip duplicates
      }
      throw error;
    }

    logger.debug('Event indexed', {
      eventType: event.eventType,
      marketAddress: event.marketAddress,
      blockNumber: event.blockNumber.toString(),
      txHash: event.transactionHash,
    });

    return data;
  } catch (error: any) {
    logger.error('Failed to insert indexed event', {
      error: error.message,
      event,
    });
    throw error;
  }
}

// Helper: Upsert market metadata
export async function upsertMarketMetadata(metadata: {
  id: string; // Market address
  question: string;
  description?: string;
  creator: string;
  state: number;
  expiryTime: bigint;
  createdAt?: string;
  updatedAt?: string;
}) {
  try {
    const nowIso = metadata.updatedAt ?? new Date().toISOString();
    const payload: Record<string, any> = {
      id: metadata.id,
      question: metadata.question,
      description: metadata.description || '',
      creator: metadata.creator,
      state: metadata.state,
      expiryTime: metadata.expiryTime.toString(),
      updatedAt: nowIso,
    };

    if (metadata.createdAt) {
      payload.createdAt = metadata.createdAt;
    }

    const { data, error } = await supabase
      .from('MarketMetadata')
      .upsert(
        payload,
        {
          onConflict: 'id', // Update if market already exists
        }
      )
      .select()
      .single();

    if (error) throw error;

    logger.debug('Market metadata upserted', {
      marketAddress: metadata.id,
      question: metadata.question,
      state: metadata.state,
    });

    return data;
  } catch (error: any) {
    logger.error('Failed to upsert market metadata', {
      error: error.message,
      metadata,
    });
    throw error;
  }
}

// Helper: Update market state
export async function updateMarketState(
  marketAddress: string,
  state: number
) {
  try {
    const { data, error } = await supabase
      .from('MarketMetadata')
      .update({ state })
      .eq('id', marketAddress)
      .select()
      .single();

    if (error) throw error;

    logger.debug('Market state updated', {
      marketAddress,
      newState: state,
    });

    return data;
  } catch (error: any) {
    logger.error('Failed to update market state', {
      error: error.message,
      marketAddress,
      state,
    });
    throw error;
  }
}

// Helper: Get last indexed block
export async function getLastIndexedBlock(): Promise<bigint> {
  try {
    const { data, error } = await supabase
      .from('IndexedEvent')
      .select('blockNumber')
      .order('blockNumber', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found - return start block from env
        const startBlock = BigInt(process.env.START_BLOCK || '0');
        logger.info('No indexed events found, starting from block', {
          startBlock: startBlock.toString(),
        });
        return startBlock;
      }
      throw error;
    }

    const lastBlock = BigInt(data.blockNumber);
    logger.info('Last indexed block retrieved', {
      blockNumber: lastBlock.toString(),
    });
    return lastBlock;
  } catch (error: any) {
    logger.error('Failed to get last indexed block', {
      error: error.message,
    });
    throw error;
  }
}

export default supabase;
