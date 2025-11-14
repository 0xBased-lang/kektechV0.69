# KEKTECH 3.0 - AI Assistant Instructions

**Last Updated**: 2025-11-10 17:00 CET
**Purpose**: Accurate guidance for Claude Code AI assistant
**Status**: In progress - Security integration underway

---

## 🎯 PROJECT STATUS (Evidence-Based Truth)

**For complete and accurate status, see `PROJECT_STATUS.md`** ⭐

**Current Completion**: 60% (Infrastructure complete, security integration in progress)

### What's COMPLETE ✅
- **Smart Contracts**: ✅ Deployed to BasedAI mainnet (Nov 6, 2025)
- **VPS Backend**: ✅ Event Indexer + WebSocket operational
- **Contract Addresses**: ✅ Synced in deployment.json and contracts.json
- **Backend APIs**: ✅ 9 routes with Supabase authentication
- **Database Schema**: ✅ 7 tables, schema in sync with Supabase
- **UI Components**: ✅ All 8 engagement components exist
- **API Client**: ✅ 8 hooks cleaned (userId removed from POST)
- **Contract Integration**: ✅ Complete hook system for on-chain data
- **Repository Security**: ✅ Main + backend repos PRIVATE

### What Needs Work ⚠️
- **Security Integration**: ⚠️ CRITICAL - Utilities created but NOT integrated into API routes
- **Testing**: ⚠️ Security tests, API tests, E2E tests needed
- **Environment Variables**: ⚠️ Need to verify in Vercel
- **Deployment**: ⚠️ Ready after security integration

**Reality Check**: System is 60% complete - CRITICAL security integration in progress. Security files exist but are not yet protecting API routes.

---

## 🖥️ BACKEND INFRASTRUCTURE

**Location**: `/var/www/kektech/backend/` (VPS Production)  
**Status**: ✅ Deployed and operational on VPS  
**Access**: `ssh kek` → `/var/www/kektech/backend/`  
**Repository**: Private `kektech-backend` repo (not tracked in this monorepo – pull directly on the VPS)

### Architecture Flow
```
BasedAI Blockchain → Event Indexer → Supabase PostgreSQL
                     (VPS: PM2)       (Cloud Database)
                          ↓
                     Redis Pub/Sub
                       (VPS)
                          ↓
                 WebSocket Server → Frontend Clients
                   (VPS:3180)
```

### Services (PM2 Managed on VPS)

| Service | Purpose | Status | Memory |
|---------|---------|--------|--------|
| `kektech-event-indexer` | Polls BasedAI blockchain, indexes events to Supabase | ✅ Running | 500M |
| `kektech-websocket-server` | Broadcasts real-time updates via WebSocket | ✅ Running | 300M |

### VPS Deployment Workflow

```bash
# Deploy/update backend on VPS
ssh kek
cd /var/www/kektech/backend

# Pull latest changes from monorepo
git pull origin main

# Install dependencies and build
npm install
npm run build

# Restart PM2 services
pm2 restart all

# Monitor services
pm2 status              # Check service status
pm2 logs                # View real-time logs
pm2 logs --lines 100    # View last 100 lines
```

### Key Components

**Services** (refer to private backend repo paths):
- `event-indexer/index.ts` - Polls BasedAI mainnet every 10s, batch processes 100 blocks
- `websocket-server/index.ts` - Real-time event broadcasting on port 3180

**Shared Utilities**:
- `config/contracts.ts` - Contract addresses & ethers.js providers
- `utils/supabase.ts` - Database client (service role key)
- `utils/redis.ts` - Pub/sub messaging for real-time events
- `utils/logger.ts` - Winston logging to files
- `abis/` - MarketFactory & PredictionMarket ABIs

**Configuration**:
- `ecosystem.config.js` - PM2 process management config
- `.env` - VPS production credentials (NOT in git, lives on VPS only)
- `tsconfig.json` - TypeScript compilation settings

### Database Tables Written

| Table | Purpose | Written By |
|-------|---------|------------|
| `IndexedEvent` | Raw blockchain events | Event Indexer |
| `MarketMetadata` | Market state snapshots | Event Indexer |

### Critical Notes

⚠️ **Local vs VPS**:
- The `packages/backend` folder was removed from this repository. Do **not** recreate it here.
- Use the private backend repository when making changes, then deploy via `ssh kek` → `/var/www/kektech/backend/`.
- Production updates still follow: private repo → push → SSH into VPS → `git pull` → restart PM2.

