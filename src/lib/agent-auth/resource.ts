/**
 * Resource-server authentication for VineSight API routes. Lets a route accept EITHER a
 * normal browser cookie session OR an agent-issued bearer access_token, returning the
 * resolved user id plus a Supabase client to query with.
 *
 *   const auth = await authenticateResourceRequest(request, 'farms.read')
 *   if (!auth.ok) return auth.response
 *   const { data } = await auth.db.from('farms').select('*').eq('user_id', auth.userId)
 *
 * Cookie sessions get the RLS-scoped server client (unchanged behavior); agent tokens get
 * the service-role client, so callers MUST filter agent queries by `auth.userId` explicitly.
 * On failure it returns a ready 401/403 carrying a WWW-Authenticate challenge that points
 * agents at the Protected Resource Metadata for discovery.
 */

import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/auth-utils'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getBaseUrl, prmUrl } from './config'
import { getAccessTokenByHash } from './store'
import { sha256Hex } from './tokens'

export type ResourceAuth =
  | { ok: true; userId: string; scopes: string[]; viaAgent: boolean; db: SupabaseClient }
  | { ok: false; response: NextResponse }

function bearerChallenge(
  base: string,
  opts: { error?: string; description?: string; scope?: string } = {}
): string {
  const parts: string[] = []
  if (opts.error) parts.push(`error="${opts.error}"`)
  if (opts.description) parts.push(`error_description="${opts.description}"`)
  if (opts.scope) parts.push(`scope="${opts.scope}"`)
  parts.push(`resource_metadata="${prmUrl(base)}"`)
  return `Bearer ${parts.join(', ')}`
}

function challengeResponse(
  status: number,
  body: Record<string, unknown>,
  base: string,
  challenge: { error?: string; description?: string; scope?: string }
): { ok: false; response: NextResponse } {
  return {
    ok: false,
    response: NextResponse.json(body, {
      status,
      headers: {
        'WWW-Authenticate': bearerChallenge(base, challenge),
        'Cache-Control': 'no-store'
      }
    })
  }
}

export async function authenticateResourceRequest(
  request: Request,
  requiredScope: string
): Promise<ResourceAuth> {
  const base = getBaseUrl(request)
  const authorization = request.headers.get('authorization') || ''

  // --- Agent bearer token path ---
  if (authorization.toLowerCase().startsWith('bearer ')) {
    const token = authorization.slice(7).trim()
    const row = token ? await getAccessTokenByHash(sha256Hex(token)) : null

    const invalidToken = (description: string) =>
      challengeResponse(401, { error: 'invalid_token', error_description: description }, base, {
        error: 'invalid_token',
        description
      })

    if (!row) return invalidToken('The access token is invalid')
    if (row.revoked_at) return invalidToken('The access token has been revoked')
    if (new Date(row.expires_at).getTime() <= Date.now()) {
      return invalidToken('The access token has expired')
    }
    if (!row.user_id) {
      return challengeResponse(
        403,
        {
          error: 'insufficient_scope',
          error_description: 'This token is not yet bound to a user (unclaimed registration)'
        },
        base,
        { error: 'insufficient_scope', scope: requiredScope }
      )
    }
    if (!row.scopes.includes(requiredScope)) {
      return challengeResponse(
        403,
        {
          error: 'insufficient_scope',
          error_description: `Missing required scope: ${requiredScope}`
        },
        base,
        { error: 'insufficient_scope', scope: requiredScope }
      )
    }

    return {
      ok: true,
      userId: row.user_id,
      scopes: row.scopes,
      viaAgent: true,
      db: getSupabaseAdmin() as unknown as SupabaseClient
    }
  }

  // --- Browser cookie session path (unchanged behavior for existing clients) ---
  const supabase = await createServerSupabaseClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (user) {
    return {
      ok: true,
      userId: user.id,
      scopes: ['*'],
      viaAgent: false,
      db: supabase as unknown as SupabaseClient
    }
  }

  // Neither credential — 401 with a discovery pointer for agents (browsers ignore it).
  return challengeResponse(401, { error: 'Authentication required' }, base, {})
}
