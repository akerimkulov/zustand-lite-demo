/**
 * E2E tests for navigation
 */

import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('home page loads correctly', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('zustand-lite').first()).toBeVisible()
  })

  test('navigates to demo page', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Демо' }).first().click()
    await expect(page).toHaveURL('/demo')
  })

  test('navigates to docs page', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Документация' }).first().click()
    await expect(page).toHaveURL('/docs')
  })

  test('navigates to examples page', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Примеры' }).first().click()
    await expect(page).toHaveURL('/examples')
  })
})
