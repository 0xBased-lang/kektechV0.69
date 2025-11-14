# 🚀 Pre-Deployment Checklist - BasedAI Mainnet

**Date**: _______________
**Operator**: _______________
**Status**: ⬜ Not Started | ⬜ In Progress | ⬜ Complete

---

## ✅ Environment Configuration (Step 1.1)

- [ ] **Hardhat Configuration**
  - [ ] BasedAI mainnet network configured in hardhat.config.js
  - [ ] Chain ID: 32323 verified
  - [ ] RPC endpoint: BASEDAI_MAINNET_RPC set in .env
  - [ ] Private key: PRIVATE_KEY set in .env

- [ ] **Network Connectivity**
  - [ ] RPC endpoint responds to ping
  - [ ] Block number retrieval successful
  - [ ] Network latency < 500ms
  - [ ] No connection errors in 5 test calls

- [ ] **Wallet Connection**
  - [ ] Wallet address: 0x25fD72154857Bd204345808a690d51a61A81EB0b
  - [ ] Wallet connects to BasedAI mainnet
  - [ ] No connection errors

**STOP TRIGGER**: If ANY network connectivity issue, STOP and investigate.

---

## 💰 Wallet & Balance Verification (Step 1.2)

- [ ] **Balance Check**
  - [ ] Current balance: _____________ $BASED
  - [ ] Minimum required: 0.015 $BASED
  - [ ] Buffer (50%): 0.0225 $BASED total
  - [ ] ✅ Balance sufficient (balance ≥ 0.0225 $BASED)

- [ ] **Test Transaction**
  - [ ] Small test transaction sent (0.0001 $BASED)
  - [ ] Transaction confirmed successfully
  - [ ] Gas costs within expected range
  - [ ] No transaction errors

- [ ] **Starting Balance Documentation**
  - [ ] Starting balance recorded: _____________ $BASED
  - [ ] Timestamp recorded: _____________
  - [ ] Block number recorded: _____________

**STOP TRIGGER**: If balance < 0.0225 $BASED, STOP and fund wallet.

---

## 🔧 Contract Compilation Verification (Step 1.3)

- [ ] **Compilation**
  - [ ] All 9 contracts compile without errors
  - [ ] Compilation command: `npx hardhat compile`
  - [ ] No warnings (or all warnings reviewed and acceptable)
  - [ ] Artifacts generated in ./artifacts/

- [ ] **Contract Size Verification**
  - [ ] VersionedRegistry: _____ KB (< 24KB)
  - [ ] ParameterStorage: _____ KB (< 24KB)
  - [ ] AccessControlManager: _____ KB (< 24KB)
  - [ ] ResolutionManager: _____ KB (< 24KB)
  - [ ] RewardDistributor: _____ KB (< 24KB)
  - [ ] FlexibleMarketFactoryUnified: _____ KB (< 24KB)
  - [ ] PredictionMarket: _____ KB (< 24KB)
  - [ ] CurveRegistry: _____ KB (< 24KB)
  - [ ] MarketTemplateRegistry: _____ KB (< 24KB)
  - [ ] ✅ ALL contracts < 24KB

- [ ] **Artifact Verification**
  - [ ] All 9 contract ABI files present
  - [ ] All bytecode files generated
  - [ ] No corruption in artifacts

**STOP TRIGGER**: If ANY contract > 24KB, STOP and optimize.

---

## 📝 Deployment Scripts Preparation (Step 1.4)

- [ ] **Main Deployment Script**
  - [ ] Script exists: `scripts/deploy/basedai-mainnet-ultra-conservative.js`
  - [ ] Script syntax validated
  - [ ] Gas options configured (5M gas limit)
  - [ ] Error handling present
  - [ ] State saving implemented

- [ ] **Registry Configuration Script**
  - [ ] Script exists: `scripts/deploy/configure-basedai-registry.js`
  - [ ] Script syntax validated
  - [ ] 8 contracts to register listed
  - [ ] Error handling present

