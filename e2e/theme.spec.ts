/**
 * E2E tests for theme toggle functionality
 */

import { test, expect } from '@playwright/test'

test.describe('Theme Toggle', () => {
  test('theme toggle button is visible', async ({ page }) => {
    await page.goto('/')

    const themeButton = page.getByRole('button', { name: /Переключить тему/i })
    await expect(themeButton).toBeVisible()
  })

  test('theme toggle button is clickable', async ({ page }) => {
    await page.goto('/')

    const themeButton = page.getByRole('button', { name: /Переключить тему/i })
    await expect(themeButton).toBeVisible()
    await expect(themeButton).toBeEnabled()
  })
})
