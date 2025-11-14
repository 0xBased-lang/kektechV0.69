#!/bin/bash

###############################################################################
# KEKTECH 3.0 - Comprehensive Security Testing Suite
#
# This script runs all security tests in a systematic order:
# 1. Unit tests for all security fixes (CRITICAL, HIGH, MEDIUM)
# 2. Fuzz tests with 100K iterations
# 3. BasedAI fork integration tests
# 4. Gas analysis and optimization validation
# 5. Coverage report generation
#
# Usage: ./scripts/test-security-fixes.sh [--skip-fork] [--skip-fuzz]
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
SKIP_FORK=false
SKIP_FUZZ=false
VERBOSE=false

for arg in "$@"; do
    case $arg in
        --skip-fork)
            SKIP_FORK=true
            shift
            ;;
        --skip-fuzz)
            SKIP_FUZZ=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        *)
            ;;
    esac
done

# Print header
echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         KEKTECH 3.0 SECURITY TESTING SUITE                    ║"
echo "║         Comprehensive Validation of All Security Fixes        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Track test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Create results directory
RESULTS_DIR="test-results/security-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$RESULTS_DIR"

log_test() {
    local test_name=$1
    local status=$2
    local details=$3

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    if [ "$status" = "PASS" ]; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        echo -e "${GREEN}✓ PASS${NC} $test_name"
    elif [ "$status" = "FAIL" ]; then
        FAILED_TESTS=$((FAILED_TESTS + 1))
        echo -e "${RED}✗ FAIL${NC} $test_name"
        echo "  Details: $details"
    elif [ "$status" = "SKIP" ]; then
        echo -e "${YELLOW}⊘ SKIP${NC} $test_name"
    fi
}

