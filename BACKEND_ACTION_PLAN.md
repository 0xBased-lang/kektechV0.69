# Backend Action Plan - Production Fixes

**Created**: 2025-11-12 22:50
**Priority**: CRITICAL - Production is failing
**Estimated Time**: 2-3 hours

---

## 🚨 Current Production Issues

### Issue Summary (from Console Logs)

| Issue | Status | Impact | Priority |
|-------|--------|--------|----------|
| WebSocket connection to `wss://ws.kektech.xyz/ws` failing | 🔴 CRITICAL | Real-time features broken | P0 |
| `/api/comments/top` returning 500 | 🔴 CRITICAL | Comments feature broken | P0 |
| `/api/comments/market/[address]` returning 500 | 🔴 CRITICAL | Market comments broken | P0 |
| `/api/auth/verify` returning 403 | ✅ FIXED | Auth broken → Fixed in code | P0 |

---

## 📋 Action Plan

### Phase 1: Frontend Fixes (COMPLETED ✅)

**Status**: ✅ Done - Ready to deploy

**Changes Made**:
1. ✅ Fixed `/api/auth/verify` origin validation (added Vercel URL)
2. ✅ Updated centralized security utils with Vercel URL
3. ✅ Enhanced `.env.local.example` with all required variables
4. ✅ Identified missing `SUPABASE_SERVICE_KEY` in Vercel

**Files Changed**:
- `packages/frontend/app/api/auth/verify/route.ts`
- `packages/frontend/lib/utils/security.ts`
- `packages/frontend/.env.local.example`

---

### Phase 2: Vercel Configuration (IMMEDIATE - 10 minutes)

**Action**: Add missing environment variable to Vercel Dashboard

#### Required Variable

```bash
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**How to Get**:
1. Go to Supabase Dashboard
2. Navigate to: Settings → API
3. Find: **service_role** key (secret)
4. Copy the value

**How to Set in Vercel**:
1. Go to: https://vercel.com/kektech1/kektech-frontend/settings/environment-variables
2. Click "Add New"
3. Name: `SUPABASE_SERVICE_KEY`
4. Value: [paste the service role key]
5. Environments: ✅ Production, ✅ Preview, ❌ Development
6. Click "Save"

**⚠️ CRITICAL**: This is a server-side-only secret. NEVER expose it to the client.

---

### Phase 3: Database Migration (IMMEDIATE - 15 minutes)

**Problem**: Comment API routes are failing with 500 errors
**Root Cause**: Database tables likely don't exist in Supabase

#### Check Current Database State

```bash
# Connect to Supabase via Prisma
cd packages/frontend

# Pull production DATABASE_URL from Vercel
vercel env pull .env.production

# Check current migration status
npx prisma migrate status
```

#### Apply Migrations (If Needed)

```bash
# Apply all pending migrations to production database
npx prisma migrate deploy

# Verify tables exist
npx prisma studio
# (Opens GUI - check that ProposalVote, ResolutionVote, Comment tables exist)
```

#### Expected Tables

After migration, you should have these tables:
- `ProposalVote` - Market proposal likes/dislikes
- `ResolutionVote` - Resolution outcome votes
- `Comment` - User comments on markets
- Plus Supabase auth tables (users, sessions, etc.)

#### Troubleshooting

**Error**: "Environment variable not found: DATABASE_URL"
```bash
# Manually set DATABASE_URL
export DATABASE_URL="postgresql://postgres:password@db.cvablivsycsejtmlbheo.supabase.co:5432/postgres"

# Then retry
npx prisma migrate deploy
```

**Error**: "Can't reach database server"
- Check Supabase project is running (not paused)
- Verify password in DATABASE_URL is correct
- Check Supabase firewall rules allow connections

---

### Phase 4: VPS Backend Investigation (NEXT - 30 minutes)

**Problem**: WebSocket connection failing - `wss://ws.kektech.xyz/ws`
**Status**: ⚠️ Requires VPS access

#### Step 1: Check Service Status

