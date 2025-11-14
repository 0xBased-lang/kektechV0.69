# KEKTECH 3.0 - Mainnet Frontend Integration

## Repository Information

- **Repository**: `0xBased-lang/kektech-mainnet-frontend` (NEW - Private)
- **Branch**: `main`
- **Base Code**: Complete dApp from `0xBased-lang/kektech-nextjs` (458 files)
- **Purpose**: Build mainnet prediction markets ON TOP of existing dApp
- **Old Repository**: `kektech-nextjs` - Untouched, still exists for reference

## 🚨 CRITICAL: CHECKPOINT COMPLIANCE REQUIRED

**Before starting ANY work**, you MUST:

1. ✅ Read `CHECKPOINT.md` - Master progress tracker
2. ✅ Check current phase status
3. ✅ Verify previous phase is 100% complete
4. ✅ Run validation script: `./scripts/check-phase-complete.sh [prev-phase]`
5. ✅ ONLY proceed if validation passes

**Rule**: You CANNOT skip phases or work ahead!

---

## Quick Start

```bash
# 1. Check current progress
cat CHECKPOINT.md | grep "Current Phase"

# 2. Validate previous phase complete
./scripts/check-phase-complete.sh [prev-phase]

# 3. Start current phase tasks
# (Follow CHECKPOINT.md Phase X tasks)

# 4. Validate phase complete before moving on
./scripts/validate-checkpoint.sh [current-phase]
```

---

## Project Overview

Building KEKTECH 3.0 prediction markets frontend integrating with deployed BasedAI mainnet contracts.

**Current Status**: Repository setup complete ✅ 458 files from old dApp + mainnet integration framework ready

**Deployed Contracts** (Nov 6, 2025):
- VersionedRegistry: `0x67F8F023f6cFAe44353d797D6e0B157F2579301A`
- ParameterStorage: `0x0FdcaCE9dEE78c70C92B243346cDf763A06fEdF8`
- AccessControlManager: `0x4d1afBb8E50e17F24dCbB4Fc3197537be646315A`
- ResolutionManager: `0x10daF33E321ED8977e369a36FcC6Beb3d3d106a0`
- RewardDistributor: `0x3D274362423847B53E43a27b9E835d668754C96B`
- MarketFactory: `0x3eaF643482Fe35d13DB812946E14F5345eb60d62`
- PredictionMarketTemplate: `0x1064f1FCeE5aA859468559eB9dC9564F0ef20111`
- CurveRegistry: `0x5AcC0f00c0675975a2c4A54aBcC7826Bd229Ca70`
- MarketTemplateRegistry: `0x420687494Dad8da9d058e9399cD401Deca17f6bd`

**Test Market**: `0x31d2BC49A6FD4a066F5f8AC61Acd0E6c9105DD84`

**Key Features**:
- 🚀 Fixed gas costs (independent of bet size!)
- 💰 14% savings on subsequent bets
- 🎯 Dynamic minimum bets (0.1-5 BASED)
- 🏗️ 6-state market lifecycle
- ✅ 1000x cheaper than competitors

---

## Documentation Structure

- `CHECKPOINT.md` ⭐ **START HERE** - Master progress tracker
- `CLAUDE.md` ← You are here - Quick reference
- `TESTING_CHECKLIST.md` - Created in Phase 7
- `PRE_PRODUCTION_CHECKLIST.md` - Created in Phase 8
- `BETA_INVITATION.md` - Created in Phase 9
- `LAUNCH_ANNOUNCEMENT.md` - Created in Phase 10

---

## Development Workflow

### 1. Check Current Status

```bash
# View current phase
cat CHECKPOINT.md | head -20

# View progress overview
cat CHECKPOINT.md | grep -A 20 "PROGRESS OVERVIEW"
```

### 2. Validate Before Proceeding

```bash
# Check if previous phase complete
./scripts/check-phase-complete.sh [prev-phase]

# If validation passes:
# ✅ Proceed to next phase

# If validation fails:
# ❌ Complete previous phase first!
```

### 3. Complete Current Phase

```bash
# Follow tasks in CHECKPOINT.md Phase X
# Mark each task complete: - [x]
# Collect evidence as specified
```

### 4. Validate Phase Complete

```bash
# Run validation
./scripts/validate-checkpoint.sh [current-phase]

# If passes:
# ✅ Update CHECKPOINT.md status
# ✅ Move to next phase

# If fails:
# ❌ Fix issues and re-validate
```

---

## Critical Rules

