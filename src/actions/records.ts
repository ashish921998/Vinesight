'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/auth-utils'
import {
  IrrigationSchema,
  SpraySchema,
  HarvestSchema,
  ExpenseSchema,
  validateAndSanitize
} from '@/lib/validation'
import {
  toApplicationIrrigationRecord,
  toDatabaseIrrigationInsert,
  toDatabaseIrrigationUpdate,
  toApplicationSprayRecord,
  toDatabaseSprayInsert,
  toDatabaseSprayUpdate,
  toApplicationHarvestRecord,
  toDatabaseHarvestInsert,
  toDatabaseHarvestUpdate,
  toApplicationFertigationRecord,
  toDatabaseFertigationInsert,
  toDatabaseFertigationUpdate,
  toApplicationExpenseRecord,
  toDatabaseExpenseInsert,
  toDatabaseExpenseUpdate
} from '@/lib/supabase-types'
import type {
  IrrigationRecord,
  SprayRecord,
  HarvestRecord,
  FertigationRecord,
  ExpenseRecord
} from '@/lib/supabase'

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

// ==================== IRRIGATION RECORDS ====================

/**
 * Create a new irrigation record
 */
export async function createIrrigationRecord(recordData: Omit<IrrigationRecord, 'id' | 'created_at'>) {
  try {
    const validation = validateAndSanitize(IrrigationSchema, recordData)

    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        details: validation.errors
      }
    }

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

    const dbInsert = toDatabaseIrrigationInsert(recordData as any)
    const { data, error } = await supabase
      .from('irrigation_records')
      .insert(dbInsert as any)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return { success: false, error: 'Failed to create irrigation record' }
    }

    revalidatePath(`/farms/${recordData.farm_id}`)
    revalidatePath(`/farms/${recordData.farm_id}/logs`)

    return {
      success: true,
      data: toApplicationIrrigationRecord(data as any)
    }
  } catch (error) {
    console.error('Create irrigation record error:', error)
    return { success: false, error: 'Internal server error' }
  }
}

/**
 * Update an irrigation record
 */
export async function updateIrrigationRecord(recordId: number, updates: Partial<IrrigationRecord>) {
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
      .from('irrigation_records')
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

    const dbUpdate = toDatabaseIrrigationUpdate(updates as any)
    const { data, error } = await supabase
      .from('irrigation_records')
      .update(dbUpdate as any)
      .eq('id', recordId)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return { success: false, error: 'Failed to update irrigation record' }
    }

    revalidatePath(`/farms/${existing.farm_id}`)
    revalidatePath(`/farms/${existing.farm_id}/logs`)

    return {
      success: true,
      data: toApplicationIrrigationRecord(data as any)
    }
  } catch (error) {
    console.error('Update irrigation record error:', error)
    return { success: false, error: 'Internal server error' }
  }
}

/**
 * Delete an irrigation record
 */
export async function deleteIrrigationRecord(recordId: number) {
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
      .from('irrigation_records')
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

    const { error } = await supabase.from('irrigation_records').delete().eq('id', recordId)

    if (error) {
      console.error('Database error:', error)
      return { success: false, error: 'Failed to delete irrigation record' }
    }

    revalidatePath(`/farms/${existing.farm_id}`)
    revalidatePath(`/farms/${existing.farm_id}/logs`)

    return { success: true }
  } catch (error) {
    console.error('Delete irrigation record error:', error)
    return { success: false, error: 'Internal server error' }
  }
}

// ==================== SPRAY RECORDS ====================

/**
 * Create a new spray record
 */
export async function createSprayRecord(recordData: Omit<SprayRecord, 'id' | 'created_at'>) {
  try {
    const validation = validateAndSanitize(SpraySchema, {
      farm_id: recordData.farm_id,
      date: recordData.date,
      pest_disease: recordData.pest_disease,
      chemical: recordData.chemical,
      dose: recordData.dose,
      area: recordData.area,
      weather: recordData.weather,
      operator: recordData.operator,
      notes: recordData.notes
    })

    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        details: validation.errors
      }
    }

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

    const dbInsert = toDatabaseSprayInsert(recordData as any)
    const { data, error } = await supabase
      .from('spray_records')
      .insert(dbInsert as any)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return { success: false, error: 'Failed to create spray record' }
    }

    revalidatePath(`/farms/${recordData.farm_id}`)
    revalidatePath(`/farms/${recordData.farm_id}/logs`)

    return {
      success: true,
      data: toApplicationSprayRecord(data as any)
    }
  } catch (error) {
    console.error('Create spray record error:', error)
    return { success: false, error: 'Internal server error' }
  }
}

