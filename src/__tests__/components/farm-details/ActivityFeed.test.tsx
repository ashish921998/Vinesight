import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ActivityFeed } from '@/components/farm-details/ActivityFeed'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn()
  })
}))

describe('ActivityFeed Component', () => {
  const mockOnCompleteTask = vi.fn()
  const mockOnEditRecord = vi.fn()
  const mockOnDeleteRecord = vi.fn()
  const mockOnEditDateGroup = vi.fn()
  const mockOnDeleteDateGroup = vi.fn()

  const defaultProps = {
    recentActivities: [],
    pendingTasks: [],
    loading: false,
    onCompleteTask: mockOnCompleteTask,
    onEditRecord: mockOnEditRecord,
    onDeleteRecord: mockOnDeleteRecord,
    onEditDateGroup: mockOnEditDateGroup,
    onDeleteDateGroup: mockOnDeleteDateGroup,
    farmId: '1'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render loading skeleton when loading', () => {
    render(<ActivityFeed {...defaultProps} loading={true} />)
    
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('should render empty state when no activities', () => {
    render(<ActivityFeed {...defaultProps} />)
    
    expect(screen.getByText(/No recent activities/i)).toBeInTheDocument()
  })

  it('should render pending tasks when available', () => {
    const pendingTasks = [
      {
        id: 1,
        title: 'Apply fertilizer',
        task_type: 'fertigation',
        due_date: '2024-01-20'
      }
    ]

    render(<ActivityFeed {...defaultProps} pendingTasks={pendingTasks} />)
    
    expect(screen.getByText(/Pending Tasks/i)).toBeInTheDocument()
    expect(screen.getByText('Apply fertilizer')).toBeInTheDocument()
  })

  it('should render recent activities grouped by date', () => {
    const activities = [
      {
        id: 1,
        type: 'irrigation',
        date: '2024-01-15T10:00:00',
        duration: 2,
        created_at: '2024-01-15T10:00:00'
      },
      {
        id: 2,
        type: 'spray',
        date: '2024-01-15T14:00:00',
        chemical: 'Pesticide A',
        created_at: '2024-01-15T14:00:00'
      }
    ]

    render(<ActivityFeed {...defaultProps} recentActivities={activities} />)
    
    expect(screen.getByText(/Recent Activities/i)).toBeInTheDocument()
    const badges = screen.getAllByText(/2 log/)
    expect(badges.length).toBeGreaterThan(0)
  })

  it('should show "See all logs" button when activities exist', () => {
    const activities = [
      {
        id: 1,
        type: 'irrigation',
        date: '2024-01-15T10:00:00',
        created_at: '2024-01-15T10:00:00'
      }
    ]

    render(<ActivityFeed {...defaultProps} recentActivities={activities} />)
    
    expect(screen.getByText(/See all logs/i)).toBeInTheDocument()
  })

  it('should limit pending tasks display to 3 items', () => {
    const pendingTasks = [
      { id: 1, title: 'Task 1', task_type: 'irrigation', due_date: '2024-01-20' },
      { id: 2, title: 'Task 2', task_type: 'spray', due_date: '2024-01-21' },
      { id: 3, title: 'Task 3', task_type: 'harvest', due_date: '2024-01-22' },
      { id: 4, title: 'Task 4', task_type: 'expense', due_date: '2024-01-23' }
    ]

    render(<ActivityFeed {...defaultProps} pendingTasks={pendingTasks} />)
    
    expect(screen.getByText('Task 1')).toBeInTheDocument()
    expect(screen.getByText('Task 2')).toBeInTheDocument()
    expect(screen.getByText('Task 3')).toBeInTheDocument()
    expect(screen.queryByText('Task 4')).not.toBeInTheDocument()
  })

  it('should limit activities display to 5 groups', () => {
    const activities = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      type: 'irrigation',
      date: `2024-01-${15 - i}T10:00:00`,
      created_at: `2024-01-${15 - i}T10:00:00`
    }))

    render(<ActivityFeed {...defaultProps} recentActivities={activities} />)
    
    // Should only render 5 groups max
    const activityCards = document.querySelectorAll('[class*="bg-gray-50 rounded-lg"]')
    expect(activityCards.length).toBeLessThanOrEqual(5)
  })

  it('should show log type icons for multiple log types in a group', () => {
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
        date: '2024-01-15T16:00:00',
        created_at: '2024-01-15T16:00:00'
      }
    ]

    const { container } = render(
      <ActivityFeed {...defaultProps} recentActivities={activities} />
    )
    
    // Check for multiple log type icons
    const iconContainers = container.querySelectorAll('[class*="rounded"]')
    expect(iconContainers.length).toBeGreaterThan(0)
  })

  it('should display first activity notes when available', () => {
    const activities = [
      {
        id: 1,
        type: 'irrigation',
        date: '2024-01-15T10:00:00',
        notes: 'Morning irrigation completed',
        created_at: '2024-01-15T10:00:00'
      }
    ]

    render(<ActivityFeed {...defaultProps} recentActivities={activities} />)
    
    expect(screen.getByText(/Morning irrigation/i)).toBeInTheDocument()
  })

  it('should truncate long notes to 60 characters', () => {
    const longNote = 'This is a very long note that should be truncated because it exceeds the maximum character limit'
    const activities = [
      {
        id: 1,
        type: 'irrigation',
        date: '2024-01-15T10:00:00',
        notes: longNote,
        created_at: '2024-01-15T10:00:00'
      }
    ]

    const { container } = render(
      <ActivityFeed {...defaultProps} recentActivities={activities} />
    )
    
    const noteElement = container.querySelector('.truncate')
    expect(noteElement?.textContent?.length).toBeLessThanOrEqual(63) // 60 + '...'
  })
})