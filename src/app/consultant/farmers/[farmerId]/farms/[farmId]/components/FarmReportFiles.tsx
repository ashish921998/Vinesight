'use client'

import { useEffect, useReducer } from 'react'
import { ExternalLink, Leaf, Loader2, TestTube } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { TestReportFile } from '@/lib/document-service'
import { SectionLabel } from './SectionLabel'
import { formatFileSize, prettyReportName } from './farm-helpers'

// Lists the actual report PDFs in storage for this farm. Files are surfaced
// here (not per test record) because uploads aren't reliably linked back onto
// a record — see the History tab. Each opens its signed URL in a new tab.
export function FarmReportFiles({ farmId }: { farmId: number }) {
  const [state, dispatch] = useReducer(
    (
      current: { files: TestReportFile[] | null; loading: boolean; error: boolean },
      patch: Partial<{ files: TestReportFile[] | null; loading: boolean; error: boolean }>
    ) => ({ ...current, ...patch }),
    { files: null, loading: true, error: false }
  )
  const { files, loading, error } = state

  useEffect(() => {
    let active = true
    dispatch({ loading: true, error: false })
    fetch(`/api/test-reports/list?farmId=${farmId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load report files')
        const json = await res.json()
        if (active) dispatch({ files: (json.files as TestReportFile[]) ?? [] })
      })
      .catch(() => {
        if (active) dispatch({ error: true })
      })
      .finally(() => {
        if (active) dispatch({ loading: false })
      })
    return () => {
      active = false
    }
  }, [farmId])

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <SectionLabel>Report files</SectionLabel>
        {files && files.length > 0 && (
          <span className="text-xs text-muted-foreground tabular-nums">{files.length} files</span>
        )}
      </div>

      {loading ? (
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-border px-3 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading report files…
        </div>
      ) : error ? (
        <div className="mt-2 rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
          Couldn’t load report files. Try refreshing.
        </div>
      ) : !files || files.length === 0 ? (
        <div className="mt-2 rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
          No uploaded report files for this farm yet.
        </div>
      ) : (
        <div className="mt-2 divide-y divide-border rounded-lg border border-border">
          {files.map((file) => {
            const size = formatFileSize(file.sizeBytes)
            return (
              <div
                key={file.path}
                className="flex items-center justify-between gap-3 py-2.5 px-3 hover:bg-muted/20"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {file.testType === 'soil' ? (
                    <TestTube className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  ) : (
                    <Leaf className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {prettyReportName(file.filename)}
                    </p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      <span className="capitalize">{file.testType}</span>
                      <span className="mx-1">·</span>
                      {file.uploadedAt
                        ? new Date(file.uploadedAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })
                        : 'Unknown date'}
                      {size ? (
                        <>
                          <span className="mx-1">·</span>
                          {size}
                        </>
                      ) : null}
                    </p>
                  </div>
                </div>
                {file.signedUrl ? (
                  <Button asChild variant="outline" size="sm" className="h-7 shrink-0 gap-1.5">
                    <a href={file.signedUrl} target="_blank" rel="noopener noreferrer">
                      Open PDF
                      <ExternalLink className="size-3" />
                    </a>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled
                    className="h-7 shrink-0 gap-1.5 border-dashed text-muted-foreground/60"
                  >
                    Unavailable
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
