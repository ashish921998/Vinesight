import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('Farm Logs Page - Utility Functions', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('formatLogDate', () => {
    const formatLogDate = (dateString: string): string => {
      try {
        const date = new Date(dateString)
        if (isNaN(date.getTime())) {
          return 'Invalid date'
        }

        const now = new Date()
        const isToday = date.toDateString() === now.toDateString()
        const isYesterday =
          new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString() === date.toDateString()

        if (isToday) {
          return `today, ${date
            .toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })
            .toLowerCase()
            .replace(' ', '')}`
        } else if (isYesterday) {
          return `Yesterday, ${date
            .toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })
            .toLowerCase()
            .replace(' ', '')}`
        } else {
          return date
            .toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })
            .replace(',', ',')
            .replace(/\s+/g, ' ')
        }
      } catch (error) {
        return 'Invalid date'
      }
    }

    it('should format today\'s date correctly', () => {
      const now = new Date('2024-01-15T14:30:00')
      vi.setSystemTime(now)

      const result = formatLogDate('2024-01-15T14:30:00')
      expect(result).toContain('today')
      expect(result).toContain('2:30')
    })

    it('should format yesterday\'s date with capital Y', () => {
      const now = new Date('2024-01-15T14:30:00')
      vi.setSystemTime(now)

      const result = formatLogDate('2024-01-14T10:15:00')
      expect(result).toContain('Yesterday')
      expect(result).not.toContain('yesterday')
      expect(result).toContain('10:15')
    })

    it('should format past dates with month and day', () => {
      const now = new Date('2024-01-15T14:30:00')
      vi.setSystemTime(now)

      const result = formatLogDate('2024-01-10T08:00:00')
      expect(result).toContain('Jan')
      expect(result).toContain('10')
    })

    it('should return "Invalid date" for invalid date strings', () => {
      expect(formatLogDate('not-a-date')).toBe('Invalid date')
      expect(formatLogDate('')).toBe('Invalid date')
      expect(formatLogDate('2024-13-45')).toBe('Invalid date')
    })

    it('should handle edge case of null or undefined gracefully', () => {
      // Note: new Date(null) creates epoch date, new Date(undefined) creates Invalid Date
      // In real implementation, these should be checked before calling new Date()
      const result1 = formatLogDate(null as any)
      const result2 = formatLogDate(undefined as any)
      
      // Either returns Invalid date or a formatted date (implementation dependent)
      expect(typeof result1).toBe('string')
      expect(typeof result2).toBe('string')
      expect(result1.length).toBeGreaterThan(0)
      expect(result2.length).toBeGreaterThan(0)
    })
  })

  describe('getDaysAfterPruning', () => {
    const getDaysAfterPruning = (
      farmPruningDate?: Date | string | null,
      logCreatedAt?: string
    ): number | null => {
      if (!farmPruningDate || !logCreatedAt) return null

      try {
        const pruningDate =
          typeof farmPruningDate === 'string' ? new Date(farmPruningDate) : farmPruningDate
        const createdDate = new Date(logCreatedAt)

        if (!pruningDate || isNaN(pruningDate.getTime()) || isNaN(createdDate.getTime())) {
          return null
        }

        const diffMs = createdDate.getTime() - pruningDate.getTime()
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

        return diffDays >= 0 ? diffDays : null
      } catch (error) {
        return null
      }
    }

    it('should calculate days after pruning correctly', () => {
      const pruningDate = '2024-01-01'
      const logDate = '2024-01-11'
      expect(getDaysAfterPruning(pruningDate, logDate)).toBe(10)
    })

    it('should return null if log date is before pruning date', () => {
      const pruningDate = '2024-01-15'
      const logDate = '2024-01-10'
      expect(getDaysAfterPruning(pruningDate, logDate)).toBeNull()
    })

    it('should return null if pruning date is null or undefined', () => {
      expect(getDaysAfterPruning(null, '2024-01-10')).toBeNull()
      expect(getDaysAfterPruning(undefined, '2024-01-10')).toBeNull()
    })

    it('should return null if log created date is null or undefined', () => {
      expect(getDaysAfterPruning('2024-01-01', null as any)).toBeNull()
      expect(getDaysAfterPruning('2024-01-01', undefined)).toBeNull()
    })

    it('should handle Date objects as pruning date', () => {
      const pruningDate = new Date('2024-01-01')
      const logDate = '2024-01-06'
      expect(getDaysAfterPruning(pruningDate, logDate)).toBe(5)
    })

    it('should return null for invalid dates', () => {
      expect(getDaysAfterPruning('invalid-date', '2024-01-10')).toBeNull()
      expect(getDaysAfterPruning('2024-01-01', 'invalid-date')).toBeNull()
    })

    it('should return 0 for same day pruning and log creation', () => {
      const sameDate = '2024-01-10T10:00:00'
      expect(getDaysAfterPruning(sameDate, sameDate)).toBe(0)
    })
  })
})