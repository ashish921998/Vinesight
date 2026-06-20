import type { ParamRange } from './farm-config'

const PARAM_LABELS: Record<string, string> = {
  ph: 'pH',
  ec: 'EC',
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

export function cellClasses(status: 'optimal' | 'low' | 'high', isCurrent: boolean): string {
  const statusBg =
    status === 'low'
      ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200'
      : status === 'high'
        ? 'bg-rose-100 text-rose-900 dark:bg-rose-950/40 dark:text-rose-200'
        : ''
  const currentRing = isCurrent ? 'ring-1 ring-inset ring-primary/30' : ''
  return `${statusBg} ${currentRing}`.trim()
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

// Inline helper to fetch farmer profile for the farm page header.
export async function supabaseGetFarmerProfile(farmerId: string) {
  const { getTypedSupabaseClient } = await import('@/lib/supabase')
  const supabase = await getTypedSupabaseClient()
  const { data } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', farmerId)
    .maybeSingle()
  return data
}
