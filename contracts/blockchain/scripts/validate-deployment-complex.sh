#!/bin/bash

# validate-deployment.sh
# Validates if a contract is ready for deployment
# Usage: ./scripts/validate-deployment.sh <contract-name>

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Get contract name from argument
CONTRACT_NAME="$1"

if [ -z "$CONTRACT_NAME" ]; then
    echo -e "${RED}❌ ERROR: No contract name provided${NC}"
    echo "Usage: ./scripts/validate-deployment.sh <contract-name>"
    echo ""
    echo "Examples:"
    echo "  ./scripts/validate-deployment.sh VersionedRegistry"
    echo "  ./scripts/validate-deployment.sh FlexibleMarketFactoryUnified"
    exit 1
fi

echo ""
echo -e "${BOLD}${CYAN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${CYAN}║              DEPLOYMENT VALIDATION CHECK                      ║${NC}"
echo -e "${BOLD}${CYAN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BOLD}Contract:${NC} $CONTRACT_NAME"
echo ""

# Deployment Ready List (from MIGRATION_IMPLEMENTATION_CHECKLIST.md)
declare -A DEPLOYMENT_READY
DEPLOYMENT_READY["VersionedRegistry"]="YES"
DEPLOYMENT_READY["ParameterStorage"]="YES"
DEPLOYMENT_READY["RewardDistributor"]="YES"
DEPLOYMENT_READY["AccessControlManager"]="YES"
DEPLOYMENT_READY["CurveRegistry"]="YES"
DEPLOYMENT_READY["MarketTemplateRegistry"]="YES"
DEPLOYMENT_READY["FlexibleMarketFactoryUnified"]="NO"
DEPLOYMENT_READY["PredictionMarket"]="NO"
DEPLOYMENT_READY["ResolutionManager"]="NO"

# Deprecated contracts (NEVER deploy)
declare -A DEPRECATED_CONTRACTS
DEPRECATED_CONTRACTS["FlexibleMarketFactory"]="YES"
DEPRECATED_CONTRACTS["FlexibleMarketFactoryCore"]="YES"
DEPRECATED_CONTRACTS["FlexibleMarketFactoryExtensions"]="YES"
DEPRECATED_CONTRACTS["MasterRegistry"]="YES"
DEPRECATED_CONTRACTS["ProposalManager"]="YES"
DEPRECATED_CONTRACTS["ProposalManagerV2"]="YES"

# Initialize validation results
VALIDATION_PASSED=true
WARNINGS=()

# Step 1: Check if contract is deprecated
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}STEP 1: Checking if contract is deprecated${NC}"
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

if [ "${DEPRECATED_CONTRACTS[$CONTRACT_NAME]}" == "YES" ]; then
    echo -e "${RED}❌ BLOCKED: $CONTRACT_NAME is DEPRECATED${NC}"
    echo ""
    echo "This contract has been archived and MUST NOT be deployed."
    echo ""
    echo "Reason: Replaced by newer architecture"
    echo "See: contracts/deprecated/README.md"
    echo "See: docs/active/TARGET_ARCHITECTURE.md"
    echo ""
    exit 1
else
    echo -e "${GREEN}✅ PASS: Contract is not deprecated${NC}"
fi
echo ""

# Step 2: Check if contract is in deployment ready list
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}STEP 2: Checking deployment readiness${NC}"
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

if [ -z "${DEPLOYMENT_READY[$CONTRACT_NAME]}" ]; then
    echo -e "${RED}❌ BLOCKED: $CONTRACT_NAME not in deployment ready list${NC}"
    echo ""
    echo "This contract is not recognized in the migration checklist."
    echo ""
    echo "Possible reasons:"
    echo "  1. Contract name typo"
    echo "  2. Contract not part of target architecture"
    echo "  3. Contract not yet implemented"
    echo ""
    echo "See: docs/active/TARGET_ARCHITECTURE.md"
    echo "See: docs/migration/MIGRATION_IMPLEMENTATION_CHECKLIST.md"
    echo ""
    exit 1
