'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import posthog from 'posthog-js'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { KpiStrip } from '@/components/consultant/dashboard/KpiStrip'
import { DiseasePressureTimeline } from '@/components/consultant/intelligence/DiseasePressureTimeline'
import { SprayProgramComparison } from '@/components/consultant/intelligence/SprayProgramComparison'
import { NetworkRiskTable } from '@/components/consultant/intelligence/NetworkRiskTable'
import { SoilTrendChart } from '@/components/consultant/intelligence/SoilTrendChart'
import { BlockNutrientStatusChart } from '@/components/consultant/intelligence/BlockNutrientStatusChart'
import {
  EARLY_WARNING,
  FLYWHEEL_INPUTS,
  HEADLINE_KPIS,
  NETWORK_SCOPE,
  SOIL_STATS
} from '@/lib/consultant-intelligence-demo'

interface SectionHeadingProps {
  title: string
  sub: string
}

function SectionHeading({ title, sub }: SectionHeadingProps) {
  return (
    <div className="space-y-1">
      <h2 className="font-serif text-lg font-semibold tracking-tight">{title}</h2>
      <p className="max-w-2xl text-sm text-muted-foreground">{sub}</p>
    </div>
  )
}

/** The proactive 72-hour early-warning — the headline "it saw it coming" moment. */
function EarlyWarningAlert() {
  const w = EARLY_WARNING
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-start gap-3 border-l-4 p-4" style={{ borderLeftColor: '#c2410c' }}>
        <AlertTriangle
          className="mt-0.5 h-5 w-5 shrink-0"
          style={{ color: '#c2410c' }}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span
              className="text-[11px] font-semibold uppercase tracking-wide"
              style={{ color: '#c2410c' }}
            >
              Early warning
            </span>
            <span className="text-[11px] text-muted-foreground">·</span>
            <span className="text-[11px] text-muted-foreground">
              {w.leadTimeHours} h lead time · {Math.round(w.confidence * 100)}% confidence
            </span>
          </div>

          <h3 className="mt-1 font-serif text-lg font-semibold tracking-tight">
            Block {w.block} · {w.variety} · {w.acres.toFixed(1)} ac
          </h3>

          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{w.disease} risk projected to climb</span>
            <span className="inline-flex items-center gap-1.5 font-mono font-medium tabular-nums text-foreground">
              {w.currentRisk}
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
              {w.projectedRisk}
            </span>
            <span>within {w.leadTimeHours} hours.</span>
          </p>

          <p className="mt-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Why:</span> {w.drivers.join(' · ')}
          </p>

          <p className="mt-1.5 text-xs">
            <span className="font-medium" style={{ color: '#2f3a44' }}>
              Network signal:
            </span>{' '}
            <span className="text-muted-foreground">{w.networkSignal}</span>
          </p>

          <div
            className="mt-3 rounded-lg border px-3 py-2 text-sm"
            style={{ backgroundColor: '#edf7ef', borderColor: '#a8d5b0' }}
          >
            <span className="font-medium" style={{ color: '#3f7d4c' }}>
              Recommended action:
            </span>{' '}
            <span style={{ color: '#2f3a44' }}>{w.recommendation}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

interface MiniStatProps {
  label: string
  value: string
  sub: string
}

function MiniStat({ label, value, sub }: MiniStatProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 font-mono text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  )
}

/** The honest ask: the data inputs that compound the model season over season. */
function FlywheelPanel() {
  return (
    <Card>
      <CardContent className="p-5">
        <h3 className="font-serif text-base font-semibold tracking-tight">
          How this gets sharper every season
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          The models above are calibrated from logged farm records. The more the network logs, the
          tighter the spray-decision line and the longer the early-warning lead time.
        </p>
        <ol className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {FLYWHEEL_INPUTS.map((input, i) => (
            <li key={input.title} className="flex gap-3">
              <span
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-semibold"
                style={{ backgroundColor: '#e7eee2', color: '#3f7d4c' }}
              >
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{input.title}</p>
                <p className="text-xs leading-relaxed text-muted-foreground">{input.detail}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-4 border-t border-border pt-3 text-sm text-foreground">
          The dataset is the moat — and unlike a model, it compounds. The records logged this season
          are what make next season&apos;s advice sharper.
        </p>
      </CardContent>
    </Card>
  )
}

interface SectionProps {
  children: ReactNode
}

function Section({ children }: SectionProps) {
  return <section className="space-y-4">{children}</section>
}

export default function VineyardIntelligencePage() {
  const captured = useRef(false)
  useEffect(() => {
    if (captured.current) return
    captured.current = true
    posthog.capture('vineyard_intelligence_demo_viewed')
  }, [])

  const kpiTiles = HEADLINE_KPIS.map((k) => ({ label: k.label, value: k.value, sub: k.sub }))

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-serif text-2xl font-semibold tracking-tight">
            Vineyard Intelligence
          </h1>
          <Badge variant="secondary">Preview</Badge>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          AI advisory powered by the grower network — fewer sprays, healthier soil, and export-grade
          residue compliance. Modelled on {NETWORK_SCOPE.seasons} seasons · {NETWORK_SCOPE.blocks}{' '}
          blocks · {NETWORK_SCOPE.acres} acres across the {NETWORK_SCOPE.region} network.
        </p>
      </div>

      {/* Headline outcomes */}
      <KpiStrip tiles={kpiTiles} />

      {/* Act 1 — Disease pressure & spray timing */}
      <Section>
        <SectionHeading
          title="Disease pressure & spray timing"
          sub="Weather-driven mildew risk turns a fixed spray calendar into need-based spraying — and flags trouble 72 hours out."
        />
        <EarlyWarningAlert />
        <DiseasePressureTimeline />
        <SprayProgramComparison />
      </Section>

      {/* Act 2 — Network intelligence */}
      <Section>
        <SectionHeading
          title="Network intelligence"
          sub="Each block's risk is sharpened by confirmed cases nearby. With more farms on the platform, the early warning gets earlier."
        />
        <NetworkRiskTable />
      </Section>

      {/* Act 3 — Soil & nutrition */}
      <Section>
        <SectionHeading
          title="Soil & nutrition"
          sub="Season-over-season tissue trends catch depletion early and surface over-fertilisation — cutting input cost without cutting the vine short."
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <MiniStat
            label="Nitrogen over-application cut"
            value={SOIL_STATS.nitrogenReduced}
            sub="Without dropping petiole N below optimal"
          />
          <MiniStat
            label="Blocks over-applying N"
            value={String(SOIL_STATS.blocksOverApplying)}
            sub="Flagged for fertigation review"
          />
          <MiniStat
            label="K decline caught early"
            value={SOIL_STATS.potassiumCaughtEarly}
            sub="Before the canopy showed it"
          />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <SoilTrendChart />
          <BlockNutrientStatusChart />
        </div>
      </Section>

      {/* Act 4 — The flywheel / the ask */}
      <Section>
        <FlywheelPanel />
      </Section>

      {/* Honest framing */}
      <p className="border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
        Illustrative projection on a representative {NETWORK_SCOPE.region} dataset (
        {NETWORK_SCOPE.seasons} seasons, {NETWORK_SCOPE.blocks} blocks). Figures demonstrate the
        modelling approach and the value of a network dataset — they are not audited field results.
      </p>
    </div>
  )
}
