'use client'

import { useQuery } from '@tanstack/react-query'
import { ExternalLink, Leaf, Loader2, TestTube } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/Skeleton'
import type { TestReportFile } from '@/lib/document-service'
import { consultantKeys } from '@/lib/consultant-query-keys'
import { SectionLabel } from './SectionLabel'
import { formatFileSize, prettyReportName } from './farm-helpers'

async function getFarmReportFiles(farmId: number): Promise<TestReportFile[]> {
  const response = await fetch(`/api/test-reports/list?farmId=${farmId}`)
  if (!response.ok) throw new Error('Failed to load report files')

  const payload = (await response.json()) as { files?: TestReportFile[] }
  return payload.files ?? []
}

// Lists the actual report PDFs in storage for this farm. Files are surfaced
// here (not per test record) because uploads aren't reliably linked back onto
// a record — see the History tab. Each opens its signed URL in a new tab.
export function FarmReportFiles({ farmId }: { farmId: number }) {
  const {
    data: files = [],
    isPending,
    isError,
    isFetching,
    refetch
  } = useQuery({
    queryKey: consultantKeys.farmReportFiles(farmId),
    queryFn: () => getFarmReportFiles(farmId),
    staleTime: 10 * 60_000
  })

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <SectionLabel>Report files</SectionLabel>
        {files.length > 0 && (
          <span className="font-mono text-xs text-muted-foreground tabular-nums">
            {files.length} files
          </span>
        )}
      </div>

      {isPending ? (
        <div className="mt-2 space-y-2 rounded-lg border border-border px-3 py-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="mt-2 flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
          <p>Couldn’t load report files.</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isFetching}
            onClick={() => refetch()}
          >
            {isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Try again
          </Button>
        </div>
      ) : files.length === 0 ? (
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