⚠️ **Environment Variables**:
- `.env.example` in git (template only)
- `.env` on VPS only (contains production secrets)
- Never commit production `.env` to git

⚠️ **Service Management**:
- Services run via PM2 (process manager)
- Auto-restart on crash (max 10 retries)
- Logs: `/var/www/kektech/backend/logs/`

### Quick Commands

```bash
# VPS Access
ssh kek                          # Connect to VPS

# Service Management
pm2 status                       # View all services
pm2 restart kektech-event-indexer
pm2 restart kektech-websocket-server
pm2 restart all                  # Restart both services

# Logs
pm2 logs                         # Real-time logs (all services)
pm2 logs kektech-event-indexer  # Specific service logs
pm2 flush                        # Clear log files

# Monitoring
pm2 monit                        # Interactive monitoring dashboard
```

---

## 📁 DOCUMENTATION STRUCTURE

### Primary Documents (Source of Truth)

**1. PROJECT_STATUS.md** ⭐ START HERE
- **Purpose**: Single source of truth for project state (verified via code inspection)
- **Updated**: 2025-11-10 (major cleanup)
- **Contains**: What's complete, what needs work, immediate next steps
- **Rule**: If conflicts exist between files, this file wins

**2. CLAUDE.md** (this file)
- **Purpose**: AI assistant guidance and project context
- **Updated**: When project structure or status changes significantly
- **Contains**: Development workflow, file structure, critical rules
- **References**: PROJECT_STATUS.md for current state

**3. README.md**
- **Purpose**: Public-facing project overview
- **Updated**: Major milestones only
- **Audience**: External developers, users

### Technical Reference (in /docs/reference/)
- **CONTRACTS.md** - Smart contract architecture
- **API.md** - Backend API reference
- **ARCHITECTURE.md** - System design

---

## 🚫 FILES TO IGNORE

**Archived Documentation (2025-11-10)**:
- ❌ `docs/archive/CURRENT_STATUS.md.old` (replaced by PROJECT_STATUS.md)
- ❌ `docs/archive/NEXT_STEPS.md.old` (outdated task list)
- ❌ Any files in `docs/archive/` (historical reference only)

**Previous Archive** (2025-11-09 18:48):
- Location: `/Users/seman/KEKTECH_OFFICIALS/KEKTECH_ARCHIVE_20251109_184834/`
- Contains: 292 historical files, metadata, git history
- Status: Permanent reference, safe to search if needed
- Rule: Current docs take precedence

**Never Existed**:
- ❌ CHECKPOINT.md (mentioned in error)

---

## 🏗️ PROJECT STRUCTURE

