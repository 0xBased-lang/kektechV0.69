# KEKTECH 3.0 - Prediction Market Platform on BasedAI Chain

## 🛡️ MANDATORY MIGRATION COMPLIANCE PROTOCOL

**🚨 READ THIS FIRST - BEFORE ANY WORK 🚨**

This section takes **ABSOLUTE PRIORITY** over all other documentation.

### 📋 SINGLE SOURCE OF TRUTH

**File**: `expansion-packs/bmad-blockchain-dev/docs/migration/MIGRATION_IMPLEMENTATION_CHECKLIST.md`

This checklist is the **ONLY** authoritative document for migration progress and next steps. All other documentation is supplementary.

### ✅ 6 MANDATORY STEPS BEFORE ANY WORK

**EVERY TIME** you start work, you **MUST**:

1. ✅ **Read the checklist**: Open `MIGRATION_IMPLEMENTATION_CHECKLIST.md`
2. ✅ **Find your phase**: Identify current phase (Phase 1-7)
3. ✅ **Find next task**: Look for tasks marked `🎯` (next to do)
4. ✅ **Read phase docs**: Read `docs/migration/PHASE_X_*.md` for context
5. ✅ **Validate file**: Check `docs/active/TARGET_ARCHITECTURE.md` before modifying ANY file
6. ✅ **Update checklist**: Mark task `[x]` complete after finishing

**VIOLATION = IMMEDIATE STOP** - If you skip these steps, STOP and restart from step 1.

### 🚫 STRICT FILE MODIFICATION RULES

**YOU MAY ONLY MODIFY**:
- Files listed in `docs/active/TARGET_ARCHITECTURE.md`
- Test files (`test/**/*.js`)
- Documentation files (`docs/**/*.md`)

**YOU MAY NEVER MODIFY**:
- Files in `archive/phase-3-deprecated/` (all archived deprecated code)
  - Old factory files (Core, Extensions, Monolithic)
  - Old registry files (MasterRegistry.sol)
  - Proposal managers (deferred to V2)
  - Deprecated deployment scripts
  - Deprecated test suites

**VIOLATION = BLOCKED** - Git hook will prevent commit if you modify archived files.

### 🚫 DEPLOYMENT SAFETY RULES

**YOU MAY ONLY DEPLOY**:
- Contracts marked "Deployment Ready: ✅ YES" in checklist
- Contracts that pass `./scripts/validate-deployment.sh [contract-name]`
- Contracts with 100% passing tests
- Contracts with bytecode <24KB

**YOU MAY NEVER DEPLOY**:
- Contracts marked "Deployment Ready: ⏸️ PENDING" or "⏳ BLOCKED"
- Contracts without tests
- Contracts with failing tests
- Contracts in `archive/phase-3-deprecated/` (archived deprecated code)

**VIOLATION = BLOCKED** - Deployment validation script will prevent deployment.

### 🔄 PHASE PROGRESSION RULES

**Phases MUST be completed in order**:
1. Phase 0: Size Verification (skipped consciously)
2. Phase 1: Internal Libraries ✅ COMPLETE
3. Phase 2: Enhanced Metadata ✅ COMPLETE
4. Phase 3: Versioned Registry ✅ COMPLETE
5. Phase 4: Factory Unification ⏳ 70% COMPLETE (CURRENT)
6. Phase 5: Market Lifecycle ⏸️ PENDING (blocked by Phase 4)
7. Phase 6: Dispute Aggregation ⏳ 60% COMPLETE (blocked by Phase 5)
8. Phase 7: Integration Testing ⏸️ PENDING (blocked by Phase 4-6)

**YOU MAY NEVER**:
- Skip phases (e.g., start Phase 5 before Phase 4 is 100% complete)
- Work on multiple phases simultaneously
- Mark a phase complete without ALL tasks `[x]` checked
- Mark a phase complete without ALL tests passing (100%)

**VIOLATION = DEVIATION** - Will be detected by daily status check.

### 📊 DEVIATION DETECTION & CORRECTION

