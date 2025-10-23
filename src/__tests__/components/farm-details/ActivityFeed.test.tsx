/**
 * Unit tests for ActivityFeed component
 * Tests click handlers, event propagation, and UI interactions
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ActivityFeed } from '@/components/farm-details/ActivityFeed'
import { useRouter } from 'next/navigation'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/lib/activity-display-utils', () => ({
  groupActivitiesByDate: jest.fn(),
  getGroupedActivitiesSummary: jest.fn(),
  formatGroupedDate: jest.fn(),
  normalizeDateToYYYYMMDD: jest.fn(),
}))

jest.mock('@/lib/log-type-config', () => ({
  getLogTypeIcon: jest.fn(() => 'div'),
  getLogTypeBgColor: jest.fn(() => 'bg-blue-50'),
  getLogTypeColor: jest.fn(() => 'text-blue-600'),
}))

// Import mocked modules for assertions
import {
  groupActivitiesByDate,
  getGroupedActivitiesSummary,
  formatGroupedDate,
  normalizeDateToYYYYMMDD,
} from '@/lib/activity-display-utils'

describe('ActivityFeed', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
  }

  const mockOnCompleteTask = jest.fn()
  const mockOnEditRecord = jest.fn()
  const mockOnDeleteRecord = jest.fn()
  const mockOnEditDateGroup = jest.fn()
  const mockOnDeleteDateGroup = jest.fn()

  const mockActivities = [
    {
      id: 1,
      type: 'irrigation',
      date: '2023-10-20T10:00:00Z',
      created_at: '2023-10-20T10:00:00Z',
      duration: 2,
      notes: 'Regular irrigation',
    },
    {
      id: 2,
      type: 'spray',
      date: '2023-10-20T11:00:00Z',
      created_at: '2023-10-20T11:00:00Z',
      chemical: 'Pesticide A',
      notes: 'Pest control spray',
    },
  ]

  const mockPendingTasks = [
    {
      id: 1,
      title: 'Fertilize crops',
      task_type: 'fertilization',
      due_date: '2023-10-25',
    },
  ]

  const mockGroupedActivities = [
    {
      date: 'Fri Oct 20 2023',
      activities: mockActivities,
      totalCount: 2,
      logTypes: ['irrigation', 'spray'],
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(groupActivitiesByDate as jest.Mock).mockReturnValue(mockGroupedActivities)
    ;(getGroupedActivitiesSummary as jest.Mock).mockReturnValue('2 logs: irrigation & spray')
    ;(formatGroupedDate as jest.Mock).mockReturnValue('Today')
    ;(normalizeDateToYYYYMMDD as jest.Mock).mockReturnValue('2023-10-20')
  })

  describe('Loading state', () => {
    it('should render loading skeleton when loading is true', () => {
      const { container } = render(
        <ActivityFeed
          recentActivities={[]}
          pendingTasks={[]}
          loading={true}
          onCompleteTask={mockOnCompleteTask}
          onEditRecord={mockOnEditRecord}
          onDeleteRecord={mockOnDeleteRecord}
        />
      )

      const loadingElements = container.querySelectorAll('.animate-pulse')
      expect(loadingElements.length).toBeGreaterThan(0)
    })

    it('should render multiple loading placeholders', () => {
      const { container } = render(
        <ActivityFeed
          recentActivities={[]}
          pendingTasks={[]}
          loading={true}
          onCompleteTask={mockOnCompleteTask}
          onEditRecord={mockOnEditRecord}
          onDeleteRecord={mockOnDeleteRecord}
        />
      )

      const skeletonDivs = container.querySelectorAll('.bg-gray-200.rounded.animate-pulse')
      expect(skeletonDivs.length).toBeGreaterThan(3)
    })
  })

  describe('Pending tasks display', () => {
    it('should render pending tasks when available', () => {
      render(
        <ActivityFeed
          recentActivities={[]}
          pendingTasks={mockPendingTasks}
          loading={false}
          onCompleteTask={mockOnCompleteTask}
          onEditRecord={mockOnEditRecord}
          onDeleteRecord={mockOnDeleteRecord}
        />
      )

      expect(screen.getByText('Fertilize crops')).toBeInTheDocument()
      expect(screen.getByText(/Pending Tasks/)).toBeInTheDocument()
    })

    it('should call onCompleteTask when Complete button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <ActivityFeed
          recentActivities={[]}
          pendingTasks={mockPendingTasks}
          loading={false}
          onCompleteTask={mockOnCompleteTask}
          onEditRecord={mockOnEditRecord}
          onDeleteRecord={mockOnDeleteRecord}
        />
      )

      const completeButton = screen.getByText('Complete')
      await user.click(completeButton)

      expect(mockOnCompleteTask).toHaveBeenCalledWith(1)
    })

    it('should not render pending tasks section when list is empty', () => {
      render(
        <ActivityFeed
          recentActivities={[]}
          pendingTasks={[]}
          loading={false}
          onCompleteTask={mockOnCompleteTask}
          onEditRecord={mockOnEditRecord}
          onDeleteRecord={mockOnDeleteRecord}
        />
      )

      expect(screen.queryByText(/Pending Tasks/)).not.toBeInTheDocument()
    })

    it('should limit displayed tasks to first 3', () => {
      const manyTasks = Array.from({ length: 10 }, (_, i) => ({
        id: i,
        title: `Task ${i}`,
        task_type: 'test',
        due_date: '2023-10-25',
      }))

      const { container } = render(
        <ActivityFeed
          recentActivities={[]}
          pendingTasks={manyTasks}
          loading={false}
          onCompleteTask={mockOnCompleteTask}
          onEditRecord={mockOnEditRecord}
          onDeleteRecord={mockOnDeleteRecord}
        />
      )

      const taskElements = container.querySelectorAll('.bg-white.rounded-xl')
      expect(taskElements.length).toBeLessThanOrEqual(3)
    })
  })

  describe('Recent activities display', () => {
    it('should render recent activities', () => {
      render(
        <ActivityFeed
          recentActivities={mockActivities}
          pendingTasks={[]}
          loading={false}
          onCompleteTask={mockOnCompleteTask}
          onEditRecord={mockOnEditRecord}
          onDeleteRecord={mockOnDeleteRecord}
          onEditDateGroup={mockOnEditDateGroup}
          onDeleteDateGroup={mockOnDeleteDateGroup}
        />
      )

      expect(screen.getByText(/Recent Activities/)).toBeInTheDocument()
    })

    it('should display grouped activities summary', () => {
      render(
        <ActivityFeed
          recentActivities={mockActivities}
          pendingTasks={[]}
          loading={false}
          onCompleteTask={mockOnCompleteTask}
          onEditRecord={mockOnEditRecord}
          onDeleteRecord={mockOnDeleteRecord}
          onEditDateGroup={mockOnEditDateGroup}
          onDeleteDateGroup={mockOnDeleteDateGroup}
        />
      )

      expect(screen.getByText('2 logs: irrigation & spray')).toBeInTheDocument()
    })

    it('should limit displayed activities to first 5 groups', () => {
      const manyGroups = Array.from({ length: 10 }, (_, i) => ({
        date: `Date ${i}`,
        activities: [mockActivities[0]],
        totalCount: 1,
        logTypes: ['irrigation'],
      }))
      ;(groupActivitiesByDate as jest.Mock).mockReturnValue(manyGroups)

      const { container } = render(
        <ActivityFeed
          recentActivities={mockActivities}
          pendingTasks={[]}
          loading={false}
          onCompleteTask={mockOnCompleteTask}
          onEditRecord={mockOnEditRecord}
          onDeleteRecord={mockOnDeleteRecord}
          onEditDateGroup={mockOnEditDateGroup}
          onDeleteDateGroup={mockOnDeleteDateGroup}
        />
      )

      // Should only show 5 groups
      const activityGroups = container.querySelectorAll('.bg-gray-50.rounded-lg')
      expect(activityGroups.length).toBeLessThanOrEqual(5)
    })
  })

  describe('Click handlers and event propagation', () => {
    it('should call onEditDateGroup when activity group container is clicked', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <ActivityFeed
          recentActivities={mockActivities}
          pendingTasks={[]}
          loading={false}
          onCompleteTask={mockOnCompleteTask}
          onEditRecord={mockOnEditRecord}
          onDeleteRecord={mockOnDeleteRecord}
          onEditDateGroup={mockOnEditDateGroup}
          onDeleteDateGroup={mockOnDeleteDateGroup}
        />
      )

      const activityContainer = container.querySelector('.cursor-pointer.hover\\:shadow-md')
      expect(activityContainer).toBeInTheDocument()

      if (activityContainer) {
        await user.click(activityContainer)
        expect(mockOnEditDateGroup).toHaveBeenCalledWith('2023-10-20', mockActivities)
      }
    })

    it('should not call onEditDateGroup if callback is not provided', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <ActivityFeed
          recentActivities={mockActivities}
          pendingTasks={[]}
          loading={false}
          onCompleteTask={mockOnCompleteTask}
          onEditRecord={mockOnEditRecord}
          onDeleteRecord={mockOnDeleteRecord}
        />
      )

      const activityContainer = container.querySelector('.cursor-pointer')
      if (activityContainer) {
        await user.click(activityContainer)
        // Should not throw error
        expect(mockOnEditDateGroup).not.toHaveBeenCalled()
      }
    })

    it('should stop event propagation when edit button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <ActivityFeed
          recentActivities={mockActivities}
          pendingTasks={[]}
          loading={false}
          onCompleteTask={mockOnCompleteTask}
          onEditRecord={mockOnEditRecord}
          onDeleteRecord={mockOnDeleteRecord}
          onEditDateGroup={mockOnEditDateGroup}
          onDeleteDateGroup={mockOnDeleteDateGroup}
        />
      )

      const editButtons = screen.getAllByTitle(/Edit/)
      await user.click(editButtons[0])

      // onEditDateGroup should be called with normalized date
      expect(mockOnEditDateGroup).toHaveBeenCalledWith('2023-10-20', mockActivities)
      // Container click handler should not be triggered due to stopPropagation
      expect(mockOnEditDateGroup).toHaveBeenCalledTimes(1)
    })

    it('should stop event propagation when delete button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <ActivityFeed
          recentActivities={mockActivities}
          pendingTasks={[]}
          loading={false}
          onCompleteTask={mockOnCompleteTask}
          onEditRecord={mockOnEditRecord}
          onDeleteRecord={mockOnDeleteRecord}
          onEditDateGroup={mockOnEditDateGroup}
          onDeleteDateGroup={mockOnDeleteDateGroup}
        />
      )

      const deleteButtons = screen.getAllByTitle(/Delete/)
      await user.click(deleteButtons[0])

      expect(mockOnDeleteDateGroup).toHaveBeenCalledWith('Fri Oct 20 2023', mockActivities)
      // Should only be called once (no propagation to container)
      expect(mockOnDeleteDateGroup).toHaveBeenCalledTimes(1)
    })

    it('should call onDeleteDateGroup with correct parameters', async () => {
      const user = userEvent.setup()
      render(
        <ActivityFeed
          recentActivities={mockActivities}
          pendingTasks={[]}
          loading={false}
          onCompleteTask={mockOnCompleteTask}
          onEditRecord={mockOnEditRecord}
          onDeleteRecord={mockOnDeleteRecord}
          onEditDateGroup={mockOnEditDateGroup}
          onDeleteDateGroup={mockOnDeleteDateGroup}
        />
      )

      const deleteButtons = screen.getAllByTitle(/Delete all logs for this date/)
      await user.click(deleteButtons[0])

      expect(mockOnDeleteDateGroup).toHaveBeenCalledWith('Fri Oct 20 2023', mockActivities)
    })
  })

  describe('UI styling and responsiveness', () => {
    it('should apply cursor-pointer class to activity container', () => {
      const { container } = render(
        <ActivityFeed
          recentActivities={mockActivities}
          pendingTasks={[]}
          loading={false}
          onCompleteTask={mockOnCompleteTask}
          onEditRecord={mockOnEditRecord}
          onDeleteRecord={mockOnDeleteRecord}
          onEditDateGroup={mockOnEditDateGroup}
          onDeleteDateGroup={mockOnDeleteDateGroup}
        />
      )

      const activityContainer = container.querySelector('.cursor-pointer')
      expect(activityContainer).toBeInTheDocument()
    })

    it('should apply hover:shadow-md class to activity container', () => {
      const { container } = render(
        <ActivityFeed
          recentActivities={mockActivities}
          pendingTasks={[]}
          loading={false}
          onCompleteTask={mockOnCompleteTask}
          onEditRecord={mockOnEditRecord}
          onDeleteRecord={mockOnDeleteRecord}
          onEditDateGroup={mockOnEditDateGroup}
          onDeleteDateGroup={mockOnDeleteDateGroup}
        />
      )

      const activityContainer = container.querySelector('.hover\\:shadow-md')
      expect(activityContainer).toBeInTheDocument()
    })

    it('should apply truncate classes for responsive text', () => {
      const { container } = render(
        <ActivityFeed
          recentActivities={mockActivities}
          pendingTasks={[]}
          loading={false}
          onCompleteTask={mockOnCompleteTask}
          onEditRecord={mockOnEditRecord}
          onDeleteRecord={mockOnDeleteRecord}
          onEditDateGroup={mockOnEditDateGroup}
          onDeleteDateGroup={mockOnDeleteDateGroup}
        />
      )

      const truncateElements = container.querySelectorAll('.truncate')
      expect(truncateElements.length).toBeGreaterThan(0)
    })

    it('should have responsive max-width classes', () => {
      const { container } = render(
        <ActivityFeed
          recentActivities={mockActivities}
          pendingTasks={[]}
          loading={false}
          onCompleteTask={mockOnCompleteTask}
          onEditRecord={mockOnEditRecord}
          onDeleteRecord={mockOnDeleteRecord}
          onEditDateGroup={mockOnEditDateGroup}
          onDeleteDateGroup={mockOnDeleteDateGroup}
        />
      )

      const smMaxWidth = container.querySelector('[class*="sm:max-w"]')
      expect(smMaxWidth).toBeInTheDocument()
    })
  })

  describe('Activity notes display', () => {
    it('should display activity notes when available', () => {
      render(
        <ActivityFeed
          recentActivities={mockActivities}
          pendingTasks={[]}
          loading={false}
          onCompleteTask={mockOnCompleteTask}
          onEditRecord={mockOnEditRecord}
          onDeleteRecord={mockOnDeleteRecord}
          onEditDateGroup={mockOnEditDateGroup}
          onDeleteDateGroup={mockOnDeleteDateGroup}
        />
      )

      expect(screen.getByText(/Regular irrigation/)).toBeInTheDocument()
    })

    it('should truncate long notes to 60 characters', () => {
      const longNoteActivity = {
        id: 3,
        type: 'spray',
        date: '2023-10-21T10:00:00Z',
        created_at: '2023-10-21T10:00:00Z',
        notes: 'This is a very long note that should be truncated after sixty characters to ensure proper display',
      }
      ;(groupActivitiesByDate as jest.Mock).mockReturnValue([
        {
          date: 'Sat Oct 21 2023',
          activities: [longNoteActivity],
          totalCount: 1,
          logTypes: ['spray'],
        },
      ])

      render(
        <ActivityFeed
          recentActivities={[longNoteActivity]}
          pendingTasks={[]}
          loading={false}
          onCompleteTask={mockOnCompleteTask}
          onEditRecord={mockOnEditRecord}
          onDeleteRecord={mockOnDeleteRecord}
          onEditDateGroup={mockOnEditDateGroup}
          onDeleteDateGroup={mockOnDeleteDateGroup}
        />
      )

      const noteText = screen.getByText(/This is a very long note that should be truncated after sixty.../)
      expect(noteText).toBeInTheDocument()
    })
  })

  describe('Multiple log types display', () => {
    it('should display log type icons when there are multiple types', () => {
      const { container } = render(
        <ActivityFeed
          recentActivities={mockActivities}
          pendingTasks={[]}
          loading={false}
          onCompleteTask={mockOnCompleteTask}
          onEditRecord={mockOnEditRecord}
          onDeleteRecord={mockOnDeleteRecord}
          onEditDateGroup={mockOnEditDateGroup}
          onDeleteDateGroup={mockOnDeleteDateGroup}
        />
      )

      // Should show icons for multiple log types
      const iconContainers = container.querySelectorAll('.items-center.gap-1.mt-2')
      expect(iconContainers.length).toBeGreaterThan(0)
    })

    it('should limit displayed log type icons to 4', () => {
      const manyTypes = Array.from({ length: 10 }, (_, i) => `type${i}`)
      ;(groupActivitiesByDate as jest.Mock).mockReturnValue([
        {
          date: 'Test Date',
          activities: mockActivities,
          totalCount: 10,
          logTypes: manyTypes,
        },
      ])

      render(
        <ActivityFeed
          recentActivities={mockActivities}
          pendingTasks={[]}
          loading={false}
          onCompleteTask={mockOnCompleteTask}
          onEditRecord={mockOnEditRecord}
          onDeleteRecord={mockOnDeleteRecord}
          onEditDateGroup={mockOnEditDateGroup}
          onDeleteDateGroup={mockOnDeleteDateGroup}
        />
      )

      // Implementation shows up to 4 icons
      expect(getLogTypeIcon).toHaveBeenCalledTimes(4)
    })
  })

  describe('Edge cases', () => {
    it('should handle empty activities array', () => {
      ;(groupActivitiesByDate as jest.Mock).mockReturnValue([])

      render(
        <ActivityFeed
          recentActivities={[]}
          pendingTasks={[]}
          loading={false}
          onCompleteTask={mockOnCompleteTask}
          onEditRecord={mockOnEditRecord}
          onDeleteRecord={mockOnDeleteRecord}
          onEditDateGroup={mockOnEditDateGroup}
          onDeleteDateGroup={mockOnDeleteDateGroup}
        />
      )

      expect(screen.getByText(/Recent Activities/)).toBeInTheDocument()
    })

    it('should handle null normalizeDateToYYYYMMDD result gracefully', async () => {
      const user = userEvent.setup()
      ;(normalizeDateToYYYYMMDD as jest.Mock).mockReturnValue(null)

      const { container } = render(
        <ActivityFeed
          recentActivities={mockActivities}
          pendingTasks={[]}
          loading={false}
          onCompleteTask={mockOnCompleteTask}
          onEditRecord={mockOnEditRecord}
          onDeleteRecord={mockOnDeleteRecord}
          onEditDateGroup={mockOnEditDateGroup}
          onDeleteDateGroup={mockOnDeleteDateGroup}
        />
      )

      const activityContainer = container.querySelector('.cursor-pointer')
      if (activityContainer) {
        await user.click(activityContainer)
        // Should not call onEditDateGroup if date normalization returns null
        expect(mockOnEditDateGroup).not.toHaveBeenCalled()
      }
    })

    it('should handle activities without notes', () => {
      const noNotesActivity = {
        id: 4,
        type: 'irrigation',
        date: '2023-10-22T10:00:00Z',
        created_at: '2023-10-22T10:00:00Z',
        duration: 1,
      }
      ;(groupActivitiesByDate as jest.Mock).mockReturnValue([
        {
          date: 'Sun Oct 22 2023',
          activities: [noNotesActivity],
          totalCount: 1,
          logTypes: ['irrigation'],
        },
      ])

      const { container } = render(
        <ActivityFeed
          recentActivities={[noNotesActivity]}
          pendingTasks={[]}
          loading={false}
          onCompleteTask={mockOnCompleteTask}
          onEditRecord={mockOnEditRecord}
          onDeleteRecord={mockOnDeleteRecord}
          onEditDateGroup={mockOnEditDateGroup}
          onDeleteDateGroup={mockOnDeleteDateGroup}
        />
      )

      // Notes section should not be rendered
      const noteElements = container.querySelectorAll('.text-xs.text-gray-500.break-words')
      expect(noteElements.length).toBe(0)
    })
  })
})