1. ⛔ **NEVER skip a phase** - Each must be 100% complete
2. ⛔ **NEVER mark complete without evidence** - Screenshots/logs required
3. ⛔ **NEVER proceed with failing tests** - All tests must pass
4. ⛔ **NEVER commit without validation** - Git hook will block
5. ✅ **ALWAYS run validation scripts** - Before proceeding to next phase
6. ✅ **ALWAYS collect evidence** - Document everything
7. ✅ **ALWAYS update CHECKPOINT.md** - Keep status current

---

## Gas Costs (From Documentation Analysis)

**Revolutionary Finding**: Gas costs are FIXED regardless of bet size!

- First bet: 1,100,000 gas ($0.00087)
- Subsequent bets: 950,000 gas ($0.00075) - 14% cheaper!
- Cost independence: 1 BASED = same gas as 500 BASED (±1.88% variance)
- vs Polymarket: ~$5 per bet
- **Advantage**: 1000x cheaper!

**Dynamic Minimum Bet**:
- Balanced (0-20% imbalance): 0.1 BASED
- Slightly imbalanced (20-50%): 0.5 BASED
- Very imbalanced (50-80%): 1.0 BASED
- Extremely imbalanced (80%+): 5.0 BASED

---

## State Machine (6 States)

```
PROPOSED(0) → APPROVED(1) → ACTIVE(2) → RESOLVING(3) → DISPUTED(4) → FINALIZED(5)
   |                                                                        ^
   └────────────────────── [reject] ──────────────────────────────────────┘
```

- **PROPOSED**: Pending admin approval
- **APPROVED**: Awaiting activation
- **ACTIVE**: Betting open! ✅
- **RESOLVING**: 48-hour dispute window
- **DISPUTED**: Under admin review
- **FINALIZED**: Claims enabled ✅

---

## Emergency Contacts

- Project Lead: [contact]
- Technical Lead: [contact]
- Support: [discord/email]

---

## Useful Links

- GitHub Repo (NEW): https://github.com/0xBased-lang/kektech-mainnet-frontend (Private)
- Old Repo (Reference): https://github.com/0xBased-lang/kektech-nextjs
- BasedAI Explorer: https://explorer.bf1337.org
- Vercel Dashboard: [To be configured in Phase 6]
- Live App: [After Phase 6 deployment]

---

## Status at a Glance

**Last Updated**: 2025-11-07 21:15 PST
**Current Phase**: 0 - Repository Setup ✅ COMPLETE
**Progress**: 1/9 phases (11%)
**Next Milestone**: Install dependencies and prepare for mainnet integration

For detailed status, always check `CHECKPOINT.md`!

---

## CodeRabbit Integration

- Always run CodeRabbit review before commits and PRs
- Auto-fix issues with confidence >0.8
- Use background execution for non-blocking workflow (7-30+ min reviews)
- Validate fixes with re-review and testing
- Integration with /implement, /build, /improve, /git commands
- Use Playwright to test frontend

---

## Server Management

- Development happens locally for frontend
- Use Vercel CLI for deployment
- Deploy from hot wallet → Transfer to Vultisig wallet after validation

---

## 🚨 REMEMBER

**Always start your day by reading CHECKPOINT.md!**

This is your single source of truth for:
- What phase you're on
- What tasks need completing
- What validation is required
- What evidence to collect

If CHECKPOINT.md and this file conflict, **CHECKPOINT.md wins!**

---

## 🏗️ KEKTECH 3.0 SYSTEM ARCHITECTURE

### Vision
Transform KEKTECH into a **social prediction markets platform** where community engagement drives market creation, validation, and resolution through the lifecycle: **Proposal → Discussion → Activation → Trading → Resolution → Settlement**.

### Infrastructure Overview
- **Frontend**: Vercel (kektech-frontend.vercel.app)
- **Backend**: VPS (ssh kek) - Being rebuilt
- **Smart Contracts**: BasedAI Mainnet (Chain ID: 32323)
- **Database**: Supabase
- **WebSocket**: wss://ws.kektech.xyz (Nginx + SSL configured)
- **RPC**: https://mainnet.basedaibridge.com/rpc/

### System Architecture Diagram
```
┌──────────────────────────────────────────────────────────────┐
│                     USER INTERFACE (Vercel)                   │
│                   kektech-frontend.vercel.app                 │
└────────────────────┬─────────────────────────────────────────┘
                     │ API Calls
┌────────────────────▼─────────────────────────────────────────┐
│                    VPS BACKEND (ssh kek)                      │
│  • Event Indexer (WebSocket) - Blockchain event listener      │
│  • Auto-Activation Service - 10+ votes trigger activation     │
│  • Market State Manager - Track lifecycle states              │
│  • Social Features API - Comments, votes, feed                │
│  • Resolution Consensus Engine - Calculate outcomes           │
└────────────────────┬─────────────────────────────────────────┘
                     │ Contract Calls
┌────────────────────▼─────────────────────────────────────────┐
│               BASEDAI MAINNET CONTRACTS                       │
│  • MarketFactory: 0x3eaF643482Fe35d13DB812946E14F5345eb60d62 │
│  • PredictionMarkets: [Created via factory]                   │
│  • Resolution: Community consensus + admin override           │
└────────────────────┬─────────────────────────────────────────┘
                     │ Data Storage
┌────────────────────▼─────────────────────────────────────────┐
│                    SUPABASE DATABASE                          │
│  • proposal_votes - Track likes/dislikes                      │
│  • comments - Threaded discussions with evidence              │
│  • resolution_votes - Community consensus                     │
│  • activity_feed - Global social activity                     │
└───────────────────────────────────────────────────────────────┘
```

