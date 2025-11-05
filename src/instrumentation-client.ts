// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'
import { parseEnvFloat, parseEnvBoolean } from '@/lib/sentry-env-helpers'
import { createClient } from '@/lib/supabase'

// Lazy-load Supabase client for Sentry integration
// This ensures the client is only created when Sentry initializes,
// reducing unnecessary connections and allowing proper error handling
let supabaseClient: ReturnType<typeof createClient> | null = null

const getSupabaseClient = () => {
  if (!supabaseClient) {
    try {
      supabaseClient = createClient()
    } catch (error) {
      // Capture error with Sentry instead of console
      if (typeof window !== 'undefined') {
        Sentry.captureException(error, {
          tags: { context: 'supabase-client-initialization' }
        })
      }
      // Return null to prevent Sentry initialization failure
      // Sentry will still work, just without Supabase integration
      return null
    }
  }
  return supabaseClient
}

// Base integrations for all environments
const baseIntegrations = [
  Sentry.replayIntegration(),
  Sentry.captureConsoleIntegration(),
  // Only add Supabase integration if client was successfully created
  ...(getSupabaseClient()
    ? [Sentry.supabaseIntegration({ supabaseClient: getSupabaseClient()! })]
    : [])
]

// Development-only integrations
const devIntegrations =
  process.env.NODE_ENV !== 'production'
    ? [
        Sentry.consoleLoggingIntegration({ levels: ['log', 'warn', 'error'] }),
        Sentry.spotlightBrowserIntegration(),
        Sentry.browserTracingIntegration()
      ]
    : []

// Set static device context globally for all Sentry events
if (typeof window !== 'undefined' && 'navigator' in window) {
  Sentry.setContext('device', {
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ),
    isChrome: /Chrome/i.test(navigator.userAgent),
    userAgent: navigator.userAgent
  })
}

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Merge base integrations with development-specific integrations
  integrations: [...baseIntegrations, ...devIntegrations],

  // Define how likely traces are sampled. Read from environment with safe production defaults.
  // Use NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE env var or fallback to 0.1 in production, 1.0 in development
  tracesSampleRate: parseEnvFloat(
    'NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE',
    process.env.NODE_ENV === 'production' ? 0.1 : 1.0
  ),

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Define how likely Replay events are sampled.
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: parseEnvFloat('NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE', 0.1),

  // Define how likely Replay events are sampled when an error occurs.
  replaysOnErrorSampleRate: parseEnvFloat('NEXT_PUBLIC_SENTRY_REPLAYS_ERROR_SAMPLE_RATE', 1.0),

  // Enable sending user PII (Personally Identifiable Information) only with explicit consent
  // Use NEXT_PUBLIC_SENTRY_SEND_DEFAULT_PII env var or default to false in production
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: parseEnvBoolean(
    'NEXT_PUBLIC_SENTRY_SEND_DEFAULT_PII',
    process.env.NODE_ENV !== 'production'
  ),

  // Development-specific configuration
  ...(process.env.NODE_ENV !== 'production'
    ? {
        spotlight: true, // Enable Spotlight
        sampleRate: 1.0, // Capture all errors in dev
        tracesSampleRate: 1.0, // Capture all traces in dev
        enableLogs: true
      }
    : {})
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
