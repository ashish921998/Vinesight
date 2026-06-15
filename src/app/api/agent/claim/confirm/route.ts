/**
 * POST /api/agent/claim/confirm — the form-action behind the VineSight claim page. It runs
 * as the *signed-in user* (cookie session), verifies the typed user_code against the active
 * claim attempt, enforces the same-account check, and on success binds the registration to
 * the user. This is the only place a registration becomes `claimed`.
 *
 * The agent never calls this endpoint; it polls /api/oauth2/token and sees the result.
 */

import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/auth-utils'
import { MAX_USER_CODE_ATTEMPTS } from '@/lib/agent-auth/config'
import { checkRateLimit, jsonNoStore, oauthError, readJsonBody } from '@/lib/agent-auth/responses'
import { sha256Hex, timingSafeEqual } from '@/lib/agent-auth/tokens'
import {
  getClaimAttemptByTokenHash,
  getRegistrationById,
  recordEvent,
  revokePreClaimTokens,
  updateClaimAttempt,
  updateRegistration
} from '@/lib/agent-auth/store'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request, 'agent-claim-confirm')
  if (limited) return limited

  const parsed = await readJsonBody(request)
  if (!parsed.ok) return parsed.response
  const body = parsed.body

  const claimAttemptToken = body?.claim_attempt_token
  const userCode = String(body?.user_code ?? '').replace(/\D/g, '')
  if (typeof claimAttemptToken !== 'string' || !claimAttemptToken) {
    return oauthError('invalid_request', { description: 'claim_attempt_token is required' })
  }
  if (userCode.length !== 6) {
    return oauthError('invalid_request', { description: 'Enter the 6-digit code' })
  }

  // Identify the human completing the ceremony.
  const supabase = await createServerSupabaseClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) {
    return jsonNoStore(
      { error: 'authentication_required', error_description: 'Sign in to confirm this request.' },
      { status: 401 }
    )
  }

  try {
    const attempt = await getClaimAttemptByTokenHash(sha256Hex(claimAttemptToken))
    if (!attempt) {
      return oauthError('invalid_request', { description: 'Unknown claim link', status: 404 })
    }
    if (attempt.status !== 'initiated' || new Date(attempt.expires_at).getTime() <= Date.now()) {
      if (attempt.status === 'initiated') {
        await updateClaimAttempt(attempt.id, { status: 'expired' })
      }
      return oauthError('claim_expired', { description: 'This claim link has expired' })
    }
    if (attempt.attempts >= MAX_USER_CODE_ATTEMPTS) {
      await updateClaimAttempt(attempt.id, { status: 'expired' })
      return oauthError('claim_expired', { description: 'Too many incorrect attempts' })
    }

    const registration = await getRegistrationById(attempt.registration_id)
    if (!registration || registration.status === 'revoked') {
      return oauthError('invalid_request', { description: 'Registration unavailable', status: 404 })
    }
    if (registration.status === 'claimed') {
      return oauthError('claimed_or_in_flight', { description: 'Already claimed' })
    }

    // Same-account check: only the user the ceremony was started for may complete it.
    const claimEmail = registration.claim_email?.toLowerCase()
    const userEmail = (user.email || '').toLowerCase()
    if (!claimEmail || !userEmail || claimEmail !== userEmail) {
      return jsonNoStore(
        {
          error: 'account_mismatch',
          error_description: `This request was started for ${claimEmail ?? 'a different account'}. Sign in with that account to continue.`
        },
        { status: 403 }
      )
    }

    // Verify the user_code (constant-time over the stored hash).
    if (!timingSafeEqual(sha256Hex(userCode), attempt.user_code_hash)) {
      await updateClaimAttempt(attempt.id, { attempts: attempt.attempts + 1 })
      const remaining = Math.max(0, MAX_USER_CODE_ATTEMPTS - (attempt.attempts + 1))
      return jsonNoStore(
        {
          error: 'invalid_user_code',
          error_description: `Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} left.`
        },
        { status: 400 }
      )
    }

    // Success — bind the registration to this user.
    const now = new Date().toISOString()
    await updateClaimAttempt(attempt.id, {
      status: 'confirmed',
      confirmed_at: now,
      claimed_by_user_id: user.id
    })
    await updateRegistration(registration.id, {
      status: 'claimed',
      claimed_by_user_id: user.id,
      claimed_at: now
    })
    // Anonymous pre-claim tokens must not survive the binding.
    await revokePreClaimTokens(registration.id)
    await recordEvent('claim.confirmed', { registrationId: registration.id, userId: user.id })

    return jsonNoStore({ status: 'confirmed' })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[agent/claim/confirm] error', error)
    }
    return oauthError('server_error', { description: 'Could not confirm the claim', status: 500 })
  }
}
