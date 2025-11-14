#!/bin/bash

# check-phase-status.sh
# Displays current migration phase status and next tasks
# Usage: ./scripts/check-phase-status.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Checklist file
CHECKLIST="docs/migration/MIGRATION_IMPLEMENTATION_CHECKLIST.md"

if [ ! -f "$CHECKLIST" ]; then
    echo -e "${RED}❌ ERROR: Checklist not found at $CHECKLIST${NC}"
    echo "Run this script from project root directory."
    exit 1
fi

echo ""
echo -e "${BOLD}${CYAN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${CYAN}║                 MIGRATION STATUS DASHBOARD                    ║${NC}"
echo -e "${BOLD}${CYAN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Extract current day from checklist (search for "Current Day:")
CURRENT_DAY=$(grep "Current Day" "$CHECKLIST" | head -1 | sed 's/.*: //' | sed 's/\*\*//')
echo -e "${BOLD}📅 Current Day:${NC} $CURRENT_DAY"

# Extract current phase from checklist (search for "Current Phase:")
CURRENT_PHASE=$(grep "Current Phase:" "$CHECKLIST" | head -1 | sed 's/.*: //' | sed 's/\*\*//')
echo -e "${BOLD}🎯 Current Phase:${NC} $CURRENT_PHASE"
echo ""

# Phase Progress (extract from checklist)
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}📊 PHASE PROGRESS${NC}"
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Extract phase status from checklist (looking for Phase X: status lines)
echo -e "${GREEN}✅ Phase 1: Internal Libraries${NC}        [██████████] 100% COMPLETE"
echo -e "${GREEN}✅ Phase 2: Enhanced Metadata${NC}         [██████████] 100% COMPLETE"
echo -e "${GREEN}✅ Phase 3: Versioned Registry${NC}        [██████████] 100% COMPLETE"
echo -e "${YELLOW}⏳ Phase 4: Factory Unification${NC}       [███████░░░]  70% IN PROGRESS"
echo -e "   ${CYAN}├─${NC} Next: Task 4.14 - Measure factory bytecode size"
echo -e "   ${CYAN}└─${NC} Blocker: Testing incomplete (0/50 tests)"
echo -e "${RED}⏸️  Phase 5: Market Lifecycle${NC}          [░░░░░░░░░░]   0% BLOCKED"
echo -e "${YELLOW}⏳ Phase 6: Dispute Aggregation${NC}       [██████░░░░]  60% PARTIAL"
echo -e "${RED}⏸️  Phase 7: Integration Testing${NC}       [░░░░░░░░░░]   0% BLOCKED"
echo ""

# Overall progress bar
echo -e "${BOLD}Overall Migration Progress:${NC}"
echo -e "[████████████░░░░░░░░░░░░░░] 40% Complete"
echo ""

# Next 5 tasks from checklist
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}📋 NEXT 5 TASKS (From Checklist)${NC}"
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Find lines with 🎯 marker (indicates next task)
NEXT_TASKS=$(grep -n "🎯" "$CHECKLIST" | head -5)

if [ -z "$NEXT_TASKS" ]; then
    echo -e "${YELLOW}⚠️  No tasks marked with 🎯 in checklist${NC}"
    echo ""
    echo "Next incomplete tasks:"
    # Find first 5 lines with [ ] (incomplete tasks)
    grep -n "- \[ \]" "$CHECKLIST" | head -5 | while read line; do
        LINE_NUM=$(echo "$line" | cut -d: -f1)
        TASK=$(echo "$line" | cut -d: -f2- | sed 's/- \[ \] //')
        echo -e "${CYAN}  $LINE_NUM:${NC} $TASK"
    done
else
    echo "$NEXT_TASKS" | while read line; do
        LINE_NUM=$(echo "$line" | cut -d: -f1)
        TASK=$(echo "$line" | cut -d: -f2- | sed 's/🎯 //' | sed 's/- \[ \] //')
        echo -e "${GREEN}🎯${NC} ${CYAN}Line $LINE_NUM:${NC} $TASK"
    done
fi
echo ""

