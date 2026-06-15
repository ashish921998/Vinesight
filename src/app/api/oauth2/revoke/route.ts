/**
 * POST /api/oauth2/revoke — RFC 7009 token revocation. Invalidates a single access_token by
 * value. Idempotent; always returns 200 even for unknown tokens (per the RFC). The
 * identity_assertion is unaffected — a fresh access_token can still be minted from it.
 *
 * Form-encoded request body (application/x-www-form-urlencoded).
 */

import { NextRequest } from 'next/server'
import { checkRateLimit, readFormBody } from '@/lib/agent-auth/responses'
import { sha256Hex } from '@/lib/agent-auth/tokens'
import { getAccessTokenByHash, recordEvent, revokeAccessTokenByHash } from '@/lib/agent-auth/store'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request, 'oauth-revoke')
  if (limited) return limited

  const params = await readFormBody(request)
  const token = params.get('token')

  if (token) {
    try {
      const hash = sha256Hex(token)
      const existing = await getAccessTokenByHash(hash)
      await revokeAccessTokenByHash(hash)
      if (existing) {
        await recordEvent('token.revoked', {
          registrationId: existing.registration_id,
          userId: existing.user_id
        })
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[oauth2/revoke] error', error)
      }
      // RFC 7009: still respond 200 — the client cannot act on a revocation error.
    }
  }

  return new Response(null, { status: 200, headers: { 'Cache-Control': 'no-store' } })
}
