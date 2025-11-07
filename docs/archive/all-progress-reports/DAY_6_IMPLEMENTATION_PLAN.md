# DAY 6 IMPLEMENTATION PLAN - Factory Curve Integration

**Date**: November 4, 2025
**Mode**: --ultrathink
**Status**: Planning Complete - Ready for Implementation

---

## 🎯 OBJECTIVE

Integrate bonding curve selection into FlexibleMarketFactory, enabling market creators to choose between LMSR, Linear, Exponential, and Sigmoid pricing curves.

---

## 📋 REQUIREMENTS FROM MASTER PLAN

### Core Requirements

1. **CurveType Enum** - Define supported curve types
2. **Curve Selection** - Add curve type parameter to market creation
3. **Curve Parameters** - Add configurable curve parameters
4. **CurveRegistry Integration** - Validate curves exist and parameters are valid
5. **Testing** - Comprehensive integration tests for each curve type
6. **Gas Optimization** - Maintain gas targets (<2M for createMarket)

### From LMSR_MASTER_PLAN.md:
```solidity
enum CurveType { LMSR, LINEAR, EXPONENTIAL, SIGMOID }

function createMarket(
    string memory question,
    uint256 deadline,
    CurveType curveType,
    uint256 curveParams,
    uint256 feePercent
) external returns (address);
```

---

## 🏗️ IMPLEMENTATION STRATEGY

### Option A: Extend Existing Function (Breaking Change)
❌ **Rejected** - Would break existing integrations

### Option B: Add New Function (Backward Compatible)
✅ **SELECTED** - Maintains backward compatibility

**Approach**:
1. Keep existing `createMarket()` and `createMarketFromTemplate()`
2. Add new `createMarketWithCurve()` function with curve selection
3. Existing functions default to LMSR curve with standard parameters
4. Deprecate old functions gradually in future versions

---

## 📝 DETAILED IMPLEMENTATION PLAN

### Phase 1: Contract Updates (2-3 hours)

#### Step 1.1: Add CurveType Enum
```solidity
/// @notice Supported bonding curve types
enum CurveType {
    LMSR,        // Logarithmic Market Scoring Rule
    LINEAR,      // Linear pricing
    EXPONENTIAL, // Exponential growth
    SIGMOID      // S-curve pricing
}
```

#### Step 1.2: Update MarketConfig Struct
```solidity
struct MarketConfig {
    string question;
    string description;
    uint256 resolutionTime;
    uint256 creatorBond;
    bytes32 category;
    string outcome1;
    string outcome2;
    CurveType curveType;     // NEW
    uint256 curveParams;     // NEW - packed parameters
}
```

#### Step 1.3: Add New Function
```solidity
function createMarketWithCurve(
    string calldata question,
    string calldata outcome1,
    string calldata outcome2,
    uint256 resolutionTime,
    bytes32 category,
    CurveType curveType,
    uint256 curveParams
) external payable returns (address marketAddress);
```

#### Step 1.4: Add Curve Validation Helper
```solidity
function _validateCurveConfig(
    CurveType curveType,
    uint256 curveParams
) private view returns (address curveAddress);
```

**Validation Steps**:
1. Get CurveRegistry from MasterRegistry
2. Verify curve type is registered
3. Validate curve parameters via IBondingCurve
4. Return curve contract address

#### Step 1.5: Update PredictionMarket Initialization
**Note**: PredictionMarket needs to accept curve configuration

Check current PredictionMarket.initialize() signature:
```solidity
function initialize(
    address _registry,
    string memory _question,
    string memory _outcome1,
    string memory _outcome2,
    address _creator,
    uint256 _resolutionTime
) external;
```

**Required Changes**:
- Add curveType parameter
- Add curveParams parameter
- Store curve configuration in PredictionMarket
- Use curve for pricing calculations

#### Step 1.6: Add Events
```solidity
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
```

### Phase 2: PredictionMarket Updates (1-2 hours)

