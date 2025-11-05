/**
 * Shared utility functions for safely parsing Sentry environment variables.
 * These helpers are used across client, server, and edge Sentry configurations.
 */

export const parseEnvFloat = (key: string, defaultValue: number): number => {
  const value = process.env[key]
  if (value === undefined) return defaultValue
  const parsed = parseFloat(value)
  return isNaN(parsed) ? defaultValue : parsed
}

export const parseEnvBoolean = (key: string, defaultValue: boolean): boolean => {
  const value = process.env[key]
  if (value === undefined) return defaultValue
  return value.toLowerCase() === 'true'
}
