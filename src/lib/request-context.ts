import { NextRequest, NextResponse } from 'next/server'

export const REQUEST_ID_HEADER = 'x-request-id'

export function getRequestIdFromHeaders(headers: Headers): string | undefined {
  return headers.get(REQUEST_ID_HEADER) || headers.get('x-correlation-id') || undefined
}

export function ensureRequestId(req: NextRequest): { id: string; headers: Headers } {
  const existing = getRequestIdFromHeaders(req.headers)
  const id = existing || (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : Math.random().toString(36).slice(2))
  const headers = new Headers(req.headers)
  headers.set(REQUEST_ID_HEADER, id)
  return { id, headers }
}

export function attachRequestIdHeader(res: NextResponse, id: string): NextResponse {
  res.headers.set(REQUEST_ID_HEADER, id)
  return res
}
