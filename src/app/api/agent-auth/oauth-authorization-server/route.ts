/**
 * Authorization Server Metadata (RFC 8414) with the auth.md `agent_auth` profile block.
 * Served at /.well-known/oauth-authorization-server via a next.config rewrite.
 *
 * VineSight implements the user-claimed flow only, so `identity_types_supported` advertises
 * just `anonymous` and `service_auth` — no agent-verified ID-JAG type, and no events
 * endpoint (provider-pushed revocation belongs to the verified flow).
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  GRANT_TYPES,
  IDENTITY_TYPES_SUPPORTED,
  SCOPES_SUPPORTED,
  asMetadataUrl,
  authMdUrl,
  claimEndpoint,
  getBaseUrl,
  identityEndpoint,
  issuerFor,
  resourceFor,
  revocationEndpoint,
  tokenEndpoint
} from '@/lib/agent-auth/config'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const base = getBaseUrl(request)
  return NextResponse.json(
    {
      resource: resourceFor(base),
      authorization_servers: [issuerFor(base)],
      scopes_supported: [...SCOPES_SUPPORTED],
      bearer_methods_supported: ['header'],

      issuer: issuerFor(base),
      token_endpoint: tokenEndpoint(base),
      revocation_endpoint: revocationEndpoint(base),
      grant_types_supported: [GRANT_TYPES.jwtBearer, GRANT_TYPES.claim],
      service_documentation: asMetadataUrl(base),

      agent_auth: {
        skill: authMdUrl(base),
        identity_endpoint: identityEndpoint(base),
        claim_endpoint: claimEndpoint(base),
        identity_types_supported: [...IDENTITY_TYPES_SUPPORTED]
      }
    },
    { headers: { 'Cache-Control': 'public, max-age=300' } }
  )
}
