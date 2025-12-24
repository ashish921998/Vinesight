import { toast } from 'sonner'
import { NUMBER_SYSTEM } from './constants'
import { SupabaseService } from './supabase-service'
import { PhotoService } from './photo-service'

export interface DailyNoteOperation {
  farmId: number
  date: string
  notes: string
  existingId?: number | null
  forceCreate?: boolean // Force creation even with empty notes (e.g., for photo attachment)
}

export interface DailyNoteResult {
  dailyNoteId: number | null
  success: boolean
  error?: string
}

/**
 * Handle daily note creation/update/deletion in a centralized way
 */
export async function handleDailyNoteOperation(
  operation: DailyNoteOperation
): Promise<DailyNoteResult> {
  const { farmId, date, notes, existingId, forceCreate = false } = operation
  const trimmedNotes = notes.trim()
  const shouldPersistDailyNote = trimmedNotes.length > 0 || forceCreate
  let dailyNoteRecordId: number | null = null

  try {
    if (shouldPersistDailyNote) {
      let dailyNote
      if (existingId) {
        // Update existing note (PATCH equivalent)
        dailyNote = await SupabaseService.updateDailyNote(existingId, {
          notes: trimmedNotes
        })
      } else {
        // Create new note (POST equivalent)
        dailyNote = await SupabaseService.upsertDailyNote({
          farm_id: farmId,
          date,
          notes: trimmedNotes
        })
      }
      dailyNoteRecordId = dailyNote?.id ?? null
    } else if (existingId) {
      await SupabaseService.deleteDailyNote(existingId)
    }

    return { dailyNoteId: dailyNoteRecordId, success: true }
  } catch (error) {
    console.error('Error handling daily note operation:', error)
    return {
      dailyNoteId: null,
      success: false,
      error: 'Failed to save daily note. Other data may still be saved.'
    }
  }
}

/**
 * Handle photo uploads for daily notes or log entries
 */
export async function handleDayPhotoUpload(
  photos: File[],
  targetId: number
): Promise<{ success: boolean; errorCount: number }> {
  if (!photos.length) return { success: true, errorCount: 0 }

  let errorCount = 0

  for (const photo of photos) {
    try {
      await PhotoService.uploadPhoto(photo, 'day_photos', targetId)
    } catch (photoError) {
      console.error('Error uploading day photo:', photoError)
      errorCount++
    }
  }

  return {
    success: errorCount === 0,
    errorCount
  }
}

/**
 * Complete daily notes and photos operation
 */
export async function processDailyNotesAndPhotos(
  operation: DailyNoteOperation,
  photos: File[],
  firstRecordId: number | null
): Promise<{ success: boolean; message?: string }> {
  const hasPhotos = photos.length > 0
  const hasNotes = operation.notes.trim().length > 0

  // If photos are provided but no firstRecordId exists and no notes,
  // we must create a daily note to attach photos to
  if (hasPhotos && !firstRecordId && !hasNotes) {
    operation.forceCreate = true // Force creation of empty note for photo attachment
  }

  // Handle daily note operation
  const noteResult = await handleDailyNoteOperation(operation)

  // If note operation failed, immediately return failure
  if (!noteResult.success) {
    const errorMessage = noteResult.error || 'Failed to save daily note.'
    toast.error(errorMessage)
    return { success: false, message: errorMessage }
  }

  // Determine photo target ID from firstRecordId or noteResult.dailyNoteId
  let photoTargetId = firstRecordId ?? noteResult.dailyNoteId

  // If we have photos but still no target ID after note operation, this is an error
  if (hasPhotos && !photoTargetId) {
    const errorMessage = 'Cannot upload photos: no record ID available.'
    toast.error(errorMessage)
    return { success: false, message: errorMessage }
  }

  // Handle photo uploads if we have photos and a valid target ID
  if (hasPhotos && photoTargetId) {
    const photoResult = await handleDayPhotoUpload(photos, photoTargetId)
    if (!photoResult.success) {
      const errorMessage = `${photoResult.errorCount} photo(s) failed to upload.`
      toast.error(errorMessage)
      return { success: false, message: errorMessage }
    }
  }

  return { success: true }
}

/**
 * Unified handler for daily notes and photos after log submission
 * This consolidates the duplicate logic from page.tsx and logs/page.tsx
 */
export async function handleDailyNotesAndPhotosAfterLogs(params: {
  logs: any[]
  dayNotes: string
  dayPhotos: File[]
  firstRecordId: number | null
  existingDailyNoteId: number | null
  farmId: number
  date: string
}): Promise<void> {
  const { logs, dayNotes, dayPhotos, firstRecordId, existingDailyNoteId, farmId, date } = params
  const hasLogs = logs.length > 0

  if (hasLogs) {
    // When logs exist:
    // 1. Log-specific notes are already saved in individual log records
    // 2. Photos attach to first log record
    // 3. General day notes (if provided) are saved separately in daily_notes table

    if (dayPhotos.length > 0 && firstRecordId) {
      const photoResult = await handleDayPhotoUpload(dayPhotos, firstRecordId)
      if (!photoResult.success) {
        toast.error(`${photoResult.errorCount} photo(s) failed to upload.`)
      }
    }

    // Save general day notes separately if provided
    if (dayNotes.trim().length > 0) {
      await processDailyNotesAndPhotos(
        {
          farmId,
          date,
          notes: dayNotes,
          existingId: existingDailyNoteId
        },
        [], // Photos already handled above
        null
      )
    } else if (existingDailyNoteId) {
      // Delete existing daily_note if general notes were removed
      try {
        await SupabaseService.deleteDailyNote(existingDailyNoteId)
      } catch (error) {
        console.error('Error deleting daily note:', error)
        // Don't throw - this is not critical
      }
    }
  } else {
    // No logs - create/update daily_notes entry for standalone notes
    await processDailyNotesAndPhotos(
      {
        farmId,
        date,
        notes: dayNotes,
        existingId: existingDailyNoteId
      },
      dayPhotos,
      null // No firstRecordId since there are no logs
    )
  }
}

/**
 * Parse farm ID safely
 */
export function parseFarmId(farmId: string): number {
  return parseInt(farmId, NUMBER_SYSTEM.RADIX_DECIMAL)
}

/**
 * Check if daily note should be persisted
 */
export function shouldPersistDailyNote(notes: string, photos: File[]): boolean {
  return notes.trim().length > 0 || photos.length > 0
}

/**
 * Generate appropriate save button label
 */
export function generateSaveButtonLabel(hasLogs: boolean, logCount: number): string {
  return hasLogs ? `Save All Logs (${logCount})` : 'Save Daily Notes'
}

/**
 * Check if activities should open in single edit modal
 */
export function shouldUseSingleEditModal(activities: any[]): boolean {
  return activities.length === 1 && activities[0]?.type !== 'daily_note'
}

/**
 * Extract daily note from activities
 */
export function extractDailyNoteFromActivities(
  activities: any[]
): { id: number | null; notes: string } | null {
  const dayNoteActivity = activities.find((act) => act.type === 'daily_note')
  if (dayNoteActivity) {
    return {
      id: dayNoteActivity.id ?? null,
      notes: dayNoteActivity.notes || ''
    }
  }
  return null
}
