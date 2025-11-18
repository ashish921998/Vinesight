/**
 * DrizzleService - Example service layer using Drizzle ORM with Supabase
 *
 * This demonstrates the hybrid approach:
 * - Drizzle ORM for database queries (type-safe, better DX)
 * - Supabase client for auth (getUser, signIn, etc.)
 * - Keep RLS by filtering with user_id in queries
 *
 * You can gradually migrate methods from SupabaseService to this pattern.
 */

import { getDb, eq, and, desc, sql } from './db'
import { farms, irrigationRecords, sprayRecords, harvestRecords } from './db/schema'
import { getTypedSupabaseClient } from './supabase'

/**
 * Farm Operations using Drizzle ORM
 */
export class DrizzleService {
  // ==================== FARM OPERATIONS ====================

  /**
   * Get all farms for the authenticated user
   * Uses Supabase for auth, Drizzle for query
   */
  static async getAllFarms() {
    // Get current user from Supabase Auth
    const supabase = getTypedSupabaseClient()
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError) throw userError
    if (!user) throw new Error('User must be authenticated to fetch farms')

    // Use Drizzle for the query
    const db = getDb()
    const userFarms = await db
      .select()
      .from(farms)
      .where(eq(farms.userId, user.id))
      .orderBy(desc(farms.createdAt))

