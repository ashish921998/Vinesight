import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * Tests for utility functions in logs/page.tsx
 * 
 * INSTALLATION REQUIRED:
 * npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
 * 
 * RUN TESTS:
 * npm test
 */

// Utility function from logs/page.tsx - extracted for testing
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

describe('formatLogDate', () => {
  let originalDate: typeof Date

  beforeEach(() => {
    // Save original Date
    originalDate = global.Date
  })

  afterEach(() => {
    // Restore original Date
    global.Date = originalDate
  })

  describe('Happy Path', () => {
    it('should format today date correctly', () => {
      const now = new Date('2024-01-15T14:30:00')
      vi.setSystemTime(now)

      const result = formatLogDate('2024-01-15T14:30:00')
      expect(result).toMatch(/^today, \d{2}:\d{2}(am|pm)$/)
      expect(result).toContain('02:30pm')
    })

    it('should format yesterday date correctly with capital Y', () => {
      const now = new Date('2024-01-15T14:30:00')
      vi.setSystemTime(now)

      const result = formatLogDate('2024-01-14T10:15:00')
      expect(result).toMatch(/^Yesterday, \d{2}:\d{2}(am|pm)$/)
      expect(result).toContain('10:15am')
    })

    it('should format past dates with month abbreviation', () => {
      const now = new Date('2024-01-15T14:30:00')
      vi.setSystemTime(now)

      const result = formatLogDate('2024-01-10T09:00:00')
      expect(result).toContain('Jan')
      expect(result).toContain('10')
    })

    it('should handle morning times correctly', () => {
      const now = new Date('2024-01-15T14:30:00')
      vi.setSystemTime(now)

      const result = formatLogDate('2024-01-15T09:30:00')
      expect(result).toContain('09:30am')
    })

    it('should handle afternoon times correctly', () => {
      const now = new Date('2024-01-15T09:30:00')
      vi.setSystemTime(now)

      const result = formatLogDate('2024-01-15T15:45:00')
      expect(result).toContain('03:45pm')
    })

    it('should handle midnight correctly', () => {
      const now = new Date('2024-01-15T14:30:00')
      vi.setSystemTime(now)

      const result = formatLogDate('2024-01-15T00:00:00')
      expect(result).toContain('12:00am')
    })

    it('should handle noon correctly', () => {
      const now = new Date('2024-01-15T14:30:00')
      vi.setSystemTime(now)

      const result = formatLogDate('2024-01-15T12:00:00')
      expect(result).toContain('12:00pm')
    })
  })

  describe('Edge Cases', () => {
    it('should return "Invalid date" for invalid date string', () => {
      const result = formatLogDate('not-a-date')
      expect(result).toBe('Invalid date')
    })

    it('should return "Invalid date" for empty string', () => {
      const result = formatLogDate('')
      expect(result).toBe('Invalid date')
    })

    it('should return "Invalid date" for null-like string', () => {
      const result = formatLogDate('null')
      expect(result).toBe('Invalid date')
    })

    it('should handle ISO 8601 format', () => {
      const now = new Date('2024-01-15T14:30:00Z')
      vi.setSystemTime(now)

      const result = formatLogDate('2024-01-15T14:30:00Z')
      expect(result).toBeDefined()
      expect(result).not.toBe('Invalid date')
    })

    it('should handle date string without time', () => {
      const result = formatLogDate('2024-01-15')
      expect(result).toBeDefined()
      expect(result).not.toBe('Invalid date')
    })

    it('should handle future dates', () => {
      const now = new Date('2024-01-15T14:30:00')
      vi.setSystemTime(now)

      const result = formatLogDate('2024-01-20T10:00:00')
      expect(result).toContain('Jan')
      expect(result).toContain('20')
    })

    it('should handle dates from different years', () => {
      const now = new Date('2024-01-15T14:30:00')
      vi.setSystemTime(now)

      const result = formatLogDate('2023-12-25T10:00:00')
      expect(result).toContain('Dec')
      expect(result).toContain('25')
    })
  })

  describe('Boundary Conditions', () => {
    it('should handle date at exact midnight boundary', () => {
      const now = new Date('2024-01-15T00:00:00')
      vi.setSystemTime(now)

      const result = formatLogDate('2024-01-15T00:00:00')
      expect(result).toMatch(/^today/)
    })

    it('should handle date at exact end of day boundary', () => {
      const now = new Date('2024-01-15T23:59:59')
      vi.setSystemTime(now)

      const result = formatLogDate('2024-01-15T23:59:59')
      expect(result).toMatch(/^today/)
    })

    it('should handle transition between yesterday and today correctly', () => {
      const now = new Date('2024-01-15T00:01:00')
      vi.setSystemTime(now)

      const yesterdayResult = formatLogDate('2024-01-14T23:59:00')
      expect(yesterdayResult).toMatch(/^Yesterday/)

      const todayResult = formatLogDate('2024-01-15T00:00:00')
      expect(todayResult).toMatch(/^today/)
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed ISO dates gracefully', () => {
      const result = formatLogDate('2024-13-45T99:99:99')
      expect(result).toBe('Invalid date')
    })

    it('should handle extremely old dates', () => {
      const result = formatLogDate('1900-01-01T00:00:00')
      expect(result).toBeDefined()
      expect(result).not.toBe('Invalid date')
    })

    it('should handle dates with unusual formatting', () => {
      const result = formatLogDate('01/15/2024')
      expect(result).toBeDefined()
      expect(result).not.toBe('Invalid date')
    })
  })
})

