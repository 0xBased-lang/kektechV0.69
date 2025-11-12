# KEKTECH 3.0 Backend

Event Indexer and WebSocket Server for BasedAI blockchain integration.

## Overview

This backend service indexes blockchain events from the BasedAI mainnet and provides real-time updates to the frontend via WebSocket.

### Architecture

```
BasedAI Blockchain → Event Indexer → Supabase PostgreSQL
                                   ↓
                              Redis Pub/Sub
                                   ↓
                           WebSocket Server → Frontend
```

## Current Status

**Phase 1 Complete**: Event Indexer Implementation ✅
- ✅ Project structure created
- ✅ Dependencies installed
- ✅ Contract ABIs copied
- ✅ Environment configuration
- ✅ Prisma schema updated (IndexedEvent table)
- ✅ Event Indexer service implemented
- ⏳ Local testing (Phase 2)
- ⏳ VPS deployment (Phase 3-4)
- ⏳ WebSocket server (Phase 5-6)

## Services

### 1. Event Indexer (Current)
**Status**: Implemented, ready for testing
**Purpose**: Listens to BasedAI blockchain and indexes events to Supabase

**Events Captured**:
- `MarketCreated` - New prediction markets

**Features**:
- HTTP polling-based (10-second intervals)
- Batch processing (100 blocks per batch)
- Automatic retry with exponential backoff
- Graceful shutdown handling
- Duplicate event prevention (unique constraint)
- Checkpoint system (resumes from last processed block)

### 2. WebSocket Server (Phase 5)
**Status**: Not implemented yet
**Purpose**: Real-time event broadcast to frontend clients

## Setup

### Prerequisites
- Node.js v20+
- Redis (for WebSocket server)
- Supabase account with database access
- BasedAI RPC access

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Fill in .env values:
# - SUPABASE_SERVICE_ROLE_KEY (from Supabase dashboard → Settings → API)
# - Contract addresses (from frontend .env.local)
# - Other configurations

# Build TypeScript
npm run build
```

### Local Development

```bash
# Run Event Indexer in dev mode (with hot reload)
npm run dev:indexer

# Build for production
npm run build

# Run in production mode
npm run start:indexer
```

### Testing

1. **Local Testing** (after Prisma migrations):
   ```bash
   cd ../../../packages/frontend
   npx prisma generate
   npx prisma migrate deploy

   cd ../../backend_VPS_contabo/kektechv0.69_vps_transition/kektech-backend
   npm run dev:indexer
   ```

2. **Verify**:
   - Check logs for "Event Indexer starting..."
   - Check Supabase IndexedEvent table for new rows
   - Check MarketMetadata table for market data

## Deployment

### VPS Deployment (Hybrid Approach)

**Phase 1-2**: Local development and testing ✅ CURRENT
**Phase 3**: VPS preparation (Redis, directories)
**Phase 4**: Deploy Event Indexer to VPS
**Phase 5**: Implement WebSocket Server
**Phase 6**: Deploy WebSocket Server to VPS

### PM2 Deployment

```bash
# On VPS
cd /var/www/kektech/backend
npm install --production
npm run build

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Enable auto-start on reboot

# Monitor
pm2 logs kektech-event-indexer
pm2 monit
```

## Environment Variables

See `.env.example` for full list. Required variables:

```bash
# Supabase (same instance as frontend)
DATABASE_URL=postgresql://...
SUPABASE_URL=https://cvablivsycsejtmlbheo.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Blockchain
CHAIN_ID=32323
RPC_HTTP_URL=https://mainnet.basedaibridge.com/rpc/

# Contracts
MARKET_FACTORY_ADDRESS=0x3eaF643482Fe35d13DB812946E14F5345eb60d62
PREDICTION_MARKET_TEMPLATE=0x1064f1FCeE5aA859468559eB9dC9564F0ef20111

# Indexer
START_BLOCK=2587591  # MarketFactory deployment block
INDEXER_BATCH_SIZE=100
POLL_INTERVAL=10000
```

## File Structure

```
kektech-backend/
├── services/
│   ├── event-indexer/
│   │   └── index.ts              # Main indexer service
│   └── websocket-server/         # Phase 5
│
├── shared/
│   ├── abis/
│   │   ├── MarketFactory.json    # Contract ABIs
│   │   └── PredictionMarket.json
│   ├── config/
│   │   └── contracts.ts          # Contract instances
│   └── utils/
│       ├── logger.ts             # Winston logger
│       └── supabase.ts           # Supabase client
│
├── logs/                          # Log files
├── dist/                          # Compiled JavaScript
├── .env                           # Environment variables
├── ecosystem.config.js            # PM2 configuration
├── package.json
├── tsconfig.json
└── README.md
```

## Troubleshooting

### Event Indexer Not Starting

1. Check `.env` has all required values
2. Verify SUPABASE_SERVICE_ROLE_KEY is set
3. Check RPC connectivity: `curl https://mainnet.basedaibridge.com/rpc/`
4. Check logs: `cat logs/error.log`

