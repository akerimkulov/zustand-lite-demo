/**
 * E2E tests for state persistence (localStorage)
 */

import { test, expect } from '@playwright/test'

test.describe('State Persistence', () => {
  test('page loads after clearing localStorage', async ({ page }) => {
    await page.goto('/demo')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Page should still load correctly
    await expect(page.getByRole('heading', { name: 'Товары' })).toBeVisible()
  })

  test('localStorage is accessible', async ({ page }) => {
    await page.goto('/demo')

    // Check that we can access localStorage
    const hasLocalStorage = await page.evaluate(() => {
      try {
        localStorage.setItem('test', 'value')
        const result = localStorage.getItem('test') === 'value'
        localStorage.removeItem('test')
        return result
      } catch {
        return false
      }
    })

    expect(hasLocalStorage).toBe(true)
  })
})
