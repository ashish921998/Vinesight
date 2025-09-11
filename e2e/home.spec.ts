import { test, expect } from '@playwright/test'

test('home page renders core content', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Farm Management/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Start using/i })).toBeVisible()
})
