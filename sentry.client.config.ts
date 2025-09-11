import * as Sentry from '@sentry/nextjs'

const dsn = process.env.SENTRY_DSN
const enabled = process.env.NODE_ENV === 'production' && !!dsn && process.env.SENTRY_ENABLED !== 'false'

function sanitizeEvent(event: Sentry.Event): Sentry.Event | null {
  if (event.request && (event.request as any).headers) {
    const input = (event.request as any).headers as Record<string, string>
    const out: Record<string, string> = {}
    for (const k of Object.keys(input)) {
      const key = k.toLowerCase()
      if (key === 'authorization' || key === 'cookie' || key === 'set-cookie' || key.includes('apikey') || key.includes('supabase')) {
        continue
      }
      out[key] = input[k]
    }
    ;(event.request as any).headers = out
  }
  if (event.user) {
    delete (event.user as any).email
    delete (event.user as any).ip_address
  }
  return event
}

Sentry.init({
  dsn,
  enabled,
  environment: process.env.NEXT_PUBLIC_APP_ENV || process.env.NODE_ENV,
  tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),
  profilesSampleRate: Number(process.env.SENTRY_PROFILES_SAMPLE_RATE ?? '0'),
  beforeSend: sanitizeEvent,
  sendDefaultPii: false,
})
