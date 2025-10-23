/**
 * Tests for UI changes and responsive behavior in ActivityFeed
 * Tests truncation, responsive classes, and visual improvements
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { ActivityFeed } from '@/components/farm-details/ActivityFeed'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  })),
}))

jest.mock('@/lib/activity-display-utils', () => ({
  groupActivitiesByDate: jest.fn((activities) => [
    {
      date: 'Test Date',
      activities: activities || [],
      totalCount: activities?.length || 0,
      logTypes: ['irrigation'],
    },
  ]),
  getGroupedActivitiesSummary: jest.fn(() => 'Test summary'),
  formatGroupedDate: jest.fn(() => 'Today'),
  normalizeDateToYYYYMMDD: jest.fn(() => '2023-10-20'),
}))

jest.mock('@/lib/log-type-config', () => ({
  getLogTypeIcon: jest.fn(() => 'div'),
  getLogTypeBgColor: jest.fn(() => 'bg-blue-50'),
  getLogTypeColor: jest.fn(() => 'text-blue-600'),
}))

describe('Responsive UI in ActivityFeed', () => {
  const mockProps = {
    recentActivities: [
      {
        id: 1,
        type: 'irrigation',
        date: '2023-10-20T10:00:00Z',
        created_at: '2023-10-20T10:00:00Z',
        duration: 2,
      },
    ],
    pendingTasks: [],
    loading: false,
    onCompleteTask: jest.fn(),
    onEditRecord: jest.fn(),
    onDeleteRecord: jest.fn(),
    onEditDateGroup: jest.fn(),
    onDeleteDateGroup: jest.fn(),
  }

  describe('Text truncation classes', () => {
    it('should apply truncate class to date text', () => {
      const { container } = render(<ActivityFeed {...mockProps} />)

      const truncateElements = container.querySelectorAll('.truncate')
      expect(truncateElements.length).toBeGreaterThan(0)
    })

    it('should apply max-width classes for different screen sizes', () => {
      const { container } = render(<ActivityFeed {...mockProps} />)

      // Check for responsive max-width classes
      const smMaxWidth = container.querySelector('[class*="sm:max-w"]')
      expect(smMaxWidth).toBeInTheDocument()
    })

    it('should apply max-width to date display', () => {
      const { container } = render(<ActivityFeed {...mockProps} />)

      // Date should have responsive max-width
      const dateElement = container.querySelector('.truncate.max-w-\\[150px\\]')
      expect(dateElement).toBeInTheDocument()
    })

    it('should apply max-width to summary text', () => {
      const { container } = render(<ActivityFeed {...mockProps} />)

      // Summary should have different max-width
      const summaryElements = container.querySelectorAll('[class*="max-w-"]')
      expect(summaryElements.length).toBeGreaterThan(1)
    })

    it('should apply max-width to notes when present', () => {
      const propsWithNotes = {
        ...mockProps,
        recentActivities: [
          {
            ...mockProps.recentActivities[0],
            notes: 'This is a test note that should be truncated appropriately',
          },
        ],
      }

      const { container } = render(<ActivityFeed {...propsWithNotes} />)

      const noteElements = container.querySelectorAll('.truncate[class*="max-w-"]')
      expect(noteElements.length).toBeGreaterThan(0)
    })
  })

  describe('Responsive classes', () => {
    it('should use flex-col on small screens', () => {
      const { container } = render(<ActivityFeed {...mockProps} />)

      const flexColElement = container.querySelector('.flex-col')
      expect(flexColElement).toBeInTheDocument()
    })

    it('should switch to flex-row on sm breakpoint', () => {
      const { container } = render(<ActivityFeed {...mockProps} />)

      const responsiveFlexElement = container.querySelector('[class*="sm:flex-row"]')
      expect(responsiveFlexElement).toBeInTheDocument()
    })

    it('should align items differently on small vs large screens', () => {
      const { container } = render(<ActivityFeed {...mockProps} />)

      const alignElement = container.querySelector('[class*="sm:items-center"]')
      expect(alignElement).toBeInTheDocument()
    })
  })

  describe('Hover effects', () => {
    it('should apply hover:shadow-md class to activity container', () => {
      const { container } = render(<ActivityFeed {...mockProps} />)

      const hoverElement = container.querySelector('.hover\\:shadow-md')
      expect(hoverElement).toBeInTheDocument()
    })

    it('should apply cursor-pointer class for interactivity', () => {
      const { container } = render(<ActivityFeed {...mockProps} />)

      const cursorElement = container.querySelector('.cursor-pointer')
      expect(cursorElement).toBeInTheDocument()
    })

    it('should apply transition-colors class', () => {
      const { container } = render(<ActivityFeed {...mockProps} />)

      const transitionElement = container.querySelector('.transition-colors')
      expect(transitionElement).toBeInTheDocument()
    })

    it('should combine hover classes correctly', () => {
      const { container } = render(<ActivityFeed {...mockProps} />)

      const hoverContainer = container.querySelector('.hover\\:bg-gray-100.hover\\:shadow-md')
      expect(hoverContainer).toBeInTheDocument()
    })
  })

  describe('Layout improvements', () => {
    it('should use proper spacing with gap classes', () => {
      const { container } = render(<ActivityFeed {...mockProps} />)

      const gapElements = container.querySelectorAll('[class*="gap-"]')
      expect(gapElements.length).toBeGreaterThan(0)
    })

    it('should use padding classes appropriately', () => {
      const { container } = render(<ActivityFeed {...mockProps} />)

      const paddedElements = container.querySelectorAll('[class*="p-3"]')
      expect(paddedElements.length).toBeGreaterThan(0)
    })

    it('should use margin classes for spacing', () => {
      const { container } = render(<ActivityFeed {...mockProps} />)

      const marginElements = container.querySelectorAll('[class*="mb-"]')
      expect(marginElements.length).toBeGreaterThan(0)
    })

    it('should apply rounded corners', () => {
      const { container } = render(<ActivityFeed {...mockProps} />)

      const roundedElements = container.querySelectorAll('.rounded-lg')
      expect(roundedElements.length).toBeGreaterThan(0)
    })
  })

  describe('Long text handling', () => {
    it('should truncate very long activity notes', () => {
      const longNote =
        'This is an extremely long note that definitely exceeds sixty characters and should be truncated'
      const propsWithLongNote = {
        ...mockProps,
        recentActivities: [
          {
            ...mockProps.recentActivities[0],
            notes: longNote,
          },
        ],
      }

      render(<ActivityFeed {...propsWithLongNote} />)

      // Note should be truncated in display
      const truncatedText = screen.queryByText(longNote)
      expect(truncatedText).not.toBeInTheDocument()

      // Should show truncated version with ellipsis
      const truncatedNote = screen.getByText(/This is an extremely long note.*\.\.\./)
      expect(truncatedNote).toBeInTheDocument()
    })

    it('should handle short notes without truncation', () => {
      const shortNote = 'Short note'
      const propsWithShortNote = {
        ...mockProps,
        recentActivities: [
          {
            ...mockProps.recentActivities[0],
            notes: shortNote,
          },
        ],
      }

      render(<ActivityFeed {...propsWithShortNote} />)

      expect(screen.getByText(shortNote)).toBeInTheDocument()
    })

    it('should handle exactly 60 character notes', () => {
      const exactNote = 'A'.repeat(60)
      const propsWithExactNote = {
        ...mockProps,
        recentActivities: [
          {
            ...mockProps.recentActivities[0],
            notes: exactNote,
          },
        ],
      }

      render(<ActivityFeed {...propsWithExactNote} />)

      expect(screen.getByText(exactNote)).toBeInTheDocument()
    })

    it('should handle 61 character notes with truncation', () => {
      const slightlyLongNote = 'A'.repeat(61)
      const propsWithSlightlyLongNote = {
        ...mockProps,
        recentActivities: [
          {
            ...mockProps.recentActivities[0],
            notes: slightlyLongNote,
          },
        ],
      }

      render(<ActivityFeed {...propsWithSlightlyLongNote} />)

      // Should be truncated with ellipsis
      const fullNote = screen.queryByText(slightlyLongNote)
      expect(fullNote).not.toBeInTheDocument()
    })
  })

  describe('Visual hierarchy', () => {
    it('should use appropriate text sizes', () => {
      const { container } = render(<ActivityFeed {...mockProps} />)

      const smallText = container.querySelectorAll('.text-xs')
      const mediumText = container.querySelectorAll('.text-sm')

      expect(smallText.length).toBeGreaterThan(0)
      expect(mediumText.length).toBeGreaterThan(0)
    })

    it('should use font-medium for emphasis', () => {
      const { container } = render(<ActivityFeed {...mockProps} />)

      const mediumWeight = container.querySelectorAll('.font-medium')
      expect(mediumWeight.length).toBeGreaterThan(0)
    })

    it('should use appropriate text colors', () => {
      const { container } = render(<ActivityFeed {...mockProps} />)

      const grayText = container.querySelectorAll('[class*="text-gray"]')
      expect(grayText.length).toBeGreaterThan(0)
    })

    it('should use bg colors for visual separation', () => {
      const { container } = render(<ActivityFeed {...mockProps} />)

      const bgGray = container.querySelectorAll('.bg-gray-50')
      expect(bgGray.length).toBeGreaterThan(0)
    })
  })

  describe('Accessibility improvements', () => {
    it('should maintain min-w-0 for proper text truncation', () => {
      const { container } = render(<ActivityFeed {...mockProps} />)

      const minWidthElements = container.querySelectorAll('.min-w-0')
      expect(minWidthElements.length).toBeGreaterThan(0)
    })

    it('should use flex-shrink-0 to prevent icon squashing', () => {
      const { container } = render(<ActivityFeed {...mockProps} />)

      const flexShrinkElements = container.querySelectorAll('.flex-shrink-0')
      expect(flexShrinkElements.length).toBeGreaterThan(0)
    })

    it('should maintain items-start for proper alignment', () => {
      const { container } = render(<ActivityFeed {...mockProps} />)

      const alignStartElements = container.querySelectorAll('.items-start')
      expect(alignStartElements.length).toBeGreaterThan(0)
    })
  })

  describe('Card styling', () => {
    it('should apply border classes', () => {
      const { container } = render(<ActivityFeed {...mockProps} />)

      const borderElements = container.querySelectorAll('.border-gray-200')
      expect(borderElements.length).toBeGreaterThan(0)
    })

    it('should use white background for cards', () => {
      const { container } = render(<ActivityFeed {...mockProps} />)

      const whiteBg = container.querySelectorAll('.bg-white')
      expect(whiteBg.length).toBeGreaterThan(0)
    })

    it('should apply shadow classes', () => {
      const { container } = render(<ActivityFeed {...mockProps} />)

      const shadowElements = container.querySelectorAll('[class*="shadow"]')
      expect(shadowElements.length).toBeGreaterThan(0)
    })
  })

  describe('Badge styling', () => {
    it('should render badge for activity count', () => {
      render(<ActivityFeed {...mockProps} />)

      // Badge should be present
      const badge = screen.getByText('1')
      expect(badge).toBeInTheDocument()
    })

    it('should apply text-xs to badges', () => {
      const { container } = render(<ActivityFeed {...mockProps} />)

      const badges = container.querySelectorAll('.text-xs')
      expect(badges.length).toBeGreaterThan(0)
    })
  })

  describe('Empty states', () => {
    it('should handle empty activities gracefully', () => {
      const emptyProps = {
        ...mockProps,
        recentActivities: [],
      }

      const { container } = render(<ActivityFeed {...emptyProps} />)

      expect(screen.getByText(/Recent Activities/)).toBeInTheDocument()
    })

    it('should not break layout with missing optional fields', () => {
      const minimalActivity = {
        id: 1,
        type: 'irrigation',
        date: '2023-10-20T10:00:00Z',
        created_at: '2023-10-20T10:00:00Z',
      }

      const minimalProps = {
        ...mockProps,
        recentActivities: [minimalActivity],
      }

      const { container } = render(<ActivityFeed {...minimalProps} />)

      expect(container).toBeInTheDocument()
      expect(screen.getByText(/Recent Activities/)).toBeInTheDocument()
    })
  })
})