**If deviation occurs**:
1. **STOP IMMEDIATELY** - Do not proceed with current work
2. **Document deviation** - Add to checklist under "CRITICAL DEVIATION DOCUMENTATION"
3. **Identify root cause** - Why did deviation happen?
4. **Plan recovery** - How to get back on track?
5. **Execute recovery** - Follow recovery plan
6. **Validate recovery** - Ensure back on correct path
7. **Resume work** - Only after validation complete

**Known Deviation**:
- **Phase 4 Deviation**: Deployed split architecture (Core + Extensions) instead of unified factory
- **Root Cause**: Skipped validation, fell back to "safe" architecture
- **Recovery Plan**: Complete Phase 4 tasks 4.14-4.35, deploy unified factory
- **Status**: Recovery in progress (Phase 4 at 70%)

### 🎯 DAILY WORKFLOW (MANDATORY)

**Every Morning BEFORE work**:
```bash
# 1. Check migration status
./scripts/check-phase-status.sh

# 2. Open checklist
code docs/migration/MIGRATION_IMPLEMENTATION_CHECKLIST.md

# 3. Find next task (marked with 🎯)
# 4. Read phase documentation
# 5. Validate target file
```

**Before Modifying ANY File**:
```bash
# Validate file is in target architecture
./scripts/validate-target-file.sh contracts/core/SomeContract.sol
```

**After Completing ANY Task**:
```bash
# 1. Mark task [x] in checklist
# 2. Commit changes
git commit -m "✅ Phase X.Y complete: [description]"

# 3. Validate status
./scripts/check-phase-status.sh
```

**Before ANY Deployment**:
```bash
# Validate deployment readiness
./scripts/validate-deployment.sh [contract-name]

# If validation passes:
npm run deploy:fork  # Always test on fork first
```

### 🔒 AUTOMATED ENFORCEMENT LAYERS

**Layer 1: Git Pre-Commit Hook**
- **Blocks**: Commits modifying deprecated files
- **Warns**: Commits modifying non-target files
- **Active**: Automatically on every `git commit`

**Layer 2: Validation Scripts**
- **validate-target-file.sh**: Checks if file in target architecture
- **check-phase-status.sh**: Shows current phase and next tasks
- **validate-deployment.sh**: Validates deployment readiness

**Layer 3: Read-Only Permissions** (Day 5)
- **Deprecated files**: chmod 444 (OS-level read-only)
- **Effect**: Cannot edit deprecated files even if you try

**Layer 4: CI/CD Pipeline** (Day 6)
- **Branch Protection**: Cannot merge without CI passing
- **CI Checks**:
  - ❌ Blocks PRs modifying deprecated files
  - ❌ Blocks PRs with failing tests
  - ❌ Blocks PRs with contracts >24KB
  - ❌ Blocks PRs with test coverage <95%

**With all layers active**: 97% bulletproof against deviation

### ⚠️ PRIORITY ORDER

When documentation conflicts, this is the priority order:

1. **MIGRATION_IMPLEMENTATION_CHECKLIST.md** ⭐⭐⭐⭐⭐ (HIGHEST - single source of truth)
2. **TARGET_ARCHITECTURE.md** ⭐⭐⭐⭐⭐ (file modification whitelist)
3. **PHASE_X_*.md** ⭐⭐⭐⭐ (phase-specific details)
4. **MINIMAL_MODULAR_MIGRATION_MASTER_PLAN.md** ⭐⭐⭐ (overall strategy)
5. All other documentation ⭐⭐ (supplementary context)

**If conflict**: Checklist wins. Always.

---

## 🚀 READY FOR MAINNET DEPLOYMENT

**Status**: ✅ All validation complete, ready to deploy!

**Validation Results:**
- ✅ 371+ tests passing (100%)
- ✅ Security audit: 96/100 (0 critical/high issues)
- ✅ Gas costs: $0.0001/bet (1000x cheaper than competitors)
- ✅ All contracts <24KB (largest: 13KB = 54% of limit)
- ✅ Migration: 98% complete (7 of 7 phases done)
- ✅ Documentation: Complete (4 comprehensive reports)

