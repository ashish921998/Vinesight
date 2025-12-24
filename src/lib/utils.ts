import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import i18n from '@/lib/i18n'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function formatRemainingWater(value: number | null | undefined): string {
  if (value === null || value === undefined) return i18n.t('common.noWaterData')
  const digits = value >= 100 ? 0 : value >= 10 ? 1 : 2
  const locale = i18n.language || 'en'
  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  })
  return `${formatter.format(value)} ${i18n.t('common.unit')}`
}

export function formatWaterUsage(value: number | null | undefined): string {
  if (value === null || value === undefined) return i18n.t('common.noIrrigationLogged')
  const digits = value >= 100 ? 0 : value >= 10 ? 1 : 2
  const locale = i18n.language || 'en'
  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  })
  return `${formatter.format(value)} ${i18n.t('common.unit')} ${i18n.t('common.applied')}`
}

export function calculateDaysAfterPruning(
  pruningDate?: Date | string | null,
  referenceDate?: Date | string | null
): number | null {
  if (!pruningDate) return null

  try {
    const date = typeof pruningDate === 'string' ? new Date(pruningDate) : pruningDate
    if (!date || isNaN(date.getTime())) return null

    // Use referenceDate if provided (e.g., for log-specific calculations), otherwise use current date
    const refDate = referenceDate
      ? typeof referenceDate === 'string'
        ? new Date(referenceDate)
        : referenceDate
      : new Date()

    if (!refDate || isNaN(refDate.getTime())) return null

    const diffMs = refDate.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    // For log-specific calculations, allow negative values (future dates)
    // For current date calculations, only return non-negative
    return referenceDate ? diffDays : diffDays >= 0 ? diffDays : null
  } catch {
    return null
  }
}
