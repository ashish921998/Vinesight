import { VALIDATION } from '@/lib/constants'
import type { SanitizedNameResult } from './types'

/**
 * Sanitizes and validates a name field
 * - Returns valid for undefined (optional parameter)
 * - Trims whitespace
 * - Removes control characters and newlines
 * - Collapses repeated spaces
 * - Enforces max length of 50 characters
 */
export function sanitizeAndValidateName(
  name: string | undefined,
  fieldName: string
): SanitizedNameResult {
  // Return valid if name is undefined (optional parameter)
  if (name === undefined) {
    return {
      isValid: true
    }
  }

  // Trim whitespace
  let sanitized = name.trim()

  // Check if empty after trimming
  if (!sanitized) {
    return {
      isValid: false,
      error: `${fieldName} cannot be empty or contain only whitespace`
    }
  }

  // Remove control characters and newlines (ASCII 0-31 and 127)
  // Using character-code filter instead of regex to avoid lint warnings
  sanitized = sanitized
    .split('')
    .filter((char) => {
      const code = char.charCodeAt(0)
      return code >= 32 && code !== 127
    })
    .join('')

  // Collapse repeated spaces into single space
  sanitized = sanitized.replace(/\s+/g, ' ')

  // Trim again after sanitization
  sanitized = sanitized.trim()

  // Check if empty after full sanitization
  if (!sanitized) {
    return {
      isValid: false,
      error: `${fieldName} contains only invalid characters`
    }
  }

  // Check length and reject if it exceeds the limit
  if (sanitized.length > VALIDATION.MAX_NAME_LENGTH) {
    return {
      isValid: false,
      error: `${fieldName} must not exceed ${VALIDATION.MAX_NAME_LENGTH} characters (currently ${sanitized.length} characters)`
    }
  }

  return {
    isValid: true,
    value: sanitized
  }
}

/**
 * Composes the `full_name` user-metadata field from the sanitized first and
 * last name. Returns an empty record when neither name is present.
 */
export function composeFullNameMetadata(
  firstName?: string,
  lastName?: string
): { first_name?: string; last_name?: string; full_name?: string } {
  const metadata: { first_name?: string; last_name?: string; full_name?: string } = {}

  if (firstName) metadata.first_name = firstName
  if (lastName) metadata.last_name = lastName

  if (metadata.first_name && metadata.last_name) {
    metadata.full_name = `${metadata.first_name} ${metadata.last_name}`
  } else if (metadata.first_name) {
    metadata.full_name = metadata.first_name
  } else if (metadata.last_name) {
    metadata.full_name = metadata.last_name
  }

  return metadata
}
