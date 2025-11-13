/**
 * KEKTECH 3.0 - Event Indexer
 * Listens to BasedAI blockchain events and indexes them to Supabase
 *
 * Events captured:
 * - MarketCreated (from MarketFactory)
 * - BetPlaced, BetResolved, MarketResolved (from PredictionMarket)
 * - StateTransition, MarketCancelled
 */

import 'dotenv/config';
import { ethers } from 'ethers';
import { logger } from '../../shared/utils/logger.js';
import {
  provider,
  marketFactory,
  getPredictionMarketContract,
  addresses,
} from '../../shared/config/contracts.js';
import {
  insertIndexedEvent,
  upsertMarketMetadata,
  getLastIndexedBlock,
} from '../../shared/utils/supabase.js';
import {
  connectRedis,
  disconnectRedis,
  publishMarketEvent,
} from '../../shared/utils/redis.js';

// Configuration
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL || '10000'); // 10 seconds
const INDEXER_BATCH_SIZE = parseInt(process.env.INDEXER_BATCH_SIZE || '100');
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES || '3');
const RETRY_DELAY = parseInt(process.env.RETRY_DELAY || '2000'); // 2 seconds

function normalizeCategory(value: unknown): string {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    if (value.startsWith('0x')) {
      try {
        return ethers.decodeBytes32String(value);
      } catch {
        return value.toLowerCase();
      }
    }
    return value;
  }

  try {
    const hexValue = ethers.hexlify(value as ethers.BytesLike);
    return normalizeCategory(hexValue);
  } catch {
    return '';
  }
}

class EventIndexer {
  private isRunning = false;
  private currentBlock: bigint = 0n;
  private latestBlock: bigint = 0n;

  async start() {
    if (this.isRunning) {
      logger.warn('Indexer already running');
      return;
    }

    this.isRunning = true;
    logger.info('🚀 Event Indexer starting...', {
      rpcUrl: process.env.RPC_HTTP_URL,
      marketFactory: addresses.marketFactory,
      pollInterval: POLL_INTERVAL,
      batchSize: INDEXER_BATCH_SIZE,
    });

    // Connect to Redis for pub/sub
    try {
      await connectRedis();
    } catch (error: any) {
      logger.error('Failed to connect to Redis', {
        error: error.message,
      });
      logger.warn('Continuing without Redis pub/sub - WebSocket updates disabled');
    }

    // Get last indexed block from database
    try {
      this.currentBlock = await getLastIndexedBlock();
      logger.info('Starting from block', {
        currentBlock: this.currentBlock.toString(),
      });
    } catch (error: any) {
      logger.error('Failed to get last indexed block', {
        error: error.message,
      });
      process.exit(1);
    }

    // Start indexing loop
    this.indexLoop();
  }

  private async indexLoop() {
    while (this.isRunning) {
      try {
        // Get latest block number
        this.latestBlock = BigInt(await provider.getBlockNumber());

        // Calculate blocks to process
        const blocksToProcess = this.latestBlock - this.currentBlock;

        if (blocksToProcess > 0n) {
          logger.info('Processing blocks', {
            from: this.currentBlock.toString(),
            to: this.latestBlock.toString(),
            count: blocksToProcess.toString(),
          });

          await this.processBlocks(this.currentBlock, this.latestBlock);
        } else {
          logger.debug('No new blocks to process', {
            currentBlock: this.currentBlock.toString(),
            latestBlock: this.latestBlock.toString(),
          });
        }

        // Wait before next poll
        await this.sleep(POLL_INTERVAL);
      } catch (error: any) {
        logger.error('Error in index loop', {
          error: error.message,
          stack: error.stack,
        });

        // Wait before retry
        await this.sleep(RETRY_DELAY);
      }
    }
  }

  private async processBlocks(fromBlock: bigint, toBlock: bigint) {
    // Process in batches to avoid overwhelming RPC
    let currentBatch = fromBlock;

    while (currentBatch < toBlock && this.isRunning) {
      const batchEnd = currentBatch + BigInt(INDEXER_BATCH_SIZE);
      const actualEnd = batchEnd > toBlock ? toBlock : batchEnd;

      await this.processBatch(currentBatch, actualEnd);

      // Update current block after successful batch
      this.currentBlock = actualEnd;
      currentBatch = actualEnd;
    }
  }

  private async processBatch(fromBlock: bigint, toBlock: bigint) {
    logger.info('Processing batch', {
      from: fromBlock.toString(),
      to: toBlock.toString(),
    });

    try {
      // Fetch MarketCreated events from MarketFactory
      await this.processMarketCreatedEvents(fromBlock, toBlock);

      // Note: We'll add more event types in future iterations
      // - BetPlaced, BetResolved, MarketResolved
      // - StateTransition, MarketCancelled

      logger.info('Batch processed successfully', {
        from: fromBlock.toString(),
        to: toBlock.toString(),
      });
    } catch (error: any) {
      logger.error('Failed to process batch', {
        error: error.message,
        from: fromBlock.toString(),
        to: toBlock.toString(),
      });
      throw error;
    }
  }

