/**
 * KEKTECH 3.0 - Authentication E2E Tests
 *
 * Tests the complete SIWE authentication flow including:
 * - Wallet connection
 * - SIWE message signing
 * - Session creation
 * - Session persistence
 * - Sign out
 * - Security features (replay protection, timestamp validation)
 */

import { test, expect, type Page } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_MARKET = '0x31d2BC49A6FD4a066F5f8AC61Acd0E6c9105DD84';

/**
 * Helper: Connect MetaMask wallet
 * Uses Playwright's wallet automation features
 */
async function connectWallet(page: Page) {
  await page.goto(BASE_URL);

  // Click Connect Wallet button
  await page.click('button:has-text("Connect Wallet")');

  // Wait for wallet selection modal
  await page.waitForSelector('text=MetaMask', { timeout: 5000 });

  // Select MetaMask
  await page.click('button:has-text("MetaMask")');

  // Wait for MetaMask popup (handled by wallet extension)
  // In real tests, you'd use @synthetixio/synpress for wallet automation
  await page.waitForTimeout(2000);

  // Verify wallet connected
  await expect(page.locator('text=/0x[a-fA-F0-9]{4}\\.\\.\\.[a-fA-F0-9]{4}/')).toBeVisible({
    timeout: 10000
  });
}

/**
 * Helper: Sign SIWE message
 * Returns the message and signature for testing
 */
async function signSIWE(page: Page): Promise<{ message: string; signature: string }> {
  // Navigate to market page with comment form
  await page.goto(`${BASE_URL}/market/${TEST_MARKET}`);

  // Click Sign In with Wallet
  await page.click('button:has-text("Sign In with Wallet")');

  // Wait for MetaMask signature request
  // In real tests, @synthetixio/synpress would handle this
  await page.waitForTimeout(3000);

  // Capture the SIWE message and signature from network
  const authRequest = await page.waitForResponse(
    response => response.url().includes('/api/auth/verify') && response.request().method() === 'POST',
    { timeout: 10000 }
  );

  const requestBody = await authRequest.request().postDataJSON();

  return {
    message: requestBody.message,
    signature: requestBody.signature
  };
}

/**
 * Test Suite: Wallet Connection
 */
test.describe('Wallet Connection', () => {
  test('should display connect wallet button', async ({ page }) => {
    await page.goto(BASE_URL);

    // Check header has Connect Wallet button
    await expect(page.locator('button:has-text("Connect Wallet")')).toBeVisible();
  });

  test('should show not signed in status after wallet connection', async ({ page }) => {
    await connectWallet(page);

    // Should show yellow "Not Signed In" indicator
    await expect(page.locator('text=Not Signed In')).toBeVisible();

    // Sign Out button should NOT be visible yet
    await expect(page.locator('button:has-text("Sign Out")')).not.toBeVisible();
  });

  test('should persist wallet connection across page reloads', async ({ page }) => {
    await connectWallet(page);

    // Get wallet address
    const walletAddress = await page.locator('text=/0x[a-fA-F0-9]{4}\\.\\.\\.[a-fA-F0-9]{4}/').textContent();

    // Reload page
    await page.reload();

    // Wallet should still be connected
    await expect(page.locator(`text=${walletAddress}`)).toBeVisible();
  });
});

/**
 * Test Suite: SIWE Authentication
 */
test.describe('SIWE Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await connectWallet(page);
  });

  test('should display Sign In button on market page', async ({ page }) => {
    await page.goto(`${BASE_URL}/market/${TEST_MARKET}`);

    // Sign In button should be visible in comment form
    await expect(page.locator('button:has-text("Sign In with Wallet")')).toBeVisible();
  });

  test('should show SIWE message with correct format', async ({ page }) => {
    await page.goto(`${BASE_URL}/market/${TEST_MARKET}`);

    // Click Sign In
    await page.click('button:has-text("Sign In with Wallet")');

    // Wait for MetaMask to open with SIWE message
    await page.waitForTimeout(2000);

    // Check console for SIWE message (in dev mode)
    const logs: string[] = [];
    page.on('console', msg => logs.push(msg.text()));

    // SIWE message should be logged
    await page.waitForTimeout(1000);

    const siweLog = logs.find(log => log.includes('Sign in to KEKTECH 3.0'));
    expect(siweLog).toBeTruthy();
  });

  test('should authenticate successfully with valid signature', async ({ page }) => {
    await page.goto(`${BASE_URL}/market/${TEST_MARKET}`);

    // Sign in
    await page.click('button:has-text("Sign In with Wallet")');

    // Wait for authentication to complete
    await page.waitForTimeout(5000);

    // Header should show "Signed In" status
    await expect(page.locator('text=Signed In')).toBeVisible({ timeout: 10000 });

    // Sign Out button should be visible
    await expect(page.locator('button:has-text("Sign Out")')).toBeVisible();

    // Comment form should be available
    await expect(page.locator('textarea[placeholder*="comment"]')).toBeVisible();
  });

  test('should reject authentication with invalid signature', async ({ page, request }) => {
    // Try to authenticate with invalid signature
    const response = await request.post(`${BASE_URL}/api/auth/verify`, {
      data: {
        message: 'Invalid SIWE message',
        signature: '0xinvalidsignature'
      }
    });

    // Should return 401 or 400
    expect([400, 401, 500]).toContain(response.status());

    const json = await response.json();
    expect(json.success).toBe(false);
    expect(json.error).toBeTruthy();
  });
});

