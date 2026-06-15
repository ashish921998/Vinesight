/**
 * Cryptographic helpers for the agent-auth flow: prefixed CSPRNG identifiers/secrets,
 * SHA-256 hashing for at-rest bearer secrets, constant-time comparison, the 6-digit
 * user_code, and a minimal HS256 JWT signer/verifier for the identity_assertion.
 *
 * The JWT is a standard, compact HS256 token built on Node's `crypto`. We only ever sign
 * and verify our own assertions with a symmetric secret, so no external JWT library or
 * JWKS resolution is needed.
 */

import crypto from 'crypto'

/** A non-secret, prefixed identifier, e.g. reg_<base64url>. */
export function randomId(prefix: string, bytes = 16): string {
  return `${prefix}_${crypto.randomBytes(bytes).toString('base64url')}`
}

/** A high-entropy bearer secret, e.g. clm_<base64url>. Returned to the caller exactly once. */
export function randomSecret(prefix: string, bytes = 24): string {
  return `${prefix}_${crypto.randomBytes(bytes).toString('base64url')}`
}

export function sha256Hex(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex')
}

/** Constant-time comparison of two equal-purpose strings (returns false on length mismatch). */
export function timingSafeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a)
  const bufferB = Buffer.from(b)
  if (bufferA.length !== bufferB.length) return false
  return crypto.timingSafeEqual(bufferA, bufferB)
}

/** A CSPRNG 6-digit numeric code (RFC 8628 user_code), zero-padded. */
export function generateUserCode(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, '0')
}

// --- Minimal HS256 JWT -------------------------------------------------------

function b64url(input: string | Buffer): string {
  return Buffer.from(input).toString('base64url')
}

export interface JwtPayload {
  [claim: string]: unknown
}

export function signJwt(payload: JwtPayload, secret: string, typ = 'JWT'): string {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ }))
  const body = b64url(JSON.stringify(payload))
  const signingInput = `${header}.${body}`
  const signature = crypto.createHmac('sha256', secret).update(signingInput).digest('base64url')
  return `${signingInput}.${signature}`
}

export class JwtError extends Error {}

/**
 * Verifies an HS256 JWT signature and the exp/nbf time bounds, returning the decoded
 * payload. Throws JwtError on any failure. Caller is responsible for iss/aud/typ checks.
 */
export function verifyJwt(token: string, secret: string): JwtPayload {
  const parts = token.split('.')
  if (parts.length !== 3) throw new JwtError('Malformed token')
  const [header, body, signature] = parts

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64url')
  if (!timingSafeEqual(signature, expected)) throw new JwtError('Invalid signature')

  let payload: JwtPayload
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
  } catch {
    throw new JwtError('Invalid payload')
  }

  const now = Math.floor(Date.now() / 1000)
  if (typeof payload.exp === 'number' && now >= payload.exp) throw new JwtError('Token expired')
  if (typeof payload.nbf === 'number' && now < payload.nbf)
    throw new JwtError('Token not yet valid')
  return payload
}
