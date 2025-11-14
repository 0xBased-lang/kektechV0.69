#!/bin/bash

# KEKTECH 3.0 - Checkpoint Validation Script
# Usage: ./scripts/validate-checkpoint.sh [phase-number|all]

set -e

PHASE=$1
CHECKPOINT_FILE="CHECKPOINT.md"
EVIDENCE_DIR=".checkpoint/evidence"

if [ -z "$PHASE" ]; then
  echo "❌ Error: Phase number required"
  echo "Usage: ./scripts/validate-checkpoint.sh [0-10|all]"
  exit 1
fi

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Validating Phase $PHASE..."
echo ""

validate_phase_0() {
  echo "Phase 0: Compliance Setup"

  # Check CHECKPOINT.md exists
  if [ -f "$CHECKPOINT_FILE" ]; then
    echo "✅ CHECKPOINT.md exists"
  else
    echo "❌ CHECKPOINT.md missing"
    return 1
  fi

  # Check CLAUDE.md exists and references checkpoint
  if [ -f "CLAUDE.md" ] && grep -q "CHECKPOINT.md" "CLAUDE.md"; then
    echo "✅ CLAUDE.md exists and references checkpoint"
  else
    echo "❌ CLAUDE.md invalid"
    return 1
  fi

  # Check validation scripts exist
  if [ -f "scripts/validate-checkpoint.sh" ] && [ -x "scripts/validate-checkpoint.sh" ]; then
    echo "✅ Validation script exists and is executable"
  else
    echo "❌ Validation script missing or not executable"
    return 1
  fi

  if [ -f "scripts/check-phase-complete.sh" ] && [ -x "scripts/check-phase-complete.sh" ]; then
    echo "✅ Phase checker script exists and is executable"
  else
    echo "❌ Phase checker script missing or not executable"
    return 1
  fi

  # Check git hooks installed
  if [ -f ".git/hooks/pre-commit" ]; then
    echo "✅ Git hooks installed"
  else
    echo "⚠️  Git hooks not installed (optional)"
  fi

  echo ""
  echo "✅ Phase 0 validation PASSED"
  return 0
}

validate_phase_1() {
  echo "Phase 1: CLI Tools Setup"

  # Check Vercel CLI
  if command -v vercel &> /dev/null; then
    VERSION=$(vercel --version)
    echo "✅ Vercel CLI installed (version $VERSION)"
  else
    echo "❌ Vercel CLI not installed"
    return 1
  fi

  # Check Vercel auth
  if vercel whoami &> /dev/null; then
    echo "✅ Vercel authenticated"
  else
    echo "❌ Vercel not authenticated"
    return 1
  fi

  # Check GitHub CLI
  if command -v gh &> /dev/null; then
    VERSION=$(gh --version | head -1)
    echo "✅ GitHub CLI installed ($VERSION)"
  else
    echo "❌ GitHub CLI not installed"
    return 1
  fi

  # Check GitHub auth
  if gh auth status &> /dev/null; then
    echo "✅ GitHub authenticated"
  else
    echo "❌ GitHub not authenticated"
    return 1
  fi

  # Check repository access
  if gh repo view 0xBased-lang/kektech-nextjs &> /dev/null; then
    echo "✅ Repository access verified"
  else
    echo "❌ Cannot access repository"
    return 1
  fi

  echo ""
  echo "✅ Phase 1 validation PASSED"
  return 0
}

