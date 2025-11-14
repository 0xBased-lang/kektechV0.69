#!/bin/bash

# validate-target-file.sh
# Validates if a file is in the target architecture whitelist
# Usage: ./scripts/validate-target-file.sh <filepath>

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the file path from argument
FILE_PATH="$1"

if [ -z "$FILE_PATH" ]; then
    echo -e "${RED}❌ ERROR: No file path provided${NC}"
    echo "Usage: ./scripts/validate-target-file.sh <filepath>"
    echo "Example: ./scripts/validate-target-file.sh contracts/core/VersionedRegistry.sol"
    exit 1
fi

# Check if file exists
if [ ! -f "$FILE_PATH" ]; then
    echo -e "${RED}❌ ERROR: File not found: $FILE_PATH${NC}"
    exit 1
fi

echo "🔍 Validating file: $FILE_PATH"
echo ""

# TARGET ARCHITECTURE WHITELIST (7 core + 2 registries + 5 libraries + interfaces)
# Based on docs/active/TARGET_ARCHITECTURE.md

declare -a TARGET_FILES=(
    # 7 Core Contracts
    "contracts/core/VersionedRegistry.sol"
    "contracts/core/FlexibleMarketFactoryUnified.sol"
    "contracts/core/PredictionMarket.sol"
    "contracts/core/ResolutionManager.sol"
    "contracts/core/ParameterStorage.sol"
    "contracts/core/RewardDistributor.sol"
    "contracts/core/AccessControlManager.sol"

    # 2 Supporting Registries
    "contracts/core/CurveRegistry.sol"
    "contracts/core/MarketTemplateRegistry.sol"

    # 5 Internal Libraries
    "contracts/libraries/CurveMarketLogic.sol"
    "contracts/libraries/TemplateMarketLogic.sol"
    "contracts/libraries/SafeMath.sol"
    "contracts/libraries/ReentrancyGuard.sol"
)

# BLOCKED FILES (archived deprecated code)
declare -a BLOCKED_FILES=(
    "archive/phase-3-deprecated/contracts/FlexibleMarketFactory.sol"
    "archive/phase-3-deprecated/contracts/FlexibleMarketFactoryCore.sol"
    "archive/phase-3-deprecated/contracts/FlexibleMarketFactoryExtensions.sol"
    "archive/phase-3-deprecated/contracts/MasterRegistry.sol"
    "archive/phase-3-deprecated/contracts/ProposalManager.sol"
    "archive/phase-3-deprecated/contracts/ProposalManagerV2.sol"
    "archive/phase-3-deprecated/interfaces/IMasterRegistry.sol"
    "archive/phase-3-deprecated/interfaces/IProposalManager.sol"
    "archive/phase-3-deprecated/interfaces/IProposalManagerV2.sol"
)

# Check if file is in archive directory (BLOCKED)
if [[ "$FILE_PATH" == *"archive/phase-3-deprecated"* ]]; then
    echo -e "${RED}❌ BLOCKED: File is in archived deprecated directory${NC}"
    echo ""
    echo "This file is archived and MUST NOT be modified."
    echo ""
    echo "Archived files are:"
    echo "  - Out of Hardhat compilation scope"
    echo "  - Blocked by git pre-commit hook"
    echo "  - Blocked by CI/CD pipeline"
    echo ""
    echo "See: archive/phase-3-deprecated/README.md"
    echo "See: docs/active/TARGET_ARCHITECTURE.md"
    exit 1
fi

# Check if file is in archive directory (BLOCKED)
if [[ "$FILE_PATH" == *"archive"* ]]; then
    echo -e "${RED}❌ BLOCKED: File is in archive directory${NC}"
    echo ""
    echo "This file is archived and MUST NOT be modified."
    echo ""
    echo "Archived scripts are for reference only."
    echo "Create new deployment scripts instead."
    exit 1
fi

# Check if file is specifically blocked
for blocked in "${BLOCKED_FILES[@]}"; do
    if [[ "$FILE_PATH" == *"$blocked"* ]]; then
        echo -e "${RED}❌ BLOCKED: File is in deprecated list${NC}"
        echo ""
        echo "This file was archived during migration."
        echo ""
        echo "See: docs/active/TARGET_ARCHITECTURE.md for replacement"
        exit 1
    fi
