import { Database } from './database';

// Task Reminder type matching the database schema
export interface TaskReminder {
  id: number;
  farmId: number | null;
  title: string;
  description: string | null;
  dueDate: string;
  type: string;
  completed: boolean | null;
  completedAt: string | null;
  priority: string | null;
  createdAt: string | null;
}

// Convert database row to TaskReminder
export function taskReminderFromDB(row: Database['public']['Tables']['task_reminders']['Row']): TaskReminder {
  return {
    id: row.id,
    farmId: row.farm_id,
    title: row.title,
    description: row.description,
    dueDate: row.due_date,
    type: row.type,
    completed: row.completed,
    completedAt: row.completed_at,
    priority: row.priority,
    createdAt: row.created_at
  };
}

// Complete farm interface with camelCase properties
export interface Farm {
  id?: number;
  name: string;
  region: string;
  area: number; // in acres
  grapeVariety: string;
  plantingDate: string;
  vineSpacing?: number; // in meters
  rowSpacing?: number; // in meters
  totalTankCapacity?: number; // in liters
  systemDischarge?: number; // in liters per hour (farm-level default)
  remainingWater?: number; // in mm (calculated value)
  waterCalculationUpdatedAt?: string; // when water calculation was last done
  latitude?: number; // coordinates (decimal degrees)
  longitude?: number; // coordinates (decimal degrees)
  elevation?: number; // meters above sea level
  locationName?: string; // human readable location name
  timezone?: string; // timezone identifier
  locationSource?: 'manual' | 'search' | 'current'; // how location was set
  locationUpdatedAt?: string; // when location was last updated
  dateOfPruning?: string; // Date when pruning was done
  createdAt?: string;
  updatedAt?: string;
  userId?: string; // For multi-user support
}

// Weather data interface
export interface WeatherData {
  temperature: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  date: string;
}

// Export database types for convenience
export type { Database } from './database';
export type DatabaseRow<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type DatabaseInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type DatabaseUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];