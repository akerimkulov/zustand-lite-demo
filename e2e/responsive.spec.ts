/**
 * E2E tests for responsive design
 */

import { test, expect } from '@playwright/test'

test.describe('Responsive Design', () => {
  test('mobile menu button is visible on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE
    await page.goto('/')

    const mobileMenuButton = page.getByRole('button', { name: /Открыть меню/i })
    await expect(mobileMenuButton).toBeVisible()
  })

  test('theme and cart buttons visible on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    await expect(page.getByRole('button', { name: /Переключить тему/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Открыть корзину/i })).toBeVisible()
  })

  test('theme and cart buttons visible on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 })
    await page.goto('/')

    await expect(page.getByRole('button', { name: /Переключить тему/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Открыть корзину/i })).toBeVisible()
  })

  test('products page loads on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/demo')

    await expect(page.getByRole('heading', { name: 'Товары' })).toBeVisible()
  })
})
