import { test, expect } from '@playwright/test'

// Simulate logged-out supabase by intercepting auth endpoints
const supabaseAuthMatcher = '**/auth/**'

test('unauthenticated users are redirected from /dashboard to home', async ({ page }) => {
  await page.route(supabaseAuthMatcher, async (route) => {
    // Return a minimal OK response; the SDK will treat missing tokens as logged-out
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) })
  })

  await page.goto('/dashboard')
  await page.waitForURL('**/')
  await expect(page.getByRole('button', { name: /Start using/i })).toBeVisible()
})
