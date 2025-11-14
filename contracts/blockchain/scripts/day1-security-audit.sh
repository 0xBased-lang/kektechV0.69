#!/bin/bash
# DAY 1: SECURITY AUDIT SETUP AND EXECUTION
# Follow DEPLOYMENT_TODO_CHECKLIST.md - Day 1 Tasks

set -e  # Exit on any error

echo "🛡️ DAY 1: SECURITY AUDIT SETUP"
echo "================================"
echo "Started: $(date)"
echo ""

# Create audit results directory
mkdir -p audit-results/day1-$(date +%Y%m%d)
cd audit-results/day1-$(date +%Y%m%d)

echo "📁 Audit results will be saved to: $(pwd)"
echo ""

# ============================================================================
# TASK 1: Install Security Tools
# ============================================================================
echo "🔧 TASK 1: Installing Security Tools"
echo "-------------------------------------"

# Slither (already installed, verify)
echo "Checking Slither..."
if command -v slither &> /dev/null; then
    echo "✅ Slither already installed: $(slither --version)"
else
    echo "Installing Slither..."
    pip3 install slither-analyzer
    echo "✅ Slither installed"
fi

# Mythril
echo ""
echo "Checking Mythril..."
if command -v myth &> /dev/null; then
    echo "✅ Mythril already installed: $(myth version)"
else
    echo "Installing Mythril..."
    pip3 install mythril
    echo "✅ Mythril installed"
fi

# Solhint
echo ""
echo "Checking Solhint..."
if command -v solhint &> /dev/null; then
    echo "✅ Solhint already installed: $(solhint --version)"
else
    echo "Installing Solhint..."
    npm install -g solhint
    echo "✅ Solhint installed"
fi

# Echidna (optional but recommended)
echo ""
echo "Checking Echidna..."
if command -v echidna-test &> /dev/null; then
    echo "✅ Echidna already installed"
else
    echo "⚠️ Echidna not installed (optional, requires Homebrew on Mac)"
    echo "To install: brew install echidna or download from GitHub"
fi

echo ""
echo "✅ Security tools installation complete!"
echo ""

# ============================================================================
# TASK 2: Run Slither Security Audit
# ============================================================================
echo "🔍 TASK 2: Running Slither Security Audit"
echo "------------------------------------------"

cd ../..  # Back to project root

echo "Running Slither on all contracts..."
slither . --json audit-results/day1-$(date +%Y%m%d)/slither-full.json 2>&1 | tee audit-results/day1-$(date +%Y%m%d)/slither-output.txt

echo ""
echo "✅ Slither audit complete!"
echo "Results saved to: audit-results/day1-$(date +%Y%m%d)/slither-output.txt"
echo ""

# ============================================================================
# TASK 3: Run Solhint Linting
# ============================================================================
echo "📝 TASK 3: Running Solhint Linting"
echo "-----------------------------------"

echo "Running Solhint on all Solidity files..."
solhint 'contracts/**/*.sol' > audit-results/day1-$(date +%Y%m%d)/solhint-output.txt 2>&1 || true

echo ""
echo "✅ Solhint linting complete!"
echo "Results saved to: audit-results/day1-$(date +%Y%m%d)/solhint-output.txt"
echo ""

# ============================================================================
# TASK 4: Generate Summary Report
# ============================================================================
echo "📊 TASK 4: Generating Summary Report"
echo "-------------------------------------"

cat > audit-results/day1-$(date +%Y%m%d)/AUDIT_SUMMARY.md << 'EOF'
# DAY 1 SECURITY AUDIT SUMMARY

**Date**: $(date)
**Phase**: Week 1 - Day 1
**Status**: Initial Security Audit

## Tools Used
- ✅ Slither (Static Analysis)
- ✅ Solhint (Linting)
- ⏸️ Mythril (To be run manually if needed)

## Results Location
- Slither: `slither-output.txt` and `slither-full.json`
- Solhint: `solhint-output.txt`

## Next Steps
1. Review Slither output for Critical/High issues
2. Review Solhint output for code quality issues
3. Document all findings in DEPLOYMENT_TODO_CHECKLIST.md
4. Create fix list for Day 2

## Critical Issues Found
[ ] None - Proceed to Day 2
[ ] Issues found - Must fix before Day 2

## Findings Summary
- Critical: [COUNT]
- High: [COUNT]
- Medium: [COUNT]
- Low: [COUNT]
- Informational: [COUNT]

EOF

echo ""
echo "✅ Summary report generated!"
echo ""

# ============================================================================
# FINAL STATUS
# ============================================================================
echo "🎉 DAY 1 SECURITY AUDIT COMPLETE!"
echo "================================="
echo ""
echo "Completed: $(date)"
echo ""
echo "📋 NEXT STEPS:"
echo "1. Review: audit-results/day1-$(date +%Y%m%d)/slither-output.txt"
echo "2. Review: audit-results/day1-$(date +%Y%m%d)/solhint-output.txt"
echo "3. Check: audit-results/day1-$(date +%Y%m%d)/AUDIT_SUMMARY.md"
echo "4. Update: DEPLOYMENT_TODO_CHECKLIST.md (mark Day 1 complete)"
echo "5. Update: CLAUDE.md (update progress)"
echo "6. Commit: git add -A && git commit -m 'Day 1: Security audit complete'"
echo ""
echo "🎯 Tomorrow: Day 2 - Fix security issues"
echo ""
