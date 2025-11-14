# Script Inventory and Organization Guide

## Current Status
- Total Scripts: 133
- Organized: 0
- To Review: 133

## Recommended Organization

### Live Operations (Move to `/live/`)
**Market Operations**:
- `complete-market-lifecycle.js` - Full market lifecycle test
- `create-market-1-final.js` - Create market (production)
- `create-test-market-mainnet.js` - Create test market

**System Checks**:
- `check-admin-roles.js` - Check admin permissions
- `check-balance.js` - Check contract balances
- `check-basedai-balance.js` - Check BasedAI balances
- `check-gas-price.js` - Monitor gas prices

### Testing (`/test/`)
- `end-to-end-demo.js` - E2E demo
- All `test-*.js` files in subdirectories

### Archive - Pre-Deployment (`/archive/pre-deployment/`)
**Deployment Scripts** (system is live, these are obsolete):
- All `deploy-*.js` files
- All `verify-*.js` files
- All `configure-*.js` files

**Diagnostic Scripts** (used during development):
- `diagnose-*.js` files
- `decode-error.js`
- `find-error-selector.js`

## Manual Review Needed

Review and categorize these scripts:
./calculate-lmsr-values.js
./check-admin-role.js
./check-admin-roles.js
./check-balance.js
./check-basedai-balance.js
./check-contract-size.js
./check-deployer-match.js
./check-deployer.js
./check-gas-estimate.js
./check-gas-price.js
./check-nonce.js
./check-pending.js
./check-sepolia-balance.js
./complete-configuration.js
./complete-market-lifecycle.js
./configure-mainnet.js
./configure-sepolia.js
./create-market-1-final.js
./create-market-1-fixed.js
./create-market-1-with-curve.js
./create-market-sepolia.js
./create-test-market-mainnet.js
./decode-error.js
./deploy-lmsr-curve.js
./deploy-one-by-one.js
./diagnose-account.js
./diagnose-factory.js
./end-to-end-demo.js
./finalize-proposal-manager.js
./find-error-selector.js
./find-recent-deployments.js
./fix-admin-role.js
./fix-deploy-lmsr-curve.js
./fix-deploy-prediction-market-template.js
./force-deployment.js
./fork-parimutuel-e2e.js
./grant-admin-role.js
./grant-backend-role.js
./investigate-gas.js
./local-parimutuel-e2e.js
./manual-deploy-test.js
./manual-security-test.js
./monitor-mainnet.js
./phase4-validation-final.js
./phase4-validation-gate.js
./pre-deployment-check.js
./preflight-check.js
./redeploy-curve-registry-fixed.js
./register-lmsr-curve-v2.js
./register-lmsr-curve.js
./run-comprehensive-fork-tests.js
./step1-grant-admin-role.js
./step2-register-lmsr-curve.js
./step3-update-versioned-registry.js
./step4-deploy-fixed-factory.js
./step5-create-market-1.js
./step5-create-market-debug.js
./step5-final-market-creation.js
./step5-test-no-curve.js
./step5-trace-revert.js
./test-approve.js
./test-curve-registry.js
./test-deployment.js
./test-keys.js
./test-legacy-tx.js
./test-single-deploy.js
./validate-sepolia-deployment.js
./validate-unified-deployment.js
./validate-virtual-liquidity-mainnet.js
./verify-all-contracts.js
./verify-current-mainnet.js
./verify-existing-deployment.js
./verify-factory-state.js
./verify-mainnet-deployment.js
./verify-market.js
./verify-registry-state.js
./verify-registry.js
./verify-wallet-address.js

## Organization Commands

```bash
# Live operations
mkdir -p live test archive/pre-deployment archive/old-tests

# Move live operation scripts
mv check-admin-roles.js check-balance.js check-basedai-balance.js check-gas-price.js live/
mv complete-market-lifecycle.js create-market-1-final.js create-test-market-mainnet.js live/

# Move test scripts
mv end-to-end-demo.js test/

# Archive deployment scripts
find . -maxdepth 1 -name "deploy-*.js" -exec mv {} archive/pre-deployment/ \;
find . -maxdepth 1 -name "verify-*.js" -exec mv {} archive/pre-deployment/ \;
find . -maxdepth 1 -name "configure-*.js" -exec mv {} archive/pre-deployment/ \;

# Archive diagnostic scripts
mv diagnose-*.js decode-error.js find-error-selector.js archive/old-tests/
```

## After Organization
Update `/scripts/README.md` with actual file counts.
