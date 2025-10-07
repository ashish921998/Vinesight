import { NextResponse, NextRequest } from 'next/server'

export const runtime = 'edge'

function normalizeCountry(code: unknown): string | null {
  const c = (code || '').toString().trim().toUpperCase()
  return /^[A-Z]{2}$/.test(c) ? c : null
}

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
