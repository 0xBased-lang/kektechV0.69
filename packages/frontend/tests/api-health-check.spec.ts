import { test, expect } from '@playwright/test';

const BASE_URL = 'https://kektech-frontend.vercel.app';

test.describe('Production API Health Check', () => {
  test('homepage should load', async ({ page }) => {
    const response = await page.goto(BASE_URL);
    expect(response?.status()).toBe(200);
    console.log('✅ Homepage loaded successfully');
  });

  test('health API should respond', async ({ request }) => {
    try {
      const response = await request.get(`${BASE_URL}/api/health`, {
        timeout: 30000, // 30 second timeout
      });

      console.log('Response status:', response.status());
      console.log('Response headers:', await response.headersArray());

      const body = await response.text();
      console.log('Response body:', body);

      expect(response.ok()).toBeTruthy();

      const json = JSON.parse(body);
      expect(json.status).toBe('ok');
      console.log('✅ Health check passed');
    } catch (error) {
      console.error('❌ Health check failed:', error);
      throw error;
    }
  });

  test('comments API should respond', async ({ request }) => {
    try {
      const testMarket = '0x31d2BC49A6FD4a066F5f8AC61Acd0E6c9105DD84';
      const response = await request.get(`${BASE_URL}/api/comments/${testMarket}`, {
        timeout: 30000,
      });

      console.log('Comments API status:', response.status());

      const body = await response.text();
      console.log('Comments API body:', body.substring(0, 200));

      expect(response.ok()).toBeTruthy();
      console.log('✅ Comments API responded');
    } catch (error) {
      console.error('❌ Comments API failed:', error);
      throw error;
    }
  });
});