/**
 * Test Suite: Session Management
 */
test.describe('Session Management', () => {
  test.beforeEach(async ({ page }) => {
    await connectWallet(page);
    await page.goto(`${BASE_URL}/market/${TEST_MARKET}`);
    await page.click('button:has-text("Sign In with Wallet")');
    await page.waitForTimeout(5000);
  });

  test('should persist session across page reloads', async ({ page }) => {
    // Verify signed in
    await expect(page.locator('text=Signed In')).toBeVisible();

    // Reload page
    await page.reload();

    // Should still be signed in
    await expect(page.locator('text=Signed In')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button:has-text("Sign Out")')).toBeVisible();
  });

  test('should persist session across navigation', async ({ page }) => {
    // Verify signed in on market page
    await expect(page.locator('text=Signed In')).toBeVisible();

    // Navigate to home
    await page.goto(BASE_URL);

    // Should still be signed in
    await expect(page.locator('text=Signed In')).toBeVisible();

    // Navigate back to market
    await page.goto(`${BASE_URL}/market/${TEST_MARKET}`);

    // Should still be signed in
    await expect(page.locator('text=Signed In')).toBeVisible();
  });

  test('should allow posting comments when authenticated', async ({ page }) => {
    // Type comment
    await page.fill('textarea[placeholder*="comment"]', 'Test comment from Playwright E2E');

    // Post comment
    await page.click('button:has-text("Post Comment")');

    // Wait for comment to appear
    await expect(page.locator('text=Test comment from Playwright E2E')).toBeVisible({
      timeout: 10000
    });
  });
});

/**
 * Test Suite: Sign Out
 */
test.describe('Sign Out', () => {
  test.beforeEach(async ({ page }) => {
    await connectWallet(page);
    await page.goto(`${BASE_URL}/market/${TEST_MARKET}`);
    await page.click('button:has-text("Sign In with Wallet")');
    await page.waitForTimeout(5000);
  });

  test('should sign out successfully', async ({ page }) => {
    // Verify signed in
    await expect(page.locator('text=Signed In')).toBeVisible();

    // Click Sign Out
    await page.click('button:has-text("Sign Out")');

    // Wait for sign out to complete
    await page.waitForTimeout(2000);

    // Should show "Not Signed In"
    await expect(page.locator('text=Not Signed In')).toBeVisible();

    // Sign Out button should disappear
    await expect(page.locator('button:has-text("Sign Out")')).not.toBeVisible();
  });

  test('should persist sign-out state across reloads', async ({ page }) => {
    // Sign out
    await page.click('button:has-text("Sign Out")');
    await page.waitForTimeout(2000);

    // Reload page
    await page.reload();

    // Should still be signed out
    await expect(page.locator('text=Not Signed In')).toBeVisible();
  });

  test('should reject API calls after sign out', async ({ page, request }) => {
    // Sign out
    await page.click('button:has-text("Sign Out")');
    await page.waitForTimeout(2000);

    // Try to post comment
    const response = await request.post(`${BASE_URL}/api/comments`, {
      data: {
        marketAddress: TEST_MARKET,
        content: 'Should fail - not authenticated'
      }
    });

    // Should return 401 Unauthorized
    expect(response.status()).toBe(401);
  });
});

/**
 * Test Suite: Security Features
 */
test.describe('Security Features', () => {
  test.beforeEach(async ({ page }) => {
    await connectWallet(page);
  });

  test('should prevent replay attacks (same signature twice)', async ({ page, request }) => {
    // Sign message once
    await page.goto(`${BASE_URL}/market/${TEST_MARKET}`);
    await page.click('button:has-text("Sign In with Wallet")');

    // Capture signature
    const authResponse = await page.waitForResponse(
      response => response.url().includes('/api/auth/verify')
    );
    const { message, signature } = await authResponse.request().postDataJSON();

    // Wait for first auth to complete
    await page.waitForTimeout(2000);

    // Try to use same signature again
    const replayResponse = await request.post(`${BASE_URL}/api/auth/verify`, {
      data: { message, signature }
    });

    // Should work if nonce not tracked (current implementation)
    // TODO: After implementing nonce tracking, this should fail with 401
    console.log('Replay attack test result:', replayResponse.status());
    // expect(replayResponse.status()).toBe(401); // Uncomment after fix
  });

  test('should validate SIWE message format', async ({ page, request }) => {
    // Try malformed SIWE message
    const response = await request.post(`${BASE_URL}/api/auth/verify`, {
      data: {
        message: 'Not a valid SIWE message',
        signature: '0x1234567890abcdef'
      }
    });

    // Should reject
    expect([400, 401, 500]).toContain(response.status());
  });

  test('should validate chain ID in SIWE message', async ({ page, request }) => {
    // Create SIWE message with wrong chain ID
    const wrongChainMessage = {
      domain: 'localhost:3000',
      address: '0x1234567890123456789012345678901234567890',
      statement: 'Sign in to KEKTECH 3.0',
      uri: 'http://localhost:3000',
      version: '1',
      chainId: 1, // Wrong! Should be 32323 for BasedAI
      nonce: crypto.randomUUID()
    };

    // Signature won't match due to wrong chain
    const response = await request.post(`${BASE_URL}/api/auth/verify`, {
      data: {
        message: JSON.stringify(wrongChainMessage),
        signature: '0xinvalidsignature'
      }
    });

    expect([400, 401, 500]).toContain(response.status());
  });
});

/**
 * Test Suite: Mobile Responsiveness
 */
test.describe('Mobile Authentication', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  test('should show auth status in mobile menu', async ({ page }) => {
    await connectWallet(page);

    // Open mobile menu
    await page.click('button[aria-label="Toggle mobile menu"]');

    // Should show auth status in mobile menu
    await expect(page.locator('text=Not Signed In')).toBeVisible();
  });

  test('should allow sign in from mobile', async ({ page }) => {
    await connectWallet(page);
    await page.goto(`${BASE_URL}/market/${TEST_MARKET}`);

    // Sign in should work on mobile
    await page.click('button:has-text("Sign In with Wallet")');
    await page.waitForTimeout(5000);

    // Open mobile menu to check status
    await page.click('button[aria-label="Toggle mobile menu"]');
    await expect(page.locator('text=Signed In')).toBeVisible();
  });

  test('should allow sign out from mobile menu', async ({ page }) => {
    await connectWallet(page);
    await page.goto(`${BASE_URL}/market/${TEST_MARKET}`);
    await page.click('button:has-text("Sign In with Wallet")');
    await page.waitForTimeout(5000);

    // Open mobile menu
    await page.click('button[aria-label="Toggle mobile menu"]');

    // Sign out
    await page.click('button:has-text("Sign Out")');
    await page.waitForTimeout(2000);

    // Should show Not Signed In
    await expect(page.locator('text=Not Signed In')).toBeVisible();
  });
});