/**
 * Update a spray record
 */
export async function updateSprayRecord(recordId: number, updates: Partial<SprayRecord>) {
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
      .from('spray_records')
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

    const dbUpdate = toDatabaseSprayUpdate(updates as any)
    const { data, error } = await supabase
      .from('spray_records')
      .update(dbUpdate as any)
      .eq('id', recordId)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return { success: false, error: 'Failed to update spray record' }
    }

    revalidatePath(`/farms/${existing.farm_id}`)
    revalidatePath(`/farms/${existing.farm_id}/logs`)

    return {
      success: true,
      data: toApplicationSprayRecord(data as any)
    }
  } catch (error) {
    console.error('Update spray record error:', error)
    return { success: false, error: 'Internal server error' }
  }
}

/**
 * Delete a spray record
 */
export async function deleteSprayRecord(recordId: number) {
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
      .from('spray_records')
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

    const { error } = await supabase.from('spray_records').delete().eq('id', recordId)

    if (error) {
      console.error('Database error:', error)
      return { success: false, error: 'Failed to delete spray record' }
    }

    revalidatePath(`/farms/${existing.farm_id}`)
    revalidatePath(`/farms/${existing.farm_id}/logs`)

    return { success: true }
  } catch (error) {
    console.error('Delete spray record error:', error)
    return { success: false, error: 'Internal server error' }
  }
}

// ==================== HARVEST RECORDS ====================

/**
 * Create a new harvest record
 */
export async function createHarvestRecord(recordData: Omit<HarvestRecord, 'id' | 'created_at'>) {
  try {
    const validation = validateAndSanitize(HarvestSchema, recordData)

    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        details: validation.errors
      }
    }

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

    const dbInsert = toDatabaseHarvestInsert(recordData as any)
    const { data, error } = await supabase
      .from('harvest_records')
      .insert(dbInsert as any)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return { success: false, error: 'Failed to create harvest record' }
    }

    revalidatePath(`/farms/${recordData.farm_id}`)
    revalidatePath(`/farms/${recordData.farm_id}/logs`)

    return {
      success: true,
      data: toApplicationHarvestRecord(data as any)
    }
  } catch (error) {
    console.error('Create harvest record error:', error)
    return { success: false, error: 'Internal server error' }
  }
}

/**
 * Update a harvest record
 */
export async function updateHarvestRecord(recordId: number, updates: Partial<HarvestRecord>) {
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
      .from('harvest_records')
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

    const dbUpdate = toDatabaseHarvestUpdate(updates as any)
    const { data, error } = await supabase
      .from('harvest_records')
      .update(dbUpdate as any)
      .eq('id', recordId)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return { success: false, error: 'Failed to update harvest record' }
    }

    revalidatePath(`/farms/${existing.farm_id}`)
    revalidatePath(`/farms/${existing.farm_id}/logs`)

    return {
      success: true,
      data: toApplicationHarvestRecord(data as any)
    }
  } catch (error) {
    console.error('Update harvest record error:', error)
    return { success: false, error: 'Internal server error' }
  }
}

/**
 * Delete a harvest record
 */
export async function deleteHarvestRecord(recordId: number) {
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
      .from('harvest_records')
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

    const { error } = await supabase.from('harvest_records').delete().eq('id', recordId)

    if (error) {
      console.error('Database error:', error)
      return { success: false, error: 'Failed to delete harvest record' }
    }

    revalidatePath(`/farms/${existing.farm_id}`)
    revalidatePath(`/farms/${existing.farm_id}/logs`)

    return { success: true }
  } catch (error) {
    console.error('Delete harvest record error:', error)
    return { success: false, error: 'Internal server error' }
  }
}

// ==================== FERTIGATION RECORDS ====================

/**
 * Create a new fertigation record
 */
