'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Capture the error with Sentry
    Sentry.captureException(error, {
      tags: {
        location: 'global-error',
        digest: error.digest
      },
      level: 'fatal'
    })
  }, [error])

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Something went wrong - VineSight</title>
      </head>
      <body>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            backgroundColor: '#f9fafb'
          }}
        >
          <div
            style={{
              maxWidth: '32rem',
              width: '100%',
              textAlign: 'center',
              padding: '2rem',
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                marginBottom: '1rem'
              }}
            >
              <AlertTriangle
                style={{ width: '1.5rem', height: '1.5rem', color: '#dc2626' }}
                aria-hidden="true"
              />
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827' }}>
                Something went wrong
              </h2>
            </div>

            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
              An unexpected error occurred. The error has been logged and our team has been
              notified.
            </p>

            {process.env.NODE_ENV === 'development' && error && (
              <div
                style={{
                  backgroundColor: '#f3f4f6',
                  padding: '1rem',
                  borderRadius: '0.375rem',
                  marginBottom: '1.5rem'
                }}
              >
                <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  Error Details (Development Mode)
                </h4>
                <pre
                  style={{
                    fontSize: '0.75rem',
                    color: '#dc2626',
                    overflow: 'auto',
                    textAlign: 'left'
                  }}
                >
                  {error.message}
                </pre>
              </div>
            )}

            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}
            >
              <button
                type="button"
                onClick={reset}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#37a765',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <RefreshCw style={{ width: '1rem', height: '1rem' }} />
                Try again
              </button>
              <Link
                href="/"
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'white',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Home style={{ width: '1rem', height: '1rem' }} />
                Go home
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
