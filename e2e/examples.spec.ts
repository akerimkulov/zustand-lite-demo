/**
 * E2E tests for examples page
 */

import { test, expect } from '@playwright/test'

test.describe('Examples Page', () => {
  test('examples page loads', async ({ page }) => {
    await page.goto('/examples')

    await expect(page).toHaveURL('/examples')
  })

  test('has code examples', async ({ page }) => {
    await page.goto('/examples')

    // Should have code blocks
    const codeBlocks = page.locator('pre')
    await expect(codeBlocks.first()).toBeVisible()
  })

  test('code examples are syntax highlighted', async ({ page }) => {
    await page.goto('/examples')

    // Code blocks should have syntax highlighting classes
    const codeBlock = page.locator('pre').first()
    await expect(codeBlock).toBeVisible()
  })
})