### No Events Being Indexed

1. Check START_BLOCK is correct (2587591 for MarketFactory)
2. Verify MarketFactory address is correct
3. Check RPC provider is responding: `pm2 logs kektech-event-indexer`
4. Query Supabase IndexedEvent table directly

### High Memory Usage

- Event Indexer should use <500MB RAM
- If higher, check INDEXER_BATCH_SIZE (reduce if needed)
- Check for memory leaks in logs

### Market Data Not Loading (FIXED 2025-11-10)

**Symptom**: Frontend shows "No markets available" despite 7 markets existing on blockchain.

**Root Cause**: Event indexer had 5 separate issues preventing market data from being indexed.

#### Fix 1: Contract Address Correction
**Problem**: Using proxy address instead of implementation contract address.

**File**: VPS `/var/www/kektech/backend/.env`

```bash
# Before (WRONG - proxy address):
MARKET_FACTORY_ADDRESS=0x3eaF643482Fe35d13DB812946E14F5345eb60d62

# After (CORRECT - implementation address):
MARKET_FACTORY_ADDRESS=0x169b4019fc12c5bd43bfa5d830fd01a678df6a15
START_BLOCK=2588248  # Block when first market was created
```

#### Fix 2: BigInt Serialization
**Problem**: BigInt values cannot be serialized to JSON.

**File**: VPS `/var/www/kektech/backend/services/event-indexer/index.ts`

```typescript
// Convert all BigInt values to strings before JSON serialization
eventData: {
  marketAddress,
  creator,
  question,
  resolutionTime: resolutionTime.toString(),  // BigInt → string
  creatorBond: creatorBond.toString(),        // BigInt → string
  category,
  timestamp: timestamp.toString(),            // BigInt → string
}
```

#### Fix 3: UUID Generation for Database Records
**Problem**: Database requires `id` field but wasn't auto-generating.

**File**: VPS `/var/www/kektech/backend/shared/utils/supabase.ts`

```typescript
import { randomUUID } from 'crypto';

// Add UUID when inserting events
await supabase.from('IndexedEvent').insert({
  id: randomUUID(),  // Generate unique ID
  eventType: event.eventType,
  // ... rest of fields
});
```

#### Fix 4: Incorrect Contract Function Name
**Problem**: Called non-existent `state()` function instead of `getMarketState()`.

**File**: VPS `/var/www/kektech/backend/services/event-indexer/index.ts`

```typescript
// Before (WRONG):
const state = await market.state();

// After (CORRECT):
const state = await market.getMarketState();
```

#### Fix 5: Missing Database Timestamps
**Problem**: MarketMetadata table requires `createdAt` and `updatedAt` fields.

**File**: VPS `/var/www/kektech/backend/shared/utils/supabase.ts`

```typescript
await supabase.from('MarketMetadata').upsert({
  id: metadata.id,
  question: metadata.question,
  // ... other fields
  createdAt: new Date().toISOString(),   // Add timestamp
  updatedAt: new Date().toISOString(),   // Add timestamp
});
```

#### Verification
After all 5 fixes were applied:
- ✅ Event indexer successfully detected 7 markets
- ✅ All events stored in `IndexedEvent` table
- ✅ All markets stored in `MarketMetadata` table
- ✅ Frontend now displays all 7 markets correctly

**Check Status**:
```bash
ssh kek
pm2 logs kektech-event-indexer | grep "Market indexed successfully"
# Should show 7 markets indexed
```

## Next Steps

1. **Complete Phase 2**: Local testing with Prisma migrations
2. **Get Supabase Service Role Key**: Required for backend to write to DB
3. **Test Event Indexer**: Verify events are being captured
4. **Deploy to VPS**: Follow Phase 3-4 in deployment plan
5. **Implement WebSocket**: Phase 5-6 for real-time updates

## Links

- **Main Repo**: `/Users/seman/Desktop/kektechV0.69`
- **Deployment Guide**: `../VPS_DEPLOYMENT_GUIDE.md`
- **Prisma Schema**: `../../packages/frontend/prisma/schema.prisma`
- **Frontend .env**: `../../packages/frontend/.env.local`

## Support

- Check logs: `pm2 logs` or `cat logs/combined.log`
- VPS access: `ssh kek`
- Supabase dashboard: https://app.supabase.com

---

**Last Updated**: 2025-11-11
**Status**: Phase 1 Complete, Market Data Issue Resolved, 7 Markets Indexed ✅
