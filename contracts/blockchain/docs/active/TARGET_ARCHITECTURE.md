# 🎯 TARGET ARCHITECTURE - File Modification Whitelist

**Last Updated**: November 7, 2025
**Migration**: Minimal Modular Architecture (7 core + 2 registries + 5 libraries)
**Purpose**: This document lists ALL files that are safe to modify during migration

---

## 🚨 CRITICAL RULES

### ✅ YOU MAY ONLY MODIFY FILES LISTED IN THIS DOCUMENT

### ❌ YOU MAY NEVER MODIFY:
- Files in `archive/phase-3-deprecated/` (archived deprecated code - read-only)
- Any file NOT listed below

### 🔍 BEFORE MODIFYING ANY FILE:
```bash
# Validate file is in this whitelist
./scripts/validate-target-file.sh <filepath>
```

---

## 📦 TARGET ARCHITECTURE

### 7 CORE CONTRACTS (Production Deployment)

These are the ONLY contracts that will be deployed to mainnet (V1).

#### 1. VersionedRegistry.sol ✅ COMPLETE
**Path**: `contracts/core/VersionedRegistry.sol`
**Status**: ✅ Phase 3 Complete - Deployment Ready
**Size**: ~12 KB
**Purpose**: Version tracking and contract registry
**Deployment**: Fork ✅, Sepolia ✅, Mainnet ⏳
**Modifications**: Only bug fixes (no new features in V1)

#### 2. FlexibleMarketFactory.sol or FlexibleMarketFactoryUnified.sol ⏳ IN PROGRESS
**Correct File**: `contracts/core/FlexibleMarketFactoryUnified.sol`
**Status**: ⏳ Phase 4 at 70% - Testing Required
**Size**: Unknown (MUST be <24KB - Phase 4.14)
**Purpose**: Unified market creation with approval system
**Features**:
- Approval system (PROPOSED → APPROVED → ACTIVE)
- Integrated CurveMarketLogic library
- Integrated TemplateMarketLogic library
- Emergency pause mechanism
**Modifications**: Complete Phase 4 tasks (testing, deployment)
**Deployment**: Fork ⏸️, Sepolia ⏸️, Mainnet ⏸️

**⚠️ CRITICAL**:
- DO NOT modify `FlexibleMarketFactoryCore.sol` (deprecated)
- DO NOT modify `FlexibleMarketFactoryExtensions.sol` (deprecated)
- DO NOT modify `FlexibleMarketFactory.sol` (old monolithic - deprecated)
- ONLY modify `FlexibleMarketFactoryUnified.sol`

#### 3. PredictionMarket.sol ⏳ NEEDS UPDATES
**Path**: `contracts/core/PredictionMarket.sol`
**Status**: ⏸️ Phase 5 Required - Lifecycle States Missing
**Size**: ~18 KB
**Purpose**: Binary prediction market logic with LMSR
**Current Features**: Betting, resolution, claiming
**Missing Features**: MarketState enum (Phase 5)
**Modifications**: Add lifecycle states in Phase 5
**Deployment**: Not deployment ready until Phase 5 complete

#### 4. ResolutionManager.sol ⏳ NEEDS COMPLETION
**Path**: `contracts/core/ResolutionManager.sol`
**Status**: ⏳ Phase 6 at 60% - Aggregation Missing
**Size**: ~14 KB
**Purpose**: Market resolution and dispute handling
**Current Features**: Community voting, dispute submission
**Missing Features**: `aggregateCommunityVotes()` (Phase 6)
**Modifications**: Add auto-finalization logic in Phase 6
**Deployment**: Not deployment ready until Phase 6 complete

#### 5. ParameterStorage.sol ✅ COMPLETE
**Path**: `contracts/core/ParameterStorage.sol`
**Status**: ✅ Complete - Deployment Ready
**Size**: ~8 KB
**Purpose**: Centralized parameter management
**Modifications**: Only if parameter updates needed
**Deployment**: Fork ✅, Sepolia ✅, Mainnet ⏳

#### 6. RewardDistributor.sol ✅ COMPLETE
**Path**: `contracts/core/RewardDistributor.sol`
**Status**: ✅ Complete - Deployment Ready
**Size**: ~10 KB
**Purpose**: Fee splitting and reward distribution
**Modifications**: Only bug fixes
**Deployment**: Fork ✅, Sepolia ✅, Mainnet ⏳

#### 7. AccessControlManager.sol ✅ COMPLETE
**Path**: `contracts/core/AccessControlManager.sol`
**Status**: ✅ Complete - Deployment Ready
**Size**: ~6 KB
**Purpose**: Role-based access control
**Modifications**: Only if new roles needed
**Deployment**: Fork ✅, Sepolia ✅, Mainnet ⏳

