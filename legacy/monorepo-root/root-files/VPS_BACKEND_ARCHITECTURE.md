# 🖥️ VPS Backend Architecture

**Last Updated**: 2025-11-10
**Status**: Production Operational

---

## Overview

The KEKTECH backend runs on a VPS and provides real-time event indexing and WebSocket broadcasting for the prediction markets platform.

**Key Services**:
- Event Indexer: Monitors BasedAI blockchain for smart contract events
- WebSocket Server: Broadcasts real-time events to frontend clients
- Redis Pub/Sub: Message broker between services
- Nginx: Reverse proxy with SSL/TLS termination

---

## Architecture

```
BasedAI Mainnet (Chain 32323)
        ↓
   Event Indexer (PM2)
        ↓
   Redis Pub/Sub
        ↓
   WebSocket Server (PM2)
        ↓
   Nginx (SSL/TLS)
        ↓
   Frontend (wss://ws.kektech.xyz/ws)
```

---

## Services

### 1. Event Indexer
**Technology**: Node.js + TypeScript + ethers.js
**Purpose**: Monitors blockchain events and indexes to database
**Process Manager**: PM2
**Configuration**: See backend repository for details

**Events Monitored**:
- MarketCreated
- BetPlaced
- MarketResolved
- ProposalApproved
- Resolution events

**Data Flow**:
1. Polls BasedAI RPC for new blocks
2. Filters for KEKTECH contract events
3. Parses event data
4. Stores in Supabase database
5. Publishes to Redis channels

### 2. WebSocket Server
**Technology**: Node.js + TypeScript + ws library
**Purpose**: Real-time event broadcasting to clients
**Process Manager**: PM2
**Port**: Internal only, accessed via Nginx

**Features**:
- Pattern-based subscriptions (`events:*`, `market:0x123...`)
- Automatic reconnection support
- Heartbeat monitoring (30-second intervals)
- Event buffering and deduplication

**Client Protocol**:
```typescript
// Subscribe to all events
{ type: "subscribe", channel: "events:*" }

// Subscribe to specific market
{ type: "subscribe", channel: "market:0x31d2BC..." }

// Event received
{
  type: "event",
  data: {
    eventType: "MarketCreated",
    marketAddress: "0x123...",
    timestamp: "2025-11-10T12:00:00Z",
    ...
  }
}
```

### 3. Redis Pub/Sub
**Technology**: Redis 7.x
**Purpose**: Decouples indexer from WebSocket server

**Channels**:
- `events:market_created`
- `events:bet_placed`
- `events:market_resolved`
- `events:proposal_approved`

**Benefits**:
- Services can restart independently
- Horizontal scaling possible
- Event replay capabilities

### 4. Nginx Reverse Proxy
**Configuration**: See infrastructure repository
**Features**:
- SSL/TLS termination (Let's Encrypt)
- HTTP/2 support
- WebSocket upgrade handling
- Rate limiting (10 req/s per IP)
- Compression
- Security headers

---

## Access & Management

### VPS Access
Access requires SSH key authentication. Contact DevOps team for access.

### Service Management
```bash
# Check all services
pm2 status

# View logs
pm2 logs kektech-event-indexer --lines 100
pm2 logs kektech-websocket-server --lines 100

# Restart services
pm2 restart kektech-event-indexer
pm2 restart kektech-websocket-server

# Reload Nginx
sudo systemctl reload nginx
```

### Monitoring
```bash
# Check WebSocket connections
pm2 logs kektech-websocket-server | grep "Client connected"

# Check Redis
redis-cli ping  # Should return "PONG"
redis-cli MONITOR  # Watch pub/sub traffic

# Check Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Check SSL certificate
sudo certbot certificates
```

---

## Environment Variables

Backend services require these environment variables (stored securely on VPS):

```bash
# Database
DATABASE_URL="[PostgreSQL connection string]"
SUPABASE_URL="[Supabase project URL]"
SUPABASE_SERVICE_ROLE_KEY="[Service role key - SECRET]"

# Blockchain
RPC_PROVIDER_URL="https://mainnet.basedaibridge.com/rpc/"
CHAIN_ID="32323"

# Contract Addresses
MARKET_FACTORY_ADDRESS="0x3eaF643482Fe35d13DB812946E14F5345eb60d62"
# ... other contract addresses

# Redis
REDIS_URL="redis://localhost:6379"
```

⚠️ **NEVER commit actual values to git!**

---

## Deployment

### Initial Setup
1. Provision VPS (Ubuntu 22.04 LTS recommended)
2. Install dependencies:
   - Node.js 18+
   - PM2
   - Redis
   - Nginx
   - Certbot
3. Configure firewall (UFW)
4. Set up SSL certificates
5. Deploy backend code
6. Configure PM2 ecosystem
7. Start services

### Updates
```bash
# SSH to VPS
# Navigate to backend directory
cd [backend-path]

# Pull latest code
git pull

# Install dependencies
npm install --production

# Restart services
pm2 restart all
```

---

## Performance

**Metrics** (as of Nov 10, 2025):
- Event Indexer: ~85 MB memory, <5% CPU
- WebSocket Server: ~24 MB memory, <2% CPU
- WebSocket connection time: <500ms
- Event delivery latency: <1 second
- Concurrent connections: Tested for hundreds of clients

---

## Security

### Network Security
- ✅ Firewall configured (UFW)
- ✅ Only necessary ports open (80, 443, 22)
- ✅ Internal services not exposed
- ✅ Rate limiting on WebSocket endpoint

### Application Security
- ✅ No sensitive data in logs
- ✅ Environment variables secured
- ✅ Regular security updates
- ✅ Process isolation (PM2)

### SSL/TLS
- ✅ Let's Encrypt certificates
- ✅ Auto-renewal configured
- ✅ HTTP/2 enabled
- ✅ Strong cipher suites

---

## Troubleshooting

### Events not appearing
1. Check Event Indexer is running: `pm2 status`
2. Check RPC connectivity: Test RPC endpoint
3. Check Redis: `redis-cli ping`
4. Check logs for errors: `pm2 logs`

### WebSocket disconnections
1. Check WebSocket Server is running
2. Check Nginx is running: `sudo systemctl status nginx`
3. Check SSL certificate validity: `sudo certbot certificates`
4. Check client firewall/network

### High memory usage
1. Restart services: `pm2 restart all`
2. Check for memory leaks in logs
3. Consider increasing VPS resources
4. Implement event pruning if database growing too large

---

## Backup & Recovery

### Database Backups
- Supabase handles automatic backups
- Point-in-time recovery available

### Code Backups
- Backend code in private git repository
- VPS snapshots recommended (weekly)

### Service Recovery
1. Restore from VPS snapshot OR
2. Fresh VPS setup + deploy from git
3. Restore environment variables
4. Start services with PM2

---

## Monitoring & Alerts

**Recommended Setup**:
- **UptimeRobot**: Monitor wss://ws.kektech.xyz/ws endpoint
- **PM2 Plus**: Process monitoring and alerts
- **Supabase Dashboard**: Database monitoring
- **Nginx Logs**: Traffic analysis

**Alert Conditions**:
- WebSocket endpoint down > 5 minutes
- PM2 process crashes > 3 times/hour
- High memory usage > 80%
- SSL certificate expires in < 7 days

---

## Repository

Backend code is maintained in a separate **private repository**:
- **Repository**: `kektech-backend` (access restricted)
- **Location**: Contact DevOps team for access
- **Security**: Never make this repository public

---

## Support

**Technical Issues**: DevOps team
**Security Concerns**: security@kektech.xyz
**Emergency**: [Emergency contact]

---

Last Updated: 2025-11-10
