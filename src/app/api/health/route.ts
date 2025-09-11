import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createLogger } from '@/lib/logger'
import { REQUEST_ID_HEADER } from '@/lib/request-context'
import pkg from '../../../../package.json'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function check(url: string, init: RequestInit, timeoutMs: number) {
  const start = Date.now()
  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...init, signal: ac.signal, cache: 'no-store' })
    const elapsedMs = Date.now() - start
    return { ok: res.status < 500, status: res.status, elapsedMs }
  } catch (e) {
    const elapsedMs = Date.now() - start
    return { ok: false, error: (e as Error).message, elapsedMs }
  } finally {
    clearTimeout(t)
  }
}

import { withSentryRoute } from '@/lib/with-monitoring'

export const GET = withSentryRoute(async function GET(req: NextRequest) {
  const requestId = req.headers.get(REQUEST_ID_HEADER) || undefined
  const log = createLogger(requestId)
  const ts = new Date().toISOString()
  log.info('health_start', { path: '/api/health' })

  const env = process.env.NEXT_PUBLIC_APP_ENV || process.env.NODE_ENV
  const version = (pkg as any).version as string

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabase = supabaseUrl
    ? await check(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/`, { method: 'HEAD' }, 2000)
    : { ok: false, error: 'missing_supabase_url' }

  const external = await check(
    'https://api.open-meteo.com/v1/forecast?latitude=0&longitude=0&hourly=temperature_2m&forecast_days=1',
    { method: 'GET' },
    2000
  )

  const body = {
    status: supabase.ok && external.ok ? 'ok' : 'degraded',
    version,
    environment: env,
    timestamp: ts,
    checks: {
      supabase,
      external,
    },
  }

  const res = NextResponse.json(body, { status: 200, headers: { 'Cache-Control': 'no-store' } })
  res.headers.set(REQUEST_ID_HEADER, requestId || '')
  log.info('health_finish', { status: body.status })
  return res
})