```bash
# SSH to VPS
ssh kek

# Check PM2 services
pm2 status

# Expected output:
# ┌─────┬────────────────────────┬─────────┬─────────┐
# │ id  │ name                   │ status  │ memory  │
# ├─────┼────────────────────────┼─────────┼─────────┤
# │ 0   │ kektech-event-indexer  │ online  │ 500M    │
# │ 1   │ kektech-websocket      │ online  │ 300M    │
# └─────┴────────────────────────┴─────────┴─────────┘
```

#### Step 2: Check WebSocket Server Logs

```bash
# View last 50 lines of WebSocket logs
pm2 logs kektech-websocket-server --lines 50

# Look for errors like:
# - Port 3180 already in use
# - Failed to connect to Redis
# - SSL certificate errors
# - "Error: listen EADDRINUSE"
```

#### Step 3: Test WebSocket Locally on VPS

```bash
# Test if WebSocket server is running
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Host: localhost:3180" \
  -H "Origin: http://localhost:3180" \
  http://localhost:3180/ws

# Expected: "HTTP/1.1 101 Switching Protocols"
# Error: "Connection refused" = server not running
```

#### Step 4: Check SSL/Domain Configuration

```bash
# Check if ws.kektech.xyz resolves to VPS IP
dig ws.kektech.xyz

# Expected: A record pointing to your VPS IP

# Check if port 3180 is open
sudo netstat -tlnp | grep 3180

# Check nginx/caddy config for WebSocket proxy
sudo cat /etc/nginx/sites-enabled/kektech-ws  # or /etc/caddy/Caddyfile
```

#### Common Issues & Fixes

**Issue**: Service shows "errored" or "stopped"
```bash
# Restart service
pm2 restart kektech-websocket-server

# If it crashes again, check logs
pm2 logs kektech-websocket-server --err
```

**Issue**: Port 3180 already in use
```bash
# Find process using port
sudo lsof -i :3180

# Kill rogue process
sudo kill -9 <PID>

# Restart PM2 service
pm2 restart kektech-websocket-server
```

**Issue**: Redis connection error
```bash
# Check Redis is running
redis-cli ping
# Expected: PONG

# If Redis is down
sudo systemctl status redis
sudo systemctl start redis
```

**Issue**: SSL certificate missing for ws.kektech.xyz
```bash
# Check certificate status
sudo certbot certificates | grep ws.kektech.xyz

# If missing, create certificate
sudo certbot --nginx -d ws.kektech.xyz

# Then restart nginx
sudo systemctl restart nginx
```

---

### Phase 5: Frontend Deployment (AFTER Phase 2 & 3 - 15 minutes)

**Action**: Deploy fixed frontend code to Vercel

```bash
# Commit and push changes
git add -A
git commit -m "fix: Add Vercel URL to allowed origins and update env docs

FIXES:
- 403 on /api/auth/verify (added kektech-frontend.vercel.app)
- Updated security utils with proper origin validation
- Enhanced .env.local.example with all required variables
- Identified missing SUPABASE_SERVICE_KEY in Vercel

NEXT STEPS:
- Add SUPABASE_SERVICE_KEY to Vercel env vars
- Apply Prisma migrations to production database
- Investigate WebSocket backend on VPS

TIME: 45 minutes

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to trigger deployment
git push origin claude/analysis-review-only-011CV4SPAwWFKBzmqHEPhfpy
```

#### After Deployment

1. **Wait for build to complete** (~3-5 minutes)
2. **Test API endpoints**:
   ```bash
   # Test auth (should return 400, not 403)
   curl -X POST https://kektech-frontend.vercel.app/api/auth/verify \
     -H "Origin: https://kektech-frontend.vercel.app" \
     -H "Content-Type: application/json" \
     -d '{}'

   # Expected: {"success":false,"error":"Invalid request format"}
   # NOT: {"success":false,"error":"Unauthorized origin"}
   ```

3. **Test comment routes** (after Phase 3 migrations):
   ```bash
   curl https://kektech-frontend.vercel.app/api/comments/top?timeframe=day&limit=1

   # Expected: {"success":true,"data":{"comments":[],"total":0,"timeframe":"day"}}
   # NOT: 500 Internal Server Error
   ```

---

### Phase 6: End-to-End Testing (FINAL - 20 minutes)

**Test Plan**:

1. ✅ **Wallet Connection**
   - Open: https://kektech-frontend.vercel.app
   - Click "Connect Wallet"
   - Expected: MetaMask/WalletConnect modal opens

