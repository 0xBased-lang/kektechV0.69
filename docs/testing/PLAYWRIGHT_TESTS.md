# Playwright E2E Test Suite Documentation

## 🎯 Overview

Complete catalog of all Playwright end-to-end tests for KEKTECH prediction market platform.

**Current Status**: 50/52 tests passing (96%)
**Location**: `packages/frontend/tests/e2e/`
**Framework**: Playwright with TypeScript

---

## 📊 Test Suite Summary

| Suite | Tests | Passing | Duration | Critical |
|-------|-------|---------|----------|----------|
| Wallet Connection | 3 | 3 | ~1 min | ✅ |
| Market Browsing | 8 | 8 | ~2 min | ✅ |
| Betting Flow | 12 | 11 | ~5 min | ✅ |
| Admin Operations | 10 | 9 | ~4 min | ⚠️ |
| Position Management | 8 | 8 | ~3 min | ✅ |
| Mobile Responsive | 11 | 11 | ~4 min | ⚠️ |

**Total**: 52 tests | **Passing**: 50 (96%) | **Duration**: ~19 minutes

---

## 🔧 Running Tests

### All Tests
```bash
cd packages/frontend
npm run test:e2e
```

### Specific Suite
```bash
# Wallet tests only
npm run test:e2e -- tests/e2e/01-wallet-connection.spec.ts

# Market browsing only
npm run test:e2e -- tests/e2e/02-prediction-markets.spec.ts
```

### Specific Browser
```bash
# Chrome
npm run test:e2e -- --project chromium

# Firefox
npm run test:e2e -- --project firefox

# Mobile Safari
npm run test:e2e -- --project mobile-safari
```

### Debug Mode
```bash
# See browser actions
npm run test:e2e -- --headed

# Step through tests
npm run test:e2e -- --debug

# Specific test in debug mode
npm run test:e2e -- --grep "wallet connection" --headed --debug
```

---

## 📝 Test Catalog

### Suite 1: Wallet Connection (01-wallet-connection.spec.ts)

#### Test: wallet-001-connect-metamask
- **Purpose**: Verify MetaMask wallet connection works
- **Steps**:
  1. Navigate to homepage
  2. Click "Connect Wallet" button
  3. Approve MetaMask connection
  4. Verify connected state
- **Expected**: Wallet address displayed in header
- **Run**: `npm run test:e2e -- --grep "connect MetaMask"`
- **Duration**: ~30 seconds
- **Critical**: ✅ Yes
- **Status**: ✅ Passing

#### Test: wallet-002-disconnect
- **Purpose**: Verify wallet disconnection works
- **Steps**:
  1. Connect wallet
  2. Click disconnect button
  3. Verify disconnected state
- **Expected**: "Connect Wallet" button visible again
- **Status**: ✅ Passing

#### Test: wallet-003-wrong-network
- **Purpose**: Verify network mismatch detection
- **Steps**:
  1. Connect to wrong network (e.g., Ethereum mainnet)
  2. Verify warning displayed
  3. Switch to BasedAI network
  4. Verify warning disappears
- **Expected**: Network warning shown, then cleared
- **Status**: ✅ Passing

---

### Suite 2: Market Browsing (02-prediction-markets.spec.ts)

#### Test: market-001-homepage-loads
- **Purpose**: Verify homepage loads and displays markets
- **Steps**:
  1. Navigate to `/`
  2. Wait for markets to load
  3. Count market cards
- **Expected**: At least 1 market card displayed
- **Run**: `npm run test:e2e -- --grep "homepage loads"`
- **Critical**: ✅ Yes
- **Status**: ✅ Passing

#### Test: market-002-market-filtering
- **Purpose**: Verify market filtering works
- **Steps**:
  1. Navigate to `/markets`
  2. Click "Active" filter
  3. Verify only active markets shown
  4. Click "Resolved" filter
  5. Verify only resolved markets shown
- **Expected**: Filters correctly filter markets
- **Status**: ✅ Passing

#### Test: market-003-market-search
- **Purpose**: Verify search functionality
- **Steps**:
  1. Enter search term (e.g., "BTC")
  2. Verify only matching markets shown
  3. Clear search
  4. Verify all markets shown again
- **Expected**: Search filters markets correctly
- **Status**: ✅ Passing