  private async processMarketCreatedEvents(
    fromBlock: bigint,
    toBlock: bigint
  ) {
    try {
      // Get MarketCreated events from MarketFactory
      const filter = marketFactory.filters.MarketCreated();
      const rawEvents = await marketFactory.queryFilter(
        filter,
        fromBlock,
        toBlock
      );

      // Filter to only EventLog instances (not plain Log)
      const events = rawEvents.filter(
        (e): e is ethers.EventLog => e instanceof ethers.EventLog
      );

      logger.info('MarketCreated events fetched', {
        count: events.length,
        from: fromBlock.toString(),
        to: toBlock.toString(),
      });

      // Process each event
      for (const event of events) {
        try {
          await this.handleMarketCreated(event);
        } catch (error: any) {
          logger.error('Failed to handle MarketCreated event', {
            error: error.message,
            txHash: event.transactionHash,
            blockNumber: event.blockNumber,
          });
          // Continue processing other events
        }
      }
    } catch (error: any) {
      logger.error('Failed to fetch MarketCreated events', {
        error: error.message,
        from: fromBlock.toString(),
        to: toBlock.toString(),
      });
      throw error;
    }
  }

  private async handleMarketCreated(event: ethers.EventLog) {
    const args = event.args as Record<string, any>;
    const marketAddress = (args?.marketAddress ?? args?.[0]) as string;
    const creator = (args?.creator ?? args?.[1]) as string;
    const question = (args?.question ?? args?.[2]) as string;
    const resolutionTimeRaw = (args?.resolutionTime ?? args?.[3]) as bigint;
    const creatorBondRaw = (args?.creatorBond ?? args?.[4]) as bigint;
    const categoryRaw = args?.category ?? args?.[5];
    const emittedTimestampRaw = (args?.timestamp ?? args?.[6]) as bigint;

    const resolutionTime = BigInt(resolutionTimeRaw ?? 0n);
    const creatorBond = BigInt(creatorBondRaw ?? 0n);
    const category = normalizeCategory(categoryRaw);
    const emittedTimestamp = BigInt(emittedTimestampRaw ?? 0n);
    const blockNumber = BigInt(event.blockNumber);

    const emittedAtIso =
      emittedTimestamp > 0n
        ? new Date(Number(emittedTimestamp) * 1000).toISOString()
        : new Date().toISOString();

    logger.info('MarketCreated event', {
      marketAddress,
      question,
      creator,
      blockNumber: event.blockNumber,
    });

    // Index event to database
    const eventPayload = {
      marketAddress,
      creator,
      question,
      resolutionTime: resolutionTime.toString(),
      creatorBond: creatorBond.toString(),
      category,
      blockNumber: event.blockNumber,
      timestamp: emittedTimestamp.toString(),
      emittedAt: emittedAtIso,
    };

    await insertIndexedEvent({
      eventType: 'MarketCreated',
      marketAddress,
      blockNumber,
      transactionHash: event.transactionHash,
      logIndex: event.index,
      eventData: eventPayload,
      timestamp: emittedAtIso,
    });

    // Fetch market state from contract
    const market = getPredictionMarketContract(marketAddress);
    let stateValue = 0;

    try {
      const stateResult = await market.getMarketState();

      if (Array.isArray(stateResult)) {
        stateValue = Number(stateResult[0] ?? 0);
      } else if (typeof stateResult === 'object' && stateResult !== null && 'state' in stateResult) {
        // Some contract bindings may return structs with a state property
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        stateValue = Number((stateResult as any).state ?? 0);
      } else {
        stateValue = Number(stateResult);
      }
    } catch (error: any) {
      logger.warn('Failed to fetch market state via getMarketState()', {
        error: error.message,
        marketAddress,
      });
    }

    // Upsert market metadata
    await upsertMarketMetadata({
      id: marketAddress,
      question,
      creator,
      state: stateValue,
      expiryTime: resolutionTime,
      description: '',
      createdAt: emittedAtIso,
      updatedAt: emittedAtIso,
    });

    // Publish to Redis for real-time WebSocket updates
    await publishMarketEvent('MarketCreated', marketAddress, {
      ...eventPayload,
      state: stateValue,
      transactionHash: event.transactionHash,
    });

    logger.info('Market indexed successfully', {
      marketAddress,
      question,
      state: stateValue,
    });
  }

  async stop() {
    logger.info('Stopping Event Indexer...');
    this.isRunning = false;
    await disconnectRedis();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Initialize and start indexer
const indexer = new EventIndexer();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  await indexer.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  await indexer.stop();
  process.exit(0);
});

// Start indexer
indexer.start().catch((error) => {
  logger.error('Fatal error starting indexer', {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});
