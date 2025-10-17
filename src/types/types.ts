import { Database } from './database'

export type TaskStatus = 'pending' | 'in-progress' | 'completed'
export type TaskPriority = 'low' | 'medium' | 'high'

// Task type matching the database schema
export interface Task {
  id: number
  userId: string
  farmId: number | null
  title: string
  description: string | null
  dueDate: string
  priority: TaskPriority
  status: TaskStatus
  category: string
  type: string
  completed: boolean
  createdAt: string | null
  updatedAt: string | null
}

// Convert database row to Task
export function taskFromDB(row: Database['public']['Tables']['tasks']['Row']): Task {
  const status = (row.status as TaskStatus) || 'pending'
  const category = row.category ?? 'general'

  return {
    id: row.id,
    userId: row.user_id,
    farmId: row.farm_id,
    title: row.title,
    description: row.description,
    dueDate: row.due_date,
    priority: (row.priority as TaskPriority) || 'medium',
    status,
    category,
    type: category,
    completed: status === 'completed',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

// Complete farm interface with camelCase properties
export interface Farm {
  id?: number
  name: string
  region: string
  area: number // in acres
  grapeVariety: string
  plantingDate: string
  vineSpacing?: number // in meters
  rowSpacing?: number // in meters
  totalTankCapacity?: number // in liters
  systemDischarge?: number // in liters per hour (farm-level default)
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
