// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

// Helper function to safely parse environment variables
const parseEnvFloat = (key: string, defaultValue: number): number => {
  const value = process.env[key]
  if (value === undefined) return defaultValue
  const parsed = parseFloat(value)
  return isNaN(parsed) ? defaultValue : parsed
}

const parseEnvBoolean = (key: string, defaultValue: boolean): boolean => {
  const value = process.env[key]
  if (value === undefined) return defaultValue
  return value.toLowerCase() === 'true'
}

Sentry.init({
  dsn: process.env.SENTRY_DSN,

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
