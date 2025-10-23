import { describe, it, expect } from 'vitest'
import {
  getActivityDisplayData,
  groupActivitiesByDate,
  getGroupedActivitiesSummary,
  formatGroupedDate,
  normalizeDateToYYYYMMDD,
  transformActivitiesToLogEntries
} from '@/lib/activity-display-utils'

describe('activity-display-utils', () => {
  describe('getActivityDisplayData', () => {
    it('should return "Unknown Activity" for null activity', () => {
      expect(getActivityDisplayData(null as any)).toBe('Unknown Activity')
    })

    it('should return "Unknown Activity" for activity without type', () => {
      const activity = { id: 1, date: '2024-01-01' } as any
      expect(getActivityDisplayData(activity)).toBe('Unknown Activity')
    })

    it('should format irrigation with duration', () => {
      const activity = {
        id: 1,
        type: 'irrigation',
        date: '2024-01-01',
        duration: 2.5,
        created_at: '2024-01-01'
      }
      expect(getActivityDisplayData(activity)).toBe('2.5 hrs')
    })

    it('should return "Irrigation" for irrigation without duration', () => {
      const activity = {
        id: 1,
        type: 'irrigation',
        date: '2024-01-01',
        created_at: '2024-01-01'
      }
      expect(getActivityDisplayData(activity)).toBe('Irrigation')
    })

    it('should handle irrigation with zero duration', () => {
      const activity = {
        id: 1,
        type: 'irrigation',
        date: '2024-01-01',
        duration: 0,
        created_at: '2024-01-01'
      }
      expect(getActivityDisplayData(activity)).toBe('Irrigation')
    })

    it('should format spray with chemicals array', () => {
      const activity = {
        id: 1,
        type: 'spray',
        date: '2024-01-01',
        chemicals: [
          { name: 'Pesticide A', quantity: 100, unit: 'ml' },
          { name: 'Pesticide B', quantity: 50, unit: 'gm' }
        ],
        created_at: '2024-01-01'
      }
      const result = getActivityDisplayData(activity)
      expect(result).toContain('Pesticide')
    })

    it('should format harvest with quantity', () => {
      const activity = {
        id: 1,
        type: 'harvest',
        date: '2024-01-01',
        quantity: 500,
        created_at: '2024-01-01'
      }
      expect(getActivityDisplayData(activity)).toBe('500 kg')
    })

    it('should format expense with cost', () => {
      const activity = {
        id: 1,
        type: 'expense',
        date: '2024-01-01',
        cost: 5000,
        created_at: '2024-01-01'
      }
      const result = getActivityDisplayData(activity)
      expect(result).toContain('₹')
      expect(result).toContain('5')
    })
  })

  describe('groupActivitiesByDate', () => {
    it('should group activities by date correctly', () => {
      const activities = [
        {
          id: 1,
          type: 'irrigation',
          date: '2024-01-15T10:00:00',
          created_at: '2024-01-15T10:00:00'
        },
        {
          id: 2,
          type: 'spray',
          date: '2024-01-15T14:00:00',
          created_at: '2024-01-15T14:00:00'
        },
        {
          id: 3,
          type: 'harvest',
          date: '2024-01-16T09:00:00',
          created_at: '2024-01-16T09:00:00'
        }
      ] as any

      const grouped = groupActivitiesByDate(activities)
      
      expect(grouped).toHaveLength(2)
      expect(grouped[0].totalCount).toBe(1)
      expect(grouped[1].totalCount).toBe(2)
    })

    it('should handle empty activity array', () => {
      const grouped = groupActivitiesByDate([])
      expect(grouped).toHaveLength(0)
    })
  })

  describe('normalizeDateToYYYYMMDD', () => {
    it('should return null for null input', () => {
      expect(normalizeDateToYYYYMMDD(null)).toBeNull()
    })

    it('should return already formatted YYYY-MM-DD dates', () => {
      expect(normalizeDateToYYYYMMDD('2024-01-15')).toBe('2024-01-15')
    })

    it('should extract YYYY-MM-DD from ISO strings', () => {
      expect(normalizeDateToYYYYMMDD('2024-01-15T10:30:00Z')).toBe('2024-01-15')
    })
  })
})