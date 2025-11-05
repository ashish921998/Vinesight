'use client'

import * as Sentry from '@sentry/nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to console
    console.error('Error boundary:', error)

    // Capture the error with Sentry
    Sentry.captureException(error, {
      tags: {
        location: 'page-error',
        digest: error.digest
      }
    })
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-6 w-6" />
            Something went wrong
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            An unexpected error occurred. The error has been logged and our team has been notified.
          </p>

          {process.env.NODE_ENV === 'development' && error && (
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
              <h4 className="font-semibold text-sm mb-2">Error Details (Development Mode)</h4>
              <pre className="text-xs text-red-600 dark:text-red-400 overflow-auto">
                {error.message}
              </pre>
              {error.stack && (
                <details className="mt-2">
                  <summary className="text-xs font-semibold cursor-pointer">Stack Trace</summary>
                  <pre className="text-xs mt-1 overflow-auto">{error.stack}</pre>
                </details>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={reset} variant="default">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try again
            </Button>
            <Button asChild variant="outline">
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Go home
              </Link>
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>If this problem persists, please contact support with the following information:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>What you were doing when the error occurred</li>
              <li>Browser and device information</li>
              <li>Time: {new Date().toISOString()}</li>
              {error.digest && <li>Error ID: {error.digest}</li>}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
