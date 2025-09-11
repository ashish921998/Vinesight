import * as Sentry from '@sentry/nextjs'
import type { NextRequest } from 'next/server'

export function withSentryRoute<T>(handler: (req: NextRequest) => Promise<Response> | Response) {
  return async function (req: NextRequest) {
    try {
      return await handler(req)
    } catch (err) {
      Sentry.captureException(err)
      throw err
    }
  }
}
