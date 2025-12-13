'use client'

import type { Worker } from '@/lib/supabase'
import { MobileAttendanceView } from './MobileAttendanceView'

interface Farm {
  id: number
  name: string
}

interface AttendanceSheetProps {
  farms: Farm[]
  workers: Worker[]
  onAttendanceSaved: () => void
}

export function AttendanceSheet({ farms, workers, onAttendanceSaved }: AttendanceSheetProps) {
  // Always use the worker-centric attendance view (MobileAttendanceView works on all screen sizes)
  return (
    <MobileAttendanceView farms={farms} workers={workers} onAttendanceSaved={onAttendanceSaved} />
  )
}
