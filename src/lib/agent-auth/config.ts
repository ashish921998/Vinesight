/**
 * Configuration + small helpers for the auth.md agent-registration implementation.
 *
 * VineSight runs the authorization server (AS) and resource server (RS) on a single
 * origin, so the issuer, the PRM `resource`, and the API base all derive from the same
 * request origin (overridable with AGENT_AUTH_BASE_URL for proxied/canonical hosts).
 */

// Scopes an agent token can be granted. Keep in sync with the wired resource routes
// (src/app/api/farms/route.ts, src/app/api/tasks/route.ts).
export const SCOPES_SUPPORTED = ['farms.read', 'tasks.read'] as const
export type AgentScope = (typeof SCOPES_SUPPORTED)[number]

// Anonymous registrations are usable before a user claims them, but with no data
// access until bound to a user. Everything meaningful is granted post-claim.
export const PRE_CLAIM_SCOPES: string[] = []
export const POST_CLAIM_SCOPES: string[] = [...SCOPES_SUPPORTED]

// Lifetimes (seconds).
export const ASSERTION_TTL_SEC = 30 * 24 * 60 * 60 // re-exchangeable identity_assertion
export const ACCESS_TOKEN_TTL_SEC = 60 * 60 // short-lived bearer access_token
export const CLAIM_TTL_SEC = 10 * 60 // user_code / verification window (RFC 8628)
export const REGISTRATION_UNCLAIMED_TTL_SEC = 7 * 24 * 60 * 60 // window to complete a claim

// Claim-poll hint and user_code lockout.
export const CLAIM_POLL_INTERVAL_SEC = 5
export const MAX_USER_CODE_ATTEMPTS = 5

// JWT typ for the service-signed identity assertion (aligns with the auth.md spec).
export const ASSERTION_JWT_TYP = 'oauth-id-jag+jwt'

export const GRANT_TYPES = {
  jwtBearer: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
  claim: 'urn:workos:agent-auth:grant-type:claim'
} as const

export const IDENTITY_TYPES_SUPPORTED = ['anonymous', 'service_auth'] as const

/**
 * The canonical public origin of this deployment, with no trailing slash.
 * Prefers an explicit env override, then standard proxy headers, then the request URL.
 */
export function getBaseUrl(request: Request): string {
  const override = process.env.AGENT_AUTH_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL
  if (override) return override.replace(/\/+$/, '')

  // No canonical origin configured: derive from proxy headers. The issuer/audience of signed
  // assertions and every discovery URL come from here, so an attacker-set Host could poison
  // them. If AGENT_AUTH_ALLOWED_HOSTS is set we only honor a Host on that list (falling back to
  // the first allowed host for anything unrecognized). Set AGENT_AUTH_BASE_URL — or the
  // allow-list — in production.
  const headers = request.headers
  const host = headers.get('x-forwarded-host') || headers.get('host') || ''
  const allowed = (process.env.AGENT_AUTH_ALLOWED_HOSTS || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)

  if (allowed.length > 0) {
    const canonical = host && allowed.includes(host) ? host : allowed[0]
    return `https://${canonical}`
  }
  if (host) {
    const proto =
      headers.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https')
    return `${proto}://${host}`
  }
  // Last resort: derive from the request URL itself.
  return new URL(request.url).origin
}

// Discovery + endpoint URLs, all derived from the base origin.
export const issuerFor = (base: string) => base
export const resourceFor = (base: string) => `${base}/`
export const prmUrl = (base: string) => `${base}/.well-known/oauth-protected-resource`
export const asMetadataUrl = (base: string) => `${base}/.well-known/oauth-authorization-server`
export const authMdUrl = (base: string) => `${base}/auth.md`
// Endpoint paths (CLAIM_PATH is also returned verbatim as the relative `claim_url`).
export const IDENTITY_PATH = '/api/agent/identity'
export const CLAIM_PATH = '/api/agent/identity/claim'
export const identityEndpoint = (base: string) => `${base}${IDENTITY_PATH}`
export const claimEndpoint = (base: string) => `${base}${CLAIM_PATH}`
export const tokenEndpoint = (base: string) => `${base}/api/oauth2/token`
export const revocationEndpoint = (base: string) => `${base}/api/oauth2/revoke`
// Human-facing claim page (the verification_uri points here, through sign-in if needed).
export const claimPagePath = (claimAttemptToken: string) =>
  `/agent/claim?claim_attempt_token=${encodeURIComponent(claimAttemptToken)}`
export const verificationUri = (base: string, claimAttemptToken: string) =>
  `${base}${claimPagePath(claimAttemptToken)}`

/**
 * The HMAC secret used to sign + verify the service identity_assertion (HS256).
 * Since this service is the only signer and verifier, a symmetric secret is sufficient
 * and avoids the JWKS machinery the agent-verified flow would require.
 */
export function getJwtSecret(): string {
  const secret = process.env.AGENT_AUTH_JWT_SECRET
  if (!secret || secret.length < 16) {
    throw new Error(
      'AGENT_AUTH_JWT_SECRET is not configured (set a random string of at least 16 characters)'
    )
  }
  return secret
}
