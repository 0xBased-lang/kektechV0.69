# 🚀 PHASE 4 QUICK START GUIDE

**Status**: Ready to Execute
**Duration**: 72 hours
**Objective**: Validate system before public launch

---

## 📋 PREREQUISITES

✅ **System Deployed** - All 9 contracts on BasedAI mainnet
✅ **Registry Configured** - All 8 contracts registered (v1)
✅ **Wallet Funded** - 6,123.88 $BASED available for testing
✅ **No Public Announcement** - Stealth deployment complete

---

## 🎯 WHAT YOU'LL DO (72 Hours)

### Simple Version
1. **Create 6 test markets** (different types)
2. **Place 100+ bets** (various scenarios)
3. **Monitor continuously** (automated + manual)
4. **Validate all edge cases** (50+ scenarios)
5. **Make Go/No-Go decision** (data-driven)

---

## 🚦 QUICK START (5 Steps)

### Step 1: Set Up Monitoring (30 minutes)

```bash
cd expansion-packs/bmad-blockchain-dev

# Install dependencies (if not already)
npm install

# Test monitoring script
npm run monitor:mainnet

# Set up cron job (runs every 15 minutes)
crontab -e

# Add this line:
*/15 * * * * cd /path/to/expansion-packs/bmad-blockchain-dev && npm run monitor:mainnet
```

**Expected Output**:
```
✅ Loaded deployment from basedai-mainnet-deployment.json
📦 Loading contracts...
✅ Contracts loaded

1️⃣  Checking events...
   📊 Events: 0 total (0 markets, 0 bets)
   📊 Error rate: 0.00%
   ✅ Event monitoring: OK

[...more checks...]

📊 MONITORING SUMMARY
✅ Overall Status: HEALTHY
```

---

### Step 2: Create First Test Market (10 minutes)

```bash
# Use the test market creation script
node scripts/create-test-market-mainnet.js

# Follow prompts:
# - Question: "Will Bitcoin reach $100k by end of 2025?"
# - Outcome1: "Yes"
# - Outcome2: "No"
# - Resolution time: 7 days from now
# - Bond amount: 10 $BASED
```

**Expected Output**:
```
✅ Market created: 0xABC123...
✅ Market approved
✅ Market activated
📊 Market is now ACTIVE and accepting bets
```

---

### Step 3: Place Test Bets (20 minutes)

```bash
# Place 10 test bets on your first market
# 5 bets on "Yes", 5 bets on "No"
# Varying amounts: 0.1, 0.5, 1, 5, 10 $BASED

# Use Hardhat console for quick testing
npx hardhat console --network basedai_mainnet

# In console:
const factory = await ethers.getContractAt("FlexibleMarketFactoryUnified", "0x3eaF643482Fe35d13DB812946E14F5345eb60d62");
const market = await ethers.getContractAt("PredictionMarket", "0xYOUR_MARKET_ADDRESS");

// Place a bet
await market.placeBet(1, 0, { value: ethers.parseEther("1.0") });
```

---

### Step 4: Monitor Progress (Continuous)

**Automated** (every 15 minutes):
- Cron job runs monitoring script
- Logs saved to `logs/monitoring/`
- Alerts triggered if issues found

**Manual** (every 4 hours):
```bash
# Run health check
npm run health:check

# View latest results
cat logs/monitoring/monitor-[latest].json | jq '.checks'

# Check specific metrics
cat logs/monitoring/monitor-[latest].json | jq '.checks.lmsrInvariants'
```

**Dashboard** (optional):
- Open `logs/monitoring/` in browser
- Review JSON files for detailed metrics

---

### Step 5: Execute Test Plan (72 hours)

Follow the **6-Market Test Strategy** in `PHASE_4_MONITORING_STRATEGY.md`:

**Day 1** (Hours 0-24):
- ✅ Market 1: Baseline validation
- ✅ Market 2: High activity stress test
- ✅ Market 3: Edge case validation

**Day 2** (Hours 24-48):
- ✅ Market 4: Dispute flow testing
- ✅ Market 5: Long-running market (starts, continues to Day 3)

**Day 3** (Hours 48-72):
- ✅ Market 5: Complete long-running market
- ✅ Market 6: Alternative curve testing (if available)
- ✅ Final validation sweep

---

## 📊 WHAT TO MONITOR

### Critical Metrics (Check Every 4 Hours)