describe('getDaysAfterPruning', () => {
  describe('Happy Path', () => {
    it('should calculate days correctly for same day', () => {
      const pruningDate = new Date('2024-01-15')
      const logDate = '2024-01-15T10:00:00'

      const result = getDaysAfterPruning(pruningDate, logDate)
      expect(result).toBe(0)
    })

    it('should calculate days correctly for 1 day after pruning', () => {
      const pruningDate = new Date('2024-01-15')
      const logDate = '2024-01-16T10:00:00'

      const result = getDaysAfterPruning(pruningDate, logDate)
      expect(result).toBe(1)
    })

    it('should calculate days correctly for 30 days after pruning', () => {
      const pruningDate = new Date('2024-01-01')
      const logDate = '2024-01-31T10:00:00'

      const result = getDaysAfterPruning(pruningDate, logDate)
      expect(result).toBe(30)
    })

    it('should calculate days correctly for 365 days after pruning', () => {
      const pruningDate = new Date('2024-01-01')
      const logDate = '2025-01-01T00:00:00'

      const result = getDaysAfterPruning(pruningDate, logDate)
      expect(result).toBe(366) // 2024 is a leap year
    })

    it('should accept pruning date as string', () => {
      const pruningDate = '2024-01-15'
      const logDate = '2024-01-20T10:00:00'

      const result = getDaysAfterPruning(pruningDate, logDate)
      expect(result).toBe(5)
    })

    it('should accept pruning date as Date object', () => {
      const pruningDate = new Date('2024-01-15')
      const logDate = '2024-01-20T10:00:00'

      const result = getDaysAfterPruning(pruningDate, logDate)
      expect(result).toBe(5)
    })
  })

  describe('Edge Cases', () => {
    it('should return null when pruning date is null', () => {
      const result = getDaysAfterPruning(null, '2024-01-15T10:00:00')
      expect(result).toBeNull()
    })

    it('should return null when pruning date is undefined', () => {
      const result = getDaysAfterPruning(undefined, '2024-01-15T10:00:00')
      expect(result).toBeNull()
    })

    it('should return null when log date is missing', () => {
      const pruningDate = new Date('2024-01-15')
      const result = getDaysAfterPruning(pruningDate, undefined)
      expect(result).toBeNull()
    })

    it('should return null when log date is empty string', () => {
      const pruningDate = new Date('2024-01-15')
      const result = getDaysAfterPruning(pruningDate, '')
      expect(result).toBeNull()
    })

    it('should return null when both dates are missing', () => {
      const result = getDaysAfterPruning(null, undefined)
      expect(result).toBeNull()
    })

    it('should return null when pruning date is invalid', () => {
      const pruningDate = 'invalid-date'
      const logDate = '2024-01-15T10:00:00'

      const result = getDaysAfterPruning(pruningDate, logDate)
      expect(result).toBeNull()
    })

    it('should return null when log date is invalid', () => {
      const pruningDate = new Date('2024-01-15')
      const logDate = 'invalid-date'

      const result = getDaysAfterPruning(pruningDate, logDate)
      expect(result).toBeNull()
    })

    it('should return null when log date is before pruning date', () => {
      const pruningDate = new Date('2024-01-15')
      const logDate = '2024-01-10T10:00:00'

      const result = getDaysAfterPruning(pruningDate, logDate)
      expect(result).toBeNull()
    })

    it('should handle negative days correctly (return null)', () => {
      const pruningDate = new Date('2024-01-20')
      const logDate = '2024-01-15T10:00:00'

      const result = getDaysAfterPruning(pruningDate, logDate)
      expect(result).toBeNull()
    })
  })

  describe('Boundary Conditions', () => {
    it('should handle dates at midnight boundary', () => {
      const pruningDate = new Date('2024-01-15T00:00:00')
      const logDate = '2024-01-16T00:00:00'

      const result = getDaysAfterPruning(pruningDate, logDate)
      expect(result).toBe(1)
    })

    it('should handle dates with millisecond precision', () => {
      const pruningDate = new Date('2024-01-15T00:00:00.000')
      const logDate = '2024-01-15T23:59:59.999'

      const result = getDaysAfterPruning(pruningDate, logDate)
      expect(result).toBe(0)
    })

    it('should floor partial days correctly', () => {
      const pruningDate = new Date('2024-01-15T12:00:00')
      const logDate = '2024-01-16T11:59:59'

      const result = getDaysAfterPruning(pruningDate, logDate)
      expect(result).toBe(0) // Less than 24 hours
    })

    it('should handle leap year calculations', () => {
      const pruningDate = new Date('2024-02-28')
      const logDate = '2024-03-01T00:00:00'

      const result = getDaysAfterPruning(pruningDate, logDate)
      expect(result).toBe(2) // 2024 is a leap year, so Feb has 29 days
    })
  })

  describe('Error Handling', () => {
    it('should handle Date object with invalid time', () => {
      const pruningDate = new Date('invalid')
      const logDate = '2024-01-15T10:00:00'

      const result = getDaysAfterPruning(pruningDate, logDate)
      expect(result).toBeNull()
    })

    it('should handle extremely large date differences', () => {
      const pruningDate = new Date('2000-01-01')
      const logDate = '2024-01-01T00:00:00'

      const result = getDaysAfterPruning(pruningDate, logDate)
      expect(result).toBeGreaterThan(8700) // Approximate days in 24 years
    })

    it('should handle timezone differences gracefully', () => {
      const pruningDate = new Date('2024-01-15T00:00:00Z')
      const logDate = '2024-01-16T00:00:00Z'

      const result = getDaysAfterPruning(pruningDate, logDate)
      expect(result).toBe(1)
    })
  })
})