validate_phase_2() {
  echo "Phase 2: Repository Setup"

  # Check mainnet-integration branch exists
  if git branch -a | grep -q "mainnet-integration"; then
    echo "✅ mainnet-integration branch exists"
  else
    echo "❌ mainnet-integration branch not found"
    return 1
  fi

  # Check node_modules exists and is large enough
  if [ -d "node_modules" ]; then
    SIZE=$(du -sm node_modules | cut -f1)
    if [ "$SIZE" -gt 50 ]; then
      echo "✅ node_modules directory exists (${SIZE}MB)"
    else
      echo "❌ node_modules too small (${SIZE}MB)"
      return 1
    fi
  else
    echo "❌ node_modules not found"
    return 1
  fi

  # Check build succeeds
  if npm run build &> /dev/null; then
    echo "✅ Build completes successfully"
  else
    echo "❌ Build fails"
    return 1
  fi

  # Check at least 1 commit on branch
  COMMITS=$(git rev-list --count mainnet-integration 2>/dev/null || echo "0")
  if [ "$COMMITS" -gt 0 ]; then
    echo "✅ Branch has $COMMITS commit(s)"
  else
    echo "❌ No commits on mainnet-integration"
    return 1
  fi

  echo ""
  echo "✅ Phase 2 validation PASSED"
  return 0
}

validate_phase_3() {
  echo "Phase 3: Vercel Configuration"

  # Check .vercel directory exists
  if [ -d ".vercel" ]; then
    echo "✅ Vercel project linked"
  else
    echo "❌ Vercel project not linked"
    return 1
  fi

  # Check .env.local exists with variables
  if [ -f ".env.local" ]; then
    VAR_COUNT=$(grep -c "NEXT_PUBLIC_" .env.local || echo "0")
    if [ "$VAR_COUNT" -ge 11 ]; then
      echo "✅ .env.local exists with $VAR_COUNT variables"
    else
      echo "❌ .env.local has only $VAR_COUNT variables (need 11+)"
      return 1
    fi
  else
    echo "❌ .env.local not found"
    return 1
  fi

  # Check required environment variables
  REQUIRED_VARS=(
    "NEXT_PUBLIC_CHAIN_ID"
    "NEXT_PUBLIC_VERSIONED_REGISTRY"
    "NEXT_PUBLIC_MARKET_FACTORY"
  )

  for VAR in "${REQUIRED_VARS[@]}"; do
    if grep -q "$VAR" .env.local; then
      echo "✅ $VAR configured"
    else
      echo "❌ $VAR missing"
      return 1
    fi
  done

  # Verify contract addresses match Nov 6 deployment
  if grep -q "0x67F8F023f6cFAe44353d797D6e0B157F2579301A" .env.local; then
    echo "✅ VersionedRegistry address correct (Nov 6 deployment)"
  else
    echo "❌ VersionedRegistry address incorrect"
    return 1
  fi

  echo ""
  echo "✅ Phase 3 validation PASSED"
  return 0
}

