// The extracted auth operations read `window.location.origin` to build redirect
// URLs. The test suite runs in the default `node` environment (jsdom is
// unavailable due to a broken transitive dependency), so provide a stable,
// minimal `window`/`location` for any code path under test that needs it.
if (typeof globalThis.window === 'undefined') {
  const ORIGIN = 'http://localhost:3000'
  const win = { location: { origin: ORIGIN } } as unknown as Window & typeof globalThis
  globalThis.window = win
  globalThis.location = win.location as unknown as Location
}
