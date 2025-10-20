/**
 * Application constants
 * Centralized configuration values used across the application
 */

// Chemical and spray-related constants
export const MAX_CHEMICALS_PER_SPRAY = 10

// Validation constants
export const MIN_CHEMICAL_QUANTITY = 0.1
export const MAX_CHEMICAL_QUANTITY = 1000
export const MIN_CHEMICAL_NAME_LENGTH = 2
export const MAX_CHEMICAL_NAME_LENGTH = 100

// File upload constants
export const MAX_FILE_SIZE_MB = 10
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

// Default values
export const DEFAULT_WATER_VOLUME = 0
export const DEFAULT_SPRAY_UNIT = 'gm/L'

// UI constants
export const MAX_RECENT_ACTIVITIES = 10
export const MAX_PENDING_TASKS_DISPLAY = 3