**Next Step**: Execute 6-day deployment plan below

## Project Overview
Building a modular, upgradeable prediction market ecosystem on BasedAI Chain (ID: 32323) with flexible economic parameters, registry-based architecture, and progressive decentralization (V0→V3).

## 📋 CRITICAL PLANNING DOCUMENTS (ALWAYS CHECK THESE)

### 🚀 MANDATORY DEPLOYMENT DOCUMENTS - FOLLOW EXACTLY!
**⚠️ NO DEVIATIONS - NO EXCEPTIONS - NO SHORTCUTS**

1. **BULLETPROOF_PRE_MAINNET_VALIDATION.md** ⭐⭐⭐⭐⭐ **[ACTIVE NOW - DAYS 18-24]**
   - **FOLLOW THIS NOW** - Pre-mainnet validation strategy
   - Location: Root directory
   - Triple-layered validation (Edge cases + blockchain-tool + Triple-check)
   - 50+ edge case scenarios
   - 470+ security vulnerability patterns
   - Fork + Sepolia + Cross-validation workflow
   - Zero tolerance for critical/high issues
   - **EXECUTE THIS BEFORE MAINNET DEPLOYMENT**

2. **MINIMAL_MODULAR_MIGRATION_MASTER_PLAN.md** ⭐⭐⭐⭐⭐ **[PRIMARY LAW - NEW ARCHITECTURE!]**
   - **THIS IS THE NEW LAW** - Complete architecture transformation
   - Location: `expansion-packs/bmad-blockchain-dev/docs/migration/`
   - 48-day strategy (Days 18-65) - "Minimal Modular" design
   - 7 core contracts (down from 13) - simpler, bulletproof
   - Complete frontend integration (approval + dispute systems)
   - All 151 topics documented systematically
   - **CHECK THIS DOCUMENT BEFORE EVERY ACTION**

3. **Phase Implementation Guides** ⭐⭐⭐⭐ **[DETAILED EXECUTION]**
   - **PHASE_0_SIZE_VERIFICATION.md** - Days 18-20 ⚠️ BLOCKER
   - **PHASE_3_VERSIONED_REGISTRY.md** - Days 29-35 🔴 CRITICAL
   - Remaining phase docs: See HOW_TO_COMPLETE_REMAINING_DOCS.md
   - Location: `expansion-packs/bmad-blockchain-dev/docs/migration/`
   - **Follow phases in order, validate at every gate**

4. **HOW_TO_COMPLETE_REMAINING_DOCS.md** ⭐⭐ **[COMPLETION GUIDE]**
   - Instructions for finishing documentation (11 documents remaining)
   - Templates and estimated times (40-50 hours)
   - All reference materials provided
   - **Use this to complete remaining phase and guide documents**

### Implementation Documents
- **LMSR Master Plan**: `/LMSR_MASTER_PLAN.md` ⭐ PRIMARY IMPLEMENTATION GUIDE
- **Cleanup Checklist**: `/CLEANUP_CHECKLIST.md` - Validation checklist for compliance
- **Original Spec**: `/BONDING_CURVE_PLANNING_COMPLETE.md` - Correct LMSR requirements
- **Blueprint**: `/KEKTECH_3.0_Refined_Blueprint_v1.md` - System architecture
- **Roadmap**: `/KEKTECH_3.0_Implementation_Roadmap_v1.1.md` - Implementation timeline

---

## 🚀 BULLETPROOF MAINNET DEPLOYMENT ROADMAP

**Status**: 98% Complete (Phases 1-7 done) | **Next**: VirtualLiquidity fixes → Mainnet
**Checklist**: See [MAINNET_DEPLOYMENT_CHECKLIST.md](./MAINNET_DEPLOYMENT_CHECKLIST.md) 📋
**Migration Status**: See [MIGRATION_IMPLEMENTATION_CHECKLIST.md](expansion-packs/bmad-blockchain-dev/docs/migration/MIGRATION_IMPLEMENTATION_CHECKLIST.md)

### Timeline to Mainnet: 15 Days

