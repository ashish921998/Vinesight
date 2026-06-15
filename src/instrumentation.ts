import * as Sentry from '@sentry/nextjs'
import type { Instrumentation } from 'next'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config')
  }
}

// Pull the PostHog distinct_id out of the ph_..._posthog cookie so a server-side
// exception is attributed to the same person as their client-side events.
function distinctIdFromCookie(cookie: string | string[] | undefined): string | undefined {
  if (!cookie) return undefined
  const cookieString = Array.isArray(cookie) ? cookie.join('; ') : cookie
  const match = cookieString.match(/ph_phc_.*?_posthog=([^;]+)/)
  if (!match?.[1]) return undefined
  try {
    const parsed = JSON.parse(decodeURIComponent(match[1]))
    return parsed.distinct_id as string | undefined
  } catch {
    return undefined
  }
}

// Capture server-side request errors in BOTH Sentry (existing) and PostHog Error
// Tracking. PostHog capture only runs in the Node runtime, where posthog-node works.
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const { getPostHogServer } = await import('./lib/posthog-server')
      const posthog = getPostHogServer()
      if (posthog) {
        const distinctId = distinctIdFromCookie(request.headers.cookie)
        await posthog.captureException(err, distinctId, {
          path: request.path,
          method: request.method,
          router_kind: context.routerKind,
          route_path: context.routePath,
          route_type: context.routeType
        })
      }
    } catch (captureError) {
      console.error('Failed to capture server exception in PostHog:', captureError)
    }
  }

  Sentry.captureRequestError(err, request, context)
}
