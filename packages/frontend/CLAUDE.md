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