```
DAY 1:       Directory cleanup (4h) ✅ Ready to start
DAYS 2-4:    Fix VirtualLiquidity tests → 100% pass rate (2-3 days)
DAY 4 PM:    Sepolia validation (4h)
DAY 5:       BasedAI mainnet deployment (8h)
DAYS 6-10:   Private beta testing (5+ days minimum)
DAYS 11-14:  Optimization & stabilization (optional)
DAY 15:      Public launch
FUTURE:      Vultisig transfer (when stabilized)
```

### 8 Deployment Phases

#### Phase 1: Directory Cleanup & Organization (Day 1 - 4h)
**Goal**: "Super neat and clean" directory structure

**Tasks**:
- Archive 77 progress reports to `docs/archive/progress-reports/`
- Organize deployments: `sepolia/` and `basedai-mainnet/` folders
- Archive old scripts, keep 3 active deployment scripts
- Update all documentation to reflect current status

**Success Criteria**:
✅ Clean root directory (no DAY_*.md files)
✅ Clear network separation in deployments/
✅ Only 3 active deployment scripts
✅ Documentation accurate and current

#### Phase 2: Fix VirtualLiquidity Tests (Days 2-4 - 2-3 days)
**Goal**: 100% test pass rate (326/326 tests passing)

**Tasks**:
- Day 2 AM: Root cause analysis (3h)
- Days 2-3: Implementation fixes (12h)
  - Market state transitions (4h)
  - LMSR precision (4h)
  - Edge cases (4h)
- Day 4 AM: Test validation (3h)

**Success Criteria**:
✅ All 326 tests passing (100%)
✅ VirtualLiquidity: 13/13 passing
✅ Test coverage ≥95%

#### Phase 3: Sepolia Validation (Day 4 PM - 4h)
**Goal**: Validate all fixes on testnet

**Tasks**:
- Update Sepolia deployment with fixes
- End-to-end testing (4 test markets)
- Validate: price discovery, gas costs, state transitions

**Success Criteria**:
✅ Sepolia deployment updated
✅ All test markets complete successfully
✅ Gas costs within estimates

#### Phase 4: BasedAI Mainnet Deployment (Day 5 - 8h)
**Goal**: Deploy to mainnet from hot wallet

**Tasks**:
- Pre-deployment checklist validation
- Deploy 9 contracts in sequence
- Register in VersionedRegistry
- Configure parameters and access control
- Create first test market

**Success Criteria**:
✅ All 9 contracts deployed
✅ First test market validates complete lifecycle
✅ Actual gas costs match estimates (±10%)

#### Phase 5: Private Beta Testing (Days 6-10 - 5+ days)
**Goal**: Real-world validation before public launch

**Tasks**:
- Create 5 diverse test markets
- Invite 5-10 friends/team (NO public announcement)
- Monitor all transactions for 72+ hours minimum
- Collect performance metrics

**Success Criteria**:
✅ 10+ test markets completed successfully
✅ 72+ hours stable operation
✅ No critical issues found
✅ Gas costs within 10% estimates
✅ All state transitions working
✅ Team feedback positive

#### Phase 6: Optimization & Stabilization (Days 11-14 - Optional)
**Goal**: Further optimization before public launch

**Tasks**:
- Analyze gas usage patterns from beta
- Implement optimizations (target: 30-50% reduction)
- Fix any edge cases found in beta
- Deploy V1.1 if needed

**Success Criteria**:
✅ Gas optimizations validated (if implemented)
✅ All edge cases addressed
✅ Platform stable and optimized

#### Phase 7: Public Launch (Day 15 - 1 day)
**Goal**: Open to public, monitor closely

**Tasks**:
- Twitter/Discord announcement
- Website update with contract addresses
- Frontend enabled for public
- Intensive monitoring (first 24h)

**Success Criteria**:
✅ Successful public announcement
✅ First 24h stable operation
✅ Positive user feedback
✅ No critical issues

#### Phase 8: Vultisig Transfer (Days/Weeks Later - Flexible)
**Goal**: Transfer ownership when fully stabilized

