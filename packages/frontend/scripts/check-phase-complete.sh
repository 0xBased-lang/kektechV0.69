#!/bin/bash

# Check if a phase is complete before proceeding
# Usage: ./scripts/check-phase-complete.sh [phase-number]

PHASE=$1
CHECKPOINT_FILE="CHECKPOINT.md"

if [ -z "$PHASE" ]; then
  echo "❌ Error: Phase number required"
  echo "Usage: ./scripts/check-phase-complete.sh [phase-number]"
  exit 1
fi

echo "🔍 Checking if Phase $PHASE is complete..."

# Check if CHECKPOINT.md exists
if [ ! -f "$CHECKPOINT_FILE" ]; then
  echo "❌ CHECKPOINT.md not found!"
  exit 1
fi

# Check if phase is marked complete
if grep -A 50 "^## PHASE $PHASE:" "$CHECKPOINT_FILE" | grep -q "Result: ✅ COMPLETE"; then
  echo "✅ Phase $PHASE is complete"
  exit 0
else
  echo "❌ Phase $PHASE is NOT complete"
  echo ""
  echo "Please complete Phase $PHASE before proceeding:"
  echo "1. Complete all tasks in CHECKPOINT.md Phase $PHASE"
  echo "2. Run validation: ./scripts/validate-checkpoint.sh $PHASE"
  echo "3. Update CHECKPOINT.md with completion status"
  exit 1
fi
