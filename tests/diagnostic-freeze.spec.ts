import { test } from '@playwright/test';

test('Diagnose markets page freeze', async ({ page }) => {
  // === CAPTURE SYSTEM ===
  const consoleLogs: string[] = [];
  const consoleErrors: string[] = [];
  const pageErrors: any[] = [];
  const failedRequests: any[] = [];
  const slowRequests: any[] = [];
  const networkActivity: any[] = [];

  // Console logs
  page.on('console', msg => {
    const text = `[${msg.type()}] ${msg.text()}`;
    consoleLogs.push(text);
    if (msg.type() === 'error') {
      consoleErrors.push(text);
    }
  });

  // Page errors (React crashes, etc)
  page.on('pageerror', error => {
    pageErrors.push({
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
  });

  // Failed network requests
  page.on('requestfailed', request => {
    failedRequests.push({
      url: request.url(),
      method: request.method(),
      error: request.failure()?.errorText,
    });
  });

  // Track slow/hanging requests
  const requestTimings = new Map();
  page.on('request', request => {
    requestTimings.set(request.url(), Date.now());
  });

  page.on('response', response => {
    const startTime = requestTimings.get(response.url());
    if (startTime) {
      const duration = Date.now() - startTime;
      if (duration > 3000) {
        slowRequests.push({
          url: response.url(),
          duration: `${duration}ms`,
          status: response.status(),
        });
      }
    }

    networkActivity.push({
      url: response.url(),
      status: response.status(),
      method: response.request().method(),
    });
  });

  console.log('\n🔍 Starting diagnosis...\n');

  try {
    console.log('1️⃣ Navigating to http://localhost:3007/markets...');

    // Navigate with 30s timeout
    await page.goto('http://localhost:3007/markets', {
      timeout: 30000,
      waitUntil: 'domcontentloaded',
    });

    console.log('✅ Page loaded (domcontentloaded)');

    // Wait to see if page eventually renders
    console.log('2️⃣ Waiting 10 seconds to observe behavior...');
    await page.waitForTimeout(10000);

    // Take screenshot
    console.log('3️⃣ Taking screenshot...');
    await page.screenshot({
      path: 'tests/diagnostic-freeze.png',
      fullPage: true
    });

    // Check page state
    const url = page.url();
    const title = await page.title();
    const html = await page.content();

    console.log('\n📊 === DIAGNOSTIC RESULTS ===\n');

    console.log('📍 Page State:');
    console.log(`  URL: ${url}`);
    console.log(`  Title: ${title}`);
    console.log(`  HTML Length: ${html.length} characters`);

    console.log('\n🔴 Console Errors:', consoleErrors.length);
    consoleErrors.forEach((err, i) => {
      console.log(`  ${i + 1}. ${err}`);
    });

    console.log('\n💥 Page Errors:', pageErrors.length);
    pageErrors.forEach((err, i) => {
      console.log(`  ${i + 1}. ${err.name}: ${err.message}`);
      if (err.stack) console.log(`     Stack: ${err.stack.split('\n')[0]}`);
    });

    console.log('\n❌ Failed Requests:', failedRequests.length);
    failedRequests.forEach((req, i) => {
      console.log(`  ${i + 1}. ${req.method} ${req.url}`);
      console.log(`     Error: ${req.error}`);
    });

    console.log('\n🐌 Slow Requests (>3s):', slowRequests.length);
    slowRequests.forEach((req, i) => {
      console.log(`  ${i + 1}. ${req.url} (${req.duration})`);
    });

    console.log('\n🌐 Network Activity Summary:');
    const by4xx = networkActivity.filter(r => r.status >= 400 && r.status < 500);
    const by5xx = networkActivity.filter(r => r.status >= 500);
    console.log(`  Total Requests: ${networkActivity.length}`);
    console.log(`  4xx Errors: ${by4xx.length}`);
    by4xx.forEach(r => console.log(`    - ${r.status} ${r.url}`));
    console.log(`  5xx Errors: ${by5xx.length}`);
    by5xx.forEach(r => console.log(`    - ${r.status} ${r.url}`));

    console.log('\n📝 Recent Console Logs (last 20):');
    consoleLogs.slice(-20).forEach((log, i) => {
      console.log(`  ${i + 1}. ${log}`);
    });

    console.log('\n✅ Diagnostic complete! Check tests/diagnostic-freeze.png\n');

  } catch (error: any) {
    console.error('\n💀 FATAL ERROR during navigation:');
    console.error(`  Type: ${error.name}`);
    console.error(`  Message: ${error.message}`);

    // Still try to capture what we can
    await page.screenshot({
      path: 'tests/diagnostic-error.png'
    }).catch(() => {});

    console.log('\n🔴 Captured Errors:', consoleErrors.length);
    consoleErrors.forEach(err => console.log(`  - ${err}`));

    console.log('\n❌ Failed Requests:', failedRequests.length);
    failedRequests.forEach(req => {
      console.log(`  - ${req.method} ${req.url}: ${req.error}`);
    });

    throw error;
  }
});
