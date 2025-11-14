# Phase 5 Mainnet Testing Guide

**Purpose**: Step-by-step guide to execute Tests 001-007 on BasedAI Mainnet

**Budget**: 10 BASED total | **Duration**: 4 days (Days 1-4)

---

## 🚨 BEFORE YOU START

**CRITICAL CHECKS**:
- [ ] Wallet has ≥10 BASED (for all tests + gas)
- [ ] `.env` file configured with `PRIVATE_KEY`
- [ ] You understand these are REAL mainnet transactions
- [ ] You're ready to spend BASED tokens for testing
- [ ] Documentation system is set up (`docs/phase-5/`)

---

## ⚙️ SETUP (5 minutes)

### 1. Configure Environment

Create `.env` file in project root (if not exists):
```bash
# BasedAI Mainnet Configuration
NEXT_PUBLIC_CHAIN_ID=32323
NEXT_PUBLIC_RPC_URL=https://mainnet.basedaibridge.com/rpc/
NEXT_PUBLIC_GAS_PRICE=9000000000

# Your wallet private key (KEEP SECRET!)
PRIVATE_KEY=your_private_key_here

# Contract addresses (already configured in lib/contracts/addresses.ts)
# No need to add here unless overriding
```

**⚠️ SECURITY WARNING**:
- NEVER commit `.env` to Git
- NEVER share your PRIVATE_KEY
- Use a test wallet, not your main holdings
- Only fund with ~10-15 BASED for testing

### 2. Install Dependencies

```bash
npm install ethers dotenv
```

### 3. Verify Setup

```bash
# Check wallet balance
node -e "
const { ethers } = require('ethers');
require('dotenv').config();
const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
provider.getBalance(wallet.address).then(b => {
  console.log('Wallet:', wallet.address);
  console.log('Balance:', ethers.formatEther(b), 'BASED');
});
"
```

**Expected Output**:
```
Wallet: 0x1234...5678
Balance: 10.5 BASED
```

If balance < 10 BASED, fund your wallet first.

---

## 📝 TESTING WORKFLOW (Per Test)

**For EACH test (001-007), follow this workflow:**

### BEFORE Test
1. Open test template: `docs/phase-5/mainnet-testing/test-00X-*.md`
2. Read objectives and prerequisites
3. Prepare wallet and environment
4. Open `MASTER_LOG.md` for logging

### DURING Test
1. Run test script: `node scripts/test-00X-*.js`
2. Monitor console output in real-time
3. Record observations manually if needed
4. Take screenshots of important moments
5. Save transaction links from BasedAI explorer

### AFTER Test
1. Script auto-updates `MASTER_LOG.md` and `TESTING_LOG.md`
2. Review evidence in `docs/phase-5/evidence/transaction-logs/`
3. If issues found:
   - Create Issue Report in `ISSUE_TRACKER.md`
   - Investigate root cause
   - Document fix in `FIX_LOG.md`
   - Extract lesson in `LESSONS_LEARNED.md`
4. Mark test template as complete
5. Commit documentation: `git commit -m "test: Test 00X complete"`

---

## 🧪 TEST EXECUTION (Days 1-4)

### Day 1: Tests 001-003 (Market Creation & Betting)

#### Test 001: Market Creation (30 min)
**Budget**: 0.15 BASED

```bash
node scripts/test-001-market-creation.js
```

**What It Does**:
- Creates market with 0.1 BASED bond
- Verifies factory contract works
- Checks event emission
- Validates market registration

**Expected Results**:
- ✅ Transaction succeeds
- ✅ Market ID and address returned
- ✅ Gas used ~700k
- ✅ Total cost ~0.1007 BASED

**If It Fails**:
- Check wallet balance
- Verify RPC connection
- Check contract addresses
- See troubleshooting section below

---

#### Test 002: Small Bet (20 min)
**Budget**: 0.15 BASED
**Prerequisites**: Test 001 completed

