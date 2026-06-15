/**
 * POST /api/agent/identity — agent registration entrypoint for the user-claimed flow.
 * Dispatches on `type`: `anonymous` (immediate pre-claim assertion) or `service_auth`
 * (returns claim-ceremony material, withholds the assertion until the user claims it).
 */

import { NextRequest } from 'next/server'
import { mintIdentityAssertion } from '@/lib/agent-auth/assertion'
import {
  ASSERTION_TTL_SEC,
  CLAIM_PATH,
  CLAIM_POLL_INTERVAL_SEC,
  CLAIM_TTL_SEC,
  POST_CLAIM_SCOPES,
  PRE_CLAIM_SCOPES,
  REGISTRATION_UNCLAIMED_TTL_SEC,
  getBaseUrl,
  verificationUri
} from '@/lib/agent-auth/config'
import {
  checkRateLimit,
  getClientIp,
  isEmail,
  jsonNoStore,
  oauthError,
  readJsonBody
} from '@/lib/agent-auth/responses'
import { generateUserCode, randomSecret, sha256Hex } from '@/lib/agent-auth/tokens'
import {
  createClaimAttempt,
  createRegistration,
  inSeconds,
  recordEvent
} from '@/lib/agent-auth/store'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request, 'agent-identity')
  if (limited) return limited

  const parsed = await readJsonBody(request)
  if (!parsed.ok) return parsed.response
  const body = parsed.body

  const ip = getClientIp(request)
  const base = getBaseUrl(request)
  const agentLabel = (request.headers.get('user-agent') || '').slice(0, 255) || null

  try {
    if (body?.type === 'anonymous') {
      const claimToken = randomSecret('clm')
      const expiresAt = inSeconds(REGISTRATION_UNCLAIMED_TTL_SEC)
      const registration = await createRegistration({
        registrationType: 'anonymous',
        claimTokenHash: sha256Hex(claimToken),
        assertionExpiresAt: inSeconds(ASSERTION_TTL_SEC),
        expiresAt,
        agentLabel,
        clientIp: ip
      })

      const { assertion, expiresAt: assertionExpires } = mintIdentityAssertion(
        base,
        registration.id
      )
      await recordEvent('registration.created', {
        registrationId: registration.id,
        metadata: { registration_type: 'anonymous' }
      })
      await recordEvent('assertion.issued', { registrationId: registration.id })

      return jsonNoStore(
        {
          registration_id: registration.id,
          registration_type: 'anonymous',
          identity_assertion: assertion,
          assertion_expires: assertionExpires,
          pre_claim_scopes: PRE_CLAIM_SCOPES,
          claim_url: CLAIM_PATH,
          claim_token: claimToken,
          claim_token_expires: expiresAt,
          post_claim_scopes: POST_CLAIM_SCOPES
        },
        { status: 201 }
      )
    }

    if (body?.type === 'service_auth') {
      if (!isEmail(body?.login_hint)) {
        return oauthError('invalid_request', { description: 'login_hint must be a valid email' })
      }
      const email = (body.login_hint as string).toLowerCase()
      const claimToken = randomSecret('clm')
      const expiresAt = inSeconds(REGISTRATION_UNCLAIMED_TTL_SEC)
      const registration = await createRegistration({
        registrationType: 'service_auth',
        claimTokenHash: sha256Hex(claimToken),
        claimEmail: email,
        assertionExpiresAt: inSeconds(ASSERTION_TTL_SEC),
        expiresAt,
        agentLabel,
        clientIp: ip
      })

      const claimAttemptToken = randomSecret('cat')
      const userCode = generateUserCode()
      await createClaimAttempt({
        registrationId: registration.id,
        claimAttemptTokenHash: sha256Hex(claimAttemptToken),
        userCodeHash: sha256Hex(userCode),
        expiresAt: inSeconds(CLAIM_TTL_SEC),
        clientIp: ip
      })

      await recordEvent('registration.created', {
        registrationId: registration.id,
        metadata: { registration_type: 'service_auth' }
      })
      await recordEvent('user_code.minted', { registrationId: registration.id })

      return jsonNoStore(
        {
          registration_id: registration.id,
          registration_type: 'service_auth',
          claim_url: CLAIM_PATH,
          claim_token: claimToken,
          claim_token_expires: expiresAt,
          post_claim_scopes: POST_CLAIM_SCOPES,
          claim: {
            user_code: userCode,
            expires_in: CLAIM_TTL_SEC,
            verification_uri: verificationUri(base, claimAttemptToken),
            interval: CLAIM_POLL_INTERVAL_SEC
          }
        },
        { status: 201 }
      )
    }

    return oauthError('invalid_request', {
      description: 'Unsupported or missing "type" (expected "anonymous" or "service_auth")'
    })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[agent/identity] error', error)
    }
    return oauthError('server_error', { description: 'Registration failed', status: 500 })
  }
}
