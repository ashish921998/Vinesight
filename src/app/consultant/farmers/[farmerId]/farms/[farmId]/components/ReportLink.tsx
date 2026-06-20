'use client'

import { useQuery } from '@tanstack/react-query'
import { ExternalLink, FileImage, Loader2 } from 'lucide-react'
import { consultantKeys } from '@/lib/consultant-query-keys'

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

async function fetchSignedReportUrl(path: string): Promise<string> {
  const response = await fetch('/api/test-reports/signed-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path })
  })
  if (!response.ok) throw new Error('Failed to load report URL')
  const { signedUrl } = (await response.json()) as { signedUrl?: string | null }
  return signedUrl ?? ''
}

function useReportUrl(
  path?: string | null,
  fallbackUrl?: string | null
): { url: string | null; loading: boolean } {
  const { data: signedUrl, isPending } = useQuery({
    queryKey: consultantKeys.reportSignedUrl(path ?? ''),
    queryFn: () => fetchSignedReportUrl(path as string),
    enabled: Boolean(path),
    staleTime: 10 * 60_000,
    retry: false
  })

  // No path to sign: fall back to the direct URL (or nothing) without fetching.
  if (!path) {
    return { url: fallbackUrl ?? null, loading: false }
  }

  return { url: signedUrl || null, loading: isPending }
}
