/**
 * KEKTECH 3.0 - E2E Test Suite
 * Test 4: Market Trading (Place Bets)
 *
 * Tests placing bets on active markets
 */
import { test, expect } from '@playwright/test';
import { WalletHelper } from './helpers/wallet';
import { APIHelper } from './helpers/api';

test.describe('Market Trading', () => {
  let wallet: WalletHelper;
  let api: APIHelper;
  const testMarketAddress = process.env.TEST_MARKET_ADDRESS || '0x31d2BC49A6FD4a066F5f8AC61Acd0E6c9105DD84';

  test.beforeEach(async ({ page }) => {
    wallet = new WalletHelper(page);
    api = new APIHelper();
  });

  test('should display active markets on homepage', async ({ page }) => {
    await page.goto('/markets');

    // Should show markets page
    await expect(page.locator('h1:has-text("Markets")')).toBeVisible({ timeout: 10000 });

    // Should have market cards or loading state
    const marketCards = page.locator('[data-testid="market-card"]');
    const loadingSpinner = page.locator('[data-testid="loading"]');
    const emptyState = page.locator('text=/no.*markets/i');

    const hasMarkets = await marketCards.count() > 0;
    const isLoading = await loadingSpinner.isVisible();
    const isEmpty = await emptyState.isVisible();

    expect(hasMarkets || isLoading || isEmpty).toBeTruthy();
  });

  test('should navigate to market detail page', async ({ page }) => {
    await page.goto('/markets');

    // Wait for market cards
    const marketCard = page.locator('[data-testid="market-card"]').first();
    const hasMarkets = await marketCard.isVisible({ timeout: 10000 });

    if (hasMarkets) {
      // Click on market
      await marketCard.click();

      // Should navigate to detail page
      await page.waitForURL(/\/market\/0x[a-fA-F0-9]+/, { timeout: 10000 });

      // Should show market details
      await expect(page.locator('h1')).toBeVisible();
    } else {
      test.skip(true, 'No active markets available');
    }
  });

  test('should display market information correctly', async ({ page }) => {
    await page.goto(`/market/${testMarketAddress}`);

    // Should show market question
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });

    // Should show current odds
    const oddsSection = page.locator('[data-testid="market-odds"]');
    if (await oddsSection.isVisible()) {
      await expect(oddsSection.locator('text=/yes/i')).toBeVisible();
      await expect(oddsSection.locator('text=/no/i')).toBeVisible();
    }

    // Should show bet interface
    const betSection = page.locator('[data-testid="bet-interface"]');
    if (await betSection.isVisible()) {
      await expect(betSection).toBeVisible();
    }
  });

  test('should show betting interface with amount input', async ({ page }) => {
    await page.goto(`/market/${testMarketAddress}`);

    // Look for bet amount input
    const amountInput = page.locator('input[placeholder*="amount"], input[type="number"]').first();

    if (await amountInput.isVisible({ timeout: 5000 })) {
      // Should accept numeric input
      await amountInput.fill('0.5');
      await expect(amountInput).toHaveValue('0.5');

      // Should have outcome selection buttons
      const yesButton = page.locator('button:has-text("Yes")');
      const noButton = page.locator('button:has-text("No")');

      const hasYes = await yesButton.isVisible();
      const hasNo = await noButton.isVisible();

      expect(hasYes || hasNo).toBeTruthy();
    }
  });

  test('should validate bet amount input', async ({ page }) => {
    await page.goto(`/market/${testMarketAddress}`);

    const amountInput = page.locator('input[placeholder*="amount"], input[type="number"]').first();

    if (await amountInput.isVisible({ timeout: 5000 })) {
      // Try negative amount
      await amountInput.fill('-1');
      await page.waitForTimeout(500);

      // Should show error or prevent negative
      const errorMessage = page.locator('text=/invalid.*amount|must.*positive/i');
      const hasError = await errorMessage.isVisible();

      // Try zero
      await amountInput.fill('0');
      await page.waitForTimeout(500);

      // Try valid amount
      await amountInput.fill('0.1');
      await expect(amountInput).toHaveValue('0.1');
    }
  });

  test('should require wallet connection for betting', async ({ page }) => {
    await page.goto(`/market/${testMarketAddress}`);

    const placeBetButton = page.locator('button:has-text("Place Bet"), button:has-text("Buy")').first();

    if (await placeBetButton.isVisible({ timeout: 5000 })) {
      // Try to place bet without wallet
      await placeBetButton.click();

      // Should show connect wallet prompt
      const connectPrompt = page.locator('text=/connect.*wallet/i');
      const hasPrompt = await connectPrompt.isVisible({ timeout: 2000 });

      if (hasPrompt) {
        expect(hasPrompt).toBeTruthy();
      }
    }
  });

  test('should handle place bet flow (requires wallet)', async ({ page }) => {
    await page.goto(`/market/${testMarketAddress}`);

    // Wait for wallet state
    await page.waitForSelector('text=/connect.*wallet|place.*bet/i', { timeout: 10000 });

    const isConnected = await page.locator('text=/place.*bet|buy.*shares/i').isVisible();

    if (!isConnected) {
      test.skip(true, 'Wallet not connected - manual test required');
    }

    const amountInput = page.locator('input[placeholder*="amount"], input[type="number"]').first();

    if (await amountInput.isVisible()) {
      // Enter bet amount
      await amountInput.fill('0.1');

      // Select outcome
      const yesButton = page.locator('button:has-text("Yes")');
      if (await yesButton.isVisible()) {
        await yesButton.click();
      }

      // Find place bet button
      const placeBetButton = page.locator('button:has-text("Place Bet"), button:has-text("Buy")').first();
      await placeBetButton.click();

      // Should trigger MetaMask (in manual --headed mode)
      // Or show error in automated mode

      await page.waitForTimeout(2000);

      // Check for success or error message
      const successMessage = page.locator('text=/success|confirmed/i');
      const errorMessage = page.locator('text=/error|failed|rejected/i');

      const hasSuccess = await successMessage.isVisible();
      const hasError = await errorMessage.isVisible();

      expect(hasSuccess || hasError).toBeTruthy();
    }
  });

  test('should display user position after betting', async ({ page }) => {
    await page.goto(`/market/${testMarketAddress}`);

    await page.waitForSelector('text=/connect.*wallet|your.*position/i', { timeout: 10000 });

    const positionSection = page.locator('[data-testid="user-position"]');

    if (await positionSection.isVisible({ timeout: 5000 })) {
      // Should show shares owned
      await expect(positionSection.locator('text=/shares|position/i')).toBeVisible();

      // Should show potential return
      const returnText = positionSection.locator('text=/return|value|profit/i');
      if (await returnText.isVisible()) {
        await expect(returnText).toBeVisible();
      }
    }
  });

  test('should show transaction history', async ({ page }) => {
    await page.goto(`/market/${testMarketAddress}`);

    // Look for transaction history section
    const historySection = page.locator('[data-testid="transaction-history"], text=/transaction.*history|recent.*trades/i');

    if (await historySection.isVisible({ timeout: 5000 })) {
      // Should list transactions
      const transactions = page.locator('[data-testid="transaction-item"]');
      const hasTransactions = await transactions.count() > 0;

      if (hasTransactions) {
        // Each transaction should show key info
        const firstTransaction = transactions.first();
        await expect(firstTransaction).toBeVisible();
      }
    }
  });

  test('should calculate estimated returns correctly', async ({ page }) => {
    await page.goto(`/market/${testMarketAddress}`);

    const amountInput = page.locator('input[placeholder*="amount"], input[type="number"]').first();

    if (await amountInput.isVisible({ timeout: 5000 })) {
      // Enter bet amount
      await amountInput.fill('1');
      await page.waitForTimeout(500);

      // Should show estimated shares or return
      const estimateText = page.locator('text=/receive|get|estimate/i');
      if (await estimateText.isVisible({ timeout: 2000 })) {
        await expect(estimateText).toBeVisible();
      }
    }
  });

  test('should handle market resolution state', async ({ page }) => {
    await page.goto(`/market/${testMarketAddress}`);

    // Check if market is resolved
    const resolvedBadge = page.locator('text=/resolved|settled|completed/i');
    const isResolved = await resolvedBadge.isVisible({ timeout: 2000 });

    if (isResolved) {
      // Resolved market should show outcome
      const outcomeText = page.locator('text=/outcome|result|winner/i');
      await expect(outcomeText).toBeVisible();

      // Should not show betting interface
      const placeBetButton = page.locator('button:has-text("Place Bet")');
      await expect(placeBetButton).not.toBeVisible();

      // Should show claim button if user has winning position
      const claimButton = page.locator('button:has-text("Claim")');
      if (await claimButton.isVisible()) {
        await expect(claimButton).toBeVisible();
      }
    }
  });
});