```bash
# Edit script with marketId from Test 001
node scripts/test-002-betting-small.js
```

**What It Does**:
- Places 0.1 BASED bet on YES
- Verifies LMSR pricing
- Checks share issuance
- Validates position tracking

**Expected Results**:
- ✅ Bet succeeds
- ✅ Shares received ~5-10
- ✅ Price impact <1%
- ✅ Gas used ~100k

---

#### Test 003: Varied Bets (2 hours)
**Budget**: 4.5 BASED
**Prerequisites**: Tests 001-002 completed

```bash
node scripts/test-003-betting-varied.js
```

**What It Does**:
- Places 5 bets of different sizes
- Tests LMSR price discovery
- Validates curve stability
- Checks diminishing returns

**Expected Results**:
- ✅ All 5 bets succeed
- ✅ Prices move correctly
- ✅ Larger bets → larger impact
- ✅ Curve remains stable

---

### Day 2: Tests 004-005 (State Transitions & Disputes)

#### Test 004: State Transitions (3 hours)
**Budget**: 1.0 BASED (gas)
**Prerequisites**: Previous tests completed

```bash
node scripts/test-004-state-transitions.js
```

**What It Does**:
- Tests full market lifecycle
- PROPOSED → ACTIVE → RESOLVING → FINALIZED
- Validates state guards
- Checks auto-approval (if implemented)

**Expected Results**:
- ✅ All state transitions work
- ✅ Betting disabled at appropriate states
- ✅ Events emitted correctly

---

#### Test 005: Dispute Flow (2 hours)
**Budget**: 0.6 BASED
**Prerequisites**: Market in RESOLVING state

```bash
node scripts/test-005-dispute-flow.js
```

**What It Does**:
- Raises dispute on market outcome
- Tests community signaling
- Validates dispute stake lock
- Checks admin resolution

**Expected Results**:
- ✅ Dispute raises successfully
- ✅ Stake locked correctly
- ✅ Market enters DISPUTED state
- ✅ Admin can resolve

---

### Day 3: Tests 006-007 (Claims & Edge Cases)

#### Test 006: Claiming Winnings (2 hours)
**Budget**: 0.1 BASED (gas)
**Prerequisites**: Market finalized with outcome

```bash
node scripts/test-006-claiming-winnings.js
```

**What It Does**:
- Claims winnings from finalized market
- Validates payout calculations
- Tests double-claim prevention
- Checks loser blocking

**Expected Results**:
- ✅ Claim succeeds
- ✅ Correct amount received
- ✅ Cannot claim twice
- ✅ Losers blocked

---

#### Test 007: Edge Cases (4 hours)
**Budget**: 1.5 BASED
**Prerequisites**: All previous tests completed

```bash
node scripts/test-007-edge-cases.js
```

**What It Does**:
- Tests 15+ edge case scenarios
- Zero liquidity markets
- Single-sided betting
- Rapid consecutive bets
- Boundary conditions
- Invalid operations

**Expected Results**:
- ✅ All edge cases handled correctly
- ✅ Invalid operations rejected
- ✅ No unexpected errors

---

### Day 4: Documentation & Review

**Tasks**:
1. Review all evidence collected
2. Complete any incomplete documentation
3. Update MASTER_LOG.md final summary
4. Calculate total BASED spent
5. Generate statistics
6. Extract key lessons
7. Update QUICK_REFERENCE.md with common issues found
8. Commit all documentation

**Deliverables**:
- ✅ All 7 tests completed and documented
- ✅ Evidence saved (transaction logs, screenshots)
- ✅ All issues found + fixed + documented
- ✅ Lessons learned extracted
- ✅ Ready for Phase 5 Part 2 (Page Building)

---

## 📊 TRACKING PROGRESS

### Real-Time Updates

**MASTER_LOG.md**: Update after EVERY significant action
```markdown
**HH:MM** - Started Test 001
  - Result: ✅ Success
  - Market ID: 0x123...
  - Transaction: 0xabc...
  - Cost: 0.1007 BASED
```

