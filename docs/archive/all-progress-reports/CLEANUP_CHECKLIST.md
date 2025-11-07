# 🧹 CLEANUP CHECKLIST - Remove AMM Implementation
**Date**: November 3, 2025
**Purpose**: Systematic cleanup of wrong AMM implementation before LMSR implementation

---

## 🔴 FILES TO DELETE - AMM Implementation

### Contract Files (WRONG IMPLEMENTATION)
```bash
# Main contract with AMM logic - DELETE
/expansion-packs/bmad-bonding-curves-v3/contracts/markets/BondingCurveMarket.sol

# Wrong math library - DELETE
/expansion-packs/bmad-bonding-curves-v3/contracts/libraries/DualCurveMath.sol

# Tests for wrong implementation - DELETE
/expansion-packs/bmad-bonding-curves-v3/test/unit/BondingCurveMarket.test.js
/expansion-packs/bmad-bonding-curves-v3/test/unit/DualCurveMath.test.js
/expansion-packs/bmad-bonding-curves-v3/test/integration/BondingCurveSimpleIntegration.test.js

# Deployment script for AMM - DELETE
/expansion-packs/bmad-bonding-curves-v3/scripts/deploy-bonding-curve.js
```

### Documentation Files (OUTDATED/WRONG)
```bash
# Reports about wrong AMM implementation - DELETE ALL
/expansion-packs/bmad-bonding-curves-v3/CRITICAL_BONDING_CURVE_ANALYSIS.md
/expansion-packs/bmad-bonding-curves-v3/AMM_VS_BONDING_CURVE_COMPARISON.md
/expansion-packs/bmad-bonding-curves-v3/DEPLOYMENT_READINESS_REPORT.md
/expansion-packs/bmad-bonding-curves-v3/GAS_ANALYSIS_REPORT.md
/expansion-packs/bmad-bonding-curves-v3/SECURITY_AUDIT_REPORT.md
/expansion-packs/bmad-bonding-curves-v3/INTEGRATION_TEST_RESULTS.md
/expansion-packs/bmad-bonding-curves-v3/FINAL_DOCUMENTATION_UPDATE.md
/expansion-packs/bmad-bonding-curves-v3/CRITICAL_INTEGRATION_REPORT.md
/expansion-packs/bmad-bonding-curves-v3/docs/DUAL_BONDING_CURVE_MATH.md

# Old planning docs (superseded by LMSR_MASTER_PLAN.md) - DELETE
/docs/BONDING_CURVE_COMPLETE_INTEGRATION_PLAN.md
/docs/BONDING_CURVE_FINAL_SUMMARY.md
/docs/BONDING_CURVE_REFINED_ARCHITECTURE_V1.md
/docs/BONDING_CURVE_REFINED_ARCHITECTURE_V2.md
/docs/BONDING_CURVE_REFINED_ARCHITECTURE_V3.md
/docs/BONDING_CURVE_STATUS_SUMMARY.md
/docs/BONDING_CURVE_ULTRA_THOROUGH_SUMMARY.md

# Outdated validation report - DELETE
/FINAL_INTEGRATION_VALIDATION_REPORT.md
```

---

## ✅ FILES TO KEEP

### Important Planning Documents
```bash
# KEEP - Has correct LMSR specification
/BONDING_CURVE_PLANNING_COMPLETE.md

# KEEP - New master plan for LMSR
/LMSR_MASTER_PLAN.md

# KEEP - This cleanup checklist
/CLEANUP_CHECKLIST.md

# KEEP - Search report for reference
/BONDING_CURVE_SEARCH_REPORT.md
```

### Core KEKTECH Files (UNCHANGED)
```bash
# All existing KEKTECH contracts - KEEP ALL
/expansion-packs/bmad-blockchain-dev/contracts/core/*
/expansion-packs/bmad-blockchain-dev/contracts/interfaces/IMarket.sol
/expansion-packs/bmad-blockchain-dev/contracts/markets/ParimutuelMarket.sol
/expansion-packs/bmad-blockchain-dev/contracts/libraries/FeeCalculator.sol

# Project configuration - KEEP
/KEKTECH_3.0_Refined_Blueprint_v1.md
/KEKTECH_3.0_Implementation_Roadmap_v1.1.md
```

---

## 🗂️ DIRECTORY STRUCTURE AFTER CLEANUP

```
kektechbmad100/
├── LMSR_MASTER_PLAN.md              ✅ NEW - Master implementation guide
├── CLEANUP_CHECKLIST.md             ✅ NEW - This file
├── BONDING_CURVE_PLANNING_COMPLETE.md ✅ KEEP - Original correct spec
├── CLAUDE.md                         ✅ UPDATE - Point to LMSR_MASTER_PLAN
├── expansion-packs/
│   ├── bmad-blockchain-dev/         ✅ KEEP - Core KEKTECH
│   │   ├── contracts/               ✅ KEEP - Existing contracts
│   │   ├── test/                    ✅ KEEP - Existing tests
│   │   └── scripts/                 ✅ KEEP - Existing scripts
│   └── bmad-bonding-curves-v3/      ❌ CLEAN - Remove AMM files
│       ├── contracts/               ❌ DELETE all AMM contracts
│       ├── test/                    ❌ DELETE all AMM tests
│       └── scripts/                 ❌ DELETE deployment scripts
└── docs/                             ❌ CLEAN - Remove old planning docs
```

