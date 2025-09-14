// Centralized error handling system
export interface AppError {
  code: string
  message: string
  details?: any
  timestamp: number
  userFriendly: boolean
}

export class ErrorHandler {
  private static instance: ErrorHandler
  private errorHistory: AppError[] = []

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  // Create standardized error objects
  createError(
    code: string,
    message: string,
    details?: any,
    userFriendly: boolean = true,
  ): AppError {
    const error: AppError = {
      code,
      message,
      details,
      timestamp: Date.now(),
      userFriendly,
    }

    // Store in history (keep only last 100)
    this.errorHistory.push(error)
    if (this.errorHistory.length > 100) {
      this.errorHistory.shift()
    }

    return error
  }

  // Handle database errors
  handleDatabaseError(error: any): AppError {
    console.error('Database error:', error)

    if (error.code === 'PGRST116') {
      return this.createError('NOT_FOUND', 'The requested data was not found', error)
    }

    if (error.code === '23505') {
      return this.createError('DUPLICATE_ENTRY', 'This entry already exists', error)
    }

    if (error.code === '23503') {
      return this.createError(
        'FOREIGN_KEY_VIOLATION',
        'Cannot complete this operation due to related data',
        error,
      )
    }

    return this.createError(
      'DATABASE_ERROR',
      'A database error occurred. Please try again.',
      error,
      true,
    )
  }

  // Handle API errors
  handleApiError(error: any): AppError {
    console.error('API error:', error)

    if (error.name === 'ValidationError') {
      return this.createError('VALIDATION_ERROR', 'The provided data is invalid', error.errors)
    }

    if (error.status === 401) {
      return this.createError('UNAUTHORIZED', 'You need to sign in to perform this action', error)
    }

    if (error.status === 403) {
      return this.createError(
        'FORBIDDEN',
        'You do not have permission to perform this action',
        error,
      )
    }

    if (error.status === 429) {
      return this.createError(
        'RATE_LIMITED',
        'Too many requests. Please wait a moment and try again.',
        error,
      )
    }

    if (error.status >= 500) {
      return this.createError('SERVER_ERROR', 'Server error. Please try again later.', error)
    }

    return this.createError(
      'UNKNOWN_ERROR',
      'An unexpected error occurred. Please try again.',
      error,
    )
  }

  // Handle form validation errors
  handleValidationError(errors: string[]): AppError {
    return this.createError('FORM_VALIDATION', 'Please check the form for errors', errors)
  }

  // Get user-friendly error message
  getUserMessage(error: AppError): string {
    if (!error.userFriendly) {
      return 'An unexpected error occurred. Please try again.'
    }
    return error.message
  }

  // Get error history for debugging
  getErrorHistory(): AppError[] {
    return [...this.errorHistory]
  }

  // Clear error history
  clearHistory(): void {
    this.errorHistory = []
  }
}

// Retry utility for failed operations
export class RetryHandler {
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000,
  ): Promise<T> {
    let lastError: any

    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error

        if (i < maxRetries) {
          // Exponential backoff
          const waitTime = delay * Math.pow(2, i)
          await new Promise((resolve) => setTimeout(resolve, waitTime))
        }
      }
    }

    throw lastError
  }
}

// React hook for error handling
import { useState, useCallback } from 'react'

export function useErrorHandler() {
  const [error, setError] = useState<AppError | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const errorHandler = ErrorHandler.getInstance()

  const handleAsync = useCallback(
    async <T>(
      operation: () => Promise<T>,
      options?: {
        onSuccess?: (result: T) => void
        onError?: (error: AppError) => void
        showLoader?: boolean
      },
    ): Promise<T | null> => {
      if (options?.showLoader !== false) {
        setIsLoading(true)
      }
      setError(null)

      try {
        const result = await operation()
        options?.onSuccess?.(result)
        return result
      } catch (err: any) {
        const appError = errorHandler.handleApiError(err)
        setError(appError)
        options?.onError?.(appError)
        return null
      } finally {
        if (options?.showLoader !== false) {
          setIsLoading(false)
        }
      }
    },
    [errorHandler],
  )

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    error,
    isLoading,
    handleAsync,
    clearError,
    getUserMessage: (err: AppError) => errorHandler.getUserMessage(err),
  }
}

// Global error handler instance
export const globalErrorHandler = ErrorHandler.getInstance()
