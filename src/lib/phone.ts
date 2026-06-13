// Phone number normalization for the farmer invite flow.
// Defaults bare numbers to India (+91) since that's the primary market, while still
// accepting international numbers when an explicit country code (leading +) is given.

const DEFAULT_COUNTRY_CODE = '91' // India

export interface NormalizedPhone {
  /** E.164 form, e.g. +919876543210 — stored in the DB and used for sms: links */
  e164: string
  /** Digits only with country code, e.g. 919876543210 — used for wa.me links */
  wa: string
}

/**
 * Normalize a user-entered phone number.
 * Returns null if the input can't be coerced into a plausible international number.
 *
 * Rules:
 *  - Leading "+"            -> treated as already international, digits kept as-is.
 *  - 10 digits             -> assumed Indian mobile, prefixed with 91.
 *  - 11 digits with lead 0 -> Indian number with trunk 0, dropped and prefixed with 91.
 *  - 12 digits with lead 91-> already an Indian international number.
 */
export function normalizePhone(input: string): NormalizedPhone | null {
  if (!input) return null

  const trimmed = input.trim()
  let digits = trimmed.replace(/\D/g, '')

  if (!digits) return null

  // Bare numbers (no leading +) are treated as Indian and get the +91 country code.
  // Numbers entered with a + are already international, and 12-digit 91-prefixed numbers
  // fall through unchanged to the length check below.
  if (!trimmed.startsWith('+')) {
    if (digits.length === 10) {
      digits = DEFAULT_COUNTRY_CODE + digits
    } else if (digits.length === 11 && digits.startsWith('0')) {
      digits = DEFAULT_COUNTRY_CODE + digits.slice(1)
    }
  }

  // Plausible international length: country code + subscriber number.
  if (digits.length < 11 || digits.length > 15) return null

  // For Indian numbers, the subscriber part must be a valid mobile (starts 6-9).
  if (digits.startsWith(DEFAULT_COUNTRY_CODE) && digits.length === 12) {
    const national = digits.slice(2)
    if (!/^[6-9]\d{9}$/.test(national)) return null
  }

  return {
    e164: `+${digits}`,
    wa: digits
  }
}