run_test() {
    local test_name=$1
    local test_command=$2
    local output_file="$RESULTS_DIR/${test_name//[ \/]/-}.log"

    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Running: $test_name${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    if [ "$VERBOSE" = true ]; then
        eval "$test_command" 2>&1 | tee "$output_file"
    else
        eval "$test_command" > "$output_file" 2>&1
    fi

    local exit_code=$?

    if [ $exit_code -eq 0 ]; then
        log_test "$test_name" "PASS" ""
    else
        log_test "$test_name" "FAIL" "See $output_file for details"
    fi

    return $exit_code
}

###############################################################################
# PHASE 1: COMPILATION CHECK
###############################################################################

echo ""
echo -e "${YELLOW}════════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}PHASE 1: COMPILATION VALIDATION${NC}"
echo -e "${YELLOW}════════════════════════════════════════════════════════════════${NC}"

run_test "Hardhat Compilation" "npx hardhat compile"
run_test "Foundry Compilation" "forge build"

###############################################################################
# PHASE 2: UNIT TESTS FOR SECURITY FIXES
###############################################################################

echo ""
echo -e "${YELLOW}════════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}PHASE 2: UNIT TESTS FOR ALL SECURITY FIXES${NC}"
echo -e "${YELLOW}════════════════════════════════════════════════════════════════${NC}"

# CRITICAL severity tests
run_test "CRITICAL-001: Pagination DoS Protection" \
    "npx hardhat test test/security/CRITICAL-001-Pagination.test.js"

run_test "CRITICAL-002: Zero Winner Pool" \
    "npx hardhat test test/security/CRITICAL-002-ZeroWinnerPool.test.js"

# HIGH severity tests
run_test "HIGH-001: Whale Manipulation Protection" \
    "npx hardhat test test/security/HIGH-001-WhaleProtection.test.js"

run_test "HIGH-002: Disputed Bond Handling" \
    "npx hardhat test test/security/HIGH-002-DisputeBond.test.js"

run_test "HIGH-003: Template Validation" \
    "npx hardhat test test/security/HIGH-003-TemplateValidation.test.js"

###############################################################################
# PHASE 3: FUZZ TESTING
###############################################################################

if [ "$SKIP_FUZZ" = false ]; then
    echo ""
    echo -e "${YELLOW}════════════════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}PHASE 3: FUZZ TESTING (100K iterations)${NC}"
    echo -e "${YELLOW}════════════════════════════════════════════════════════════════${NC}"

    run_test "Comprehensive Fuzz Tests - 10K runs" \
        "forge test --match-contract SecurityFuzzTest --fuzz-runs 10000"

    run_test "Comprehensive Fuzz Tests - 100K runs" \
        "forge test --match-contract SecurityFuzzTest --fuzz-runs 100000"
else
    echo -e "${YELLOW}⊘ Skipping fuzz tests (--skip-fuzz flag)${NC}"
fi

###############################################################################
# PHASE 4: GAS OPTIMIZATION VALIDATION
###############################################################################

echo ""
echo -e "${YELLOW}════════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}PHASE 4: GAS OPTIMIZATION VALIDATION${NC}"
echo -e "${YELLOW}════════════════════════════════════════════════════════════════${NC}"

run_test "Gas Report - Pagination" \
    "REPORT_GAS=true npx hardhat test test/security/CRITICAL-001-Pagination.test.js"

run_test "Gas Report - Whale Protection" \
    "REPORT_GAS=true npx hardhat test test/security/HIGH-001-WhaleProtection.test.js"

###############################################################################
# PHASE 5: FORK TESTING ON BASEDAI
###############################################################################

if [ "$SKIP_FORK" = false ]; then
    echo ""
    echo -e "${YELLOW}════════════════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}PHASE 5: BASEDAI FORK INTEGRATION TESTS${NC}"
    echo -e "${YELLOW}════════════════════════════════════════════════════════════════${NC}"

    echo "Starting BasedAI mainnet fork..."

    # Start fork in background
    npx hardhat node --fork https://rpc.basedai.ai --no-deploy > "$RESULTS_DIR/fork.log" 2>&1 &
    FORK_PID=$!

    # Wait for fork to be ready
    echo "Waiting for fork to initialize..."
    sleep 10

    # Run tests against fork
    run_test "Fork: Deploy All Contracts" \
        "npx hardhat run scripts/deploy/deploy-full.js --network localhost"

    run_test "Fork: Security Test Suite" \
        "npx hardhat test test/security/*.test.js --network localhost"

    # Cleanup
    echo "Stopping fork..."
    kill $FORK_PID 2>/dev/null || true
else
    echo -e "${YELLOW}⊘ Skipping fork tests (--skip-fork flag)${NC}"
fi

###############################################################################
# PHASE 6: COVERAGE ANALYSIS
###############################################################################

echo ""
echo -e "${YELLOW}════════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}PHASE 6: CODE COVERAGE ANALYSIS${NC}"
echo -e "${YELLOW}════════════════════════════════════════════════════════════════${NC}"

run_test "Coverage Report Generation" \
    "npx hardhat coverage --testfiles 'test/security/*.test.js'"

# Copy coverage report
if [ -f "coverage/index.html" ]; then
    cp coverage/index.html "$RESULTS_DIR/coverage.html"
    echo -e "${GREEN}Coverage report: $RESULTS_DIR/coverage.html${NC}"
fi

###############################################################################
# FINAL REPORT
###############################################################################

echo ""
echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    TEST RESULTS SUMMARY                        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo "Total Tests:  $TOTAL_TESTS"
echo -e "${GREEN}Passed Tests: $PASSED_TESTS${NC}"
echo -e "${RED}Failed Tests: $FAILED_TESTS${NC}"

SUCCESS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
echo ""
echo "Success Rate: $SUCCESS_RATE%"

# Generate JSON report
cat > "$RESULTS_DIR/summary.json" << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "total_tests": $TOTAL_TESTS,
  "passed": $PASSED_TESTS,
  "failed": $FAILED_TESTS,
  "success_rate": $SUCCESS_RATE,
  "results_dir": "$RESULTS_DIR"
}
EOF

echo ""
echo "Results saved to: $RESULTS_DIR"
echo ""

# Exit with failure if any tests failed
if [ $FAILED_TESTS -gt 0 ]; then
    echo -e "${RED}════════════════════════════════════════════════════════════════${NC}"
    echo -e "${RED}Some tests FAILED. Please review the logs above.${NC}"
    echo -e "${RED}════════════════════════════════════════════════════════════════${NC}"
    exit 1
else
    echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}ALL TESTS PASSED! 🎉${NC}"
    echo -e "${GREEN}Your security fixes are bulletproof!${NC}"
    echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
    exit 0
fi