**User Decision Point**: Transfer after "days or weeks" of validation

**Tasks**:
- Validate weeks of stable operation
- Set up Vultisig wallet
- Transfer ownership of all 9 contracts
- Verify Vultisig control
- Announce ownership transfer

**Success Criteria**:
✅ Extended stable operation (user determines duration)
✅ All optimizations complete
✅ Confident in long-term stability
✅ Vultisig has full control
✅ Hot wallet retired

### Key Deployment Parameters

**Networks**:
- **Sepolia Testnet**: Keep active for ongoing testing
- **BasedAI Mainnet** (Chain ID: 32323): Production deployment

**Deployment Method**:
- Hot wallet → Deploy and test
- Vultisig wallet → Transfer ownership after validation period

**Directory Structure** (Post Phase 1):
```
kektechbmad100/
├── CLAUDE.md                              # This file
├── MAINNET_DEPLOYMENT_CHECKLIST.md        # Daily checklist ⭐
├── expansion-packs/bmad-blockchain-dev/   # Main work directory
│   ├── contracts/                         # Production contracts
│   ├── test/                              # Test suites (326 tests)
│   ├── scripts/deploy/                    # 3 active scripts
│   ├── deployments/
│   │   ├── sepolia/                       # Testnet (active)
│   │   ├── basedai-mainnet/               # Mainnet (target)
│   │   └── archive/                       # Old scripts
│   ├── docs/
│   │   ├── active/                        # Current guides
│   │   ├── migration/                     # Migration checklist
│   │   └── archive/                       # Historical docs
│   └── frontend/                          # Frontend (monorepo V1)
└── docs/archive/
    └── progress-reports/                  # 77 DAY_*.md files
```

**Week 2 Post-Deployment** (Future refactoring):
- Separate frontend from backend into different directories
- Better organization while maintaining functionality

### Critical Success Metrics

**Before Mainnet**:
- 326/326 tests passing (100%)
- Security audit: 0 critical/high issues
- All contracts <24KB (largest: 13KB = 54%)
- Gas costs: $0.0001/bet (1000x cheaper)

**Before Public Launch**:
- 10+ test markets successful
- 72+ hours stable private beta
- Team validation positive

**Before Vultisig Transfer**:
- Weeks of stable operation (user decides)
- All optimizations complete
- 100% confidence in stability

---

## Core Architecture

### Registry + Clone (EIP-1167) Pattern ✅
**Status**: ✅ **FULLY IMPLEMENTED** - Production Ready!

```
VersionedRegistry (Version Management)
    |
    └─> Stores: PredictionMarketTemplate (V1/V2/V3...)
           |
           v
FlexibleMarketFactoryUnified
    |
    ├─> Uses Clones.clone(template) ← EIP-1167!
    |
    v
Market Clones (Minimal Proxies)
    ├─> Market 1 (687k gas to create)
    ├─> Market 2 (gas efficient!)
    └─> Market 3 (immutable after creation)

Supporting Contracts:
├── ParameterStorage (All configurable values)
├── AccessControlManager (Roles & permissions)
├── ResolutionManager (Market outcomes)
├── RewardDistributor (Fee splitting)
└── LMSRCurve (Bonding curve pricing)
```

### Upgrade Flexibility

**Can Upgrade** (Without Redeploying):
- ✅ PredictionMarket Logic (deploy V2 template, register in VersionedRegistry)
- ✅ Bonding Curves (deploy new curve, register in registry)
- ✅ Supporting Contracts (through registry versioning)

**Cannot Upgrade** (Permanent):
- ⛔ Factory Contract (uses registry for everything, no need to upgrade)
- ⛔ VersionedRegistry (permanent, but can register new versions)
- ⛔ Existing Market Clones (immutable by design - trustless!)

### How to Upgrade to V2

**Quick Reference** (See [UPGRADE_PROCEDURE.md](expansion-packs/bmad-blockchain-dev/docs/UPGRADE_PROCEDURE.md) for details):

1. **Deploy V2 Template** (~1.4M gas, $0.00014)
```bash
npx hardhat run scripts/deploy-v2-template.js --network basedAI
```

