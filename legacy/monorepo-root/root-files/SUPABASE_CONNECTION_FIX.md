# Supabase Connection Fix for Vercel

**Date**: 2025-11-13
**Status**: 🔍 Investigation - Vercel cannot connect to Supabase

## Problem

Vercel deployment cannot reach Supabase database:
```
Error: Can't reach database server at db.cvablivsycsejtmlbheo.supabase.co:5432
```

## Supabase Configuration Observed

From the screenshot, I can see:
- **Connection pooling**: Enabled
- **Shared Pooler**: Available
- **Pool Size**: 15 connections
- Connection string format visible

## Solution Steps

### Option 1: Use Connection Pooler (RECOMMENDED for Vercel)

Vercel serverless functions work better with connection pooling. Based on your Supabase settings:

**Current DATABASE_URL** (direct connection - port 5432):
```env
postgresql://postgres:[PASSWORD]@db.cvablivsycsejtmlbheo.supabase.co:5432/postgres
```

**Update to Pooler** (port 6543 with pgbouncer):
```env
postgresql://postgres:[PASSWORD]@db.cvablivsycsejtmlbheo.supabase.co:6543/postgres?pgbouncer=true
```

#### How to Update in Vercel:

1. **Go to Vercel Dashboard**:
   ```
   https://vercel.com/kektech1/kektech-frontend/settings/environment-variables
   ```

2. **Find DATABASE_URL** variable

3. **Update the value**:
   - Change port: `5432` → `6543`
   - Add parameter: `?pgbouncer=true`

4. **Redeploy**:
   ```bash
   vercel deploy --prod
   ```

### Option 2: Check Network Access Settings

1. **Go to Supabase Dashboard**:
   ```
   https://app.supabase.com/project/[YOUR_PROJECT]/settings/database
   ```

2. **Scroll to "Connection Security"** section

3. **Verify settings**:
   - [ ] "Allow all IP addresses" OR
   - [ ] Vercel IP ranges whitelisted

4. **If using IP whitelist**, add Vercel IPs:
   - Check Vercel docs for current IP ranges
   - Add them to Supabase allowed IPs

### Option 3: Use Supabase REST API (Fallback)

If pooler doesn't work, we can use Supabase's REST API instead of direct Prisma connection:

**Environment Variables Needed**:
```env
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[SERVICE_ROLE_KEY]
```

Then update API routes to use `@supabase/supabase-js` instead of Prisma for serverless compatibility.

## Testing the Fix

After updating DATABASE_URL to use pooler:

1. **Test health endpoint**:
   ```bash
   curl https://kektech-frontend.vercel.app/api/health/db
   ```

2. **Expected success response**:
   ```json
   {
     "success": true,
     "database": "connected",
     "prisma": "initialized",
     "tables": {
       "comments": 0,
       "proposalVotes": 0,
       "resolutionVotes": 0,
       "userActivity": 0
     }
   }
   ```

3. **Test actual API endpoint**:
   ```bash
   curl "https://kektech-frontend.vercel.app/api/comments/top?timeframe=day&limit=1"
   ```

## Why This Happens

**Direct Connection Issues**:
- Serverless functions have ephemeral connections
- Each request creates new connection (connection pool exhaustion)
- May hit Supabase connection limits (15 in your case)
- Network latency/timeout issues

**Connection Pooler Benefits**:
- PgBouncer manages connection pool efficiently
- Reuses connections across requests
- Better for serverless environments
- Handles connection limits gracefully

## Quick Action Items

**Priority 1: Update DATABASE_URL** (5 minutes)
1. Go to Vercel dashboard
2. Update `DATABASE_URL` to use port `6543` with `?pgbouncer=true`
3. Redeploy

**Priority 2: Verify Connection** (2 minutes)
1. Wait for deployment to complete
2. Test `/api/health/db` endpoint
3. Test `/api/comments/top` endpoint

**Priority 3: Monitor** (ongoing)
1. Check Vercel function logs
2. Monitor Supabase connection count
3. Watch for timeout errors

## Expected Outcome

✅ **After pooler fix**:
- Health check returns 200 OK
- All API routes work on Vercel
- Connection pool managed efficiently
- No more "Can't reach database" errors

## Alternative: Prisma Data Proxy

If pooler doesn't solve it, consider Prisma Data Proxy:
- Designed specifically for serverless
- Manages connections for you
- Additional cost but very reliable

## References

- Supabase Pooler Docs: https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler
- Vercel Prisma Guide: https://vercel.com/guides/nextjs-prisma-postgres
- Prisma Connection Pooling: https://www.prisma.io/docs/guides/performance-and-optimization/connection-management

---

**Next Step**: Update DATABASE_URL in Vercel to use port 6543 with pgbouncer, then redeploy and test.
