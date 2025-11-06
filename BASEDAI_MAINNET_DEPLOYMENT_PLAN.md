# 🚀 BasedAI Mainnet Deployment Plan - ULTRA-CONSERVATIVE

**Status**: ✅ READY TO EXECUTE
**Wallet**: 0x25fD...EB0b (6,123.88 $BASED available)
**Risk Approach**: Conservative - STOP if ANY issue occurs
**Timeline**: 72+ hours stealth testing before public launch

---

## 📊 QUICK STATUS

✅ **Preparation Complete**:
- BasedAI mainnet configured in hardhat.config.js
- Wallet verified with 6,123.88 $BASED tokens
- All contracts compile successfully (<24KB)
- Ultra-conservative deployment script created
- Registry configuration script created
- Monitoring scripts created

⏳ **Next Steps**:
1. Run pre-deployment checklist
2. Execute deployment (Phase 2)
3. Configure registry
4. Create test market
5. Monitor for 72+ hours
6. Make go/no-go decision

---

## 📋 PHASE 1: Pre-Deployment (COMPLETE ✅)

### What We've Done:
1. ✅ Created BasedAI mainnet configuration
2. ✅ Verified wallet balance (6,123.88 $BASED)
3. ✅ Compiled all 9 contracts (all <24KB)
4. ✅ Created ultra-conservative deployment script
5. ✅ Created registry configuration script
6. ✅ Created monitoring scripts

### Scripts Created:
- `scripts/check-basedai-balance.js` - Check wallet balance
- `scripts/deploy/basedai-mainnet-ultra-conservative.js` - Main deployment
- `scripts/deploy/configure-basedai-registry.js` - Registry setup
- `docs/deployment/PRE_DEPLOYMENT_CHECKLIST.md` - Pre-flight checks

---

## 🚀 PHASE 2: Deployment Execution

### Pre-Flight Check:
```bash
# 1. Check wallet balance
npx hardhat run scripts/check-basedai-balance.js --network basedai_mainnet

# 2. Verify compilation
npx hardhat compile

# 3. Review deployment script
code scripts/deploy/basedai-mainnet-ultra-conservative.js
```

### Deploy All 9 Contracts:
```bash
npx hardhat run scripts/deploy/basedai-mainnet-ultra-conservative.js --network basedai_mainnet
```

**Expected Duration**: 15-25 minutes (2 confirmations per contract)
**Expected Cost**: ~$5-10

**Deployment Sequence**:
1. VersionedRegistry
2. ParameterStorage (with registry)
3. AccessControlManager (with registry) + Grant ADMIN_ROLE
4. ResolutionManager (with registry, dispute params)
5. RewardDistributor (with registry)
6. FlexibleMarketFactoryUnified (with registry, min bond)
7. PredictionMarket Template
8. CurveRegistry (with registry)
9. MarketTemplateRegistry (with registry)

**STOP TRIGGERS**:
- ❌ ANY deployment fails
- ❌ Gas cost >2x estimate
- ❌ Unexpected errors in logs
- ❌ Block explorer issues
- ❌ Network connectivity problems

**Output**: `basedai-mainnet-deployment.json` with all addresses

---

## 🔧 PHASE 3: Registry Configuration

### Configure VersionedRegistry:
```bash
npx hardhat run scripts/deploy/configure-basedai-registry.js --network basedai_mainnet
```

**Expected Duration**: 10-15 minutes
**Expected Cost**: ~$1-2

**Registration Sequence**:
1. AccessControlManager → v1
2. ResolutionManager → v1
3. ParameterStorage → v1
4. RewardDistributor → v1
5. MarketFactory → v1
6. PredictionMarket → v1
7. CurveRegistry → v1
8. MarketTemplateRegistry → v1

**STOP TRIGGERS**:
- ❌ ANY registration fails
- ❌ Address mismatch
- ❌ Version error
- ❌ Unexpected behavior

**Verification**: All 8 contracts registered at version 1

---

## 🧪 PHASE 4: Initial Validation (Day 1 Evening)

### Create First Test Market:
```bash
npx hardhat run scripts/create-test-market-mainnet.js --network basedai_mainnet
```

**Test Sequence**:
1. Create first test market
2. Verify market state = PROPOSED
3. Place 5 test bets (0.001, 0.01, 0.1 ETH)
4. Verify LMSR pricing working
5. Check gas costs vs Sepolia
6. Run comprehensive health check

**Success Criteria**:
- ✅ Market created successfully
- ✅ 5 bets placed without errors
- ✅ LMSR pricing accurate (±5%)
- ✅ Gas costs within 150% of Sepolia
- ✅ No unexpected behaviors
- ✅ System stable

**STOP TRIGGERS**:
- ❌ Market creation fails
- ❌ Betting fails
- ❌ Pricing incorrect
- ❌ Gas >2x Sepolia
- ❌ ANY unexpected behavior

---

## 📊 PHASE 5: 72-Hour Monitoring (Days 2-4)

### Monitoring Schedule:

**Day 2 (Hours 0-24) - HOURLY checks**:
```bash
# Every hour (12 times):
npx hardhat run scripts/monitor-health.js --network basedai_mainnet
```
- Check market states
- Verify gas costs stable
- Look for errors/warnings
- Test new bet placement

**Day 3 (Hours 24-48) - Every 4 hours**:
```bash
# Every 4 hours (6 times):
npx hardhat run scripts/monitor-health.js --network basedai_mainnet
```
- Check state transitions
- Verify gas trends
- Monitor stability
- Create additional test markets

