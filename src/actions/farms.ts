'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/auth-utils'
import { FarmSchema, validateAndSanitize } from '@/lib/validation'
import { toApplicationFarm, toDatabaseFarmInsert, toDatabaseFarmUpdate } from '@/lib/supabase-types'
import type { Farm } from '@/types/types'

/**
 * Create a new farm
 */
export async function createFarm(farmData: Omit<Farm, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) {
  try {
    // Validate and sanitize input
    const validation = validateAndSanitize(FarmSchema, {
      name: farmData.name,
      region: farmData.region,
      area: farmData.area,
      crop: farmData.crop,
      crop_variety: farmData.cropVariety,
      planting_date: farmData.plantingDate,
      vine_spacing: farmData.vineSpacing,
      row_spacing: farmData.rowSpacing,
      total_tank_capacity: farmData.totalTankCapacity,
      system_discharge: farmData.systemDischarge,
      latitude: farmData.latitude,
      longitude: farmData.longitude,
      elevation: farmData.elevation,
      location_name: farmData.locationName,
      timezone: farmData.timezone,
      location_source: farmData.locationSource,
      date_of_pruning: farmData.dateOfPruning
    })

    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        details: validation.errors
      }
    }

    const supabase = await createServerSupabaseClient()

    // Get the current authenticated user
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        success: false,
        error: 'Authentication required'
      }
    }

    // Prepare farm data for database
    const dbFarmData = toDatabaseFarmInsert({
      ...farmData,
      user_id: user.id
    } as any)

    const { data, error } = await supabase
      .from('farms')
      .insert(dbFarmData as any)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return {
        success: false,
        error: 'Failed to create farm'
      }
    }

    // Revalidate paths
    revalidatePath('/farms')
    revalidatePath('/dashboard')

    return {
      success: true,
      data: toApplicationFarm(data)
    }
  } catch (error) {
    console.error('Create farm error:', error)
    return {
      success: false,
      error: 'Internal server error'
    }
  }
}

/**
 * Update an existing farm
 */
export async function updateFarm(farmId: number, updates: Partial<Farm>) {
  try {
    const supabase = await createServerSupabaseClient()

    // Get the current authenticated user
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        success: false,
        error: 'Authentication required'
      }
    }

    // Verify farm ownership
    const { data: existingFarm, error: fetchError } = await supabase
      .from('farms')
      .select('user_id')
      .eq('id', farmId)
      .single()

    if (fetchError || !existingFarm) {
      return {
        success: false,
        error: 'Farm not found'
      }
    }

    if (existingFarm.user_id !== user.id) {
      return {
        success: false,
        error: 'Unauthorized'
      }
    }

    // Convert updates to database format
    const dbUpdates = toDatabaseFarmUpdate(updates)

    const { data, error } = await supabase
      .from('farms')
      .update(dbUpdates as any)
      .eq('id', farmId)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return {
        success: false,
        error: 'Failed to update farm'
      }
    }

    // Revalidate paths
    revalidatePath('/farms')
    revalidatePath(`/farms/${farmId}`)
    revalidatePath('/dashboard')

    return {
      success: true,
      data: toApplicationFarm(data)
    }
  } catch (error) {
    console.error('Update farm error:', error)
    return {
      success: false,
      error: 'Internal server error'
    }
  }
}

/**
 * Delete a farm
 */
export async function deleteFarm(farmId: number) {
  try {
    const supabase = await createServerSupabaseClient()

    // Get the current authenticated user
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        success: false,
        error: 'Authentication required'
      }
    }

    // Verify farm ownership
    const { data: existingFarm, error: fetchError } = await supabase
      .from('farms')
      .select('user_id')
      .eq('id', farmId)
      .single()

    if (fetchError || !existingFarm) {
      return {
        success: false,
        error: 'Farm not found'
      }
    }

    if (existingFarm.user_id !== user.id) {
      return {
        success: false,
        error: 'Unauthorized'
      }
    }

    const { error } = await supabase.from('farms').delete().eq('id', farmId)

    if (error) {
      console.error('Database error:', error)
      return {
        success: false,
        error: 'Failed to delete farm'
      }
    }

    // Revalidate paths
    revalidatePath('/farms')
    revalidatePath('/dashboard')

    return {
      success: true
    }
  } catch (error) {
    console.error('Delete farm error:', error)
    return {
      success: false,
      error: 'Internal server error'
    }
  }
}

/**
 * Get all farms for the authenticated user
 */
export async function getAllFarms() {
  try {
    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        success: false,
        error: 'Authentication required',
        data: []
      }
    }

    const { data, error } = await supabase
      .from('farms')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return {
        success: false,
        error: 'Failed to fetch farms',
        data: []
      }
    }

    return {
      success: true,
      data: (data || []).map(toApplicationFarm)
    }
  } catch (error) {
    console.error('Get farms error:', error)
    return {
      success: false,
      error: 'Internal server error',
      data: []
    }
  }
}

/**
 * Get a single farm by ID
 */
export async function getFarmById(farmId: number) {
  try {
    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        success: false,
        error: 'Authentication required',
        data: null
      }
    }

    const { data, error } = await supabase
      .from('farms')
      .select('*')
      .eq('id', farmId)
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: 'Farm not found',
          data: null
        }
      }
      console.error('Database error:', error)
      return {
        success: false,
        error: 'Failed to fetch farm',
        data: null
      }
    }

    return {
      success: true,
      data: toApplicationFarm(data)
    }
  } catch (error) {
    console.error('Get farm error:', error)
    return {
      success: false,
      error: 'Internal server error',
      data: null
    }
  }
}