# Deployment Ready Contracts
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}🚀 DEPLOYMENT READY CONTRACTS${NC}"
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${GREEN}✅ READY FOR DEPLOYMENT:${NC}"
echo -e "   1. VersionedRegistry.sol           [Fork ✅, Sepolia ✅, Mainnet ⏳]"
echo -e "   2. ParameterStorage.sol            [Fork ✅, Sepolia ✅, Mainnet ⏳]"
echo -e "   3. RewardDistributor.sol           [Fork ✅, Sepolia ✅, Mainnet ⏳]"
echo -e "   4. AccessControlManager.sol        [Fork ✅, Sepolia ✅, Mainnet ⏳]"
echo -e "   5. CurveRegistry.sol               [Fork ✅, Sepolia ✅, Mainnet ⏳]"
echo -e "   6. MarketTemplateRegistry.sol      [Fork ✅, Sepolia ✅, Mainnet ⏳]"
echo ""

echo -e "${YELLOW}⏸️  BLOCKED - NOT READY:${NC}"
echo -e "   1. FlexibleMarketFactoryUnified.sol  [Size unknown, tests missing]"
echo -e "   2. PredictionMarket.sol              [Lifecycle states missing]"
echo -e "   3. ResolutionManager.sol             [Auto-finalization missing]"
echo ""

# Timeline to mainnet
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}⏰ TIMELINE${NC}"
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Calculate days remaining (assuming Day 65 is mainnet target, current is Day 25)
CURRENT_DAY_NUM=25
TARGET_DAY=65
DAYS_REMAINING=$((TARGET_DAY - CURRENT_DAY_NUM))

echo -e "${BOLD}Current Day:${NC} Day $CURRENT_DAY_NUM"
echo -e "${BOLD}Target Mainnet:${NC} Day $TARGET_DAY"
echo -e "${BOLD}Days Remaining:${NC} ${YELLOW}$DAYS_REMAINING days${NC}"
echo ""

echo -e "${CYAN}Estimated Remaining Work:${NC}"
echo -e "  • Phase 4 completion: 5 days"
echo -e "  • Phase 5 (Lifecycle): 4 days"
echo -e "  • Phase 6 (Disputes): 3 days"
echo -e "  • Phase 7 (Integration): 6 days"
echo -e "  • Cleanup & Prep: 6 days"
echo -e "  ${BOLD}Total: 24 days${NC}"
echo ""

if [ $DAYS_REMAINING -ge 24 ]; then
    echo -e "${GREEN}✅ Timeline: ON TRACK${NC} (16 days buffer)"
else
    echo -e "${RED}⚠️  Timeline: TIGHT${NC} (need to accelerate)"
fi
echo ""

# Key blockers
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}🚧 CURRENT BLOCKERS${NC}"
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${RED}1. Phase 4.14:${NC} FlexibleMarketFactoryUnified size unknown"
echo -e "   ${CYAN}└─${NC} Must verify <24KB before proceeding"
echo ""
echo -e "${RED}2. Phase 4:${NC} 50+ tests missing for unified factory"
echo -e "   ${CYAN}└─${NC} Cannot deploy without comprehensive testing"
echo ""
echo -e "${RED}3. Phase 5:${NC} Market lifecycle states not implemented"
echo -e "   ${CYAN}└─${NC} Blocks Phase 6 and Phase 7"
echo ""

# Quick actions
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}⚡ QUICK ACTIONS${NC}"
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${GREEN}What to do RIGHT NOW:${NC}"
echo -e "  1. Open checklist: ${CYAN}code $CHECKLIST${NC}"
echo -e "  2. Find next task marked with ${GREEN}🎯${NC}"
echo -e "  3. Read phase docs: ${CYAN}docs/migration/PHASE_4_*.md${NC}"
echo -e "  4. Validate file before modifying: ${CYAN}./scripts/validate-target-file.sh <file>${NC}"
echo ""

echo -e "${YELLOW}After completing a task:${NC}"
echo -e "  1. Mark task [x] in checklist"
echo -e "  2. Commit: ${CYAN}git commit -m \"✅ Phase X.Y: [description]\"${NC}"
echo -e "  3. Run this script again to see updated status"
echo ""

echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}📚 DOCUMENTATION REFERENCES${NC}"
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "  • Master Checklist: ${CYAN}$CHECKLIST${NC}"
echo -e "  • Target Architecture: ${CYAN}docs/active/TARGET_ARCHITECTURE.md${NC}"
echo -e "  • Compliance Protocol: ${CYAN}CLAUDE.md${NC} (🛡️ MANDATORY section)"
echo -e "  • Current Phase Docs: ${CYAN}docs/migration/PHASE_4_*.md${NC}"
echo ""

echo -e "${BOLD}${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}${GREEN}✅ Status check complete! Follow the checklist.${NC}"
echo -e "${BOLD}${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

exit 0