export async function createFertigationRecord(recordData: Omit<FertigationRecord, 'id' | 'created_at'>) {
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

    const dbInsert = toDatabaseFertigationInsert(recordData as any)
    const { data, error } = await supabase
      .from('fertigation_records')
      .insert(dbInsert as any)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return { success: false, error: 'Failed to create fertigation record' }
    }

    revalidatePath(`/farms/${recordData.farm_id}`)
    revalidatePath(`/farms/${recordData.farm_id}/logs`)

    return {
      success: true,
      data: toApplicationFertigationRecord(data as any)
    }
  } catch (error) {
    console.error('Create fertigation record error:', error)
    return { success: false, error: 'Internal server error' }
  }
}

/**
 * Update a fertigation record
 */
export async function updateFertigationRecord(recordId: number, updates: Partial<FertigationRecord>) {
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
      .from('fertigation_records')
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

    const dbUpdate = toDatabaseFertigationUpdate(updates as any)
    const { data, error } = await supabase
      .from('fertigation_records')
      .update(dbUpdate as any)
      .eq('id', recordId)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return { success: false, error: 'Failed to update fertigation record' }
    }

    revalidatePath(`/farms/${existing.farm_id}`)
    revalidatePath(`/farms/${existing.farm_id}/logs`)

    return {
      success: true,
      data: toApplicationFertigationRecord(data as any)
    }
  } catch (error) {
    console.error('Update fertigation record error:', error)
    return { success: false, error: 'Internal server error' }
  }
}

/**
 * Delete a fertigation record
 */
export async function deleteFertigationRecord(recordId: number) {
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
      .from('fertigation_records')
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

    const { error } = await supabase.from('fertigation_records').delete().eq('id', recordId)

    if (error) {
      console.error('Database error:', error)
      return { success: false, error: 'Failed to delete fertigation record' }
    }

    revalidatePath(`/farms/${existing.farm_id}`)
    revalidatePath(`/farms/${existing.farm_id}/logs`)

    return { success: true }
  } catch (error) {
    console.error('Delete fertigation record error:', error)
    return { success: false, error: 'Internal server error' }
  }
}

// ==================== EXPENSE RECORDS ====================

/**
 * Create a new expense record
 */
export async function createExpenseRecord(recordData: Omit<ExpenseRecord, 'id' | 'created_at'>) {
  try {
    const validation = validateAndSanitize(ExpenseSchema, recordData)

    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        details: validation.errors
      }
    }

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

    const dbInsert = toDatabaseExpenseInsert(recordData as any)
    const { data, error } = await supabase
      .from('expense_records')
      .insert(dbInsert as any)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return { success: false, error: 'Failed to create expense record' }
    }

    revalidatePath(`/farms/${recordData.farm_id}`)
    revalidatePath(`/farms/${recordData.farm_id}/logs`)

    return {
      success: true,
      data: toApplicationExpenseRecord(data as any)
    }
  } catch (error) {
    console.error('Create expense record error:', error)
    return { success: false, error: 'Internal server error' }
  }
}

/**
 * Update an expense record
 */
export async function updateExpenseRecord(recordId: number, updates: Partial<ExpenseRecord>) {
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
      .from('expense_records')
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

    const dbUpdate = toDatabaseExpenseUpdate(updates as any)
    const { data, error } = await supabase
      .from('expense_records')
      .update(dbUpdate as any)
      .eq('id', recordId)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return { success: false, error: 'Failed to update expense record' }
    }

    revalidatePath(`/farms/${existing.farm_id}`)
    revalidatePath(`/farms/${existing.farm_id}/logs`)

    return {
      success: true,
      data: toApplicationExpenseRecord(data as any)
    }
  } catch (error) {
    console.error('Update expense record error:', error)
    return { success: false, error: 'Internal server error' }
  }
}

/**
 * Delete an expense record
 */
export async function deleteExpenseRecord(recordId: number) {
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
      .from('expense_records')
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

    const { error } = await supabase.from('expense_records').delete().eq('id', recordId)

    if (error) {
      console.error('Database error:', error)
      return { success: false, error: 'Failed to delete expense record' }
    }

    revalidatePath(`/farms/${existing.farm_id}`)
    revalidatePath(`/farms/${existing.farm_id}/logs`)

    return { success: true }
  } catch (error) {
    console.error('Delete expense record error:', error)
    return { success: false, error: 'Internal server error' }
  }
}
