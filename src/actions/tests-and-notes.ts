'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/auth-utils'
import {
  toApplicationSoilTestRecord,
  toDatabaseSoilTestInsert,
  toDatabaseSoilTestUpdate,
  toApplicationPetioleTestRecord,
  toDatabasePetioleTestInsert,
  toDatabasePetioleTestUpdate,
  toApplicationDailyNote,
  toDatabaseDailyNoteInsert,
  toDatabaseDailyNoteUpdate
} from '@/lib/supabase-types'
import type { SoilTestRecord, PetioleTestRecord, DailyNoteRecord } from '@/lib/supabase'

// Helper to verify farm ownership
async function verifyFarmOwnership(farmId: number, userId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: farm, error } = await supabase
    .from('farms')
    .select('user_id')
    .eq('id', farmId)
    .single()

  if (error || !farm || farm.user_id !== userId) {
    return false
  }
  return true
}

// ==================== SOIL TEST RECORDS ====================

/**
 * Create a new soil test record
 */
export async function createSoilTestRecord(recordData: Omit<SoilTestRecord, 'id' | 'created_at'>) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    const hasAccess = await verifyFarmOwnership(recordData.farm_id, user.id)
    if (!hasAccess) {
      return { success: false, error: 'Farm not found or unauthorized' }
    }

    const dbInsert = toDatabaseSoilTestInsert(recordData as any)
    const { data, error } = await supabase
      .from('soil_test_records')
      .insert(dbInsert as any)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return { success: false, error: 'Failed to create soil test record' }
    }

    revalidatePath(`/farms/${recordData.farm_id}`)
    revalidatePath(`/farms/${recordData.farm_id}/logs`)

    return {
      success: true,
      data: toApplicationSoilTestRecord(data as any)
    }
  } catch (error) {
    console.error('Create soil test record error:', error)
    return { success: false, error: 'Internal server error' }
  }
}

/**
 * Update a soil test record
 */
export async function updateSoilTestRecord(recordId: number, updates: Partial<SoilTestRecord>) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    const { data: existing, error: fetchError } = await supabase
      .from('soil_test_records')
      .select('farm_id')
      .eq('id', recordId)
      .single()

    if (fetchError || !existing) {
      return { success: false, error: 'Record not found' }
    }

    const hasAccess = await verifyFarmOwnership(existing.farm_id, user.id)
    if (!hasAccess) {
      return { success: false, error: 'Unauthorized' }
    }

    const dbUpdate = toDatabaseSoilTestUpdate(updates as any)
    const { data, error } = await supabase
      .from('soil_test_records')
      .update(dbUpdate as any)
      .eq('id', recordId)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return { success: false, error: 'Failed to update soil test record' }
    }

    revalidatePath(`/farms/${existing.farm_id}`)
    revalidatePath(`/farms/${existing.farm_id}/logs`)

    return {
      success: true,
      data: toApplicationSoilTestRecord(data as any)
    }
  } catch (error) {
    console.error('Update soil test record error:', error)
    return { success: false, error: 'Internal server error' }
  }
}

/**
 * Delete a soil test record
 */
export async function deleteSoilTestRecord(recordId: number) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    const { data: existing, error: fetchError } = await supabase
      .from('soil_test_records')
      .select('farm_id')
      .eq('id', recordId)
      .single()

    if (fetchError || !existing) {
      return { success: false, error: 'Record not found' }
    }

    const hasAccess = await verifyFarmOwnership(existing.farm_id, user.id)
    if (!hasAccess) {
      return { success: false, error: 'Unauthorized' }
    }

    const { error } = await supabase.from('soil_test_records').delete().eq('id', recordId)

    if (error) {
      console.error('Database error:', error)
      return { success: false, error: 'Failed to delete soil test record' }
    }

    revalidatePath(`/farms/${existing.farm_id}`)
    revalidatePath(`/farms/${existing.farm_id}/logs`)

    return { success: true }
  } catch (error) {
    console.error('Delete soil test record error:', error)
    return { success: false, error: 'Internal server error' }
  }
}

// ==================== PETIOLE TEST RECORDS ====================

/**
 * Create a new petiole test record
 */
export async function createPetioleTestRecord(recordData: Omit<PetioleTestRecord, 'id' | 'created_at'>) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    const hasAccess = await verifyFarmOwnership(recordData.farm_id, user.id)
    if (!hasAccess) {
      return { success: false, error: 'Farm not found or unauthorized' }
    }

    const dbInsert = toDatabasePetioleTestInsert(recordData as any)
    const { data, error } = await supabase
      .from('petiole_test_records')
      .insert(dbInsert as any)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return { success: false, error: 'Failed to create petiole test record' }
    }

    revalidatePath(`/farms/${recordData.farm_id}`)
    revalidatePath(`/farms/${recordData.farm_id}/logs`)

    return {
      success: true,
      data: toApplicationPetioleTestRecord(data as any)
    }
  } catch (error) {
    console.error('Create petiole test record error:', error)
    return { success: false, error: 'Internal server error' }
  }
}

/**
 * Update a petiole test record
 */
