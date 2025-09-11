import test from 'node:test'
import assert from 'node:assert/strict'
import { createNamespacedStorage, StorageBackends } from '@/lib/storage'
import { z } from 'zod'

const schema = z.object({ a: z.number(), b: z.string() })

test('namespaced storage set/get with schema', () => {
  const s = createNamespacedStorage('test', StorageBackends.memory)
  s.set('k', { a: 1, b: 'x' }, { schema })
  const v = s.get('k', schema)
  assert.equal(v?.a, 1)
  assert.equal(v?.b, 'x')
})

test('ttl expiration', async () => {
  const s = createNamespacedStorage('test2', StorageBackends.memory)
  s.set('k', { a: 1, b: 'x' }, { schema, ttlMs: 10 })
  const v1 = s.get('k', schema)
  assert.ok(v1)
  await new Promise(r => setTimeout(r, 15))
  const v2 = s.get('k', schema)
  assert.equal(v2, null)
})
