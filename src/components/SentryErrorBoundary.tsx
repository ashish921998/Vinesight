'use client'

import * as Sentry from '@sentry/nextjs'
import { ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ErrorFallbackProps {
  error: Error
  componentStack: string | null
  eventId: string | null
  resetError: () => void
}

/**
 * Custom fallback component for Sentry Error Boundary
 * This component is shown when an error is caught
 */
function ErrorFallback({ error, componentStack, eventId, resetError }: ErrorFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-6 w-6" />
            Something went wrong
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            We&apos;re sorry, but something unexpected happened. The error has been logged and our
            team has been notified.
          </p>

          {process.env.NODE_ENV === 'development' && error && (
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
              <h4 className="font-semibold text-sm mb-2">Error Details (Development Mode)</h4>
              <pre className="text-xs text-red-600 dark:text-red-400 overflow-auto">
                {error.message}
              </pre>
              {componentStack && (
                <details className="mt-2">
                  <summary className="text-xs font-semibold cursor-pointer">
                    Component Stack
                  </summary>
                  <pre className="text-xs mt-1 overflow-auto">{componentStack}</pre>
                </details>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={resetError} variant="default">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button
              onClick={() => {
                window.location.href = '/'
              }}
              variant="outline"
            >
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
            {eventId && (
              <Button
                onClick={() => Sentry.showReportDialog({ eventId })}
                variant="outline"
                className="ml-auto"
              >
                Report Feedback
              </Button>
            )}
          </div>

          <div className="text-sm text-muted-foreground">
            <p>If this problem persists, please contact support with the following information:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>What you were doing when the error occurred</li>
              <li>Browser and device information</li>
              <li>Time: {new Date().toISOString()}</li>
              {eventId && <li>Error ID: {eventId}</li>}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Sentry Error Boundary Wrapper Component
 * Wraps children with Sentry's error boundary for automatic error tracking
 *
 * @see https://docs.sentry.io/platforms/javascript/guides/react/features/error-boundary/
 */
export function SentryErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <Sentry.ErrorBoundary
      fallback={({ error, componentStack, eventId, resetError }) => (
        <ErrorFallback
          error={error instanceof Error ? error : new Error(String(error))}
          componentStack={componentStack}
          eventId={eventId}
          resetError={resetError}
        />
      )}
      showDialog={false} // We handle the dialog manually via the Report Feedback button
      beforeCapture={(scope) => {
        // Add custom tags and context before capturing the error
        scope.setTag('location', 'error-boundary')
        scope.setLevel('error')

        // Add device and browser information
        if (typeof window !== 'undefined' && 'navigator' in window) {
          scope.setContext('device', {
            isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
              navigator.userAgent
            ),
            isChrome: /Chrome/i.test(navigator.userAgent),
            userAgent: navigator.userAgent,
            url: window.location.href,
            timestamp: new Date().toISOString()
          })
        }
      }}
    >
      {children}
    </Sentry.ErrorBoundary>
  )
}

/**
 * HOC to wrap components with Sentry Error Boundary
 * @example
 * const MyComponentWithBoundary = withSentryErrorBoundary(MyComponent)
 */
export function withSentryErrorBoundary<P extends object>(Component: React.ComponentType<P>) {
  return function WrappedComponent(props: P) {
    return (
      <SentryErrorBoundary>
        <Component {...props} />
      </SentryErrorBoundary>
    )
  }
}