---

### 2 SUPPORTING REGISTRIES (Production Deployment)

#### 8. CurveRegistry.sol ✅ COMPLETE
**Path**: `contracts/core/CurveRegistry.sol`
**Status**: ✅ Phase 2 Complete - Deployment Ready
**Size**: ~10 KB
**Purpose**: Bonding curve registration with metadata
**Features**: LMSR, Quadratic, Sigmoid curves
**Modifications**: Only if adding new curves
**Deployment**: Fork ✅, Sepolia ✅, Mainnet ⏳

#### 9. MarketTemplateRegistry.sol ✅ COMPLETE
**Path**: `contracts/core/MarketTemplateRegistry.sol`
**Status**: ✅ Phase 2 Complete - Deployment Ready
**Size**: ~10 KB
**Purpose**: Market template registration with metadata
**Features**: Binary, Multi-outcome, Scalar templates
**Modifications**: Only if adding new templates
**Deployment**: Fork ✅, Sepolia ✅, Mainnet ⏳

---

### 5 INTERNAL LIBRARIES (Not Deployed - Linked at Compile Time)

#### 1. CurveMarketLogic.sol ✅ COMPLETE
**Path**: `contracts/libraries/CurveMarketLogic.sol`
**Status**: ✅ Phase 1 Complete
**Size**: ~15 KB (library)
**Purpose**: Bonding curve calculations (LMSR, Quadratic, Sigmoid)
**Modifications**: Only bug fixes or new curve implementations
**Testing**: 50+ tests passing

#### 2. TemplateMarketLogic.sol ✅ COMPLETE
**Path**: `contracts/libraries/TemplateMarketLogic.sol`
**Status**: ✅ Phase 1 Complete
**Size**: ~12 KB (library)
**Purpose**: Market template logic (Binary, Multi, Scalar)
**Modifications**: Only bug fixes or new template implementations
**Testing**: 50+ tests passing

#### 3. SafeMath.sol (If Used) ✅
**Path**: `contracts/libraries/SafeMath.sol`
**Status**: ✅ Standard library
**Modifications**: DO NOT MODIFY (use OpenZeppelin)

#### 4. ReentrancyGuard.sol (If Used) ✅
**Path**: `contracts/libraries/ReentrancyGuard.sol`
**Status**: ✅ Standard library
**Modifications**: DO NOT MODIFY (use OpenZeppelin)

#### 5. Additional Libraries (If Added)
**Path**: `contracts/libraries/*.sol`
**Status**: Add only if required by Phases 4-7
**Modifications**: Must be documented in phase docs

---

### INTERFACES (Always Safe to Modify)

All interface files in `contracts/interfaces/` are safe to modify:

#### Core Interfaces (Production):
- `IVersionedRegistry.sol` ✅
- `IFlexibleMarketFactory.sol` ✅
- `IPredictionMarket.sol` ⏳ (needs MarketState enum in Phase 5)
- `IResolutionManager.sol` ⏳ (needs aggregation function in Phase 6)
- `IParameterStorage.sol` ✅
- `IRewardDistributor.sol` ✅
- `IAccessControlManager.sol` ✅
- `ICurveRegistry.sol` ✅
- `IMarketTemplateRegistry.sol` ✅

#### Library Interfaces:
- `ICurveMarketLogic.sol` ✅
- `ITemplateMarketLogic.sol` ✅

**Modifications**: Always update interfaces when modifying contracts

---

### DEPRECATED FILES (❌ DO NOT MODIFY)

These files are archived and MUST NOT be modified:

#### Deprecated Contracts (in `archive/phase-3-deprecated/contracts/`):
- ❌ `FlexibleMarketFactory.sol` (32KB monolithic - too large)
- ❌ `FlexibleMarketFactoryCore.sol` (split architecture - replaced by unified)
- ❌ `FlexibleMarketFactoryExtensions.sol` (split architecture - replaced by unified)
- ❌ `MasterRegistry.sol` (replaced by VersionedRegistry)
- ❌ `ProposalManager.sol` (deferred to V2)
- ❌ `ProposalManagerV2.sol` (deferred to V2)

#### Deprecated Interfaces (in `archive/phase-3-deprecated/interfaces/`):
- ❌ `IMasterRegistry.sol` (replaced by IVersionedRegistry)
- ❌ `IProposalManager.sol` (deferred to V2)

**Reason**: These files represent the old architecture and were deprecated during migration

**Location**: Moved to `archive/phase-3-deprecated/` for clean separation

**Access**: Out of Hardhat compilation scope - cannot be compiled or deployed

**If you need to reference**: Read-only is fine, but DO NOT MODIFY