#### Test: market-004-market-sorting
- **Purpose**: Verify sorting functionality
- **Steps**:
  1. Sort by "Newest"
  2. Verify correct order
  3. Sort by "Volume"
  4. Verify correct order
  5. Sort by "Closing Soon"
  6. Verify correct order
- **Expected**: Markets sorted correctly
- **Status**: ✅ Passing

#### Test: market-005-market-details
- **Purpose**: Verify market details page loads
- **Steps**:
  1. Click on market card
  2. Navigate to `/markets/[id]`
  3. Verify market details displayed
  4. Verify betting interface visible
- **Expected**: Full market details shown
- **Status**: ✅ Passing

#### Test: market-006-market-chart
- **Purpose**: Verify price chart displays
- **Steps**:
  1. Navigate to market details
  2. Verify chart visible
  3. Hover over chart
  4. Verify tooltip shows data
- **Expected**: Interactive chart displayed
- **Status**: ✅ Passing

#### Test: market-007-market-positions
- **Purpose**: Verify position list shows on market page
- **Steps**:
  1. Navigate to market with bets
  2. Scroll to positions section
  3. Verify positions listed
- **Expected**: User positions visible
- **Status**: ✅ Passing

#### Test: market-008-market-pagination
- **Purpose**: Verify pagination works (if >10 markets)
- **Steps**:
  1. Navigate to markets page
  2. If >10 markets, verify pagination visible
  3. Click "Next page"
  4. Verify new markets loaded
- **Expected**: Pagination functions correctly
- **Status**: ✅ Passing

---

### Suite 3: Betting Flow (03-betting.spec.ts)

#### Test: bet-001-bet-interface-loads
- **Purpose**: Verify betting interface displays
- **Steps**:
  1. Navigate to active market
  2. Verify bet input visible
  3. Verify outcome buttons (YES/NO)
  4. Verify price calculation shown
- **Expected**: Complete betting interface
- **Critical**: ✅ Yes
- **Status**: ✅ Passing

#### Test: bet-002-calculate-price
- **Purpose**: Verify price calculation updates
- **Steps**:
  1. Enter bet amount (e.g., 1 BASED)
  2. Select YES outcome
  3. Verify price calculated
  4. Verify shares estimated
  5. Change to NO outcome
  6. Verify price recalculated
- **Expected**: Real-time price updates
- **Status**: ✅ Passing

#### Test: bet-003-minimum-bet-validation
- **Purpose**: Verify minimum bet enforced
- **Steps**:
  1. Enter amount below minimum (e.g., 0.01 BASED)
  2. Attempt to place bet
  3. Verify error shown
  4. Increase to valid amount
  5. Verify error cleared
- **Expected**: Minimum bet validation works
- **Status**: ✅ Passing

#### Test: bet-004-place-bet-yes
- **Purpose**: Verify betting on YES outcome works
- **Steps**:
  1. Connect wallet
  2. Enter bet amount
  3. Select YES
  4. Click "Place Bet"
  5. Approve MetaMask transaction
  6. Wait for confirmation
  7. Verify success message
- **Expected**: Bet placed successfully
- **Critical**: ✅ Yes
- **Status**: ✅ Passing

#### Test: bet-005-place-bet-no
- **Purpose**: Verify betting on NO outcome works
- **Expected**: Bet placed successfully
- **Status**: ✅ Passing

#### Test: bet-006-insufficient-balance
- **Purpose**: Verify insufficient balance detection
- **Steps**:
  1. Enter amount > wallet balance
  2. Attempt to place bet
  3. Verify error shown
- **Expected**: Insufficient balance error
- **Status**: ✅ Passing

#### Test: bet-007-transaction-rejected
- **Purpose**: Verify handling of rejected transaction
- **Steps**:
  1. Place bet
  2. Reject MetaMask transaction
  3. Verify error handling
  4. Verify can retry
- **Expected**: Graceful error handling
- **Status**: ✅ Passing

#### Test: bet-008-bet-confirmation
- **Purpose**: Verify bet confirmation modal
- **Steps**:
  1. Place bet
  2. Verify confirmation modal shows:
     - Bet amount
     - Outcome
     - Expected shares
     - Price
     - Fee
  3. Confirm bet
- **Expected**: Clear bet confirmation
- **Status**: ✅ Passing

#### Test: bet-009-bet-appears-in-positions
- **Purpose**: Verify bet updates position list
- **Steps**:
  1. Place bet
  2. Navigate to "My Positions"
  3. Verify bet listed
  4. Verify correct amount
