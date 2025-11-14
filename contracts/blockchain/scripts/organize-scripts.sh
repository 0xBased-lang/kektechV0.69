#!/bin/bash

# Script to organize 133 scripts into categories
# Live operation scripts
mv -n check-admin-roles.js check-balance.js check-basedai-balance.js check-gas-price.js complete-market-lifecycle.js live/ 2>/dev/null
mv -n create-market-1-final.js create-test-market-mainnet.js live/ 2>/dev/null

# Testing scripts  
mv -n end-to-end-demo.js test/ 2>/dev/null
mv -n */test-*.js test/ 2>/dev/null

# Archive old deployment scripts
mv -n deploy-*.js verify-*.js archive/pre-deployment/ 2>/dev/null
mv -n configure-*.js archive/pre-deployment/ 2>/dev/null

# Archive debugging/diagnostic scripts
mv -n diagnose-*.js decode-error.js find-error-selector.js archive/old-tests/ 2>/dev/null

echo "Scripts organized"
