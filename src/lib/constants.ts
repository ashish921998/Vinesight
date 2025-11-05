/**
 * Application-wide constants
 */

// Number system constants
export const NUMBER_SYSTEM = {
  // Used for parseInt() to ensure base-10 parsing and avoid octal interpretation
  RADIX_DECIMAL: 10 as const
} as const

// Text display constants
export const TEXT_LIMITS = {
  DAILY_NOTE_PREVIEW: 80,
  ACTIVITY_DISPLAY_PREVIEW: 40,
  FILENAME_PREVIEW: 10
} as const

// Database and API constants
export const DATABASE = {
  DEFAULT_LIMIT: 100,
  RECENT_RECORDS_LIMIT: 10
} as const

// Form validation constants
export const VALIDATION = {
  MIN_NOTES_LENGTH: 1,
  MAX_PHOTOS_PER_DAY: 50
} as const
