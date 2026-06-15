/**
 * POST /api/agent/identity/claim — anonymous-only. Binds an email to an anonymous
 * registration and mints fresh claim-ceremony material (a new user_code + verification_uri),
 * invalidating any previous attempt. service_auth registrations already get their material
 * at /api/agent/identity, so they do not use this endpoint.
 */

import { NextRequest } from 'next/server'
import {
  CLAIM_POLL_INTERVAL_SEC,
  CLAIM_TTL_SEC,
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
  expireActiveAttempts,
  getRegistrationByClaimTokenHash,
  inSeconds,
  isRegistrationExpired,
  recordEvent,
  updateRegistration
} from '@/lib/agent-auth/store'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request, 'agent-claim')
  if (limited) return limited

  const parsed = await readJsonBody(request)
  if (!parsed.ok) return parsed.response
  const body = parsed.body

  const claimToken = body?.claim_token
  if (typeof claimToken !== 'string' || !claimToken) {
    return oauthError('invalid_request', { description: 'claim_token is required' })
  }
  if (!isEmail(body?.email)) {
    return oauthError('invalid_request', { description: 'email must be a valid email address' })
  }
  const email = (body.email as string).toLowerCase()
  const ip = getClientIp(request)

  try {
    const registration = await getRegistrationByClaimTokenHash(sha256Hex(claimToken))
    if (!registration) {
      return oauthError('invalid_claim_token', { description: 'Unknown claim token' })
    }
    if (registration.registration_type !== 'anonymous') {
      return oauthError('invalid_request', {
        description: 'This registration already has claim material'
      })
    }
    if (registration.status === 'claimed') {
      return oauthError('claimed_or_in_flight', { description: 'Registration already claimed' })
    }
    if (isRegistrationExpired(registration)) {
      return oauthError('claim_expired', { description: 'Registration is no longer claimable' })
    }

    // Bind the email (only this signed-in user may complete the ceremony) and rotate material.
    await updateRegistration(registration.id, { claim_email: email })
    await expireActiveAttempts(registration.id)

    const claimAttemptToken = randomSecret('cat')
    const userCode = generateUserCode()
    const expiresAt = inSeconds(CLAIM_TTL_SEC)
    const attempt = await createClaimAttempt({
      registrationId: registration.id,
      claimAttemptTokenHash: sha256Hex(claimAttemptToken),
      userCodeHash: sha256Hex(userCode),
      expiresAt,
      clientIp: ip
    })

    await recordEvent('claim.requested', { registrationId: registration.id })
    await recordEvent('user_code.minted', { registrationId: registration.id })

    return jsonNoStore({
      registration_id: registration.id,
      claim_attempt_id: attempt.id,
      status: 'initiated',
      expires_at: expiresAt,
      claim_attempt: {
        user_code: userCode,
        expires_in: CLAIM_TTL_SEC,
        verification_uri: verificationUri(getBaseUrl(request), claimAttemptToken),
        interval: CLAIM_POLL_INTERVAL_SEC
      }
    })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[agent/identity/claim] error', error)
    }
    return oauthError('server_error', { description: 'Claim initiation failed', status: 500 })
  }
}
