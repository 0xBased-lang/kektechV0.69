#!/bin/bash

# validate-deployment-simple.sh
# Simplified deployment validation (compatible with all bash versions)
# Usage: ./scripts/validate-deployment-simple.sh <contract-name>

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

CONTRACT_NAME="$1"

if [ -z "$CONTRACT_NAME" ]; then
    echo -e "${RED}❌ ERROR: No contract name provided${NC}"
    echo "Usage: ./scripts/validate-deployment-simple.sh <contract-name>"
    exit 1
fi

echo ""
echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════${NC}"
echo -e "${BOLD}   DEPLOYMENT VALIDATION: $CONTRACT_NAME${NC}"
echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════${NC}"
echo ""

VALIDATION_PASSED=true

# Check 1: Not deprecated
echo -e "${BOLD}CHECK 1: Is contract deprecated?${NC}"
case "$CONTRACT_NAME" in
    FlexibleMarketFactory|FlexibleMarketFactoryCore|FlexibleMarketFactoryExtensions|MasterRegistry|ProposalManager|ProposalManagerV2)
        echo -e "${RED}❌ BLOCKED: $CONTRACT_NAME is DEPRECATED${NC}"
        exit 1
        ;;
    *)
        echo -e "${GREEN}✅ PASS: Not deprecated${NC}"
        ;;
esac
echo ""

# Check 2: Deployment ready status
echo -e "${BOLD}CHECK 2: Is contract deployment ready?${NC}"
case "$CONTRACT_NAME" in
    VersionedRegistry|ParameterStorage|RewardDistributor|AccessControlManager|CurveRegistry|MarketTemplateRegistry)
        echo -e "${GREEN}✅ PASS: Marked deployment ready${NC}"
        ;;
    FlexibleMarketFactoryUnified)
        echo -e "${RED}❌ BLOCKED: Size unknown, tests missing${NC}"
        exit 1
        ;;
    PredictionMarket)
        echo -e "${RED}❌ BLOCKED: Lifecycle states missing (Phase 5)${NC}"
        exit 1
        ;;
    ResolutionManager)
        echo -e "${RED}❌ BLOCKED: Auto-finalization missing (Phase 6)${NC}"
        exit 1
        ;;
    *)
        echo -e "${YELLOW}⚠️  UNKNOWN: Contract not in checklist${NC}"
        VALIDATION_PASSED=false
        ;;
esac
echo ""

# Check 3: File exists
echo -e "${BOLD}CHECK 3: Locating contract file${NC}"
CONTRACT_FILE=$(find contracts -name "${CONTRACT_NAME}.sol" ! -path "*/deprecated/*" 2>/dev/null | head -1)
if [ -z "$CONTRACT_FILE" ]; then
    echo -e "${RED}❌ FAIL: File not found${NC}"
    exit 1
else
    echo -e "${GREEN}✅ PASS: Found at $CONTRACT_FILE${NC}"
fi
echo ""

# Check 4: Compilation
echo -e "${BOLD}CHECK 4: Compilation${NC}"
echo -e "${CYAN}Running: npx hardhat compile...${NC}"
if npx hardhat compile 2>&1 | grep -q "Compiled.*successfully"; then
    echo -e "${GREEN}✅ PASS: Compiles successfully${NC}"
else
    echo -e "${RED}❌ FAIL: Compilation errors${NC}"
    VALIDATION_PASSED=false
fi
echo ""

# Check 5: Tests exist
echo -e "${BOLD}CHECK 5: Test files${NC}"
TEST_FILES=$(find test -name "*${CONTRACT_NAME}*.test.js" 2>/dev/null)
if [ -z "$TEST_FILES" ]; then
    echo -e "${RED}❌ FAIL: No test files found${NC}"
    VALIDATION_PASSED=false
else
    echo -e "${GREEN}✅ PASS: Tests found${NC}"
fi
echo ""

# Final summary
echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════${NC}"
if [ "$VALIDATION_PASSED" = true ]; then
    echo -e "${GREEN}${BOLD}✅ DEPLOYMENT VALIDATION PASSED${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Deploy to fork: npm run deploy:fork"
    echo "  2. Deploy to Sepolia: npm run deploy:sepolia"
    echo "  3. Deploy to mainnet: (after Sepolia validation)"
    exit 0
else
    echo -e "${RED}${BOLD}❌ DEPLOYMENT VALIDATION FAILED${NC}"
    echo ""
    echo "Fix all issues before deploying."
    exit 1
fi
