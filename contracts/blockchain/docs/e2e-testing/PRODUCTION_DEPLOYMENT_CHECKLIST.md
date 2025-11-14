# PRODUCTION DEPLOYMENT CHECKLIST

**Step-by-Step Guide to Production Launch**
**Version**: 1.0
**Last Updated**: November 7, 2025
**Status**: READY FOR DEPLOYMENT ✅

---

## PRE-DEPLOYMENT VALIDATION ✅

### System Health Check

- [ ] **Run validation script**
  ```bash
  npx hardhat run scripts/e2e-tests/validate-all-contracts.js --network basedai_mainnet
  ```
  Expected: 96%+ pass rate

- [ ] **Verify factory configuration**
  ```bash
  npx hardhat run scripts/e2e-tests/check-factory-config.js --network basedai_mainnet
  ```
  Expected: defaultCurve = LMSRCurve address (NOT 0x0!)

- [ ] **Check access control**
  ```bash
  npx hardhat run scripts/e2e-tests/check-access-control.js --network basedai_mainnet
  ```
  Expected: All roles granted correctly

### Contract Verification

- [ ] **All contracts deployed** (10 total)
  ```javascript
  VersionedRegistry: "0x6a21b69134c1608c2886059C2C89766b4e316c34"
  ParameterStorage: "0x59ee8B508DCe8Dc4c13e49628E3ecb810F0c7EcA"
  AccessControlManager: "0x4d1afBb8E50e17F24dCbB4Fc3197537be646315A"
  ResolutionManager: "0x10daF33E321ED8977e369a36FcC6Beb3d3d106a0"
  RewardDistributor: "0x5B48eCd4e3dBF9cc9069b7ae646cce01F96Aa877"
  LMSRCurve: "0x04a2B2bDc93d7BF4b1B35f2dAa6afa7f16a6De12"
  FlexibleMarketFactoryUnified: "0x169b4019Fc12c5bD43BFA5d830Fd01A678df6a15"
  PredictionMarketTemplate: "0x76efA0f95ba86d088d3d19b3E1A2ae19a4EF96e0"
  ```

### Production Configuration

- [ ] **Dispute window set to 48 hours**
  ```bash
  # Verify current setting
  npx hardhat run scripts/e2e-tests/check-dispute-window.js --network basedai_mainnet

  # If not 48 hours, restore:
  npx hardhat run scripts/e2e-tests/restore-dispute-window-minimal.js --network basedai_mainnet
  ```

- [ ] **Minimum creator bond configured** (10 BASED typical)
- [ ] **Fee percentages set** (Platform fee, resolver fee, etc.)

---

## PRIVATE BETA DEPLOYMENT (48-72 Hours)

### Day 1: Initial Setup

**Morning (2-3 hours):**

- [ ] **Create test market #1**
  - Question: "Will BTC exceed $100k by Dec 31?"
  - Resolution time: 48 hours from now
  - Creator bond: 10 BASED

- [ ] **Approve and activate market**
  ```javascript
  await factory.adminApproveMarket(marketAddress);
  await factory.activateMarket(marketAddress);
  ```

- [ ] **Verify market state**
  - State should be ACTIVE (2)
  - Betting should be enabled

**Afternoon (1-2 hours):**

- [ ] **Invite 5-10 beta testers**
  - Share contract addresses
  - Provide frontend URL
  - Share gas limit configuration:
  ```javascript
  placeBet.first = 1,100,000
  placeBet.subsequent = 950,000
  ```

- [ ] **Create monitoring dashboard**
  - Track all transactions
  - Monitor gas usage
  - Log any errors

### Day 2: Active Testing

**Test Scenarios:**

- [ ] **Betting tests**
  - [ ] Small bets (0.1 - 1 BASED)
  - [ ] Medium bets (10 - 50 BASED)
  - [ ] Large bets (100 - 500 BASED)
  - [ ] Multiple bets from same user
  - [ ] Bets on both outcomes