**System Health**:
- ✅ Transaction success rate: 100%
- ✅ State transitions: Working correctly
- ✅ No critical errors

**Gas Costs**:
- ✅ placeBet(): ~100k gas
- ✅ createMarket(): ~687k gas
- ✅ resolveMarket(): ~150k gas
- ✅ Total cost/bet: <$0.0001

**LMSR Validation**:
- ✅ Prices sum to 1.0 (±0.001)
- ✅ Pool balance consistent (<0.01% drift)
- ✅ Share conservation: Exact

---

## 🚨 ALERT CONDITIONS

### Immediate Action Required

**CRITICAL** (Stop everything):
- ❌ State corruption detected
- ❌ Pool imbalance >0.1%
- ❌ LMSR invariant violation
- ❌ Access control breach
- ❌ Transaction success rate <99%

**HIGH** (Investigate within 1 hour):
- ⚠️ Gas costs >150% of estimates
- ⚠️ Error rate >1%
- ⚠️ State transition failures
- ⚠️ Registry issues

**MEDIUM** (Investigate within 4 hours):
- ⚠️ Performance degradation
- ⚠️ Event emission delays
- ⚠️ Minor gas cost increases

---

## ✅ GO/NO-GO DECISION (Hour 72)

### GO Criteria (All Must Be True)

**✅ System Stability**:
- [ ] 72+ hours continuous operation
- [ ] Zero critical failures
- [ ] <1% error rate
- [ ] 100% state transition success

**✅ Validation Complete**:
- [ ] All 6+ test markets executed
- [ ] 50+ edge cases tested
- [ ] 100+ total bets placed
- [ ] All scenarios validated

**✅ Metrics Acceptable**:
- [ ] Gas costs within 10% estimates
- [ ] LMSR invariants hold (100%)
- [ ] Pool balance consistent (<0.01%)
- [ ] Transaction success >99%

**✅ Team Approval**:
- [ ] Monitoring data reviewed
- [ ] Daily reports complete
- [ ] Team confidence ≥95%

### NO-GO Criteria (Any Single Trigger)

**❌ Blockers**:
- Any critical failure
- State corruption
- Security vulnerability
- Gas costs >150% estimates
- <99% transaction success

**⚠️ Warnings** (Extend monitoring):
- <72 hours stable operation
- Medium-severity issues unresolved
- Team confidence <95%

---

## 📁 IMPORTANT FILES

### Documentation
- **Full Strategy**: `PHASE_4_MONITORING_STRATEGY.md` (58 pages, comprehensive)
- **This Guide**: `PHASE_4_QUICK_START_GUIDE.md` (you are here)
- **Deployment Info**: `MAINNET_DEPLOYMENT_CHECKLIST.md`

### Scripts
- **Monitoring**: `scripts/monitor-mainnet.js` (automated health checks)
- **Test Markets**: `scripts/create-test-market-mainnet.js`
- **Edge Cases**: `scripts/edge-case-runner.js` (coming)
- **Health Check**: `scripts/health-check.js` (coming)

### Logs
- **Monitoring Logs**: `logs/monitoring/monitor-*.json`
- **Daily Reports**: `reports/daily-summary-*.md` (coming)
- **Issue Log**: `reports/issue-log.md` (coming)

### Contracts (BasedAI Mainnet)
```
VersionedRegistry:           0x67F8F023f6cFAe44353d797D6e0B157F2579301A
FlexibleMarketFactoryUnified: 0x3eaF643482Fe35d13DB812946E14F5345eb60d62
PredictionMarketTemplate:    0x1064f1FCeE5aA859468559eB9dC9564F0ef20111
[... see basedai-mainnet-deployment.json for all 9]
```

---

## 🎯 SUCCESS INDICATORS

### Healthy System
```
✅ Overall Status: HEALTHY
✅ All checks passing
✅ Gas costs stable
✅ LMSR prices accurate
✅ Pool balance consistent
✅ No alerts or warnings
```

### Degraded System
```
⚠️ Overall Status: DEGRADED
⚠️ Some warnings present
⚠️ Performance issues
⚠️ Minor inconsistencies
→ Investigate and fix
```

### Critical System
```
🚨 Overall Status: CRITICAL
❌ Critical failures detected
❌ Stop all testing
❌ Emergency response required
→ See PHASE_4_MONITORING_STRATEGY.md
```

