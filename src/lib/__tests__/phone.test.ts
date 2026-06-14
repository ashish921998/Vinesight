import { describe, it, expect } from 'vitest'
import { normalizePhone } from '../phone'

describe('normalizePhone', () => {
  it('prefixes a bare 10-digit Indian mobile with +91', () => {
    expect(normalizePhone('9876543210')).toEqual({
      e164: '+919876543210',
      wa: '919876543210'
    })
  })

  it('keeps an already +91-prefixed number and strips separators', () => {
    expect(normalizePhone('+91 98765 43210')).toEqual({
      e164: '+919876543210',
      wa: '919876543210'
    })
  })

  it('drops the trunk 0 from an 11-digit Indian number', () => {
    expect(normalizePhone('09876543210')).toEqual({
      e164: '+919876543210',
      wa: '919876543210'
    })
  })

  it('strips dashes from a bare Indian mobile', () => {
    expect(normalizePhone('98765-43210')).toEqual({
      e164: '+919876543210',
      wa: '919876543210'
    })
  })

  it('accepts a plausible non-Indian international number', () => {
    // UK mobile, country code 44.
    expect(normalizePhone('+447911123456')).toEqual({
      e164: '+447911123456',
      wa: '447911123456'
    })
  })

  // --- regression cases for the malformed-number gaps (review finding #12) ---

  it('rejects a one-digit-short 91-prefixed number instead of passing it through', () => {
    // 11 digits: 91 + only 9 subscriber digits. Previously yielded "+91987654321".
    expect(normalizePhone('91987654321')).toBeNull()
  })

  it('rejects a too-long 91-prefixed number', () => {
    expect(normalizePhone('9198765432100')).toBeNull()
  })

  it('rejects a leading-0 (+0...) number', () => {
    expect(normalizePhone('+09876543210')).toBeNull()
  })

  it('rejects an Indian mobile whose subscriber part does not start 6-9', () => {
    expect(normalizePhone('5876543210')).toBeNull()
  })

  it('returns null for empty or junk input', () => {
    expect(normalizePhone('')).toBeNull()
    expect(normalizePhone('   ')).toBeNull()
    expect(normalizePhone('abcd')).toBeNull()
  })
})