---

## 📁 SAFE-TO-MODIFY DIRECTORIES

### ✅ Always Safe:
- `test/**/*.js` - All test files
- `test/**/*.ts` - TypeScript test files
- `docs/**/*.md` - Documentation files
- `scripts/**/*.js` - Utility scripts (NOT deployment scripts)

### ⚠️ Modify with Caution:
- `scripts/deploy/*.js` - Deployment scripts
  - ✅ Safe: Creating NEW deployment scripts
  - ⚠️ Caution: Modifying EXISTING deployment scripts (may break old deployments)
  - ❌ Never: Deleting deployment scripts (archive instead)

### ❌ Never Modify:
- `archive/phase-3-deprecated/**/*` - All archived deprecated code
- `node_modules/` - External dependencies
- `.git/` - Git internal files

---

## 🔍 FILE VALIDATION COMMAND

**Before modifying ANY file, validate it**:

```bash
# Check if file is in target architecture
./scripts/validate-target-file.sh contracts/core/SomeContract.sol

# Expected output if SAFE:
# ✅ SAFE: contracts/core/SomeContract.sol is in target architecture

# Expected output if UNSAFE:
# ❌ BLOCKED: archive/phase-3-deprecated/SomeContract.sol is in archived directory
# ⚠️ WARNING: contracts/core/SomeContract.sol is not in target architecture
```

---

## 📊 DEPLOYMENT READINESS STATUS

| Contract                          | Phase | Ready | Fork | Sepolia | Mainnet |
|-----------------------------------|-------|-------|------|---------|---------|
| VersionedRegistry                 | 3     | ✅     | ✅    | ✅       | ⏳       |
| FlexibleMarketFactoryUnified      | 4     | ⏸️     | ⏸️    | ⏸️       | ⏸️       |
| PredictionMarket                  | 5     | ⏸️     | ⏸️    | ⏸️       | ⏸️       |
| ResolutionManager                 | 6     | ⏸️     | ⏸️    | ⏸️       | ⏸️       |
| ParameterStorage                  | N/A   | ✅     | ✅    | ✅       | ⏳       |
| RewardDistributor                 | N/A   | ✅     | ✅    | ✅       | ⏳       |
| AccessControlManager              | N/A   | ✅     | ✅    | ✅       | ⏳       |
| CurveRegistry                     | 2     | ✅     | ✅    | ✅       | ⏳       |
| MarketTemplateRegistry            | 2     | ✅     | ✅    | ✅       | ⏳       |

**Legend**:
- ✅ Ready: Tests passing, validated, safe to deploy
- ⏸️ Blocked: Phase incomplete, testing required
- ⏳ Pending: Ready for deployment but not yet executed

---

## 🎯 CURRENT FOCUS (Phase 4)

**Primary File**: `contracts/core/FlexibleMarketFactoryUnified.sol`
**Next Task**: Phase 4.14 - Measure bytecode size
**Validation**: MUST be <24KB (24576 bytes)
**Testing**: 50+ tests required before deployment
**Deployment**: After all Phase 4 tasks complete

**Secondary Files** (if needed):
- `contracts/interfaces/IFlexibleMarketFactory.sol` (update if factory changes)
- `test/core/FlexibleMarketFactoryUnified.test.js` (create comprehensive tests)

---

## 📚 RELATED DOCUMENTATION

- **Master Checklist**: `docs/migration/MIGRATION_IMPLEMENTATION_CHECKLIST.md` ⭐⭐⭐⭐⭐
- **Phase 4 Details**: `docs/migration/PHASE_4_FACTORY_UNIFICATION.md` ⭐⭐⭐⭐
- **Compliance Protocol**: `CLAUDE.md` (🛡️ MANDATORY MIGRATION COMPLIANCE PROTOCOL section)

---

## ⚠️ EMERGENCY CONTACTS

**If you're unsure about a file**:
1. Check this document first
2. Run `./scripts/validate-target-file.sh <filepath>`
3. If still unsure, DO NOT MODIFY - ask for clarification

**If you accidentally modified a deprecated file**:
1. STOP immediately
2. Run `git status` to see changes
3. Run `git restore <filepath>` to undo changes
4. Document the incident in checklist
5. Restart with correct file

---

**Last Updated**: November 7, 2025
**Next Review**: After Phase 4 completion
**Owner**: Development Team
**Status**: Active - All files validated

---

🛡️ **PROTECTED**: This whitelist is enforced by:
- Git pre-commit hook (blocks deprecated files)
- Validation scripts (check before modify)
- Read-only permissions (OS-level lock on deprecated/)
- CI/CD pipeline (blocks PRs modifying deprecated files)
