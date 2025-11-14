/**
 * KEKTECH 3.0 - Basic App Loading E2E Test
 *
 * Tests that the application loads and key UI elements are present
 */
import { test, expect } from '@playwright/test'

test.describe('App Loading', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/')

    // Check that the page loaded
    await expect(page).toHaveTitle(/KEKTECH/i)

    // Wait for React to hydrate
    await page.waitForLoadState('networkidle')

    // Verify no error messages
    const errorMessages = page.locator('text=/error/i')
    await expect(errorMessages).toHaveCount(0)
  })

  test('should display wallet connect button', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Look for RainbowKit connect button (it uses data-testid or specific text)
    const connectButton = page.getByRole('button', { name: /connect/i })
    await expect(connectButton).toBeVisible()
  })

  test('should have navigation elements', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Check for header/navigation
    const navigation = page.locator('nav, header')
    await expect(navigation.first()).toBeVisible()
  })

  test('should not have console errors', async ({ page }) => {
    const consoleErrors: string[] = []

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Filter out known/acceptable errors (like wallet extension not installed warnings)
    const realErrors = consoleErrors.filter(error =>
      !error.includes('MetaMask') &&
      !error.includes('wallet') &&
      !error.includes('Extension')
    )

    expect(realErrors).toHaveLength(0)
  })

  test('should load engagement components on market page', async ({ page }) => {
    const TEST_MARKET = '0x31d2BC49A6FD4a066F5f8AC61Acd0E6c9105DD84'

    await page.goto(`/market/${TEST_MARKET}`)
    await page.waitForLoadState('networkidle')

    // Should show market info
    const marketInfo = page.locator('text=/market/i')
    await expect(marketInfo.first()).toBeVisible()
  })
})
