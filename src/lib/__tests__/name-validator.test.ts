import { describe, it, expect } from 'vitest'
import { sanitizeAndValidateName, composeFullNameMetadata } from '../auth/name-validator'

describe('sanitizeAndValidateName', () => {
  it('returns valid for undefined (optional parameter)', () => {
    expect(sanitizeAndValidateName(undefined, 'First name')).toEqual({ isValid: true })
    expect(sanitizeAndValidateName(undefined, 'First name').value).toBeUndefined()
  })

  it('trims leading and trailing whitespace', () => {
    expect(sanitizeAndValidateName('  Ashish  ', 'First name')).toEqual({
      isValid: true,
      value: 'Ashish'
    })
  })

  it('rejects an empty / whitespace-only value', () => {
    const result = sanitizeAndValidateName('   ', 'First name')
    expect(result.isValid).toBe(false)
    expect(result.error).toMatch(/cannot be empty/)
  })

  it('strips control characters and newlines', () => {
    expect(sanitizeAndValidateName('A\u0000s\u0007h\u000ais\u000dh', 'First name')).toEqual({
      isValid: true,
      value: 'Ashish'
    })
  })

  it('strips the DEL character (code 127)', () => {
    expect(sanitizeAndValidateName('A\u007F', 'First name')).toEqual({
      isValid: true,
      value: 'A'
    })
  })

  it('collapses repeated internal whitespace into single spaces', () => {
    expect(sanitizeAndValidateName('Ashish   Kumar   Huddar', 'Full name')).toEqual({
      isValid: true,
      value: 'Ashish Kumar Huddar'
    })
  })

  it('strips tab characters as control characters (ASCII 9)', () => {
    // Tabs fall below ASCII 32, so they are removed entirely (not converted to
    // spaces) before the whitespace-collapse step runs.
    expect(sanitizeAndValidateName('Ashish\tKumar', 'Full name')).toEqual({
      isValid: true,
      value: 'AshishKumar'
    })
  })

  it('rejects a value that is only invalid/control characters', () => {
    const result = sanitizeAndValidateName('\u0000\u0001\u0002', 'First name')
    expect(result.isValid).toBe(false)
    expect(result.error).toMatch(/only invalid characters/)
  })

  it('accepts a name at exactly the max length (50)', () => {
    const exactlyFifty = 'A'.repeat(50)
    expect(sanitizeAndValidateName(exactlyFifty, 'First name')).toEqual({
      isValid: true,
      value: exactlyFifty
    })
  })

  it('rejects a name exceeding the max length (50)', () => {
    const tooLong = 'A'.repeat(51)
    const result = sanitizeAndValidateName(tooLong, 'First name')
    expect(result.isValid).toBe(false)
    expect(result.error).toMatch(/must not exceed 50 characters/)
    expect(result.error).toContain('51 characters')
  })

  it('counts length after sanitization, not before', () => {
    // 25 + 3 spaces + 24 = 52 on the wire, but collapses to 25 + 1 + 24 = 50
    // after whitespace normalization, so it stays within the limit.
    const collapsesToFifty = 'A'.repeat(25) + '   ' + 'B'.repeat(24)
    expect(sanitizeAndValidateName(collapsesToFifty, 'First name').isValid).toBe(true)
  })

  it('uses the provided field name in error messages', () => {
    expect(sanitizeAndValidateName('', 'Last name').error).toMatch(/Last name/)
    expect(sanitizeAndValidateName('A'.repeat(51), 'Last name').error).toMatch(/Last name/)
  })
})

describe('composeFullNameMetadata', () => {
  it('composes full_name from first and last name', () => {
    expect(composeFullNameMetadata('Ashish', 'Huddar')).toEqual({
      first_name: 'Ashish',
      last_name: 'Huddar',
      full_name: 'Ashish Huddar'
    })
  })

  it('uses only first_name when last name is absent', () => {
    expect(composeFullNameMetadata('Ashish', undefined)).toEqual({
      first_name: 'Ashish',
      full_name: 'Ashish'
    })
  })

  it('uses only last_name when first name is absent', () => {
    expect(composeFullNameMetadata(undefined, 'Huddar')).toEqual({
      last_name: 'Huddar',
      full_name: 'Huddar'
    })
  })

  it('returns an empty record when neither name is present', () => {
    expect(composeFullNameMetadata(undefined, undefined)).toEqual({})
  })
})
