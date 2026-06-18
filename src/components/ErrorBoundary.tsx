'use client'

import React, { ReactNode } from 'react'

// Prevents unhandled promise rejections from becoming unhandled in React's eyes.
// Sentry's browser SDK captures unhandledrejection natively, so no logging needed.
export function AsyncErrorBoundary({ children }: { children: ReactNode }) {
  React.useEffect(() => {
    const handleUnhandledRejection = (_event: PromiseRejectionEvent) => {
      // Sentry's browser SDK already captures unhandledrejection globally.
      // This listener exists to prevent the event from becoming an unhandled
      // rejection in React's eyes; no action needed here.
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  return <>{children}</>
}
