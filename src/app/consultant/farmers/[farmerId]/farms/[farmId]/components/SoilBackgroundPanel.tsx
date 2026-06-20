'use client'

import { useState } from 'react'
import { ChevronDown, TestTube } from 'lucide-react'
import type { LabTestRecord } from '@/types/lab-tests'
import type { FarmDetail } from '@/lib/consultant-query-service'
import { ReportLink } from './ReportLink'
import { type ParamRange } from './farm-config'
import { formatParamKey, getStatus } from './farm-helpers'

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
  const [showAllSoil, setShowAllSoil] = useState(false)
  const parameters = test?.parameters || {}
  const baselineRows = baselineKeys
    .filter((k) => parameters[k] !== undefined && parameters[k] !== null)
    .map((key) => {
      const value = parameters[key]
      const range = ranges[key]
      const isNumeric = typeof value === 'number'
      const status = isNumeric && range ? getStatus(value as number, range) : 'optimal'
      return { paramKey: key, value, range, isNumeric, status }
    })

  const allKeys = Object.keys(parameters).filter(
    (k) => parameters[k] !== undefined && parameters[k] !== null
  )
  const extraKeys = allKeys.filter((k) => !baselineKeys.includes(k))

  return (
    <div className="space-y-3">
      {test?.date && (
        <span className="block text-[11px] text-muted-foreground tabular-nums">
          Tested{' '}
          {new Date(test.date).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
          {tests.length > 1 && (
            <span className="text-muted-foreground/70 ml-1">· {tests.length} reports</span>
          )}
        </span>
      )}

      {!test ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          <TestTube className="h-5 w-5 text-muted-foreground/40 mx-auto mb-2" />
          No soil test on record. Soil context will appear here once a report is uploaded.
        </div>
      ) : (
        <>
          {/* Configurable baseline strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {baselineRows.map((row) => (
              <SoilBaselineCard key={row.paramKey} {...row} />
            ))}
          </div>

          {/* Farm-level soil facts (2x2 — reads cleaner in the narrower column) */}
          <div className="grid grid-cols-2 gap-2">
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
              value={farm.soil_water_retention != null ? `${farm.soil_water_retention} mm/m` : null}
            />
          </div>

          {/* Expandable complete soil results */}
          {extraKeys.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowAllSoil((v) => !v)}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <ChevronDown
                  className={`h-3 w-3 transition-transform ${showAllSoil ? 'rotate-180' : ''}`}
                />
                {showAllSoil ? 'Hide full results' : `View all soil results (${extraKeys.length})`}
              </button>
              {showAllSoil && (
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {extraKeys.map((key) => (
                    <div key={key} className="rounded-md border border-border/60 bg-card px-3 py-2">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                        {formatParamKey(key)}
                      </p>
                      <p className="text-sm font-semibold tabular-nums mt-0.5">
                        {typeof parameters[key] === 'number'
                          ? (parameters[key] as number).toFixed(2)
                          : String(parameters[key])}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {(test.report_storage_path || test.report_url) && (
            <ReportLink storagePath={test.report_storage_path} directUrl={test.report_url} />
          )}
        </>
      )}
    </div>
  )
}

function SoilBaselineCard({
  paramKey,
  value,
  range,
  isNumeric,
  status
}: {
  paramKey: string
  value: number | string
  range: ParamRange | undefined
  isNumeric: boolean
  status: 'optimal' | 'low' | 'high'
}) {
  const statusColor =
    status === 'low'
      ? 'text-amber-700 dark:text-amber-500'
      : status === 'high'
        ? 'text-rose-700 dark:text-rose-500'
        : 'text-emerald-700 dark:text-emerald-500'

  return (
    <div className="rounded-md border border-border/60 bg-card px-3 py-2">
      <div className="flex items-baseline justify-between">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
          {formatParamKey(paramKey)}
        </p>
        {isNumeric && range && status !== 'optimal' && (
          <span className={`text-[9px] font-semibold uppercase ${statusColor}`}>
            {status === 'low' ? 'Low' : 'High'}
          </span>
        )}
      </div>
      <p className="text-base font-bold tabular-nums mt-0.5">
        {isNumeric ? (value as number).toFixed(2) : String(value)}
        {range?.unit ? (
          <span className="text-[10px] font-normal text-muted-foreground ml-1">{range.unit}</span>
        ) : null}
      </p>
      {isNumeric && range && (
        <p className="text-[10px] text-muted-foreground tabular-nums mt-0.5">
          Target {range.min}-{range.max}
        </p>
      )}
    </div>
  )
}

function SoilFact({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-md border border-border/60 bg-muted/20 px-3 py-2">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p
        className={`text-sm font-medium mt-0.5 ${
          value ? 'text-foreground' : 'text-muted-foreground/50 italic'
        }`}
      >
        {value || 'Not set'}
      </p>
    </div>
  )
}
