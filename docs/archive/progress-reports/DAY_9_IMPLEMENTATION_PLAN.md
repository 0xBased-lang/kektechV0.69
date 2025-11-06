# 🚀 DAY 9 IMPLEMENTATION PLAN - CUSTOM ERRORS
**Date**: November 5, 2025 (continued) / November 6, 2025
**Objective**: Reduce FlexibleMarketFactory to under 24KB using custom errors
**Technique**: Industry-standard approach (Uniswap, OpenZeppelin, etc.)
**Estimated Time**: 3-4 hours
**Confidence**: 90%

---

## 🎯 MISSION

**Primary Goal**: Get FlexibleMarketFactory under 24KB
**Method**: Replace all error strings with custom error types
**Expected Savings**: ~4KB (from 28.8KB → ~24.3KB)
**Success Criteria**: Contract compiles < 24,576 bytes

---

## 📋 IMPLEMENTATION STEPS

### Step 1: Restore Original Contract (15 min)
**Action**: Use the backup from before library refactoring
**Why**: Start from clean, working state
**Files**:
- Restore `FlexibleMarketFactory.sol.backup`
- Remove library refactoring changes

### Step 2: Define Custom Errors (30 min)
**Action**: Add all custom error definitions at top of contract
**Location**: After state variables, before constructor

**Error Categories**:
```solidity
// Market Configuration Errors
error InvalidQuestion();
error InvalidResolutionTime();
error InvalidCategory();
error InvalidBondAmount();
error InvalidMarketConfig();
error InvalidTemplate();

// Access Control Errors
error UnauthorizedAccess(address caller);
error ContractPaused();

// Market Errors
error MarketNotFound(address market);
error TemplateNotFound(bytes32 templateId);
error MarketAlreadyExists();

// Bonding/Financial Errors
error InsufficientBond();
error InvalidCurveType();
error InvalidCurveParams();

// ... ~40 total errors
```

### Step 3: Replace require() Statements (1.5 hours)
**Pattern**:
```solidity
// OLD:
require(condition, "Error message string");

// NEW:
if (!condition) revert CustomError();
```

**Systematic Approach**:
1. Search for all `require(` in contract
2. Identify the error condition
3. Create/use appropriate custom error
4. Replace with if/revert pattern
5. Test compilation after each 5-10 replacements

### Step 4: Replace revert() Strings (30 min)
**Pattern**:
```solidity
// OLD:
revert("Error message");

// NEW:
revert CustomError();
```

### Step 5: Optimize Event Strings (30 min)
**Optional but helpful**:
- Shorten long event parameter names
- Remove unnecessary event fields
- Use indexed parameters efficiently

### Step 6: Compile and Measure (15 min)
```bash
npx hardhat clean
npx hardhat compile
# Check size in output
```

**Target**: < 24,576 bytes
**If over**: Apply additional optimizations

### Step 7: Run Tests (30 min)
```bash
npm test
# All 218 tests should pass
```

**If tests fail**: Custom errors should not break logic, only check test expectations

### Step 8: Deploy to Sepolia (2-3 hours)
- Update deployment script if needed
- Deploy all 8 contracts
- Verify sizes
- Test functionality

---

## 📊 EXPECTED OUTCOMES

### Size Projection
```
Current Size:          28,824 bytes
Custom Error Savings:  -4,000 bytes
Event Optimization:      -500 bytes
Other Tweaks:            -200 bytes
─────────────────────────────────
Target Size:           24,124 bytes ✅

EVM Limit:             24,576 bytes
Safety Margin:            452 bytes (1.8%)
```

### Test Expectations
- All functionality preserved ✅
- Gas costs similar or slightly lower ✅
- Tests pass with minor adjustments ✅
- Deployment works identically ✅

---

## 🔧 DETAILED ERROR MAPPING

### From FlexibleMarketFactory Analysis

**Market Creation Errors** (~10 errors):
- InvalidQuestion
- InvalidResolutionTime
- InvalidCategory
- InvalidBondAmount
- InsufficientBond
- InvalidMarketConfig
- InvalidCurveType
- InvalidCurveParams
- CurveNotActive
- TemplateNotFound

