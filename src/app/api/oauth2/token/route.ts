/**
 * POST /api/oauth2/token — the token endpoint. Dispatches on `grant_type`:
 *  - urn:ietf:params:oauth:grant-type:jwt-bearer (RFC 7523): exchange an identity_assertion
 *    for a short-lived access_token. Re-exchange to refresh; no refresh_token is issued.
 *  - urn:workos:agent-auth:grant-type:claim: poll while a user-claimed registration is being
 *    confirmed; returns authorization_pending until claimed, then an access_token + assertion.
 *
 * Form-encoded request body (application/x-www-form-urlencoded).
 */

import { NextRequest } from 'next/server'
import { mintIdentityAssertion, verifyIdentityAssertion } from '@/lib/agent-auth/assertion'
import {
  ACCESS_TOKEN_TTL_SEC,
  GRANT_TYPES,
  POST_CLAIM_SCOPES,
  PRE_CLAIM_SCOPES,
  getBaseUrl
} from '@/lib/agent-auth/config'
import {
  checkRateLimit,
  getClientIp,
  jsonNoStore,
  oauthError,
  readFormBody
} from '@/lib/agent-auth/responses'
import { randomSecret, sha256Hex } from '@/lib/agent-auth/tokens'
import {
  createAccessToken,
  getRegistrationByClaimTokenHash,
  getRegistrationById,
  inSeconds,
  isRegistrationExpired,
  recordEvent,
  revokePreClaimTokens
} from '@/lib/agent-auth/store'

export const dynamic = 'force-dynamic'

async function issueAccessToken(opts: {
  registrationId: string
  userId: string | null
  scopes: string[]
  clientIp: string
}): Promise<{ access_token: string; token_type: 'Bearer'; expires_in: number; scope: string }> {
  const accessToken = randomSecret('vsat')
  await createAccessToken({
    registrationId: opts.registrationId,
    userId: opts.userId,
    tokenHash: sha256Hex(accessToken),
    scopes: opts.scopes,
    expiresAt: inSeconds(ACCESS_TOKEN_TTL_SEC),
    clientIp: opts.clientIp
  })
  await recordEvent('token.issued', {
    registrationId: opts.registrationId,
    userId: opts.userId,
    metadata: { scope: opts.scopes.join(' ') }
  })
  return {
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: ACCESS_TOKEN_TTL_SEC,
    scope: opts.scopes.join(' ')
  }
}

export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request, 'oauth-token')
  if (limited) return limited

  const ip = getClientIp(request)
  const params = await readFormBody(request)
  const grantType = params.get('grant_type')
  const base = getBaseUrl(request)

  try {
    // --- Claim grant (poll while the user completes the ceremony) ---
    if (grantType === GRANT_TYPES.claim) {
      const claimToken = params.get('claim_token')
      if (!claimToken) {
        return oauthError('invalid_request', { description: 'claim_token is required' })
      }

      const registration = await getRegistrationByClaimTokenHash(sha256Hex(claimToken))
      if (!registration) return oauthError('expired_token', { description: 'Unknown claim token' })
      if (registration.status === 'revoked') {
        return oauthError('invalid_grant', { description: 'Registration revoked' })
      }
      if (registration.status !== 'claimed') {
        if (isRegistrationExpired(registration)) {
          return oauthError('expired_token', { description: 'Claim window expired' })
        }
        return oauthError('authorization_pending', {
          description: 'The user has not yet confirmed the claim'
        })
      }

      // A claimed registration is still bounded by its assertion outer bound — the long-lived
      // claim_token must not keep minting credentials past it.
      if (isRegistrationExpired(registration)) {
        return oauthError('invalid_grant', { description: 'Registration is no longer valid' })
      }

      // Claimed: drop any pre-claim tokens, then mint the post-claim token + fresh assertion.
      await revokePreClaimTokens(registration.id)
      const token = await issueAccessToken({
        registrationId: registration.id,
        userId: registration.claimed_by_user_id,
        scopes: POST_CLAIM_SCOPES,
        clientIp: ip
      })
      const { assertion, expiresAt } = mintIdentityAssertion(base, registration.id)
      return jsonNoStore({ ...token, identity_assertion: assertion, assertion_expires: expiresAt })
    }

    // --- JWT-bearer grant (exchange/refresh an identity_assertion) ---
    if (grantType === GRANT_TYPES.jwtBearer) {
      const assertion = params.get('assertion')
      if (!assertion) return oauthError('invalid_request', { description: 'assertion is required' })

      let registrationId: string
      try {
        ;({ registrationId } = verifyIdentityAssertion(assertion, base))
      } catch {
        return oauthError('invalid_grant', { description: 'Invalid or expired assertion' })
      }

      const registration = await getRegistrationById(registrationId)
      if (
        !registration ||
        registration.status === 'revoked' ||
        isRegistrationExpired(registration)
      ) {
        return oauthError('invalid_grant', { description: 'Registration is no longer valid' })
      }

      // Claimed registrations act on behalf of their user with full scopes; an unclaimed
      // anonymous registration gets only its pre-claim scopes (and no bound user).
      const claimed = registration.status === 'claimed'
      const token = await issueAccessToken({
        registrationId: registration.id,
        userId: claimed ? registration.claimed_by_user_id : null,
        scopes: claimed ? POST_CLAIM_SCOPES : PRE_CLAIM_SCOPES,
        clientIp: ip
      })
      return jsonNoStore(token)
    }

    return oauthError('unsupported_grant_type', { description: 'Unsupported grant_type' })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[oauth2/token] error', error)
    }
    return oauthError('server_error', { description: 'Token request failed', status: 500 })
  }
}
