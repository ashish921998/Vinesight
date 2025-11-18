/**
 * DRIZZLE + SUPABASE EXAMPLES
 *
 * This file shows practical examples of using Drizzle ORM with Supabase
 * in different Next.js contexts (Server Components, API Routes, Server Actions)
 */

// ============================================================================
// EXAMPLE 1: Next.js Server Component (App Router)
// ============================================================================

import { DrizzleService } from '@/lib/drizzle-service'
import { getTypedSupabaseClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'

export default async function FarmsPage() {
  // Check authentication with Supabase
  const supabase = getTypedSupabaseClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Use Drizzle service for data fetching
  const farms = await DrizzleService.getAllFarms()

  return (
    <div>
      <h1>My Farms</h1>
      {farms.map((farm) => (
        <div key={farm.id}>
          <h2>{farm.name}</h2>
          <p>Location: {farm.location}</p>
          <p>Area: {farm.area} acres</p>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// EXAMPLE 2: API Route (App Router)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { DrizzleService } from '@/lib/drizzle-service'

export async function GET(request: NextRequest) {
  // Check authentication
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Not needed for GET requests
        }
      }
    }
  )

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Use Drizzle for the query
    const farms = await DrizzleService.getAllFarms()
    return NextResponse.json({ farms })
  } catch (error) {
    console.error('Error fetching farms:', error)
    return NextResponse.json({ error: 'Failed to fetch farms' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Not needed for simple POST
        }
      }
    }
  )

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()

    // Use Drizzle to create farm
    const newFarm = await DrizzleService.createFarm({
      name: body.name,
      location: body.location,
      area: body.area,
      grapeVariety: body.grapeVariety
    })

    return NextResponse.json({ farm: newFarm }, { status: 201 })
  } catch (error) {
    console.error('Error creating farm:', error)
    return NextResponse.json({ error: 'Failed to create farm' }, { status: 500 })
  }
}

// ============================================================================
// EXAMPLE 3: Server Action (App Router)
// ============================================================================

'use server'

import { revalidatePath } from 'next/cache'
import { DrizzleService } from '@/lib/drizzle-service'
import { getTypedSupabaseClient } from '@/lib/supabase'

export async function createFarmAction(formData: FormData) {
  // Check authentication
  const supabase = getTypedSupabaseClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  try {
    const name = formData.get('name') as string
    const location = formData.get('location') as string
    const area = parseFloat(formData.get('area') as string)

    const newFarm = await DrizzleService.createFarm({
      name,
      location,
      area
    })

    // Revalidate the farms page
    revalidatePath('/farms')

    return { success: true, farm: newFarm }
  } catch (error) {
    console.error('Error creating farm:', error)
    return { error: 'Failed to create farm' }
  }
}

export async function addIrrigationRecordAction(farmId: number, data: any) {
  const supabase = getTypedSupabaseClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  try {
    const record = await DrizzleService.addIrrigationRecord({
      farmId,
      date: data.date,
      duration: data.duration,
      area: data.area,
      growthStage: data.growthStage,
      moistureStatus: data.moistureStatus,
      systemDischarge: data.systemDischarge,
      notes: data.notes
    })

    revalidatePath(`/farms/${farmId}`)
    return { success: true, record }
  } catch (error) {
    console.error('Error adding irrigation record:', error)
    return { error: error instanceof Error ? error.message : 'Failed to add record' }
  }
}

// ============================================================================
// EXAMPLE 4: Complex Query with Drizzle (Direct Usage)
// ============================================================================

import { getDb, eq, desc, sql, and } from '@/lib/db'
import { farms, irrigationRecords, harvestRecords } from '@/lib/db/schema'

export async function getFarmAnalytics(farmId: number) {
  const supabase = getTypedSupabaseClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const db = getDb()

  // Complex aggregation query
  const [analytics] = await db
    .select({
      farmName: farms.name,
      totalIrrigations: sql<number>`COUNT(DISTINCT ${irrigationRecords.id})::int`,
      totalWaterUsed: sql<number>`COALESCE(SUM(${irrigationRecords.duration} * ${irrigationRecords.systemDischarge}), 0)`,
      avgDuration: sql<number>`COALESCE(AVG(${irrigationRecords.duration}), 0)`,
      totalHarvest: sql<number>`COALESCE(SUM(${harvestRecords.quantity}), 0)`
    })
    .from(farms)
    .leftJoin(irrigationRecords, eq(farms.id, irrigationRecords.farmId))
    .leftJoin(harvestRecords, eq(farms.id, harvestRecords.farmId))
    .where(and(eq(farms.id, farmId), eq(farms.userId, user.id)))
    .groupBy(farms.id, farms.name)

  return analytics
}

