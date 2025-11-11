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

### ✅ Implemented Tests

1. **01-wallet-connection.spec.ts** - Wallet connection flow
   - Connect wallet
   - Disconnect wallet
   - Network switching
   - Address display

2. **02-proposal-voting.spec.ts** - Proposal voting system
   - Like/dislike votes
   - Vote persistence
   - Vote count updates
   - Authentication flow

### 🚧 TODO: Remaining Tests

3. **03-admin-approval.spec.ts** - Admin market approval (to be implemented)
4. **04-market-trading.spec.ts** - Market betting flow (to be implemented)
5. **05-error-handling.spec.ts** - Edge cases and errors (to be implemented)
6. **06-complete-journey.spec.ts** - Full user journey (to be implemented)

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
│   ├── wallet.ts      # Wallet interaction utilities
│   └── api.ts         # API helper functions
├── 01-wallet-connection.spec.ts
├── 02-proposal-voting.spec.ts
└── README.md          # This file
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
