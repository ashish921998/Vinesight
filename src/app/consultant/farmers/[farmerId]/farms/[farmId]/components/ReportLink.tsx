'use client'

import { useEffect, useReducer } from 'react'
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
  const [state, dispatch] = useReducer(
    (
      current: { signedUrl: string | null; loading: boolean },
      patch: Partial<{ signedUrl: string | null; loading: boolean }>
    ) => ({ ...current, ...patch }),
    { signedUrl: null, loading: false }
  )
  const { signedUrl, loading } = state

  useEffect(() => {
    if (!path) {
      dispatch({ signedUrl: null, loading: false })
      return
    }

    let cancelled = false
    dispatch({ loading: true, signedUrl: null })

    fetch('/api/test-reports/signed-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path })
    })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then(({ signedUrl: signed }) => {
        if (!cancelled) dispatch({ signedUrl: signed })
      })
      .catch((error) => console.error('Error loading report:', error))
      .finally(() => {
        if (!cancelled) dispatch({ loading: false })
      })

    return () => {
      cancelled = true
    }
  }, [path])

  const url = path ? signedUrl : (fallbackUrl ?? null)
  return { url, loading: path ? loading : false }
}
