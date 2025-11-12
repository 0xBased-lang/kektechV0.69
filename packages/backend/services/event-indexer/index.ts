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
  updateMarketState,
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
    const marketAddress = event.args![0] as string;
    const creator = event.args![1] as string;
    const question = event.args![2] as string;
    const description = event.args![3] as string;
    const expiryTime = event.args![4] as bigint;

    logger.info('MarketCreated event', {
      marketAddress,
      question,
      creator,
      blockNumber: event.blockNumber,
    });

    // Index event to database
    await insertIndexedEvent({
      eventType: 'MarketCreated',
      marketAddress,
      blockNumber: BigInt(event.blockNumber),
      transactionHash: event.transactionHash,
      logIndex: event.index,
      eventData: {
        marketAddress,
        creator,
        question,
        description,
        expiryTime: expiryTime.toString(),
      },
    });

    // Fetch market state from contract
    const market = getPredictionMarketContract(marketAddress);
    const state = await market.state();

    // Upsert market metadata
    await upsertMarketMetadata({
      id: marketAddress,
      question,
      description,
      creator,
      state: Number(state),
      expiryTime,
    });

    // Publish to Redis for real-time WebSocket updates
    await publishMarketEvent('MarketCreated', marketAddress, {
      marketAddress,
      creator,
      question,
      description,
      expiryTime: expiryTime.toString(),
      state: Number(state),
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash,
    });

    logger.info('Market indexed successfully', {
      marketAddress,
      question,
      state: Number(state),
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
