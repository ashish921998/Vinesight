/**
 * Server-side quota management for AI chatbot
 * Uses in-memory storage for simplicity (in production, use Redis or database)
 */

interface ServerQuotaData {
  date: string
  count: number
  lastUpdated: number
}

// In-memory storage (in production, use Redis/database)
const userQuotas = new Map<string, ServerQuotaData>()

const DAILY_LIMIT = 5000
const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayKey(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Clean up old quota entries periodically
 */
function cleanupOldEntries(): void {
  const today = getTodayKey()
  const now = Date.now()

  for (const [userId, data] of userQuotas.entries()) {
    // Remove entries older than 2 days
    if (data.date !== today && now - data.lastUpdated > CLEANUP_INTERVAL * 2) {
      userQuotas.delete(userId)
    }
  }
}

/**
 * Get quota data for a user
 */
export function getServerQuotaData(userId: string): ServerQuotaData {
  const today = getTodayKey()
  const existing = userQuotas.get(userId)

  // If no data or data is from a previous day, reset
  if (!existing || existing.date !== today) {
    const newData: ServerQuotaData = {
      date: today,
      count: 0,
      lastUpdated: Date.now()
    }
    userQuotas.set(userId, newData)

    // Cleanup old entries occasionally
    if (Math.random() < 0.1) {
      // 10% chance
      cleanupOldEntries()
    }

    return newData
  }

  return existing
}

/**
 * Check if user has exceeded daily limit
 */
export function hasServerExceededQuota(userId: string): boolean {
  const quota = getServerQuotaData(userId)
  return quota.count >= DAILY_LIMIT
}

/**
 * Increment question count for a user
 */
export function incrementServerQuestionCount(userId: string): ServerQuotaData {
  const quota = getServerQuotaData(userId)
  const updatedQuota: ServerQuotaData = {
    ...quota,
    count: quota.count + 1,
    lastUpdated: Date.now()
  }

  userQuotas.set(userId, updatedQuota)
  return updatedQuota
}

/**
 * Get remaining questions for a user
 */
export function getServerRemainingQuestions(userId: string): number {
  const quota = getServerQuotaData(userId)
  return Math.max(0, DAILY_LIMIT - quota.count)
}

/**
 * Get quota status for a user
 */
export function getServerQuotaStatus(userId: string): {
  used: number
  remaining: number
  limit: number
  isExceeded: boolean
} {
  const quota = getServerQuotaData(userId)
  const remaining = getServerRemainingQuestions(userId)

  return {
    used: quota.count,
    remaining,
    limit: DAILY_LIMIT,
    isExceeded: hasServerExceededQuota(userId)
  }
}
