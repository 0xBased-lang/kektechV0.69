# KEKTECH 3.0 - E2E Test Suite

Comprehensive end-to-end tests for KEKTECH prediction markets platform.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Install Playwright Browsers

```bash
npx playwright install chromium
```

### 3. Configure Test Environment

Copy the example environment file:

```bash
cp .env.test.example .env.test
```

Edit `.env.test` with your test wallet details.

**⚠️ WARNING**: Never use a wallet with real funds! Create a dedicated test wallet.

## Running Tests

### Quick Start (Smoke Tests)

```bash
npm run test:e2e
```

### Run with UI (Interactive Mode)

```bash
npm run test:e2e:ui
```

### Debug Mode

```bash
npm run test:e2e:debug
```

### Run Specific Test File

```bash
npx playwright test tests/e2e/01-wallet-connection.spec.ts
```

### Run with Headed Browser (see what's happening)

```bash
npx playwright test --headed
```

## Test Coverage

### ✅ Completed Test Suites (52 tests total)

1. **01-wallet-connection.spec.ts** - Wallet Connection Flow (5 tests)
   - Display connect wallet button
   - Open wallet modal on click
   - Show wallet address after connection
   - Disconnect wallet successfully
   - Navigate with wallet connected

2. **02-proposal-voting.spec.ts** - Proposal Voting (6 tests)
   - Display proposal cards with vote buttons
   - Show login prompt when voting without wallet
   - Submit like vote successfully
   - Change vote from like to dislike
   - Persist vote after page refresh
   - Display vote counts correctly

3. **03-admin-approval.spec.ts** - Admin Market Approval (8 tests)
   - Display admin panel to admin users
   - Filter markets by status (Proposed/Approved/Rejected)
   - Display market details correctly
   - Show approve button for PROPOSED markets
   - Handle approve button click
   - Display market statistics
   - Allow searching markets
   - Handle reject action for PROPOSED markets

4. **04-market-trading.spec.ts** - Market Trading (11 tests)
   - Display active markets on homepage
   - Navigate to market detail page
   - Display market information correctly
   - Show betting interface with amount input
   - Validate bet amount input
   - Require wallet connection for betting
   - Handle place bet flow (requires wallet)
   - Display user position after betting
   - Show transaction history
   - Calculate estimated returns correctly
   - Handle market resolution state

5. **05-error-handling.spec.ts** - Error Handling (18 tests)
   - Network Errors (3 tests): Invalid addresses, malformed data, timeouts
   - Authentication Errors (2 tests): Unauthenticated access, admin rights
   - Validation Errors (2 tests): Bet amounts, comment length
   - Transaction Errors (2 tests): Rejected transactions, insufficient balance
   - Network State Errors (2 tests): Wrong network, connection loss
   - UI Error States (3 tests): Error boundaries, empty states, loading states
   - Recovery Mechanisms (2 tests): Retry flows, form state preservation

6. **06-complete-journey.spec.ts** - End-to-End Journey (4 tests)
   - Complete full user journey (10 phases):
     1. Landing & Navigation
     2. Browsing Proposals
     3. Wallet Connection
     4. Community Voting
     5. View Market Details
     6. Trading
     7. Community Engagement
     8. Admin Controls
     9. Navigation Validation
     10. Final Validation
   - Complete trading cycle (manual wallet required)
   - Validate platform performance
   - Validate responsive design

**🎉 Total: 52 comprehensive E2E tests covering all critical user flows!**

## Current Limitations

### MetaMask Automation

The current tests use **UI-only testing** without actual MetaMask automation. This means:

- ✅ Tests verify UI interactions (buttons, forms, navigation)
- ✅ Tests check API responses and vote counts
- ⏭️ Tests skip actual wallet signing (requires manual intervention)

### Full MetaMask Automation (Future Enhancement)

To test with real MetaMask transactions, you'll need:

1. **Synpress** (when compatible with Playwright 1.56+)
2. **dAppeteer** (Puppeteer-based MetaMask automation)
3. **Manual testing** with `--headed` mode

## Test Architecture

```
tests/e2e/
├── helpers/
│   ├── wallet.ts      # Wallet interaction utilities (WalletHelper class)
│   └── api.ts         # API helper functions (APIHelper class)
├── 01-wallet-connection.spec.ts    # ✅ Wallet connection flow (5 tests)
├── 02-proposal-voting.spec.ts      # ✅ Proposal voting system (6 tests)
├── 03-admin-approval.spec.ts       # ✅ Admin market approval (8 tests)
├── 04-market-trading.spec.ts       # ✅ Market trading & betting (11 tests)
├── 05-error-handling.spec.ts       # ✅ Error states & recovery (18 tests)
├── 06-complete-journey.spec.ts     # ✅ End-to-end journey (4 tests)
├── .env.test.example               # Test environment template
└── README.md                       # This file
```

## Debugging Failed Tests

### View Test Report

```bash
npx playwright show-report
```

### Screenshots & Videos

Failed tests automatically generate:
- Screenshots: `test-results/*/test-failed-1.png`
- Videos: `test-results/*/video.webm`

### Check Logs

Playwright logs are in `test-results/` directory.

## CI/CD Integration

Tests are configured to run on:
- Pull requests
- Main branch pushes
- Manual workflow dispatch

See `.github/workflows/e2e-tests.yml` (to be created).

## Contributing

When adding new tests:

1. Follow naming convention: `XX-feature-name.spec.ts`
2. Use helper utilities in `helpers/` directory
3. Add test documentation to this README
4. Ensure tests are idempotent (can run multiple times)

## Troubleshooting

### Dev Server Not Starting

Make sure port 3006 is free:

```bash
lsof -ti:3006 | xargs kill -9
```

### Tests Timeout

Increase timeout in `playwright.config.ts`:

```typescript
timeout: 120000, // 2 minutes
```

### Wallet Not Connecting

For actual MetaMask testing, you need to:
1. Use persistent browser context
2. Pre-configure MetaMask extension
3. Import test wallet with private key

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [MetaMask Testing Guide](https://docs.metamask.io/guide/testing.html)
- [KEKTECH Contracts](../../packages/blockchain/)
