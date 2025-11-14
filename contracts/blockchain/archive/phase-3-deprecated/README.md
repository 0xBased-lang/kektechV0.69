# 📦 Phase 3 Deprecated Files Archive

**Last Updated**: November 7, 2025
**Archive Date**: Day 25 of Migration
**Reason**: Minimal Modular Migration (moved to clean architecture)

---

## 🚨 CRITICAL: DO NOT USE THESE FILES

**These files are DEPRECATED and archived for historical reference only.**

- ❌ **DO NOT** import or reference these files
- ❌ **DO NOT** deploy these contracts
- ❌ **DO NOT** modify these files
- ✅ **DO** reference for understanding old architecture
- ✅ **DO** use as documentation of what changed

---

## 📋 ARCHIVED FILES INVENTORY

### Deprecated Contracts (7 files)

**Old Factory Architecture (Replaced by FlexibleMarketFactoryUnified):**
1. `FlexibleMarketFactory.sol` (32KB monolithic - too large)
2. `FlexibleMarketFactory.sol.backup` (backup copy)
3. `FlexibleMarketFactoryCore.sol` (split architecture attempt)
4. `FlexibleMarketFactoryExtensions.sol` (split architecture attempt)

**Old Registry & Proposal Systems (Deferred to V2):**
5. `MasterRegistry.sol` (replaced by VersionedRegistry)
6. `ProposalManager.sol` (V1 - deferred to V2)
7. `ProposalManagerV2.sol` (V2 draft - deferred to V2)

### Deprecated Interfaces (3 files)

1. `IMasterRegistry.sol` (old registry interface)
2. `IProposalManager.sol` (V1 proposal interface)
3. `IProposalManagerV2.sol` (V2 proposal interface)

### Old Deployment Scripts (12 files)

**Day 20-22 Scripts (Pre-Migration):**
- `day20-complete-with-bypass.js`
- `day20-fork-lmsr-complete.js`
- `day21-22-complete-deployment.js`
- `day21-22-simple-test.js`

**Old Multi-Network Deployment:**
- `deploy-multinetwork.js`
- `deploy-fork.js` (replaced by deploy-split-fork.js)
- `deploy-sepolia.js` (replaced by deploy-split-sepolia.js)
- `deploy-sepolia-improved.js`
- `deploy-sepolia-cautious.js`
- `deploy-v0.js`

**Old Test Scripts:**
- `test-library-deployment-fork.js`
- `deploy-fork-from-sepolia.js`

---

## 🔄 MIGRATION TIMELINE

### Phase 3 (Days 18-24): What Changed

**Before (Monolithic):**
```
FlexibleMarketFactory.sol (32KB) → Too large for deployment
├── MasterRegistry dependency
├── Proposal systems embedded
└── All logic in one file
```

**After (Minimal Modular):**
```
7 Core Contracts (<24KB each):
├── VersionedRegistry.sol (registry)
├── FlexibleMarketFactoryUnified.sol (factory)
├── PredictionMarket.sol (markets)
├── ResolutionManager.sol (resolution)
├── ParameterStorage.sol (config)
├── AccessControlManager.sol (permissions)
└── RewardDistributor.sol (fees)

2 Supporting Registries:
├── ContractRegistry.sol (addresses)
└── MetadataRegistry.sol (enhanced metadata)

5 Internal Libraries:
├── LMSRBondingCurve.sol
├── MarketValidation.sol
├── SafeTransfer.sol
├── EventEmission.sol
└── RegistryAccess.sol
```

### Why Files Were Deprecated

| File | Size | Issue | Replacement |
|------|------|-------|-------------|
| FlexibleMarketFactory.sol | 32KB | Too large | FlexibleMarketFactoryUnified.sol (18KB) |
| MasterRegistry.sol | 15KB | Overcomplicated | VersionedRegistry.sol (8KB) |
| ProposalManager*.sol | 20KB | V2 feature | Deferred to V2 |
| Old deploy scripts | N/A | Pre-migration | New split architecture scripts |

