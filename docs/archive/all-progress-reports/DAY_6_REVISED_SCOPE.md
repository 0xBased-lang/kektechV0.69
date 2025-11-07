# DAY 6 REVISED SCOPE - Factory Curve Infrastructure Only

**Date**: November 4, 2025
**Status**: Clarified - Infrastructure Only (Not Full Integration)

---

## 🎯 CORRECT SCOPE FOR DAY 6

### What Day 6 IS:
✅ Add curve selection infrastructure to FlexibleMarketFactory
✅ Store curve configuration with market data
✅ Validate curve types via CurveRegistry
✅ Test that markets CAN BE CREATED with different curves
✅ Prepare infrastructure for Phase 3 integration

### What Day 6 IS NOT:
❌ Changing PredictionMarket pricing logic (that's Phase 3)
❌ Replacing AMM with curves (that's Phase 3)
❌ Breaking existing tests (maintain backward compatibility)
❌ Full end-to-end curve integration (that's Phase 3)

---

## 📝 DAY 6 TASKS (REVISED)

### Task 1: Add CurveType Enum
```solidity
/// @notice Supported bonding curve types
enum CurveType {
    LMSR,        // Logarithmic Market Scoring Rule
    LINEAR,      // Linear pricing
    EXPONENTIAL, // Exponential growth
    SIGMOID      // S-curve pricing
}
```

### Task 2: Update MarketData Struct
```solidity
struct MarketData {
    address creator;
    uint256 createdAt;
    uint256 resolutionTime;
    bytes32 category;
    bool isActive;
    bool exists;
    uint256 creatorBond;
    CurveType curveType;     // NEW - for future use
    uint256 curveParams;     // NEW - for future use
}
```

### Task 3: Add Curve Validation Helper
```solidity
function _validateCurveConfig(
    CurveType curveType,
    uint256 curveParams
) private view returns (address curveAddress) {
    // Get CurveRegistry
    CurveRegistry registry = _getCurveRegistry();

    // Validate curve exists
    require(registry.isCurveRegistered(curveType), "Curve not registered");

    // Get curve address
    curveAddress = registry.getCurve(curveType);

    // Future: Validate params via curve interface
    // (Phase 3 will implement this)

    return curveAddress;
}
```

### Task 4: Add createMarketWithCurve Function
```solidity
function createMarketWithCurve(
    MarketConfig calldata config,
    CurveType curveType,
    uint256 curveParams
) external payable nonReentrant whenNotPaused returns (address marketAddress) {
    // Validate config (existing)
    _validateMarketConfig(config);

    // Validate curve config (new)
    address curveAddress = _validateCurveConfig(curveType, curveParams);

    // Check bond (existing)
    if (msg.value < config.creatorBond || msg.value < minCreatorBond) {
        revert InsufficientBond();
    }

    // Deploy PredictionMarket (existing - no changes yet)
    PredictionMarket market = new PredictionMarket();

    // Initialize market (existing - no changes yet)
    market.initialize(
        registry,
        config.question,
        config.outcome1,
        config.outcome2,
        msg.sender,
        config.resolutionTime
    );

    marketAddress = address(market);

    // Store market data WITH curve info (new)
    _marketData[marketAddress] = MarketData({
        creator: msg.sender,
        createdAt: block.timestamp,
        resolutionTime: config.resolutionTime,
        category: config.category,
        isActive: true,
        exists: true,
        creatorBond: msg.value,
        curveType: curveType,      // NEW
        curveParams: curveParams    // NEW
    });

    // ... rest of existing logic ...

    emit MarketCreatedWithCurve(
        marketAddress,
        msg.sender,
        config.question,
        config.resolutionTime,
        curveType,
        curveParams,
        config.category,
        block.timestamp
    );
}
```

### Task 5: Add Helper to Get CurveRegistry
```solidity
function _getCurveRegistry() private view returns (CurveRegistry) {
    IMasterRegistry reg = IMasterRegistry(registry);
    address curveRegistry = reg.getContract(keccak256("CurveRegistry"));
    return CurveRegistry(curveRegistry);
}
```

### Task 6: Update IFlexibleMarketFactory Interface
```solidity
interface IFlexibleMarketFactory {
    // ... existing ...

    enum CurveType { LMSR, LINEAR, EXPONENTIAL, SIGMOID }

    function createMarketWithCurve(
        MarketConfig calldata config,
        CurveType curveType,
        uint256 curveParams
    ) external payable returns (address marketAddress);

    event MarketCreatedWithCurve(
        address indexed marketAddress,
        address indexed creator,
        string question,
        uint256 resolutionTime,
        CurveType curveType,
        uint256 curveParams,
        bytes32 category,
        uint256 timestamp
    );
}
```

---

## 🧪 TESTING STRATEGY (DAY 6)

### Test File: `test/integration/FactoryCurveInfrastructure.test.js`

```javascript
describe("FlexibleMarketFactory - Curve Infrastructure", function() {
    describe("CurveType Enum", function() {
        it("Should have correct enum values");
    });

    describe("createMarketWithCurve", function() {
        it("Should store LMSR curve configuration");
        it("Should store Linear curve configuration");
        it("Should store Exponential curve configuration");
        it("Should store Sigmoid curve configuration");
        it("Should validate curve exists in registry");
        it("Should revert on unregistered curve");
        it("Should emit MarketCreatedWithCurve event");
    });

    describe("Curve Configuration Storage", function() {
        it("Should store curve type correctly");
        it("Should store curve params correctly");
        it("Should retrieve stored curve config");
    });

    describe("CurveRegistry Integration", function() {
        it("Should get CurveRegistry from MasterRegistry");
        it("Should validate curve registration");
    });

    describe("Backward Compatibility", function() {
        it("Should maintain old createMarket function");
        it("Should default to LMSR for old function");
    });

    describe("Gas Costs", function() {
        it("Should stay under 2M gas with LMSR");
        it("Should stay under 2M gas with Linear");
        it("Should stay under 2M gas with Exponential");
        it("Should stay under 2M gas with Sigmoid");
    });
});
```

### Expected Test Count: ~15-20 tests

---

## ✅ SUCCESS CRITERIA

### Functional
- ✅ CurveType enum defined
- ✅ MarketData stores curve configuration
- ✅ createMarketWithCurve() works for all 4 curve types
- ✅ Curve validation via CurveRegistry
- ✅ Events emit curve information
- ✅ Old createMarket() still works

### Quality
- ✅ 100% test coverage for new code
- ✅ All 193+ existing tests still pass
- ✅ 15-20 new integration tests pass
- ✅ Gas costs under 2M

### Documentation
- ✅ Day 6 completion report
- ✅ Updated checklist
- ✅ Phase 2 completion summary

---

## 🚫 OUT OF SCOPE (PHASE 3)

These are explicitly NOT part of Day 6:

1. ❌ Changing PredictionMarket.sol pricing logic
2. ❌ Replacing AMM with curves
3. ❌ Using curves for actual cost calculations
4. ❌ Updating existing PredictionMarket tests
5. ❌ Breaking ResolutionManager integration
6. ❌ Changing RewardDistributor flow

**These are Phase 3 tasks (Days 7-8)!**

---

## 📊 IMPLEMENTATION ESTIMATE

| Task | Time | Status |
|------|------|--------|
| Add CurveType enum | 15 min | ⏸️ |
| Update MarketData struct | 15 min | ⏸️ |
| Add curve validation | 30 min | ⏸️ |
| Implement createMarketWithCurve | 45 min | ⏸️ |
| Update interface | 15 min | ⏸️ |
| Create tests | 2 hours | ⏸️ |
| Validate full suite | 30 min | ⏸️ |
| Documentation | 30 min | ⏸️ |
| **TOTAL** | **5 hours** | **0% Complete** |

---

**Ready to implement! 🚀**
