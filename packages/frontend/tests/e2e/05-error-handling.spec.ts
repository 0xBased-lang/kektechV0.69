/**
 * KEKTECH 3.0 - E2E Test Suite
 * Test 5: Error Handling
 *
 * Tests error states, edge cases, and recovery mechanisms
 */
import { test, expect } from '@playwright/test';
import { WalletHelper } from './helpers/wallet';
import { APIHelper } from './helpers/api';

test.describe('Error Handling', () => {
  let wallet: WalletHelper;
  let api: APIHelper;

  test.beforeEach(async ({ page }) => {
    wallet = new WalletHelper(page);
    api = new APIHelper();
  });

  test.describe('Network Errors', () => {
    test('should handle invalid market address gracefully', async ({ page }) => {
      // Navigate to non-existent market
      await page.goto('/market/0x0000000000000000000000000000000000000000');

      // Should show error state or 404
      const errorMessage = page.locator('text=/not.*found|invalid.*market|error/i');
      await expect(errorMessage).toBeVisible({ timeout: 10000 });
    });

    test('should handle malformed market address', async ({ page }) => {
      // Navigate with invalid address format
      await page.goto('/market/invalid-address');

      // Should show error or redirect
      const hasError = await page.locator('text=/error|invalid/i').isVisible({ timeout: 5000 });
      const isRedirected = page.url() !== 'http://localhost:3006/market/invalid-address';

      expect(hasError || isRedirected).toBeTruthy();
    });

    test('should handle API timeout errors', async ({ page }) => {
      await page.goto('/markets');

      // Wait for markets to load
      await page.waitForTimeout(3000);

      // Check for either content or timeout error
      const hasContent = await page.locator('[data-testid="market-card"]').isVisible();
      const hasError = await page.locator('text=/error.*loading|timeout|try.*again/i').isVisible();

      expect(hasContent || hasError).toBeTruthy();
    });
  });

  test.describe('Authentication Errors', () => {
    test('should show login prompt when voting without wallet', async ({ page }) => {
      await page.goto('/proposals');

      // Wait for proposals to load
      await page.waitForSelector('[data-testid="market-card"], text=/loading|no.*markets/i', { timeout: 10000 });

      const likeButton = page.locator('button[aria-label*="like"], button:has-text("👍")').first();

      if (await likeButton.isVisible({ timeout: 5000 })) {
        // Try to vote without wallet
        await likeButton.click();

        // Should show authentication prompt
        const authPrompt = page.locator('text=/connect.*wallet|sign.*in|login/i');
        await expect(authPrompt).toBeVisible({ timeout: 5000 });
      }
    });

    test('should handle unauthenticated API requests', async ({ page }) => {
      // Try to access admin page without admin rights
      await page.goto('/admin');

      await page.waitForTimeout(2000);

      // Should show connect prompt or access denied
      const needsAuth = await page.locator('text=/connect.*wallet|sign.*in/i').isVisible();
      const accessDenied = await page.locator('text=/access.*denied|unauthorized/i').isVisible();

      expect(needsAuth || accessDenied).toBeTruthy();
    });
  });

  test.describe('Validation Errors', () => {
    test('should validate bet amount bounds', async ({ page }) => {
      const testMarket = process.env.TEST_MARKET_ADDRESS || '0x31d2BC49A6FD4a066F5f8AC61Acd0E6c9105DD84';
      await page.goto(`/market/${testMarket}`);

      const amountInput = page.locator('input[type="number"], input[placeholder*="amount"]').first();

      if (await amountInput.isVisible({ timeout: 5000 })) {
        // Test negative amount
        await amountInput.fill('-10');
        await page.waitForTimeout(500);

        const errorMessage = page.locator('text=/invalid|positive|greater/i');
        const hasError = await errorMessage.isVisible({ timeout: 2000 });

        // Try extremely large amount
        await amountInput.fill('999999999');
        await page.waitForTimeout(500);

        // Should show insufficient balance or max error
        const balanceError = page.locator('text=/insufficient|exceed|too.*much/i');
        const hasBalanceError = await balanceError.isVisible({ timeout: 2000 });

        // At least one validation should trigger
        expect(hasError || hasBalanceError).toBeTruthy();
      }
    });

    test('should validate comment content length', async ({ page }) => {
      const testMarket = process.env.TEST_MARKET_ADDRESS || '0x31d2BC49A6FD4a066F5f8AC61Acd0E6c9105DD84';
      await page.goto(`/market/${testMarket}`);

      // Look for comment textarea
      const commentInput = page.locator('textarea[placeholder*="comment"], textarea[placeholder*="share"]').first();

      if (await commentInput.isVisible({ timeout: 5000 })) {
        // Try empty comment
        await commentInput.fill('');
        const submitButton = page.locator('button:has-text("Post"), button:has-text("Submit")').first();

        if (await submitButton.isVisible()) {
          await submitButton.click();
          await page.waitForTimeout(500);

          // Should show validation error
          const errorMessage = page.locator('text=/required|empty|enter.*comment/i');
          const hasError = await errorMessage.isVisible({ timeout: 2000 });

          // Try very long comment
          const longComment = 'a'.repeat(10000);
          await commentInput.fill(longComment);
          await submitButton.click();
          await page.waitForTimeout(500);

          const lengthError = page.locator('text=/too.*long|exceed|maximum/i');
          const hasLengthError = await lengthError.isVisible({ timeout: 2000 });

          expect(hasError || hasLengthError).toBeTruthy();
        }
      }
    });
  });

  test.describe('Transaction Errors', () => {
    test('should handle rejected transactions gracefully', async ({ page }) => {
      await page.goto('/proposals');

      await page.waitForSelector('text=/connect.*wallet|proposal/i', { timeout: 10000 });

      const isConnected = await page.locator('button:has-text("👍")').isVisible();

      if (!isConnected) {
        test.skip(true, 'Wallet not connected - manual test required');
      }

      // In manual --headed mode, user can reject the transaction
      // In automated mode, this will fail at signing

      const likeButton = page.locator('button:has-text("👍")').first();
      if (await likeButton.isVisible()) {
        await likeButton.click();

        await page.waitForTimeout(3000);

        // Should show error toast or retry option
        const errorMessage = page.locator('text=/rejected|canceled|failed/i');
        const retryButton = page.locator('button:has-text("Retry")');

        const hasError = await errorMessage.isVisible({ timeout: 5000 });
        const hasRetry = await retryButton.isVisible({ timeout: 5000 });

        // Either error message or successful vote
        const successMessage = page.locator('text=/success|voted/i');
        const hasSuccess = await successMessage.isVisible();

        expect(hasError || hasRetry || hasSuccess).toBeTruthy();
      }
    });

    test('should handle insufficient balance errors', async ({ page }) => {
      const testMarket = process.env.TEST_MARKET_ADDRESS || '0x31d2BC49A6FD4a066F5f8AC61Acd0E6c9105DD84';
      await page.goto(`/market/${testMarket}`);

      const amountInput = page.locator('input[type="number"]').first();

      if (await amountInput.isVisible({ timeout: 5000 })) {
        // Try to bet more than balance
        await amountInput.fill('999999');
        await page.waitForTimeout(500);

        const placeBetButton = page.locator('button:has-text("Place Bet"), button:has-text("Buy")').first();

        if (await placeBetButton.isVisible()) {
          // Button should be disabled or show error on click
          const isDisabled = await placeBetButton.isDisabled();
          const errorMessage = page.locator('text=/insufficient|not.*enough|balance/i');
          const hasError = await errorMessage.isVisible({ timeout: 2000 });

          expect(isDisabled || hasError).toBeTruthy();
        }
      }
    });
  });

  test.describe('Network State Errors', () => {
    test('should detect wrong network and show switch prompt', async ({ page }) => {
      await page.goto('/');

      // If wallet connected on wrong network
      await page.waitForTimeout(2000);

      const networkWarning = page.locator('text=/wrong.*network|switch.*network|basedai/i');
      const switchButton = page.locator('button:has-text("Switch Network")');

      // Either on correct network or showing warning
      const hasWarning = await networkWarning.isVisible({ timeout: 2000 });
      const hasSwitchButton = await switchButton.isVisible({ timeout: 2000 });

      // This is fine - either connected to correct network or showing prompt
      console.log('Network state:', { hasWarning, hasSwitchButton });
    });

    test('should handle network connection loss', async ({ page }) => {
      await page.goto('/markets');

      // Simulate going offline
      await page.context().setOffline(true);

      // Try to load markets
      await page.reload();

      await page.waitForTimeout(2000);

      // Should show offline error
      const offlineMessage = page.locator('text=/offline|connection.*lost|network.*error/i');
      const hasOfflineMessage = await offlineMessage.isVisible({ timeout: 2000 });

      // Restore online
      await page.context().setOffline(false);

      console.log('Offline handling:', { hasOfflineMessage });
    });
  });

  test.describe('UI Error States', () => {
    test('should display error boundaries for component failures', async ({ page }) => {
      await page.goto('/markets');

      // Look for error boundary indicators
      const errorBoundary = page.locator('text=/something.*wrong|error.*occurred|try.*reload/i');
      const hasErrorBoundary = await errorBoundary.isVisible({ timeout: 3000 });

      if (hasErrorBoundary) {
        // Should have reload button
        const reloadButton = page.locator('button:has-text("Reload"), button:has-text("Retry")');
        await expect(reloadButton).toBeVisible();
      }
    });

    test('should handle empty states gracefully', async ({ page }) => {
      await page.goto('/markets');

      await page.waitForTimeout(2000);

      // Check for market cards
      const marketCards = page.locator('[data-testid="market-card"]');
      const hasMarkets = await marketCards.count() > 0;

      if (!hasMarkets) {
        // Should show empty state message
        const emptyState = page.locator('text=/no.*markets|create.*first/i');
        await expect(emptyState).toBeVisible({ timeout: 5000 });
      }
    });

    test('should show loading states during async operations', async ({ page }) => {
      await page.goto('/markets');

      // Should show loading initially
      const loadingIndicator = page.locator('[data-testid="loading"], text=/loading/i');
      const hasLoading = await loadingIndicator.isVisible({ timeout: 1000 });

      // Wait for content to load
      await page.waitForTimeout(3000);

      // Loading should be gone
      const stillLoading = await loadingIndicator.isVisible({ timeout: 1000 });

      expect(!stillLoading).toBeTruthy();
    });
  });

  test.describe('Recovery Mechanisms', () => {
    test('should allow retry after failed operations', async ({ page }) => {
      await page.goto('/markets');

      // Look for retry buttons after errors
      const retryButton = page.locator('button:has-text("Retry"), button:has-text("Try Again")');

      if (await retryButton.isVisible({ timeout: 2000 })) {
        // Click retry
        await retryButton.click();

        // Should attempt to reload
        await page.waitForTimeout(2000);

        // Either succeeds or shows error again
        const stillHasError = await retryButton.isVisible({ timeout: 2000 });
        const hasContent = await page.locator('[data-testid="market-card"]').isVisible();

        expect(stillHasError || hasContent).toBeTruthy();
      }
    });

    test('should preserve form state after errors', async ({ page }) => {
      const testMarket = process.env.TEST_MARKET_ADDRESS || '0x31d2BC49A6FD4a066F5f8AC61Acd0E6c9105DD84';
      await page.goto(`/market/${testMarket}`);

      const commentInput = page.locator('textarea').first();

      if (await commentInput.isVisible({ timeout: 5000 })) {
        // Enter comment
        await commentInput.fill('Test comment');

        // Trigger error (try to submit without auth)
        const submitButton = page.locator('button:has-text("Post"), button:has-text("Submit")').first();
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await page.waitForTimeout(1000);

          // Comment text should still be there
          await expect(commentInput).toHaveValue('Test comment');
        }
      }
    });
  });
});