- [ ] **Test Market Creation Script**
  - [ ] Script exists: `scripts/create-test-market-mainnet.js`
  - [ ] Script syntax validated
  - [ ] Market parameters configured
  - [ ] Error handling present

- [ ] **Monitoring Scripts**
  - [ ] Health check script exists
  - [ ] Gas tracking script exists
  - [ ] State verification script exists

**STOP TRIGGER**: If ANY script missing or has syntax errors, STOP and fix.

---

## 📋 Checklists Preparation (Step 1.5)

- [ ] **Deployment Execution Checklist**
  - [ ] File exists: `docs/deployment/DEPLOYMENT_EXECUTION_CHECKLIST.md`
  - [ ] All 9 deployment steps documented
  - [ ] Validation gates defined
  - [ ] Stop triggers listed

- [ ] **Post-Deployment Validation Checklist**
  - [ ] File exists: `docs/deployment/POST_DEPLOYMENT_VALIDATION_CHECKLIST.md`
  - [ ] 25+ validation checks listed
  - [ ] Success criteria defined
  - [ ] Verification procedures documented

- [ ] **Monitoring Checklist**
  - [ ] File exists: `docs/deployment/MONITORING_CHECKLIST.md`
  - [ ] Hourly/4h/8h schedule defined
  - [ ] Health check procedures listed
  - [ ] Issue escalation path defined

- [ ] **Go/No-Go Decision Checklist**
  - [ ] File exists: `docs/deployment/GO_NOGO_CHECKLIST.md`
  - [ ] All decision criteria listed
  - [ ] Scoring methodology defined
  - [ ] Approval process documented

**STOP TRIGGER**: If ANY checklist missing, STOP and create it.

---

## 🚨 Rollback Procedures Documentation (Step 1.6)

- [ ] **Stop Triggers Documented**
  - [ ] Deployment phase triggers listed (5+)
  - [ ] Validation phase triggers listed (5+)
  - [ ] Monitoring phase triggers listed (5+)
  - [ ] Clear definitions for each trigger

- [ ] **Rollback Procedures**
  - [ ] File exists: `docs/deployment/ROLLBACK_PROCEDURES.md`
  - [ ] Partial deployment recovery steps documented
  - [ ] Emergency contact list included
  - [ ] Escalation tree defined

- [ ] **Issue Classification**
  - [ ] Critical issues defined (deployment stops immediately)
  - [ ] High issues defined (deployment pauses for review)
  - [ ] Medium issues defined (document and continue)
  - [ ] Low issues defined (document only)

**STOP TRIGGER**: If rollback procedures unclear, STOP and document.

---

## 🎯 Final Pre-Deployment Review

- [ ] **All Above Sections Complete**
  - [ ] Environment configuration: ✅
  - [ ] Wallet verification: ✅
  - [ ] Contract compilation: ✅
  - [ ] Scripts preparation: ✅
  - [ ] Checklists preparation: ✅
  - [ ] Rollback procedures: ✅

- [ ] **Team Readiness**
  - [ ] Operator is rested and focused
  - [ ] No time pressure or distractions
  - [ ] Emergency contacts available
  - [ ] Backup operator available (if needed)

- [ ] **Risk Assessment**
  - [ ] All known risks documented
  - [ ] Mitigation strategies in place
  - [ ] Rollback plan understood
  - [ ] Confidence level: _____ /10 (≥8 to proceed)

- [ ] **Final Go/No-Go**
  - [ ] All items above checked ✅
  - [ ] No outstanding concerns
  - [ ] Ready to proceed to deployment
  - [ ] **FINAL DECISION**: ⬜ GO | ⬜ NO-GO

**If NO-GO**: Document reason and required actions before retrying.

---

## 📝 Notes & Issues

**Date/Time**: _____________

**Issues Found**:
1.
2.
3.

**Resolutions**:
1.
2.
3.

**Additional Notes**:


---

**Checklist Completed By**: _______________
**Date/Time**: _______________
**Status**: ⬜ READY TO DEPLOY | ⬜ NOT READY (see notes)