elif [ "${DEPLOYMENT_READY[$CONTRACT_NAME]}" == "NO" ]; then
    echo -e "${RED}❌ BLOCKED: $CONTRACT_NAME is NOT deployment ready${NC}"
    echo ""

    case "$CONTRACT_NAME" in
        "FlexibleMarketFactoryUnified")
            echo "Blockers:"
            echo "  • Size not verified (must be <24KB)"
            echo "  • Tests missing (need 50+ tests passing)"
            echo "  • Phase 4 incomplete (at 70%)"
            echo ""
            echo "Next steps:"
            echo "  1. Complete Phase 4 tasks 4.14-4.35"
            echo "  2. Measure bytecode size: npx hardhat size-contracts"
            echo "  3. Write comprehensive tests (50+)"
            echo "  4. Deploy to fork first"
            ;;
        "PredictionMarket")
            echo "Blockers:"
            echo "  • Market lifecycle states not implemented"
            echo "  • Phase 5 not started"
            echo ""
            echo "Next steps:"
            echo "  1. Complete Phase 4 first"
            echo "  2. Implement MarketState enum (Phase 5)"
            echo "  3. Add state transition functions"
            echo "  4. Write lifecycle tests (15+)"
            ;;
        "ResolutionManager")
            echo "Blockers:"
            echo "  • Auto-finalization not implemented"
            echo "  • Phase 6 incomplete (at 60%)"
            echo ""
            echo "Next steps:"
            echo "  1. Complete Phase 5 first"
            echo "  2. Add aggregateCommunityVotes() function"
            echo "  3. Implement auto-finalization logic"
            echo "  4. Write dispute tests (10+)"
            ;;
        *)
            echo "See checklist for specific blockers:"
            echo "docs/migration/MIGRATION_IMPLEMENTATION_CHECKLIST.md"
            ;;
    esac
    echo ""
    exit 1
else
    echo -e "${GREEN}✅ PASS: Contract is marked deployment ready${NC}"
fi
echo ""

# Step 3: Find contract file
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}STEP 3: Locating contract file${NC}"
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

CONTRACT_FILE=$(find contracts -name "${CONTRACT_NAME}.sol" ! -path "*/deprecated/*" 2>/dev/null | head -1)

if [ -z "$CONTRACT_FILE" ]; then
    echo -e "${RED}❌ FAIL: Contract file not found${NC}"
    echo ""
    echo "Expected: contracts/core/${CONTRACT_NAME}.sol"
    echo ""
    exit 1
else
    echo -e "${GREEN}✅ PASS: Found at $CONTRACT_FILE${NC}"
fi
echo ""

# Step 4: Compile contract
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}STEP 4: Compiling contract${NC}"
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${CYAN}Running: npx hardhat compile${NC}"
if npx hardhat compile 2>&1 | grep -q "Compiled.*successfully"; then
    echo -e "${GREEN}✅ PASS: Compilation successful${NC}"
else
    echo -e "${RED}❌ FAIL: Compilation failed${NC}"
    echo ""
    echo "Fix compilation errors before deploying."
    VALIDATION_PASSED=false
fi
echo ""

# Step 5: Check contract size (if compiled)
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}STEP 5: Checking contract bytecode size${NC}"
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Try to get contract size from artifacts
ARTIFACT_PATH="artifacts/contracts/core/${CONTRACT_NAME}.sol/${CONTRACT_NAME}.json"

if [ -f "$ARTIFACT_PATH" ]; then
    # Calculate bytecode size (bytecode is hex, so divide by 2 to get bytes)
    BYTECODE_HEX=$(cat "$ARTIFACT_PATH" | grep -o '"bytecode":"0x[^"]*"' | cut -d'"' -f4)
    BYTECODE_LENGTH=${#BYTECODE_HEX}
    BYTECODE_BYTES=$((BYTECODE_LENGTH / 2))
    BYTECODE_KB=$(echo "scale=2; $BYTECODE_BYTES / 1024" | bc)

    echo -e "${CYAN}Contract size: ${BOLD}${BYTECODE_KB} KB${NC} (${BYTECODE_BYTES} bytes)"

    # EVM limit is 24KB (24576 bytes)
    if [ $BYTECODE_BYTES -ge 24576 ]; then
        echo -e "${RED}❌ FAIL: Contract exceeds 24KB limit${NC}"
        echo ""
        echo "Contract is TOO LARGE to deploy on EVM."
        echo ""
        echo "Optimization options:"
        echo "  1. Split into smaller contracts"
        echo "  2. Move logic to libraries"
        echo "  3. Remove unnecessary features"
        echo "  4. Optimize storage layout"
        echo ""
        VALIDATION_PASSED=false
    elif [ $BYTECODE_BYTES -ge 22000 ]; then
        echo -e "${YELLOW}⚠️  WARNING: Contract size close to 24KB limit${NC}"
        echo ""
        echo "Safety margin: $((24576 - BYTECODE_BYTES)) bytes remaining"
        WARNINGS+=("Contract size close to limit (${BYTECODE_KB} KB / 24 KB)")
    else
        echo -e "${GREEN}✅ PASS: Contract size within limits${NC}"
        SAFETY_MARGIN=$((24576 - BYTECODE_BYTES))
        SAFETY_PERCENT=$(echo "scale=1; $SAFETY_MARGIN * 100 / 24576" | bc)
        echo -e "${CYAN}Safety margin: ${SAFETY_MARGIN} bytes (${SAFETY_PERCENT}%)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  WARNING: Artifact not found, cannot verify size${NC}"
    echo ""
    echo "Run compilation first: npx hardhat compile"
    WARNINGS+=("Contract size not verified")
fi
echo ""

# Step 6: Check for tests
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}STEP 6: Checking for tests${NC}"
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Look for test files
TEST_FILES=$(find test -name "*${CONTRACT_NAME}*.test.js" -o -name "*${CONTRACT_NAME}*.test.ts" 2>/dev/null)