**Access Control** (~5 errors):
- UnauthorizedAccess
- ContractPaused
- OnlyAdmin
- OnlyMarketCreator
- RoleNotAuthorized

**Market Management** (~8 errors):
- MarketNotFound
- MarketNotActive
- MarketAlreadyResolved
- InvalidMarketState
- ResolutionTooEarly
- ResolutionTooLate
- DisputePeriodEnded
- InvalidOutcome

**Financial** (~7 errors):
- InsufficientBond
- InvalidBondAmount
- BondAlreadyRefunded
- TransferFailed
- InsufficientBalance
- InvalidAmount
- ZeroAddress

**Template Management** (~5 errors):
- TemplateNotFound
- TemplateAlreadyExists
- InvalidTemplate
- TemplateNotActive
- InvalidTemplateConfig

**Registry** (~5 errors):
- RegistryNotSet
- ContractNotRegistered
- InvalidRegistry
- RegistryCallFailed
- ContractNotFound

---

## ⚠️ POTENTIAL ISSUES & SOLUTIONS

### Issue 1: Test Assertions on Error Messages
**Problem**: Tests checking error message strings
**Solution**: Update test assertions to check custom error types

```javascript
// OLD TEST:
await expect(factory.createMarket(...))
  .to.be.revertedWith("Invalid question");

// NEW TEST:
await expect(factory.createMarket(...))
  .to.be.revertedWithCustomError(factory, "InvalidQuestion");
```

### Issue 2: Still Over Limit After Custom Errors
**Solution**: Additional optimizations
- Remove less-used functions temporarily
- Optimize storage layout
- Remove detailed comments
- Shorten variable names (last resort)

### Issue 3: Compilation Warnings
**Expected**: Some warnings about unused parameters
**Solution**: Ignore or fix if time permits (won't affect size much)

---

## 📅 TIMELINE

### Morning Session (3-4 hours)
- ✅ **0:00-0:15**: Restore original contract
- ⏳ **0:15-0:45**: Define all custom errors
- ⏳ **0:45-2:15**: Replace require() statements
- ⏳ **2:15-2:45**: Replace revert() strings
- ⏳ **2:45-3:15**: Optimize events/other
- ⏳ **3:15-3:30**: Compile and measure size
- ⏳ **3:30-4:00**: Run test suite

### Afternoon Session (2-3 hours)
- ⏳ Update Sepolia deployment scripts
- ⏳ Deploy all 8 contracts to Sepolia
- ⏳ Verify deployments
- ⏳ Test basic functionality
- ⏳ Document completion

---

## ✅ SUCCESS CRITERIA

**Phase 1: Custom Errors** (Morning)
- [ ] Contract compiles successfully
- [ ] Size < 24,576 bytes (target: ~24,100 bytes)
- [ ] All 218 tests pass (or minor updates needed)
- [ ] Functionality preserved

**Phase 2: Deployment** (Afternoon)
- [ ] All 8 contracts deploy to Sepolia
- [ ] FlexibleMarketFactory under limit
- [ ] Basic market creation works
- [ ] Week 1 objectives complete

---

## 🎓 LEARNING CHECKLIST

By end of Day 9, we will have learned:
- [x] Custom error implementation (industry standard)
- [ ] Size optimization techniques
- [ ] Test suite updates for custom errors
- [ ] Complete deployment workflow
- [ ] Week 1 validation process

---

## 💪 CONFIDENCE FACTORS

**High Confidence (90%)**:
1. ✅ Custom errors proven technique
2. ✅ Used by all major projects
3. ✅ Expected 4KB savings matches needs
4. ✅ Clear implementation path
5. ✅ Fallback optimizations available

**Risks (10%)**:
1. Savings less than expected (unlikely)
2. Unexpected test breakage (minor)
3. Deployment issues (have retry logic)

---

## 🚀 LET'S DO THIS!

**Day 9 Status**: READY TO EXECUTE
**Approach**: Proven industry standard
**Timeline**: 3-4 hours implementation + 2-3 hours deployment
**Outcome**: Week 1 complete!

**Mood**: 💪 Confident and prepared!

Let's implement custom errors and get this contract under 24KB! 🎯