---

## 📚 ARCHITECTURE COMPARISON

### Old Architecture (Phase 3)

```
Monolithic Approach:
- 1 large factory (32KB)
- Embedded systems
- Tight coupling
- Hard to test
- Hard to upgrade

Issues:
❌ Deployment size limit exceeded
❌ Tight coupling between components
❌ Difficult to test individual pieces
❌ Upgrade requires full redeployment
❌ High gas costs for complex operations
```

### New Architecture (Phase 4+)

```
Minimal Modular Approach:
- 7 core contracts (<24KB)
- Registry-based coordination
- Loose coupling
- Easy to test
- Easy to upgrade

Benefits:
✅ All contracts <24KB (deployable)
✅ Loose coupling via registries
✅ Unit testable components
✅ Incremental upgrades possible
✅ Optimized gas costs
✅ 5 internal libraries for code reuse
```

---

## 🔍 WHY THIS ARCHIVE EXISTS

### Purpose
1. **Historical Reference**: Understand what was tried and why it didn't work
2. **Learning**: Document the migration journey and decisions
3. **Comparison**: Compare old vs. new approaches
4. **Git Cleanliness**: Keep main branch clean without losing history

### Why NOT in Git History?
- Git history is for version control, not storage
- Active files should be visible in file tree
- Archive provides better documentation
- Easier to reference than digging through git log

---

## 🚀 CURRENT ARCHITECTURE (Day 25)

**Status**: Phase 4 - Factory Unification (70% complete)

**Active Files** (see `docs/active/TARGET_ARCHITECTURE.md`):
```
contracts/core/
├── VersionedRegistry.sol ✅
├── FlexibleMarketFactoryUnified.sol ⏳ (in progress)
├── PredictionMarket.sol ✅
├── ResolutionManager.sol ✅
├── ParameterStorage.sol ✅
├── AccessControlManager.sol ✅
└── RewardDistributor.sol ✅

contracts/libraries/internal/
├── LMSRBondingCurve.sol ✅
├── MarketValidation.sol ✅
├── SafeTransfer.sol ✅
├── EventEmission.sol ✅
└── RegistryAccess.sol ✅

contracts/registries/
├── ContractRegistry.sol ✅
└── MetadataRegistry.sol ✅
```

---

## 📖 RELATED DOCUMENTATION

- **Migration Checklist**: `docs/migration/MIGRATION_IMPLEMENTATION_CHECKLIST.md`
- **Target Architecture**: `docs/active/TARGET_ARCHITECTURE.md`
- **Master Plan**: `docs/migration/MINIMAL_MODULAR_MIGRATION_MASTER_PLAN.md`
- **Phase 4 Guide**: `docs/migration/PHASE_4_FACTORY_UNIFICATION.md`

---

## ⚠️ COMPILATION NOTICE

**These files WILL NOT compile** due to:
- Broken import paths after move
- Missing dependencies
- Outdated interfaces

**This is expected and intentional.** They are archived for reference, not for use.

---

## 🔒 PROTECTION STATUS

- ✅ **Moved to archive/**: Out of Hardhat compilation scope
- ✅ **Git Pre-Commit Hook**: Warns if attempting to modify
- ✅ **CI/CD Checks**: Blocks PRs modifying archived files
- ✅ **Documentation**: Clear warnings not to use

---

## 🎯 NEXT STEPS

If you need to reference these files:
1. Look but don't modify
2. Understand what changed and why
3. Apply learnings to new architecture
4. Reference TARGET_ARCHITECTURE.md for current files

If you think you need to restore a file:
1. ❌ Don't - there's a better way in new architecture
2. ✅ Ask in Discord/issues why you need it
3. ✅ Implement feature in new modular way
4. ✅ Update documentation

---

**Last Review**: Day 25 (November 7, 2025)
**Next Review**: Day 65 (Mainnet Launch)
**Status**: ✅ Complete Archive
