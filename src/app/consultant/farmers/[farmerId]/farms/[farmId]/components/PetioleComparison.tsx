'use client'

import { Fragment, useMemo } from 'react'
import type { LabTestRecord } from '@/types/lab-tests'
import { SectionLabel } from './SectionLabel'
import { type ParamRange, PETIOLE_PARAM_GROUPS, PETIOLE_RANGES } from './farm-config'
import { cellClasses, formatParamKey, formatValue, getStatus } from './farm-helpers'

export function PetioleComparison({
  reports,
  currentReportId,
  ranges = PETIOLE_RANGES,
  paramGroups = PETIOLE_PARAM_GROUPS
}: {
  reports: LabTestRecord[]
  currentReportId?: number | null
  ranges?: Record<string, ParamRange>
  paramGroups?: { label: string; keys: string[] }[]
}) {
  const sortedReports = useMemo(
    () =>
      [...reports]
        .filter((r) => r.parameters && Object.keys(r.parameters).length > 0)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [reports]
  )

  const currentId = currentReportId ?? sortedReports[0]?.id ?? null

  // Flatten the group keys while preserving group membership for rendering.
  const groupedRows = paramGroups
    .map((g) => ({
      label: g.label,
      keys: g.keys.filter((k) =>
        sortedReports.some((r) => {
          const v = r.parameters?.[k]
          return v !== undefined && v !== null && v !== ''
        })
      )
    }))
    .filter((g) => g.keys.length > 0)

  const totalParams = groupedRows.reduce((acc, g) => acc + g.keys.length, 0)

  // Count abnormal cells across all reports so the consultant gets a heads-up.
  const abnormalCounts = useMemo(() => {
    const counts = new Map<number, number>()
    for (const r of sortedReports) {
      let n = 0
      for (const g of groupedRows) {
        for (const k of g.keys) {
          const v = r.parameters?.[k]
          const range = ranges[k]
          if (typeof v === 'number' && range) {
            const st = getStatus(v, range)
            if (st !== 'optimal') n++
          }
        }
      }
      counts.set(r.id ?? -1, n)
    }
    return counts
  }, [sortedReports, groupedRows, ranges])

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <SectionLabel>Petiole comparison</SectionLabel>
        {totalParams > 0 && (
          <span className="text-[11px] text-muted-foreground">
            {sortedReports.length} report{sortedReports.length !== 1 ? 's' : ''} · {totalParams}{' '}
            parameters
          </span>
        )}
      </div>

      {sortedReports.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No parameter values were extracted from this report.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-muted/40">
                <th className="sticky left-0 z-10 bg-muted/40 px-3 py-2 text-left align-bottom text-[11px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border min-w-[140px]">
                  Parameter
                </th>
                {sortedReports.map((r) => {
                  const isCurrent = (r.id ?? null) === currentId
                  const abnormal = abnormalCounts.get(r.id ?? -1) ?? 0
                  return (
                    <th
                      key={r.id ?? String(r.date)}
                      className={`px-3 py-2 text-center align-bottom border-b border-l border-border min-w-[110px] ${
                        isCurrent ? 'bg-primary/5' : ''
                      }`}
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="tabular-nums text-[11px] font-semibold text-foreground">
                          {new Date(r.date).toLocaleDateString(undefined, {
                            day: '2-digit',
                            month: 'short'
                          })}
                        </span>
                        <span className="tabular-nums text-[10px] text-muted-foreground">
                          {new Date(r.date).toLocaleDateString(undefined, {
                            year: 'numeric'
                          })}
                        </span>
                        {isCurrent && (
                          <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary-foreground">
                            Current
                          </span>
                        )}
                        {!isCurrent && abnormal > 0 && (
                          <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                            {abnormal} flag{abnormal !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {groupedRows.map((group, gi) => (
                <Fragment key={group.label}>
                  <tr>
                    <td
                      colSpan={sortedReports.length + 1}
                      className={`sticky left-0 bg-muted/30 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border ${
                        gi === 0 ? '' : 'border-t'
                      }`}
                    >
                      {group.label}
                    </td>
                  </tr>
                  {group.keys.map((key) => {
                    const range = ranges[key]
                    return (
                      <tr key={key} className="group hover:bg-muted/20">
                        <td className="sticky left-0 z-10 bg-card group-hover:bg-muted/20 px-3 py-1.5 text-left text-[12px] font-medium text-foreground border-b border-border">
                          <div className="flex flex-col">
                            <span>{formatParamKey(key)}</span>
                            {range && (
                              <span className="text-[10px] text-muted-foreground tabular-nums">
                                {range.min}-{range.max} {range.unit}
                              </span>
                            )}
                          </div>
                        </td>
                        {sortedReports.map((r) => {
                          const raw = r.parameters?.[key]
                          const isCurrent = (r.id ?? null) === currentId
                          const isNumeric = typeof raw === 'number'
                          const status = isNumeric && range ? getStatus(raw, range) : 'optimal'
                          const display = isNumeric
                            ? formatValue(raw, range)
                            : raw != null && raw !== ''
                              ? String(raw)
                              : '-'
                          return (
                            <td
                              key={r.id ?? `${r.date}-${key}`}
                              className={`px-3 py-1.5 text-center border-b border-l border-border tabular-nums text-[12px] font-medium ${cellClasses(
                                status,
                                isCurrent
                              )}`}
                              title={
                                isNumeric && range
                                  ? `${formatParamKey(key)}: ${raw} (target ${range.min}-${range.max})`
                                  : undefined
                              }
                            >
                              {display}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-amber-200 dark:bg-amber-900/50" />
          Below target
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-rose-200 dark:bg-rose-900/50" />
          Above target
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-primary/10 ring-1 ring-primary/30" />
          Current report
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-card ring-1 ring-border" />
          Within target
        </span>
      </div>

      {sortedReports[0]?.notes && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/10 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-500 mb-0.5">
            Lab note (latest report)
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">{sortedReports[0].notes}</p>
        </div>
      )}
    </div>
  )
}
