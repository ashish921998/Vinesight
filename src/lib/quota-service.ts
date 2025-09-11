import { z } from 'zod'
import { createNamespacedStorage, StorageBackends, storageNamespaces } from './storage'

export interface QuotaData {
  date: string;
  count: number;
  userId?: string;
}

const QUOTA_KEY = 'daily'
const DAILY_LIMIT = 5

const QuotaSchema = z.object({ date: z.string(), count: z.number().min(0), userId: z.string().optional() })

const storage = createNamespacedStorage(storageNamespaces.quota, StorageBackends.local)

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0]
}

function msUntilNextMidnight(): number {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  return Math.max(0, tomorrow.getTime() - now.getTime())
}

export function getQuotaData(userId?: string): QuotaData {
  try {
    const stored = storage.get(QUOTA_KEY, QuotaSchema)
    const today = getTodayKey()
    if (!stored || stored.date !== today) {
      const fresh: QuotaData = { date: today, count: 0, userId }
      storage.set(QUOTA_KEY, fresh, { ttlMs: msUntilNextMidnight(), schema: QuotaSchema })
      return fresh
    }
    return { ...stored, userId }
  } catch {
    return { date: getTodayKey(), count: 0, userId }
  }
}

export function hasExceededQuota(userId?: string): boolean {
  const quota = getQuotaData(userId)
  return quota.count >= DAILY_LIMIT
}

export function getRemainingQuestions(userId?: string): number {
  const quota = getQuotaData(userId)
  return Math.max(0, DAILY_LIMIT - quota.count)
}

export function incrementQuestionCount(userId?: string): QuotaData {
  const current = getQuotaData(userId)
  const updated: QuotaData = { ...current, count: current.count + 1, userId }
  storage.set(QUOTA_KEY, updated, { ttlMs: msUntilNextMidnight(), schema: QuotaSchema })
  return updated
}

export function resetQuota(): void {
  storage.remove(QUOTA_KEY)
}

export function getQuotaStatus(userId?: string): {
  used: number;
  remaining: number;
  limit: number;
  isExceeded: boolean;
  resetsAt: string;
} {
  const quota = getQuotaData(userId)
  const remaining = getRemainingQuestions(userId)
  const now = new Date()
  const tomorrow = new Date(now)
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