- [ ] **Edge case tests**
  - [ ] Minimum bet on balanced market
  - [ ] Minimum bet on imbalanced market (90%+ odds)
  - [ ] Maximum bet (1000 BASED)
  - [ ] Rapid sequential bets

- [ ] **Create additional markets**
  - [ ] Sports outcome
  - [ ] Political event
  - [ ] Crypto price prediction
  - [ ] Custom user-created market

### Day 3: Resolution Testing

**Morning:**

- [ ] **Wait for resolution time**
  - First market should reach resolution time
  - Verify state transitions to ACTIVE → RESOLVING

- [ ] **Propose resolution**
  ```javascript
  await resolutionManager.proposeResolution(marketAddress, outcome, evidence);
  ```

- [ ] **Monitor dispute window**
  - 48-hour window starts
  - Community can signal disagreement
  - Monitor for any disputes

**For Rapid Testing (Optional):**

- [ ] **Temporarily reduce dispute window**
  ```bash
  # Set to 5 minutes for testing
  npx hardhat run scripts/e2e-tests/adjust-dispute-window-minimal.js --network basedai_mainnet

  # After testing, restore to 48 hours
  npx hardhat run scripts/e2e-tests/restore-dispute-window-minimal.js --network basedai_mainnet
  ```

### Day 4: Finalization & Claims

- [ ] **Finalize markets**
  ```javascript
  await resolutionManager.adminResolveMarket(marketAddress, outcome, reason);
  ```

- [ ] **Test claims**
  - [ ] Winners claim winnings
  - [ ] Verify payouts correct
  - [ ] Check gas costs (~250k)

### Success Metrics

**Required for production:**
- [ ] ✅ 10+ markets tested successfully
- [ ] ✅ 48+ hours stable operation
- [ ] ✅ No critical issues found
- [ ] ✅ Gas costs within 10% of estimates
- [ ] ✅ All state transitions working
- [ ] ✅ Positive feedback from testers

---

## PRODUCTION LAUNCH

### Pre-Launch Final Checks

- [ ] **System validation**
  ```bash
  npx hardhat run scripts/e2e-tests/validate-all-contracts.js --network basedai_mainnet
  ```

- [ ] **Dispute window at 48 hours**
- [ ] **All test markets resolved successfully**
- [ ] **No outstanding issues from beta**

### Ownership Transfer

- [ ] **Transfer all contracts to Vultisig wallet**
  ```javascript
  // For each contract:
  await contract.transferOwnership(VULTISIG_ADDRESS);
  ```

- [ ] **Verify Vultisig control**
  - Test admin function from Vultisig
  - Confirm old wallet no longer has access

### Public Announcement

- [ ] **Update website**
  - Add contract addresses
  - Update documentation
  - Enable public access

- [ ] **Social media announcement**
  - Twitter/X post
  - Discord announcement
  - Telegram notification

- [ ] **Create first public markets**
  - High-interest topics
  - Clear resolution criteria
  - Reasonable timelines

### Day 1 Monitoring

**First 4 hours (intensive):**
- [ ] Monitor all transactions
- [ ] Check for reverts
- [ ] Verify gas usage
- [ ] Respond to user issues

**First 24 hours:**
- [ ] Track total volume
- [ ] Monitor unique users
- [ ] Check system performance
- [ ] Gather user feedback

---

## GAS LIMIT CONFIGURATION

### Critical Values for Frontend

```javascript
export const PRODUCTION_GAS_LIMITS = {
    // User Operations - CRITICAL ⭐⭐⭐
    placeBet: {
        first: 1100000,      // First bet on any market
        subsequent: 950000,  // All following bets
    },

    // Market Operations
    createMarket: 750000,
    claimWinnings: 300000,

    // Admin Operations
    adminApproveMarket: 150000,
    activateMarket: 150000,
    proposeResolution: 600000,
    adminResolveMarket: 150000,
};
```