export async function updatePetioleTestRecord(recordId: number, updates: Partial<PetioleTestRecord>) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    const { data: existing, error: fetchError } = await supabase
      .from('petiole_test_records')
      .select('farm_id')
      .eq('id', recordId)
      .single()

    if (fetchError || !existing) {
      return { success: false, error: 'Record not found' }
    }

    const hasAccess = await verifyFarmOwnership(existing.farm_id, user.id)
    if (!hasAccess) {
      return { success: false, error: 'Unauthorized' }
    }

    const dbUpdate = toDatabasePetioleTestUpdate(updates as any)
    const { data, error } = await supabase
      .from('petiole_test_records')
      .update(dbUpdate as any)
      .eq('id', recordId)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return { success: false, error: 'Failed to update petiole test record' }
    }

    revalidatePath(`/farms/${existing.farm_id}`)
    revalidatePath(`/farms/${existing.farm_id}/logs`)

    return {
      success: true,
      data: toApplicationPetioleTestRecord(data as any)
    }
  } catch (error) {
    console.error('Update petiole test record error:', error)
    return { success: false, error: 'Internal server error' }
  }
}

/**
 * Delete a petiole test record
 */
export async function deletePetioleTestRecord(recordId: number) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    const { data: existing, error: fetchError } = await supabase
      .from('petiole_test_records')
      .select('farm_id')
      .eq('id', recordId)
      .single()

    if (fetchError || !existing) {
      return { success: false, error: 'Record not found' }
    }

    const hasAccess = await verifyFarmOwnership(existing.farm_id, user.id)
    if (!hasAccess) {
      return { success: false, error: 'Unauthorized' }
    }

    const { error } = await supabase.from('petiole_test_records').delete().eq('id', recordId)

    if (error) {
      console.error('Database error:', error)
      return { success: false, error: 'Failed to delete petiole test record' }
    }

    revalidatePath(`/farms/${existing.farm_id}`)
    revalidatePath(`/farms/${existing.farm_id}/logs`)

    return { success: true }
  } catch (error) {
    console.error('Delete petiole test record error:', error)
    return { success: false, error: 'Internal server error' }
  }
}

// ==================== DAILY NOTES ====================

/**
 * Create a new daily note
 */
export async function createDailyNote(noteData: Omit<DailyNoteRecord, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    const hasAccess = await verifyFarmOwnership(noteData.farm_id, user.id)
    if (!hasAccess) {
      return { success: false, error: 'Farm not found or unauthorized' }
    }

    const dbInsert = toDatabaseDailyNoteInsert(noteData as any)
    const { data, error } = await supabase
      .from('daily_notes')
      .insert(dbInsert as any)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return { success: false, error: 'Failed to create daily note' }
    }

    revalidatePath(`/farms/${noteData.farm_id}`)
    revalidatePath(`/farms/${noteData.farm_id}/logs`)

    return {
      success: true,
      data: toApplicationDailyNote(data as any)
    }
  } catch (error) {
    console.error('Create daily note error:', error)
    return { success: false, error: 'Internal server error' }
  }
}

/**
 * Update a daily note
 */
export async function updateDailyNote(noteId: number, updates: Partial<DailyNoteRecord>) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    const { data: existing, error: fetchError } = await supabase
      .from('daily_notes')
      .select('farm_id')
      .eq('id', noteId)
      .single()

    if (fetchError || !existing) {
      return { success: false, error: 'Note not found' }
    }

    const hasAccess = await verifyFarmOwnership(existing.farm_id, user.id)
    if (!hasAccess) {
      return { success: false, error: 'Unauthorized' }
    }

    const dbUpdate = toDatabaseDailyNoteUpdate(updates as any)
    const { data, error } = await supabase
      .from('daily_notes')
      .update(dbUpdate as any)
      .eq('id', noteId)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return { success: false, error: 'Failed to update daily note' }
    }

    revalidatePath(`/farms/${existing.farm_id}`)
    revalidatePath(`/farms/${existing.farm_id}/logs`)

    return {
      success: true,
      data: toApplicationDailyNote(data as any)
    }
  } catch (error) {
    console.error('Update daily note error:', error)
    return { success: false, error: 'Internal server error' }
  }
}

/**
 * Delete a daily note
 */
export async function deleteDailyNote(noteId: number) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    const { data: existing, error: fetchError } = await supabase
      .from('daily_notes')
      .select('farm_id')
      .eq('id', noteId)
      .single()

    if (fetchError || !existing) {
      return { success: false, error: 'Note not found' }
    }

    const hasAccess = await verifyFarmOwnership(existing.farm_id, user.id)
    if (!hasAccess) {
      return { success: false, error: 'Unauthorized' }
    }

    const { error } = await supabase.from('daily_notes').delete().eq('id', noteId)

    if (error) {
      console.error('Database error:', error)
      return { success: false, error: 'Failed to delete daily note' }
    }

    revalidatePath(`/farms/${existing.farm_id}`)
    revalidatePath(`/farms/${existing.farm_id}/logs`)

    return { success: true }
  } catch (error) {
    console.error('Delete daily note error:', error)
    return { success: false, error: 'Internal server error' }
  }
}
