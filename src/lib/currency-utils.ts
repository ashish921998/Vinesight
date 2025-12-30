export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AUD' | 'CAD'

const currencySymbols: Record<CurrencyCode, { symbol: string; locale: string }> = {
  INR: { symbol: '₹', locale: 'en-IN' },
  USD: { symbol: '$', locale: 'en-US' },
  EUR: { symbol: '€', locale: 'de-DE' },
  GBP: { symbol: '£', locale: 'en-GB' },
  AUD: { symbol: 'A$', locale: 'en-AU' },
  CAD: { symbol: 'C$', locale: 'en-CA' }
}

export function formatCurrency(amount: number, currency: CurrencyCode = 'INR'): string {
  const config = currencySymbols[currency]
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: currency
  }).format(amount)
}

export function formatCompactCurrency(amount: number, currency: CurrencyCode = 'INR'): string {
  const config = currencySymbols[currency]
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 0
  }).format(amount)
}

export function getCurrencySymbol(currency: CurrencyCode): string {
  return currencySymbols[currency].symbol
}

export type SpacingUnit = 'feet' | 'mm'

export function formatSpacing(
  value: number,
  unit: SpacingUnit = 'feet',
  precision: number = 2
): string {
  const clampedPrecision = Math.max(0, Math.min(100, precision))
  return `${value.toFixed(clampedPrecision)} ${unit}`
}

export function convertSpacing(value: number, fromUnit: SpacingUnit, toUnit: SpacingUnit): number {
  if (fromUnit === toUnit) return value

  if (fromUnit === 'feet' && toUnit === 'mm') {
    return value * 304.8
  }

  return value / 304.8
}
