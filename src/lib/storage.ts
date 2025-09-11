import { z, ZodTypeAny } from 'zod'

export type StorageBackendType = 'memory' | 'local' | 'none'

interface StoredPayload<T> {
  v: T
  e?: number | null
}

interface Backend {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
  keys(): string[]
  clear(): void
}

class MemoryBackend implements Backend {
  private store = new Map<string, string>()
  getItem(key: string) { return this.store.get(key) ?? null }
  setItem(key: string, value: string) { this.store.set(key, value) }
  removeItem(key: string) { this.store.delete(key) }
  keys() { return Array.from(this.store.keys()) }
  clear() { this.store.clear() }
}

class LocalBackend implements Backend {
  getItem(key: string) { try { return typeof window === 'undefined' ? null : window.localStorage.getItem(key) } catch { return null } }
  setItem(key: string, value: string) { try { if (typeof window !== 'undefined') window.localStorage.setItem(key, value) } catch {} }
  removeItem(key: string) { try { if (typeof window !== 'undefined') window.localStorage.removeItem(key) } catch {} }
  keys() { try { if (typeof window === 'undefined') return []; return Object.keys(window.localStorage) } catch { return [] } }
  clear() { try { if (typeof window !== 'undefined') window.localStorage.clear() } catch {} }
}

function isLocalAllowed(): boolean {
  const policy = process.env.NEXT_PUBLIC_STORAGE_POLICY?.toLowerCase()
  if (policy === 'memory_only' || policy === 'no_local') return false
  return true
}

function now() { return Date.now() }

export interface NamespacedStorage {
  get<T>(key: string, schema?: z.ZodType<T>): T | null
  set<T>(key: string, value: T, opts?: { ttlMs?: number; schema?: z.ZodType<T> }): void
  remove(key: string): void
  clear(): void
  keys(): string[]
}

export function createNamespacedStorage(namespace: string, backend: StorageBackendType = 'memory'): NamespacedStorage {
  const effectiveBackend: StorageBackendType = backend === 'local' && !isLocalAllowed() ? 'memory' : backend
  const impl: Backend = effectiveBackend === 'local' ? new LocalBackend() : effectiveBackend === 'memory' ? new MemoryBackend() : new MemoryBackend()
  const prefix = `vs:${namespace}::`

  function fullKey(key: string) { return `${prefix}${key}` }

  return {
    get<T>(key, schema) {
      const raw = impl.getItem(fullKey(key))
      if (!raw) return null
      try {
        const payload = JSON.parse(raw) as StoredPayload<unknown>
        if (payload && typeof payload === 'object' && 'e' in payload) {
          const exp = (payload as StoredPayload<unknown>).e
          if (exp && now() > exp) {
            impl.removeItem(fullKey(key))
            return null
          }
        }
        const value = (payload as StoredPayload<unknown>).v as T
        if (schema) {
          const parsed = (schema as unknown as ZodTypeAny).safeParse(value)
          return parsed.success ? (parsed.data as T) : null
        }
        return value
      } catch {
        return null
      }
    },
    set<T>(key, value, opts) {
      try {
        const ttlMs = opts?.ttlMs
        const schema = opts?.schema as unknown as ZodTypeAny | undefined
        if (schema) {
          const parsed = schema.safeParse(value)
          if (!parsed.success) return
        }
        const payload: StoredPayload<T> = { v: value, e: ttlMs ? now() + ttlMs : null }
        impl.setItem(fullKey(key), JSON.stringify(payload))
      } catch {}
    },
    remove(key) { impl.removeItem(fullKey(key)) },
    clear() {
      for (const k of impl.keys()) {
        if (k.startsWith(prefix)) impl.removeItem(k)
      }
    },
    keys() {
      return impl.keys().filter(k => k.startsWith(prefix)).map(k => k.replace(prefix, ''))
    }
  }
}

export const StorageBackends = {
  memory: 'memory' as const,
  local: 'local' as const,
  none: 'none' as const
}

export const storageNamespaces = {
  conversations: 'conversations',
  quota: 'quota',
  notifications: 'notifications',
  settings: 'settings',
  auth: 'auth'
} as const

export function clearAllAppStorage() {
  // Clear all known namespaces across both memory and local backends
  const backends: StorageBackendType[] = ['memory', 'local']
  const namespaces = Object.values(storageNamespaces)
  for (const b of backends) {
    const nsClear = (ns: string) => createNamespacedStorage(ns, b as StorageBackendType).clear()
    namespaces.forEach(nsClear)
  }
}
