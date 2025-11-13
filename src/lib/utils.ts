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

export const calculateDaysAfterPruning = (pruningDate?: Date | null) => {
  if (!pruningDate) return null

  const pruning = pruningDate
  const today = new Date()

  const pruningMidnight = new Date(pruning.getFullYear(), pruning.getMonth(), pruning.getDate())
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  const diffTime = todayMidnight.getTime() - pruningMidnight.getTime()

  const rawDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  const diffDays = rawDays + 1

  return diffDays > 0 ? diffDays : null
}
