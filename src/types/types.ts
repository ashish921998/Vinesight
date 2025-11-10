import { Database } from './database'

// Task type matching the task_reminders table schema
export interface TaskReminder {
  id: number
  farmId: number
  title: string
  description: string | null
  type:
    | 'irrigation'
    | 'spray'
    | 'fertigation'
    | 'harvest'
    | 'soil_test'
    | 'petiole_test'
    | 'expense'
    | 'note'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high'
  dueDate: string | null
  estimatedDurationMinutes: number | null
  location: string | null
  completed: boolean
  completedAt: string | null
  createdAt: string
  updatedAt: string
  assignedToUserId: string | null
  createdBy: string | null
  linkedRecordType: string | null
  linkedRecordId: number | null
}

// Convert database row to TaskReminder (task_reminders table)
export function taskReminderFromDB(
  row: Database['public']['Tables']['task_reminders']['Row']
): TaskReminder {
  if (!row.farm_id) {
    throw new Error(`Task ${row.id} has invalid farm_id: ${row.farm_id}`)
  }

  return {
    id: row.id,
    farmId: row.farm_id,
    title: row.title,
    description: row.description,
    type: row.type as TaskReminder['type'],
    status: (row.status as TaskReminder['status']) || 'pending',
    priority: (row.priority as TaskReminder['priority']) || 'medium',
    dueDate: row.due_date,
    estimatedDurationMinutes: row.estimated_duration_minutes,
    location: row.location,
    completed: row.completed ?? row.status === 'completed',
    completedAt: row.completed_at,
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
    assignedToUserId: row.assigned_to_user_id,
    createdBy: row.created_by,
    linkedRecordType: row.linked_record_type,
    linkedRecordId: row.linked_record_id
  }
}

// Complete farm interface with camelCase properties
export interface Farm {
  id?: number
  name: string
  region: string
  area: number // in acres
  crop: string // e.g., "Grapes", "Pomegranates", "Cotton"
  cropVariety: string // variety of the selected crop
  plantingDate: string
  vineSpacing?: number // in meters
  rowSpacing?: number // in meters
  totalTankCapacity?: number // in mm
  systemDischarge?: number // in mm per hour (farm-level default)
  remainingWater?: number // in mm (calculated value)
  waterCalculationUpdatedAt?: string // when water calculation was last done
  latitude?: number // coordinates (decimal degrees)
  longitude?: number // coordinates (decimal degrees)
  elevation?: number // meters above sea level
  locationName?: string // human readable location name
  timezone?: string // timezone identifier
  locationSource?: 'manual' | 'search' | 'current' // how location was set
  locationUpdatedAt?: string // when location was last updated
  dateOfPruning?: Date // Date object when pruning was done
  createdAt?: string
  updatedAt?: string
  userId?: string // For multi-user support
}

// Weather data interface
export interface WeatherData {
  temperature: number
  humidity: number
  precipitation: number
  windSpeed: number
  date: string
}

// Export database types for convenience
export type { Database } from './database'
export type DatabaseRow<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type DatabaseInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']
export type DatabaseUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