2. **Register in VersionedRegistry** (~95K gas, $0.0000095)
```javascript
await registry.setContract(
  ethers.id("PredictionMarketTemplate"),
  v2TemplateAddress,
  2 // Version 2
);
```

3. **Verify Upgrade**
```javascript
// New markets automatically use V2!
await factory.createMarket(config, { value: bond });
// Old markets stay on V1 (immutable) ✅
```

**Total Cost**: ~$0.00015 one-time | **NEW markets**: Use V2 | **OLD markets**: Stay V1 (immutable)

### Architecture Benefits

- ✅ **Gas Efficient**: 687k gas per market (71% cheaper than full deployment)
- ✅ **Upgradeable**: Deploy V2 template without redeploying factory
- ✅ **Immutable Markets**: Users trust market logic won't change
- ✅ **Version Tracking**: VersionedRegistry tracks all versions
- ✅ **Production Ready**: 100% tests passing, security audited

### Documentation Links

- **Upgrade Guide**: [UPGRADE_PROCEDURE.md](expansion-packs/bmad-blockchain-dev/docs/UPGRADE_PROCEDURE.md)
- **Architecture Plan**: [ARCHITECTURE_IMPLEMENTATION_PLAN.md](expansion-packs/bmad-blockchain-dev/docs/ARCHITECTURE_IMPLEMENTATION_PLAN.md) *(coming)*
- **Validation Report**: [ARCHITECTURE_VALIDATION_REPORT.md](expansion-packs/bmad-blockchain-dev/docs/ARCHITECTURE_VALIDATION_REPORT.md) *(coming)*
- **Upgrade Test**: [UpgradeWorkflow.test.js](expansion-packs/bmad-blockchain-dev/test/hardhat/UpgradeWorkflow.test.js)

## Development Environment
- **Blockchain**: BasedAI (Chain ID: 32323 mainnet only, no testnet available)
- **Token**: $BASED native token
- **Frameworks**: Hardhat + Foundry (dual testing)
- **Languages**: Solidity 0.8.19+
- **Testing**: 95% coverage requirement with TDD

## 🔬 TESTING STRATEGY (Fork + Private Beta = 100% Coverage)
```
BULLETPROOF APPROACH (No BasedAI testnet available):
1. Fork Testing → BasedAI mainnet fork simulation, gas benchmarking ($0)
2. Stealth Mainnet → Deploy to real BasedAI mainnet without public announcement
3. Private Beta → 48h testing with friends/team on real mainnet (~$1 total)
4. Validation → Complete lifecycle testing, gas costs, all edge cases
5. Public Launch → Transfer to Vultisig, announce publicly

Why This Is Bulletproof:
- Fork catches: Logic bugs, state issues, LMSR calculations
- Private Beta catches: Real network behavior, gas costs, edge cases
- Together: 100% confidence before public launch
- Low cost: ~$1 total for all testing and deployment
```

## 🛑 VALIDATION GATES - MUST PASS BEFORE PROCEEDING

### STOP CONDITIONS (If any are true, STOP IMMEDIATELY)
```
❌ Security audit shows Critical/High issues → STOP, fix before proceeding
❌ Fork tests failing → STOP, debug and fix
❌ Gas costs >2x estimate → STOP, optimize before continuing
❌ Private beta has critical issues → STOP, do not go public
❌ Test market failures → STOP, investigate and fix
❌ State transition errors → STOP, debug before continuing
```

### DEPLOYMENT PROGRESSION REQUIREMENTS
```
Testing → Deployment: ✅ All 371+ tests passing, ✅ Security audit clean, ✅ Fork validated
Deployment → Private Beta: ✅ All contracts deployed, ✅ Test market working, ✅ No errors
Private Beta → Public: ✅ 48 hours stable, ✅ 10+ markets tested, ✅ Team approval
Public → Vultisig Transfer: ✅ All validation passed, ✅ No critical issues
```