**TESTING_LOG.md**: Updated automatically by scripts
- Test status changes
- Results and metrics
- Gas usage tracking

**Budget Tracking**:
```
Test 001: 0.1007 BASED ✅
Test 002: 0.1001 BASED ✅
Test 003: 4.0523 BASED ✅
...
Total: X.XX / 10 BASED
Remaining: X.XX BASED
```

---

## 🔧 TROUBLESHOOTING

### Problem: "Insufficient balance"
**Cause**: Wallet has less BASED than needed
**Fix**: Fund wallet with more BASED from exchange

### Problem: "Transaction reverted"
**Possible Causes**:
1. Market already exists with same question
2. Resolution date in past
3. Insufficient bond
4. Contract paused

**Fix**:
1. Check contract state
2. Verify parameters
3. Check event logs for revert reason
4. Create Issue Report if bug found

### Problem: "RPC connection failed"
**Cause**: BasedAI RPC down or slow
**Fix**:
1. Check RPC URL in `.env`
2. Try alternative RPC if available
3. Wait and retry

### Problem: "Gas estimation failed"
**Cause**: Transaction would revert
**Fix**:
1. Check why it would revert
2. Fix parameters
3. Script proceeds with default gas anyway

### Problem: "Private key invalid"
**Cause**: Wrong format or missing
**Fix**:
1. Check `.env` has `PRIVATE_KEY=0x...`
2. Ensure no spaces or quotes
3. Verify key is valid (64 hex characters)

---

## 📋 CHECKLIST (Copy for Each Test)

```
TEST 00X: [Name]
Date: YYYY-MM-DD
Tester: [Your Name]

Pre-Test:
[ ] Read test template
[ ] Wallet has sufficient BASED
[ ] Environment configured
[ ] Ready to proceed

Execution:
[ ] Script ran successfully
[ ] Transaction confirmed
[ ] Gas usage acceptable
[ ] Results as expected

Post-Test:
[ ] MASTER_LOG.md updated
[ ] TESTING_LOG.md updated (auto)
[ ] Evidence saved
[ ] Issues documented (if any)
[ ] Test template marked complete
[ ] Committed to Git

Next Steps:
[ ] Proceed to Test 00[X+1]
OR
[ ] Fix issues first
```

---

## 🎯 SUCCESS CRITERIA

**Overall Phase 5 Mainnet Testing is COMPLETE when**:

- ✅ All 7 tests executed and documented
- ✅ Total BASED spent: ≤10 BASED
- ✅ All transactions successful (or failures documented)
- ✅ Evidence collected for every test
- ✅ All issues found + fixed OR documented as known issues
- ✅ Lessons learned extracted
- ✅ MASTER_LOG.md has complete timeline
- ✅ TESTING_LOG.md shows all results
- ✅ Ready to build UI with confidence contracts work

---

## 🚀 AFTER MAINNET TESTING

**Next Phase**: Days 5-11 - Build Pages

With contracts validated on mainnet, you can now build the UI with confidence:
1. `/markets` page - List markets (already know they exist!)
2. `/markets/[id]` - Details + betting (already validated!)
3. `/create` page - Create markets (already tested!)
4. `/portfolio` - Positions + claims (already confirmed working!)

Every component will integrate with TESTED, WORKING mainnet contracts.

---

## 📞 SUPPORT

**If you encounter issues**:
1. Check troubleshooting section above
2. Review ISSUE_TRACKER.md for similar issues
3. Create Issue Report with full details
4. Document investigation in FIX_LOG.md
5. Extract lesson in LESSONS_LEARNED.md

**Remember**: Every issue is a learning opportunity. Document it well!

---

**Last Updated**: 2025-11-07 23:30 PST
**Status**: Ready to execute
**First Test**: Run `node scripts/test-001-market-creation.js` when ready
