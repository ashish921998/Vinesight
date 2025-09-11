import '@testing-library/jest-dom'

const MSW_ENABLED = process.env.MSW === 'true'

if (MSW_ENABLED) {
  // Lazy import to avoid unnecessary dependency when not used
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { server } = require('./src/test/msw/server')
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())
} else {
  // Disable network by default in unit tests; enable via MSW when needed
  const g: any = globalThis as any
  if (typeof g.fetch === 'function') {
    // eslint-disable-next-line no-undef
    jest.spyOn(g, 'fetch').mockImplementation(async () => {
      throw new Error('Network is disabled in unit tests. Use MSW to mock requests.')
    })
  }
}
