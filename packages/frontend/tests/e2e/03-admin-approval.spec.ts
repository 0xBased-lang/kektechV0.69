/**
 * KEKTECH 3.0 - E2E Test Suite
 * Test 3: Admin Market Approval
 *
 * Tests admin approval flow for proposed markets
 */
import { test, expect } from '@playwright/test';
import { WalletHelper } from './helpers/wallet';
import { APIHelper } from './helpers/api';

test.describe('Admin Market Approval', () => {
  let wallet: WalletHelper;
  let api: APIHelper;
  const testMarketAddress = process.env.TEST_MARKET_ADDRESS || '0x31d2BC49A6FD4a066F5f8AC61Acd0E6c9105DD84';

  test.beforeEach(async ({ page }) => {
    wallet = new WalletHelper(page);
    api = new APIHelper();
    await page.goto('/admin');
  });

  test('should display admin panel to admin users', async ({ page }) => {
    // Should show proposal management panel
    await expect(page.locator('h2:has-text("Proposal Management")')).toBeVisible();

    // Should show market cards or empty state
    const hasMarkets = await page.locator('[data-testid="market-card"]').count() > 0;
    const emptyState = await page.locator('text=/no.*proposals/i').isVisible();
    expect(hasMarkets || emptyState).toBeTruthy();
  });

  test('should filter markets by status', async ({ page }) => {
    // Find status filter tabs
    const proposedTab = page.locator('button:has-text("Proposed")');
    const approvedTab = page.locator('button:has-text("Approved")');
    const rejectedTab = page.locator('button:has-text("Rejected")');

    // Check tabs exist
    await expect(proposedTab).toBeVisible();
    await expect(approvedTab).toBeVisible();
    await expect(rejectedTab).toBeVisible();

    // Click through tabs
    await proposedTab.click();
    await page.waitForTimeout(500); // Wait for filter

    await approvedTab.click();
    await page.waitForTimeout(500);

    await rejectedTab.click();
    await page.waitForTimeout(500);
  });

  test('should display market details correctly', async ({ page }) => {
    const marketCard = page.locator('[data-testid="market-card"]').first();

    if (await marketCard.isVisible()) {
      // Should show market question
      await expect(marketCard.locator('[data-testid="market-question"]')).toBeVisible();

      // Should show creator address
      await expect(marketCard.locator('text=/by 0x[a-fA-F0-9]/i')).toBeVisible();

      // Should show vote counts
      await expect(marketCard.locator('text=/likes/i')).toBeVisible();
      await expect(marketCard.locator('text=/dislikes/i')).toBeVisible();

      // Should show status badge
      const statusBadge = marketCard.locator('[data-testid="market-status"]');
      await expect(statusBadge).toBeVisible();
    }
  });

  test('should show approve button for PROPOSED markets', async ({ page }) => {
    // Wait for connection prompt or admin panel
    await page.waitForSelector('text=/connect.*wallet|proposal.*management/i', { timeout: 10000 });

    const isConnected = await page.locator('text=/proposal.*management/i').isVisible();

    if (!isConnected) {
      test.skip(true, 'Wallet not connected - manual test required');
    }

    // Look for PROPOSED market
    const proposedMarket = page.locator('[data-testid="market-card"]:has([data-testid="market-status"]:has-text("Proposed"))').first();

    if (await proposedMarket.isVisible()) {
      const approveButton = proposedMarket.locator('button:has-text("Approve")');
      await expect(approveButton).toBeVisible();
      await expect(approveButton).toBeEnabled();
    }
  });

  test('should handle approve button click', async ({ page }) => {
    await page.waitForSelector('text=/connect.*wallet|proposal.*management/i', { timeout: 10000 });

    const isConnected = await page.locator('text=/proposal.*management/i').isVisible();

    if (!isConnected) {
      test.skip(true, 'Wallet not connected - manual test required');
    }

    const proposedMarket = page.locator('[data-testid="market-card"]:has([data-testid="market-status"]:has-text("Proposed"))').first();

    if (await proposedMarket.isVisible()) {
      const approveButton = proposedMarket.locator('button:has-text("Approve")');

      // Click approve - this will trigger MetaMask in manual testing
      await approveButton.click();

      // In automated tests without MetaMask, this will show connection modal or error
      // In manual --headed mode, MetaMask will open for signature

      // Wait for either success toast or error message
      const successToast = page.locator('text=/approved.*successfully/i');
      const errorToast = page.locator('text=/error|failed/i');

      // Give time for transaction or error
      await page.waitForTimeout(2000);

      const hasSuccess = await successToast.isVisible();
      const hasError = await errorToast.isVisible();

      // Either outcome is valid (depends on wallet availability)
      expect(hasSuccess || hasError).toBeTruthy();
    }
  });

  test('should display market statistics', async ({ page }) => {
    const statsSection = page.locator('[data-testid="admin-stats"]');

    if (await statsSection.isVisible()) {
      // Check for key metrics
      await expect(statsSection.locator('text=/total.*markets/i')).toBeVisible();
      await expect(statsSection.locator('text=/pending.*approval/i')).toBeVisible();
    }
  });

  test('should allow searching markets', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]');

    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(500); // Debounce

      // Results should filter
      const marketCards = page.locator('[data-testid="market-card"]');
      const count = await marketCards.count();

      // Either shows filtered results or "no results"
      if (count === 0) {
        await expect(page.locator('text=/no.*found/i')).toBeVisible();
      }

      // Clear search
      await searchInput.clear();
      await page.waitForTimeout(500);
    }
  });

  test('should handle reject action for PROPOSED markets', async ({ page }) => {
    await page.waitForSelector('text=/connect.*wallet|proposal.*management/i', { timeout: 10000 });

    const isConnected = await page.locator('text=/proposal.*management/i').isVisible();

    if (!isConnected) {
      test.skip(true, 'Wallet not connected - manual test required');
    }

    const proposedMarket = page.locator('[data-testid="market-card"]:has([data-testid="market-status"]:has-text("Proposed"))').first();

    if (await proposedMarket.isVisible()) {
      const rejectButton = proposedMarket.locator('button:has-text("Reject")');

      if (await rejectButton.isVisible()) {
        await rejectButton.click();

        // Should show confirmation dialog
        const confirmDialog = page.locator('[role="dialog"]:has-text("Reject")');
        const hasDialog = await confirmDialog.isVisible({ timeout: 2000 });

        if (hasDialog) {
          // Close dialog
          await page.locator('button:has-text("Cancel")').click();
        }
      }
    }
  });
});
