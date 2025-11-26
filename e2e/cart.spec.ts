/**
 * E2E tests for shopping cart functionality
 */

import { test, expect } from '@playwright/test'

test.describe('Shopping Cart', () => {
  test('displays products on demo page', async ({ page }) => {
    await page.goto('/demo')

    // Wait for products to load
    await expect(page.getByRole('heading', { name: 'Товары' })).toBeVisible()

    // Should have add buttons
    const addButtons = page.getByRole('button', { name: /Добавить/i })
    await expect(addButtons.first()).toBeVisible()
  })

  test('cart icon is visible in header', async ({ page }) => {
    await page.goto('/demo')

    const cartButton = page.getByRole('button', { name: /Открыть корзину/i })
    await expect(cartButton).toBeVisible()
  })

  test('add button is clickable', async ({ page }) => {
    await page.goto('/demo')

    const addButton = page.getByRole('button', { name: /Добавить/i }).first()
    await expect(addButton).toBeVisible()
    await expect(addButton).toBeEnabled()
  })
})
