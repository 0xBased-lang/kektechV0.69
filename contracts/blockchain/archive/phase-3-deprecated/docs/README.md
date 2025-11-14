# ⚠️ DEPRECATED CONTRACTS - DO NOT USE

**Last Updated**: November 7, 2025
**Status**: ARCHIVED - Not meant to compile

---

## 🚨 CRITICAL WARNING

**These contracts are DEPRECATED and archived.**

- ❌ **DO NOT MODIFY** these files
- ❌ **DO NOT IMPORT** from these files
- ❌ **DO NOT DEPLOY** these contracts
- ❌ **DO NOT REFERENCE** in new code

These files are **intentionally broken** and will not compile.

---

## 📁 ARCHIVED CONTRACTS (7 files)

### contracts/

1. **FlexibleMarketFactory.sol** (32KB - Too large)
   - **Reason**: Exceeded 24KB contract size limit
   - **Replaced By**: FlexibleMarketFactoryUnified.sol
   - **Date Archived**: November 7, 2025

2. **FlexibleMarketFactory.sol.backup**
   - **Reason**: Backup of monolithic factory
   - **Replaced By**: FlexibleMarketFactoryUnified.sol
   - **Date Archived**: November 7, 2025

3. **FlexibleMarketFactoryCore.sol** (Split architecture)
   - **Reason**: Replaced by unified factory
   - **Replaced By**: FlexibleMarketFactoryUnified.sol
   - **Date Archived**: November 7, 2025
   - **Note**: Deployed to Sepolia Nov 4th (wrong deployment)

4. **FlexibleMarketFactoryExtensions.sol** (Split architecture)
   - **Reason**: Replaced by unified factory
   - **Replaced By**: FlexibleMarketFactoryUnified.sol
   - **Date Archived**: November 7, 2025
   - **Note**: Deployed to Sepolia Nov 4th (wrong deployment)

5. **MasterRegistry.sol**
   - **Reason**: Replaced by versioned registry
   - **Replaced By**: VersionedRegistry.sol
   - **Date Archived**: November 7, 2025
   - **Note**: Deployed to Sepolia Nov 4th (wrong deployment)

6. **ProposalManager.sol**
   - **Reason**: Feature deferred to V2
   - **Status**: Not needed for V1 launch
   - **Date Archived**: November 7, 2025

7. **ProposalManagerV2.sol**
   - **Reason**: Feature deferred to V2
   - **Status**: Not needed for V1 launch
   - **Date Archived**: November 7, 2025

---

## 📁 ARCHIVED INTERFACES (3 files)

### interfaces/

1. **IMasterRegistry.sol**
   - **Reason**: Replaced by IVersionedRegistry.sol
   - **Date Archived**: November 7, 2025

2. **IProposalManager.sol**
   - **Reason**: Feature deferred to V2
   - **Date Archived**: November 7, 2025

3. **IProposalManagerV2.sol**
   - **Reason**: Feature deferred to V2
   - **Date Archived**: November 7, 2025

---

## 🔒 PROTECTION STATUS

- **Permissions**: Will be set to read-only (chmod 444) on Day 5
- **Git Hook**: Pre-commit hook blocks commits modifying these files
- **CI/CD**: GitHub Actions blocks PRs modifying these files
- **Documentation**: TARGET_ARCHITECTURE.md lists these as forbidden

---

## ⚠️ COMPILATION ERRORS EXPECTED

**Hardhat will show compilation errors for these files. This is NORMAL and EXPECTED.**

Example expected errors:
```
Error HH404: File ../core/PredictionMarket.sol, imported from
contracts/deprecated/contracts/FlexibleMarketFactory.sol, not found.
```

**Why?**
- Deprecated files use relative imports that no longer work after archiving
- We **intentionally** do not fix these imports
- These files are **not meant to compile**
- They are kept for reference only

---

## 📚 IF YOU NEED TO REFERENCE THESE FILES

**Read-only access is fine:**
```bash
# View a deprecated file (read-only)
cat contracts/deprecated/contracts/FlexibleMarketFactory.sol
```

**To use deprecated logic in new code:**
1. **DO NOT** copy-paste from deprecated files
2. **DO** reference the new replacement files
3. **DO** check TARGET_ARCHITECTURE.md for current architecture
4. **DO** follow migration checklist

---

## 🎯 CURRENT ARCHITECTURE (Use These Instead)

**See**: `docs/active/TARGET_ARCHITECTURE.md` for complete list

**7 Core Contracts**:
1. VersionedRegistry.sol ✅
2. FlexibleMarketFactoryUnified.sol ⏳
3. PredictionMarket.sol ⏳
4. ResolutionManager.sol ⏳
5. ParameterStorage.sol ✅
6. RewardDistributor.sol ✅
7. AccessControlManager.sol ✅

---

## ❓ WHY WERE THESE FILES ARCHIVED?

**Phase 4 Deviation** (November 4, 2025):
- Deployed SPLIT architecture (Core + Extensions) to Sepolia
- Should have deployed UNIFIED architecture
- Root cause: Skipped validation, fell back to "safe" split
- Recovery: Complete Phase 4, deploy unified factory

**Migration Strategy**: Minimal Modular Architecture
- 7 core contracts (down from 13)
- Simpler, more maintainable
- Better gas efficiency
- Easier to audit

---

## 📖 RELATED DOCUMENTATION

- Migration Checklist: `docs/migration/MIGRATION_IMPLEMENTATION_CHECKLIST.md`
- Target Architecture: `docs/active/TARGET_ARCHITECTURE.md`
- Compliance Protocol: `CLAUDE.md` (🛡️ MANDATORY section)
- Phase 4 Details: `docs/migration/PHASE_4_FACTORY_UNIFICATION.md`

---

**Last Updated**: November 7, 2025
**Status**: Archived and protected
**Compilation**: Intentionally broken (expected)

🛡️ **PROTECTED**: These files are locked by multiple guardrails. DO NOT MODIFY.
