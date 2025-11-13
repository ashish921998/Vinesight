import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function capitalize(str: string): string {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export const formatRemainingWater = (value: number | null | undefined) => {
  if (value === null || value === undefined) return '—'
  return `${value.toFixed(1)} mm`
}
