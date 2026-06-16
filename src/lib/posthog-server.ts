import { PostHog } from 'posthog-node'

// Server-side PostHog singleton for capturing exceptions (and events) from
// Next.js server code — the onRequestError instrumentation hook, server
// actions, and API route catch blocks. flushAt/flushInterval are tuned for
// short-lived serverless invocations so events aren't lost between requests.
let posthogInstance: PostHog | null = null

export function getPostHogServer(): PostHog | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
  if (!key) {
    // No key configured (e.g. local without analytics) — degrade gracefully.
    return null
  }

  if (!posthogInstance) {
    posthogInstance = new PostHog(key, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
      flushAt: 1,
      flushInterval: 0
    })
  }

  return posthogInstance
}
