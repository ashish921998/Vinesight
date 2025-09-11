import { setupServer } from 'msw/node'

// Define default handlers here or override per-test using server.use(...)
export const server = setupServer()
