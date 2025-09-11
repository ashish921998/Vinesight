/** @jest-environment node */

import { GET } from './route'

describe('GET /api/health', () => {
  it('returns 200 and expected payload', async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toHaveProperty('status', 'ok')
    expect(typeof json.timestamp).toBe('number')
  })
})
