#!/bin/bash

echo "🎯 Starting directory reorganization..."
echo ""

# Step 1: Create directories
echo "📁 Creating new directory structure..."
mkdir -p docs/current
mkdir -p docs/archive/week-1
mkdir -p docs/archive/week-2
mkdir -p docs/archive/deployment-history
mkdir -p docs/archive/planning
mkdir -p docs/snapshots
mkdir -p deployments
mkdir -p test-results/week-2

# Move existing audit-results if in root
if [ -d "audit-results" ]; then
    mv audit-results docs/archive/ 2>/dev/null
fi

# Step 2: Move current documents
echo "📄 Moving current documents..."
mv WEEK_2_FINAL_SUMMARY.md docs/current/ 2>/dev/null
mv FINAL_PRE_MAINNET_TESTING_STRATEGY.md docs/current/ 2>/dev/null
mv SECURITY_AUDIT_REPORT_DAY_15.md docs/current/ 2>/dev/null
mv COMPREHENSIVE_STATUS_AUDIT_DAY_16.md docs/current/ 2>/dev/null
mv DAY_17_REVISED_COMPLETE.md docs/current/ 2>/dev/null

# Step 3: Move Week 1 docs
echo "📚 Moving Week 1 documentation..."
mv DAY_8_*.md docs/archive/week-1/ 2>/dev/null
mv DAY_9_*.md docs/archive/week-1/ 2>/dev/null
mv DAY_10_*.md docs/archive/week-1/ 2>/dev/null
mv WEEK_1_FINAL_SUMMARY.md docs/archive/week-1/ 2>/dev/null

# Step 4: Move Week 2 docs
echo "📚 Moving Week 2 documentation..."
mv WEEK_2_KICKOFF_DAY_11.md docs/archive/week-2/ 2>/dev/null
mv DAY_11_*.md docs/archive/week-2/ 2>/dev/null
mv DAY_12_*.md docs/archive/week-2/ 2>/dev/null
mv DAY_13_*.md docs/archive/week-2/ 2>/dev/null
mv DAY_14_*.md docs/archive/week-2/ 2>/dev/null
mv DAY_15_*.md docs/archive/week-2/ 2>/dev/null
mv DAY_16_*.md docs/archive/week-2/ 2>/dev/null
mv DAY_17_COMPLETE.md docs/archive/week-2/ 2>/dev/null

# Step 5: Move deployment docs
echo "🚀 Moving deployment documentation..."
mv DEPLOYMENT*.md docs/archive/deployment-history/ 2>/dev/null
mv SEPOLIA_*.md docs/archive/deployment-history/ 2>/dev/null
mv FINAL-*.md docs/archive/deployment-history/ 2>/dev/null
mv MAINNET-*.md docs/archive/deployment-history/ 2>/dev/null
mv CONFIG_*.md docs/archive/deployment-history/ 2>/dev/null
mv PHASE_*.md docs/archive/deployment-history/ 2>/dev/null
mv TDD_*.md docs/archive/deployment-history/ 2>/dev/null
mv REFACTOR_*.md docs/archive/deployment-history/ 2>/dev/null
mv COMPLETE_*.md docs/archive/deployment-history/ 2>/dev/null

# Step 6: Move planning docs
echo "📋 Moving planning documentation..."
mv BLUEPRINT_*.md docs/archive/planning/ 2>/dev/null
mv FACTORY_*.md docs/archive/planning/ 2>/dev/null
mv VERIFICATION_*.md docs/archive/planning/ 2>/dev/null
mv BONDING_CURVE_*.md docs/archive/planning/ 2>/dev/null
mv LMSR_*.md docs/archive/planning/ 2>/dev/null
mv CLEANUP_*.md docs/archive/planning/ 2>/dev/null
mv COMPREHENSIVE_BLUEPRINT_*.md docs/archive/planning/ 2>/dev/null
mv KEKTECH_*.md docs/archive/planning/ 2>/dev/null
mv REVISED_*.md docs/archive/planning/ 2>/dev/null

# Step 7: Move deployment files
echo "💾 Moving deployment files..."
mv fork-deployment*.json deployments/ 2>/dev/null
mv sepolia-deployment*.json deployments/ 2>/dev/null
mv deployment-params.json deployments/ 2>/dev/null