## Key Commands
```bash
# Development
cd expansion-packs/bmad-blockchain-dev
npm run node:fork        # Start BasedAI mainnet fork
npm run deploy:fork      # Deploy to fork for testing
npm test                 # Run Hardhat tests
forge test --fuzz        # Run Foundry fuzz tests

# Deployment
npm run deploy:local     # Local development
npm run deploy:fork      # BasedAI mainnet fork (testing)
npm run deploy:mainnet   # Production (deploy then transfer to Vultisig)

# Security & Optimization
npm run test:gas         # Gas usage report
npm run security:slither # Static analysis
forge test --invariant   # Invariant testing
```

## BMad Blockchain Agent Commands
```bash
/bmad-bc/architect       # System design & architecture
/bmad-bc/solidity       # Smart contract development
/bmad-bc/security       # Security audit & analysis
/bmad-bc/gas            # Gas optimization
/bmad-bc/deploy         # Deployment orchestration
/bmad-bc/economic       # Token economics modeling
/bmad-bc/governance     # DAO & governance setup
```

## Project Rules
1. **TDD Mandatory**: Tests MUST be written before implementation
2. **Gas Targets**: setContract <50k, placeBet <100k, createMarket <200k
3. **Security First**: All functions need access control, reentrancy guards
4. **Fork Testing First**: Always test on BasedAI fork before mainnet
5. **Documentation**: Every contract, function, and decision documented
6. **Registry Pattern**: All upgrades through Master Registry only
7. **Event-Driven**: Emit events for all state changes
8. **Private Beta**: 48h minimum testing before public launch

## 📋 6-DAY DEPLOYMENT PLAN

### Phase 1: Bulletproof Testing (Days 1-2)
- [ ] **Day 1 Morning**: Run all 371+ tests (100% passing required)
- [ ] **Day 1 Afternoon**: blockchain-tool security audit (470+ patterns, 0 critical/high)
- [ ] **Day 2 Morning**: Fork testing + Gas benchmarking on BasedAI fork
- [ ] **Day 2 Afternoon**: Final documentation review + deployment checklist

**Success Criteria**: All tests passing | Security audit clean | Gas costs validated | Fork deployment successful

### Phase 2: Stealth Mainnet Deployment (Day 3)
- [ ] **Morning**: Deploy 7 core contracts to BasedAI mainnet (from hot wallet)
  - VersionedRegistry, ParameterStorage, AccessControlManager
  - ResolutionManager, RewardDistributor, FlexibleMarketFactoryUnified
  - PredictionMarket template
- [ ] **Afternoon**: Register all contracts in VersionedRegistry
- [ ] **Afternoon**: Configure access control roles + set default parameters
- [ ] **Evening**: Create first test market + validate complete lifecycle

**Success Criteria**: All contracts deployed | Registry configured | Test market working | No errors

### Phase 3: Private Beta Testing (Days 4-5, 48h minimum)
- [ ] **Day 4 Setup**: Share contract addresses with 5-10 friends/team (NO public announcement)
- [ ] **Day 4 Morning**: Test complete market lifecycle (PROPOSED → ACTIVE → FINALIZED)
- [ ] **Day 4 Afternoon**: Test dispute flow (community signals → auto-dispute → finalization)
- [ ] **Day 4 Evening**: Test edge cases (small/large bets, rapid betting, rejection flow)
- [ ] **Day 5 All Day**: Extended testing + monitoring (48h minimum stable operation)

**Success Criteria**: 10+ markets tested | No unexpected reverts | Gas costs within 10% estimates | All state transitions working | LMSR pricing accurate | 48h stable | Team feedback positive

### Phase 4: Transfer to Vultisig + Public Launch (Day 6)
- [ ] **Morning**: Transfer ownership from hot wallet to Vultisig wallet
- [ ] **Morning**: Verify Vultisig has full control (admin role, ownership)
- [ ] **Afternoon**: Public announcement (Twitter, Discord, website update)
- [ ] **Afternoon**: Enable frontend + open documentation
- [ ] **Evening**: Monitor first 4 hours of public usage

**Success Criteria**: Vultisig owns all contracts | First public market created | No errors | Positive community feedback