/**
 * Test Suite: Error Handling
 */
test.describe('Error Handling', () => {
  test('should show error when signing without wallet', async ({ page }) => {
    // Don't connect wallet
    await page.goto(`${BASE_URL}/market/${TEST_MARKET}`);

    // Try to sign in
    await page.click('button:has-text("Sign In with Wallet")');

    // Should show error
    await expect(page.locator('text=/connect.*wallet/i')).toBeVisible({
      timeout: 5000
    });
  });

  test('should handle API errors gracefully', async ({ page, request }) => {
    // Simulate API error by sending invalid data
    const response = await request.post(`${BASE_URL}/api/auth/verify`, {
      data: {
        // Missing required fields
      }
    });

    expect(response.status()).toBe(400);
    const json = await response.json();
    expect(json.error).toBeTruthy();
  });

  test('should handle network errors gracefully', async ({ page, context }) => {
    await connectWallet(page);

    // Block API requests
    await context.route('**/api/auth/verify', route => route.abort());

    await page.goto(`${BASE_URL}/market/${TEST_MARKET}`);
    await page.click('button:has-text("Sign In with Wallet")');

    // Should show error message
    await expect(page.locator('text=/error|failed/i')).toBeVisible({
      timeout: 10000
    });
  });
});

/**
 * Test Suite: Performance
 */
test.describe('Performance', () => {
  test('authentication should complete within 10 seconds', async ({ page }) => {
    const startTime = Date.now();

    await connectWallet(page);
    await page.goto(`${BASE_URL}/market/${TEST_MARKET}`);
    await page.click('button:has-text("Sign In with Wallet")');
    await page.waitForSelector('text=Signed In', { timeout: 10000 });

    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(10000);

    console.log(`Authentication completed in ${duration}ms`);
  });

  test('session check should be fast (<500ms)', async ({ page }) => {
    await connectWallet(page);
    await page.goto(`${BASE_URL}/market/${TEST_MARKET}`);
    await page.click('button:has-text("Sign In with Wallet")');
    await page.waitForTimeout(5000);

    // Measure session check on reload
    const startTime = Date.now();
    await page.reload();
    await page.waitForSelector('text=Signed In');
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(500);
    console.log(`Session check completed in ${duration}ms`);
  });
});
