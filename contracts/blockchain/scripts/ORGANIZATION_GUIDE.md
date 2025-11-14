# Script Organization Guide

## 🎯 Current Situation

You have **133 scripts** that need organization. Most are from pre-deployment development and testing.

## 📋 Recommended Organization Strategy

### Keep These Active (~ 10-15 scripts)

**Live Operations** → Move to `/scripts/live/`:
- `check-admin-roles.js` - Monitor permissions
- `check-balance.js` - Check contract balances
- `check-basedai-balance.js` - Check network balances
- `check-gas-price.js` - Monitor gas
- `complete-market-lifecycle.js` - Test full lifecycle
- `create-test-market-mainnet.js` - Create test markets
- `monitor-mainnet.js` - System monitoring

**Testing** → Move to `/scripts/test/`:
- `end-to-end-demo.js` - E2E demonstration
- Any actively used test scripts

### Archive These (~ 120 scripts)

**Pre-Deployment** → Move to `/scripts/archive/pre-deployment/`:
- All `deploy-*.js` (20+ files) - Deployment is complete!
- All `verify-*.js` (15+ files) - Contracts already verified
- All `configure-*.js` (5+ files) - Configuration done
- All `step*.js` (10+ files) - Step-by-step deployment scripts
- All `redeploy-*.js` (5+ files) - No redeployment needed

**Old Testing/Debug** → Move to `/scripts/archive/old-tests/`:
- All `diagnose-*.js` - Debugging scripts
- All `test-*.js` from root - Old test scripts
- All `validate-*.js` - Validation scripts (already validated)
- All `fix-*.js` - Old fixes
- All `phase*.js` - Phase validation (phases complete)
- `decode-error.js`, `find-error-selector.js` - Debug utilities

## 🚀 Quick Organization Commands

```bash
# From /packages/blockchain/scripts/

# 1. Move live operation scripts
mv check-admin-roles.js check-balance.js check-basedai-balance.js live/
mv check-gas-price.js complete-market-lifecycle.js live/
mv create-test-market-mainnet.js monitor-mainnet.js live/

# 2. Move test scripts
mv end-to-end-demo.js test/

# 3. Archive deployment scripts
mv deploy-*.js archive/pre-deployment/
mv verify-*.js archive/pre-deployment/
mv configure-*.js archive/pre-deployment/
mv step*.js archive/pre-deployment/
mv redeploy-*.js archive/pre-deployment/
mv register-*.js archive/pre-deployment/

# 4. Archive old tests/debug
mv diagnose-*.js archive/old-tests/
mv test-*.js archive/old-tests/
mv validate-*.js archive/old-tests/
mv fix-*.js archive/old-tests/
mv phase*.js archive/old-tests/
mv decode-error.js find-error-selector.js archive/old-tests/
mv investigate-*.js archive/old-tests/
mv manual-*.js archive/old-tests/
mv preflight-*.js archive/old-tests/
mv pre-deployment-*.js archive/old-tests/

# 5. Archive miscellaneous
mv fork-*.js local-*.js archive/old-tests/
mv grant-*.js archive/pre-deployment/
mv finalize-*.js archive/old-tests/
mv force-*.js archive/old-tests/

# 6. Check what's left
ls -1 *.js | wc -l  # Should be ~10-15 scripts
```

## ✅ After Organization

Update `/scripts/README.md` to reflect:
- **Active Scripts**: 10-15 scripts (live operations + testing)
- **Archived Scripts**: 120+ scripts (historical reference)

## 📊 Expected Result

```
scripts/
├── README.md
├── live/                    # 7-10 active production scripts
│   ├── check-balance.js
│   ├── monitor-mainnet.js
│   └── ...
├── test/                    # 3-5 active test scripts
│   └── end-to-end-demo.js
└── archive/                 # 120+ historical scripts
    ├── pre-deployment/      # 60+ deployment scripts
    └── old-tests/           # 60+ debug/test scripts
```

## ⚠️ Important Notes

1. **System is LIVE** - Deployment scripts are historical only
2. **Don't delete** - Archive for reference
3. **Review before moving** - Check if any scripts are actively used
4. **Update README** - Document what you kept and why

---

**Created**: November 8, 2025
**Status**: Ready to execute
**Estimated Time**: 15-30 minutes