// ============================================================================
// EXAMPLE 5: Real-time with Supabase + Drizzle Queries
// ============================================================================

'use client'

import { useEffect, useState } from 'react'
import { getTypedSupabaseClient } from '@/lib/supabase'
import { DrizzleService } from '@/lib/drizzle-service'

export function FarmsWithRealtime() {
  const [farms, setFarms] = useState<any[]>([])
  const supabase = getTypedSupabaseClient()

  useEffect(() => {
    // Initial load with Drizzle
    loadFarms()

    // Subscribe to changes with Supabase
    const channel = supabase
      .channel('farms-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'farms' }, (payload) => {
        console.log('Farm changed:', payload)
        // Reload farms with Drizzle when changes occur
        loadFarms()
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  async function loadFarms() {
    try {
      const data = await DrizzleService.getAllFarms()
      setFarms(data)
    } catch (error) {
      console.error('Error loading farms:', error)
    }
  }

  return (
    <div>
      {farms.map((farm) => (
        <div key={farm.id}>{farm.name}</div>
      ))}
    </div>
  )
}

// ============================================================================
// EXAMPLE 6: Transaction Example
// ============================================================================

import { getDb } from '@/lib/db'
import { farms, irrigationRecords } from '@/lib/db/schema'

export async function addIrrigationAndUpdateFarm(farmId: number, irrigationData: any) {
  const supabase = getTypedSupabaseClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const db = getDb()

  // Execute multiple operations in a transaction
  return await db.transaction(async (tx) => {
    // Add irrigation record
    const [record] = await tx
      .insert(irrigationRecords)
      .values({
        farmId,
        date: irrigationData.date,
        duration: irrigationData.duration,
        area: irrigationData.area,
        growthStage: irrigationData.growthStage,
        moistureStatus: irrigationData.moistureStatus,
        systemDischarge: irrigationData.systemDischarge
      })
      .returning()

    // Update farm water level
    const waterUsed = irrigationData.duration * irrigationData.systemDischarge
    const [updatedFarm] = await tx
      .update(farms)
      .set({
        remainingWater: sql`GREATEST(${farms.remainingWater} + ${waterUsed}, 0)`,
        waterCalculationUpdatedAt: new Date().toISOString()
      })
      .where(and(eq(farms.id, farmId), eq(farms.userId, user.id)))
      .returning()

    return { record, farm: updatedFarm }
  })
}

// ============================================================================
// EXAMPLE 7: Pagination Example
// ============================================================================

import { getDb, eq, desc } from '@/lib/db'
import { irrigationRecords } from '@/lib/db/schema'

export async function getIrrigationRecordsPaginated(
  farmId: number,
  page: number = 1,
  pageSize: number = 20
) {
  const supabase = getTypedSupabaseClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Verify farm ownership first
  const farm = await DrizzleService.getFarmById(farmId)
  if (!farm) {
    throw new Error('Farm not found')
  }

  const db = getDb()
  const offset = (page - 1) * pageSize

  // Get records with pagination
  const records = await db
    .select()
    .from(irrigationRecords)
    .where(eq(irrigationRecords.farmId, farmId))
    .orderBy(desc(irrigationRecords.date))
    .limit(pageSize)
    .offset(offset)

  // Get total count
  const [{ count }] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(irrigationRecords)
    .where(eq(irrigationRecords.farmId, farmId))

  return {
    records,
    pagination: {
      page,
      pageSize,
      totalRecords: count,
      totalPages: Math.ceil(count / pageSize)
    }
  }
}

// ============================================================================
// EXAMPLE 8: Search/Filter Example
// ============================================================================

import { getDb, eq, and, gte, lte, like, or } from '@/lib/db'
import { farms } from '@/lib/db/schema'

export async function searchFarms(filters: {
  query?: string
  minArea?: number
  maxArea?: number
  grapeVariety?: string
}) {
  const supabase = getTypedSupabaseClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const db = getDb()
  const conditions = [eq(farms.userId, user.id)]

  // Add search conditions
  if (filters.query) {
    conditions.push(
      or(
        like(farms.name, `%${filters.query}%`),
        like(farms.location, `%${filters.query}%`)
      ) as any
    )
  }

  if (filters.minArea !== undefined) {
    conditions.push(gte(farms.area, filters.minArea) as any)
  }

  if (filters.maxArea !== undefined) {
    conditions.push(lte(farms.area, filters.maxArea) as any)
  }

  if (filters.grapeVariety) {
    conditions.push(eq(farms.grapeVariety, filters.grapeVariety))
  }

  const results = await db
    .select()
    .from(farms)
    .where(and(...conditions))
    .orderBy(desc(farms.createdAt))

  return results
}
