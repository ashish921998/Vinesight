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

export async function GET(req: NextRequest) {
  const requestId = req.headers.get(REQUEST_ID_HEADER) || undefined
  const log = createLogger(requestId)
  log.info('ready_start', { path: '/api/ready' })

  const requiredEnv = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'] as const
  const missingEnv = requiredEnv.filter((k) => !process.env[k])

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabase = supabaseUrl
    ? await check(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/`, { method: 'HEAD' }, 2000)
    : { ok: false, error: 'missing_supabase_url' }

  const ok = missingEnv.length === 0 && supabase.ok

  const body = {
    status: ok ? 'ready' : 'not_ready',
    version: (pkg as any).version as string,
    environment: process.env.NEXT_PUBLIC_APP_ENV || process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    checks: {
      env: { ok: missingEnv.length === 0, missing: missingEnv },
      supabase,
    },
  }

  const status = ok ? 200 : 503
  const res = NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
  res.headers.set(REQUEST_ID_HEADER, requestId || '')
  log.info('ready_finish', { status })
  return res
}