```
kektechV0.69/
├── packages/
│   ├── blockchain/                    # Smart Contracts
│   │   ├── contracts/core/           # 9 deployed contracts
│   │   ├── test/hardhat/             # 347 tests (320 passing, 27 pending)
│   │   ├── deployments/
│   │   │   └── basedai-mainnet/      # Nov 6, 2025 deployment
│   │   │       ├── deployment.json   # Contract addresses
│   │   │       └── ...
│   │   └── scripts/                  # Deployment scripts
│   │
│   ├── backend/                       # Backend Services (VPS Deployment)
│   │   ├── services/
│   │   │   ├── event-indexer/        # ✅ Blockchain event indexing
│   │   │   └── websocket-server/     # ✅ Real-time WebSocket updates
│   │   ├── shared/
│   │   │   ├── abis/                 # Contract ABIs
│   │   │   ├── config/               # Contract addresses
│   │   │   └── utils/                # Supabase, Redis, Logger
│   │   ├── ecosystem.config.js       # PM2 production config
│   │   └── .env.example              # Environment template
│   │
│   └── frontend/                      # Next.js 15 App
│       ├── app/                       # App Router
│       │   ├── api/                  # 9 API routes (✅ implemented)
│       │   ├── market/[address]/     # ❌ Missing (to be created)
│       │   └── markets/              # ❌ Missing (to be created)
│       │
│       ├── components/
│       │   ├── admin/                # ✅ 2 panels (existing)
│       │   ├── engagement/           # ❌ Missing (to be created)
│       │   │   ├── CommentForm.tsx
│       │   │   ├── CommentList.tsx
│       │   │   ├── CommentItem.tsx
│       │   │   ├── CommentVoteButtons.tsx
│       │   │   ├── CommentSection.tsx
│       │   │   ├── ProposalVoteButtons.tsx
│       │   │   ├── ResolutionVoteForm.tsx
│       │   │   └── ResolutionVoteDisplay.tsx
│       │   └── ui/                   # Shadcn components
│       │
│       ├── lib/
│       │   ├── api/
│       │   │   └── engagement.ts     # ✅ 8 hooks (391 lines)
│       │   ├── auth/                 # ❌ Missing (to be created)
│       │   │   └── wallet-auth.ts
│       │   ├── hooks/                # ❌ Partial
│       │   │   └── useWalletAuth.ts  # To be created
│       │   ├── contracts/
│       │   │   ├── addresses.ts      # ✅ Correct addresses
│       │   │   └── abis/             # ✅ All ABIs present
│       │   └── db/
│       │       └── prisma.ts         # ✅ Prisma client setup
│       │
│       ├── prisma/
│       │   ├── schema.prisma         # ✅ Complete (6 tables)
│       │   └── migrations/
│       │       └── 20251109045413_init/
│       │           └── migration.sql # ✅ Ready (not applied)
│       │
│       ├── tests/                    # ❌ Empty (to be created)
│       │   ├── api/                  # API integration tests
│       │   └── e2e/                  # Playwright E2E tests
│       │
│       ├── .env.local                # ✅ Contract addresses corrected
│       ├── dev.db                    # ❌ Doesn't exist (to be created)
│       └── package.json
│
├── deployments/
│   └── basedai-mainnet/
│       └── deployment.json           # Source of truth for addresses
│
├── docs/
│   ├── README.md
│   └── reference/
│       ├── CONTRACTS.md
│       ├── API.md
│       └── ARCHITECTURE.md
│
├── CURRENT_STATUS.md                 # ⭐ System state
├── NEXT_STEPS.md                     # ⭐ Implementation roadmap
├── CLAUDE.md                         # ⭐ This file
└── README.md

OFFICIAL ARCHIVE:
/Users/seman/KEKTECH_OFFICIALS/KEKTECH_ARCHIVE_20251109_184834/
├── root-docs/                        # 9 archived root .md files
├── docs-directory/                   # Historical documentation
├── test-reports/                     # Old test outputs
└── metadata/                         # Export info + git history
```

---

## 🔧 DEVELOPMENT WORKFLOW

### Daily Workflow

#### 1. Start of Session
```bash
# Check current system state
cat PROJECT_STATUS.md

# Review immediate next steps
cat PROJECT_STATUS.md | grep -A 20 "Immediate Next Steps"
```

#### 2. During Development
```bash
# Run smart contract tests
cd packages/blockchain
npm test                    # 347 tests, expect 320 passing

# Run frontend in dev mode
cd packages/frontend
npm run dev                 # Runs on http://localhost:3000

# Check database (after Phase 1.1)
sqlite3 dev.db ".tables"    # Should show 6 tables

# Test API endpoints (after Phase 1.1)
curl http://localhost:3000/api/comments/0x123
```

#### 3. After Completing Tasks
```bash
# 1. Update NEXT_STEPS.md
# - Mark task [x] complete
# - Add timestamp: (2025-11-09 HH:MM)
# - Log time: - X minutes

# 2. Update Progress Tracker in NEXT_STEPS.md
# - Update phase percentage
# - Log hours in "Hours Actual" column

# 3. If phase complete, update CURRENT_STATUS.md
# - Update completion percentage
# - Mark phase as complete
# - Update "Current Focus" section
```

#### 4. Reference Archive (If Needed)
```bash
# Search for historical information
cd /Users/seman/KEKTECH_OFFICIALS/KEKTECH_ARCHIVE_20251109_184834/
grep -r "search term" .

# View specific archived file
cat root-docs/MASTER_STATUS.md
```

---

## 📋 IMMEDIATE NEXT STEPS

**See PROJECT_STATUS.md for detailed priority order and success criteria**

### Quick Overview

| Priority | Task | Time | Status |
|----------|------|------|--------|
| **P1** | Environment & Database Setup | 30min | ⏳ Next |
| **P2** | Local Testing & Verification | 1h | ⏳ Pending |
| **P3** | Add Smoke Tests | 1h | ⏳ Pending |
| **P4** | Production Deployment | 30min | ⏳ Pending |

**Total Remaining**: ~3 hours to production-ready

---

## 🧪 TESTING (After Phase 5)

