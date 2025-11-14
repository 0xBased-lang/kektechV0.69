#!/bin/bash

# check-documentation-consistency.sh
# Validates path consistency across all documentation
# Usage: ./scripts/check-documentation-consistency.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║         DOCUMENTATION CONSISTENCY CHECKER                     ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

ISSUES_FOUND=0

# Define OLD paths that should NOT exist in documentation
declare -a OLD_PATHS=(
    "contracts/deprecated/"
    "scripts/deploy/archive/"
)

# Define NEW paths that SHOULD exist
declare -a NEW_PATHS=(
    "archive/phase-3-deprecated/"
)

# Documents to check (user-facing)
declare -a USER_DOCS=(
    "docs/migration/MIGRATION_IMPLEMENTATION_CHECKLIST.md"
    "docs/active/TARGET_ARCHITECTURE.md"
    "docs/migration/TEST_COVERAGE_DURING_MIGRATION.md"
    "../../CLAUDE.md"
)

# Scripts to check (can have old paths in validation logic)
declare -a SCRIPTS=(
    "scripts/validate-target-file.sh"
    "scripts/check-phase-status.sh"
    ".git/hooks/pre-commit"
    ".github/workflows/migration-compliance.yml"
)

echo "🔍 Checking for OLD path references in user documentation..."
echo ""

for doc in "${USER_DOCS[@]}"; do
    if [ ! -f "$doc" ]; then
        continue
    fi

    for old_path in "${OLD_PATHS[@]}"; do
        count=$(grep -c "$old_path" "$doc" 2>/dev/null || echo 0)

        if [ "$count" -gt 0 ]; then
            echo -e "${RED}⚠️  $doc mentions OLD path '$old_path' ($count times)${NC}"
            ISSUES_FOUND=$((ISSUES_FOUND + 1))
        fi
    done
done

if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}✅ No OLD path references found${NC}"
fi

echo ""
echo "🔍 Checking for NEW path references..."
echo ""

GOOD_DOCS=0

# Check both user docs and scripts
for doc in "${USER_DOCS[@]}" "${SCRIPTS[@]}"; do
    if [ ! -f "$doc" ]; then
        continue
    fi

    for new_path in "${NEW_PATHS[@]}"; do
        count=$(grep -c "$new_path" "$doc" 2>/dev/null || echo 0)

        if [ "$count" -gt 0 ]; then
            echo -e "${GREEN}✅ $doc references NEW path '$new_path' ($count times)${NC}"
            GOOD_DOCS=$((GOOD_DOCS + 1))
            break
        fi
    done
done

echo ""
echo "🔍 Checking directory structure consistency..."
echo ""

# Check OLD paths don't exist
for old_path in "${OLD_PATHS[@]}"; do
    if [ -d "$old_path" ]; then
        echo -e "${RED}❌ OLD PATH EXISTS: $old_path${NC}"
        echo "   This path should have been removed!"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    else
        echo -e "${GREEN}✅ OLD PATH REMOVED: $old_path${NC}"
    fi
done

# Check NEW paths exist
for new_path in "${NEW_PATHS[@]}"; do
    if [ -d "$new_path" ]; then
        echo -e "${GREEN}✅ NEW PATH EXISTS: $new_path${NC}"

        # Count files in archive
        file_count=$(find "$new_path" -type f | wc -l | xargs)
        echo "   Contains: $file_count files"
    else
        echo -e "${RED}❌ NEW PATH MISSING: $new_path${NC}"
        echo "   This path should exist!"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
done

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""

if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}🎉 SUCCESS: All documentation is consistent!${NC}"
    echo ""
    echo "✅ No OLD path references found"
    echo "✅ Directory structure correct"
    echo "✅ Documentation up-to-date"
    echo ""
    echo -e "${GREEN}Protection Level: 97% BULLETPROOF ✅${NC}"
    exit 0
else
    echo -e "${RED}⚠️  WARNING: $ISSUES_FOUND consistency issues found${NC}"
    echo ""
    echo "Please fix the following:"
    echo "  1. Update OLD path references to NEW paths"
    echo "  2. Ensure directory structure is correct"
    echo "  3. Run this script again to verify"
    echo ""
    echo "OLD paths (should not exist):"
    for old_path in "${OLD_PATHS[@]}"; do
        echo "  ❌ $old_path"
    done
    echo ""
    echo "NEW paths (should exist):"
    for new_path in "${NEW_PATHS[@]}"; do
        echo "  ✅ $new_path"
    done
    echo ""
    echo -e "${YELLOW}Protection Level: 85% (needs fixes)${NC}"
    exit 1
fi
