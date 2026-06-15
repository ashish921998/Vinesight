/**
 * Protected Resource Metadata (RFC 9728). The authoritative description of this resource
 * server. Served at /.well-known/oauth-protected-resource via a next.config rewrite.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getBaseUrl, issuerFor, resourceFor, SCOPES_SUPPORTED } from '@/lib/agent-auth/config'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const base = getBaseUrl(request)
  return NextResponse.json(
    {
      resource: resourceFor(base),
      resource_name: 'VineSight',
      resource_logo_uri: `${base}/logo.png`,
      authorization_servers: [issuerFor(base)],
      scopes_supported: [...SCOPES_SUPPORTED],
      bearer_methods_supported: ['header']
    },
    { headers: { 'Cache-Control': 'public, max-age=300' } }
  )
}