### Smart Contract Tests
```bash
cd packages/blockchain
npm test                    # All Hardhat tests
npm run test:gas           # Gas usage report
npm run coverage           # Coverage report
```

**Current**: 320/347 passing (92.2%)
- 27 tests pending (not failing, just marked as pending)
- 0 actual failures

### API Integration Tests (To Be Created)
```bash
cd packages/frontend
npm run test               # Vitest API tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
```

**Target**: All 9 API routes tested + authentication flow

### E2E Tests (To Be Created)
```bash
cd packages/frontend
npx playwright test                    # All E2E tests
npx playwright test --headed          # With browser visible
npx playwright test --ui              # Interactive UI mode
npx playwright test comment-posting   # Specific test file
```

**Target**: 7 critical user flows covered
- Wallet connection
- Market browsing
- Comment posting
- Comment voting
- Proposal voting
- Resolution voting
- End-to-end: Create → Bet → Comment → Vote

---

## 📊 DEPLOYED CONTRACTS

**Network**: BasedAI Mainnet
**Chain ID**: 32323
**Deployed**: November 6, 2025
**Status**: All verified on explorer

| Contract | Address |
|----------|---------|
| VersionedRegistry | `0x67F8F023f6cFAe44353d797D6e0B157F2579301A` |
| ParameterStorage | `0x0FdcaCE9dEE78c70C92B243346cDf763A06fEdF8` |
| AccessControlManager | `0x4d1afBb8E50e17F24dCbB4Fc3197537be646315A` |
| ResolutionManager | `0x10daF33E321ED8977e369a36FcC6Beb3d3d106a0` |
| RewardDistributor | `0x3D274362423847B53E43a27b9E835d668754C96B` |
| MarketFactory | `0x3eaF643482Fe35d13DB812946E14F5345eb60d62` |
| PredictionMarketTemplate | `0x1064f1FCeE5aA859468559eB9dC9564F0ef20111` |
| CurveRegistry | `0x5AcC0f00c0675975a2c4A54aBcC7826Bd229Ca70` |
| MarketTemplateRegistry | `0x420687494Dad8da9d058e9399cD401Deca17f6bd` |

**Test Market**: `0x31d2BC49A6FD4a066F5f8AC61Acd0E6c9105DD84`

**Source**: `/deployments/basedai-mainnet/deployment.json`

---

## 🚨 CRITICAL RULES

### Documentation Rules
1. **ALWAYS read PROJECT_STATUS.md first** - It's the single source of truth
2. **UPDATE PROJECT_STATUS.md** after major changes with evidence
3. **NEVER create new root .md files** without explicit approval
4. **COMMIT frequently** with descriptive messages
5. **ARCHIVE old docs** to docs/archive/ rather than deleting

### Development Rules
1. **RUN TESTS** before marking any task complete
2. **VERIFY with evidence** - Don't claim something works without testing
3. **USE proper git workflow**:
   ```bash
   git add -A
   git commit -m "feat: Complete Phase X - [Description]

   COMPLETED:
   - Task 1
   - Task 2

   TIME: Xh Ymin

   🤖 Generated with Claude Code
   Co-Authored-By: Claude <noreply@anthropic.com>"
   git push origin main
   ```

### Code Quality Rules
1. **NO authentication bypass** - Must verify wallet signatures
2. **VALIDATE all user input** - Comments, votes, etc.
3. **HANDLE errors gracefully** - Error boundaries, try/catch
4. **USE TypeScript types** - No any types
5. **FOLLOW existing patterns** - Match codebase conventions

### Workflow Rules
1. **ONE PHASE AT A TIME** - Complete phase before starting next
2. **CHECK dependencies** - Some tasks block others (see NEXT_STEPS.md)
3. **MANUAL TESTING** - Test each feature after building
4. **DOCUMENT ISSUES** - If something doesn't work, note it
5. **ASK IF UNCERTAIN** - Better to clarify than assume

---

## 🔗 USEFUL LINKS

### Live System
- **Frontend**: [Pending deployment after UI implementation]
- **Explorer**: https://explorer.bf1337.org
- **Test Market**: https://explorer.bf1337.org/address/0x31d2BC49A6FD4a066F5f8AC61Acd0E6c9105DD84

### Development
- **GitHub**: https://github.com/0xBased-lang/kektechV0.69
- **Official Archive**: /Users/seman/KEKTECH_OFFICIALS/KEKTECH_ARCHIVE_20251109_184834/

