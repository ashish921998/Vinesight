import { test, expect } from '@playwright/test'

test('GET /api/health returns ok', async ({ request, baseURL }) => {
  const res = await request.get(new URL('/api/health', baseURL!).toString())
  expect(res.ok()).toBeTruthy()
  const json = await res.json()
  expect(json.status).toBe('ok')
  expect(typeof json.timestamp).toBe('number')
})
