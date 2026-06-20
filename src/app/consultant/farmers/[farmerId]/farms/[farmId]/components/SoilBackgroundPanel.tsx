'use client'

import { useState } from 'react'
import { ChevronDown, TestTube } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import type { LabTestRecord } from '@/types/lab-tests'
import type { FarmDetail } from '@/lib/consultant-query-service'
import { ReportLink } from './ReportLink'
import { SectionLabel } from './SectionLabel'
import { type ParamRange } from './farm-config'
import { formatParamKey, formatValue, getStatus } from './farm-helpers'

export function SoilBackgroundPanel({
  test,
  tests,
  farm,
  ranges,
  baselineKeys
}: {
  test: LabTestRecord | undefined
  tests: LabTestRecord[]
  farm: FarmDetail
  ranges: Record<string, ParamRange>
  baselineKeys: string[]
}) {
  const [open, setOpen] = useState(false)
  const parameters = test?.parameters || {}
  const baselineRows = baselineKeys
    .filter((key) => parameters[key] !== undefined && parameters[key] !== null)
    .map((paramKey) => {
      const value = parameters[paramKey]
      const range = ranges[paramKey]
      const isNumeric = typeof value === 'number'
      const status = isNumeric && range ? getStatus(value, range) : 'optimal'
      return { paramKey, value, range, isNumeric, status }
    })

  const extraKeys = Object.keys(parameters).filter(
    (key) =>
      !baselineKeys.includes(key) && parameters[key] !== undefined && parameters[key] !== null
  )
  const abnormalCount = baselineRows.filter((row) => row.status !== 'optimal').length
  const baselineGridClass =
    baselineRows.length <= 1
      ? 'grid-cols-1'
      : baselineRows.length === 2
        ? 'grid-cols-2'
        : baselineRows.length === 3
          ? 'grid-cols-2 sm:grid-cols-3'
          : baselineRows.length === 4
            ? 'grid-cols-2 sm:grid-cols-4'
            : baselineRows.length === 5
              ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
              : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex min-h-12 flex-wrap items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <SectionLabel>Soil background</SectionLabel>
            {test?.date && (
              <span className="text-[11px] text-muted-foreground tabular-nums">
                Sampled{' '}
                {new Date(test.date).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
                {tests.length > 1 && <span className="ml-1">· {tests.length} reports</span>}
              </span>
            )}
          </div>

          {test && (
            <div className="flex items-center gap-3">
              {baselineRows.length > 0 && (
                <span
                  className={`text-[11px] font-medium ${
                    abnormalCount > 0 ? 'text-amber-700' : 'text-emerald-700'
                  }`}
                >
                  {abnormalCount > 0
                    ? `${abnormalCount} outside target`
                    : 'Baseline values in range'}
                </span>
              )}
              <CollapsibleTrigger className="inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-primary hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&[data-state=open]>svg]:rotate-180">
                {open ? 'Hide details' : 'Soil details'}
                <ChevronDown className="h-3.5 w-3.5 transition-transform" />
              </CollapsibleTrigger>
            </div>
          )}
        </div>

        {!test ? (
          <div className="flex items-center gap-3 border-t border-border px-4 py-4 text-sm text-muted-foreground">
            <TestTube className="h-5 w-5 text-muted-foreground/50" />
            No soil test is available for this farm.
          </div>
        ) : baselineRows.length > 0 ? (
          <div className={`grid gap-px border-t border-border bg-border ${baselineGridClass}`}>
            {baselineRows.map((row) => (
              <SoilMetric key={row.paramKey} {...row} wide={baselineRows.length === 1} />
            ))}
          </div>
        ) : (
          <div className="border-t border-border px-4 py-3 text-sm text-muted-foreground">
            This report does not contain the baseline soil measurements.
          </div>
        )}

        <CollapsibleContent>
          <div className="space-y-4 border-t border-border bg-muted/10 px-4 py-4">
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 lg:grid-cols-[180px_repeat(4,minmax(0,1fr))] lg:items-center">
              <p className="col-span-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground lg:col-span-1">
                Farm soil properties
              </p>
              <dl className="contents">
                <SoilFact label="Texture" value={farm.soil_texture_class} />
                <SoilFact
                  label="CEC"
                  value={
                    farm.cation_exchange_capacity != null
                      ? `${farm.cation_exchange_capacity} meq/100g`
                      : null
                  }
                />
                <SoilFact
                  label="Bulk density"
                  value={farm.bulk_density != null ? `${farm.bulk_density} g/ml` : null}
                />
                <SoilFact
                  label="Water retention"
                  value={
                    farm.soil_water_retention != null ? `${farm.soil_water_retention} mm/m` : null
                  }
                />
              </dl>
            </div>

            {extraKeys.length > 0 && (
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Additional results
                </p>
                <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-3 lg:grid-cols-4">
                  {extraKeys.map((key) => (
                    <div key={key} className="bg-card px-3 py-2.5">
                      <p className="text-[10px] text-muted-foreground">{formatParamKey(key)}</p>
                      <p className="mt-0.5 text-sm font-semibold tabular-nums">
                        {typeof parameters[key] === 'number'
                          ? formatValue(parameters[key] as number, ranges[key])
                          : String(parameters[key])}
                        {ranges[key]?.unit && (
                          <span className="ml-1 text-[10px] font-normal text-muted-foreground">
                            {ranges[key].unit}
                          </span>
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(test?.report_storage_path || test?.report_url) && (
              <ReportLink storagePath={test.report_storage_path} directUrl={test.report_url} />
            )}
          </div>
        </CollapsibleContent>
      </section>
    </Collapsible>
  )
}

function SoilMetric({
  paramKey,
  value,
  range,
  isNumeric,
  status,
  wide
}: {
  paramKey: string
  value: number | string
  range: ParamRange | undefined
  isNumeric: boolean
  status: 'optimal' | 'low' | 'high'
  wide: boolean
}) {
  const statusStyles =
    status === 'low'
      ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300'
      : status === 'high'
        ? 'bg-indigo-50 text-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-300'
        : 'bg-card text-foreground'

  return (
    <div
      className={`min-w-0 px-3 py-2.5 ${statusStyles} ${
        wide ? 'flex flex-wrap items-center gap-x-6 gap-y-1 sm:px-4' : ''
      }`}
    >
      <div className={`flex items-center justify-between gap-2 ${wide ? 'min-w-40' : ''}`}>
        <span className="truncate text-[10px] font-medium text-muted-foreground">
          {formatParamKey(paramKey)}
        </span>
        {isNumeric && range && !wide && (
          <span className="shrink-0 text-[9px] font-semibold uppercase tracking-wide">
            {status === 'low' ? 'Low' : status === 'high' ? 'High' : 'Optimal'}
          </span>
        )}
      </div>
      <p className="mt-0.5 text-sm font-semibold tabular-nums">
        {isNumeric ? formatValue(value as number, range) : String(value)}
        {range?.unit && (
          <span className="ml-1 text-[10px] font-normal text-muted-foreground">{range.unit}</span>
        )}
      </p>
      {isNumeric && range && wide && (
        <span className="text-[9px] font-semibold uppercase tracking-wide">
          {status === 'low' ? 'Low' : status === 'high' ? 'High' : 'Optimal'}
        </span>
      )}
      {isNumeric && range && (
        <p className={`${wide ? '' : 'mt-0.5'} text-[9px] text-muted-foreground tabular-nums`}>
          Target {range.min}-{range.max}
        </p>
      )}
    </div>
  )
}

function SoilFact({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-[10px] text-muted-foreground">{label}</dt>
      <dd className={`mt-0.5 text-sm ${value ? 'font-medium' : 'text-muted-foreground italic'}`}>
        {value || 'Not set'}
      </dd>
    </div>
  )
}
