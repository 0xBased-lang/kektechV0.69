import { test, expect } from '@playwright/test';

test.describe('Frontend Debug & Diagnostics', () => {
  test('Homepage Load Test', async ({ page }) => {
    console.log('🔍 Starting homepage load test...');

    // Capture console logs and errors
    const consoleMessages: string[] = [];
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(text);
      if (msg.type() === 'error') {
        consoleErrors.push(text);
      }
    });

    // Capture network errors
    const networkErrors: string[] = [];
    page.on('requestfailed', request => {
      networkErrors.push(`${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
    });

    // Start timing
    const startTime = Date.now();

    try {
      // Try to load homepage with longer timeout
      console.log('📡 Navigating to http://localhost:3003...');
      const response = await page.goto('http://localhost:3003', {
        waitUntil: 'networkidle',
        timeout: 60000 // 60 second timeout
      });

      const loadTime = Date.now() - startTime;
      console.log(`✅ Page loaded in ${loadTime}ms`);
      console.log(`📊 Status: ${response?.status()}`);

      // Take screenshot
      await page.screenshot({ path: 'tests/screenshots/homepage.png', fullPage: true });
      console.log('📸 Screenshot saved: tests/screenshots/homepage.png');

      // Wait a bit for React to hydrate
      await page.waitForTimeout(2000);

      // Get page title
      const title = await page.title();
      console.log(`📄 Page Title: ${title}`);

      // Check for wallet connect button
      const connectButton = page.locator('button:has-text("Connect")').first();
      const hasConnectButton = await connectButton.count() > 0;
      console.log(`🔌 Connect Wallet Button: ${hasConnectButton ? 'Found' : 'Not Found'}`);

      if (hasConnectButton) {
        await connectButton.screenshot({ path: 'tests/screenshots/connect-button.png' });
      }

      // Log console errors
      if (consoleErrors.length > 0) {
        console.log('\n❌ Console Errors:');
        consoleErrors.forEach(err => console.log(`  - ${err}`));
      } else {
        console.log('✅ No console errors');
      }

      // Log network errors
      if (networkErrors.length > 0) {
        console.log('\n🌐 Network Errors:');
        networkErrors.forEach(err => console.log(`  - ${err}`));
      } else {
        console.log('✅ No network errors');
      }

      // Sample console messages
      console.log('\n📝 Sample Console Messages (last 10):');
      consoleMessages.slice(-10).forEach(msg => console.log(`  - ${msg}`));

    } catch (error) {
      console.error(`\n❌ FAILED TO LOAD PAGE:`);
      console.error(error);

      // Try to get page content anyway
      try {
        await page.screenshot({ path: 'tests/screenshots/error-page.png' });
        console.log('📸 Error screenshot saved: tests/screenshots/error-page.png');

        const content = await page.content();
        console.log('\n📄 Page HTML (first 500 chars):');
        console.log(content.substring(0, 500));
      } catch (screenshotError) {
        console.error('Could not capture error state');
      }

      throw error;
    }
  });

  test('Test Wallet Connection Flow', async ({ page }) => {
    console.log('🔍 Testing wallet connection flow...');

    // Skip if homepage didn't load
    await page.goto('http://localhost:3003', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    await page.waitForTimeout(2000);

    // Look for connect button with various selectors
    const selectors = [
      'button:has-text("Connect")',
      'button:has-text("Connect Wallet")',
      '[data-testid="connect-button"]',
      'button[class*="connect"]'
    ];

    let connectButton = null;
    for (const selector of selectors) {
      const btn = page.locator(selector).first();
      if (await btn.count() > 0) {
        connectButton = btn;
        console.log(`✅ Found connect button with selector: ${selector}`);
        break;
      }
    }

    if (connectButton) {
      console.log('🖱️ Clicking connect button...');
      await connectButton.click();

      await page.waitForTimeout(2000);

      // Take screenshot after click
      await page.screenshot({ path: 'tests/screenshots/after-connect-click.png', fullPage: true });
      console.log('📸 Screenshot saved: tests/screenshots/after-connect-click.png');

      // Check for wallet modal
      const modalVisible = await page.locator('[role="dialog"]').count() > 0;
      console.log(`🪟 Wallet Modal Visible: ${modalVisible}`);

      if (modalVisible) {
        await page.screenshot({ path: 'tests/screenshots/wallet-modal.png' });
        console.log('📸 Modal screenshot saved: tests/screenshots/wallet-modal.png');
      }
    } else {
      console.log('❌ Connect button not found');
    }
  });

  test('Performance Metrics', async ({ page }) => {
    console.log('🔍 Measuring performance metrics...');

    const startTime = Date.now();
    await page.goto('http://localhost:3003', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    const domContentLoadedTime = Date.now() - startTime;

    await page.waitForLoadState('networkidle');
    const networkIdleTime = Date.now() - startTime;

    console.log(`⏱️ DOMContentLoaded: ${domContentLoadedTime}ms`);
    console.log(`⏱️ Network Idle: ${networkIdleTime}ms`);

    // Get performance metrics
    const metrics = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        dns: nav.domainLookupEnd - nav.domainLookupStart,
        tcp: nav.connectEnd - nav.connectStart,
        ttfb: nav.responseStart - nav.requestStart,
        download: nav.responseEnd - nav.responseStart,
        domInteractive: nav.domInteractive - nav.fetchStart,
        domComplete: nav.domComplete - nav.fetchStart,
      };
    });

    console.log('\n📊 Performance Metrics:');
    console.log(`  DNS Lookup: ${metrics.dns.toFixed(2)}ms`);
    console.log(`  TCP Connection: ${metrics.tcp.toFixed(2)}ms`);
    console.log(`  Time to First Byte: ${metrics.ttfb.toFixed(2)}ms`);
    console.log(`  Download: ${metrics.download.toFixed(2)}ms`);
    console.log(`  DOM Interactive: ${metrics.domInteractive.toFixed(2)}ms`);
    console.log(`  DOM Complete: ${metrics.domComplete.toFixed(2)}ms`);
  });
});
