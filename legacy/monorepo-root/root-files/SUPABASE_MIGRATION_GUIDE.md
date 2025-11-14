# SUPABASE MIGRATION GUIDE
**Created**: 2025-11-09 19:30 CET
**Purpose**: Complete guide to migrate KEKTECH from SQLite to Supabase PostgreSQL
**Status**: Ready to execute

---

## 🎯 WHY SUPABASE?

**Decision Rationale**:
- ✅ Production-ready PostgreSQL from day 1 (no migration later)
- ✅ Built-in authentication (saves 2-3 hours of custom auth)
- ✅ Real-time subscriptions (live comment/vote updates)
- ✅ Row-level security (database-level access control)
- ✅ Auto backups and scaling
- ✅ Free tier: 500MB DB, unlimited API requests
- ✅ Perfect timing: Database not initialized yet (no data to lose)

**Time Savings**:
- Setup: +20 min (30 min vs 10 min for SQLite)
- Auth: -1 to -2 hours (1 hour vs 2-3 hours)
- **Net savings: 40-100 minutes + no future migration**

---

## 📋 PHASE 1: SUPABASE SETUP (30 minutes)

### Task 1.1: Create Supabase Project (15 min)

**Steps**:

1. **Go to Supabase** (if you don't have account):
   - Navigate to: https://supabase.com
   - Click "Start your project"
   - Sign up with GitHub (recommended) or email

2. **Create New Project**:
   - Click "New Project"
   - **Organization**: Create new or select existing
   - **Project Name**: `kektech-production` (or your choice)
   - **Database Password**: Generate strong password
     - ⚠️ **CRITICAL**: Save this password! You'll need it.
     - Recommendation: Use password manager
   - **Region**: Choose closest to your users
     - US East (North Virginia) - `us-east-1`
     - Europe (Frankfurt) - `eu-central-1`
     - Asia Pacific (Singapore) - `ap-southeast-1`
   - **Pricing Plan**: Free (500MB, perfect for MVP)
   - Click "Create new project"

3. **Wait for Provisioning** (2-3 minutes):
   - Coffee break ☕
   - Project is creating PostgreSQL database
   - Status will change from "Setting up project" → "Active"

**Success Criteria**:
- [ ] Supabase project created and showing "Active" status
- [ ] Database password saved securely

---

### Task 1.2: Get Database Connection String (5 min)

**Steps**:

1. **Navigate to Database Settings**:
   - In your Supabase project dashboard
   - Left sidebar → ⚙️ **Settings** → **Database**

2. **Find Connection String**:
   - Scroll to **Connection string** section
   - Click **URI** tab (not "Connection pooling")
   - You'll see something like:
     ```
     postgresql://postgres:[YOUR-PASSWORD]@db.abc123def456.supabase.co:5432/postgres
     ```

3. **Copy the Full URI**:
   - Click the copy button 📋
   - It will have `[YOUR-PASSWORD]` placeholder
   - You need to replace it manually in next step

4. **Replace Password Placeholder**:
   - Take the copied URI
   - Replace `[YOUR-PASSWORD]` with the actual password you saved
   - Final format:
     ```
     postgresql://postgres:ActualPassword123!@db.abc123def456.supabase.co:5432/postgres
     ```

**Example**:
```
# Before (from Supabase dashboard):
postgresql://postgres:[YOUR-PASSWORD]@db.abc123def456.supabase.co:5432/postgres

# After (with your real password):
postgresql://postgres:SuperSecret123!@db.abc123def456.supabase.co:5432/postgres
```

**Success Criteria**:
- [ ] Connection string copied
- [ ] Password placeholder replaced with actual password
- [ ] Ready to paste into .env.local

---

### Task 1.3: Update Environment Variables (5 min)

**Files to Update**:

1. **`packages/frontend/.env.local`**:

   **Action**: Replace or add `DATABASE_URL` with Supabase connection string

   **Before** (SQLite):
   ```env
   DATABASE_URL="file:./dev.db"
   ```

   **After** (Supabase):
   ```env
   # Replace with your actual Supabase connection string
   DATABASE_URL="postgresql://postgres:YourPassword@db.yourproject.supabase.co:5432/postgres"

   # Add Supabase public anon key (from Supabase Settings → API)
   NEXT_PUBLIC_SUPABASE_URL="https://yourproject.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
   ```

2. **Get Supabase API Keys**:
   - In Supabase dashboard: Settings → API
   - **Project URL**: Copy to `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API keys** → `anon` `public`: Copy to `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Example `.env.local` after updates**:
```env
# Supabase Database
DATABASE_URL="postgresql://postgres:kektech_secure_2024@db.xyzproject.supabase.co:5432/postgres"

# Supabase Client (for auth and real-time)
NEXT_PUBLIC_SUPABASE_URL="https://xyzproject.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSI..."

# BasedAI RPC (existing)
NEXT_PUBLIC_BASEDAI_RPC="https://rpc.basedai.com"

# Contract Addresses (existing - don't change)
NEXT_PUBLIC_VERSIONED_REGISTRY="0x67F8F023f6cFAe44353d797D6e0B157F2579301A"
# ... rest of your contract addresses ...
```

**Security Check**:
- [ ] `.env.local` is in `.gitignore` (should already be)
- [ ] Never commit actual passwords to git
- [ ] Use `.env.example` for sharing structure without secrets

**Success Criteria**:
- [ ] `DATABASE_URL` updated with Supabase connection string
- [ ] `NEXT_PUBLIC_SUPABASE_URL` added
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` added
- [ ] File saved

---

### Task 1.4: Run Prisma Migrations to Supabase (5 min)

**Commands**:
```bash
cd /Users/seman/Desktop/kektechV0.69/packages/frontend

# Generate Prisma Client for new DATABASE_URL
npx prisma generate

# Push schema to Supabase (creates tables)
npx prisma db push

# Or use migrations (recommended for production)
npx prisma migrate deploy
```

**What This Does**:
- Connects to Supabase PostgreSQL using `DATABASE_URL`
- Creates 6 tables from your `schema.prisma`:
  1. `Comment`
  2. `CommentVote`
  3. `ProposalVote`
  4. `ResolutionVote`
  5. `MarketMetadata`
  6. `UserActivity`
- Creates all indexes and relationships

**Expected Output**:
```
Environment variables loaded from .env.local
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "postgres", schema "public"

The following migration(s) have been applied:

migrations/
  └─ 20251109045413_init/
    └─ migration.sql

✔ Generated Prisma Client (v5.x.x) to ./node_modules/@prisma/client in 123ms

All migrations have been successfully applied.
```

**Troubleshooting**:

**Error: "Can't reach database server"**:
- Check `DATABASE_URL` has correct password
- Check no extra spaces in connection string
- Verify Supabase project is "Active"

**Error: "SSL connection required"**:
- Add `?sslmode=require` to end of `DATABASE_URL`
- Example: `postgresql://...postgres?sslmode=require`

**Success Criteria**:
- [ ] No errors during migration
- [ ] "All migrations have been successfully applied" message
- [ ] Prisma Client generated

---

### Task 1.5: Verify Tables Created in Supabase (5 min)

**Method 1: Supabase Dashboard (Easiest)**

1. Go to Supabase dashboard
2. Left sidebar → **Table Editor**
3. You should see 6 tables:
   - Comment
   - CommentVote
   - MarketMetadata
   - ProposalVote
   - ResolutionVote
   - UserActivity
4. Click each table to see columns

**Method 2: Prisma Studio (Local GUI)**

```bash
cd /Users/seman/Desktop/kektechV0.69/packages/frontend
npx prisma studio
```

- Opens browser at `http://localhost:5555`
- Should show 6 tables
- Can browse data (empty for now)

**Method 3: SQL Query (Advanced)**

In Supabase dashboard → **SQL Editor**:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';
```

Should return 6 tables.

**Success Criteria**:
- [ ] 6 tables visible in Supabase dashboard
- [ ] Table structures match schema.prisma
- [ ] No errors in Prisma Studio

---

### Task 1.6: Install Supabase Client Libraries (5 min)

**Commands**:
```bash
cd /Users/seman/Desktop/kektechV0.69/packages/frontend

# Install Supabase JS client
npm install @supabase/supabase-js

# Install Next.js auth helpers (SSR support)
npm install @supabase/auth-helpers-nextjs @supabase/auth-helpers-react

# Install for server components
npm install @supabase/ssr
```

**What These Do**:
- `@supabase/supabase-js`: Core Supabase client (auth, real-time, DB)
- `@supabase/auth-helpers-nextjs`: Next.js middleware and route handlers
- `@supabase/auth-helpers-react`: React hooks (useSupabaseClient, useUser)
- `@supabase/ssr`: Server-side rendering support

**Expected Output**:
```
added 15 packages, and audited 1234 packages in 8s

found 0 vulnerabilities
```

**Success Criteria**:
- [ ] All packages installed without errors
- [ ] package.json updated with new dependencies
- [ ] node_modules contains @supabase packages

---

## ✅ PHASE 1 COMPLETION CHECKLIST

Before proceeding to Phase 2 (Authentication), verify:

- [ ] Supabase project created and active
- [ ] Database password saved securely
- [ ] `.env.local` updated with 3 new variables:
  - `DATABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Prisma migrations applied successfully
- [ ] 6 tables visible in Supabase dashboard
- [ ] Supabase client libraries installed
- [ ] No errors in terminal

**Time Spent**: [Fill in actual time]

**Ready for**: Phase 2 - Supabase Authentication (1 hour)

---

## 🚀 NEXT: PHASE 2 - AUTHENTICATION (1 hour)

After Phase 1 complete, we'll implement:

1. **Supabase Client Setup** (15 min)
   - Create `lib/supabase/client.ts`
   - Create `lib/supabase/server.ts`
   - Configure middleware

2. **Wallet Authentication Flow** (20 min)
   - Use Supabase custom auth (sign message with wallet)
   - Create `useWalletAuth` hook
   - Integrate with Wagmi

3. **API Route Protection** (20 min)
   - Update 5 API routes with Supabase auth
   - Use Row Level Security (RLS) policies
   - Test auth flow

4. **Testing** (5 min)
   - Verify wallet connection → sign message → authenticated
   - Test API calls with/without auth

**Time Savings**: 1-2 hours compared to manual implementation

---

## 📊 MIGRATION BENEFITS REALIZED

### What We Gained:

1. **Production Database** ✅
   - PostgreSQL instead of SQLite
   - No future migration needed
   - Handles concurrent writes

2. **Built-in Auth** ✅
   - Use Supabase auth helpers
   - Save 1-2 hours of custom auth
   - More secure (tested by thousands)

3. **Real-Time Ready** ✅
   - Can add live comment updates
   - Live vote count changes
   - Better UX for prediction markets

4. **Better DevEx** ✅
   - Supabase dashboard for debugging
   - SQL editor for queries
   - Table editor for data inspection
   - Automatic backups

5. **Scalability** ✅
   - Auto-scaling PostgreSQL
   - Connection pooling
   - Read replicas (paid tiers)

### Time Comparison:

| Task | SQLite | Supabase | Savings |
|------|--------|----------|---------|
| Setup | 10 min | 30 min | -20 min |
| Auth | 2-3 hours | 1 hour | +1-2 hours |
| Future Migration | 2-4 hours | 0 hours | +2-4 hours |
| **Total** | **2.5-3.5 hours** | **1.5 hours** | **+1-2 hours** |

---

## 🔧 TROUBLESHOOTING

### Common Issues:

**"Can't reach database server at `db.xxx.supabase.co`"**:
- Check internet connection
- Verify `DATABASE_URL` copied correctly
- Check no firewall blocking port 5432

**"Authentication failed for user `postgres`"**:
- Password wrong in `DATABASE_URL`
- Copy password again from Supabase dashboard
- Check for special characters (may need URL encoding)

**"SSL connection required"**:
- Add `?sslmode=require` to connection string
- Example: `postgresql://...postgres?sslmode=require`

**"Migration already applied"**:
- Safe to ignore if tables exist
- Verify with: `npx prisma db pull` (pulls current schema)

**Prisma Client not updated**:
- Run: `npx prisma generate` again
- Restart dev server: `npm run dev`

---

## 📝 DOCUMENTATION UPDATES

After Phase 1 complete, update:

1. **CURRENT_STATUS.md**:
   ```markdown
   ### Database ✅
   - **Type**: Supabase PostgreSQL (production-ready)
   - **Status**: Initialized with 6 tables
   - **Connection**: Verified and working
   ```

2. **NEXT_STEPS.md**:
   - Mark Phase 1 tasks complete
   - Update Phase 2 to reflect Supabase auth approach

3. **CLAUDE.md** (optional):
   - Update database section to mention Supabase

---

## 🎯 READY TO START?

Once you have:
- [ ] Supabase account created
- [ ] Project created and active
- [ ] Database password saved

Run these commands:

```bash
# 1. Update .env.local with your Supabase credentials
# (Manual step - copy from Supabase dashboard)

# 2. Navigate to frontend
cd /Users/seman/Desktop/kektechV0.69/packages/frontend

# 3. Generate Prisma Client
npx prisma generate

# 4. Apply migrations
npx prisma migrate deploy

# 5. Install Supabase
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs @supabase/auth-helpers-react @supabase/ssr

# 6. Verify
npx prisma studio  # Should show 6 empty tables
```

**Estimated Time**: 30 minutes
**Next Phase**: Authentication (1 hour)

---

**Let's do this! 🚀**