done

# Check if file is in target architecture whitelist
IN_TARGET=false
for target in "${TARGET_FILES[@]}"; do
    if [[ "$FILE_PATH" == *"$target"* ]]; then
        IN_TARGET=true
        echo -e "${GREEN}✅ SAFE: File is in target architecture${NC}"
        echo ""
        echo "This file is part of the migration target and safe to modify."
        echo ""
        echo "Remember to:"
        echo "  1. Follow the phase checklist"
        echo "  2. Write tests before modifying"
        echo "  3. Update checklist after completing tasks"
        echo "  4. Run validation before deploying"
        break
    fi
done

# Check if file is a test file (always safe)
if [[ "$FILE_PATH" == *"test/"* ]] && ! $IN_TARGET; then
    echo -e "${GREEN}✅ SAFE: Test file (always safe to modify)${NC}"
    echo ""
    echo "Test files are always safe to modify."
    echo ""
    echo "Remember to:"
    echo "  - Follow TDD principles (write tests first)"
    echo "  - Ensure tests pass before committing"
    echo "  - Aim for 95%+ test coverage"
    exit 0
fi

# Check if file is a documentation file (always safe)
if [[ "$FILE_PATH" == *"docs/"* ]] && ! $IN_TARGET; then
    echo -e "${GREEN}✅ SAFE: Documentation file (always safe to modify)${NC}"
    echo ""
    echo "Documentation files are always safe to modify."
    echo ""
    echo "Remember to:"
    echo "  - Keep documentation in sync with code"
    echo "  - Update TARGET_ARCHITECTURE.md if architecture changes"
    echo "  - Update MIGRATION_IMPLEMENTATION_CHECKLIST.md for progress"
    exit 0
fi

# Check if file is an interface (always safe, but warn)
if [[ "$FILE_PATH" == *"interfaces/"* ]] && ! $IN_TARGET; then
    echo -e "${GREEN}✅ SAFE: Interface file${NC}"
    echo ""
    echo "Interface files are safe to modify."
    echo ""
    echo "Remember to:"
    echo "  - Keep interfaces in sync with contracts"
    echo "  - Update implementing contracts if interface changes"
    echo "  - Document breaking changes"
    exit 0
fi

# Check if file is a library (safe, but warn)
if [[ "$FILE_PATH" == *"libraries/"* ]] && ! $IN_TARGET; then
    echo -e "${YELLOW}⚠️  WARNING: Library file not in target list${NC}"
    echo ""
    echo "This library is not explicitly listed in TARGET_ARCHITECTURE.md"
    echo ""
    echo "If this is a new library:"
    echo "  1. Document it in docs/active/TARGET_ARCHITECTURE.md"
    echo "  2. Add comprehensive tests"
    echo "  3. Update phase documentation"
    echo ""
    echo "If this is an old library:"
    echo "  1. Consider archiving it to archive/phase-3-deprecated/"
    echo "  2. Check if it's still being used"
    exit 0
fi

# Check if file is a utility script (safe)
if [[ "$FILE_PATH" == *"scripts/"* ]] && [[ "$FILE_PATH" != *"deploy/"* ]]; then
    echo -e "${GREEN}✅ SAFE: Utility script${NC}"
    echo ""
    echo "Utility scripts are safe to modify."
    exit 0
fi

# If not in target and not explicitly safe, warn
if ! $IN_TARGET; then
    echo -e "${YELLOW}⚠️  WARNING: File not in target architecture${NC}"
    echo ""
    echo "This file is not explicitly listed in TARGET_ARCHITECTURE.md"
    echo ""
    echo "Before modifying:"
    echo "  1. Check docs/active/TARGET_ARCHITECTURE.md"
    echo "  2. Check docs/migration/MIGRATION_IMPLEMENTATION_CHECKLIST.md"
    echo "  3. Ensure this file is part of current phase work"
    echo "  4. Document why you're modifying this file"
    echo ""
    echo "If this is correct, proceed with caution."
    exit 0
fi

exit 0
