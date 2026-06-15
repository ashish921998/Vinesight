/**
 * The service-signed identity_assertion. It is a re-exchangeable JWT whose `sub` is the
 * registration id; agents trade it at /api/oauth2/token (RFC 7523 jwt-bearer) for an
 * access_token, and re-exchange it to refresh until it expires.
 */

import { ASSERTION_JWT_TYP, ASSERTION_TTL_SEC, getJwtSecret, issuerFor } from './config'
import { JwtError, randomId, signJwt, verifyJwt } from './tokens'

export function mintIdentityAssertion(
  base: string,
  registrationId: string,
  ttlSec: number = ASSERTION_TTL_SEC
): { assertion: string; expiresAt: string } {
  const now = Math.floor(Date.now() / 1000)
  const exp = now + ttlSec
  const issuer = issuerFor(base)
  const assertion = signJwt(
    { iss: issuer, aud: issuer, sub: registrationId, iat: now, exp, jti: randomId('jti') },
    getJwtSecret(),
    ASSERTION_JWT_TYP
  )
  return { assertion, expiresAt: new Date(exp * 1000).toISOString() }
}

/** Verifies signature, time bounds, and iss/aud, returning the registration id. */
export function verifyIdentityAssertion(token: string, base: string): { registrationId: string } {
  const payload = verifyJwt(token, getJwtSecret())
  const issuer = issuerFor(base)
  if (payload.iss !== issuer) throw new JwtError('Invalid issuer')
  if (payload.aud !== issuer) throw new JwtError('Invalid audience')
  if (typeof payload.sub !== 'string' || !payload.sub) throw new JwtError('Missing subject')
  return { registrationId: payload.sub }
}
