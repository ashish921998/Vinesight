'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Global error boundary:', error)
  }, [error])

  return (
    <html>
      <body className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-4">
          <h2 className="text-2xl font-semibold">Something went wrong</h2>
          <p className="text-muted-foreground">An unexpected error occurred. You can try again.</p>
          <div className="flex items-center justify-center gap-3">
            <Button onClick={() => reset()}>Try again</Button>
            <Link className="underline" href="/">Go home</Link>
          </div>
        </div>
      </body>
    </html>
  )
}