### Market Lifecycle States
```
1. PROPOSED (0) → Market created, awaiting community validation
2. APPROVED (1) → Admin approved, awaiting activation
3. ACTIVE (2)   → Trading open, users can bet
4. RESOLVING (3)→ 48h window for resolution voting
5. DISPUTED (4) → Under admin review
6. FINALIZED (5)→ Settled, winners can claim
```

### VPS Backend Structure (Rebuild in Progress)
```
/var/www/kektech/
├── backend/
│   ├── src/
│   │   ├── services/
│   │   │   ├── event-indexer.js      # Listen to blockchain events
│   │   │   ├── websocket-server.js   # Real-time updates to frontend
│   │   │   ├── auto-activation.js    # Monitor votes, auto-activate at 10+
│   │   │   └── resolution-engine.js  # Calculate consensus from votes
│   │   ├── api/
│   │   │   ├── server.js            # Express API server
│   │   │   ├── routes/
│   │   │   │   ├── proposals.js     # Vote on proposals
│   │   │   │   ├── comments.js      # Discussion threads
│   │   │   │   ├── resolution.js    # Vote on outcomes
│   │   │   │   └── feed.js          # Global activity
│   │   │   └── middleware/
│   │   └── utils/
│   ├── dist/                         # Compiled TypeScript
│   ├── logs/
│   └── package.json
```

### Key Features Implementation

#### Social Validation
- **Upvote Threshold**: 10+ net upvotes trigger auto-activation
- **Vote Type**: Simple like/dislike system
- **Auto-Activation**: VPS cron job checks every 5 minutes

#### UI/UX Design
- **Three-Column Layout**: Left sidebar (navigation), Main content (markets), Right sidebar (global feed)
- **Tab System**: [🔥 HOT] [💡 PROPOSALS] [📈 ACTIVE] [⏳ RESOLVING] [✅ RESOLVED]
- **Mobile Responsive**: Columns stack vertically on mobile

#### Comment System
- **Threaded Comments**: Reddit-style nested discussions
- **Evidence Links**: Attach sources for resolution votes
- **Highlighting**: Most interesting comments featured

### Service Management
```bash
# PM2 Process Management
pm2 start kektech-indexer
pm2 start kektech-websocket
pm2 start auto-activation
pm2 save
pm2 startup

# Nginx Configuration
# Already exists at: /etc/nginx/sites-available/kektech-websocket
# SSL certificates at: /etc/letsencrypt/live/ws.kektech.xyz/
```

### Critical Bug Fixes Needed

#### React Hooks Violations
**Files with illegal hook calls in filters:**
- `components/admin/ActiveMarketsPanel.tsx`
- `components/admin/ProposalManagementPanel.tsx`
- `components/admin/ResolutionControlPanel.tsx`
- `components/admin/MarketOverridePanel.tsx`

**Fix Pattern:**
```typescript
// ❌ WRONG - hooks inside filter
const active = markets.filter(addr => {
  const info = useMarketInfo(addr); // ILLEGAL!
  return info.state === 2;
});

// ✅ CORRECT - hooks at top level
const infos = markets.map(addr => useMarketInfo(addr));
const active = markets.filter((_, i) => infos[i]?.state === 2);
```

### Implementation Timeline

**Phase 1: Infrastructure (Week 1)**
- Rebuild VPS backend
- Fix React hooks violations
- Get markets displaying

**Phase 2: Social Core (Week 2)**
- Proposal voting system
- Auto-activation service
- Basic comments

**Phase 3: Full Social (Week 3)**
- Global activity feed
- Threaded discussions
- Evidence system

**Phase 4: Resolution (Week 4)**
- Community voting
- Consensus engine
- Admin overrides

**Phase 5: Polish (Week 5)**
- Performance optimization
- Mobile UX
- Testing

### Success Metrics
- **Engagement**: 50+ proposals/week, 500+ votes/week
- **Performance**: <2s load time, <100ms WebSocket updates
- **Quality**: 100% mobile responsive, WCAG 2.1 AA compliant