---

## 🔧 TROUBLESHOOTING

### Monitoring Script Fails
```bash
# Check network connection
curl -X POST https://rpc.basedai.network \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Verify deployment file exists
ls -la basedai-mainnet-deployment.json

# Check contract addresses
node -e "console.log(require('./basedai-mainnet-deployment.json').contracts)"
```

### No Test Markets Created
```bash
# Check if factory is accessible
npx hardhat console --network basedai_mainnet

# In console:
const factory = await ethers.getContractAt("FlexibleMarketFactoryUnified", "0x3eaF643482Fe35d13DB812946E14F5345eb60d62");
console.log("Factory:", factory.target);
```

### Gas Estimation Errors
```bash
# Use higher gas limit
await market.placeBet(1, 0, {
  value: ethers.parseEther("1.0"),
  gasLimit: 150000
});
```

### Can't Place Bets
```bash
# Check market state
const state = await market.currentState();
console.log("State:", state); // Should be 2 (ACTIVE)

# Check if market is activated
const info = await market.getMarketInfo();
console.log("Market info:", info);
```

---

## 📞 SUPPORT & ESCALATION

### Issue Severity

**🔴 CRITICAL** (Immediate):
- Document in `reports/issue-log.md`
- Stop all testing
- Alert team immediately
- Follow emergency procedures

**🟠 HIGH** (1 hour):
- Document in issue log
- Continue monitoring
- Investigate root cause
- Prepare mitigation plan

**🟡 MEDIUM** (4 hours):
- Document in issue log
- Note for review
- Continue testing

**🟢 LOW** (24 hours):
- Document in issue log
- Review in daily summary

---

## 🎉 WHAT'S NEXT

### After 72 Hours (GO Decision)

**Phase 5: Public Launch** (Day 4):
1. Prepare public announcement
2. Update website with contract addresses
3. Enable frontend for public
4. Announce on Twitter/Discord
5. Monitor intensively (first 24h)

**See**: `MAINNET_DEPLOYMENT_CHECKLIST.md` Phase 7

### After 72 Hours (NO-GO Decision)

**Extended Monitoring** (Days 4-7):
1. Address identified issues
2. Deploy fixes (if needed)
3. Re-test affected areas
4. Extend monitoring to 96-120 hours
5. Re-evaluate Go/No-Go criteria

---

## 📝 DAILY TASKS

### Every Morning (9am)
- [ ] Review overnight monitoring logs
- [ ] Check for any alerts or warnings
- [ ] Review daily summary report
- [ ] Plan today's test markets

### Every 4 Hours
- [ ] Run manual health check
- [ ] Review automated monitoring results
- [ ] Validate LMSR invariants
- [ ] Check gas costs

### Every Evening (9pm)
- [ ] Generate daily summary report
- [ ] Document any issues found
- [ ] Update test progress
- [ ] Prepare next day's tasks

---

## 🔗 QUICK LINKS

**Documentation**:
- [Full Monitoring Strategy](PHASE_4_MONITORING_STRATEGY.md)
- [Deployment Checklist](MAINNET_DEPLOYMENT_CHECKLIST.md)
- [Project Overview](CLAUDE.md)

**Scripts**:
```bash
# Monitoring
npm run monitor:mainnet        # Run once
npm run monitor:continuous     # Run every 15min

# Testing
npm run create:market          # Create test market
npm run test:edge-cases        # Run edge case suite
npm run health:check           # Manual health check

# Reports
npm run report:daily           # Generate daily summary
npm run report:final           # Generate final report
```

**Contract Addresses**:
- Factory: `0x3eaF643482Fe35d13DB812946E14F5345eb60d62`
- Registry: `0x67F8F023f6cFAe44353d797D6e0B157F2579301A`
- Template: `0x1064f1FCeE5aA859468559eB9dC9564F0ef20111`

---

**Ready to Start?**

```bash
# Step 1: Set up monitoring
cd expansion-packs/bmad-blockchain-dev
npm run monitor:mainnet

# Step 2: Create first test market
node scripts/create-test-market-mainnet.js

# Step 3: Let the 72-hour validation begin!
```

**Good luck! 🚀**

---

**Document Created**: November 6, 2025
**Status**: Ready for Execution
**Estimated Time**: 72 hours continuous
**Next Milestone**: Go/No-Go Decision (November 9, 2025)