- **Expected**: Position updated
- **Status**: ✅ Passing

#### Test: bet-010-multiple-bets
- **Purpose**: Verify can place multiple bets
- **Steps**:
  1. Place first bet
  2. Place second bet (same outcome)
  3. Verify both bets counted
  4. Place bet on opposite outcome
  5. Verify hedged position shown
- **Expected**: Multiple bets work
- **Status**: ✅ Passing

#### Test: bet-011-bet-on-closed-market
- **Purpose**: Verify cannot bet on closed market
- **Steps**:
  1. Navigate to resolved market
  2. Verify betting disabled
  3. Verify message shown
- **Expected**: Betting disabled for closed markets
- **Status**: ❌ Failing (Known issue - needs fix)

#### Test: bet-012-gas-estimation
- **Purpose**: Verify gas cost displayed
- **Steps**:
  1. Enter bet amount
  2. Verify estimated gas shown
  3. Verify gas cost <100k gas
- **Expected**: Gas estimation accurate
- **Status**: ✅ Passing

---

### Suite 4: Admin Operations (04-admin.spec.ts)

#### Test: admin-001-access-control
- **Purpose**: Verify only admin can access admin panel
- **Steps**:
  1. Connect non-admin wallet
  2. Navigate to `/admin`
  3. Verify access denied
  4. Connect admin wallet
  5. Verify access granted
- **Expected**: Proper access control
- **Critical**: ⚠️ Medium
- **Status**: ✅ Passing

#### Test: admin-002-approve-market
- **Purpose**: Verify admin can approve markets
- **Steps**:
  1. Connect admin wallet
  2. Navigate to `/admin`
  3. Find PROPOSED market
  4. Click "Approve"
  5. Confirm transaction
  6. Verify market status = APPROVED
- **Expected**: Market approved
- **Status**: ✅ Passing

#### Test: admin-003-activate-market
- **Purpose**: Verify admin can activate markets
- **Expected**: Market activated and betting enabled
- **Status**: ✅ Passing

#### Test: admin-004-resolve-market
- **Purpose**: Verify admin can resolve markets
- **Steps**:
  1. Find expired market
  2. Select outcome (YES or NO)
  3. Submit resolution
  4. Confirm transaction
  5. Verify market status = RESOLVING
  6. Wait for dispute period
  7. Verify status = FINALIZED
- **Expected**: Market resolved correctly
- **Status**: ❌ Failing (Resolution form validation issue)

#### Test: admin-005-dispute-market
- **Purpose**: Verify dispute handling
- **Expected**: Dispute recorded
- **Status**: ✅ Passing

#### Test: admin-006-reject-market
- **Purpose**: Verify admin can reject markets
- **Expected**: Market rejected
- **Status**: ✅ Passing

#### Test: admin-007-update-parameters
- **Purpose**: Verify parameter updates
- **Expected**: Parameters updated
- **Status**: ✅ Passing

#### Test: admin-008-grant-role
- **Purpose**: Verify role management
- **Expected**: Role granted
- **Status**: ✅ Passing

#### Test: admin-009-revoke-role
- **Purpose**: Verify role revocation
- **Expected**: Role revoked
- **Status**: ✅ Passing

#### Test: admin-010-emergency-pause
- **Purpose**: Verify emergency pause
- **Expected**: System paused
- **Status**: ✅ Passing

---

### Suite 5: Position Management (05-positions.spec.ts)

#### Test: position-001-my-positions-page
- **Purpose**: Verify "My Positions" page loads
- **Steps**:
  1. Connect wallet with positions
  2. Navigate to `/positions`
  3. Verify positions listed
- **Expected**: All positions displayed
- **Status**: ✅ Passing

#### Test: position-002-position-details
- **Purpose**: Verify position details shown
- **Expected**: Full position info visible
- **Status**: ✅ Passing

#### Test: position-003-claim-winnings
- **Purpose**: Verify claiming winnings works
- **Steps**:
  1. Find resolved market with winning position
  2. Click "Claim Winnings"
  3. Confirm transaction
  4. Verify claim successful
  5. Verify balance updated
- **Expected**: Winnings claimed
- **Status**: ✅ Passing

#### Test: position-004-portfolio-summary
- **Purpose**: Verify portfolio stats
- **Expected**: Correct total value, P&L
- **Status**: ✅ Passing

