/**
 * E2E tests for State Inspector component
 */

import { test, expect } from '@playwright/test'

test.describe('State Inspector', () => {
  test('state inspector heading is visible on demo page', async ({ page }) => {
    await page.goto('/demo')

    await expect(page.getByRole('heading', { name: /Инспектор состояния/i })).toBeVisible()
  })

  test('demo page has product cards', async ({ page }) => {
    await page.goto('/demo')

    // Should have add buttons (one per product)
    const addButtons = page.getByRole('button', { name: /Добавить/i })
    await expect(addButtons.first()).toBeVisible()
  })
})