    return userFarms
  }

  /**
   * Get a single farm by ID
   * Includes user ownership check for security
   */
  static async getFarmById(farmId: number) {
    const supabase = getTypedSupabaseClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) throw new Error('User must be authenticated')

    const db = getDb()
    const [farm] = await db
      .select()
      .from(farms)
      .where(and(eq(farms.id, farmId), eq(farms.userId, user.id)))
      .limit(1)

    return farm || null
  }

  /**
   * Create a new farm
   */
  static async createFarm(farmData: {
    name: string
    location?: string
    area?: number
    grapeVariety?: string
    plantingDate?: string
    systemDischarge?: number
    soilType?: string
    irrigationSystem?: string
  }) {
    const supabase = getTypedSupabaseClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) throw new Error('User must be authenticated to create a farm')

    const db = getDb()
    const [newFarm] = await db
      .insert(farms)
      .values({
        userId: user.id,
        name: farmData.name,
        location: farmData.location,
        area: farmData.area,
        grapeVariety: farmData.grapeVariety,
        plantingDate: farmData.plantingDate,
        systemDischarge: farmData.systemDischarge,
        soilType: farmData.soilType,
        irrigationSystem: farmData.irrigationSystem
      })
      .returning()

    return newFarm
  }

  /**
   * Update a farm
   */
  static async updateFarm(
    farmId: number,
    updates: Partial<{
      name: string
      location: string
      area: number
      grapeVariety: string
      plantingDate: string
      dateOfPruning: string
      systemDischarge: number
      remainingWater: number
      waterCalculationUpdatedAt: string
      soilType: string
      irrigationSystem: string
    }>
  ) {
    const supabase = getTypedSupabaseClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) throw new Error('User must be authenticated')

    const db = getDb()
    const [updatedFarm] = await db
      .update(farms)
      .set({
        ...updates,
        updatedAt: new Date().toISOString()
      })
      .where(and(eq(farms.id, farmId), eq(farms.userId, user.id)))
      .returning()

    if (!updatedFarm) {
      throw new Error('Farm not found or you do not have permission to update it')
    }

    return updatedFarm
  }

  /**
   * Delete a farm
   */
  static async deleteFarm(farmId: number) {
    const supabase = getTypedSupabaseClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) throw new Error('User must be authenticated')

    const db = getDb()
    await db.delete(farms).where(and(eq(farms.id, farmId), eq(farms.userId, user.id)))
  }

  // ==================== IRRIGATION OPERATIONS ====================

  /**
   * Get irrigation records for a farm
   */
  static async getIrrigationRecords(farmId: number, limit?: number) {
    // Verify farm ownership
    await this.getFarmById(farmId)

    const db = getDb()
    let query = db
      .select()
      .from(irrigationRecords)
      .where(eq(irrigationRecords.farmId, farmId))
      .orderBy(desc(irrigationRecords.date))

    if (limit) {
      query = query.limit(limit) as any
    }

    return await query
  }

  /**
   * Add irrigation record
   */
  static async addIrrigationRecord(record: {
    farmId: number
    date: string
    duration: number
    area: number
    growthStage: string
    moistureStatus: string
    systemDischarge: number
    dateOfPruning?: string
    notes?: string
  }) {
    // Verify farm ownership
    await this.getFarmById(record.farmId)

    // Validations (same as SupabaseService)
    if (record.duration <= 0 || !isFinite(record.duration)) {
      throw new Error('Duration must be greater than 0')
    }
    if (record.duration > 24) {
      throw new Error('Duration cannot exceed 24 hours')
    }
    if (record.area <= 0 || !isFinite(record.area)) {
      throw new Error('Area must be greater than 0')
    }
    if (record.area > 25000) {
      throw new Error('Area cannot exceed 25,000 acres')
    }

    const db = getDb()
    const [newRecord] = await db
      .insert(irrigationRecords)
      .values({
        farmId: record.farmId,
        date: record.date,
        duration: record.duration,
        area: record.area,
        growthStage: record.growthStage,
        moistureStatus: record.moistureStatus,
        systemDischarge: record.systemDischarge,
        dateOfPruning: record.dateOfPruning,
        notes: record.notes
      })
      .returning()

    return newRecord
  }

  /**
   * Update irrigation record
   */
  static async updateIrrigationRecord(
    recordId: number,
    updates: Partial<{
      date: string
      duration: number
      area: number
      growthStage: string
      moistureStatus: string
      systemDischarge: number
      dateOfPruning: string
      notes: string
    }>
  ) {
    // Apply validations if fields are being updated
    if (updates.duration !== undefined) {
      if (updates.duration <= 0 || !isFinite(updates.duration)) {
        throw new Error('Duration must be greater than 0')
      }
      if (updates.duration > 24) {
        throw new Error('Duration cannot exceed 24 hours')
      }
    }

    const db = getDb()
    const [updatedRecord] = await db
      .update(irrigationRecords)
      .set(updates)
      .where(eq(irrigationRecords.id, recordId))
      .returning()

    if (!updatedRecord) {
      throw new Error('Irrigation record not found')
    }

    return updatedRecord
  }

  /**
   * Delete irrigation record
   */
  static async deleteIrrigationRecord(recordId: number) {
    const db = getDb()

    // Get the record first to update farm water level
    const [record] = await db
      .select()
      .from(irrigationRecords)
      .where(eq(irrigationRecords.id, recordId))
      .limit(1)

    if (!record) return

    // Delete the record
    await db.delete(irrigationRecords).where(eq(irrigationRecords.id, recordId))

    // Update farm water level (if needed)
    const farm = await this.getFarmById(record.farmId)
    if (farm) {
      const waterContribution = record.duration * record.systemDischarge
      const updatedWaterLevel = Math.max((farm.remainingWater || 0) - waterContribution, 0)

      await this.updateFarm(record.farmId, {
        remainingWater: updatedWaterLevel,
        waterCalculationUpdatedAt: new Date().toISOString()
      })
    }
  }

  // ==================== DASHBOARD SUMMARY ====================

  /**
   * Get dashboard summary with aggregated data
   * Demonstrates complex queries with Drizzle
   */
  static async getDashboardSummary(farmId: number) {
    // Verify farm ownership
    const farm = await this.getFarmById(farmId)
    if (!farm) throw new Error('Farm not found')

    const db = getDb()

    // Get recent irrigation records
    const recentIrrigations = await db
      .select()
      .from(irrigationRecords)
      .where(eq(irrigationRecords.farmId, farmId))
      .orderBy(desc(irrigationRecords.date))
      .limit(10)

    // Get total harvest using aggregation
    const [harvestTotal] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${harvestRecords.quantity}), 0)`
      })
      .from(harvestRecords)
      .where(eq(harvestRecords.farmId, farmId))

    // Get total water usage
    const [waterUsage] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${irrigationRecords.duration} * ${irrigationRecords.systemDischarge}), 0)`
      })
      .from(irrigationRecords)
      .where(eq(irrigationRecords.farmId, farmId))

    return {
      farm,
      recentIrrigations,
      totalHarvest: harvestTotal?.total || 0,
      totalWaterUsage: waterUsage?.total || 0
    }
  }

  // ==================== COMPLEX QUERIES EXAMPLE ====================

  /**
   * Get farms with their irrigation count
   * Demonstrates joins and aggregations
   */
  static async getFarmsWithIrrigationCount() {
    const supabase = getTypedSupabaseClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) throw new Error('User must be authenticated')

    const db = getDb()

    // Complex query with join and count
    const farmsWithCount = await db
      .select({
        id: farms.id,
        name: farms.name,
        location: farms.location,
        area: farms.area,
        irrigationCount: sql<number>`COUNT(${irrigationRecords.id})::int`
      })
      .from(farms)
      .leftJoin(irrigationRecords, eq(farms.id, irrigationRecords.farmId))
      .where(eq(farms.userId, user.id))
      .groupBy(farms.id)
      .orderBy(desc(farms.createdAt))

    return farmsWithCount
  }
}

// Export for backward compatibility and easy migration
export default DrizzleService