### Network Configuration

```javascript
export const BASEDAI_MAINNET = {
    chainId: 32323,
    rpcUrl: process.env.BASEDAI_RPC_URL,
    gasPrice: ethers.parseUnits("9", "gwei"),
};
```

---

## TROUBLESHOOTING GUIDE

### Common Issues & Solutions

**Issue: Betting fails with "out of gas"**
```javascript
// Solution: Ensure correct gas limits
gasLimit: isFirstBet ? 1100000 : 950000
```

**Issue: Market stuck in PROPOSED state**
```javascript
// Solution: Admin must approve
await factory.adminApproveMarket(marketAddress);
await factory.activateMarket(marketAddress);
```

**Issue: Can't finalize market**
```javascript
// Check dispute window has passed
const disputeWindow = 172800; // 48 hours
const canFinalize = currentTime > resolutionTime + disputeWindow;
```

**Issue: Minimum bet too high**
```javascript
// This is correct behavior for imbalanced markets
// Small bets can't meaningfully affect 99%+ odds
minBet = marketImbalance > 0.9 ? 5.0 : 0.1;
```

---

## POST-LAUNCH MONITORING

### Key Metrics to Track

**Daily:**
- [ ] Total betting volume
- [ ] Number of active markets
- [ ] Unique users
- [ ] Average gas costs
- [ ] Error rate

**Weekly:**
- [ ] Market creation rate
- [ ] Resolution accuracy
- [ ] Dispute frequency
- [ ] User retention
- [ ] Platform fees collected

### Performance Thresholds

**Alert if:**
- Gas usage exceeds estimates by >20%
- Error rate >1%
- Resolution disputes >10%
- User complaints about gas costs

**Critical if:**
- Any security issues
- Markets not resolving
- Claims failing
- Funds locked

---

## ROLLBACK PLAN

### If Critical Issues Found

1. **Pause new market creation**
   ```javascript
   await factory.pauseMarketCreation();
   ```

2. **Complete existing markets**
   - Allow current markets to resolve
   - Process all claims
   - Ensure no funds locked

3. **Fix issues**
   - Identify root cause
   - Deploy fixes
   - Test thoroughly

4. **Resume operations**
   ```javascript
   await factory.unpauseMarketCreation();
   ```

---

## SUCCESS CRITERIA

### Private Beta Success ✅
- 10+ markets completed
- 48+ hours stable
- <1% error rate
- Gas costs ±10% of estimates
- Positive user feedback

### Production Success ✅
- 100+ markets in first week
- 1000+ unique users in first month
- <0.1% error rate
- No security incidents
- Consistent gas costs

---

## CONTACT & SUPPORT

**Technical Issues:**
- Check logs first
- Review error messages
- Consult documentation
- Test with small amounts

**Documentation:**
- `MASTER_E2E_TESTING_REPORT.md` - Complete findings
- `FRONTEND_GAS_INTEGRATION_GUIDE.md` - Frontend integration
- `GAS_ANALYSIS_COMPLETE.md` - Gas details
- `TESTING_ARTIFACTS_INDEX.md` - All test files

---

## FINAL CHECKLIST

### Ready for Private Beta?
- [ ] All contracts deployed ✅
- [ ] Configuration verified ✅
- [ ] Gas limits documented ✅
- [ ] Test scripts ready ✅
- [ ] Monitoring setup ✅

### Ready for Production?
- [ ] Private beta successful
- [ ] All issues resolved
- [ ] Vultisig wallet ready
- [ ] Announcement prepared
- [ ] Team aligned

---

**Status**: READY FOR PRIVATE BETA ✅

**Next Step**: Begin 48-hour private beta testing

**Confidence**: 99% - All systems validated and documented

---

*Deployment checklist complete*
*Follow steps sequentially for smooth launch*
*Total estimated time to production: 4-5 days*