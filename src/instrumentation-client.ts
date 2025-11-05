// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'
import { parseEnvFloat, parseEnvBoolean } from '@/lib/sentry-env-helpers'
import { createClient } from '@/lib/supabase'

const supabaseClient = createClient()

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Add optional integrations for additional features
  integrations: [
    Sentry.replayIntegration(),
    Sentry.captureConsoleIntegration(),
    Sentry.supabaseIntegration({ supabaseClient })
  ],

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
  ...(process.env.NODE_ENV !== 'production'
    ? {
        spotlight: true, // Enable Spotlight
        sampleRate: 1.0, // Capture all errors in dev
        tracesSampleRate: 1.0, // Capture all traces in dev
        enableLogs: true,
        integrations: [
          Sentry.consoleLoggingIntegration({ levels: ['log', 'warn', 'error'] }),
          // For frontend apps, add:
          Sentry.spotlightBrowserIntegration(),
          Sentry.browserTracingIntegration()
        ]
      }
    : {})
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
