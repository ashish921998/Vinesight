/**
 * Shared types for lab test records and related functionality
 */

/**
 * Lab test record type that handles both soil and petiole test records
 * This interface consolidates common fields across all lab test types
 * Note: Date fields can be either Date objects (from database) or strings (from API/forms)
 * Note: parameters can be undefined when a test record exists without parsed data
 */
export interface LabTestRecord {
  id?: number
  date: string | Date
  date_of_pruning?: string | Date | null
  parameters?: Record<string, any>
  notes?: string | null
  report_filename?: string | null
  report_url?: string | null
  report_storage_path?: string | null
  extraction_status?: string | null
  created_at?: string | Date | null
  farm_id?: number | null
}
