export interface QuotaData {
  date: string
  count: number
  userId?: string
}

const QUOTA_KEY = 'ai_chat_quota'
const DAILY_LIMIT = 500

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0]
}

export function getQuotaData(userId?: string): QuotaData {
  if (typeof window === 'undefined') {
    return { date: getTodayKey(), count: 0, userId }
  }

  try {
    const stored = localStorage.getItem(QUOTA_KEY)
    if (!stored) {
      return { date: getTodayKey(), count: 0, userId }
    }

    const data: QuotaData = JSON.parse(stored)
    const today = getTodayKey()

    // Reset count if it's a new day
    if (data.date !== today) {
      const newData = { date: today, count: 0, userId }
      localStorage.setItem(QUOTA_KEY, JSON.stringify(newData))
      return newData
    }

    return { ...data, userId }
  } catch (error) {
    console.error('Error reading quota data:', error)
    return { date: getTodayKey(), count: 0, userId }
  }
}

/**
 * Check if user has exceeded daily limit
 */
export function hasExceededQuota(userId?: string): boolean {
  const quota = getQuotaData(userId)
  return quota.count >= DAILY_LIMIT
}

/**
 * Get remaining questions for today
 */
export function getRemainingQuestions(userId?: string): number {
  const quota = getQuotaData(userId)
  return Math.max(0, DAILY_LIMIT - quota.count)
}

/**
 * Increment question count and return updated data
 */
export function incrementQuestionCount(userId?: string): QuotaData {
  if (typeof window === 'undefined') {
    return { date: getTodayKey(), count: 0, userId }
  }

  const quota = getQuotaData(userId)
  const updatedQuota = {
    ...quota,
    count: quota.count + 1,
    userId
  }

  try {
    localStorage.setItem(QUOTA_KEY, JSON.stringify(updatedQuota))
  } catch (error) {
    console.error('Error saving quota data:', error)
  }

  return updatedQuota
}

/**
 * Reset quota for testing (development only)
 */
export function resetQuota(): void {
  if (typeof window === 'undefined') return

  if (process.env.NODE_ENV === 'development') {
    localStorage.removeItem(QUOTA_KEY)
    console.log('Quota reset for development')
  }
}

/**
 * Get quota status summary
 */
export function getQuotaStatus(userId?: string): {
  used: number
  remaining: number
  limit: number
  isExceeded: boolean
  resetsAt: string
} {
  const quota = getQuotaData(userId)
  const remaining = getRemainingQuestions(userId)

  // Calculate reset time (next day at 00:00)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)

  return {
    used: quota.count,
    remaining,
    limit: DAILY_LIMIT,
    isExceeded: hasExceededQuota(userId),
    resetsAt: tomorrow.toISOString()
  }
}