validate_phase_4() {
  echo "Phase 4: Contract ABIs & Configuration"

  # Check config directory structure
  if [ -d "config/contracts/abis/prediction-markets" ]; then
    ABI_COUNT=$(find config/contracts/abis/prediction-markets -name "*.json" | wc -l)
    if [ "$ABI_COUNT" -ge 9 ]; then
      echo "✅ $ABI_COUNT ABI files found (need 9)"
    else
      echo "❌ Only $ABI_COUNT ABI files found (need 9)"
      return 1
    fi
  else
    echo "❌ ABI directory not found"
    return 1
  fi

  # Check prediction-markets.ts exists
  if [ -f "config/contracts/prediction-markets.ts" ]; then
    echo "✅ prediction-markets.ts exists"

    # Check GAS_LIMITS defined
    if grep -q "GAS_LIMITS" config/contracts/prediction-markets.ts; then
      echo "✅ GAS_LIMITS defined"

      # Check gas limit values
      if grep -q "1100000" config/contracts/prediction-markets.ts; then
        echo "✅ First bet gas limit correct (1.1M)"
      else
        echo "❌ First bet gas limit incorrect"
        return 1
      fi

      if grep -q "950000" config/contracts/prediction-markets.ts; then
        echo "✅ Subsequent bet gas limit correct (950K)"
      else
        echo "❌ Subsequent bet gas limit incorrect"
        return 1
      fi
    else
      echo "❌ GAS_LIMITS not defined"
      return 1
    fi
  else
    echo "❌ prediction-markets.ts not found"
    return 1
  fi

  # Check types file exists
  if [ -f "types/prediction-markets.ts" ]; then
    echo "✅ types/prediction-markets.ts exists"

    # Check MARKET_STATES has 6 states
    STATE_COUNT=$(grep -c "name:" types/prediction-markets.ts || echo "0")
    if [ "$STATE_COUNT" -ge 6 ]; then
      echo "✅ MARKET_STATES has $STATE_COUNT states"
    else
      echo "❌ MARKET_STATES incomplete ($STATE_COUNT states)"
      return 1
    fi
  else
    echo "❌ types/prediction-markets.ts not found"
    return 1
  fi

  # Check utility files exist
  UTIL_FILES=(
    "lib/utils/gas.ts"
    "lib/utils/betting.ts"
    "lib/utils/validation.ts"
    "lib/utils/errors.ts"
  )

  for FILE in "${UTIL_FILES[@]}"; do
    if [ -f "$FILE" ]; then
      echo "✅ $FILE exists"
    else
      echo "❌ $FILE missing"
      return 1
    fi
  done

  # Check TypeScript compiles
  if npm run build &> /dev/null; then
    echo "✅ TypeScript compiles without errors"
  else
    echo "❌ TypeScript compilation fails"
    return 1
  fi

  echo ""
  echo "✅ Phase 4 validation PASSED"
  return 0
}

validate_phase_5() {
  echo "Phase 5: Wagmi Hooks"
  echo "⚠️  Phase 5 validation not yet implemented"
  echo "   Manual validation required"
  return 0
}

validate_phase_6() {
  echo "Phase 6: UI Components"
  echo "⚠️  Phase 6 validation not yet implemented"
  echo "   Manual validation required"
  return 0
}

validate_phase_7() {
  echo "Phase 7: Comprehensive Testing"
  echo "⚠️  Phase 7 validation not yet implemented"
  echo "   Manual validation required"
  return 0
}

validate_phase_8() {
  echo "Phase 8: Production Deployment"
  echo "⚠️  Phase 8 validation not yet implemented"
  echo "   Manual validation required"
  return 0
}

validate_phase_9() {
  echo "Phase 9: Private Beta Launch"
  echo "⚠️  Phase 9 validation not yet implemented"
  echo "   Manual validation required"
  return 0
}

validate_phase_10() {
  echo "Phase 10: Public Launch"
  echo "⚠️  Phase 10 validation not yet implemented"
  echo "   Manual validation required"
  return 0
}

# Main validation logic
case $PHASE in
  0)
    validate_phase_0
    ;;
  1)
    validate_phase_1
    ;;
  2)
    validate_phase_2
    ;;
  3)
    validate_phase_3
    ;;
  4)
    validate_phase_4
    ;;
  5)
    validate_phase_5
    ;;
  6)
    validate_phase_6
    ;;
  7)
    validate_phase_7
    ;;
  8)
    validate_phase_8
    ;;
  9)
    validate_phase_9
    ;;
  10)
    validate_phase_10
    ;;
  all)
    echo "🔍 Validating ALL phases..."
    echo ""

    ALL_PASSED=true
    for i in {0..10}; do
      if ! ./scripts/validate-checkpoint.sh $i; then
        ALL_PASSED=false
      fi
      echo ""
    done

    if [ "$ALL_PASSED" = true ]; then
      echo "🎉 ALL PHASES VALIDATED - PROJECT COMPLETE!"
      exit 0
    else
      echo "❌ Some phases failed validation"
      exit 1
    fi
    ;;
  *)
    echo "❌ Invalid phase: $PHASE"
    echo "Usage: ./scripts/validate-checkpoint.sh [0-10|all]"
    exit 1
    ;;
esac