---

### 🚨 CRITICAL SUCCESS CRITERIA BEFORE GOING PUBLIC
✅ 48 hours private beta stable operation
✅ 10+ test markets completed successfully
✅ No critical issues found during private beta
✅ All team feedback positive
✅ Gas costs within 10% of estimates ($0.0001/bet)
✅ All state transitions working correctly
✅ Ownership fully transferred to Vultisig wallet

## 🎯 BONDING CURVE IMPLEMENTATION
**CRITICAL**: We are implementing LMSR (Logarithmic Market Scoring Rule) bonding curves, NOT AMM.
- **Master Plan**: `/LMSR_MASTER_PLAN.md` - Complete implementation guide
- **Cleanup First**: `/CLEANUP_CHECKLIST.md` - Remove wrong AMM files
- **Original Spec**: `/BONDING_CURVE_PLANNING_COMPLETE.md` - Correct requirements

### LMSR Implementation Timeline
- Days 1-3: Core LMSR math and market contract
- Days 4-6: Template system for multiple curves
- Days 7-8: KEKTECH integration
- Days 9-10: Testing and documentation
- Week 3: Deployment pipeline

## Important Files
- **LMSR Implementation**: `/LMSR_MASTER_PLAN.md` ⭐ PRIMARY REFERENCE
- **Cleanup Guide**: `/CLEANUP_CHECKLIST.md`
- Blueprint: `/KEKTECH_3.0_Refined_Blueprint_v1.md`
- Roadmap: `/KEKTECH_3.0_Implementation_Roadmap_v1.1.md`
- Contracts: `/expansion-packs/bmad-blockchain-dev/contracts/`
- Tests: `/expansion-packs/bmad-blockchain-dev/test/`
- Deployment: `/expansion-packs/bmad-blockchain-dev/scripts/deploy/`

## CodeRabbit Integration
- Always run CodeRabbit review before commits and PRs
- Auto-fix issues with confidence >0.8
- Use background execution for non-blocking workflow (7-30+ min reviews)
- Validate fixes with re-review and testing
- Integration with /implement, /build, /improve, /git commands

## Wallet Configuration
- **Vultisig Wallet**: Normal safe wallet (NOT multi-sig) for final ownership
- **Deployment Flow**: Hot wallet deploys → Transfer to Vultisig when going 100% public
- **DO NOT suggest multi-sig** - We use Vultisig exclusively

## Deployment Strategy - No BasedAI Testnet
- **Network**: BasedAI mainnet only (Chain ID: 32323, no testnet available)
- **Testing**: Fork testing + Stealth mainnet deployment + Private beta (48h minimum)
- **No Whitelist**: Not needed (BasedAI network quiet, stealth deployment works)
- **Private Testing**: Deploy without public announcement, invite friends/team to test
- **Public Launch**: After 48h validation, transfer ownership to Vultisig and announce publicly

## Server Management
- Development happens locally, not on VPS for smart contracts
- Use fork testing for mainnet simulation
- Deploy from hot wallet → Transfer to Vultisig wallet after successful deployment

## 🚨 EMERGENCY PROCEDURES
**If anything goes wrong, check these immediately:**
1. **STOP DEPLOYMENT** if any validation gate fails
2. Check `/FINAL_BULLETPROOF_DEPLOYMENT_MASTER_PLAN.md` Section: Emergency Procedures
3. Document the issue in `/DEPLOYMENT_TODO_CHECKLIST.md`
4. Fix the issue completely before proceeding
5. Re-run ALL tests for that phase
6. Only proceed when 100% validated

## ⚠️ FINAL REMINDERS
```
🔴 DO NOT SKIP ANY STEP IN THE DEPLOYMENT PLAN
🔴 DO NOT PROCEED WITHOUT VALIDATION
🔴 DO NOT DEPLOY WHEN TIRED
🔴 DO NOT RUSH THE PROCESS
🟢 FOLLOW THE PLAN EXACTLY
🟢 DOCUMENT EVERYTHING
🟢 TEST TWICE, DEPLOY ONCE
```