**Day 4 (Hours 48-72) - Every 8 hours**:
```bash
# Every 8 hours (3 times):
npx hardhat run scripts/monitor-health.js --network basedai_mainnet
```
- Long-term stability check
- Edge case validation
- Final health verification

**STOP TRIGGERS**:
- ❌ ANY critical error
- ❌ System instability
- ❌ Gas cost spikes
- ❌ Data inconsistency
- ❌ Unexpected behaviors

**Success Criteria**:
- ✅ 72+ hours stable operation
- ✅ Zero critical errors
- ✅ Gas costs consistent (±20%)
- ✅ All test markets working
- ✅ LMSR pricing accurate
- ✅ 100% transaction success rate

---

## ✅ PHASE 6: Go/No-Go Decision (Day 4 Evening)

### Decision Criteria (ALL must be YES):

**Stability Metrics**:
- [ ] 72+ hours stable operation
- [ ] Zero critical errors
- [ ] Zero medium errors
- [ ] 100% transaction success rate
- [ ] No unexpected behaviors

**Performance Metrics**:
- [ ] Gas costs within 150% of Sepolia
- [ ] LMSR pricing accurate (±5%)
- [ ] All markets functioning correctly
- [ ] State transitions working

**Confidence Assessment**:
- [ ] System stability: Excellent
- [ ] Gas costs: Acceptable
- [ ] LMSR pricing: Accurate
- [ ] Overall confidence: ≥8/10

**DECISION**:
- ✅ **GO**: All criteria met → Proceed to public launch
- ❌ **NO-GO**: ANY criteria not met → Delay, fix issues, restart monitoring

---

## 🎉 PHASE 7: Public Launch (Day 5+, IF APPROVED)

### Pre-Launch:
1. Update CLAUDE.md with mainnet addresses
2. Create public announcement
3. Prepare documentation
4. Update frontend configuration

### Launch:
1. Post announcement (Twitter/Discord)
2. Update website with addresses
3. Enable frontend
4. Monitor first 24h intensively (every 2h)

### Vultisig Transfer (When Ready):
1. Set up Vultisig wallet (if not done)
2. Transfer ownership of all 9 contracts
3. Verify Vultisig control
4. Test Vultisig admin functions
5. Announce ownership transfer
6. Retire hot wallet

**Timeline**: Flexible - transfer after "days or weeks" of validation

---

## 🚨 ROLLBACK PROCEDURES

### STOP IMMEDIATELY if:

**Deployment Phase**:
- Contract deployment fails
- Verification fails
- Gas costs >2x estimates
- Unexpected errors
- Block explorer issues

**Validation Phase**:
- Market creation fails
- Betting fails
- LMSR pricing incorrect
- Gas costs >2x Sepolia
- ANY unexpected behavior

**Monitoring Phase**:
- Critical errors detected
- System instability
- Data inconsistency
- Gas cost spikes
- User-reported issues

### Recovery Procedure:
1. **STOP** all operations immediately
2. **Document** exact issue encountered
3. **Assess** severity (critical/high/medium)
4. **Review** deployment state (saved in JSON)
5. **Determine** if rollback possible or fix-and-continue
6. **Create** fix plan
7. **Execute** recovery plan
8. **Re-validate** all previous steps

### Partial Deployment Recovery:
- All addresses saved in `basedai-mainnet-deployment.json`
- Use continuation scripts to resume
- Re-validate all previous steps
- Only proceed when 100% confident

---

## 📞 EMERGENCY CONTACTS

**Technical Issues**:
- Review deployment logs
- Check `basedai-mainnet-deployment.json`
- Verify gas settings
- Check network status

**Decision Required**:
- Document issue thoroughly
- Assess risk and impact
- Make conservative decision
- WHEN IN DOUBT: STOP

---

## 💰 COST ESTIMATES

**Deployment Phase**:
- Contract deployment: ~$5-10
- Registry configuration: ~$1-2
- Test market creation: ~$1
- **Total**: ~$7-13

**Testing Phase** (72 hours):
- Additional test markets: ~$5
- Test bets: ~$2-3
- Monitoring operations: ~$1
- **Total**: ~$8-9

**Grand Total**: ~$15-22 (well within 6,123.88 $BASED available)

---

## 📝 KEY FILES

**Deployment Scripts**:
- `scripts/check-basedai-balance.js`
- `scripts/deploy/basedai-mainnet-ultra-conservative.js`
- `scripts/deploy/configure-basedai-registry.js`

**State Files**:
- `basedai-mainnet-deployment.json` (created during deployment)

**Documentation**:
- `docs/deployment/PRE_DEPLOYMENT_CHECKLIST.md`
- This file: `BASEDAI_MAINNET_DEPLOYMENT_PLAN.md`

**Sepolia Reference**:
- `sepolia-deployment-unified.json` (successful deployment)
- All Sepolia test results and metrics

---

## ✅ READY TO EXECUTE

**Pre-Deployment Status**: ✅ COMPLETE
**Wallet Balance**: ✅ 6,123.88 $BASED
**Scripts Ready**: ✅ All created and tested
**Network Config**: ✅ BasedAI mainnet configured
**Confidence Level**: ✅ High (based on Sepolia success)

**Next Action**:
```bash
# Start with pre-deployment checklist review:
code docs/deployment/PRE_DEPLOYMENT_CHECKLIST.md

# When ready, execute deployment:
npx hardhat run scripts/deploy/basedai-mainnet-ultra-conservative.js --network basedai_mainnet
```

---

**Remember**: ULTRA-CONSERVATIVE mode means STOP at ANY issue. Better to be safe and thorough than fast and risky!

🚀 **Ready for mainnet deployment when you are!** 🚀
