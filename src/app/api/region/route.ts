import { NextResponse, NextRequest } from 'next/server'

export const runtime = 'edge'

/**
 * Normalize and validate a country code to a two-letter uppercase code.
 *
 * @param code - Value to normalize into a two-letter country code; non-string inputs will be coerced to string
 * @returns The two-letter uppercase country code if `code` can be normalized to exactly two A–Z characters, `null` otherwise
 */
function normalizeCountry(code: unknown): string | null {
  const c = (code || '').toString().trim().toUpperCase()
  return /^[A-Z]{2}$/.test(c) ? c : null
}

/**
 * Determine the client's two-letter region code from the incoming request.
 *
 * Inspects `req.geo.country` (Edge geo) and falls back to the headers
 * `x-vercel-ip-country`, `cf-ipcountry`, and `x-geo-country`, normalizing the
 * result to an uppercase two-letter country code when valid.
 *
 * @param req - The incoming NextRequest to inspect for geo information and headers
 * @returns An object `{ region: string | null }` where `region` is a two-letter
 *          uppercase country code if determinable, or `null` otherwise.
 */
export async function GET(req: NextRequest) {
  try {
    // Prefer NextRequest.geo when available (Edge runtime)
    let country = normalizeCountry((req as any)?.geo?.country)

    // Fallback to common provider headers
    if (!country) {
      const h = req.headers
      country =
        normalizeCountry(h.get('x-vercel-ip-country')) ||
        normalizeCountry(h.get('cf-ipcountry')) ||
        normalizeCountry(h.get('x-geo-country')) ||
        null
    }

    return NextResponse.json({ region: country }, { status: 200 })
  } catch (e) {
    return NextResponse.json({ region: null }, { status: 200 })
  }
}