#### Test: position-005-filter-positions
- **Purpose**: Verify position filtering
- **Expected**: Filters work correctly
- **Status**: ✅ Passing

#### Test: position-006-position-history
- **Purpose**: Verify transaction history
- **Expected**: All transactions listed
- **Status**: ✅ Passing

#### Test: position-007-position-chart
- **Purpose**: Verify position value chart
- **Expected**: Chart displays correctly
- **Status**: ✅ Passing

#### Test: position-008-export-positions
- **Purpose**: Verify position export
- **Expected**: CSV export works
- **Status**: ✅ Passing

---

### Suite 6: Mobile Responsive (06-mobile.spec.ts)

All tests run on:
- iPhone 12
- Pixel 5
- iPad

#### Test: mobile-001-homepage-responsive
- **Purpose**: Verify homepage responsive on mobile
- **Expected**: Proper mobile layout
- **Status**: ✅ Passing (all devices)

#### Test: mobile-002-navigation-menu
- **Purpose**: Verify mobile nav menu
- **Expected**: Hamburger menu works
- **Status**: ✅ Passing

#### Test: mobile-003-market-cards-responsive
- **Purpose**: Verify market cards stack properly
- **Expected**: Single column layout
- **Status**: ✅ Passing

#### Test: mobile-004-betting-interface-mobile
- **Purpose**: Verify betting works on mobile
- **Expected**: Touch-friendly interface
- **Status**: ✅ Passing

#### Test: mobile-005-touch-targets
- **Purpose**: Verify buttons are touch-friendly (≥44px)
- **Expected**: All buttons tappable
- **Status**: ✅ Passing

#### Test: mobile-006-wallet-connection-mobile
- **Purpose**: Verify mobile wallet apps work
- **Expected**: WalletConnect/mobile wallets work
- **Status**: ✅ Passing

#### Test: mobile-007-swipe-gestures
- **Purpose**: Verify swipe navigation
- **Expected**: Swipe works on carousels
- **Status**: ✅ Passing

#### Test: mobile-008-portrait-landscape
- **Purpose**: Verify both orientations work
- **Expected**: Layout adapts to orientation
- **Status**: ✅ Passing

#### Test: mobile-009-mobile-performance
- **Purpose**: Verify performance on mobile
- **Expected**: Load <3s on 3G
- **Status**: ✅ Passing

#### Test: mobile-010-mobile-forms
- **Purpose**: Verify form inputs on mobile
- **Expected**: Keyboard doesn't break layout
- **Status**: ✅ Passing

#### Test: mobile-011-mobile-modals
- **Purpose**: Verify modals work on mobile
- **Expected**: Modals don't overflow screen
- **Status**: ✅ Passing

---

## 🐛 Known Failures (2 tests)

### 1. bet-011-bet-on-closed-market
**Status**: ❌ Failing
**Issue**: Betting interface not properly disabled for closed markets
**Priority**: High
**Action**: Add state check to betting component

### 2. admin-004-resolve-market
**Status**: ❌ Failing
**Issue**: Resolution form validation prevents submission
**Priority**: High
**Action**: Fix form validation logic

---

## 📊 Test Execution Matrix

| Device/Browser | Tests | Passing | Failures |
|----------------|-------|---------|----------|
| Chrome Desktop | 52 | 50 | 2 |
| Firefox Desktop | 52 | 50 | 2 |
| Safari Desktop | 52 | 50 | 2 |
| Chrome Mobile | 11 | 11 | 0 |
| Safari Mobile | 11 | 11 | 0 |

---

## 🔄 Adding New Tests

### Test Template
```typescript
test('test-description', async ({ page }) => {
  // 1. Setup
  await page.goto('/');

  // 2. Action
  await page.click('[data-testid="button"]');

  // 3. Assertion
  await expect(page.locator('.result')).toBeVisible();
});
```

### Naming Convention
- Suite: `XX-feature-name.spec.ts`
- Test: `feature-XXX-specific-action`
- Data attributes: `data-testid="descriptive-name"`

### Documentation
When adding tests, update:
1. This file (PLAYWRIGHT_TESTS.md)
2. Test count in README.md
3. Test matrix in TESTING_MASTER_GUIDE.md

---

**Last Updated**: November 8, 2025
**Maintained By**: KEKTECH QA Team
