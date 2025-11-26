/**
 * E2E tests for documentation pages
 */

import { test, expect } from '@playwright/test'

test.describe('Documentation', () => {
  test('docs home page loads', async ({ page }) => {
    await page.goto('/docs')
    await expect(page).toHaveURL('/docs')
  })

  test('installation page loads', async ({ page }) => {
    await page.goto('/docs/installation')
    await expect(page).toHaveURL('/docs/installation')
  })

  test('quick start page loads', async ({ page }) => {
    await page.goto('/docs/quick-start')
    await expect(page).toHaveURL('/docs/quick-start')
  })

  test('API docs load', async ({ page }) => {
    await page.goto('/docs/api')
    await expect(page).toHaveURL('/docs/api')
  })

  test('middleware docs load', async ({ page }) => {
    await page.goto('/docs/middleware')
    await expect(page).toHaveURL('/docs/middleware')
  })

  test('persist middleware docs load', async ({ page }) => {
    await page.goto('/docs/middleware/persist')
    await expect(page).toHaveURL('/docs/middleware/persist')
  })

  test('SSR docs load', async ({ page }) => {
    await page.goto('/docs/ssr')
    await expect(page).toHaveURL('/docs/ssr')
  })

  test('testing docs load', async ({ page }) => {
    await page.goto('/docs/testing')
    await expect(page).toHaveURL('/docs/testing')
  })
})
