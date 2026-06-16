import { vi } from 'vitest'

// The extracted auth operations read `window.location.origin` to build redirect
// URLs. The test suite runs in the default `node` environment (jsdom is
// unavailable due to a broken transitive dependency), so provide a stable,
// minimal `window`/`location` for any code path under test that needs it.
if (typeof globalThis.window === 'undefined') {
  const ORIGIN = 'http://localhost:3000'
  vi.stubGlobal('window', { location: { origin: ORIGIN } })
  vi.stubGlobal('location', { origin: ORIGIN })
}
