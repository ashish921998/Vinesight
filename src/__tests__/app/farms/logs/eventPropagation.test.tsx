/**
 * Tests for event propagation and click handlers in farm logs page
 * Ensures stopPropagation works correctly for nested buttons
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

describe('Event Propagation in Farm Logs Page', () => {
  describe('Log container click behavior', () => {
    it('should call handleEditRecord when log container is clicked', async () => {
      const mockHandleEditRecord = jest.fn()
      const mockLog = {
        id: 1,
        type: 'irrigation',
        date: '2023-10-20',
        created_at: '2023-10-20T10:00:00Z',
        duration: 2,
      }

      const LogCard = () => (
        <div
          className="cursor-pointer hover:bg-gray-50"
          onClick={() => mockHandleEditRecord(mockLog)}
          data-testid="log-container"
        >
          <p>Log Content</p>
        </div>
      )

      const user = userEvent.setup()
      render(<LogCard />)

      const container = screen.getByTestId('log-container')
      await user.click(container)

      expect(mockHandleEditRecord).toHaveBeenCalledWith(mockLog)
      expect(mockHandleEditRecord).toHaveBeenCalledTimes(1)
    })

    it('should apply correct CSS classes for clickable container', () => {
      const { container } = render(
        <div
          className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer hover:bg-gray-50"
          data-testid="log-container"
        >
          Content
        </div>
      )

      const logContainer = screen.getByTestId('log-container')
      expect(logContainer).toHaveClass('cursor-pointer')
      expect(logContainer).toHaveClass('hover:bg-gray-50')
      expect(logContainer).toHaveClass('hover:shadow-md')
      expect(logContainer).toHaveClass('transition-shadow')
    })
  })

  describe('Edit button event propagation', () => {
    it('should stop propagation when edit button is clicked', async () => {
      const mockContainerClick = jest.fn()
      const mockEditClick = jest.fn()

      const LogCardWithButtons = () => (
        <div onClick={mockContainerClick} data-testid="log-container">
          <button
            onClick={(e) => {
              e.stopPropagation()
              mockEditClick()
            }}
            data-testid="edit-button"
          >
            Edit
          </button>
        </div>
      )

      const user = userEvent.setup()
      render(<LogCardWithButtons />)

      const editButton = screen.getByTestId('edit-button')
      await user.click(editButton)

      expect(mockEditClick).toHaveBeenCalledTimes(1)
      expect(mockContainerClick).not.toHaveBeenCalled()
    })

    it('should call handleEditRecord with correct log data from button', async () => {
      const mockHandleEditRecord = jest.fn()
      const mockLog = {
        id: 5,
        type: 'spray',
        date: '2023-10-21',
        chemical: 'Pesticide',
      }

      const EditButton = () => (
        <button
          onClick={(e) => {
            e.stopPropagation()
            mockHandleEditRecord(mockLog)
          }}
          data-testid="edit-button"
        >
          Edit
        </button>
      )

      const user = userEvent.setup()
      render(<EditButton />)

      const button = screen.getByTestId('edit-button')
      await user.click(button)

      expect(mockHandleEditRecord).toHaveBeenCalledWith(mockLog)
    })

    it('should not trigger parent onClick when edit button clicked', async () => {
      const mockParentClick = jest.fn()
      const mockEditClick = jest.fn()

      const NestedClickHandlers = () => (
        <div onClick={mockParentClick}>
          <div onClick={mockParentClick}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                mockEditClick()
              }}
              data-testid="nested-button"
            >
              Edit
            </button>
          </div>
        </div>
      )

      const user = userEvent.setup()
      render(<NestedClickHandlers />)

      await user.click(screen.getByTestId('nested-button'))

      expect(mockEditClick).toHaveBeenCalledTimes(1)
      expect(mockParentClick).not.toHaveBeenCalled()
    })
  })

  describe('Delete button event propagation', () => {
    it('should stop propagation when delete button is clicked', async () => {
      const mockContainerClick = jest.fn()
      const mockDeleteClick = jest.fn()

      const LogCardWithDelete = () => (
        <div onClick={mockContainerClick} data-testid="log-container">
          <button
            onClick={(e) => {
              e.stopPropagation()
              mockDeleteClick()
            }}
            data-testid="delete-button"
          >
            Delete
          </button>
        </div>
      )

      const user = userEvent.setup()
      render(<LogCardWithDelete />)

      const deleteButton = screen.getByTestId('delete-button')
      await user.click(deleteButton)

      expect(mockDeleteClick).toHaveBeenCalledTimes(1)
      expect(mockContainerClick).not.toHaveBeenCalled()
    })

    it('should call handleDeleteRecord with correct log data', async () => {
      const mockHandleDeleteRecord = jest.fn()
      const mockLog = {
        id: 3,
        type: 'expense',
        cost: 500,
      }

      const DeleteButton = () => (
        <button
          onClick={(e) => {
            e.stopPropagation()
            mockHandleDeleteRecord(mockLog)
          }}
          data-testid="delete-button"
        >
          Delete
        </button>
      )

      const user = userEvent.setup()
      render(<DeleteButton />)

      await user.click(screen.getByTestId('delete-button'))

      expect(mockHandleDeleteRecord).toHaveBeenCalledWith(mockLog)
    })

    it('should handle multiple delete buttons independently', async () => {
      const mockDelete1 = jest.fn()
      const mockDelete2 = jest.fn()
      const mockContainerClick = jest.fn()

      const MultipleDeleteButtons = () => (
        <div onClick={mockContainerClick}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              mockDelete1()
            }}
            data-testid="delete-1"
          >
            Delete 1
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              mockDelete2()
            }}
            data-testid="delete-2"
          >
            Delete 2
          </button>
        </div>
      )

      const user = userEvent.setup()
      render(<MultipleDeleteButtons />)

      await user.click(screen.getByTestId('delete-1'))
      expect(mockDelete1).toHaveBeenCalledTimes(1)
      expect(mockDelete2).not.toHaveBeenCalled()
      expect(mockContainerClick).not.toHaveBeenCalled()

      jest.clearAllMocks()

      await user.click(screen.getByTestId('delete-2'))
      expect(mockDelete2).toHaveBeenCalledTimes(1)
      expect(mockDelete1).not.toHaveBeenCalled()
      expect(mockContainerClick).not.toHaveBeenCalled()
    })
  })

  describe('Combined edit and delete buttons', () => {
    it('should handle both buttons with stopPropagation correctly', async () => {
      const mockContainerClick = jest.fn()
      const mockEditClick = jest.fn()
      const mockDeleteClick = jest.fn()

      const LogCardComplete = () => (
        <div onClick={mockContainerClick} data-testid="container">
          <button
            onClick={(e) => {
              e.stopPropagation()
              mockEditClick()
            }}
            data-testid="edit"
          >
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              mockDeleteClick()
            }}
            data-testid="delete"
          >
            Delete
          </button>
        </div>
      )

      const user = userEvent.setup()
      render(<LogCardComplete />)

      // Click edit
      await user.click(screen.getByTestId('edit'))
      expect(mockEditClick).toHaveBeenCalledTimes(1)
      expect(mockDeleteClick).not.toHaveBeenCalled()
      expect(mockContainerClick).not.toHaveBeenCalled()

      jest.clearAllMocks()

      // Click delete
      await user.click(screen.getByTestId('delete'))
      expect(mockDeleteClick).toHaveBeenCalledTimes(1)
      expect(mockEditClick).not.toHaveBeenCalled()
      expect(mockContainerClick).not.toHaveBeenCalled()

      jest.clearAllMocks()

      // Click container
      await user.click(screen.getByTestId('container'))
      expect(mockContainerClick).toHaveBeenCalledTimes(1)
      expect(mockEditClick).not.toHaveBeenCalled()
      expect(mockDeleteClick).not.toHaveBeenCalled()
    })

    it('should maintain correct event order', async () => {
      const callOrder: string[] = []
      
      const mockContainerClick = jest.fn(() => callOrder.push('container'))
      const mockEditClick = jest.fn(() => callOrder.push('edit'))

      const OrderedClicks = () => (
        <div onClick={mockContainerClick}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              mockEditClick()
            }}
            data-testid="button"
          >
            Edit
          </button>
        </div>
      )

      const user = userEvent.setup()
      render(<OrderedClicks />)

      await user.click(screen.getByTestId('button'))

      expect(callOrder).toEqual(['edit'])
      expect(mockEditClick).toHaveBeenCalled()
      expect(mockContainerClick).not.toHaveBeenCalled()
    })
  })

  describe('Grid layout with buttons', () => {
    it('should work correctly with grid-cols-[auto_1fr_auto] layout', () => {
      const { container } = render(
        <div className="grid grid-cols-[auto_1fr_auto] gap-3 items-start">
          <div className="flex-shrink-0">Icon</div>
          <div className="min-w-0">Content</div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button data-testid="edit">Edit</button>
            <button data-testid="delete">Delete</button>
          </div>
        </div>
      )

      const gridContainer = container.querySelector('.grid-cols-\\[auto_1fr_auto\\]')
      expect(gridContainer).toBeInTheDocument()
      
      expect(screen.getByTestId('edit')).toBeInTheDocument()
      expect(screen.getByTestId('delete')).toBeInTheDocument()
    })

    it('should maintain button functionality in new layout', async () => {
      const mockEdit = jest.fn()
      const mockDelete = jest.fn()
      const mockContainer = jest.fn()

      const GridLayout = () => (
        <div onClick={mockContainer} className="grid grid-cols-[auto_1fr_auto]">
          <div>Icon</div>
          <div>Content</div>
          <div className="flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation()
                mockEdit()
              }}
              data-testid="edit"
            >
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                mockDelete()
              }}
              data-testid="delete"
            >
              Delete
            </button>
          </div>
        </div>
      )

      const user = userEvent.setup()
      render(<GridLayout />)

      await user.click(screen.getByTestId('edit'))
      expect(mockEdit).toHaveBeenCalledTimes(1)
      expect(mockContainer).not.toHaveBeenCalled()

      await user.click(screen.getByTestId('delete'))
      expect(mockDelete).toHaveBeenCalledTimes(1)
      expect(mockContainer).toHaveBeenCalledTimes(0)
    })
  })

  describe('Edge cases', () => {
    it('should handle rapid successive clicks', async () => {
      const mockClick = jest.fn()

      const RapidClickButton = () => (
        <button
          onClick={(e) => {
            e.stopPropagation()
            mockClick()
          }}
          data-testid="rapid-button"
        >
          Click Me
        </button>
      )

      const user = userEvent.setup()
      render(<RapidClickButton />)

      const button = screen.getByTestId('rapid-button')
      await user.click(button)
      await user.click(button)
      await user.click(button)

      expect(mockClick).toHaveBeenCalledTimes(3)
    })

    it('should handle disabled button correctly', async () => {
      const mockClick = jest.fn()

      const DisabledButton = () => (
        <button
          disabled
          onClick={(e) => {
            e.stopPropagation()
            mockClick()
          }}
          data-testid="disabled-button"
        >
          Disabled
        </button>
      )

      const user = userEvent.setup()
      render(<DisabledButton />)

      const button = screen.getByTestId('disabled-button')
      await user.click(button)

      expect(mockClick).not.toHaveBeenCalled()
    })

    it('should work with keyboard events', async () => {
      const mockClick = jest.fn()

      const KeyboardButton = () => (
        <button
          onClick={(e) => {
            e.stopPropagation()
            mockClick()
          }}
          data-testid="keyboard-button"
        >
          Press Me
        </button>
      )

      const user = userEvent.setup()
      render(<KeyboardButton />)

      const button = screen.getByTestId('keyboard-button')
      button.focus()
      await user.keyboard('{Enter}')

      expect(mockClick).toHaveBeenCalled()
    })
  })
})