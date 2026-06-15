/**
 * Shared request/response helpers for the agent-auth endpoints. OAuth/token responses must not
 * be cached, and errors follow the `{ error, error_description }` shape from the spec.
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SecurityService } from '@/lib/security-service'
import { globalRateLimiter } from '@/lib/validation'

export function jsonNoStore(
  body: unknown,
  init: { status?: number; headers?: Record<string, string> } = {}
): NextResponse {
  return NextResponse.json(body, {
    status: init.status ?? 200,
    headers: { 'Cache-Control': 'no-store', ...(init.headers ?? {}) }
  })
}

export function oauthError(
  error: string,
  opts: { description?: string; status?: number; headers?: Record<string, string> } = {}
): NextResponse {
  return jsonNoStore(
    { error, ...(opts.description ? { error_description: opts.description } : {}) },
    { status: opts.status ?? 400, headers: opts.headers }
  )
}

/** Best-effort client IP. Delegates to the shared SecurityService helper to avoid drift. */
export function getClientIp(request: Request): string {
  return SecurityService.getClientIP(request as unknown as NextRequest)
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
/** Loose email validation shared by the registration + claim endpoints. */
export function isEmail(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 254 && EMAIL_RE.test(value)
}

/** Enforce the in-process per-IP rate limit; returns a ready 429, or null when allowed. */
export function checkRateLimit(request: Request, key: string): NextResponse | null {
  const result = globalRateLimiter.checkLimit(`${key}-${getClientIp(request)}`)
  if (result.allowed) return null
  return oauthError('rate_limited', { description: result.reason, status: 429 })
}

/** Parse a JSON body, enforcing content-type. Returns a ready 400 response on failure. */
export async function readJsonBody(
  request: Request
): Promise<{ ok: true; body: any } | { ok: false; response: NextResponse }> {
  if (!(request.headers.get('content-type') || '').includes('application/json')) {
    return {
      ok: false,
      response: oauthError('invalid_request', { description: 'Expected application/json' })
    }
  }
  try {
    return { ok: true, body: await request.json() }
  } catch {
    return {
      ok: false,
      response: oauthError('invalid_request', { description: 'Invalid JSON payload' })
    }
  }
}

/** Parse an application/x-www-form-urlencoded body. */
export async function readFormBody(request: Request): Promise<URLSearchParams> {
  return new URLSearchParams(await request.text())
}
