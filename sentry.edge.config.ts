// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'
import { parseEnvFloat, parseEnvBoolean } from '@/lib/sentry-env-helpers'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [Sentry.vercelAIIntegration()],
  // Define how likely traces are sampled. Read from environment with safe production defaults.
  // Use SENTRY_TRACES_SAMPLE_RATE env var or fallback to 0.1 in production, 1.0 in development
  tracesSampleRate: parseEnvFloat(
    'SENTRY_TRACES_SAMPLE_RATE',
    process.env.NODE_ENV === 'production' ? 0.1 : 1.0
  ),

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Enable sending user PII (Personally Identifiable Information) only with explicit consent
  // Use SENTRY_SEND_DEFAULT_PII env var or default to false in production
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: parseEnvBoolean('SENTRY_SEND_DEFAULT_PII', process.env.NODE_ENV !== 'production')
})
