/**
 * Navigation Diagnostic Test
 * Tests the complete user flow from homepage to market detail page
 * Captures screenshots at each step to diagnose navigation issues
 */

import { test, expect } from '@playwright/test';

const PRODUCTION_URL = 'https://kektech-frontend.vercel.app';
const TEST_MARKET_ADDRESS = '0x31d2BC49A6FD4a066F5f8AC61Acd0E6c9105DD84';

test.describe('Market Navigation Flow Diagnostics', () => {
  test('Complete navigation from homepage to market detail', async ({ page }) => {
    // Step 1: Visit homepage
    console.log('📍 Step 1: Visiting homepage...');
    await page.goto(PRODUCTION_URL);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'diagnostic-1-homepage.png', fullPage: true });
    console.log('✅ Homepage loaded');

    // Step 2: Check header navigation
    console.log('📍 Step 2: Checking header navigation...');
    const feelsGoodMarketsLink = page.locator('text=Feels Good Markets').first();
    await expect(feelsGoodMarketsLink).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'diagnostic-2-header-visible.png' });
    console.log('✅ "Feels Good Markets" link found in header');

    // Step 3: Click to Feels Good Markets landing
    console.log('📍 Step 3: Navigating to Feels Good Markets landing...');
    await feelsGoodMarketsLink.click();
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'diagnostic-3-feels-good-landing.png', fullPage: true });
    console.log('✅ Feels Good Markets landing page loaded');
    console.log(`   Current URL: ${page.url()}`);

    // Step 4: Look for KEK Futures card
    console.log('📍 Step 4: Looking for KEK Futures card...');
    const kekFuturesCard = page.locator('text=KEK Futures').first();
    await expect(kekFuturesCard).toBeVisible({ timeout: 10000 });

    // Find the "Enter Markets" or CTA button
    const enterMarketsButton = page.locator('text=Enter Markets').first();
    await expect(enterMarketsButton).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'diagnostic-4-kek-futures-card.png' });
    console.log('✅ KEK Futures card with "Enter Markets" button found');

    // Step 5: Click to KEK Futures markets list
    console.log('📍 Step 5: Navigating to KEK Futures markets list...');
    await enterMarketsButton.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Wait for React to render markets
    await page.screenshot({ path: 'diagnostic-5-markets-list.png', fullPage: true });
    console.log('✅ KEK Futures markets list page loaded');
    console.log(`   Current URL: ${page.url()}`);

    // Step 6: Count market cards (CRITICAL DIAGNOSTIC)
    console.log('📍 Step 6: Counting market cards on the page...');

    // Try multiple selectors to find market cards
    const possibleSelectors = [
      '[data-testid="market-card"]',
      'a[href*="/market/0x"]',
      'div.group.p-6.bg-gray-900', // From MarketCard component
      'text=Market #',
      'text=Place Bet',
    ];

    let marketCards = [];
    for (const selector of possibleSelectors) {
      const elements = await page.locator(selector).all();
      if (elements.length > 0) {
        console.log(`   Found ${elements.length} elements with selector: ${selector}`);
        marketCards = elements;
        break;
      }
    }

    if (marketCards.length === 0) {
      console.log('❌ NO MARKET CARDS FOUND!');
      console.log('   Checking for "No markets" or "Loading" messages...');

      const noMarketsText = await page.locator('text=No markets').count();
      const loadingText = await page.locator('text=Loading').count();

      console.log(`   "No markets" messages: ${noMarketsText}`);
      console.log(`   "Loading" messages: ${loadingText}`);

      // Check browser console for errors
      page.on('console', msg => console.log('   Browser console:', msg.text()));

      throw new Error('Market cards not rendering - this is the root cause!');
    }

    console.log(`✅ Found ${marketCards.length} market card(s)`);

    // Step 7: Try to click first market card
    console.log('📍 Step 7: Attempting to click first market card...');
    await marketCards[0].click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'diagnostic-7-market-detail.png', fullPage: true });
    console.log('✅ Market detail page loaded');
    console.log(`   Current URL: ${page.url()}`);

    // Step 8: Verify engagement components exist
    console.log('📍 Step 8: Checking for engagement components...');
    const discussionTab = page.locator('text=Discussion').first();
    const sentimentTab = page.locator('text=Sentiment Voting').first();
    const resolutionTab = page.locator('text=Resolution').first();

    await expect(discussionTab).toBeVisible({ timeout: 10000 });
    await expect(sentimentTab).toBeVisible({ timeout: 10000 });
    await expect(resolutionTab).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: 'diagnostic-8-engagement-tabs.png', fullPage: true });
    console.log('✅ All engagement tabs visible!');

    // Final summary
    console.log('\n🎉 NAVIGATION FLOW SUCCESSFUL!');
    console.log('   Homepage → Feels Good Markets → KEK Futures → Market Detail → Engagement Tabs');
  });

  test('Direct URL access test', async ({ page }) => {
    console.log('📍 Testing direct URL access...');
    await page.goto(`${PRODUCTION_URL}/feels-good-markets/kek-futures/market/${TEST_MARKET_ADDRESS}`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'diagnostic-direct-access.png', fullPage: true });

    const discussionTab = page.locator('text=Discussion').first();
    await expect(discussionTab).toBeVisible({ timeout: 10000 });
    console.log('✅ Direct URL access works - engagement tabs visible');
  });
});
