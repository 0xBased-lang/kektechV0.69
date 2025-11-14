# Scripts Organization

## 📁 Directory Structure

### `/live/` - Production Scripts (Live System Operations)
Scripts for interacting with the LIVE deployed system on BasedAI mainnet.

- `create-market.js` - Create new prediction markets
- `resolve-market.js` - Resolve market outcomes
- `check-market.js` - Check market status
- `monitor.js` - Monitor system health
- `admin-functions.js` - Admin operations

### `/test/` - Testing & Development Scripts
Scripts for testing and development purposes.

- `run-tests.js` - Run specific test suites
- `fork-test.js` - Test on mainnet fork
- `gas-analysis.js` - Analyze gas usage
- `edge-cases.js` - Test edge cases

### `/archive/` - Historical Scripts (No Longer Needed)
Scripts from before the November 6, 2025 mainnet deployment.

#### `/archive/pre-deployment/`
Old deployment scripts that are no longer needed since system is live.

#### `/archive/migration/`
Migration scripts from the architecture transformation (completed).

#### `/archive/old-tests/`
Test scripts for deprecated functionality.

---

## Active Scripts by Category

### Market Operations
- `create-market.js` - Create new markets with parameters
- `check-market-status.js` - Get detailed market information
- `resolve-market.js` - Propose resolution outcome
- `finalize-resolution.js` - Finalize after dispute period

### System Monitoring
- `monitor.js` - Real-time system monitoring
- `check-balance.js` - Check contract balances
- `check-gas-price.js` - Monitor gas prices
- `health-check.js` - System health check

### Testing & Validation
- `test-market-lifecycle.js` - Test complete market flow
- `test-edge-cases.js` - Test edge conditions
- `validate-deployment.js` - Validate live deployment

### Utilities
- `calculate-lmsr-values.js` - LMSR calculations
- `encode-params.js` - Encode function parameters
- `verify-contracts.js` - Verify on explorer

---

## Usage Examples

### Create a Test Market (Short Duration)
```bash
node scripts/live/create-market.js \
  --title "Test Market" \
  --duration 3600 \  # 1 hour
  --resolution 1800 \ # 30 minutes
  --dispute 900       # 15 minutes
```

### Monitor Live System
```bash
node scripts/live/monitor.js --interval 60 --alerts
```

### Check Market Status
```bash
node scripts/live/check-market.js 0x123...abc
```

---

## Script Migration Status

### ✅ Active Scripts (20-30 scripts)
Essential scripts for live system operation and testing.

### ⚠️ To Review (10-20 scripts)
Scripts that might be useful but need review.

### 🗄️ Archived (100+ scripts)
Old scripts from pre-deployment, migration, and deprecated features.

---

## Important Notes

1. **System is LIVE**: Be careful with any script that interacts with mainnet
2. **Use Test Parameters**: For testing, use short durations (hours not days)
3. **Check Gas Prices**: Always check gas prices before bulk operations
4. **Admin Functions**: Require proper role permissions

---

**Last Updated**: November 8, 2025
**Total Scripts**: 133 (20 active, 113 archived)