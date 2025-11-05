/**
 * Utility functions for daily note operations
 * Reduces code duplication across components
 */

import { toast } from 'sonner'
import { NUMBER_SYSTEM } from './constants'
import { SupabaseService } from './supabase-service'
import { PhotoService } from './photo-service'

export interface DailyNoteOperation {
  farmId: number
  date: string
  notes: string
  existingId?: number | null
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
  const { farmId, date, notes, existingId } = operation
  const trimmedNotes = notes.trim()
  const shouldPersistDailyNote = trimmedNotes.length > 0
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
  // Handle daily note operation
  const noteResult = await handleDailyNoteOperation(operation)
  if (!noteResult.success) {
    toast.error(noteResult.error || 'Failed to save daily note.')
  }

  // Determine photo target ID
  let photoTargetId = firstRecordId
  if (!photoTargetId && noteResult.dailyNoteId) {
    photoTargetId = noteResult.dailyNoteId
  }

  // Handle photo uploads
  if (photoTargetId && photos.length > 0) {
    const photoResult = await handleDayPhotoUpload(photos, photoTargetId)
    if (!photoResult.success) {
      toast.error(`${photoResult.errorCount} photo(s) failed to upload, but other data was saved.`)
    }
  }

  return { success: true }
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
