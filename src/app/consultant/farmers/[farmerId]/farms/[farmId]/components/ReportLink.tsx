'use client'

import { useCallback, useEffect, useState } from 'react'
import { ExternalLink, FileImage, Loader2 } from 'lucide-react'

export function ReportLink({
  storagePath,
  directUrl
}: {
  storagePath?: string | null
  directUrl?: string | null
}) {
  const { url, loading } = useReportUrl(storagePath, directUrl)

  if (loading) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Loading
      </span>
    )
  }

  if (!url) return null

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
    >
      <FileImage className="h-3.5 w-3.5" />
      View soil report
      <ExternalLink className="h-3 w-3" />
    </a>
  )
}

function useReportUrl(
  path?: string | null,
  fallbackUrl?: string | null
): { url: string | null; loading: boolean } {
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchUrl = useCallback(async () => {
    if (!path || signedUrl) return
    setLoading(true)
    try {
      const response = await fetch('/api/test-reports/signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path })
      })
      if (response.ok) {
        const { signedUrl: signed } = await response.json()
        setSignedUrl(signed)
      }
    } catch (error) {
      console.error('Error loading report:', error)
    } finally {
      setLoading(false)
    }
  }, [path, signedUrl])

  useEffect(() => {
    if (path) fetchUrl()
  }, [path, fetchUrl])

  // A storage path must be signed; otherwise fall back to a legacy direct
  // report_url (already openable, no signing or fetch needed).
  const url = path ? signedUrl : (fallbackUrl ?? null)
  return { url, loading: path ? loading : false }
}
