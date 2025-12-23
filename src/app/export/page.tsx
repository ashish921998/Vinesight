'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ExportPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the unified reports page
    router.replace('/reports')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting to Reports...</p>
      </div>
    </div>
  )
}
