# 📋 PHASE 6 INTEGRATION STRATEGY

**Date:** November 7, 2025
**Status:** Planning Phase
**Approach:** Enhance existing ResolutionManager (don't replace)

---

## 🔍 CURRENT STATE ANALYSIS

### Existing ResolutionManager Features (KEEP THESE)
```
✅ resolveMarket() - Resolver sets outcome (1 or 2)
✅ disputeResolution() - Users dispute with bond (requires payment)
✅ resolveDispute() - Admin investigates and resolves
✅ finalizeResolution() - Admin finalizes after dispute window
✅ Batch operations for efficiency
✅ Comprehensive tracking and enumeration
```

**Current Flow:**
```
Resolver calls resolveMarket(outcome, evidence)
    ↓
48-hour dispute window opens
    ↓
User can disputeResolution() with bond
    ↓
Admin investigates → resolveDispute(upheld, newOutcome)
    ↓
Admin finalizeResolution() after window
```

### Phase 6 Requirements (ADD THESE)
```
🆕 proposeResolution() - Propose outcome, open community voting
🆕 submitDisputeSignals() - Backend submits aggregated off-chain votes
🆕 Auto-finalization - >75% agreement → auto-finalize
🆕 Auto-dispute marking - >40% disagreement → mark disputed
🆕 adminResolveMarket() - Admin override for disputed markets
🆕 Configurable agreement/disagreement thresholds
```

**Phase 6 Flow:**
```
Resolver calls proposeResolution(market, outcome)
    ↓
48-hour dispute window opens
    ↓
Users vote off-chain (Supabase)
    ↓
Backend aggregates votes
    ↓
submitDisputeSignals(agreeCount, disagreeCount)
    ↓
IF >75% agree → AUTO-FINALIZE
IF >40% disagree → MARK DISPUTED
ELSE → Wait for window end → Admin resolution
```

---

## 🎯 INTEGRATION STRATEGY

### Approach: COEXISTENCE (Two Dispute Systems)

**System 1: Bond-Based Disputes (EXISTING - KEEP)**
- User pays bond to dispute
- Admin investigates
- Bond refunded if upheld, sent to treasury if rejected

**System 2: Community Voting (PHASE 6 - ADD)**
- Off-chain votes aggregated
- On-chain submission via backend
- Auto-finalization based on consensus
- Admin override for edge cases

**Why Both?**
1. ✅ Backwards compatible - don't break existing functionality
2. ✅ Flexible - different markets can use different systems
3. ✅ Robust - fallback options if one system fails
4. ✅ Progressive - can phase out old system later if desired

---

## 🏗️ IMPLEMENTATION PLAN

### Step 1: Add Data Structures

```solidity
struct CommunityDisputeWindow {
    uint256 startTime;
    uint256 endTime;
    uint256 agreeCount;
    uint256 disagreeCount;
    bool isActive;
    uint8 proposedOutcome;
    bool autoFinalized;
}

mapping(address => CommunityDisputeWindow) private _communityDisputes;

uint256 public agreementThreshold = 75;  // 75% to auto-finalize
uint256 public disagreementThreshold = 40;  // 40% to mark disputed
```

### Step 2: Add proposeResolution()

```solidity
function proposeResolution(address market, uint8 outcome, string calldata evidence)
    external
    onlyResolver
{
    // Call existing resolveMarket() to set outcome
    // (Reuses existing logic!)
    this.resolveMarket(market, outcome, evidence);

    // Open community dispute window
    _communityDisputes[market] = CommunityDisputeWindow({
        startTime: block.timestamp,
        endTime: block.timestamp + _disputeWindow,
        agreeCount: 0,
        disagreeCount: 0,
        isActive: true,
        proposedOutcome: outcome,
        autoFinalized: false
    });

    emit CommunityDisputeWindowOpened(market, outcome, block.timestamp + _disputeWindow);
}
```

### Step 3: Add submitDisputeSignals()

```solidity
function submitDisputeSignals(
    address market,
    uint256 agreeCount,
    uint256 disagreeCount
) external onlyBackend {
    CommunityDisputeWindow storage window = _communityDisputes[market];
    require(window.isActive, "No active community dispute");

    window.agreeCount = agreeCount;
    window.disagreeCount = disagreeCount;

    uint256 total = agreeCount + disagreeCount;
    if (total == 0) return;

    uint256 agreementPercent = (agreeCount * 100) / total;
    uint256 disagreementPercent = (disagreeCount * 100) / total;

    // Auto-finalize if strong agreement (>75%)
    if (agreementPercent >= agreementThreshold) {
        finalizeResolution(market);  // Reuse existing finalization!
        window.isActive = false;
        window.autoFinalized = true;
        emit MarketAutoFinalized(market, window.proposedOutcome);
    }
    // Mark for admin review if strong disagreement (>40%)
    else if (disagreementPercent >= disagreementThreshold) {
        // Update resolution status to need admin attention
        ResolutionData storage resolution = _resolutions[market];
        resolution.status = ResolutionStatus.DISPUTED;
        window.isActive = false;
        emit CommunityDisputeFlagged(market, disagreementPercent);
    }

    emit DisputeSignalsSubmitted(market, agreeCount, disagreeCount);
}
```

### Step 4: Add adminResolveMarket()

```solidity
function adminResolveMarket(
    address market,
    uint8 newOutcome,
    string calldata reason
) external onlyAdmin {
    ResolutionData storage resolution = _resolutions[market];

    // Update outcome
    resolution.outcome = newOutcome;
    resolution.status = ResolutionStatus.RESOLVED;

    // Close community dispute window if active
    if (_communityDisputes[market].isActive) {
        _communityDisputes[market].isActive = false;
    }

    // Finalize immediately
    resolution.status = ResolutionStatus.FINALIZED;

    emit AdminResolution(market, newOutcome, reason);
    emit ResolutionFinalized(market, newOutcome, block.timestamp);
}
```

### Step 5: Add Threshold Configuration

```solidity
function setAgreementThreshold(uint256 threshold) external onlyAdmin {
    require(threshold > 50 && threshold <= 100, "Invalid threshold");
    agreementThreshold = threshold;
    emit AgreementThresholdUpdated(threshold);
}

function setDisagreementThreshold(uint256 threshold) external onlyAdmin {
    require(threshold > 0 && threshold < 50, "Invalid threshold");
    disagreementThreshold = threshold;
    emit DisagreementThresholdUpdated(threshold);
}
```

---

## 🧪 TESTING STRATEGY

### Test Categories (30+ tests)

**1. Community Dispute Window (6 tests)**
- Open window when resolution proposed
- Set correct end time (48 hours default)
- Prevent duplicate windows
- Close window after auto-finalization
- Close window after admin override
- Reject invalid backend submissions

**2. Signal Aggregation Logic (8 tests)**
- Auto-finalize with >75% agreement
- Mark disputed with >40% disagreement
- Wait if signals are mixed (50-50)
- Handle zero votes gracefully
- Correct percentage calculations
- Multiple signal submissions (updates)
- Edge case: 100% agreement
- Edge case: 100% disagreement

**3. Auto-Finalization (5 tests)**
- Auto-finalize triggers finalization
- Resolution status updated correctly
- Window marked as autoFinalized
- Event emitted
- Cannot dispute after auto-finalization

**4. Admin Override (4 tests)**
- Admin can override disputed markets
- Admin can change outcome
- Window closed on override
- Events emitted correctly

**5. Threshold Configuration (3 tests)**
- Set agreement threshold (valid range)
- Set disagreement threshold (valid range)
- Reject invalid thresholds

**6. Integration with Existing System (4 tests)**
- Bond-based dispute still works
- Community voting works independently
- Both systems can coexist
- Admin can resolve both types

---

## ✅ VALIDATION CRITERIA

- ✅ Community voting system functional
- ✅ Auto-finalization working (>75%)
- ✅ Auto-dispute marking working (>40%)
- ✅ Admin override functional
- ✅ Threshold configuration working
- ✅ Existing bond-based dispute still works
- ✅ All tests passing (30+)
- ✅ Gas efficiency maintained
- ✅ No breaking changes to existing contracts

---

## 🔧 FILES TO MODIFY

1. **contracts/core/ResolutionManager.sol**
   - Add CommunityDisputeWindow struct
   - Add proposeResolution()
   - Add submitDisputeSignals()
   - Add adminResolveMarket()
   - Add threshold setters
   - Add new events

2. **contracts/interfaces/IResolutionManager.sol**
   - Add new function signatures
   - Add new event signatures
   - Add new struct definition

3. **test/hardhat/ResolutionManagerPhase6.test.js** (NEW)
   - Comprehensive test suite (30+ tests)

4. **PHASE_6_COMPLETION_REPORT.md** (NEW)
   - Documentation and metrics

---

## 🚀 EXECUTION ORDER

1. ✅ Review existing code (DONE)
2. ✅ Design integration strategy (THIS DOC - DONE)
3. ⏺️ Update ResolutionManager.sol
4. ⏺️ Update IResolutionManager.sol
5. ⏺️ Compile and fix errors
6. ⏺️ Create comprehensive test suite
7. ⏺️ Run tests and fix failures
8. ⏺️ Gas benchmarking
9. ⏺️ Create completion report

---

## 💡 KEY INSIGHTS

**Smart Reuse:**
- Reuse resolveMarket() logic in proposeResolution()
- Reuse finalizeResolution() for auto-finalization
- Reuse existing data structures where possible

**Coexistence Benefits:**
- No breaking changes
- Backwards compatible
- Flexible for different use cases
- Can phase out old system later if desired

**Frontend Integration:**
- Off-chain voting UI (Supabase)
- Backend aggregation service
- Real-time vote counts display
- Auto-finalization notifications

---

**Status:** ✅ READY TO IMPLEMENT
**Risk Level:** 🟢 LOW (Adding features, not changing existing)
**Estimated Time:** 2-3 hours (based on Phase 5 velocity)
