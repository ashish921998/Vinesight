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
 *  - Leading "+"             -> treated as already international, digits kept as-is.
 *  - 10 digits              -> assumed Indian mobile, prefixed with 91.
 *  - 11 digits with lead 0  -> Indian number with trunk 0, dropped and prefixed with 91.
 *  - Any 91-prefixed number -> must be exactly 91 + a 10-digit mobile starting 6-9, so a
 *                              one-digit typo like "91987654321" is rejected rather than
 *                              passed through as a malformed "+91987654321".
 *  - Other intl numbers     -> accepted at a plausible E.164 length (11-15 digits).
 * A leading 0 after normalization (e.g. a "+0..." input) is rejected as malformed.
 */
/**
 * Reduce arbitrary user input to the bare 10-digit Indian national mobile number, for use with
 * a fixed "+91" prefix in the UI. Forgiving about pasted values that already carry a country
 * code or trunk 0 so the user doesn't end up with a doubled prefix:
 *  - a "91…" value over 10 digits -> the 91 country code is dropped.
 *  - a "0…" value over 10 digits   -> the trunk 0 is dropped.
 * Prefixes are stripped in a loop, so combined or repeated prefixes (e.g. a trunk-plus-country
 * "0919876543210", or a doubled "+91 +91 98765 43210" paste) are fully unwound rather than
 * leaving a country code embedded in the result. Stripping only runs while the value is longer
 * than 10 digits, so a genuine 10-digit mobile that happens to start with "91" (or contains a 0)
 * is left untouched, and it's length-driven rather than pinned to an exact count so a paste with
 * extra trailing digits still has its prefix removed instead of slipping through.
 * The result is always digits only, capped at 10.
 */
export function toIndianNationalDigits(input: string): string {
  let digits = (input || '').replace(/\D/g, '')

  while (digits.length > 10) {
    if (digits.startsWith('0')) {
      digits = digits.slice(1)
    } else if (digits.startsWith(DEFAULT_COUNTRY_CODE)) {
      digits = digits.slice(2)
    } else {
      break
    }
  }

  return digits.slice(0, 10)
}

export function normalizePhone(input: string): NormalizedPhone | null {
  if (!input) return null

  const trimmed = input.trim()
  let digits = trimmed.replace(/\D/g, '')

  if (!digits) return null

  // Bare numbers (no leading +) are treated as Indian and get the +91 country code.
  // Numbers entered with a + are already international and fall through to the checks below.
  if (!trimmed.startsWith('+')) {
    if (digits.length === 10) {
      digits = DEFAULT_COUNTRY_CODE + digits
    } else if (digits.length === 11 && digits.startsWith('0')) {
      digits = DEFAULT_COUNTRY_CODE + digits.slice(1)
    }
  }

  // No valid E.164 number has a 0 immediately after the country code; reject a leading 0
  // (e.g. a "+0..." input, or a trunk 0 we didn't strip) instead of emitting a bad number.
  if (digits.startsWith('0')) return null

  // Indian numbers (the default market, and the only ones we can validate precisely) must be
  // exactly the country code + a 10-digit mobile starting 6-9. Validating EVERY 91-prefixed
  // number — not only the 12-digit case — rejects the too-short/too-long typos that would
  // otherwise slip through the generic length check below.
  if (digits.startsWith(DEFAULT_COUNTRY_CODE)) {
    if (!/^91[6-9]\d{9}$/.test(digits)) return null
    return { e164: `+${digits}`, wa: digits }
  }

  // Non-Indian international numbers: accept a plausible E.164 length.
  if (digits.length < 11 || digits.length > 15) return null

  return {
    e164: `+${digits}`,
    wa: digits
  }
}
