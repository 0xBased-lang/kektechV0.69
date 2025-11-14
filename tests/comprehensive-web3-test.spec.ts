/**
 * Comprehensive Web3 Frontend Test
 * Using advanced Playwright automation patterns from web3 skill
 */

import { test, expect, Page } from '@playwright/test';

// Error detection helper
function detectErrorType(error: any): string {
  const message = error.message || error.toString();

  if (message.includes('timeout')) return 'timeout';
  if (message.includes('net::ERR')) return 'networkError';
  if (message.includes('500')) return 'serverError';
  if (message.includes('RPC')) return 'rpcError';
  if (message.includes('MetaMask')) return 'walletError';

  return 'unknown';
}

// Error solution helper
function getErrorSolution(errorType: string): string {
  const solutions: Record<string, string> = {
    timeout: 'Page load timeout - check server logs and optimize page rendering',
    networkError: 'Network connection failed - verify server is running',
    serverError: 'Internal server error - check Next.js error page and logs',
    rpcError: 'RPC endpoint failure - verify RPC URL configuration',
    walletError: 'Wallet connection issue - check wallet provider setup',
    unknown: 'Unknown error - review browser console and server logs'
  };

  return solutions[errorType] || solutions.unknown;
}

test.describe('KEKTECH Frontend - Comprehensive Diagnostics', () => {

  test('Health Check - Server Responsiveness', async ({ page }) => {
    console.log('🔍 Testing basic server connectivity...');

    const startTime = Date.now();

    try {
      const response = await page.request.get('http://localhost:3003/api/health');
      const loadTime = Date.now() - startTime;

      console.log(`✅ Health endpoint responded in ${loadTime}ms`);
      console.log(`📊 Status: ${response.status()}`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      console.log('📄 Health data:', JSON.stringify(data, null, 2));

    } catch (error) {
      console.error('❌ Health check failed:', error);
      throw error;
    }
  });

  test('Homepage Load - Full Diagnostic', async ({ page }) => {
    console.log('\n🔍 Starting comprehensive homepage diagnostics...\n');

    // Capture all console messages
    const consoleMessages: any[] = [];
    const consoleErrors: any[] = [];
    const networkErrors: any[] = [];
    const jsErrors: any[] = [];

    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push({ type: msg.type(), text });
      if (msg.type() === 'error') {
        consoleErrors.push(text);
      }
    });

    page.on('requestfailed', request => {
      networkErrors.push({
        url: request.url(),
        method: request.method(),
        error: request.failure()?.errorText
      });
    });

    page.on('pageerror', error => {
      jsErrors.push({
        message: error.message,
        stack: error.stack
      });
    });

    const startTime = Date.now();

    try {
      console.log('📡 Navigating to http://localhost:3003...');

      // Try to load with extended timeout
      const response = await page.goto('http://localhost:3003', {
        waitUntil: 'domcontentloaded',
        timeout: 90000 // 90 seconds
      });

      const loadTime = Date.now() - startTime;
      console.log(`\n✅ Page loaded in ${loadTime}ms`);
      console.log(`📊 HTTP Status: ${response?.status()}\n`);

      // Wait a bit for React hydration
      await page.waitForTimeout(3000);

      // Get page title
      const title = await page.title();
      console.log(`📄 Page Title: "${title}"`);

      // Take screenshot
      await page.screenshot({
        path: 'tests/screenshots/homepage-success.png',
        fullPage: true
      });
      console.log('📸 Screenshot saved: tests/screenshots/homepage-success.png');

      // Check for wallet connect button
      const connectSelectors = [
        'button:has-text("Connect")',
        'button:has-text("Connect Wallet")',
        'w3m-button',
        '[data-testid="connect-button"]'
      ];

      let foundConnect = false;
      for (const selector of connectSelectors) {
        try {
          const count = await page.locator(selector).count();
          if (count > 0) {
            console.log(`\n✅ Found connect button with selector: ${selector}`);
            foundConnect = true;

            // Screenshot the button
            const button = page.locator(selector).first();
            await button.screenshot({
              path: 'tests/screenshots/connect-button.png'
            });
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      if (!foundConnect) {
        console.log('\n⚠️  No connect button found');
      }

      // Report console errors
      if (consoleErrors.length > 0) {
        console.log('\n❌ Console Errors Found:');
        consoleErrors.forEach((err, i) => {
          console.log(`  ${i + 1}. ${err}`);
        });
      } else {
        console.log('\n✅ No console errors');
      }

      // Report network errors
      if (networkErrors.length > 0) {
        console.log('\n🌐 Network Errors:');
        networkErrors.forEach((err, i) => {
          console.log(`  ${i + 1}. ${err.method} ${err.url}`);
          console.log(`     Error: ${err.error}`);
        });
      } else {
        console.log('✅ No network errors');
      }

      // Report JS errors
      if (jsErrors.length > 0) {
        console.log('\n⚠️  JavaScript Errors:');
        jsErrors.forEach((err, i) => {
          console.log(`  ${i + 1}. ${err.message}`);
        });
      } else {
        console.log('✅ No JavaScript errors');
      }

      // Sample console messages (last 10)
      console.log('\n📝 Recent Console Messages:');
      consoleMessages.slice(-10).forEach((msg, i) => {
        console.log(`  ${i + 1}. [${msg.type}] ${msg.text}`);
      });

      // Get page performance metrics
      const metrics = await page.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          dns: Math.round(nav.domainLookupEnd - nav.domainLookupStart),
          tcp: Math.round(nav.connectEnd - nav.connectStart),
          ttfb: Math.round(nav.responseStart - nav.requestStart),
          domInteractive: Math.round(nav.domInteractive - nav.fetchStart),
          domComplete: Math.round(nav.domComplete - nav.fetchStart),
        };
      });

      console.log('\n⚡ Performance Metrics:');
      console.log(`  DNS Lookup: ${metrics.dns}ms`);
      console.log(`  TCP Connection: ${metrics.tcp}ms`);
      console.log(`  Time to First Byte: ${metrics.ttfb}ms`);
      console.log(`  DOM Interactive: ${metrics.domInteractive}ms`);
      console.log(`  DOM Complete: ${metrics.domComplete}ms`);

      // Verify HTTP 200
      expect(response?.status()).toBe(200);

      console.log('\n✅ Homepage diagnostic complete!\n');

    } catch (error: any) {
      const loadTime = Date.now() - startTime;
      console.error(`\n❌ PAGE LOAD FAILED after ${loadTime}ms\n`);

      const errorType = detectErrorType(error);
      const solution = getErrorSolution(errorType);

      console.log(`🔍 Error Type: ${errorType}`);
      console.log(`💡 Suggested Solution: ${solution}\n`);

      // Try to capture error state
      try {
        await page.screenshot({
          path: 'tests/screenshots/error-state.png',
          fullPage: true
        });
        console.log('📸 Error screenshot saved: tests/screenshots/error-state.png');

        const html = await page.content();
        console.log(`\n📄 Page HTML (first 500 chars):\n${html.substring(0, 500)}\n`);
      } catch (screenshotError) {
        console.log('⚠️  Could not capture error state');
      }

      // Report any errors we captured
      if (consoleErrors.length > 0) {
        console.log('❌ Console Errors:');
        consoleErrors.forEach(err => console.log(`  - ${err}`));
      }

      if (networkErrors.length > 0) {
        console.log('\n🌐 Network Failures:');
        networkErrors.forEach(err => {
          console.log(`  - ${err.method} ${err.url}: ${err.error}`);
        });
      }

      if (jsErrors.length > 0) {
        console.log('\n⚠️  JavaScript Errors:');
        jsErrors.forEach(err => {
          console.log(`  - ${err.message}`);
          if (err.stack) console.log(`    Stack: ${err.stack.substring(0, 200)}`);
        });
      }

      throw error;
    }
  });

  test('RPC Endpoint Test', async ({ page }) => {
    console.log('\n🔍 Testing RPC endpoint...\n');

    try {
      const response = await page.request.post('http://localhost:3003/api/rpc', {
        data: {
          jsonrpc: '2.0',
          method: 'eth_chainId',
          params: [],
          id: 1
        }
      });

      console.log(`📊 RPC Status: ${response.status()}`);

      const data = await response.json();
      console.log('📄 RPC Response:', JSON.stringify(data, null, 2));

      if (data.result) {
        const chainId = parseInt(data.result, 16);
        console.log(`\n✅ Chain ID: ${chainId} (${data.result})`);
        expect(chainId).toBe(32323); // BasedAI mainnet
      }

    } catch (error) {
      console.error('❌ RPC test failed:', error);
      throw error;
    }
  });

});
