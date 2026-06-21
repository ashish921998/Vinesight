'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function ExportPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the unified reports page
    router.replace('/reports')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
        <p className="text-muted-foreground">Redirecting to Reports...</p>
      </div>
    </div>
  )
}
