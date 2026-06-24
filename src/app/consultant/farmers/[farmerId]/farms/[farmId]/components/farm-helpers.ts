import type { ParamRange } from './farm-config'

const PARAM_LABELS: Record<string, string> = {
  ph: 'pH',
  ec: 'EC',
  organic_carbon: 'Organic Carbon',
  nitrogen: 'Nitrogen',
  phosphorus: 'Phosphorus',
  potassium: 'Potassium',
  total_nitrogen: 'Total Nitrogen',
  nitrate_nitrogen: 'Nitrate-N',
  ammonical_nitrogen: 'Ammonical-N',
  calcium: 'Calcium',
  magnesium: 'Magnesium',
  sulphur: 'Sulphur',
  iron: 'Iron',
  manganese: 'Manganese',
  zinc: 'Zinc',
  copper: 'Copper',
  boron: 'Boron',
  molybdenum: 'Molybdenum',
  sodium: 'Sodium',
  chloride: 'Chloride'
}

export function formatParamKey(key: string): string {
  return PARAM_LABELS[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function getStatus(value: number, range: ParamRange): 'optimal' | 'low' | 'high' {
  if (value < range.min) return 'low'
  if (value > range.max) return 'high'
  return 'optimal'
}

export function formatValue(value: number, _range: ParamRange | undefined): string {
  const magnitude = Math.abs(value)
  const decimals = magnitude >= 100 ? 0 : magnitude >= 10 ? 1 : 2
  return value.toFixed(decimals)
}

// Diverging nutrient scale (DESIGN.md): deficient = warm amber, excess = cool
// indigo — opposite temperatures for opposite failures. Optimal stays neutral so
// only out-of-range cells draw the eye. Tokens (--nutrient-*) flip for dark mode.
export function cellClasses(status: 'optimal' | 'low' | 'high', isCurrent: boolean): string {
  const statusBg =
    status === 'low'
      ? 'bg-[var(--nutrient-deficient-bg)] text-[var(--nutrient-deficient)]'
      : status === 'high'
        ? 'bg-[var(--nutrient-excess-bg)] text-[var(--nutrient-excess)]'
        : ''
  const currentRing = isCurrent ? 'ring-1 ring-inset ring-primary/30' : ''
  return `${statusBg} ${currentRing}`.trim()
}

// Per-cell status marker so the matrix never relies on color alone (DESIGN.md:
// "never color alone — always pair with a label"). A direction arrow reads as
// deficient (▾, below range) vs excess (▴, above range); optimal shows nothing.
export function statusGlyph(status: 'optimal' | 'low' | 'high'): string {
  return status === 'low' ? '▾' : status === 'high' ? '▴' : ''
}

/** Screen-reader / title text for a nutrient cell's status. */
export function statusLabel(status: 'optimal' | 'low' | 'high'): string {
  return status === 'low' ? 'Deficient' : status === 'high' ? 'Excess' : 'Optimal'
}

// Uploaded report filenames are prefixed with an upload timestamp
// (e.g. "1768741676670-kabade-...pdf"); strip it for display.
export function prettyReportName(filename: string): string {
  return filename.replace(/^\d+-/, '')
}

export function formatFileSize(bytes: number | null): string | null {
  if (!bytes || bytes <= 0) return null
  const mb = bytes / (1024 * 1024)
  if (mb >= 1) return `${mb.toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}