2. ✅ **Authentication**
   - Sign message in wallet
   - Expected: User authenticated, no 403 errors

3. ✅ **Browse Markets**
   - Navigate to markets page
   - Expected: Market list loads

4. ✅ **View Market Details**
   - Click on a market
   - Expected: Market details load, comments section visible

5. ✅ **Post Comment** (requires auth)
   - Type a comment
   - Click submit
   - Expected: Comment posts successfully, no 500 errors

6. ✅ **Real-time Updates** (requires WebSocket)
   - Keep browser open
   - Trigger event on blockchain
   - Expected: UI updates in real-time

---

## 🎯 Priority Order

**DO FIRST** (Unblocks everything):
1. Add `SUPABASE_SERVICE_KEY` to Vercel (5 min)
2. Apply Prisma migrations to production DB (10 min)
3. Deploy frontend fixes to Vercel (15 min)

**DO SECOND** (Backend infrastructure):
4. SSH to VPS and investigate WebSocket server (30 min)
5. Fix WebSocket SSL/domain configuration if needed (20 min)
6. Test and verify WebSocket connectivity (10 min)

**DO LAST** (Validation):
7. End-to-end testing of all features (20 min)
8. Monitor Vercel logs for any new errors (ongoing)

---

## 📊 Success Criteria

### Frontend (API Routes)
- ✅ `/api/auth/verify` returns 400 for invalid input (not 403)
- ✅ `/api/comments/top` returns 200 with data (not 500)
- ✅ `/api/comments/market/[address]` returns 200 with data (not 500)
- ✅ All authenticated routes work without 403 errors

### Backend (VPS Services)
- ✅ `pm2 status` shows both services "online"
- ✅ WebSocket connection succeeds: `wss://ws.kektech.xyz/ws`
- ✅ Event indexer logs show new blocks being processed
- ✅ Real-time updates work in frontend

### Database
- ✅ Prisma migrations applied successfully
- ✅ All tables exist (ProposalVote, ResolutionVote, Comment)
- ✅ Can read/write data without errors

---

## 🔧 Required Access

### Vercel Dashboard
- URL: https://vercel.com/kektech1/kektech-frontend
- Access: You should have owner/admin access
- Needed for: Adding SUPABASE_SERVICE_KEY

### VPS (Backend Server)
- Access: `ssh kek`
- Location: `/var/www/kektech/backend/`
- Needed for: Investigating WebSocket failures

### Supabase Dashboard
- Access: Via your Supabase account
- Needed for: Getting SUPABASE_SERVICE_KEY, checking database

---

## 🚀 Quick Start Commands

```bash
# 1. Add SUPABASE_SERVICE_KEY to Vercel Dashboard (manual - see Phase 2)

# 2. Apply database migrations
cd packages/frontend
vercel env pull .env.production
export DATABASE_URL="<value from .env.production>"
npx prisma migrate deploy

# 3. Commit and deploy frontend fixes
git add -A
git commit -m "fix: Add Vercel URL to allowed origins"
git push origin claude/analysis-review-only-011CV4SPAwWFKBzmqHEPhfpy

# 4. Check VPS backend
ssh kek
pm2 status
pm2 logs kektech-websocket-server --lines 50

# 5. Test after deployment
curl -X POST https://kektech-frontend.vercel.app/api/auth/verify \
  -H "Origin: https://kektech-frontend.vercel.app" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## 📝 Notes

- **Deployment Trigger**: Pushing to the branch automatically triggers Vercel deployment
- **Build Time**: ~3-5 minutes
- **Cache**: If changes don't appear, hard refresh (Ctrl+Shift+R)
- **Logs**: Check Vercel Dashboard → Deployments → [Latest] → View Function Logs

---

**Total Estimated Time**: 2-3 hours (includes testing)
**Blocking Issues**: 2 (Vercel env var + Database migrations)
**Non-Blocking Issues**: 1 (WebSocket backend - can fix after frontend works)

---

**Questions?**
- Frontend issues: Check Vercel deployment logs
- Backend issues: Check PM2 logs on VPS (`pm2 logs`)
- Database issues: Check Supabase Dashboard → Database → Table Editor