---

## 📝 CLEANUP COMMANDS

### Step 1: Backup Important Files
```bash
# Create backup directory
mkdir -p ~/Desktop/kektechbmad100/backup

# Copy files to keep
cp BONDING_CURVE_PLANNING_COMPLETE.md backup/
cp LMSR_MASTER_PLAN.md backup/
cp CLEANUP_CHECKLIST.md backup/
```

### Step 2: Delete AMM Contract Files
```bash
# Remove wrong contract implementations
rm -f expansion-packs/bmad-bonding-curves-v3/contracts/markets/BondingCurveMarket.sol
rm -f expansion-packs/bmad-bonding-curves-v3/contracts/libraries/DualCurveMath.sol

# Remove wrong tests
rm -f expansion-packs/bmad-bonding-curves-v3/test/unit/BondingCurveMarket.test.js
rm -f expansion-packs/bmad-bonding-curves-v3/test/unit/DualCurveMath.test.js
rm -f expansion-packs/bmad-bonding-curves-v3/test/integration/BondingCurveSimpleIntegration.test.js

# Remove deployment script
rm -f expansion-packs/bmad-bonding-curves-v3/scripts/deploy-bonding-curve.js
```

### Step 3: Delete Outdated Documentation
```bash
# Remove AMM-related reports
rm -f expansion-packs/bmad-bonding-curves-v3/CRITICAL_BONDING_CURVE_ANALYSIS.md
rm -f expansion-packs/bmad-bonding-curves-v3/AMM_VS_BONDING_CURVE_COMPARISON.md
rm -f expansion-packs/bmad-bonding-curves-v3/DEPLOYMENT_READINESS_REPORT.md
rm -f expansion-packs/bmad-bonding-curves-v3/GAS_ANALYSIS_REPORT.md
rm -f expansion-packs/bmad-bonding-curves-v3/SECURITY_AUDIT_REPORT.md
rm -f expansion-packs/bmad-bonding-curves-v3/INTEGRATION_TEST_RESULTS.md
rm -f expansion-packs/bmad-bonding-curves-v3/FINAL_DOCUMENTATION_UPDATE.md
rm -f expansion-packs/bmad-bonding-curves-v3/CRITICAL_INTEGRATION_REPORT.md
rm -f expansion-packs/bmad-bonding-curves-v3/docs/DUAL_BONDING_CURVE_MATH.md

# Remove old planning docs
rm -f docs/BONDING_CURVE_COMPLETE_INTEGRATION_PLAN.md
rm -f docs/BONDING_CURVE_FINAL_SUMMARY.md
rm -f docs/BONDING_CURVE_REFINED_ARCHITECTURE_V*.md
rm -f docs/BONDING_CURVE_STATUS_SUMMARY.md
rm -f docs/BONDING_CURVE_ULTRA_THOROUGH_SUMMARY.md

# Remove validation report
rm -f FINAL_INTEGRATION_VALIDATION_REPORT.md
```

### Step 4: Clean Empty Directories
```bash
# Remove empty directories after cleanup
find expansion-packs/bmad-bonding-curves-v3 -type d -empty -delete
```

---

## ✅ VALIDATION CHECKLIST

### After Cleanup, Verify:
- [ ] No AMM contract files remain
- [ ] No DualCurveMath references exist
- [ ] LMSR_MASTER_PLAN.md is the main reference
- [ ] CLAUDE.md points to LMSR_MASTER_PLAN.md
- [ ] Core KEKTECH contracts untouched
- [ ] Backup created of important files

### Confirm File Count:
```bash
# Should show 0 results
find . -name "*DualCurve*" -type f 2>/dev/null | wc -l

# Should show 0 results
find . -name "*BondingCurveMarket*" -type f 2>/dev/null | wc -l

# Should show LMSR_MASTER_PLAN.md
ls -la | grep LMSR
```

---

## 🎯 NEXT STEPS AFTER CLEANUP

1. **Update CLAUDE.md** to reference LMSR_MASTER_PLAN.md
2. **Start fresh implementation** following LMSR_MASTER_PLAN.md
3. **Create new directory structure** for LMSR implementation
4. **Begin with LMSRMath.sol** library implementation
5. **Follow 10-day implementation timeline**

---

## ⚠️ IMPORTANT NOTES

1. **DO NOT DELETE** core KEKTECH contracts - they are correct
2. **KEEP** BONDING_CURVE_PLANNING_COMPLETE.md - has correct LMSR spec
3. **BACKUP** before deleting anything
4. **VERIFY** cleanup with validation commands
5. **START FRESH** with LMSR implementation after cleanup

---

*Execute this cleanup checklist systematically before starting LMSR implementation.*
*Created with --ultrathink for complete clarity and zero mistakes.*