# Step 8: Move test results
echo "🧪 Moving test results..."
mv day1[1-4]-*-results.json test-results/week-2/ 2>/dev/null

# Step 9: Move snapshot and planning docs
echo "📸 Moving state snapshots and planning..."
mv PRE_CONTRACT_CHANGES_STATE_SNAPSHOT.md docs/snapshots/ 2>/dev/null
mv DIRECTORY_REORGANIZATION_PLAN.md docs/snapshots/ 2>/dev/null

# Step 10: Move any remaining .md files to appropriate archive
echo "🗂️  Archiving remaining documentation..."
# But preserve CLAUDE.md!
find . -maxdepth 1 -name "*.md" ! -name "CLAUDE.md" -exec mv {} docs/archive/deployment-history/ \; 2>/dev/null

# Create README files
echo "📝 Creating README files..."

cat > docs/README.md << 'EOF'
# Documentation Directory

## Structure

- `current/` - Active, current documentation (most important!)
- `archive/` - Historical documentation organized by week
- `snapshots/` - State snapshots at critical points

## Current Documents

Essential reading:
1. WEEK_2_FINAL_SUMMARY.md - Week 2 comprehensive summary
2. FINAL_PRE_MAINNET_TESTING_STRATEGY.md - Week 3 deployment plan
3. SECURITY_AUDIT_REPORT_DAY_15.md - Professional security audit
4. COMPREHENSIVE_STATUS_AUDIT_DAY_16.md - Complete system audit
5. DAY_17_REVISED_COMPLETE.md - Latest status

## Archive

- `week-1/` - Days 1-10 documentation
- `week-2/` - Days 11-17 documentation
- `deployment-history/` - All deployment-related documents
- `planning/` - Planning and design documents
- `audit-results/` - Security audit results by day
EOF

cat > deployments/README.md << 'EOF'
# Deployments Directory

## Current Deployments

- `fork-deployment-split.json` - Fork (localhost) deployment
- `sepolia-deployment-split.json` - Sepolia testnet deployment
- `deployment-params.json` - Deployment configuration

## Networks

1. **Fork** (Chain ID: 31337 → simulates 32323)
   - Status: ✅ Deployed & Validated
   - Cost: FREE
   - Purpose: Mainnet simulation

2. **Sepolia** (Chain ID: 11155111)
   - Status: ✅ Deployed & Validated
   - Cost: ~$0.50
   - Purpose: Real network validation

3. **BasedAI Mainnet** (Chain ID: 32323)
   - Status: ⏸️ Pending Week 3
   - Target: Day 23
EOF

cat > test-results/README.md << 'EOF'
# Test Results Directory

## Week 2 Results (Days 11-14)

Cross-validated test results from Fork and Sepolia networks.

### Files

- `day11-*-results.json` - Cross-validation tests (100% success)
- `day12-*-results.json` - Market creation tests (99% success)
- `day13-*-results.json` - Edge case & security tests (100% security)
- `day14-*-results.json` - Load testing results (100% success, 10/10 markets)

### Results Summary

- Fork tests: 100% success rate
- Sepolia tests: Matches Fork within 0.35%
- All security tests: 100% passed (9/9)
- Load test: Perfect performance (10/10 markets, 0.00% gas variance)
EOF

echo ""
echo "✅ Directory reorganization complete!"
echo ""
echo "📊 Summary:"
echo "  - docs/current/          → 5 active documents"
echo "  - docs/archive/week-1/   → Week 1 documentation"
echo "  - docs/archive/week-2/   → Week 2 documentation"
echo "  - docs/archive/deployment-history/ → Old deployment docs"
echo "  - docs/archive/planning/ → Planning documents"
echo "  - docs/snapshots/        → State snapshots"
echo "  - deployments/           → Deployment files"
echo "  - test-results/week-2/   → Test results"
echo ""
echo "🎯 Root directory cleaned!"
echo "📁 All files organized!"
echo ""
echo "To verify:"
echo "  ls -la                    # Should be clean!"
echo "  ls docs/current/          # Should have 5 files"
echo "  ls docs/archive/          # Should have organized directories"
