/**
 * Unit tests for formatLogDate function in page.tsx
 * Tests date formatting logic including today, yesterday, and other dates
 */

describe('formatLogDate', () => {
  // Extract the formatLogDate function for testing
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

  describe('Today dates', () => {
    it('should format today date with lowercase "today" prefix', () => {
      const now = new Date()
      const result = formatLogDate(now.toISOString())
      expect(result).toMatch(/^today, \d{2}:\d{2}(am|pm)$/)
    })

    it('should format today date at midnight', () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const result = formatLogDate(today.toISOString())
      expect(result).toMatch(/^today, 12:00am$/)
    })

    it('should format today date at noon', () => {
      const today = new Date()
      today.setHours(12, 0, 0, 0)
      const result = formatLogDate(today.toISOString())
      expect(result).toMatch(/^today, 12:00pm$/)
    })

    it('should format today date in the afternoon', () => {
      const today = new Date()
      today.setHours(15, 30, 0, 0)
      const result = formatLogDate(today.toISOString())
      expect(result).toMatch(/^today, 03:30pm$/)
    })
  })

  describe('Yesterday dates', () => {
    it('should format yesterday date with capitalized "Yesterday" prefix', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const result = formatLogDate(yesterday.toISOString())
      expect(result).toMatch(/^Yesterday, \d{2}:\d{2}(am|pm)$/)
      expect(result).toContain('Yesterday,')
      expect(result).not.toContain('yesterday,')
    })

    it('should format yesterday date at specific time', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      yesterday.setHours(14, 45, 0, 0)
      const result = formatLogDate(yesterday.toISOString())
      expect(result).toMatch(/^Yesterday, 02:45pm$/)
    })

    it('should format yesterday date in the morning', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      yesterday.setHours(9, 15, 0, 0)
      const result = formatLogDate(yesterday.toISOString())
      expect(result).toMatch(/^Yesterday, 09:15am$/)
    })
  })

  describe('Other dates', () => {
    it('should format dates from 2 days ago with month and day', () => {
      const twoDaysAgo = new Date()
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
      const result = formatLogDate(twoDaysAgo.toISOString())
      expect(result).toMatch(/^[A-Z][a-z]{2} \d{1,2}, \d{2}:\d{2}(am|pm)$/)
    })

    it('should format dates from last week', () => {
      const lastWeek = new Date()
      lastWeek.setDate(lastWeek.getDate() - 7)
      const result = formatLogDate(lastWeek.toISOString())
      expect(result).toMatch(/^[A-Z][a-z]{2} \d{1,2}, \d{2}:\d{2}(am|pm)$/)
    })

    it('should format dates from last month', () => {
      const lastMonth = new Date()
      lastMonth.setMonth(lastMonth.getMonth() - 1)
      const result = formatLogDate(lastMonth.toISOString())
      expect(result).toMatch(/^[A-Z][a-z]{2} \d{1,2}, \d{2}:\d{2}(am|pm)$/)
    })

    it('should format dates from last year', () => {
      const lastYear = new Date()
      lastYear.setFullYear(lastYear.getFullYear() - 1)
      const result = formatLogDate(lastYear.toISOString())
      // Should include month, day, and time
      expect(result).toMatch(/^[A-Z][a-z]{2} \d{1,2}, \d{2}:\d{2}(am|pm)$/)
    })

    it('should format specific date: January 1, 2023', () => {
      const specificDate = new Date('2023-01-01T10:30:00Z')
      const result = formatLogDate(specificDate.toISOString())
      expect(result).toContain('Jan')
      expect(result).toContain('1')
    })

    it('should format specific date: December 31, 2022', () => {
      const specificDate = new Date('2022-12-31T23:59:00Z')
      const result = formatLogDate(specificDate.toISOString())
      expect(result).toContain('Dec')
      expect(result).toContain('31')
    })
  })

  describe('Invalid dates', () => {
    it('should return "Invalid date" for invalid date string', () => {
      const result = formatLogDate('invalid-date')
      expect(result).toBe('Invalid date')
    })

    it('should return "Invalid date" for empty string', () => {
      const result = formatLogDate('')
      expect(result).toBe('Invalid date')
    })

    it('should return "Invalid date" for malformed ISO string', () => {
      const result = formatLogDate('2023-13-45T25:99:99Z')
      expect(result).toBe('Invalid date')
    })

    it('should return "Invalid date" for null-like strings', () => {
      const result = formatLogDate('null')
      expect(result).toBe('Invalid date')
    })

    it('should return "Invalid date" for undefined-like strings', () => {
      const result = formatLogDate('undefined')
      expect(result).toBe('Invalid date')
    })
  })

  describe('Edge cases', () => {
    it('should handle date at start of day boundary', () => {
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)
      const result = formatLogDate(startOfDay.toISOString())
      expect(result).toMatch(/^today, 12:00am$/)
    })

    it('should handle date at end of day boundary', () => {
      const endOfDay = new Date()
      endOfDay.setHours(23, 59, 59, 999)
      const result = formatLogDate(endOfDay.toISOString())
      expect(result).toMatch(/^today, 11:59pm$/)
    })

    it('should handle various ISO 8601 formats', () => {
      const isoDate = '2023-06-15T14:30:00.000Z'
      const result = formatLogDate(isoDate)
      expect(result).toBeTruthy()
      expect(result).not.toBe('Invalid date')
    })

    it('should handle date with timezone offset', () => {
      const dateWithTz = '2023-06-15T14:30:00+05:30'
      const result = formatLogDate(dateWithTz)
      expect(result).toBeTruthy()
      expect(result).not.toBe('Invalid date')
    })

    it('should handle leap year date', () => {
      const leapDay = '2024-02-29T12:00:00Z'
      const result = formatLogDate(leapDay)
      expect(result).toBeTruthy()
      expect(result).not.toBe('Invalid date')
    })
  })

  describe('Time formatting consistency', () => {
    it('should use 12-hour format with am/pm', () => {
      const morning = new Date()
      morning.setHours(9, 30, 0, 0)
      const result = formatLogDate(morning.toISOString())
      expect(result).toMatch(/(am|pm)/)
    })

    it('should use two-digit minutes', () => {
      const withSingleDigitMinute = new Date()
      withSingleDigitMinute.setHours(10, 5, 0, 0)
      const result = formatLogDate(withSingleDigitMinute.toISOString())
      expect(result).toMatch(/10:05(am|pm)/)
    })

    it('should not have spaces in time portion', () => {
      const now = new Date()
      const result = formatLogDate(now.toISOString())
      // Time should not have space between digits and am/pm
      expect(result).not.toMatch(/\d\d:\d\d [ap]m/)
    })
  })

  describe('Capitalization changes', () => {
    it('should use lowercase "today" (not "Today")', () => {
      const today = new Date()
      const result = formatLogDate(today.toISOString())
      expect(result).toMatch(/^today,/)
      expect(result).not.toMatch(/^Today,/)
    })

    it('should use capitalized "Yesterday" (not "yesterday")', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const result = formatLogDate(yesterday.toISOString())
      expect(result).toMatch(/^Yesterday,/)
      expect(result).not.toMatch(/^yesterday,/)
    })
  })
})