### Documentation
- **BasedAI RPC**: https://rpc.basedai.com
- **Chain ID**: 32323
- **Currency**: BASED

---

## 🎯 NEXT IMMEDIATE STEPS

**Status**: Documentation cleanup complete! ✅

### Priority 1: Environment & Database (30 minutes)
```bash
cd packages/frontend

# 1. Verify .env.local has all required variables
cat .env.local

# 2. Generate Prisma client
npx prisma generate

# 3. Apply migrations to Supabase
npx prisma migrate deploy

# 4. Test DB connectivity
# (Create simple test query)
```

### Priority 2: Local Testing (1 hour)
1. Start dev server and verify homepage loads
2. Test wallet connection (MetaMask/WalletConnect)
3. Navigate to test market and verify data loads
4. Test comment posting (with Supabase auth)

### Priority 3: Add Smoke Tests (1 hour)
1. API test: POST comment without auth → 401
2. API test: POST comment with auth → 201
3. E2E test: Wallet connection flow

**See PROJECT_STATUS.md for complete details**

---

## 💡 TIPS & BEST PRACTICES

### For New Contributors
1. Start by reading PROJECT_STATUS.md to understand what exists
2. Check PROJECT_STATUS.md "Immediate Next Steps" to see priorities
3. Don't assume something works - verify with tests
4. Ask questions if documentation is unclear

### For AI Assistants (Claude)
1. Always check PROJECT_STATUS.md before making claims
2. Provide evidence when claiming something is complete (run tests, check files)
3. Update PROJECT_STATUS.md after major changes
4. If files conflict, PROJECT_STATUS.md wins
5. Archive outdated docs instead of deleting them

### For Testing
1. Test locally before claiming complete
2. Write tests as you build (TDD approach)
3. Manual testing is required even with automated tests
4. Document any issues found during testing

---

## 📈 PROGRESS TRACKING

**Check Progress**:
```bash
# Current completion percentage
cat PROJECT_STATUS.md | grep "Overall.*%"

# Current priorities
cat PROJECT_STATUS.md | grep -A 20 "Immediate Next Steps"

# What's complete
cat PROJECT_STATUS.md | grep -A 30 "What's Complete"
```

**Update Progress**:
1. Update PROJECT_STATUS.md after major milestones
2. Provide evidence for completed items (test results, screenshots)
3. Archive old status docs to docs/archive/
4. Commit changes with descriptive messages

---

## 🔍 TROUBLESHOOTING

### Database Issues
```bash
# Database doesn't exist
cd packages/frontend
npx prisma migrate deploy

# Database exists but schema is wrong
npx prisma migrate reset  # WARNING: Deletes data

# Prisma Client not generated
npx prisma generate
```

### Build Issues
```bash
# Clear Next.js cache
rm -rf packages/frontend/.next

# Reinstall dependencies
cd packages/frontend
rm -rf node_modules
npm install
```

### Test Issues
```bash
# Playwright browsers not installed
npx playwright install

# Tests failing due to database
DATABASE_URL="file:./test.db" npm test
```

---

## 📝 COMMIT MESSAGE FORMAT

**Standard Format**:
```
<type>: <subject>

<body>

<footer>
```

**Example**:
```
feat: Complete Phase 2 - Authentication

COMPLETED:
- Created wallet-auth.ts with signature verification
- Implemented useWalletAuth hook
- Updated 5 API routes with auth protection
- All unauthorized requests now return 401

RESULTS:
- Authentication working with MetaMask
- Signature verification via viem working
- API routes secured

TIME: 2.5 hours
NEXT: Phase 3 - Build UI Components

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## ⚖️ CONFLICT RESOLUTION

**If documentation files conflict**:

1. **PROJECT_STATUS.md** > CLAUDE.md > README.md > archived docs
2. Evidence-based claims > assumptions
3. Code reality > documentation claims
4. Latest verification timestamp wins
5. Ask user if genuinely unclear

**If code vs docs conflicts**:

1. Run actual tests to verify reality
2. Update docs to match verified reality
3. Document the discrepancy and investigation findings

---

**Last Verified**: 2025-11-10
**Last Updated**: 2025-11-10 (documentation cleanup)
**Verification Method**: Comprehensive codebase analysis, file inspection, deployment verification

---

*This file contains accurate, evidence-based guidance. All claims verified through direct inspection of code, test results, and file structure. If something seems wrong, verify with PROJECT_STATUS.md.*
- always use supabase cli instead human interaction, whenever is possible and helpful
