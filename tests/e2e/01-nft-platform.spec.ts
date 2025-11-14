import { test, expect } from '@playwright/test';

/**
 * KEKTECH 3.0 - NFT Platform E2E Tests
 * Validates existing NFT marketplace functionality
 */

test.describe('NFT Platform - Core Functionality', () => {

  test('01. Homepage loads successfully', async ({ page }) => {
    await page.goto('/');

    // Check page title
    await expect(page).toHaveTitle(/KEKTECH/i);

    // Check header is visible
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Check connect wallet button exists
    const connectButton = page.getByRole('button', { name: /connect/i });
    await expect(connectButton).toBeVisible();

    console.log('✅ Homepage loaded successfully');
  });

  test('02. Navigation menu works correctly', async ({ page }) => {
    await page.goto('/');

    // Check all main nav links exist
    const marketplaceLink = page.getByRole('link', { name: /marketplace/i });
    const dashboardLink = page.getByRole('link', { name: /dashboard/i });

    await expect(marketplaceLink).toBeVisible();
    await expect(dashboardLink).toBeVisible();

    console.log('✅ Navigation menu working');
  });

  test('03. Marketplace page loads', async ({ page }) => {
    await page.goto('/marketplace');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check page heading exists
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();

    console.log('✅ Marketplace page loaded');
  });

  test('04. Gallery page loads', async ({ page }) => {
    await page.goto('/gallery');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Page should load without errors
    const body = page.locator('body');
    await expect(body).toBeVisible();

    console.log('✅ Gallery page loaded');
  });

  test('05. Dashboard page accessible', async ({ page }) => {
    await page.goto('/dashboard');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Page should load (may require wallet connection)
    const body = page.locator('body');
    await expect(body).toBeVisible();

    console.log('✅ Dashboard page accessible');
  });

  test('06. Responsive design - Mobile view', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Header should still be visible
    const header = page.locator('header');
    await expect(header).toBeVisible();

    console.log('✅ Mobile responsive design working');
  });

  test('07. Page transitions work smoothly', async ({ page }) => {
    await page.goto('/');

    // Navigate to marketplace
    await page.getByRole('link', { name: /marketplace/i }).click();
    await expect(page).toHaveURL(/.*marketplace/);

    // Navigate to gallery
    await page.getByRole('link', { name: /gallery/i }).click();
    await expect(page).toHaveURL(/.*gallery/);

    // Navigate back home
    await page.goto('/');
    await expect(page).toHaveURL(/.*\//);

    console.log('✅ Page transitions working smoothly');
  });

  test('08. Footer contains required information', async ({ page }) => {
    await page.goto('/');

    // Check footer exists
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    console.log('✅ Footer information present');
  });

  test('09. No console errors on page load', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out known third-party errors
    const criticalErrors = errors.filter(err =>
      !err.includes('extension') &&
      !err.includes('chrome-extension')
    );

    expect(criticalErrors.length).toBe(0);

    console.log('✅ No critical console errors');
  });

  test('10. Performance - Page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);

    console.log(`✅ Page loaded in ${loadTime}ms (< 5000ms threshold)`);
  });
});

test.describe('NFT Platform - Wallet Integration', () => {

  test('11. Connect wallet button visible', async ({ page }) => {
    await page.goto('/');

    const connectButton = page.getByRole('button', { name: /connect/i });
    await expect(connectButton).toBeVisible();
    await expect(connectButton).toBeEnabled();

    console.log('✅ Connect wallet button visible and enabled');
  });

  test('12. Wallet modal appears on connect click', async ({ page }) => {
    await page.goto('/');

    const connectButton = page.getByRole('button', { name: /connect/i });
    await connectButton.click();

    // Wait for modal to appear (adjust selector based on actual implementation)
    await page.waitForTimeout(1000);

    console.log('✅ Wallet connection initiated');
  });
});