if [ -z "$TEST_FILES" ]; then
    echo -e "${RED}❌ FAIL: No test files found${NC}"
    echo ""
    echo "Cannot deploy without tests."
    echo ""
    echo "Required: Create test/core/${CONTRACT_NAME}.test.js"
    VALIDATION_PASSED=false
else
    echo -e "${GREEN}✅ PASS: Test files found${NC}"
    echo "$TEST_FILES" | while read file; do
        echo -e "${CYAN}  • $file${NC}"
    done
fi
echo ""

# Step 7: Run tests
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}STEP 7: Running tests${NC}"
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

if [ ! -z "$TEST_FILES" ]; then
    echo -e "${CYAN}Running: npm test (full test suite)${NC}"
    echo ""

    # Run tests and capture output
    if npm test 2>&1 | tee /tmp/test-output.log | grep -q "passing"; then
        PASSING_TESTS=$(grep "passing" /tmp/test-output.log | tail -1 | grep -o "[0-9]*" | head -1)
        FAILING_TESTS=$(grep "failing" /tmp/test-output.log | tail -1 | grep -o "[0-9]*" | head -1)

        if [ ! -z "$FAILING_TESTS" ] && [ "$FAILING_TESTS" -gt 0 ]; then
            echo -e "${RED}❌ FAIL: $FAILING_TESTS test(s) failing${NC}"
            echo ""
            echo "All tests must pass before deployment."
            VALIDATION_PASSED=false
        else
            echo -e "${GREEN}✅ PASS: All tests passing ($PASSING_TESTS tests)${NC}"
        fi
    else
        echo -e "${RED}❌ FAIL: Test execution failed${NC}"
        VALIDATION_PASSED=false
    fi
else
    echo -e "${YELLOW}⚠️  SKIPPED: No tests to run${NC}"
fi
echo ""

# Step 8: Final validation summary
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}VALIDATION SUMMARY${NC}"
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

if [ "$VALIDATION_PASSED" = true ]; then
    echo -e "${GREEN}${BOLD}✅ DEPLOYMENT VALIDATION PASSED${NC}"
    echo ""
    echo -e "${BOLD}Contract: $CONTRACT_NAME${NC}"
    echo -e "${BOLD}Status: ${GREEN}READY FOR DEPLOYMENT${NC}"
    echo ""

    if [ ${#WARNINGS[@]} -gt 0 ]; then
        echo -e "${YELLOW}Warnings to consider:${NC}"
        for warning in "${WARNINGS[@]}"; do
            echo -e "  ${YELLOW}⚠️  $warning${NC}"
        done
        echo ""
    fi

    echo -e "${BOLD}Next steps:${NC}"
    echo -e "  1. ${CYAN}Deploy to fork first:${NC} npm run deploy:fork"
    echo -e "  2. ${CYAN}Test on fork:${NC} npm run test:fork"
    echo -e "  3. ${CYAN}Deploy to Sepolia:${NC} npm run deploy:sepolia"
    echo -e "  4. ${CYAN}Test on Sepolia:${NC} Monitor for 24 hours"
    echo -e "  5. ${CYAN}Deploy to mainnet:${NC} Only after Sepolia validation"
    echo ""

    exit 0
else
    echo -e "${RED}${BOLD}❌ DEPLOYMENT VALIDATION FAILED${NC}"
    echo ""
    echo -e "${BOLD}Contract: $CONTRACT_NAME${NC}"
    echo -e "${BOLD}Status: ${RED}NOT READY FOR DEPLOYMENT${NC}"
    echo ""
    echo -e "${RED}Blockers:${NC}"
    echo -e "  • Fix all compilation errors"
    echo -e "  • Ensure contract size <24KB"
    echo -e "  • Write comprehensive tests"
    echo -e "  • Ensure all tests pass (100%)"
    echo ""
    echo -e "${BOLD}Do NOT deploy until all checks pass.${NC}"
    echo ""

    exit 1
fi
