'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  AI_ROUNDS,
  AI_SPRAY_MARKERS,
  CALENDAR_PROGRAM,
  CALENDAR_ROUNDS,
  PRESSURE_TIMELINE,
  ROUNDS_AVOIDED,
  SKIPPED_ROUNDS,
  type ProgramRound,
  type SprayMarker
} from '@/lib/consultant-intelligence-demo'

const SERIES_SAGE = '#6f8f5e'
const SERIES_SLATE = '#2f3a44'

const LAST_WEEK = PRESSURE_TIMELINE[PRESSURE_TIMELINE.length - 1].week
const leftPct = (week: number) => (week / LAST_WEEK) * 100
const labelForWeek = (week: number) => PRESSURE_TIMELINE[week]?.label ?? ''

// High-pressure windows (a disease index ≥ threshold), shaded behind both lanes
// so the eye can check whether each spray sits under real pressure.
const HIGH_PRESSURE_BANDS = [
  { start: 0, end: 1 },
  { start: 3, end: 3 },
  { start: 8, end: 9 },
  { start: 14, end: 15 },
  { start: 19, end: 21 }
]

const MONTH_TICKS = PRESSURE_TIMELINE.reduce<{ month: string; week: number }[]>((ticks, p) => {
  if (p.monthStart) ticks.push({ month: p.label.split(' ')[1], week: p.week })
  return ticks
}, [])

function PressureBands() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {HIGH_PRESSURE_BANDS.map((b) => {
        const left = Math.max(0, ((b.start - 0.4) / LAST_WEEK) * 100)
        const width = ((b.end - b.start + 0.8) / LAST_WEEK) * 100
        return (
          <div
            key={b.start}
            className="absolute inset-y-0 rounded-sm"
            style={{
              left: `${left}%`,
              width: `${width}%`,
              backgroundColor: 'rgba(181, 71, 8, 0.07)'
            }}
          />
        )
      })}
    </div>
  )
}

function CalendarLane() {
  return (
    <div className="relative h-9">
      <PressureBands />
      <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />
      {CALENDAR_PROGRAM.map((r: ProgramRound) => {
        const skipped = r.status === 'skipped'
        return (
          <span
            key={r.week}
            className={cn(
              'absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border',
              skipped ? 'border-dashed bg-card' : 'border-transparent'
            )}
            style={{
              left: `${leftPct(r.week)}%`,
              backgroundColor: skipped ? undefined : SERIES_SLATE,
              borderColor: skipped ? '#9a9f99' : undefined
            }}
            title={`${labelForWeek(r.week)} · risk ${r.risk}${skipped ? ' — low pressure, AI skipped' : ' — sprayed'}`}
          />
        )
      })}
    </div>
  )
}

function AiLane() {
  return (
    <div className="relative h-9">
      <PressureBands />
      <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />
      {AI_SPRAY_MARKERS.map((m: SprayMarker, i) => (
        <span
          key={m.week}
          className="absolute top-1/2 flex h-4 w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-[9px] font-semibold text-white"
          style={{ left: `${leftPct(m.week)}%`, backgroundColor: SERIES_SAGE }}
          title={`${labelForWeek(m.week)} · ${m.note}`}
        >
          {i + 1}
        </span>
      ))}
    </div>
  )
}

/**
 * Calendar program (14 fixed fortnightly rounds) vs the AI-guided program (9
 * risk-timed rounds), on a shared season axis. Skipped calendar rounds render as
 * hollow rings; AI rounds are numbered and sit under the shaded pressure windows.
 */
export function SprayProgramComparison() {
  const skippedExamples = SKIPPED_ROUNDS.slice(0, 2)
    .map((r) => `${labelForWeek(r.week)} (risk ${r.risk})`)
    .join(' and ')

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-2">
        <div className="min-w-0">
          <CardTitle className="text-base">Calendar program vs AI-guided program</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Same season, same blocks — fewer, better-timed sprays
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-mono text-2xl font-semibold tabular-nums tracking-tight">
            {CALENDAR_ROUNDS} → {AI_ROUNDS}
          </p>
          <p className="text-[11px] text-muted-foreground">{ROUNDS_AVOIDED} rounds avoided</p>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="space-y-5 pt-1">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-medium text-foreground">Calendar program</span>
              <span className="text-[11px] text-muted-foreground">
                {CALENDAR_ROUNDS} fixed fortnightly rounds
              </span>
            </div>
            <CalendarLane />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-medium text-foreground">VineSight AI program</span>
              <span className="text-[11px] text-muted-foreground">
                {AI_ROUNDS} risk-timed rounds
              </span>
            </div>
            <AiLane />
          </div>

          {/* Shared month axis */}
          <div className="relative h-4">
            {MONTH_TICKS.map((t) => (
              <span
                key={t.month}
                className="absolute -translate-x-1/2 font-mono text-[10px] text-muted-foreground"
                style={{ left: `${leftPct(t.week)}%` }}
              >
                {t.month}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: SERIES_SLATE }} />
            Calendar round
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full border border-dashed border-[#9a9f99] bg-card" />
            Skipped — low pressure
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: SERIES_SAGE }} />
            AI-guided round
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="h-3 w-4 rounded-sm"
              style={{ backgroundColor: 'rgba(181, 71, 8, 0.12)' }}
            />
            High-pressure window
          </span>
        </div>

        <div className="rounded-lg border border-border bg-secondary/30 p-3 text-xs leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">Why {ROUNDS_AVOIDED} fewer rounds:</span>{' '}
          the calendar fires every fortnight regardless of conditions. Five rounds fell in
          low-pressure windows — {skippedExamples} — and were safely skipped. The AI instead added a
          preventive round on 05 Jan, ahead of the 12 Jan rain that a fixed calendar would have met
          six days late.
        </div>
      </CardContent>
    </Card>
  )
}