**Required Changes to PredictionMarket.sol**:

1. Add storage variables:
```solidity
CurveType public curveType;
uint256 public curveParams;
address public bondingCurve;
```

2. Update initialize():
```solidity
function initialize(
    address _registry,
    string memory _question,
    string memory _outcome1,
    string memory _outcome2,
    address _creator,
    uint256 _resolutionTime,
    CurveType _curveType,
    uint256 _curveParams
) external;
```

3. Update pricing calculation:
```solidity
function calculateCost(...) {
    // Get curve from registry
    IBondingCurve curve = IBondingCurve(bondingCurve);

    // Use curve for calculation
    return curve.calculateCost(...);
}
```

### Phase 3: Testing (2-3 hours)

#### Integration Test Structure:
```javascript
describe("FlexibleMarketFactory - Curve Integration", function() {
    describe("CurveType Enum", function() {
        it("Should have correct curve type values");
    });

    describe("createMarketWithCurve", function() {
        describe("LMSR Curve", function() {
            it("Should create market with LMSR curve");
            it("Should validate LMSR parameters");
            it("Should store curve configuration");
        });

        describe("Linear Curve", function() {
            it("Should create market with Linear curve");
            it("Should validate Linear parameters");
        });

        describe("Exponential Curve", function() {
            it("Should create market with Exponential curve");
            it("Should validate Exponential parameters");
        });

        describe("Sigmoid Curve", function() {
            it("Should create market with Sigmoid curve");
            it("Should validate Sigmoid parameters");
        });
    });

    describe("Curve Validation", function() {
        it("Should revert on invalid curve type");
        it("Should revert on invalid parameters");
        it("Should revert if curve not registered");
    });

    describe("Backward Compatibility", function() {
        it("Should maintain old createMarket signature");
        it("Should default to LMSR when no curve specified");
    });

    describe("Gas Costs", function() {
        it("Should stay under 2M gas for LMSR creation");
        it("Should stay under 2M gas for Linear creation");
        it("Should stay under 2M gas for Exponential creation");
        it("Should stay under 2M gas for Sigmoid creation");
    });
});
```

#### Test Coverage Requirements:
- ✅ All 4 curve types work
- ✅ Parameter validation for each curve
- ✅ CurveRegistry integration
- ✅ Backward compatibility
- ✅ Gas cost validation
- ✅ Edge cases (invalid curves, params)

---

## ⚠️ CRITICAL CONSIDERATIONS

### 1. PredictionMarket Dependency
**Issue**: Current PredictionMarket doesn't support curve configuration

**Solution**: Update PredictionMarket.sol to:
- Accept curve configuration in initialize()
- Store curve address and parameters
- Use curve for all pricing calculations

**Impact**: Medium - Requires coordinated changes

### 2. Default Curve Behavior
**Decision**: Use LMSR as default with b = 100 * 1e18

**Rationale**:
- LMSR is the most tested curve
- Matches original KEKTECH requirements
- Safe conservative default

### 3. Parameter Encoding
**Current**:
- LMSR: Single uint256 `b` parameter
- Linear: Packed `[minPrice:64][maxPrice:64][priceRange:128]`
- Exponential: Packed `[basePrice:64][growthRate:64][maxPrice:128]`
- Sigmoid: Packed `[minPrice:64][maxPrice:64][steepness:32][inflection:96]`

**Factory Validation**: Must validate packed parameters match curve expectations

### 4. Gas Optimization
**Target**: <2M gas for createMarket

**Current PredictionMarket deployment**: ~1.5M gas

**Budget for curve integration**: ~500k gas

**Optimization Strategies**:
- Cache CurveRegistry address
- Minimize storage writes
- Batch parameter validation
- Use events efficiently

---

## 📊 SUCCESS CRITERIA

### Functional Requirements
- ✅ All 4 curve types work correctly
- ✅ Parameters validated for each curve
- ✅ CurveRegistry integration functional
- ✅ Backward compatibility maintained
- ✅ Events emitted correctly

