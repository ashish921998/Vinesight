/**
 * Centralized error handling utility for VineSight
 * Provides consistent error message formatting and user feedback
 */

import { toast } from 'sonner'

export interface ErrorContext {
  operation: string
  component?: string
  additionalInfo?: Record<string, any>
}

export class ErrorHandler {
  /**
   * Handle errors with consistent formatting and user feedback
   */
  static handle(error: unknown, context: ErrorContext): void {
    const errorMessage = this.getErrorMessage(error)
    const contextualMessage = `${context.operation}: ${errorMessage}`
    
    // Show user-friendly toast notification
    toast.error(contextualMessage)
    
    // Log detailed error for debugging
    this.logError(error, context)
  }

  /**
   * Handle errors silently (no user notification)
   */
  static log(error: unknown, context: ErrorContext): void {
    this.logError(error, context)
  }

  /**
   * Get user-friendly error message from various error types
   */
  static getErrorMessage(error: unknown): string {
    if (error === null || error === undefined) {
      return 'An unknown error occurred'
    }

    // Handle Supabase errors
    if (typeof error === 'object' && error !== null) {
      const errorObj = error as Record<string, unknown>
      
      // Supabase error format
      if (errorObj.message && typeof errorObj.message === 'string') {
        // Handle specific Supabase error codes
        if (errorObj.code === 'PGRST116') {
          return 'Record not found'
        }
        if (errorObj.code === '23505') {
          return 'Duplicate entry - this record already exists'
        }
        if (errorObj.code === '23503') {
          return 'Invalid reference - related record not found'
        }
        
        return errorObj.message
      }

      // Handle network errors
      if (errorObj.name === 'TypeError' && typeof errorObj.message === 'string' && errorObj.message.includes('fetch')) {
        return 'Network connection error - please check your internet connection'
      }
    }

    // Handle Error objects
    if (error instanceof Error) {
      // Handle common error patterns
      if (error.message.includes('NetworkError')) {
        return 'Network connection error'
      }
      if (error.message.includes('timeout')) {
        return 'Request timed out - please try again'
      }
      if (error.message.includes('permission')) {
        return 'You do not have permission to perform this action'
      }

      return error.message
    }

    // Handle string errors
    if (typeof error === 'string') {
      return error
    }

    // Default fallback
    return 'An unexpected error occurred. Please try again.'
  }

  /**
   * Log error details for debugging
   */
  private static logError(error: unknown, context: ErrorContext): void {
    const errorDetails = {
      timestamp: new Date().toISOString(),
      context,
      error: {
        message: this.getErrorMessage(error),
        original: error,
        type: typeof error,
        ...(error instanceof Error && {
          stack: error.stack,
          name: error.name
        })
      }
    }

    // Log to console in development
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error in ${context.operation}`)
      console.error('Error Details:', errorDetails)
      console.groupEnd()
    } else {
      // In production, log structured error
      console.error('[VineSight Error]', errorDetails)
    }
  }

  /**
   * Create a user-friendly async error wrapper
   */
  static async wrapAsync<T>(
    asyncFn: () => Promise<T>,
    context: ErrorContext
  ): Promise<T | null> {
    try {
      return await asyncFn()
    } catch (error) {
      this.handle(error, context)
      return null
    }
  }

  /**
   * Validate an operation result and handle errors
   */
  static validate<T>(
    result: T | null | undefined,
    context: ErrorContext,
    customMessage?: string
  ): T {
    if (result === null || result === undefined) {
      const message = customMessage || `Invalid result in ${context.operation}`
      this.handle(new Error(message), context)
      throw new Error(message)
    }
    return result
  }
}

/**
 * Common error contexts for consistency
 */
export const ErrorContexts = {
  SPRAY_RECORD_CREATE: { operation: 'Failed to create spray record', component: 'UnifiedDataLogsModal' },
  SPRAY_RECORD_UPDATE: { operation: 'Failed to update spray record', component: 'UnifiedDataLogsModal' },
  CHEMICAL_VALIDATION: { operation: 'Chemical validation failed', component: 'ChemicalEntry' },
  FORM_SUBMISSION: { operation: 'Form submission failed', component: 'FormHandler' },
  DATA_FETCH: { operation: 'Failed to load data', component: 'DataLoader' },
  FILE_UPLOAD: { operation: 'Failed to upload file', component: 'FileUploader' },
  SAVE_SUCCESS: { operation: 'Save successful', component: 'Base' }
} as const

/**
 * Simplified error handling hook for React components
 */
export const useErrorHandler = () => {
  return {
    handleError: ErrorHandler.handle,
    handleSuccess: (message: string) => {
      toast.success(message)
      ErrorHandler.log(null, { ...ErrorContexts.SAVE_SUCCESS, operation: message })
    }
  }
}
