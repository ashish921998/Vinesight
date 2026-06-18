'use client'

import React, { ReactNode } from 'react'

// Report unhandled promise rejections. This component does not render an error
// boundary; React rendering errors are routed to Sentry by the SentryErrorBoundary
// that wraps the tree in the root layout. Sentry's browser SDK already captures
// unhandledrejection events via its default global handlers, so we only log here
// for local debugging and avoid a duplicate manual capture.
export function AsyncErrorBoundary({ children }: { children: ReactNode }) {
  React.useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason)
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  return <>{children}</>
}