### Quality Requirements
- ✅ 100% test coverage (20+ integration tests)
- ✅ All tests passing
- ✅ Gas costs under targets
- ✅ Documentation complete

### Safety Requirements
- ✅ Parameter validation prevents invalid markets
- ✅ Curve existence validated before creation
- ✅ No security regressions
- ✅ ReentrancyGuard maintained

---

## 🔄 IMPLEMENTATION SEQUENCE

### Sequence 1: Analysis & Planning (COMPLETE)
- ✅ Analyze current factory implementation
- ✅ Review Day 6 requirements
- ✅ Create implementation plan
- ✅ Identify dependencies

### Sequence 2: Contract Updates
1. Add CurveType enum to factory
2. Update MarketConfig struct
3. Add curve validation helper
4. Implement createMarketWithCurve()
5. Update events

### Sequence 3: PredictionMarket Updates
1. Add curve storage variables
2. Update initialize() signature
3. Implement curve-based pricing
4. Update all pricing functions

### Sequence 4: Testing
1. Create integration test file
2. Implement curve type tests (4 suites)
3. Add parameter validation tests
4. Add gas cost measurements
5. Add backward compatibility tests

### Sequence 5: Validation
1. Run full test suite (all 193+ tests)
2. Measure gas costs
3. Validate checklist compliance
4. Document completion

---

## 📁 FILES TO MODIFY

### Contract Files
1. `contracts/core/FlexibleMarketFactory.sol` - Add curve selection
2. `contracts/core/PredictionMarket.sol` - Add curve integration
3. `contracts/interfaces/IFlexibleMarketFactory.sol` - Update interface

### Test Files
1. `test/integration/FactoryCurveIntegration.test.js` - NEW FILE
2. `test/unit/FlexibleMarketFactory.test.js` - Update existing tests
3. `test/unit/PredictionMarket.test.js` - Update for curve config

### Documentation
1. `DAY_6_COMPLETE_SUCCESS.md` - Completion report
2. `LMSR_IMPLEMENTATION_CHECKLIST.md` - Update progress
3. `PHASE_2_FINAL_REPORT.md` - Phase 2 completion

---

## 🎯 ESTIMATED TIMELINE

| Phase | Tasks | Est. Time | Status |
|-------|-------|-----------|--------|
| Analysis | Requirements, planning | 1 hour | ✅ COMPLETE |
| Factory Updates | Enum, struct, functions | 1.5 hours | ⏸️ PENDING |
| PredictionMarket Updates | Storage, initialization | 1.5 hours | ⏸️ PENDING |
| Integration Tests | 20+ tests | 2 hours | ⏸️ PENDING |
| Validation | Full suite, gas analysis | 1 hour | ⏸️ PENDING |
| Documentation | Reports, updates | 1 hour | ⏸️ PENDING |
| **TOTAL** | | **8 hours** | **12% COMPLETE** |

---

## 🚨 RISK ASSESSMENT

### High Risk
- ❌ None identified

### Medium Risk
- ⚠️ PredictionMarket changes may break existing tests
  - **Mitigation**: Update tests incrementally, maintain backward compatibility
- ⚠️ Gas costs may exceed targets
  - **Mitigation**: Profile gas usage, optimize if needed

### Low Risk
- ⚠️ Parameter validation complexity
  - **Mitigation**: Use existing curve encode/decode functions

---

## ✅ NEXT STEPS

1. **Update FlexibleMarketFactory.sol**
   - Add CurveType enum
   - Update MarketConfig struct
   - Implement createMarketWithCurve()

2. **Update PredictionMarket.sol**
   - Add curve storage
   - Update initialize()
   - Implement curve-based pricing

3. **Create Integration Tests**
   - Test all 4 curve types
   - Validate parameters
   - Measure gas costs

4. **Validate & Document**
   - Run full test suite
   - Update checklist
   - Complete Phase 2 report

---

**Ready to proceed with implementation! 🚀**
