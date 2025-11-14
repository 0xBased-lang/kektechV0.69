# VPS Backend Deployment Plan
**Date**: 2025-11-13
**Purpose**: Deploy TypeScript config fixes and recent backend improvements

> **Important**: The backend code no longer lives under `packages/backend` in this monorepo. Use the private `kektech-backend` repository (either locally or directly on the VPS at `/var/www/kektech/backend`) when following the steps below. Replace any references to `packages/backend` with the actual backend repo path on your machine.

## Pre-Deployment Checklist

### 1. Local Verification ✅
- [x] Backend builds successfully (`npm run build`)
- [x] Event indexer tested locally
- [x] WebSocket server tested locally
- [x] End-to-end event flow verified (Redis → WebSocket)

### 2. Changes Being Deployed

**Critical Fix**:
- `tsconfig.json`: Added explicit `types: ["node"]` to fix build errors

**Infrastructure Updates**:
- Event indexer improvements
- WebSocket server enhancements
- Config and utility updates
- Redis/Supabase connection improvements

### 3. VPS Pre-Deployment Checks

```bash
# 1. Connect to VPS
ssh kek

# 2. Check current service status
pm2 status

# 3. Check service health
pm2 logs --lines 50

# 4. Backup current working directory
cd /var/www/kektech
tar -czf "backend-backup-$(date +%Y%m%d-%H%M%S).tar.gz" backend/

# 5. Note current git commit
cd backend
git log -1 --oneline
```

## Deployment Steps

### Step 1: Commit Local Changes
```bash
# Work inside the private backend repository (example path shown)
cd /path/to/kektech-backend

# Stage backend changes only (safer)
git add tsconfig.json
git add package.json
git add services/
git add shared/

# Create deployment commit
git commit -m "fix: Backend TypeScript config and service improvements

CHANGES:
- Fix TypeScript build by explicitly setting node types
- Improve event indexer error handling
- Enhance WebSocket server logging
- Update Redis and Supabase utilities

TESTED:
- Local build succeeds
- Event indexer connects to BasedAI RPC
- WebSocket server broadcasts events
- End-to-end event flow verified

TIME: 30 minutes

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to remote
git push origin main
```

### Step 2: VPS Deployment

```bash
# 1. Connect to VPS
ssh kek

# 2. Navigate to backend directory
cd /var/www/kektech/backend

# 3. Check for uncommitted local changes on VPS
git status

# 4. Stash any local changes (if needed)
git stash

# 5. Pull latest changes
git pull origin main

# 6. Verify the changes pulled correctly
git log -1 --oneline
git diff HEAD~1 HEAD --stat

# 7. Install dependencies (if package.json changed)
npm install

# 8. Build TypeScript
npm run build

# 9. Verify build succeeded
ls -la dist/services/event-indexer/
ls -la dist/services/websocket-server/
```

### Step 3: Graceful Service Restart

```bash
# 1. Restart services one at a time
pm2 restart kektech-event-indexer

# 2. Wait 30 seconds and check logs
sleep 30
pm2 logs kektech-event-indexer --lines 20 --nostream

# 3. Verify event indexer is healthy
# Look for: "✓ Connected to BasedAI RPC"
# Look for: "✓ Connected to Supabase"
# Look for: "✓ Connected to Redis"

# 4. If event indexer is healthy, restart WebSocket
pm2 restart kektech-websocket-server

# 5. Wait 30 seconds and check logs
sleep 30
pm2 logs kektech-websocket-server --lines 20 --nostream

# 6. Verify WebSocket is healthy
# Look for: "✓ WebSocket server listening on port 3180"
# Look for: "✓ Connected to Redis"
```

### Step 4: Post-Deployment Verification

```bash
# 1. Check PM2 status
pm2 status

# 2. Check memory usage (should be normal)
# Event Indexer: ~500M
# WebSocket Server: ~300M

# 3. Monitor logs for 2 minutes
pm2 logs --lines 50

# 4. Verify no error loops
# Should see normal indexing batches
# Should see WebSocket connections

# 5. Test WebSocket from external client (optional)
# Use frontend dev server or curl to verify connectivity
```

## Rollback Plan (If Issues Occur)

```bash
# 1. Stop services
pm2 stop all

# 2. Restore backup
cd /var/www/kektech
rm -rf backend
tar -xzf backend-backup-YYYYMMDD-HHMMSS.tar.gz

# 3. Restart services
cd backend
pm2 restart all

# 4. Verify rollback
pm2 status
pm2 logs --lines 20
```

## Success Criteria

- [ ] Git pull succeeds without conflicts
- [ ] `npm run build` completes without errors
- [ ] Event indexer restarts and connects to all services
- [ ] WebSocket server restarts and listens on port 3180
- [ ] No error loops in logs after 2 minutes
- [ ] Memory usage is normal (~500M + ~300M)
- [ ] Services show "online" status in PM2

## Emergency Contacts

- VPS Access: `ssh kek`
- PM2 Dashboard: `pm2 monit`
- Logs Location: `/var/www/kektech/backend/logs/`

## Notes

- Deploy during low-traffic period if possible
- Keep SSH session open during deployment
- Have backup plan ready before starting
- Document any unexpected issues
- Update this plan with lessons learned

---

**Deployment Start Time**: _____________
**Deployment End Time**: _____________
**Status**: ⏳ Pending
**Issues Encountered**: None / [List issues]
**Resolution**: N/A / [Describe resolution]
